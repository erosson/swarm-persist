import encoder from './encoder'
import {LocalStorageBackend} from './localStorageBackend'
import {Scheduler} from './scheduler'
import {assert} from './assert'

const defaultConfig = {
  encoder,
  Scheduler,
  backend: new LocalStorageBackend(),
  onFetch: function(){},
  onPull: function(){},
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
    this.scheduler = new this.config.Scheduler(Object.assign({}, this.config, {persister: this}))
  }

  isStarted() { return this.scheduler.isStarted() }
  stop() {
    this.scheduler.stop()
    if (this.config.backend.stop) {
      return this.config.backend.stop()
    }
  }
  start() {
    const afterPull = fetched => {
      this.scheduler.start()
      return fetched
    }
    if (this.config.backend.start) {
      // start() is expected to fetch, to support fetch-and-login in one request.
      return this.config.backend.start().then(fetched => {
        this._pull(fetched)
        return afterPull(fetched)
      })
    }
    else {
      return this.pull().then(afterPull)
    }
  }

  fetch() {
    const promise = this.config.backend.fetch()
    this.config.onFetch(promise)
    return promise
  }
  _pull({state, empty}) {
    assert(empty || (state !== undefined), 'a persister fetch returned an undefined but nonempty state')
    if (empty) {
      // we're looking at a new player - reset their state
      state = this.config.initState()
    }
    this.config.setState(state)
    assert(this.config.getState() !== undefined, 'persister.initState() is required')
  }
  pull() {
    const promise = this.config.backend.fetch()
    promise.then(fetched => {
      this._pull(fetched)
      return fetched
    })
    this.config.onPull(promise)
    return promise
  }
  push() {
    const ret = this.config.backend.push(this.config.getState())
    this.config.onPush(ret)
    return ret
  }
  // some backends handle the last push, during page unload, differently
  _lastPush() {
    const pushFn = this.config.backend.lastPush || this.config.backend.push
    const ret = pushFn.call(this.config.backend, this.config.getState())
    this.config.onPush(ret)
    return ret
  }
  clearRemote() {
    const ret = this.config.backend.clear()
    this.config.onClear(ret)
    return ret
  }
  clear() {
    // clear both pushes (backend.clear()) and pulls (setState(initState)).
    // Note that there's no need to wait for the push to finish before
    // clearing the local state - worst case is that the clear fails; either it
    // gets overwritten in a later push anyway, or the player pushes nothing
    // and comes back later to their old save, no biggie.
    this.config.setState(this.config.initState())
    return this.clearRemote()
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
