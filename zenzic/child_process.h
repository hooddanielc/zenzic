#pragma once

#include <system_error>
#include <iostream>
#include <zenzic/pipe.h>
#include <zenzic/predef.h>

#ifdef PREDEF_PLATFORM_WIN32
  #pragma push_macro("stdin")
  #pragma push_macro("stdout")
  #pragma push_macro("stderr")
  #undef stdin
  #undef stderr
  #undef stdout

  using process_id_t = int;
#else
  using process_id_t = pid_t;
#endif

namespace child_process {
  class ChildProcess {
  private:
    process_id_t pid;
    pipe_t::ptr_t stdout;
    pipe_t::ptr_t stderr;
    pipe_t::ptr_t stdin;

  public:
    ChildProcess(
      const char *filename,
      char *const argv[],
      char *const envp[]
    );

    std::string read();
    void write(const char *message, size_t count);
  };
}

#ifdef PREDEF_PLATFORM_WIN32
  #pragma pop_macro("stdin")
  #pragma pop_macro("stdout")
  #pragma pop_macro("stderr")
#endif
