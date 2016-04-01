#include <package/lick.h>

FIXTURE(foo) {
  std::string name = "two";
  EXPECT_EQ(name, name);
}

FIXTURE(foo_bad) {
  std::string name = "two";
  std::string stuff = "stuff";
  EXPECT_EQ(name, stuff);
}
