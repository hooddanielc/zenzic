#pragma once

#include <system_error>
#include <iostream>
#include <zenzic/pipe.h>
#include <zenzic/predef.h>

#ifdef PREDEF_PLATFORM_WIN32
  using process_id_t = int;
#else
  using process_id_t = pid_t;
#endif

namespace child_process {
  class ChildProcess {
  private:
    process_id_t pid;

  public:
    pipe_t::ptr_t cout;
    pipe_t::ptr_t cerr;
    pipe_t::ptr_t cin;

    ChildProcess(
      const char *filename,
      char *const argv[],
      char *const envp[]
    );
  };
}
