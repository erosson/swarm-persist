// Encode JSON state for import/export. Should not be human readable. No side effects.
// TODO: lz-string for compression
export class Encoder {
  encode(json) {
    return btoa(JSON.stringify(json))
  }
  decode(encoded) {
    return JSON.parse(atob(encoded))
  }
}

export default new Encoder()
