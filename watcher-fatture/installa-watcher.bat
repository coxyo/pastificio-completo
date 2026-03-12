@echo off
REM installa-watcher.bat
REM Installa e avvia il watcher fatture come servizio Windows
REM Eseguire come AMMINISTRATORE

echo ============================================
echo  INSTALLAZIONE WATCHER FATTURE DANEA
echo  Pastificio Nonna Claudia
echo ============================================
echo.

REM Imposta la cartella del watcher
set WATCHER_DIR=C:\Users\coxyo\pastificio-completo\watcher-fatture

echo [1/5] Creazione cartella watcher...
mkdir "%WATCHER_DIR%" 2>nul
echo     OK: %WATCHER_DIR%
echo.

echo [2/5] Copia file watcher...
copy /Y "%~dp0fatture-watcher.js" "%WATCHER_DIR%\fatture-watcher.js"
copy /Y "%~dp0package.json" "%WATCHER_DIR%\package.json"
echo     OK
echo.

echo [3/5] Installazione dipendenze Node.js...
cd /d "%WATCHER_DIR%"
npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERRORE: npm install fallito. Assicurati che Node.js sia installato.
    pause
    exit /b 1
)
echo     OK
echo.

echo [4/5] Installazione come servizio Windows (node-windows)...
npm install -g node-windows
node -e "
const Service = require('node-windows').Service;
const svc = new Service({
  name: 'PastificioFattureWatcher',
  description: 'Watcher automatico fatture XML Danea - Pastificio Nonna Claudia',
  script: '%WATCHER_DIR%\\fatture-watcher.js',
  nodeOptions: []
});
svc.on('install', function() {
  console.log('Servizio installato. Avvio...');
  svc.start();
});
svc.on('start', function() {
  console.log('Servizio avviato con successo!');
});
svc.on('error', function(err) {
  console.error('Errore:', err);
});
svc.install();
"
echo.

echo [5/5] Creazione cartella fatture...
mkdir "C:\Users\coxyo\pastificio-completo\Fatture" 2>nul
mkdir "C:\Users\coxyo\pastificio-completo\Fatture\processati" 2>nul
echo     OK
echo.

echo ============================================
echo  INSTALLAZIONE COMPLETATA!
echo ============================================
echo.
echo  Il servizio "PastificioFattureWatcher" e' ora attivo.
echo  Partira' automaticamente ad ogni avvio del PC.
echo.
echo  Per usarlo:
echo  - Copia i file XML da Danea in:
echo    C:\Users\coxyo\pastificio-completo\Fatture
echo  - Il watcher li processerà automaticamente
echo  - I file processati vanno in: Fatture\processati\
echo  - Log in: %WATCHER_DIR%\watcher.log
echo.
echo  Comandi utili (come amministratore):
echo  - Stato servizio: sc query PastificioFattureWatcher
echo  - Stop:  sc stop PastificioFattureWatcher
echo  - Start: sc start PastificioFattureWatcher
echo.
pause