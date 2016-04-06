project=zenzic
mkdir -p "out_unix/debug/$project"

root=$(cd ..; pwd)
package=$(cd ../$project; pwd)
out_debug=$(cd out_unix/debug; pwd)

flags="--std=c++14 -Weverything -Wno-c++98-compat -Wno-shadow
       -Wno-global-constructors -Wno-exit-time-destructors -pthread
       -Wno-padded -Wno-weak-vtables -D__STDC_CONSTANT_MACROS
       -D__STDC_LIMIT_MACROS -I$root -c"

debug_flags="-g -DDJ_ENABLE_ABORT_IF -Wno-unused-private-field"
release_flags="-O3"
cc="clang"
src="main pipe child_process"

# compile objects
for file in $src;
do
  $cc $flags $debug_flags -o$out_debug/$project/$file.o $package/$file.cc
done

# get list of compiled objects
for file in $src;
do
  objs="$objs $out_debug/$project/$file.o"
done

# link objects
$cc -o$out_debug/$project/main $objs -lstdc++
