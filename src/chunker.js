import mapValues from 'lodash/mapValues'

// https://developer.playfab.com/en-us/F810/limits
// Playfab has a size limit of 10k bytes per key. Swarmsim's passed that before. We can update 10 keys per push for a limit of 100k, which is enough.
export class Chunker {
  constructor(chunkSize=10000, maxChunks=10) {
    this.chunkSize = chunkSize
    this.maxChunks = maxChunks
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
    return {state: string}
  }
  decode(vdata) {
    return this._decode(this._normalize(data))
  }
  _decode(data) {
    return data.state
  }
}
export default new Chunker()
