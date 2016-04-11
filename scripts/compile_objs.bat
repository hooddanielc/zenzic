@echo off
setlocal enableDelayedExpansion

set cc=
set root=
set out=
set sources=
set flags=

set argCount=0
set key=

for %%x in (%*) do (
  set /A argCount=!argCount! + 1
  set /A even_check=!argCount! / 2 * 2

  if !argCount! EQU !even_check! (
    set !key!=%%x
  )

  if !argCount! NEQ !even_check! (
    set key=%%x
  )
)

call :relative_cwd root %root%
call :relative_cwd out %out%

echo.
echo %s% cc            : %cc%
echo %s% root          : %root%
echo %s% out           : %out%
echo %s% sources       : %sources%
echo %s% flags         : %flags%
echo.

for %%x in (%sources:~1,-1%) do (
  :: make the folder if doesn't exist
  set output_file=%out%\%%x.obj
  set input_file=%root%\%%x.cc
  for /f "tokens=1 delims=\" %%f in ("%%x") do if not exist %out%\%%f md %out%\%%f
  call %cc% %flags:~1,-1% -I%root% -Fo!output_file! !input_file! && (echo Success! %%x.obj) || (exit /b 1)
)

:: get absolute path from script directory
:relative_script
for /f "delims=" %%f in ("%~dp0%2") do set "%1=%%~ff"
exit /b 0

:: get absolute path from working directory
:relative_cwd
for /f "delims=" %%f in ("%cd%\%2") do set "%1=%%~ff"
exit /b 0
