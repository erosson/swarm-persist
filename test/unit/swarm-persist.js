import persist from '../../src/main'

describe('persist', () => {
  xdescribe('Greet function', () => {
    beforeEach(() => {
      spy(persist, 'greet');
      persist.greet();
    });

    it('should have been run once', () => {
      expect(persist.greet).to.have.been.calledOnce;
    });

    it('should have always returned hello', () => {
      expect(persist.greet).to.have.always.returned('hello');
    });
  });
});
