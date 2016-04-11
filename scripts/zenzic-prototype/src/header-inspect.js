import fs from 'fs';

class HeaderInspect {
  static make(opts) {
    opts = opts || {};

    const exists = new Promise((resolve, reject) => {
      if (!opts.path) {
        throw new ReferenceError(`${opts.path} does not exist`);
      }

      fs.exists(opts.path, (ok) => {
        if (ok) {
          resolve(opts.path);
        } else {
          throw ReferenceError(`${opts.path} does not exist`);
        }
      });
    });

    return exists;
  }
}

export default HeaderInspect;
