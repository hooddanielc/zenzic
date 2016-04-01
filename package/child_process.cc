#include <package/child_process.h>

using namespace boost::filesystem;

namespace child_process {
  ChildProcess::ChildProcess(
    const char *filename,
    char *const argv[],
    char *const envp[]
  ) {
    // pipes for ipc
    auto pipe_stdout = pipe_t::make_pair();
    auto pipe_stderr = pipe_t::make_pair();
    auto pipe_stdin = pipe_t::make_pair();
    pid = fork();

    if (!pid) {
      // child process
      int err;

      // attach pipes to child
      pipe_stdin.in->dup2(STDIN_FILENO);
      pipe_stdout.out->dup2(STDOUT_FILENO);
      pipe_stderr.out->dup2(STDERR_FILENO);

      // close all file descriptors before
      // passing process to different program
      pipe_stdin = pipe_t::pair_t{};
      pipe_stdout = pipe_t::pair_t{};
      pipe_stderr = pipe_t::pair_t{};

      err = execve(
        filename,
        argv,
        envp
      );

      throw std::system_error(EACCES, std::system_category());
    } else if (pid == -1) {
      // fork failed, throw system error
      throw std::system_error(errno, std::system_category());
    } else {
      // set references to pipes connected to child
      stdin = std::move(pipe_stdin.out);
      stdout = std::move(pipe_stdout.in);
      stderr = std::move(pipe_stderr.in);
    }
  }

  void ChildProcess::wait() {
    //waitpid(pid);
  }

  std::string ChildProcess::read() {
    char buffer[200];
    size_t count;
    count = stdout->read(buffer, sizeof(buffer) - 1);
    return { buffer, count };
  }

  void ChildProcess::write(const char *message, size_t count) {
    stdin->write(message, count);
  }

  /**
   * Search path for executable
   */
  std::string find_executable(const char *cmd) {
    char *path_env = std::getenv("PATH");
    char path[strlen(path_env)];
    strcpy(path, path_env);
    char *dir = strtok(path, ":");
    std::string result = cmd;

    while (dir != NULL) {
      boost::filesystem::path filepath(dir);

      if (exists(filepath) && is_directory(filepath)) {
        for (directory_entry &x : directory_iterator(filepath)) {
          if (strcmp(cmd, x.path().filename().string().c_str()) == 0) {
            result = x.path().string();
            break;
          }
        }
      }

      dir = strtok(NULL, ":");
    }

    return result;
  }

}
