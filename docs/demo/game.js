// Here's our "game" - a counter and a button. No persistence code here.
//
// You might use angular/react/jquery to replace draw(), but we're doing this
// demo with no dependencies.

// The persistence layer is responsible for initializing gameState. Until then,
// show a loading screen.
var gameState = {loading: true};
function draw() {
  document.getElementById('gameState').innerText = JSON.stringify(gameState);
}
function clear() {
  if (gameState.loading) return;
  gameState = window.gameState = {count: 0};
  draw();
}
function incr() {
  if (gameState.loading) return;
  gameState.count += 1;
  draw();
}
function mult() {
  if (gameState.loading) return;
  gameState.count *= 2;
  draw();
}
draw();

// Most of our demos want to show the current time, so include that too.
function drawNow() {
  var elem = document.getElementById('now');
  if (elem) {
    elem.innerText = new Date().toString();
  }
}
setInterval(drawNow, 100);
