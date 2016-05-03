import Module from '../../src/module';
import path from 'path';

describe('Preprocessor', () => {
  const helloWorld = path.join(__dirname, '..', 'fixtures');

  it('constructs', () => {
    return Module.make(helloWorld).then((res) => {
      expect(res instanceof Module).to.eql(true);
      expect(res.config.childModules.length).to.eql(2);

      res.config.childModules.forEach((child) => {
        expect(child instanceof Module).to.eql(true);
        expect(child.config.childModules).to.eql(undefined);
      });
    });
  });
});
