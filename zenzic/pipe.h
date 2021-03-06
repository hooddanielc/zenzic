#pragma once

#if defined(PREDEF_OS_LINUX) || defined(PREDEF_OS_MACOSX)
  #include <unistd.h>
#endif

#include <system_error>
#include <memory>
#include <zenzic/predef.h>
#include <iostream>

#ifdef PREDEF_PLATFORM_WIN32
  #include <windows.h>
#endif

namespace child_process {
  class pipe_t {
  public:
    #if defined(PREDEF_OS_LINUX) || defined(PREDEF_OS_MACOSX)
      int fd;
      explicit pipe_t(int new_fd) noexcept;
    #endif

    #ifdef PREDEF_PLATFORM_WIN32
      HANDLE fd;
      explicit pipe_t(HANDLE new_fd) noexcept;
    #endif

    pipe_t(const pipe_t &) = delete;
    pipe_t &operator=(const pipe_t &) = delete;
    ~pipe_t();

    using ptr_t = std::unique_ptr<pipe_t>;
    int dup2(int newfd);
    size_t read(char *buf, size_t size);
    size_t write(const char *buf, size_t size);

    struct pair_t {
      pair_t() = default;
      ptr_t in, out;
    };

    static void make(
      ptr_t &p1,
      ptr_t &p2
    );

    static pair_t make_pair();
  };
}
