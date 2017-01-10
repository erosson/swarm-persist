// All the swarm-persist code needed to keep localstorage updated.
var persister = new persist.Persister({
  // initState/getState/setState are the only required properties.
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
  backend: new persist.PlayFabBackend({titleId: '9F7C'}),
  // How often we push to playfab.
  intervalMillis: 60 * 1000,
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
  onInit: function(promise) {
  },
});
persister.start().then(function(){
  console.log('started', persister.config.backend.auth.user);
});

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
