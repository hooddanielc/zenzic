#include <zenzic/child_process.h>

namespace child_process {
  #ifdef PREDEF_PLATFORM_WIN32
    ChildProcess::ChildProcess(
      const char *filename,
      char *const argv[],
      char *const envp[]
    ) {
      /* TODO */
    }
  #endif

  #if defined(PREDEF_OS_LINUX) || defined(PREDEF_OS_MACOSX)
    ChildProcess::ChildProcess(
      const char *filename,
      char *const argv[],
      char *const envp[]
    ) {
      // pipes for ipc
      auto pipe_cout = pipe_t::make_pair();
      auto pipe_cerr = pipe_t::make_pair();
      auto pipe_cin = pipe_t::make_pair();
      pid = fork();

      if (!pid) {
        // child process
        int err;

        // attach pipes to child
        pipe_cin.in->dup2(STDIN_FILENO);
        pipe_cout.out->dup2(STDOUT_FILENO);
        pipe_cerr.out->dup2(STDERR_FILENO);

        // close all file descriptors before
        // passing process to different program
        pipe_cin = pipe_t::pair_t{};
        pipe_cout = pipe_t::pair_t{};
        pipe_cerr = pipe_t::pair_t{};

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
        cin = std::move(pipe_cin.out);
        cout = std::move(pipe_cout.in);
        cerr = std::move(pipe_cerr.in);
      }
    }
  #endif
}
