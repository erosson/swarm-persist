// The minimum code needed to get swarm-persist working with localstorage.
var persister = persist.start({
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
});
