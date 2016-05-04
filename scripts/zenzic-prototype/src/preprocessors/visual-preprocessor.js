import childProcess from 'child_process';
import fs from 'fs';
import readline from 'readline';
import path from 'path';
import Preprocessor from '../preprocessor';

export default class VisualPreprocessor extends Preprocessor {
  static get executableName() {
    return 'cl.exe';
  }

  static get linkerExecutableName() {
    return 'link.exe';
  }

  constructor(opts) {
    super(opts);
    this.executableName = opts.executableName || this.constructor.executableName;
    this.linkerExecutableName = opts.linkerExecutableName || this.constructor.linkerExecutableName;
  }

  get includeFlags() {
    const result = [];

    this.includes.forEach((includeDir) => {
      result.push('-I' + path.resolve(this.root, includeDir));
    });

    if (this.module) {
      this.module.childModules.forEach((module) => {
        result.push('-I' + module.dir);
      });
    }

    return result;
  }

  getOutput() {
    return VisualPreprocessor.findInPath().then((path) => {
      return new Promise((resolve, reject) => {
        let result = '';

        const child = childProcess.spawn(path, [
          this.path,
          '-E',            // preprocess to stdout
          '-I' + this.root // include root path
        ].concat(this.flags));

        child.stdout.on('data', (data) => {
          result += data.toString();
        });

        child.on('exit', () => {
          resolve(result);
        });
      });
    });
  }

  saveMetaData(out, stdOut) {
    return new Promise((resolve, reject) => {
      const includedHeaders = [];

      const lineReader = readline.createInterface({
        input: fs.createReadStream(out + '.prep')
      });

      lineReader.on('line', (line) => {
        const directive = line.split('#line ')[1];

        if (directive) {
          const filepath = path.normalize(directive.split('"')[1]);

          if (path.extname(filepath) === '.h' && includedHeaders.indexOf(filepath) === -1) {
            includedHeaders.push(filepath);
          }
        }
      });

      lineReader.on('close', () => {
        const meta = {
          compileDate: new Date(),
          includedHeaders: includedHeaders,
          projectHeaders: this.filterProjectPaths(includedHeaders),
          output: stdOut,
          out: out + '.o'
        };

        this.meta = meta;

        fs.writeFile(out + '.meta', JSON.stringify(meta), (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(meta);
          }
        });
      });
    });
  }

  savePreprocessedOutput(out) {
    return VisualPreprocessor.findInPath().then((path) => {
      return new Promise((resolve, reject) => {
        let result = '';

        const child = childProcess.spawn(path, [
          '/P',
          '/C',
          '/Fi' + out + '.prep',  // preprocessed file name
          '/I' + this.root,       // include root path
          this.path
        ].concat(this.flags));

        child.stdout.on('data', (data) => {
          result += data.toString();
        });

        child.stderr.on('data', (data) => {
          result += data.toString();
        });

        child.on('exit', () => {
          this.saveMetaData(out, result).then(() => {
            resolve(result);
          }, reject);
        });
      });
    });
  }

  saveOutput(out) {
    let compilerExecutable = null;
    let theMeta = null;

    return this.constructor.findInPath().then((path) => {
      compilerExecutable = path;
      return this.constructor.readMeta(out + '.meta');
    }).then((meta) => {
      theMeta = meta;

      if (meta) {
        return this.constructor.lastModifiedDate(this.path);
      }
    }).then((lastModified) => {
      if (lastModified) {
        if ((new Date(theMeta.compileDate)) < lastModified) {
          return true;
        }

        return false;
      }

      return true;
    }).then((ccNeedsCompile) => {
      // check to see if the header changed?
      if (!ccNeedsCompile) {
        return new Promise((resolve, reject) => {
          const ext = path.extname(this.path);
          const header = this.path.substring(0, this.path.length - ext.length) + '.h';

          fs.stat(header, (err, res) => {
            if (err) {
              resolve(false);
            } else {
              if ((new Date(theMeta.compileDate)) < new Date(res.mtime)) {
                resolve(true);
              } else {
                resolve(false);
              }
            }
          });
        });
      }

      return true;
    }).then((needsCompile) => {
      if (!needsCompile) {
        this.meta = theMeta;
        return theMeta;
      } else {
        return new Promise((resolve, reject) => {
          let result = '';

          const child = childProcess.spawn(compilerExecutable, [
            '/Fo' + out + '.o', // output file name
            '/C',
            '/I' + this.root,   // include root path
            this.path
          ].concat(this.flags));

          child.stdout.on('data', (data) => {
            result += data.toString();
          });

          child.on('exit', () => {
            this.savePreprocessedOutput(out).then(() => {
              resolve(result);
            }, reject);
          });
        });
      }
    });
  }

  // preprocessors come from compileAsTarget method
  // the first proccessor is assumed to be the main
  // entry point, and thus will be named named
  // accordingly
  linkExecutable(preprocessors) {
    return this.constructor.findInPath(this.linkerExecutableName).then((cc) => {
      return new Promise((resolve, reject) => {
        const objs = preprocessors.map((prep) => {
          return prep.meta.out;
        });

        const ext = path.extname(objs[0]);
        const executable = objs[0].substring(0, objs[0].length - ext.length) + '.exe';

        const child = childProcess.spawn(cc, objs.concat(this.linkerFlags).concat([
          '-out:' + executable
        ]));

        let result = '';

        child.stdout.on('data', (data) => {
          result += data.toString();
        });

        child.on('exit', (exitCode) => {
          if (exitCode === 0) {
            resolve(result);
          } else {
            reject(result);
          }
        });
      });
    });
  }
};
