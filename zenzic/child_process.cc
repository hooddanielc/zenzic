#include <zenzic/child_process.h>

namespace child_process {
  #ifdef PREDEF_PLATFORM_WIN32

    #pragma push_macro("stdin")
    #pragma push_macro("stdout")
    #pragma push_macro("stderr")
    #undef stdin
    #undef stderr
    #undef stdout

    ChildProcess::ChildProcess(
      const char *filename,
      char *const argv[],
      char *const envp[]
    ) {
      /* TODO */
    }

    std::string ChildProcess::read() {
      /* TODO */
      return "hello";
    }

    void ChildProcess::write(const char *message, size_t count) {
      /* TODO */
    }

    #pragma pop_macro("stdin")
    #pragma pop_macro("stdout")
    #pragma pop_macro("stderr")
  #endif

  #if defined(PREDEF_OS_LINUX) || defined(PREDEF_OS_MACOSX)
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

    std::string ChildProcess::read() {
      char buffer[200];
      size_t count;
      count = stdout->read(buffer, sizeof(buffer) - 1);
      return { buffer, count };
    }

    void ChildProcess::write(const char *message, size_t count) {
      stdin->write(message, count);
    }
  #endif
}
