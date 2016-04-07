#include <iostream>
#include <string>
#include <zenzic/child_process.h>

using namespace child_process;

int main(int, char*[], char *env[]) {
  #ifdef PREDEF_PLATFORM_WIN32
    char *argv[] = { "C:\\Windows\\System32\\cmd.exe", "/c", "dir", NULL };
  #else
    char *argv[] = { "/usr/bin/bc", "-q", NULL };
  #endif

  child_process::ChildProcess child(
    argv[0],
    argv,
    env
  );

  child.cin->write("2^32\n", 5);

  char buffer[200];
  size_t count;
  count = child.cout->read(buffer, sizeof(buffer) - 1);
  std::cout << buffer << std::endl;

  return 0;
}
