import zenzic from '../../src/zenzic';

describe('zenzic', () => {
  describe('version', () => {
    it('uses correct verison', () => {
      expect(zenzic.version()).to.eql('0.0.1');
    });
  });
});
