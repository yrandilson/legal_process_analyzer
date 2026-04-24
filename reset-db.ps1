# Script para resetar banco de dados MySQL
# Execute como Administrador: .\reset-db.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Resetador de Banco de Dados" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Solicitar senha do MySQL
$password = Read-Host "Digite a senha do MySQL (root)" -AsSecureString
$plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToCoTaskMemUnicode($password))

# SQL para resetar banco
$sqlCommands = @"
DROP DATABASE IF EXISTS legal_process_analyzer;
CREATE DATABASE legal_process_analyzer;
USE legal_process_analyzer;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  openId VARCHAR(64) NOT NULL UNIQUE,
  name TEXT,
  email VARCHAR(320),
  loginMethod VARCHAR(64),
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  lastSignedIn TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE processes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  processNumber VARCHAR(50) NOT NULL,
  clientName VARCHAR(255) NOT NULL,
  court VARCHAR(255),
  judge VARCHAR(255),
  plaintiff VARCHAR(255),
  defendant VARCHAR(255),
  subject TEXT,
  status ENUM('active', 'archived', 'concluded') NOT NULL DEFAULT 'active',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  processId INT NOT NULL,
  fileName VARCHAR(255) NOT NULL,
  fileKey VARCHAR(512) NOT NULL,
  fileUrl TEXT NOT NULL,
  fileSize INT,
  mimeType VARCHAR(50),
  extractedText TEXT,
  summary TEXT,
  entities TEXT,
  processedAt TIMESTAMP,
  status ENUM('uploaded', 'processing', 'processed', 'failed') NOT NULL DEFAULT 'uploaded',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (processId) REFERENCES processes(id) ON DELETE CASCADE
);

CREATE TABLE deadlines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  processId INT NOT NULL,
  type VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  originalDate TIMESTAMP NOT NULL,
  calculatedDate TIMESTAMP NOT NULL,
  businessDaysCount INT NOT NULL,
  status ENUM('pending', 'notified', 'completed', 'overdue') NOT NULL DEFAULT 'pending',
  urgency ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
  notificationSent INT DEFAULT 0,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (processId) REFERENCES processes(id) ON DELETE CASCADE
);

CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  deadlineId INT NOT NULL,
  type ENUM('email', 'in-app', 'sms') NOT NULL DEFAULT 'in-app',
  message TEXT NOT NULL,
  daysBeforeDeadline INT NOT NULL,
  scheduledFor TIMESTAMP NOT NULL,
  sentAt TIMESTAMP,
  status ENUM('pending', 'sent', 'failed') NOT NULL DEFAULT 'pending',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (deadlineId) REFERENCES deadlines(id) ON DELETE CASCADE
);

CREATE TABLE auditLogs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity VARCHAR(50) NOT NULL,
  entityId INT NOT NULL,
  oldValues JSON,
  newValues JSON,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO users (openId, name, email, loginMethod, role) 
VALUES ('test-user-1', 'Advogado Teste', 'teste@exemplo.com', 'local', 'user');

SHOW TABLES;
SELECT COUNT(*) as total_users FROM users;
"@

Write-Host "Conectando ao MySQL..." -ForegroundColor Yellow
Write-Host ""

try {
    # Executar MySQL com comandos SQL
    $sqlCommands | mysql -u root -p$plainPassword 2>&1
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ✅ Banco de dados resetado!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Tabelas criadas com sucesso!" -ForegroundColor Green
    Write-Host "Usuário de teste criado:" -ForegroundColor Green
    Write-Host "  Email: teste@exemplo.com" -ForegroundColor Green
    Write-Host "  Senha: senha123" -ForegroundColor Green
}
catch {
    Write-Host "❌ Erro ao conectar ao MySQL" -ForegroundColor Red
    Write-Host "Verifique se:" -ForegroundColor Yellow
    Write-Host "  1. MySQL está rodando" -ForegroundColor Yellow
    Write-Host "  2. Usuário 'root' existe" -ForegroundColor Yellow
    Write-Host "  3. Senha está correta" -ForegroundColor Yellow
}

Write-Host ""
Read-Host "Pressione Enter para sair"
