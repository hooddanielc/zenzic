#include <iostream>
#include <sexy.h>
#include <super-sexy.h>

int main(int, char*[]) {
  SuperSexy super_sexy;
  std::cout << super_sexy.hi() << std::endl;
  Sexy sexy;
  std::cout << sexy.hi() << std::endl;

  return 0;
}
