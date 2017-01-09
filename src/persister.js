import encoder from './encoder'
import localStorageBackend from './localStorageBackend'
import {Scheduler} from './scheduler'

const defaultConfig = {
  encoder,
  Scheduler,
  backend: localStorageBackend,
  onFetch: function(){},
  onPush: function(){},
  onClear: function(){},
}

export class Persister {
  constructor(config) {
    this.config = Object.assign({}, defaultConfig, config)
    this.scheduler = new this.config.Scheduler(Object.assign({}, config, {persister: this}))
  }

  isStarted() { return this.scheduler.isStarted() }
  start() { return this.scheduler.start() }
  stop() { return this.scheduler.stop() }

  fetch() {
    const promise = this.config.backend.fetch()
    this.config.onFetch(promise)
    return promise
  }
  pull() {
    const promise = this.config.backend.fetch()
    promise.then(res => this.config.setState(res.state))
    return promise
  }
  push() {
    const ret = this.config.backend.push(this.config.getState())
    this.config.onPush(ret)
    return ret
  }
  clear() {
    const ret = this.config.backend.clear()
    this.config.onClear(ret)
    return ret
  }
  export() {
    return this.config.encoder.encode(this.config.getState())
  }
  import(encoded) {
    this.config.setState(this.config.encoder.decode(encoded))
  }
}

export function start(config) {
  const ret = new Persister(config)
  ret.start()
  return ret
}
