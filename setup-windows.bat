@echo off
setlocal
cd /d "%~dp0"
echo === Swazei POS setup ===
where node >nul 2>nul || (echo ERROR: Node.js is missing. Install Node.js LTS from https://nodejs.org/en/download & pause & exit /b 1)
where npm >nul 2>nul || (echo ERROR: npm is missing. Reinstall Node.js LTS & pause & exit /b 1)
where docker >nul 2>nul || (echo ERROR: Docker Desktop is missing. Install it from https://www.docker.com/products/docker-desktop/ OR install PostgreSQL locally. & pause & exit /b 1)
if not exist .env copy .env.example .env
echo Starting PostgreSQL and Redis containers. Make sure Docker Desktop is open...
docker compose up -d
if errorlevel 1 (echo ERROR: Docker services did not start. Open Docker Desktop and try again. & pause & exit /b 1)
echo Installing Node dependencies. This may take a few minutes...
npm install
if errorlevel 1 (echo ERROR: npm install failed. Check internet connection and Node.js installation. & pause & exit /b 1)
echo Generating Prisma client...
npx prisma generate
if errorlevel 1 (echo ERROR: Prisma client generation failed. & pause & exit /b 1)
echo Creating database tables...
npx prisma migrate dev --name init
if errorlevel 1 (echo ERROR: Migration failed. Check DATABASE_URL in .env and ensure PostgreSQL is running. & pause & exit /b 1)
echo Adding demo data...
npm run db:seed
if errorlevel 1 (echo ERROR: Seed failed. Review the error above. & pause & exit /b 1)
echo.
echo Setup completed. Start the app with: npm run start:dev
echo Then open: http://localhost:3000/api/docs
echo Demo login: owner@example.com / DemoPass123!
pause
