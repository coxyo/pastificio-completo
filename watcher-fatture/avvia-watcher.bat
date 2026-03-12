@echo off
REM avvia-watcher.bat
REM Avvio manuale del watcher (senza installare come servizio)
REM Utile per test. Tienilo aperto nel background.

set WATCHER_DIR=C:\Users\coxyo\pastificio-completo\watcher-fatture

echo ============================================
echo  WATCHER FATTURE DANEA - AVVIO MANUALE
echo  Pastificio Nonna Claudia
echo ============================================
echo.
echo  Cartella monitorata:
echo  C:\Users\coxyo\pastificio-completo\Fatture
echo.
echo  Copia qui i file XML da Danea EasyFatt.
echo  NON chiudere questa finestra!
echo.
echo ============================================
echo.

cd /d "%WATCHER_DIR%"

REM Controlla che npm install sia stato fatto
if not exist "node_modules" (
    echo Installazione dipendenze in corso...
    npm install
    echo.
)

node fatture-watcher.js

pause