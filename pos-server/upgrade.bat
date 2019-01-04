@echo off
set rootPath=%cd%
set tmpPath=%rootPath%\..\tmp
set tmpPathSource=%tmpPath%\RestoPlus

xcopy %tmpPathSource% %rootPath% /y /h /r
rmdir /s /q %tmpPath%
start resto.exe


