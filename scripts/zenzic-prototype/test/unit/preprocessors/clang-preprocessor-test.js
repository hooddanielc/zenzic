import path from 'path';
import fs from 'fs-extra';
import mkdirp from 'mkdirp';
import tmp from 'tmp';
import os from 'os';
import childProcess from 'child_process';
import ClangPreprocessor from '../../../src/preprocessors/clang-preprocessor';

/**
 * We are testing integration with a windows computer
 * that has visual studio installed. These tests assume
 * the environment has cl.exe added to the path variable.
 * Tests should pass when ran by the visual studio command
 * line executable.
 */

const isMac = /^darwin/.test(process.platform);
const helloWorld = path.join(__dirname, '..', '..', 'fixtures', 'hello-world', 'main.cc');
const codeUsingModules = path.join(__dirname, '..', '..', 'fixtures', 'code-using-modules', 'main.cc');

describe('ClangPreprocessor', () => {
  if (!isMac) {
    return;
  }

  const testDirectory = path.join(os.tmpdir(),'test-directory');
  const helloWorldProgram = path.join(__dirname, '..', '..', 'fixtures', 'hello-world', 'main.cc');

  it('can find the executable on a machine with latest visual studio installed', () => {
    return ClangPreprocessor.findInPath().then((res) => {
      expect(res).to.be.a('string');
      const parts = res.split('\\');

      expect(parts[parts.length - 1]).to.contain('clang');
    });
  });

  it('can return proper include flags', () => {
    return ClangPreprocessor.make({
      path: helloWorldProgram,
      includes: ['/tmp/hello', 'relative-path']
    }).then((res) => {
      expect(res.includeFlags).to.be.a('array');
      expect(res.includeFlags).to.contain('-I' + path.resolve('/tmp/hello'));
      expect(res.includeFlags).to.contain('-I' + path.resolve(helloWorldProgram, '..', '..', 'relative-path'));
      expect(res.includeFlags).to.contain('-I' + path.resolve(helloWorldProgram, '..', '..', 'zenzic_modules', 'a-sexy-module'));
      expect(res.includeFlags).to.contain('-I' + path.resolve(helloWorldProgram, '..', '..', 'zenzic_modules', 'super-sexy-module'));
    });
  });

  it('can get preprocessor output', () => {
    return ClangPreprocessor.make({ path: helloWorldProgram }).then((res) => {
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
      return ClangPreprocessor.make({ path: helloWorldProgram });
    }).then((res) => {
      fixture = res;
      return fixture.getOutput();
    }).then((stdOutput) => {
      fixtureStdOutput = stdOutput;
      return fixture.saveOutput(path.join(os.tmpdir(), '/we'));
    }).then(() => {
      expect(fs.existsSync(path.join(os.tmpdir(), '/we.o'))).to.eql(true);
      expect(fs.existsSync(path.join(os.tmpdir(), '/we.prep')));
      expect(fs.existsSync(path.join(os.tmpdir(), '/we.meta')));
      fs.unlinkSync(path.join(os.tmpdir(), '/we.prep'));
      fs.unlinkSync(path.join(os.tmpdir(), '/we.o'));
      fs.unlinkSync(path.join(os.tmpdir(), '/we.meta'));
    });
  });

  it('compiles hello world', function() {
    this.timeout(10000);
    let fixture = null;
    fs.removeSync(testDirectory);

    return ClangPreprocessor.make({ path: helloWorldProgram }).then((res) => {
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
      const helloWorld = path.join(testDirectory, 'hello-world', 'main');
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

  it('compiles code-using-modules', function() {
    fs.removeSync(testDirectory);
    this.timeout(10000);
    let fixture = null;
    fs.removeSync(testDirectory);

    return ClangPreprocessor.make({ path: codeUsingModules }).then((res) => {
      fixture = res;
      return res.compileAsTarget(testDirectory);
    }).then((res) => {
      return fixture.linkExecutable(res);
    }).then((res) => {
      const usingModules = path.join(testDirectory, 'code-using-modules', 'main');
      expect(fs.existsSync(helloWorld)).to.eql(true);

      return new Promise((resolve, reject) => {
        const child = childProcess.exec(usingModules, (err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      });
    }).then((res) => {
      expect(res).to.contain('Hey there sailor');
      expect(res).to.contain('Hey there big fella');
    });
  });
});
