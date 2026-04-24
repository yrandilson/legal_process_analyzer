@echo off
REM Script para verificar banco de dados MySQL (requer admin)
REM Clique duplo para executar

echo.
echo ========================================
echo  Verificador de Banco de Dados MySQL
echo ========================================
echo.

REM Verificar se está rodando como admin
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [!] Este script precisa ser executado como ADMINISTRADOR
    echo.
    echo Reiniciando como Administrador...
    echo.
    powershell -Command "Start-Process cmd -ArgumentList '/c %~s0' -Verb RunAs"
    exit /b
)

REM Se chegou aqui, está como admin
echo [+] Executando como Administrador...
echo.

REM Executar comandos MySQL
mysql -u root -p -e "USE legal_process_analyzer; SHOW TABLES; SELECT 'users' as tabela, COUNT(*) as total FROM users UNION ALL SELECT 'processes', COUNT(*) FROM processes UNION ALL SELECT 'documents', COUNT(*) FROM documents UNION ALL SELECT 'deadlines', COUNT(*) FROM deadlines UNION ALL SELECT 'notifications', COUNT(*) FROM notifications UNION ALL SELECT 'auditLogs', COUNT(*) FROM auditLogs; SELECT 'ULTIMOS DOCUMENTOS:' as info; SELECT id, processId, fileName, status, createdAt FROM documents ORDER BY id DESC LIMIT 5; SELECT 'ULTIMOS PROCESSOS:' as info; SELECT id, processNumber, clientName, createdAt FROM processes ORDER BY id DESC LIMIT 5;"

echo.
echo ========================================
echo  [OK] Verificacao concluida!
echo ========================================
echo.

pause
