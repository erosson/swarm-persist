import encoder from './encoder'

const defaultConfig = {
  key: 'swarm-persist-state',
  localStorage: global.window && window.localStorage,
  encoder,
}

export class LocalStorageBackend {
  constructor(config) {
    this.config = Object.assign({}, defaultConfig, config)
  }
  fetch() {
    // localstorage is synchronous and doesn't really need promises, but other backends need them
    return new Promise((resolve, reject) => {
      const encoded = this.config.localStorage.getItem(this.config.key)
      if (encoded === null || encoded === undefined) {
        return resolve({empty: true})
      }
      const ret = this.config.encoder.decode(encoded)
      ret.encoded = encoded
      return resolve(ret)
    })
  }
  push(state, lastUpdated=Date.now()) {
    // localstorage is synchronous and doesn't really need promises, but other backends need them
    return new Promise((resolve, reject) => {
      const ret = {state, lastUpdated}
      const encoded = this.config.encoder.encode(ret)
      this.config.localStorage.setItem(this.config.key, encoded)
      ret.encoded = encoded
      return resolve(ret)
    })
  }
  clear(lastUpdated=Date.now()) {
    return new Promise((resolve, reject) => {
      this.config.localStorage.removeItem(this.config.key)
      resolve({lastUpdated})
    })
  }
}

export default new LocalStorageBackend()
