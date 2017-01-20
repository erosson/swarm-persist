import {PlayFab, PlayFabClientSDK} from 'playfab-sdk-browser'
import uuid from 'uuid'

if (global.window) {
  // expose playfab apis to user code, for login/signup
  window.PlayFabClientSDK = PlayFabClientSDK
  window.PlayFab = PlayFab
}

const defaultConfig = {
  localStorageKey: 'swarm-persist-playfab-state',
  localStorage: global.window && window.localStorage,
  stateKey: 'state',
  // try to refresh the login every 4 hours. Way more often than needed for a
  // 24 hour expiry, but it doesn't hurt.
  loginRefreshMillis: 4 * 60 * 60 * 1000,
}

class PlayFabBackendAuth {
  constructor(localStorage, key, titleId) {
    this.localStorage = localStorage
    this.key = key
    this.titleId = titleId
  }
  login(customId=this.auth.getRememberId()) {
    return new Promise((resolve, reject) => {
      PlayFabClientSDK.LoginWithCustomID({
        TitleId: this.titleId,
        CustomId: customId,
        CreateAccount: false,
        InfoRequestParameters: {
          GetUserData: true,
          GetUserAccountInfo: true,
        },
      }, (res, error) => {
        if (error) {
          return reject(error)
        }
        this.user = res
        //console.log('playfab login success')
        return resolve(res)
      })
    })
  }
  createAndRemember() {
    return new Promise((resolve, reject) => {
      this._createAndRemember(0, resolve, reject)
    })
  }
  _createAndRemember(iter=0, resolve, reject) {
    // no credentials. Create a new account.
    // We generate ids client-side. These act like userid+password; only need the
    // id to log in. But, since they're generated client-side, there's a remote
    // chance of duplicates. If we hit a duplicate, try again.
    // Hitting a dupe is actually pretty bad - someone evil could steal that
    // account. It's statistically unlikely to do that, though; ideally, we'll
    // never actually run this loop more than once.
    if (iter >= 10) {
      return reject('Failed to create new account')
    }
    let customId = uuid.v4()
    PlayFabClientSDK.LoginWithCustomID({
      TitleId: this.titleId,
      CustomId: customId,
      CreateAccount: true,
      InfoRequestParameters: {
        GetUserData: true,
        GetUserAccountInfo: true,
      },
    }, (res, error) => {
      if (error) {
        return reject(error)
      }
      if (res.data.NewlyCreated) {
        // we guessed an unused id. Yay! This is the common case.
        console.debug('created account with new id. iter '+iter)
        this.setRememberId(customId)
        this.user = res
        return resolve(res)
      }
      // we guessed a used id, try again. This should be uncommon.
      console.warn('tried creating new account with occupied id. Trying again: '+iter)
      return this._createAndRemember(iter + 1, resolve, reject)
    })
  }
  getRememberId() {
    const encoded = this.localStorage.getItem(this.key)
    return encoded ? JSON.parse(encoded).customId : null
  }
  setRememberId(customId) {
    this.localStorage.setItem(this.key, JSON.stringify({customId}))
  }
  clearRememberId() {
    this.localStorage.removeItem(this.key)
  }
  logout() {
    // Remove the custom id cookie, so we won't be logged in as this user upon page reload.
    this.clearRememberId()
    // Remove playfab's login data. There's no official method, but there's source code!
    // https://github.com/PlayFab/JavaScriptSDK/blob/master/PlayFabSDK/PlayFabClientApi.js
    PlayFab._internalSettings.sessionTicket = null
    if (PlayFabClientSDK.IsClientLoggedIn()) {
      console.error("couldn't log out from playfab")
    }
  }
  loginOrCreate() {
    const customId = this.getRememberId()
    if (customId) {
      return this.login(customId)
    }
    else {
      return this.createAndRemember()
    }
  }
}

