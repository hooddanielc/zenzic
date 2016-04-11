#pragma once

#include <system_error>
#include <iostream>
#include <zenzic/pipe.h>
#include <zenzic/predef.h>

#ifdef PREDEF_PLATFORM_WIN32
  #include <sstream>
  #include <windows.h>
#endif

namespace child_process {
  class ChildProcess {
  private:
    #ifdef PREDEF_PLATFORM_WIN32
      PROCESS_INFORMATION win_process_info;
      STARTUPINFO win_start_info;
    #else
      pid_t pid;
    #endif

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
