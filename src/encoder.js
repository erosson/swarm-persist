import lzString from 'lz-string'

// Encode JSON state for import/export. Should not be human readable. No side effects.
// http://pieroxy.net/blog/pages/lz-string/guide.html
export class Encoder {
  encode(json) {
    return lzString.compressToUTF16(JSON.stringify(json))
  }
  decode(encoded) {
    return JSON.parse(lzString.decompressFromUTF16(encoded))
  }
}

export default new Encoder()
