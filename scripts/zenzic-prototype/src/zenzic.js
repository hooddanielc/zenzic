import Preprocesser from './preprocessor';
import VisualPreprocessor from './preprocessors/visual-preprocessor';
import ClangPreprocessor from './preprocessors/clang-preprocessor';
import CLI from './cli';

const zenzic = {
  VisualStudio: VisualPreprocessor,
  Clang: ClangPreprocessor,
  Preprocesser: Preprocesser,
  CLI: CLI,

  version() {
    return '0.0.1';
  }
};

export default zenzic;
