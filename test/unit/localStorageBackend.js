import {LocalStorageBackend} from '../../src/localStorageBackend'

export class MockStorage {
  constructor(data={}) {
    this.data = data
  }
  getItem(key) {
    return this.data[key]
  }
  setItem(key, val) {
    this.data[key] = val
  }
  removeItem(key) {
    delete this.data[key]
  }
}

describe('localstorage', () => {
  let storage, backend
  beforeEach(() => {
    storage = new MockStorage()
    backend = new LocalStorageBackend({localStorage: storage})
  })
  it('pushes, fetches, clears', done => {
    backend.fetch().then(res => {
      expect(res).to.deep.equal({empty: true})
      backend.push({count:11}).then(res => {
        backend.fetch().then(res => {
          expect(res.state).to.deep.equal({count: 11})
          backend.clear().then(res => {
            backend.fetch().then(res => {
              expect(res).to.deep.equal({empty: true})
              done()
            })
          })
        })
      })
    })
  })
})
