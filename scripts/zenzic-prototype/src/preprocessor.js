import os from 'os';
import fs from 'fs-extra';
import path from 'path';
import PromisePool from 'es6-promise-pool';

function mkdirp(dir) {
  return new Promise((resolve, reject) => {
    fs.mkdirp(dir, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
}

/**
* Preprocessor is the starting point for building all
* C++ applications. The preprocessor performs macro
* expansion and replaces include statements with
* the contents of included file. We want to
* send each source file throught he preprocessor to find
* other source files that we'll need to compile. Preprocessor
* is the base class for all preprocessors.
*
* @constructor
* @param opts
*/

class Preprocessor {
  constructor(opts) {
    this.path = opts.path;
    this.flags = opts.flags || [];
    this.includes = opts.includes || [];
    this.linkerFlags = opts.linkedFlags || [];
    this.root = opts.root || path.join(path.dirname(this.path), '..');
    this.executableName = opts.executableName;
    this.module = opts.module;
  }

  filterProjectPaths(paths) {
    const root = path.normalize(this.root);

    return paths.filter((filepath) => {
      return path.relative(this.root, filepath).indexOf('..') === -1;
    });
  }

  compileAsTarget(out, tab, preprocessors) {
    let first = null;
    let outFirst = null;
    const taboo = taboo || [this.path];
    preprocessors = preprocessors || [];
    preprocessors.push(this);

    return mkdirp(out).then(() => {
      first = path.relative(this.root, this.path);
      outFirst = first.substring(0, first.length - path.extname(first).length);
      return mkdirp(path.join(out, path.dirname(first)));
    }).then(() => {
      return this.saveOutput(path.join(out, outFirst));
    }).then(() => {

      const todo = this.meta.projectHeaders.map((file) => {
        const header = path.relative(this.root, file);
        const name = header.substring(0, header.length - path.extname(header).length);

        return {
          name: name,
          src: name + '.cc',
          file: file
        };
      });

      const work = () => {
        const job = todo.pop();

        if (job) {
          const src = path.join(this.root, job.src);

          return new Promise((resolve, reject) => {
            fs.exists(path.join(this.root, job.src), (res) => {
              resolve(res);
            });
          }).then((exists) => {
            if (exists && taboo.indexOf(src) === -1) {
              taboo.push(this.path);

              return this.constructor.make(Object.assign({
                path: src,
                root: this.root
              }, this.opts)).then((preprocessor) => {
                return preprocessor.compileAsTarget(out, taboo, preprocessors).then(() => {
                  return preprocessors;
                });
              });
            }
          });
        }
      };

      return new PromisePool(work, os.cpus().length).start().then((res) => {
        return preprocessors;
      });
    });
  }

  static findInPath(executableName) {
    executableName = executableName || this.executableName;
    const paths = process.env.PATH.split(';');
    const crawlResults = [];

    const work = () => {
      const dir = paths.pop();

      if (dir) {
        return new Promise((resolve, reject) => {
          fs.readdir(dir, (err, res) => {
            if (err) {
              reject(err);
            } else {
              crawlResults.push({
                dir: dir,
                filenames: res
              });

              resolve(res);
            }
          });
        });
      }
    };

    return new PromisePool(work, os.cpus().length).start().then(() => {
      const results = [];

      crawlResults.forEach((item) => {
        const execs = item.filenames.filter((exec) => {
          return exec === executableName;
        });

        for (let i = 0; i < execs.length; ++i) {
          execs[i] = path.join(item.dir, execs[i]);
        }

        results.push.apply(results, execs);
      });

      return results[0];
    });
  }

  static readMeta(filepath) {
    return new Promise((resolve, reject) => {
      fs.readFile(filepath, (err, data) => {
        if (data) {
          resolve(JSON.parse(data.toString()));
        } else {
          resolve();
        }
      });
    });
  }

  static make(opts) {
    opts = opts || {};

    const exists = new Promise((resolve, reject) => {
      if (!opts.path) {
        reject(new ReferenceError('`opts.path` property required'));
      }

      fs.exists(opts.path, (ok) => {
        if (ok) {
          resolve(opts.path);
        } else {
          reject(new ReferenceError(`${opts.path} does not exist`));
        }
      });
    });

    return exists.then((exists) => {
      return new this(opts);
    });
  }

  static lastModifiedDate(filepath) {
    return new Promise((resolve, reject) => {
      fs.stat(filepath, (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(new Date(res.mtime));
        }
      });
    });
  }
}

export default Preprocessor;
