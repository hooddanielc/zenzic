#include <package/child_process.h>

using namespace boost::filesystem;

namespace child_process {
  ChildProcess::ChildProcess(
    const char *filename,
    char *const argv[],
    char *const envp[]
  ) {
    // pipes for ipc
    stdout = pipe_t::make_pair();
    stderr = pipe_t::make_pair();
    stdin = pipe_t::make_pair();
    pid = fork();

    if (!pid) {
      // child process
      int err;

      // attach pipes to child
      in.in->dup2(STDIN_FILENO);
      out.out->dup2(STDOUT_FILENO);
      err.out->dup2(STDERR_FILENO);

      // close all file descriptors before
      // passing process to different program
      stdin = pipe_t::pair_t{};
      stdout = pipe_t::pair_t{};
      stderr = pipe_t::pair_t{};

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
      // close file descriptors that parent
      // has no use for writing/reading
      in.in.reset();
      out.out.reset();
      err.out.reset();
    }
  }

  void ChildProcess::wait() {
    //waitpid(pid);
  }

  std::string ChildProcess::read() {
    char buffer[200];
    size_t count;
    count = stdout.in->read(buffer, sizeof(buffer) - 1);
    return { buffer, count };
  }

  void ChildProcess::write(const char *message, size_t count) {
    stdin.out->write(message, count);
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
