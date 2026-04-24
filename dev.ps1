# Script para iniciar o servidor de desenvolvimento no Windows
# Use: .\dev.ps1

Write-Host "🚀 Iniciando Analisador de Processos e Prazos..." -ForegroundColor Green
Write-Host "📍 Acesse em: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""

# Definir variável de ambiente
$env:NODE_ENV="development"

# Iniciar servidor
.\node_modules\.bin\tsx watch server/_core/index.ts
