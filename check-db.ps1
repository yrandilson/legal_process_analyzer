# Script para verificar banco de dados MySQL
# Execute: .\check-db.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Verificador de Banco de Dados" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Solicitar senha do MySQL
$password = Read-Host "Digite a senha do MySQL (root)" -AsSecureString
$plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToCoTaskMemUnicode($password))

# Comando SQL para verificar tudo
$sqlCommands = @"
-- Mostrar bancos de dados
SHOW DATABASES;

-- Usar banco do projeto
USE legal_process_analyzer;

-- Mostrar tabelas
SHOW TABLES;

-- Contar registros em cada tabela
SELECT 'users' as tabela, COUNT(*) as total FROM users
UNION ALL
SELECT 'processes', COUNT(*) FROM processes
UNION ALL
SELECT 'documents', COUNT(*) FROM documents
UNION ALL
SELECT 'deadlines', COUNT(*) FROM deadlines
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'auditLogs', COUNT(*) FROM auditLogs;

-- Ver últimos documentos
SELECT 'ÚLTIMOS DOCUMENTOS:' as info;
SELECT id, processId, fileName, status, createdAt FROM documents ORDER BY id DESC LIMIT 5;

-- Ver últimos processos
SELECT 'ÚLTIMOS PROCESSOS:' as info;
SELECT id, processNumber, clientName, createdAt FROM processes ORDER BY id DESC LIMIT 5;
"@

# Salvar comandos em arquivo temporário
$tempFile = [System.IO.Path]::GetTempFileName()
$sqlCommands | Out-File -FilePath $tempFile -Encoding UTF8

Write-Host "Conectando ao MySQL..." -ForegroundColor Yellow
Write-Host ""

# Executar MySQL
try {
    mysql -u root -p$plainPassword -e "source $tempFile" 2>&1
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ✅ Banco de dados verificado!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
}
catch {
    Write-Host "❌ Erro ao conectar ao MySQL" -ForegroundColor Red
    Write-Host "Verifique se:" -ForegroundColor Yellow
    Write-Host "  1. MySQL está rodando" -ForegroundColor Yellow
    Write-Host "  2. Usuário 'root' existe" -ForegroundColor Yellow
    Write-Host "  3. Senha está correta" -ForegroundColor Yellow
}

# Limpar arquivo temporário
Remove-Item $tempFile -Force -ErrorAction SilentlyContinue

Write-Host ""
Read-Host "Pressione Enter para sair"
