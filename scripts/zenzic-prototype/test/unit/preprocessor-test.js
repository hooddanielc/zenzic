import Preprocesser from '../../src/preprocessor';
import path from 'path';

describe('Preprocessor', () => {
  describe('make', () => {
    const make = (args) => {
      return Preprocesser.make(args);
    };

    it('throws if path not specified', () => {
      return expect(make()).to.be.rejectedWith(
        ReferenceError, '`opts.path` property required'
      );
    });

    it('throws if path does not exist', () => {
      const no = path.join(__dirname, 'asdfgh.h');

      return expect(make({
        path: no
      })).to.be.rejectedWith(
        ReferenceError,
        no + ' does not exist'
      );
    });
  });
});
