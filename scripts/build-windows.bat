cd ..
set root=%CD%
cd scripts

set out_debug=%root%\scripts\out_win\debug
set project=zenzic
if not exist "%out_debug%\%project%" mkdir "%out_debug%\%project%"
set package=%root%\%project%
set flags=-EHsc -I%root% -WX -c
set cc=cl

set src=(main pipe child_process)

for %%x in %src% do (
  %cc% %flags% -Fo%out_debug%\%project%\%%x.obj %package%\%%x.cc && (echo Success!) || (exit /b 1)
)

@ECHO OFF &SETLOCAL
set outputs=

for %%x in %src% do (
  call set "outputs=%%outputs%% %out_debug%\%project%\%%x.obj"
)

echo %outputs%

link %outputs% -out:%out_debug%\%project%\main.exe
