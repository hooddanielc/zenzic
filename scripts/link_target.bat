@echo off
setlocal enableDelayedExpansion

set objs=
set argCount=0
set key=
set s=  
set cmd_objs=

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
echo %s% out           : %out%
echo %s% objs          : %objs%
echo %s% flags         : %flags%
echo %s% name          : %name%
echo.

for %%a in (%objs:~1,-1%) do call set "cmd_objs=%out%\%%a.obj %%cmd_objs%%"

echo "HOLY MOLY"
echo %cc% %cmd_objs% %flags:~1,-1% -out:%out%\%name%.exe

:: finally call link
call %cc% %cmd_objs% %flags:~1,-1% -out:%out%\%name%.exe && (echo Success! %name%.exe) || (echo FAILURE && exit /b 1)

:: get absolute path from working directory
:relative_cwd
for /f "delims=" %%f in ("%cd%\%2") do set "%1=%%~ff"
exit /b 0
