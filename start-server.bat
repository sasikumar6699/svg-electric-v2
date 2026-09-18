@echo off
title SVG Electric - Estimation Management System
cd /d %~dp0
echo ====================================================
echo Starting SVG Electric Estimation Management System...
echo ====================================================
echo Server will be available at: http://localhost:3000
echo.
set NODE_TLS_REJECT_UNAUTHORIZED=0
npm run dev
pause
