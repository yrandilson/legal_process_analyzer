# Analisador de Processos e Prazos - Documentação Completa

## 📋 Visão Geral

O **Sentinela de Prazos** é uma plataforma inteligente de gerenciamento de processos jurídicos que automatiza a análise de publicações de tribunais, extrai prazos processuais e gerencia alertas com precisão forense.

---

## 🎯 Funcionalidades Principais

### 1. **Upload e Processamento de PDFs**
- Envio de publicações do Diário Oficial e intimações judiciais
- Suporte a drag-and-drop para facilitar upload
- Validação automática de arquivos PDF
- Armazenamento seguro em S3

**Como usar:**
1. Clique em "Novo Documento" no dashboard
2. Preencha o número do processo e nome do cliente
3. Arraste o PDF ou clique para selecionar
4. Clique em "Enviar Documento"

### 2. **Extração Inteligente com IA**
- Extração automática de entidades jurídicas (NER)
  - Número do processo
  - Partes (autor e réu)
  - Juiz responsável
  - Tribunal/Vara
  - Tipo de movimentação

**Prompts Utilizados:**
```
Sistema analisa o documento e extrai:
- Informações processuais (número, partes, juiz)
- Tipo de movimentação (sentença, despacho, intimação)
- Data de publicação
```

### 3. **Identificação Automática de Prazos**
- Detecção de todos os prazos mencionados no documento
- Classificação por tipo (contestação, recurso, manifestação, etc.)
- Cálculo de dias úteis conforme CPC

**Tipos de Prazos Identificados:**
- Contestação (15 dias úteis)
- Recurso (15 dias úteis)
- Manifestação (5 dias úteis)
- Interposição de Agravo
- Cumprimento de Sentença

### 4. **Cálculo Inteligente de Dias Úteis**
- Considera feriados brasileiros fixos:
  - Ano Novo (01/01)
  - Tiradentes (21/04)
  - Dia do Trabalho (01/05)
  - Independência (07/09)
  - Nossa Senhora Aparecida (12/10)
  - Finados (02/11)
  - Consciência Negra (20/11)
  - Natal (25/12)

- Feriados móveis:
  - Sexta-feira Santa
  - Carnaval
  - Corpus Christi

**Exemplo:**
```
Prazo: 15 dias úteis a partir de 02/04/2026 (quarta-feira)
Cálculo:
- 02/04 (quinta) - dia 1
- 03/04 (sexta) - dia 2
- 06/04 (segunda) - dia 3 (pula fim de semana)
- ... até dia 15
Resultado: 23/04/2026
```

### 5. **Dashboard com Visualização de Prazos**
- Estatísticas em tempo real:
  - Processos ativos
  - Prazos críticos (vencendo hoje/amanhã)
  - Próximos 7 dias
  - Documentos processados

- Filtros por:
  - Urgência (crítico, alto, médio, baixo)
  - Tipo de prazo
  - Status (pendente, notificado, concluído, vencido)

- Busca por:
  - Número do processo
  - Nome do cliente
  - Tipo de prazo

### 6. **Sistema de Alertas por Urgência**

| Urgência | Dias Úteis | Cor | Ação |
|----------|-----------|-----|------|
| Crítico | ≤ 1 dia | 🔴 Vermelho | Notificação imediata |
| Alto | 2-3 dias | 🟠 Laranja | Notificação urgente |
| Médio | 4-7 dias | 🟡 Amarelo | Notificação padrão |
| Baixo | > 7 dias | 🟢 Verde | Monitoramento |

### 7. **Resumo em Linguagem Simples**
- Tradução automática do "juridiquês" para linguagem acessível
- Explicação clara do que aconteceu no processo
- Indicação de ações necessárias
- Compartilhável com clientes

**Exemplo:**
```
Documento Original:
"Intimação para que a parte autora manifeste-se no prazo de 5 dias 
úteis acerca da contestação apresentada pela parte ré."

Resumo para Cliente:
"O tribunal pediu para você responder a defesa do outro lado. 
Você tem 5 dias úteis (não contando fins de semana) para enviar 
sua resposta. Isso é importante para não perder o prazo!"
```

### 8. **Chatbot com IA**
- Assistente jurídico disponível 24/7
- Respostas a perguntas sobre:
  - Status dos processos
  - Prazos próximos
  - Recomendações de ações
  - Histórico de documentos

**Como usar:**
1. Clique no ícone de chat (canto inferior direito)
2. Faça sua pergunta
3. Receba resposta baseada em IA

**Exemplos de Perguntas:**
- "Quais são meus prazos críticos?"
- "Quando vence o prazo do processo #0000001?"
- "Quantos documentos ainda não foram processados?"

### 9. **Notificações Automáticas**
- Email e notificações in-app
- Alertas em 3 momentos:
  - **3 dias antes:** Preparação
  - **1 dia antes:** Urgência
  - **No dia:** Crítico

