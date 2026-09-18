@echo off
echo ===================================================
echo SVG Electric Estimation System - Database Backup
echo ===================================================
set PGPASSWORD=postgres
set TIMESTAMP=%date:~10,4%-%date:~4,2%-%date:~7,2%_%time:~0,2%-%time:~3,2%-%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_DIR=%~dp0..\backups
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

set BACKUP_FILE=%BACKUP_DIR%\svg_electric_backup_%TIMESTAMP%.sql

echo Backing up database svg_electric_db to %BACKUP_FILE%...
"C:\Program Files\PostgreSQL\16\bin\pg_dump.exe" -U postgres -h 127.0.0.1 -p 5432 svg_electric_db > "%BACKUP_FILE%"

if %ERRORLEVEL% equ 0 (
    echo Backup completed successfully! File saved at %BACKUP_FILE%
) else (
    echo Backup failed with error code %ERRORLEVEL%
)
pause