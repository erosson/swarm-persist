// All the swarm-persist code needed to keep localstorage updated.
var persister = new persist.Persister({
  // initState/getState/setState are the only required properties.
  // They're identical to the localStorage version.
  initState: function() {
    return {count: 0};
  },
  getState: function() {
    return window.gameState;
  },
  setState: function(state) {
    window.gameState = state;
    draw();
  },
  // Playfab configuration.
  backend: new persist.PlayFabBackend({
    titleId: '9F7C',
  }),
  // How often we push to playfab.
  intervalMillis: 10 * 1000,
  // onPush(), onFetch(), onClear() are optional, but allow for error handling
  // and push status updates.
  onPush: function(promise) {
    console.log('push starting...')
    promise.then(function(pushed) {
      console.log('push success', pushed)
      document.getElementById('lastPushed').innerText = new Date().toString();
    }, function(error) {
      console.error('push error', error)
    });
  },
  onFetch: function(promise) {
    console.log('fetch starting...')
    promise.then(function(fetched) {
      console.log('fetch success', fetched)
    }, function(error) {
      console.error('fetch error', error)
    });
  },
  onClear: function(promise) {
    console.log('clear starting...')
    promise.then(function(pushed) {
      console.log('clear success', pushed)
      document.getElementById('lastPushed').innerText = new Date().toString();
    }, function(error) {
      console.error('clear error', error)
    });
  },
});

function onStart(res) {
  console.log('started', res)
  document.getElementById('playFabId').innerText = res.user.PlayFabId
  document.getElementById('userLink').href = 'https://developer.playfab.com/en-us/'+persister.config.backend.config.titleId+'/players/'+res.user.PlayFabId+'/data'
  if (res.user.CustomIdInfo) {
    document.getElementById('customId').innerText = res.user.CustomIdInfo.CustomId
  }
  if (res.user.PrivateInfo && res.user.PrivateInfo.Email) {
    document.getElementById('email').innerText = res.user.PrivateInfo.Email
  }
}
// Can't use persist.start() if we're waiting on start(). new Persister().start() returns the promise
persister.start().then(onStart)

// The onclick handler for the "persist now" button.
// You could call `persister.push()` anywhere you like to push manually -
// ex. every time game state changes, or when the user clicks.
function push() {
  persister.push();
}
function fetch() {
  persister.fetch();
}
function clear() {
  if (persister.isStarted()) {
    persister.stop();
    document.getElementById('toggleStart').innerText = 'resume'
  }
  persister.clear().then(function() { persister.pull(); });
}
function toggleStart() {
  if (persister.isStarted()) {
    persister.stop()
    document.getElementById('toggleStart').innerText = 'resume'
  }
  else {
    persister.start()
    document.getElementById('toggleStart').innerText = 'pause'
  }
}
// Signup and login are pure PlayFab. The only swarm-persist code is a pull() -
// once logged in, load the user's data. PlayFab logins are global scope.
function signup(form) {
  console.log(form.username.value, form.email.value, form.password.value, form.password2.value);
  // https://api.playfab.com/Documentation/Client/method/AddUsernamePassword
  PlayFabClientSDK.AddUsernamePassword({
    Username: form.username.value,
    Email: form.email.value,
    Password: form.password.value,
  }, (res, error) => {
    if (error) {
      console.error(error)
    }
    else {
      document.getElementById('email').innerText = form.email.value
    }
  })
}
function login(form) {
  console.log(form.email.value, form.password.value);
  PlayFabClientSDK.LoginWithEmailAddress({
    Email: form.email.value,
    Password: form.password.value,
    // this is important to remember the login next time
    InfoRequestParameters: {GetUserAccountInfo: true},
  }, (res, error) => {
    if (error) {
      console.error(error)
    }
    else {
      document.getElementById('playFabId').innerText = res.data.PlayFabId
      document.getElementById('customId').innerText = res.data.InfoResultPayload.AccountInfo.CustomIdInfo.CustomId
      document.getElementById('email').innerText = form.email.value
      // remember this login for next time
      persister.config.backend.rememberLogin(res.data.InfoResultPayload.AccountInfo.CustomIdInfo.CustomId)
    }
  })
}
function logout() {
  persister.stop()
  persister.config.backend.logoutAndStop()
  persister.start().then(onStart)
}
