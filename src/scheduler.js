import $ from 'jquery'
import {assert} from './assert'

const defaultConfig = {
  intervalMillis: 5 * 60 * 1000,
  pushOnInterval: true,
  pushOnClose: true,
  pullOnLoad: true,
  // persister
}

export class Scheduler {
  constructor(config) {
    this.config = Object.assign({}, defaultConfig, config)
    this._push = () => {
      return this.config.persister.push()
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
      $(window).on('unload', this._push)
    }
    if (this.config.pullOnLoad) {
      this.config.persister.pull()
    }
    assert(this.isStarted())
  }
  stop() {
    assert(this.isStarted(), 'persist scheduler already stopped (or never started)')
    if (this.config.pushOnInterval) {
      window.clearInterval(this.runner.interval)
    }
    if (this.config.pushOnClose) {
      $(window).off('unload', this._push)
    }
    delete this.runner
    assert(!this.isStarted())
  }
}
