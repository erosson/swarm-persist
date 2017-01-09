# swarm-persist

Periodically save game state/JSON data to one of several backends. Supports online saves with guest users/no-signin. Designed for incremental games like [Swarm Simulator](https://swarmsim.github.io).

[![Travis build status](http://img.shields.io/travis/erosson/swarm-persist.svg?style=flat)](https://travis-ci.org/erosson/swarm-persist)
[![Code Climate](https://codeclimate.com/github/erosson/swarm-persist/badges/gpa.svg)](https://codeclimate.com/github/erosson/swarm-persist)
[![Test Coverage](https://codeclimate.com/github/erosson/swarm-persist/badges/coverage.svg)](https://codeclimate.com/github/erosson/swarm-persist)
[![Dependency Status](https://david-dm.org/erosson/swarm-persist.svg)](https://david-dm.org/erosson/swarm-persist)
[![devDependency Status](https://david-dm.org/erosson/swarm-persist/dev-status.svg)](https://david-dm.org/erosson/swarm-persist#info=devDependencies)

## Usage

### Automatic save/load

You provide functions that initialize, get, and set the state of your game. The state must be a pure JSON object - no functions, Dates, or other classes; nothing that `JSON.stringify()` would miss.

    window.gameState = {loading: true};
    function initState() {
      return {count: 0};
    }
    function getState() {
      return window.gameState;
    }
    function setState(state) {
      window.gameState = state;
    }
    var persister = persist.start({initState: initState, getState: getState, setState: setState});

Swarm-persist will now handle saving and loading your game in `localStorage`:
* Save the player's game every 5 minutes (configurable)
* Try to save the player's game when the window is closed
* Load the player's saved game when the page is reloaded - that is, just after `persist.init()` runs

Wait a few minutes (or call `persister.save()` by hand), then check that it's working:

    persister.key
    // => "swarm-persist-state"
    !!window.localStorage.get(persister.key)
    // => true
    persister.lastUpdated().toString()
    // => "Sun Jan 08 2017 18:53:37 GMT-0800"
    persister.lastUpdated().fromNow()
    // => "a few seconds ago"

Import/export a saved game as a string:

    var exported = persister.export()
    // => "eyJjb3VudCI6MX0="
    persister.import(exported)

### PlayFab and online saves

Instead of `localStorage`, you can use PlayFab as a free backend for online saves/cloud saves. Sign up on [playfab.com](https://playfab.com/) and get a title id:

    <script src="//download.playfab.com/PlayFabClientApi.js"></script>

    var playfab = persist.PlayFabBackend({titleId: '5h1t'})   // replace with your titleid
    var persister = persist.init({initState: initState, getState: getState, setState: setState, backend: playfab})

Swarm-persist will automatically create guest accounts on PlayFab for users who haven't signed in yet:

    !!playfab.auth.playFabId
    // => true
    !!playfab.auth.customId
    // => true
    !!playfab.auth.email
    // => false

Guests are implemented using PlayFab's [custom id login](https://api.playfab.com/Documentation/Client/method/LoginWithCustomID), and remembered across page loads using `localStorage`:

    playfab.localStorageKey
    // => "swarm-persist-playfab-credentials"
    localStorage.getItem(playfab.localStorageKey)
    // => true

Upgrade guest accounts once a user signs in (you'll need to build your game's signup/login UI on your own):

// TODO: rework this to support any of playfab's numerous login methods. swarm-persist needs to handle login (instead of raw playfab) to get customId for remember-me functionality, and fetching game state from playfab in the same login request.

    var id = playfab.auth.playFabId
    playfab.emailSignup({email: "swarm-persist-test@mailinator.com", password: "testtest"})
    playfab.emailLogin({email: "swarm-persist-test@mailinator.com", password: "testtest"})
    !!playfab.auth.email
    // => true
    id === playfab.auth.playFabId
    // => true

[Kongregate login](https://docs.kongregate.com/docs/javascript-api) is also supported:

    <script src="//cdn1.kongregate.com/javascripts/kongregate_api.js"></script>

    kongregateAPI.loadAPI(function() {
      var api = kongregateAPI.getAPI();
      if (!api.services.isGuest()) {
        playfab.kongregateLogin(api.services.getUserId(), api.services.getGameAuthToken())
      }
    })

## Getting started

    <script src="//cdn.rawgit.com/erosson/swarm-persist/master/dist/swarm-persist.js"></script>

or

    bower install --save swarm-persist

or

    npm install --save swarm-persist

    const persist = require('swarm-persist')

TODO: full api docs

## Related work

Based on Swarm Simulator's bignum:
* https://github.com/swarmsim/swarm/blob/master/app/scripts/filters/bignum.coffee
* https://github.com/swarmsim/swarm/blob/master/test/spec/filters/bignum.coffee

Project template: https://github.com/babel/generator-babel-boilerplate

## License

MIT - use this anywhere. I'd like it if you open-sourced any changes you make to this library (send a pull request? Github fork?), but it's not required.
