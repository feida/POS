@Echo Off
echo �޸� RestoPos �޷������������⣿
Echo wscript.Echo MsgBox ("�޸� RestoPos �޷������������⣿", 36, "��ʾ")>tmp.vbs
For /f %%i in ('cscript /nologo tmp.vbs') do If %%i==6 goto kill
echo ȡ���޸���
Del /q tmp.vbs
ping -n 2 127.1>nul
exit

:kill
echo �����޸���...
taskkill /f /im resto*
taskkill /f /im nwjs*
Del /q tmp.vbs
echo �޸��ɹ�...
ping -n 2 127.1>nul
exit