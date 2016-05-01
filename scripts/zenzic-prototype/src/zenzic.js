import Preprocesser from './preprocessor';
import VisualPreprocessor from './preprocessors/visual-preprocessor';
import CLI from './cli';

const zenzic = {
  VisualPreprocessor: VisualPreprocessor,
  Preprocesser: Preprocesser,
  CLI: CLI,

  version() {
    return '0.0.1';
  }
};

export default zenzic;
