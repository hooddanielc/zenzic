import os from 'os';
import fs from 'fs';
import path from 'path';
import PromisePool from 'es6-promise-pool';

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
  get executableName() {
    return 'clang';
  }

  get path() {
    return this.path;
  }

  constructor(opts) {
    this.path = opts.path;
  }

  static findInPath() {
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
          return exec === this.executableName;
        });

        for (let i = 0; i < execs.length; ++i) {
          execs[i] = path.join(item.dir, execs[i]);
        }

        results.push.apply(results, execs);
      });

      return results[0];
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

    return exists.then(() => {
      return new Preprocessor(opts);
    });
  }
}

export default Preprocessor;
