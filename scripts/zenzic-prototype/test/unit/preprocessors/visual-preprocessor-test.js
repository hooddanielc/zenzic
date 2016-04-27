import path from 'path';
import fs from 'fs';
import tmp from 'tmp';
import VisualPreprocessor from '../../../src/preprocessors/visual-preprocessor';

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

  const helloWorldProgram = path.join(__dirname, '..', '..', 'fixtures', 'hello-world', 'main.cc');

  describe('findExecutable', () => {
    it('can find the executable on a machine with latest visual studio installed', () => {
      return VisualPreprocessor.findInPath().then((res) => {
        expect(res).to.be.a('string');
        const parts = res.split('\\');

        expect(parts[parts.length - 1]).to.eql('cl.exe');
      });
    });

    it('can return proper include flags', () => {
      return VisualPreprocessor.make({
        path: helloWorldProgram,
        root: path.resolve(helloWorldProgram, '..'),
        includes: ['/tmp/hello', 'relative-path']
      }).then((res) => {
        expect(res.includeFlags).to.be.a('array');

        expect(res.includeFlags).to.deep.eql([
          '-I' + path.resolve('/tmp/hello'),
          '-I' + path.resolve(helloWorldProgram, '..', 'relative-path')
        ]);
      });
    });

    it('can get preprocessor output', () => {
      return VisualPreprocessor.make({ path: helloWorldProgram }).then((res) => {
        return res.getOutput();
      }).then((res) => {
        expect(res).to.be.a('string');
      });
    });

    it('can save preprocessor output to a file', () => {
      let out = null;
      let fixture = null;
      let fixtureStdOutput = null;

      return new Promise((resolve) => {
        tmp.file((err, tmpPath) => {
          resolve(tmpPath);
        });
      }).then((tmpPath) => {
        out = tmpPath;
        return VisualPreprocessor.make({ path: helloWorldProgram });
      }).then((res) => {
        fixture = res;
        return fixture.getOutput();
      }).then((stdOutput) => {
        fixtureStdOutput = stdOutput;
        return fixture.saveOutput('/tmp/we.txt');
      }).then((res) => {
        const result = fs.readFileSync('/tmp/we.txt').toString();
        expect(result).to.eql(fixtureStdOutput);
      });
    });
  });
});
