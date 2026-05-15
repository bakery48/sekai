@echo off
chcp 65001 > nul
echo [1/3] shared をビルド中...
cd packages\shared
node ..\..\node_modules\typescript\bin\tsc
if errorlevel 1 ( echo shared のビルドに失敗しました & pause & exit /b 1 )

echo [2/3] client をビルド中...
cd ..\client
call npm run build
if errorlevel 1 ( echo client のビルドに失敗しました & pause & exit /b 1 )

echo [3/3] server をビルド中...
cd ..\server
node ..\..\node_modules\typescript\bin\tsc
if errorlevel 1 ( echo server のビルドに失敗しました & pause & exit /b 1 )

cd ..\..
echo.
echo ビルド完了！npm start で起動できます。
pause
