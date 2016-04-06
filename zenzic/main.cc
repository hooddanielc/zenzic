#include <iostream>
#include <string>
#include <zenzic/child_process.h>

using namespace child_process;

int main(int, char*[], char *env[]) {
  char *argv[] = { "/usr/bin/bc", "-q", NULL };

  child_process::ChildProcess child(
    argv[0],
    argv,
    env
  );

  child.write("2^32\n", 5);
  std::cout << child.read() << std::endl;

  return 0;
}
