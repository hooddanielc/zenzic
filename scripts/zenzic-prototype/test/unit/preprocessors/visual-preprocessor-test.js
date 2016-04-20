import VisualPreprocessor from '../../../src/preprocessors/visual-preprocessor';
import path from 'path';

/**
 * We are testing integration with a windows computer
 * that has visual studio installed. These tests assume
 * the environment has cl.exe added to the path variable.
 * Tests should pass when ran by the visual studio command
 * line executable.
 */

const isWindows = /^win/.test(process.platform);
const helloWorld = path.join(__dirname, '..', '..', 'fixtures', 'hello-world', 'main.cc');

describe('VisualPreprocessor', () => {
  if (!isWindows) {
    return;
  }

  describe('findExecutable', () => {
    it('can find the executable on a machine with latest visual studio installed', () => {
      return VisualPreprocessor.findInPath().then((res) => {
        expect(res).to.be.a('string');
        const parts = res.split('\\');

        expect(parts[parts.length - 1]).to.eql('cl.exe');
      });
    });
  });
});