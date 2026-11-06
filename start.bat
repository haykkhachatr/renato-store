@echo off
rem Renato - local preview. Double-click this file, the site opens at http://localhost:8080/
rem (Opening index.html directly in the browser works too.)
cd /d "%~dp0"
start "" "http://localhost:8080/"
python -m http.server 8080 --bind 127.0.0.1
