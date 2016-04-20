import Preprocessor from '../preprocessor';

export default class VisualPreprocessor extends Preprocessor {
  static get executableName() {
    return 'cl.exe';
  }
};
