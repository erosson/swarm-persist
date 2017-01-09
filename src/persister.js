import encoder from './encoder'
import localStorageBackend from './localStorageBackend'
import {Scheduler} from './scheduler'
import {assert} from './assert'

const defaultConfig = {
  encoder,
  Scheduler,
  backend: localStorageBackend,
  onFetch: function(){},
  onPush: function(){},
  onClear: function(){},
  // getState: required
  // setState: required

  // initState is documented as required, but it's actually not. setState with
  // a default is acceptable instead, because that's a nicer way to do things
  // when there's es6 support. It matches redux too. Example:
  // function setState(state={count: 0}) { ... }
  initState: function(){},
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
    promise.then(({state, empty}) => {
      assert(empty || (state !== undefined), 'a persister fetch returned an undefined but nonempty state')
      if (empty) {
        // we're looking at a new player - reset
        state = this.config.initState()
      }
      this.config.setState(state)
      assert(this.config.getState() !== undefined, 'persister.initState() is required')
    })
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