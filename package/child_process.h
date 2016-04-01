#include <system_error>
#include <boost/filesystem.hpp>
#include <package/pipe.h>
#include <iostream>

namespace child_process {
  class ChildProcess {
  private:
    pid_t pid;
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
    void wait();
  };

  //ChildProcess spawn(std::vector<std::string> cmd) {}
  std::string find_executable(const char *cmd);
}
