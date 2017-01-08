import mapValues from 'lodash/mapValues'
import chunk from 'lodash/chunk'
import zipObject from 'lodash/zipObject'

// https://developer.playfab.com/en-us/F810/limits
// Playfab has a size limit of 10k bytes per key. Swarmsim's passed that before. We can update 10 keys per push for a limit of 100k, which is enough.
export class Chunker {
  constructor(chunkSize=10000, maxChunks=10, prefix='state') {
    this.chunkSize = chunkSize
    this.maxChunks = maxChunks
    this.prefix = prefix
  }
  // encode and decode are not symmetric! They match Playfab's (asymmetric) api:
  // encode returns/set accepts {foo: 'bar'}, but decode accepts/get returns {foo: {Value: 'bar'}}
  // _normalize() removes the {Value:} layer.
  // `encode()` and `_decode()` (not `decode()`) are symmetric.
  _normalize(data) {
    return mapValues(data, (v) => v.Value)
  }
  _denormalize(data) {
    return mapValues(data, (v) => {Value: v})
  }
  encode(string) {
    let chunks = chunk(string, this.chunkSize).map(c => c.join(''))
    return zipObject(this.keys(), chunks)
  }
  decode(vdata) {
    return this._decode(this._normalize(vdata))
  }
  _decode(data) {
    return this.keys().map(key => data[key]).filter(c => !!c).join('')
  }
  keys() {
    let ret = Array(this.maxChunks).fill().map((_, i) => this.prefix + i)
    // special-case the first key: common case is only one key
    ret[0] = this.prefix
    return ret
  }
}
export default new Chunker()
