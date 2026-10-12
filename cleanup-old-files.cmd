@echo off
rem Removes the old pre-i18n files that now clash with src\app\[locale].
cd /d "%~dp0"
del /f /q src\app\layout.tsx src\app\page.tsx
rmdir /s /q src\app\login
rmdir /s /q src\app\dashboard
rmdir /s /q src\lib\supabase
rmdir /s /q .next
echo.
echo Contents of src\app (expected: [locale], api, auth, favicon.ico, globals.css, icon.svg):
dir /b src\app
echo.
pause
