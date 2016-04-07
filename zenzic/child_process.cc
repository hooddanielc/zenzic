#include <zenzic/child_process.h>

#include <sstream>  // TODO: remove me

static void Here(const char *file, int line) {
  std::ostringstream strm;
  strm << file << ':' << line;
  #ifdef PREDEF_PLATFORM_WIN32
    MessageBox(NULL, strm.str().c_str(), "Here", MB_OK);
  #endif
}

#define HERE Here(__FILE__, __LINE__);

namespace child_process {
  #ifdef PREDEF_PLATFORM_WIN32
    ChildProcess::ChildProcess(
      const char *filename,
      char *const argv[],
      char *const envp[]
    ) {
      std::string cmd;
      int i = 0;

      while (argv[i] != NULL){
        cmd.append(argv[i]);
        cmd.append(" ");
        ++i;
      }

      std::ostringstream strm;
      for (const char *const *env = envp; *env; ++env) {
        strm << *env << '\0';
      }
      strm << '\0';
      std::string env = strm.str();

      // pipes for ipc
      auto pipe_cout = pipe_t::make_pair();
      auto pipe_cerr = pipe_t::make_pair();
      auto pipe_cin = pipe_t::make_pair();

      if (
        !SetHandleInformation(pipe_cout.out->fd, HANDLE_FLAG_INHERIT, 0) ||
        !SetHandleInformation(pipe_cerr.out->fd, HANDLE_FLAG_INHERIT, 0) ||
        !SetHandleInformation(pipe_cin.in->fd, HANDLE_FLAG_INHERIT, 0)
      ) {
        DWORD win_err = GetLastError();
        std::error_code ec(win_err, std::system_category());
        throw std::system_error(ec, "Cannot set handle inheritance");
      }

      PROCESS_INFORMATION proc_info;
      STARTUPINFO start_info;
      BOOL success = FALSE;
      ZeroMemory(&proc_info, sizeof(PROCESS_INFORMATION));
      ZeroMemory(&start_info, sizeof(STARTUPINFO));
      start_info.cb = sizeof(STARTUPINFO);
      start_info.hStdError = pipe_cerr.out->fd;
      start_info.hStdOutput = pipe_cout.out->fd;
      start_info.hStdInput = pipe_cin.in->fd;
      start_info.dwFlags |= STARTF_USESTDHANDLES;

      success = CreateProcess(
        filename,
        const_cast<LPSTR>(cmd.c_str()),
        NULL,
        NULL,
        TRUE,
        0,
        const_cast<LPVOID>(static_cast<LPCVOID>(env.c_str())),
        NULL,
        &start_info,
        &proc_info
      );

      if (!success) {
        DWORD win_err = GetLastError();
        std::cout << win_err << std::endl;
        std::error_code ec(win_err, std::system_category());
        throw std::system_error(ec, "Cannot set handle inheritance");
      } else {
        // move useful faucets
        cin = std::move(pipe_cin.out);
        cout = std::move(pipe_cout.in);
        cerr = std::move(pipe_cerr.in);
      }
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
