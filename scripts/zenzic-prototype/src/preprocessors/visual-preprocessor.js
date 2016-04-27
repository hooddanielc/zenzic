import childProcess from 'child_process';
import fs from 'fs';
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

  saveOutput(out) {
    return VisualPreprocessor.findInPath().then((path) => {
      return new Promise((resolve, reject) => {
        let result = '';

        const child = childProcess.spawn(path, [
          this.path,
          '-P' ,           // preprocess to file
          '-Fi' + out,
          '-I' + this.root // include root path
        ].concat(this.flags));

        child.stdout.on('data', (data) => {
          result += data.toString();
        });

        child.on('exit', () => {
          console.log(result);
          console.log(out);
          resolve(result);
        });
      });
    });
  }
};
