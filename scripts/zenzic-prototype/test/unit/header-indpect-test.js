import HeaderInspect from '../../src/header-inspect';

describe('zenzic', () => {
  describe('make', () => {
    it('throws reference error', (done) => {
      const head = HeaderInspect.make();

      head.then(() => {
        done('should not succeed');
      }, (err) => {
        expect(err).to.be.instanceof(ReferenceError);
        expect(err.message).to.eql('undefined does not exist');
        done();
      });
    });
  });
});
