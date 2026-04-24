@echo off
REM Script para iniciar o servidor de desenvolvimento no Windows
REM Use: dev.bat

echo.
echo 🚀 Iniciando Analisador de Processos e Prazos...
echo 📍 Acesse em: http://localhost:3000
echo.

REM Definir variável de ambiente
set NODE_ENV=development

REM Iniciar servidor
.\node_modules\.bin\tsx watch server/_core/index.ts

pause
