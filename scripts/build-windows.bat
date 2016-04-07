cd ..
set root=%CD%
cd scripts

set out_debug=%root%\scripts\out_win\debug
set project=zenzic
if not exist "%out_debug%\%project%" mkdir "%out_debug%\%project%"
set package=%root%\%project%
set flags=-EHsc -I%root% -WX -D "_MBCS" -c
set cc=cl

# /GS /analyze- /ZI /Gm /Od
# /Fd"Debug\vc140.pdb"
# /D "WIN32" /D "_DEBUG" 
# /WX- /RTC1 /Gd /Oy- /MDd 

set src=(main pipe child_process)

for %%x in %src% do (
  %cc% %flags% -Fo%out_debug%\%project%\%%x.obj %package%\%%x.cc && (echo Success!) || (exit /b 1)
)

@ECHO OFF &SETLOCAL
set outputs=

for %%x in %src% do (
  call set "outputs=%%outputs%% %out_debug%\%project%\%%x.obj"
)

link %outputs% user32.lib -out:%out_debug%\%project%\main.exe

echo Success!
