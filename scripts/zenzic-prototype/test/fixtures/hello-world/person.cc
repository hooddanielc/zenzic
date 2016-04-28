#include <hello-world/person.h>
#include <hello-world/another-folder/animal.h>

std::string Person::hi()  {
  return "KAPOOYA?";
}

std::string Person::petAnimal()  {
  Animal animal;
  return animal.hi();
}
