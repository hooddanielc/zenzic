#include <iostream>
#include <hello-world/person.h>

int main(int, char *[]) {
  Person person;
  std::cout << person.hi() << std::endl;
  return 0;
}
