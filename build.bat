@echo off
chcp 65001 > nul
cd /d "%~dp0"
echo ============================================
echo  SAI サイト  アップロード用フォルダを作成中
echo ============================================
echo.
node build-dist.js
echo.
if errorlevel 1 (
    echo エラーが発生しました。Node.js がインストールされているか確認してください。
) else (
    echo 完了しました。dist フォルダを開きます。
    start "" "%~dp0dist"
)
echo.
pause
