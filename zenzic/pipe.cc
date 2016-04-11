#include <zenzic/pipe.h>

namespace child_process {

  #ifdef PREDEF_PLATFORM_WIN32
    pipe_t::pipe_t(HANDLE new_fd) noexcept : fd(new_fd) {}

    pipe_t::~pipe_t() {
      CloseHandle(fd);
    }

    int pipe_t::dup2(int new_fd) {
      /* TODO */
      return 0;
    }

    size_t pipe_t::read(char *buf, size_t size) {
      DWORD bytes_read;
      BOOL success = ReadFile(fd, buf, size, &bytes_read, NULL);

      if (!success) {
        DWORD win_err = GetLastError();
        std::error_code ec(win_err, std::system_category());
        throw std::system_error(ec, "Cannot read pipe");
      }

      return bytes_read;
    }

    size_t pipe_t::write(const char *buf, size_t size) {
      /* TODO */
      return 0;
    }

    void pipe_t::make(ptr_t &p1, ptr_t &p2) {
      HANDLE pipe_read = NULL;
      HANDLE pipe_write = NULL;
      SECURITY_ATTRIBUTES sa_attr;

      // inherit handle
      sa_attr.nLength = sizeof(SECURITY_ATTRIBUTES);
      sa_attr.bInheritHandle = TRUE;
      sa_attr.lpSecurityDescriptor = NULL;

      if (!CreatePipe(&pipe_read, &pipe_write, &sa_attr, 0)) {
        DWORD win_err = GetLastError();
        std::error_code ec(win_err, std::system_category());
        throw std::system_error(ec, "Cannot create pipe");
      }

      p1.reset(new pipe_t(pipe_read));
      p2.reset(new pipe_t(pipe_write));
    }
  #endif

  #if defined(PREDEF_OS_LINUX) || defined(PREDEF_OS_MACOSX)
    pipe_t::pipe_t(int new_fd) noexcept : fd(new_fd) {}

    pipe_t::~pipe_t() {
      close(fd);
    }

    int pipe_t::dup2(int new_fd) {
      return ::dup2(fd, new_fd);
    }

    size_t pipe_t::read(char *buf, size_t size) {
      auto actual = ::read(fd, buf, size);
      if (actual < 0) {
        throw std::system_error(errno, std::system_category());
      }
      return static_cast<size_t>(actual);
    }

    size_t pipe_t::write(const char *buf, size_t size) {
      auto actual = ::write(fd, buf, size);
      if (actual < 0) {
        throw std::system_error(errno, std::system_category());
      }
      return static_cast<size_t>(actual);
    }

    void pipe_t::make(ptr_t &p1, ptr_t &p2) {
      int fds[2];

      if (pipe(fds)) {
        throw std::system_error(errno, std::system_category());
      }

      p1.reset(new pipe_t(fds[0]));
      p2.reset(new pipe_t(fds[1]));
    }
  #endif

  pipe_t::pair_t pipe_t::make_pair() {
    std::unique_ptr<pipe_t> p1, p2;
    pipe_t::make(p1, p2);
    return { std::move(p1), std::move(p2) };
  }

}
