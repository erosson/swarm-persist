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
  it('handles playfabified decodes', () => {
    let chunker = new Chunker(2)
    expect(chunker.decode({state: {Value: 'ab'}}).state).to.equal('ab')
    expect(chunker.decode({state: {Value: 'ab'}, state1: {Value: 'cd'}, state2: {Value: 'e'}}).state).to.equal('abcde')
  })
  it('has expected keys', () => {
    expect(chunker.keys()).to.deep.equal(['state', 'state1', 'state2', 'state3', 'state4', 'state5', 'state6', 'state7', 'state8', 'state9'])
  })
})