export class PlayFabBackend {
  constructor(config) {
    this.config = Object.assign({}, defaultConfig, config)
    // it's too bad playfab forces this to be global
    PlayFab.settings.titleId = this.config.titleId
    this.auth = new PlayFabBackendAuth(this.config.localStorage, this.config.localStorageKey, this.config.titleId)
  }
  _parseFetchUserData(userdata={}) {
    // TODO chunking
    const container = userdata[this.config.stateKey]
    if (!container) {
      return {empty: true}
    }
    return {
      [this.config.stateKey]: JSON.parse(container.Value),
      lastUpdated: new Date(container.LastUpdated).getTime(),
    }
  }
  // https://api.playfab.com/Documentation/Client/method/LoginWithCustomID
  start() {
    // Login sessions expire after 24 hours:
    // https://community.playfab.com/idea/224/205582298-Session-ticket-expiry-Timestamp-.html
    //
    // Re-login to refresh the session periodically. CustomId logins are
    // invisible to the user, so there's no real cost.
    const relog = () => this.auth.login()
    this._loginRefresher = window.setInterval(relog, this.config.loginRefreshMillis)
    // login and fetch in one step
    return new Promise((resolve, reject) => {
      this.auth.loginOrCreate().then(res => {
        // login returns fetch data plus user account data
        let ret = this._parseFetchUserData(res.data.InfoResultPayload.UserData)
        ret.user = res.data.InfoResultPayload.AccountInfo
        resolve(ret)
      }, error => reject(error))
    })
  }
  logoutAndStop() {
    this.auth.logout()
    // logout without stopping doesn't make sense - you can't do anything with playfab while logged out.
    this.stop()
  }
  getRememberId() {
    this.auth.getRememberId()
  }
  setRememberId(customId) {
    this.auth.setRememberId(customId)
  }
  setRememberIdFromResponse(res) {
    const ret = res.data.InfoResultPayload.AccountInfo.CustomIdInfo.CustomId
    this.auth.setRememberId(ret)
    return ret
  }
  pullRememberId() {
    return new Promise((resolve, reject) => {
      PlayFabClientSDK.GetPlayerCombinedInfo({
        InfoRequestParameters: {GetUserAccountInfo: true},
      }, (res, error) => {
        if (error) {
          reject(error)
        }
        else {
          resolve(this.setRememberIdFromResponse(res))
        }
      })
    })
  }
  stop() {
    window.clearInterval(this._loginRefresher)
  }
  // https://api.playfab.com/Documentation/Client/method/GetUserData
  fetch() {
    return new Promise((resolve, reject) => {
      PlayFabClientSDK.GetUserData({}, (res, error) => {
        if (error) {
          reject(error)
        }
        else {
          resolve(this._parseFetchUserData(res.data.Data))
        }
      })
    })
  }
  lastPush(state) {
    // Send the last push synchronously. Pushing during page unload is tricky -
    // async XHRs fail in unload handlers, so normally, save-on-close doesn't.
    // Synchronous requests block the UI for a moment, but usually succeed.
    // UI blocking is awful, but saving the game on close is just that important.
    // 
    // PlayFab's API is pretty uncooperative here. We can't officially configure
    // its calls to be synchronous, but we can monkeypatch XMLHTTPRequest.
    // We're manipulating the XMLHttpRequest.open in this file, ExecuteRequest():
    // https://github.com/PlayFab/JavaScriptSDK/blob/master/PlayFabSDK/PlayFabClientApi.js
    //
    // sendBeacon() would be better - no UI block. It's much harder to patch in to
    // PlayFab's API though, and browser support is less common. Maybe later, but 
    // this is a fine start.
    // https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon
    const fn = window.XMLHttpRequest.prototype.open
    window.XMLHttpRequest.prototype.open = function(method, url, async) {
      console.log('hijacked xmlhttprequest.open, sync calls only')
      return fn.call(this, method, url, false)
    }
    // clean up after myself, both for success and error.
    // Maybe not necessary since the page is closing, but it's a good habit.
    const cleanup = res => {
      window.XMLHttpRequest.prototype.open = fn
      console.log('un-hijacked xmlhttprequest.open, async allowed again')
      return res
    }
    return this.push(state).then(cleanup, cleanup)
  }
  // https://api.playfab.com/Documentation/Client/method/UpdateUserData
  push(state) {
    // localstorage is synchronous and doesn't really need promises, but other backends need them
    return new Promise((resolve, reject) => {
      PlayFabClientSDK.UpdateUserData({Data: {[this.config.stateKey]: JSON.stringify(state)}}, (res, error) => {
        if (error) {
          reject(error)
        }
        else {
          resolve({state, res})
        }
      })
    })
  }
  // https://api.playfab.com/Documentation/Client/method/UpdateUserData
  clear() {
    return new Promise((resolve, reject) => {
      PlayFabClientSDK.UpdateUserData({KeysToRemove: [this.config.stateKey]}, (res, error) => {
        if (error) {
          reject(error)
        }
        else {
          resolve({res})
        }
      })
    })
  }
}
