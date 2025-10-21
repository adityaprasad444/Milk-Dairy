@echo off
REM Choreo Deployment Preparation Script for Windows
REM This script prepares your Milk Dairy Management System for Choreo deployment

echo 🚀 Preparing Milk Dairy Management System for Choreo Deployment
echo ==============================================================

REM Check if we're in the right directory
if not exist "server\package.json" (
    echo ❌ Error: server\package.json not found
    echo Please run this script from the root directory of your project
    pause
    exit /b 1
)

if not exist "client\package.json" (
    echo ❌ Error: client\package.json not found
    echo Please run this script from the root directory of your project
    pause
    exit /b 1
)

echo ✅ Project structure verified

REM Check if Git is initialized
if not exist ".git" (
    echo 📦 Initializing Git repository...
    git init
    git add .
    git commit -m "Initial commit - Milk Dairy Management System"
    echo ✅ Git repository initialized
) else (
    echo ✅ Git repository already exists
)

REM Create .gitignore if it doesn't exist
if not exist ".gitignore" (
    echo 📝 Creating .gitignore file...
    (
        echo # Dependencies
        echo node_modules/
        echo */node_modules/
        echo.
        echo # Environment variables
        echo .env
        echo .env.local
        echo .env.development.local
        echo .env.test.local
        echo .env.production.local
        echo.
        echo # Logs
        echo logs
        echo *.log
        echo npm-debug.log*
        echo yarn-debug.log*
        echo yarn-error.log*
        echo.
        echo # Build outputs
        echo dist/
        echo build/
        echo.
        echo # IDE files
        echo .vscode/
        echo .idea/
        echo *.swp
        echo *.swo
        echo.
        echo # OS generated files
        echo .DS_Store
        echo Thumbs.db
    ) > .gitignore
    echo ✅ .gitignore file created
)

REM Verify all required files exist
echo 🔍 Verifying deployment files...

set "missing_files="

if not exist "server\.choreo\component.yaml" set "missing_files=%missing_files% server\.choreo\component.yaml"
if not exist "server\.choreo\endpoints.yaml" set "missing_files=%missing_files% server\.choreo\endpoints.yaml"
if not exist "server\Dockerfile" set "missing_files=%missing_files% server\Dockerfile"
if not exist "client\.choreo\component.yaml" set "missing_files=%missing_files% client\.choreo\component.yaml"
if not exist "client\.choreo\endpoints.yaml" set "missing_files=%missing_files% client\.choreo\endpoints.yaml"
if not exist "client\Dockerfile" set "missing_files=%missing_files% client\Dockerfile"
if not exist "client\nginx.conf" set "missing_files=%missing_files% client\nginx.conf"
if not exist ".choreoignore" set "missing_files=%missing_files% .choreoignore"
if not exist "DEPLOYMENT.md" set "missing_files=%missing_files% DEPLOYMENT.md"

if "%missing_files%"=="" (
    echo ✅ All required deployment files are present
) else (
    echo ❌ Missing required files:
    echo %missing_files%
    echo Please ensure all files are created before deployment
    pause
    exit /b 1
)

echo 📦 Checking package.json files...
echo ✅ Server package.json found
echo ✅ Client package.json found

echo.
echo 🎉 Deployment preparation complete!
echo.
echo Next steps:
echo 1. Push your code to GitHub:
echo    git add .
echo    git commit -m "Prepare for Choreo deployment"
echo    git remote add origin https://github.com/yourusername/your-repo.git
echo    git push -u origin main
echo.
echo 2. Follow the detailed deployment guide in DEPLOYMENT.md
echo.
echo 3. Key URLs after deployment:
echo    - Backend API: https://your-backend-url/api
echo    - API Documentation: https://your-backend-url/api-docs
echo    - Health Check: https://your-backend-url/api/health
echo    - Frontend App: https://your-frontend-url
echo.
echo 📚 For detailed instructions, see DEPLOYMENT.md
echo 🆘 For support, visit: https://wso2.com/choreo/docs/
echo.
pause