**Configuração:**
- Tipo: Email, In-app ou Ambos
- Frequência: Automática baseada em urgência
- Personalizável por tipo de prazo

### 10. **Histórico e Reprocessamento**
- Registro completo de todos os documentos analisados
- Data e hora de processamento
- Informações extraídas
- Resumo gerado
- Possibilidade de reprocessar com novos prompts

---

## 🏗️ Arquitetura Técnica

### Stack Tecnológico

**Frontend:**
- React 19 com TypeScript
- Tailwind CSS 4 para estilização elegante
- tRPC para comunicação com backend
- Componentes shadcn/ui para UI consistente

**Backend:**
- Express.js 4 com TypeScript
- tRPC 11 para APIs type-safe
- Drizzle ORM para gerenciamento de banco de dados
- FastAPI (Python) para processamento de IA

**Banco de Dados:**
- MySQL/TiDB para dados estruturados
- Tabelas: processes, deadlines, documents, notifications, auditLogs

**Integrações:**
- OpenAI LLM para análise de documentos
- S3 para armazenamento de PDFs
- SMTP para envio de emails

### Estrutura de Dados

#### Tabela: processes
```sql
- id: INT (PK)
- userId: INT (FK)
- processNumber: VARCHAR(50)
- clientName: VARCHAR(255)
- court: VARCHAR(255)
- judge: VARCHAR(255)
- plaintiff: VARCHAR(255)
- defendant: VARCHAR(255)
- subject: TEXT
- status: ENUM('active', 'archived', 'concluded')
- createdAt: TIMESTAMP
- updatedAt: TIMESTAMP
```

#### Tabela: deadlines
```sql
- id: INT (PK)
- processId: INT (FK)
- type: VARCHAR(100) - ex: "contestação", "recurso"
- description: TEXT
- originalDate: TIMESTAMP
- calculatedDate: TIMESTAMP
- businessDaysCount: INT
- status: ENUM('pending', 'notified', 'completed', 'overdue')
- urgency: ENUM('low', 'medium', 'high', 'critical')
- notificationSent: INT
- createdAt: TIMESTAMP
- updatedAt: TIMESTAMP
```

#### Tabela: documents
```sql
- id: INT (PK)
- processId: INT (FK)
- fileName: VARCHAR(255)
- fileKey: VARCHAR(512) - S3 key
- fileUrl: TEXT - S3 URL
- fileSize: INT
- mimeType: VARCHAR(50)
- extractedText: TEXT
- summary: TEXT
- entities: TEXT (JSON)
- processedAt: TIMESTAMP
- status: ENUM('uploaded', 'processing', 'processed', 'failed')
- createdAt: TIMESTAMP
- updatedAt: TIMESTAMP
```

#### Tabela: notifications
```sql
- id: INT (PK)
- userId: INT (FK)
- deadlineId: INT (FK)
- type: ENUM('email', 'in_app', 'both')
- daysBeforeDeadline: INT
- message: TEXT
- emailSent: INT
- inAppSent: INT
- sentAt: TIMESTAMP
- status: ENUM('pending', 'sent', 'failed')
- createdAt: TIMESTAMP
- updatedAt: TIMESTAMP
```

---

## 🔐 Segurança e Conformidade

### LGPD (Lei Geral de Proteção de Dados)
- ✅ Consentimento explícito para armazenamento de dados
- ✅ Direito ao esquecimento implementado
- ✅ Criptografia de dados sensíveis
- ✅ Auditoria de acessos (auditLogs)

### Armazenamento Seguro
- PDFs armazenados em S3 com criptografia
- Acesso restrito por autenticação OAuth
- Presigned URLs com expiração
- Backup automático

### Autenticação
- OAuth 2.0 via Manus
- Sessões seguras com JWT
- Cookies HttpOnly
- CSRF protection

---

## 🚀 Como Usar o Sistema

### 1. Primeiro Acesso
```
1. Acesse: https://seu-dominio.manus.space
2. Clique em "Entrar"
3. Autentique com suas credenciais
4. Você será redirecionado para o Dashboard
```

### 2. Enviar Primeiro Documento
```
1. Clique em "Novo Documento"
2. Preencha:
   - Número do Processo: 0000001-00.0000.0.00.0000
   - Nome do Cliente: João Silva
3. Arraste o PDF ou clique para selecionar
4. Clique em "Enviar Documento"
5. Aguarde o processamento (2-5 segundos)
6. Você será redirecionado para o Dashboard
```

### 3. Visualizar Prazos
```
1. No Dashboard, você verá:
   - Estatísticas em cards
   - Lista de prazos com urgência
   - Filtros por urgência e tipo
2. Clique em um prazo para ver detalhes
3. Use a busca para encontrar processos específicos
```

