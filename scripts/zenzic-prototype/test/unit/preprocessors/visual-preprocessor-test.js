import path from 'path';
import fs from 'fs-extra';
import mkdirp from 'mkdirp';
import tmp from 'tmp';
import os from 'os';
import childProcess from 'child_process';
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

  const testDirectory = path.join(os.tmpdir(),'test-directory');
  const helloWorldProgram = path.join(__dirname, '..', '..', 'fixtures', 'hello-world', 'main.cc');

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
      return fixture.saveOutput('/tmp/we');
    }).then(() => {
      expect(fs.existsSync('/tmp/we.o')).to.eql(true);
      expect(fs.existsSync('/tmp/we.prep'));
      expect(fs.existsSync('/tmp/we.meta'));
      fs.unlinkSync('/tmp/we.prep');
      fs.unlinkSync('/tmp/we.o');
      fs.unlinkSync('/tmp/we.meta');
    });
  });

  it('compiles hello world', function() {
    this.timeout(10000);
    let fixture = null;
    fs.removeSync(testDirectory);

    return VisualPreprocessor.make({ path: helloWorldProgram }).then((res) => {
      fixture = res;
      return res.compileAsTarget(testDirectory);
    }).then((res) => {
      expect(fs.existsSync(path.join(testDirectory, 'hello-world', 'main.o'))).to.eql(true);
      expect(fs.existsSync(path.join(testDirectory, 'hello-world', 'main.prep'))).to.eql(true);
      expect(fs.existsSync(path.join(testDirectory, 'hello-world', 'main.meta'))).to.eql(true);
      expect(fs.existsSync(path.join(testDirectory, 'hello-world', 'person.o'))).to.eql(true);
      expect(fs.existsSync(path.join(testDirectory, 'hello-world', 'person.prep'))).to.eql(true);
      expect(fs.existsSync(path.join(testDirectory, 'hello-world', 'person.meta'))).to.eql(true);
      expect(fs.existsSync(path.join(testDirectory, 'hello-world', 'another-folder', 'animal.o'))).to.eql(true);
      expect(fs.existsSync(path.join(testDirectory, 'hello-world', 'another-folder', 'animal.prep'))).to.eql(true);
      expect(fs.existsSync(path.join(testDirectory, 'hello-world', 'another-folder', 'animal.meta'))).to.eql(true);
      expect(res.length).to.eql(3);
      expect(res[0].path).to.eql(path.join(__dirname, '..', '..', 'fixtures', 'hello-world', 'main.cc'));
      expect(res[1].path).to.eql(path.join(__dirname, '..', '..', 'fixtures', 'hello-world', 'person.cc'));
      expect(res[2].path).to.eql(path.join(__dirname, '..', '..', 'fixtures', 'hello-world', 'another-folder', 'animal.cc'));

      res.forEach((preprocessor) => {
        expect(preprocessor.root).to.eql(path.join(__dirname, '..', '..', 'fixtures'));
      });

      return fixture.linkExecutable(res);
    }).then(() => {
      const helloWorld = path.join(testDirectory, 'hello-world', 'main.exe');
      expect(fs.existsSync(helloWorld)).to.eql(true);

      return new Promise((resolve, reject) => {
        const child = childProcess.exec(helloWorld, (err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      });
    }).then((res) => {
      expect(res.trim()).to.eql('KAPOOYA?');
    });
  });
});
