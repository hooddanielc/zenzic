import Preprocesser from '../../src/preprocessor';
import path from 'path';

describe('Preprocessor', () => {
  const helloWorld = path.join(__dirname, '..', 'fixtures', 'hello-world', 'main.cc');

  const make = (args) => {
    return Preprocesser.make(args);
  };

  describe('make', () => {
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

  it('filters files under root path', () => {
    return make({ path: helloWorld }).then((res) => {
      const result = res.filterProjectPaths([
        '/tmp/asdf',
        '/tmp/asdff',
        path.join(res.root, 'cute', 'kitty.cc'),
        path.join(res.root, 'cute', 'kitty.h')
      ]);

      expect(result).to.deep.eql([
        path.join(res.root, 'cute', 'kitty.cc'),
        path.join(res.root, 'cute', 'kitty.h')
      ]);
    });
  });

  it('gets last modified date of a file', () => {
    return Preprocesser.lastModifiedDate(path.join(__dirname, 'preprocessor-test.js')).then((res) => {
      expect(res instanceof Date).to.eql(true);
    });
  });
});