### 4. Usar o Chatbot
```
1. Clique no ícone de chat (canto inferior direito)
2. Faça sua pergunta
3. Exemplos:
   - "Quais prazos vencem esta semana?"
   - "Resumo do processo #0000001"
   - "Próximas ações recomendadas"
```

### 5. Gerenciar Notificações
```
1. Vá para Configurações
2. Escolha tipo de notificação:
   - Email
   - In-app
   - Ambos
3. Configure dias de antecedência:
   - 3 dias antes
   - 1 dia antes
   - No dia do vencimento
```

---

## 📊 Exemplos de Uso

### Cenário 1: Advogado com Múltiplos Processos
```
Problema: Gerenciar 50+ processos manualmente é impossível

Solução com Sentinela:
1. Upload automático de publicações diárias
2. Extração automática de prazos
3. Alertas visuais por urgência
4. Dashboard centralizado
5. Notificações automáticas

Resultado: Redução de 80% do tempo de gerenciamento
```

### Cenário 2: Comunicação com Cliente
```
Documento Jurídico (confuso):
"Intimação para manifestação acerca da petição inicial 
no prazo de 15 dias úteis conforme artigo 335 do CPC."

Resumo Gerado (claro):
"O tribunal pediu para você responder à petição inicial 
do outro lado. Você tem 15 dias úteis (não contando 
fins de semana e feriados) para enviar sua resposta."

Cliente entende e se sente informado ✓
```

### Cenário 3: Alerta de Prazo Crítico
```
Prazo: Contestação vence em 2 dias úteis
Status: CRÍTICO (cor vermelha)

Ações Automáticas:
1. Email enviado para advogado
2. Notificação in-app
3. Destaque no Dashboard
4. Sugestão no Chatbot

Resultado: Prazo não é perdido ✓
```

---

## 🔧 Configuração e Deployment

### Variáveis de Ambiente Necessárias
```env
# Banco de Dados
DATABASE_URL=mysql://user:password@host:3306/database

# OAuth
VITE_APP_ID=seu-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://login.manus.im

# LLM
BUILT_IN_FORGE_API_KEY=sua-chave-api
BUILT_IN_FORGE_API_URL=https://api.manus.im

# S3 Storage
AWS_ACCESS_KEY_ID=sua-chave
AWS_SECRET_ACCESS_KEY=sua-secret
AWS_REGION=us-east-1
AWS_BUCKET_NAME=seu-bucket

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASSWORD=sua-senha

# JWT
JWT_SECRET=sua-chave-secreta-segura
```

### Instalação Local

```bash
# 1. Clonar repositório
git clone https://github.com/seu-usuario/legal_process_analyzer.git
cd legal_process_analyzer

# 2. Instalar dependências
pnpm install

# 3. Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais

# 4. Executar migrações do banco
pnpm db:push

# 5. Iniciar servidor de desenvolvimento
pnpm dev

# 6. Acessar em http://localhost:3000
```

---

## 📈 Métricas e Monitoramento

### KPIs Rastreados
- Documentos processados por dia
- Tempo médio de processamento
- Taxa de sucesso na extração de prazos
- Prazos perdidos (zero é o objetivo)
- Satisfação do usuário

### Logs Disponíveis
- `.manus-logs/devserver.log` - Eventos do servidor
- `.manus-logs/browserConsole.log` - Erros do cliente
- `.manus-logs/networkRequests.log` - Requisições HTTP
- `.manus-logs/sessionReplay.log` - Interações do usuário

---

## 🐛 Troubleshooting

### Problema: PDF não é processado
**Solução:**
1. Verifique se o arquivo é PDF válido
2. Confirme que o tamanho é menor que 50MB
3. Tente reenviar o documento
4. Verifique logs em `.manus-logs/devserver.log`

### Problema: Prazo calculado incorretamente
**Solução:**
1. Verifique se a data original está correta
2. Confirme que o número de dias úteis é correto
3. Verifique calendário de feriados
4. Reprocesse o documento

### Problema: Notificação não chega
**Solução:**
1. Verifique configurações de notificação
2. Confirme email cadastrado
3. Verifique pasta de spam
4. Tente notificação in-app

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Consulte a documentação acima
2. Use o Chatbot para perguntas rápidas
3. Verifique os logs em `.manus-logs/`
4. Contate o suporte técnico

---

## 📝 Notas Importantes

- ⚠️ Sempre faça backup dos documentos importantes
- ⚠️ Verifique prazos críticos diariamente
- ⚠️ Não confie apenas no sistema - sempre valide manualmente
- ✅ O sistema é um assistente, não substitui o advogado
- ✅ Sempre mantenha registros de todos os prazos

---

**Versão:** 1.0.0  
**Última Atualização:** 02/04/2026  
**Status:** ✅ Produção
