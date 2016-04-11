:: # /GS /analyze- /ZI /Gm /Od
:: # /Fd"Debug\vc140.pdb"
:: # /D "WIN32" /D "_DEBUG"
:: # /WX- /RTC1 /Gd /Oy- /MDd

@echo off
setlocal enableDelayedExpansion
for /f "delims=" %%i in ('cd') do set goback=%%i
cd %~dp0

set cc=
set root=
set sources=
set cmd_source=
set target_zenzic=
set cmd_target_zenzic=
set cmd_target_zenzic_test=

:: these paths are relative from root
set sources=(^
  zenzic\child_process^
  zenzic\main^
  zenzic\pipe^
  lick\lick^
  zenzic-test\child_process_test^
)

:: targets
set target_zenzic=(^
  zenzic\child_process^
  zenzic\main^
  zenzic\pipe^
)

set target_zenzic_test=(^
  zenzic\child_process^
  zenzic\pipe^
  lick\lick^
  zenzic-test\child_process_test^
)

set flags=-EHsc -WX -D "_MBCS" -c
set linker_flags=user32.lib
set root=..
set out=out_win

:: join sets into strings
for %%a in %sources% do call set "cmd_source=%%a %%cmd_source%%"
set "cmd_source=%cmd_source:~0,-1%"

for %%a in %target_zenzic% do call set "cmd_target_zenzic=%%a %%cmd_target_zenzic%%"
set "cmd_target_zenzic=%cmd_target_zenzic:~0,-1%"

for %%a in %target_zenzic_test% do call set "cmd_target_zenzic_test=%%a %%cmd_target_zenzic_test%%"
set "cmd_target_zenzic_test=%cmd_target_zenzic_test:~0,-1%"

:: call the script to build objects
call %~dp0compile_objs cc cl out %out% root %root% sources "%cmd_source%" flags "%flags%"  && (echo Successful compile!) || (echo Failed Compile && exit /b 1)

:: build target zenzic
call %~dp0link_target cc link out %out% name zenzic\main objs "%cmd_target_zenzic%" flags "%linker_flags%"  && (echo Successfull linking) || (echo Failed Linking exit /b 1)

:: build target zenzic test
call %~dp0link_target cc link out %out% name zenzic-test\main_test objs "%cmd_target_zenzic_test%" flags "%linker_flags%"  && (echo Successfull linking) || (echo Failed Linking exit /b 1)
cd %goback%
