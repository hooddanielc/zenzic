import childProcess from 'child_process';
import fs from 'fs';
import readline from 'readline';
import path from 'path';
import Preprocessor from '../preprocessor';

export default class VisualPreprocessor extends Preprocessor {
  static get executableName() {
    return 'cl.exe';
  }

  constructor(opts) {
    super(opts);
    this.executableName = opts.executableName || 'cl.exe';
  }

  get includeFlags() {
    const result = [];

    this.includes.forEach((includeDir) => {
      result.push('-I' + path.resolve(this.root, includeDir));
    });

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
          output: stdOut
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
    let thePath = null;
    let theMeta = null;

    return this.constructor.findInPath().then((path) => {
      thePath = path;
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
    }).then((needsCompile) => {
      if (!needsCompile) {
        this.meta = theMeta;
        return theMeta;
      } else {
        return new Promise((resolve, reject) => {
          let result = '';

          const child = childProcess.spawn(thePath, [
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
};
