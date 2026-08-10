@echo off
chcp 65001 > nul
cd /d "%~dp0"
echo ================================================
echo  検証用ビルド  ( stg.saigroupe.com へアップロード )
echo  ※ 本番用は build.bat を使ってください
echo ================================================
echo.
node build-dist.js --staging
echo.
if errorlevel 1 (
    echo エラーが発生しました。Node.js がインストールされているか確認してください。
) else (
    echo 完了しました。dist フォルダを開きます。
    start "" "%~dp0dist"
)
echo.
pause
