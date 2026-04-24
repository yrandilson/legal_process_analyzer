-- Script para resetar banco de dados
-- Execute como: mysql -u root -p < reset-db.sql

-- Dropar banco existente
DROP DATABASE IF EXISTS legal_process_analyzer;

-- Criar novo banco
CREATE DATABASE legal_process_analyzer;
USE legal_process_analyzer;

-- Tabela users
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

-- Tabela processes
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

-- Tabela documents
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

-- Tabela deadlines
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

-- Tabela notifications
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

-- Tabela auditLogs
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

-- Criar usuário de teste
INSERT INTO users (openId, name, email, loginMethod, role) 
VALUES ('test-user-1', 'Advogado Teste', 'teste@exemplo.com', 'local', 'user');

-- Mostrar tabelas criadas
SHOW TABLES;
SELECT COUNT(*) as total_users FROM users;
