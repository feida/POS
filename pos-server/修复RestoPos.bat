@Echo Off
echo 修复 RestoPos 无法正常启动问题？
Echo wscript.Echo MsgBox ("修复 RestoPos 无法正常启动问题？", 36, "提示")>tmp.vbs
For /f %%i in ('cscript /nologo tmp.vbs') do If %%i==6 goto kill
echo 取消修复！
Del /q tmp.vbs
ping -n 2 127.1>nul
exit

:kill
echo 正在修复中...
taskkill /f /im resto*
taskkill /f /im nwjs*
Del /q tmp.vbs
echo 修复成功...
ping -n 2 127.1>nul
exit