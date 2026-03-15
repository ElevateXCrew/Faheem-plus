@echo off
echo ========================================
echo Starting Development Environment
echo ========================================
echo.

REM Check if ngrok is installed
where ngrok >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: ngrok is not installed!
    echo Install it with: winget install ngrok.ngrok
    pause
    exit /b 1
)

echo [1/3] Starting Next.js development server...
start "Next.js Dev Server" cmd /k "bun run dev"
timeout /t 3 /nobreak >nul

echo [2/3] Starting ngrok tunnel...
start "Ngrok Tunnel" cmd /k "ngrok http 3000"
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Your public URL will be shown in the ngrok window
echo Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
echo.
echo Next Steps:
echo 1. Wait for ngrok to start (check the ngrok window)
echo 2. Copy your ngrok URL
echo 3. Update Stripe Dashboard webhook endpoint
echo 4. Test payment at: YOUR_NGROK_URL/pricing
echo.
echo Monitor webhooks at: http://localhost:4040
echo ========================================
echo.
pause
