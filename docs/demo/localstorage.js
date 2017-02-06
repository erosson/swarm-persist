// All the swarm-persist code needed to keep localstorage updated.
var persister = persist.start({
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
  // How often we push to localstorage. Default is slower, but a faster interval
  // of 10 seconds is convenient for this demo.
  intervalMillis: 10 * 1000,
  // Save to a different localstorage field. (Avoids conflict with barebones demo, too.)
  key: 'swarm-persist-localstorage-demo',
  // onPush(), onFetch(), onClear() are optional, but allow for error handling
  // and push status updates.
  onPush: function(promise) {
    console.log('push starting...')
    promise.then(function(pushed) {
      console.log('push success', pushed)
      document.getElementById('lastPushed').innerText = new Date(pushed.lastUpdated).toString();
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
      document.getElementById('lastPushed').innerText = new Date(pushed.lastUpdated).toString();
    }, function(error) {
      console.error('clear error', error)
    });
  },
});

// The onclick handler for the "persist now" button.
// You could call `persister.push()` anywhere you like to push manually -
// ex. every time game state changes, or when the user clicks.
function push() {
  persister.push();
}
function clear() {
  if (persister.isStarted()) {
    persister.stop();
    document.getElementById('toggleStart').innerText = 'resume'
  }
  persister.clear();
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
