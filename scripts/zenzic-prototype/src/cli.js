import path from 'path';
import program from 'commander';
import inflection from 'inflection';
import zenzic from './zenzic';

export default class CLI {
  constructor(opts) {
    opts = opts || {};
    this.opts = opts;
    this.stdout = opts.stdout || process.stdout;
    this.stderr = opts.stderr || process.stderr;
    this.argv = opts.argv || process.argv;
    this.initCommander();
    this.rollout();
    this.build();
  }

  initCommander() {
    program
      .version('0.0.1')
      .option('-r, --root [folder]', 'Specify root folder of project')
      .option('-c, --compiler [compiler]', 'Specify your tool to use')
      .option('-o, --out [folder]', 'Specify the build directory')
      .option('[target]')
      .parse(this.argv);
  }

  rollout() {
    this.root = program.root ? path.resolve(program.root) : process.cwd();
    this.target = program.args[0];
    this.out = program.out ? path.resolve(program.out) : path.join(this.root, '..', 'dist');

    if (program.args.length > 1) {
      throw new Error('You can only specify one target to compile');
    }

    if (!program.compiler) {
      throw new Error('You need to specify tool to use');
    } else {
      const compiler = inflection.camelize(program.compiler.split('-').join('_'));

      if (!zenzic[compiler]) {
        throw new Error('The compiler ' + compiler + ' does not exist.');
      }

      this.compiler = zenzic[compiler];
    }

    console.log('You are using arguments');
    console.log('');

    [
      'root',
      'compiler',
      'target',
      'out'
    ].forEach((arg) => {
      if (typeof this[arg] === 'function') {
        console.log(arg, this[arg].name);
      } else {
        console.log(arg, this[arg]);
      }
    });

    console.log('');
  }

  build() {
    let target = null;

    this.compiler.make({
      path: path.join(this.root, this.target),
      root: this.root
    }).then((res) => {
      target = res;
      return res.compileAsTarget(this.out);
    }).then((res) => {
      res.forEach((obj) => {
        console.log(obj.path);
        console.log(obj.meta.out);
        console.log('');
      });

      return target.linkExecutable(res);
    }).then((res) => {
      console.log(res);
    }).catch((err) => {
      console.log(err);
      console.log(err.stack);
      throw err;
    });
  }
}
