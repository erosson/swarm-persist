import chunker, {Chunker} from '../../src/chunker'
import * as persist from '../../src/main'

describe('chunker', () => {
  it('handles a single chunk', () => {
    expect(chunker._decode(chunker.encode('abcde'))).to.equal('abcde')
    expect(chunker.encode('abcde').state).to.equal('abcde')
  })
  it('handles multiple chunks', () => {
    let chunker = new Chunker(2)
    expect(chunker._decode(chunker.encode('abcde'))).to.equal('abcde')
    expect(chunker.encode('abcde').state).to.equal('ab')
    expect(chunker.encode('abcde').state1).to.equal('cd')
    expect(chunker.encode('abcde').state2).to.equal('e')
  })
})
