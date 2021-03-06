import $ from 'jquery'
import {assert} from './assert'

const defaultConfig = {
  intervalMillis: 5 * 60 * 1000,
  pushOnInterval: true,
  pushOnClose: true,
  // persister
}

export class Scheduler {
  constructor(config) {
    this.config = Object.assign({}, defaultConfig, config)
    this._push = () => {
      return this.config.persister.push()
    }
    this._lastPush = () => {
      return this.config.persister._lastPush()
    }
  }
  isStarted() {
    return !!this.runner
  }
  start() {
    assert(!this.isStarted(), 'persist scheduler already started')
    this.runner = {}
    
    if (this.config.pushOnInterval) {
      this.runner.interval = window.setInterval(this._push, this.config.intervalMillis)
    }
    if (this.config.pushOnClose) {
      $(window).on('unload', this._lastPush)
    }
    assert(this.isStarted())
  }
  stop() {
    assert(this.isStarted(), 'persist scheduler already stopped (or never started)')
    if (this.config.pushOnInterval) {
      window.clearInterval(this.runner.interval)
    }
    if (this.config.pushOnClose) {
      $(window).off('unload', this._lastPush)
    }
    delete this.runner
    assert(!this.isStarted())
  }
}
