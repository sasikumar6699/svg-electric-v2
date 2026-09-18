@echo off
echo ===================================================
echo SVG Electric Estimation System - Database Restore
echo ===================================================
if "%~1"=="" (
    echo Usage: restore-db.bat path_to_backup_file.sql
    pause
    exit /b 1
)

set PGPASSWORD=postgres
echo Restoring database svg_electric_db from %~1...
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -h 127.0.0.1 -p 5432 -d svg_electric_db -f "%~1"

if %ERRORLEVEL% equ 0 (
    echo Database restore completed successfully!
) else (
    echo Restore encountered errors.
)
pause