import path from 'path';
import fs from 'fs';
import os from 'os';
import async from 'async';

// the module class
// assumes all dependencies are
// installed in the zenzic_modules folder.
// the module class should take care of
// compiling and resolving source files in
// dependencies.
class Module {
  constructor(config) {
    this.config = config;
  }

  static make(dir, root=true) {
    return new Promise((resolve, reject) => {
      fs.readFile(path.join(dir, 'zenzic.json'), (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    }).then((res) => {
      const config = JSON.parse(res.toString());
      config.dir = dir;

      if (root) {
        return new Promise((resolve, reject) => {
          fs.exists(path.join(dir, 'zenzic_modules'), (exists) => {
            if (exists) {
              fs.readdir(path.join(dir, 'zenzic_modules'), (err, files) => {
                if (err) {
                  reject(err);
                } else {
                  let modules = [];

                  async.eachLimit(files, os.cpus().length, (file, cb) => {
                    fs.exists(path.join(dir, 'zenzic_modules', file, 'zenzic.json'), (exists) => {
                      if (exists) {
                        this.make(path.join(dir, 'zenzic_modules', file), false).then((mod) => {
                          modules.push(mod);
                          cb();
                        }, cb);
                      } else {
                        cb();
                      }
                    });
                  }, (err) => {
                    if (err) {
                      reject(err);
                    } else {
                      config.childModules = modules;
                      resolve(new Module(config));
                    }
                  });
                }
              });
            } else { // zenzic_module folder does not exist
              resolve(new Module(config));
            }
          });
        });
      } else {
        return new Module(config);
      }
    });
  }
}

export default Module;
