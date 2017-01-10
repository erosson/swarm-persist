import {PlayFab, PlayFabClientSDK} from 'playfab-sdk-browser'
import uuid from 'uuid'

const defaultConfig = {
  localStorageKey: 'swarm-persist-playfab-state',
  localStorage: global.window && window.localStorage,
  stateKey: 'state',
}

class PlayFabBackendAuth {
  constructor(localStorage, key, titleId) {
    this.localStorage = localStorage
    this.key = key
    this.titleId = titleId
  }
  login(customId) {
    // we already have login credentials - login, easy
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
        this.pushAuth(customId)
        this.user = res
        return resolve(res)
      }
      // we guessed a used id, try again. This should be uncommon.
      console.warn('tried creating new account with occupied id. Trying again: '+iter)
      return this._createAndRemember(iter + 1, resolve, reject)
    })
  }
  fetchAuth() {
    const encoded = this.localStorage.getItem(this.key)
    return encoded ? JSON.parse(encoded).customId : null
  }
  pushAuth(customId) {
    this.localStorage.setItem(this.key, JSON.stringify({customId}))
  }
  clearAuth() {
    this.localStorage.removeItem(this.key)
  }
  loginOrCreate() {
    const customId = this.fetchAuth()
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
    // TODO configurable key/prefix
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
          resolve({state, res})
        }
      })
    })
  }
}
