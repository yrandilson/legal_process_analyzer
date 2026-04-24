# 🪟 Analisador de Processos e Prazos - Guia Windows

## ⚡ Início Rápido (Windows)

### 1️⃣ Instalar Dependências
```powershell
pnpm install
```

### 2️⃣ Iniciar Servidor - OPÇÃO A (Recomendado)
**Clique duplo em `dev.bat`** ou execute:
```powershell
.\dev.bat
```

### 2️⃣ Iniciar Servidor - OPÇÃO B (PowerShell)
```powershell
$env:NODE_ENV="development"; .\node_modules\.bin\tsx watch server/_core/index.ts
```

### 2️⃣ Iniciar Servidor - OPÇÃO C (PowerShell Script)
```powershell
.\dev.ps1
```

### 3️⃣ Acesse no Navegador
```
http://localhost:3000
```

---

## 🗄️ Configurar Banco de Dados

### Pré-requisitos:
- MySQL instalado e rodando
- Acesso ao MySQL via linha de comando

### Passos:

#### 1. Criar banco de dados
```powershell
mysql -u root -p -e "CREATE DATABASE legal_process_analyzer;"
```

#### 2. Criar arquivo `.env`
Na raiz do projeto, crie um arquivo `.env` com:

```env
DATABASE_URL=mysql://root:sua_senha@localhost:3306/legal_process_analyzer
JWT_SECRET=sua-chave-secreta-super-segura-aqui-12345
VITE_APP_ID=dev-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://login.manus.im
BUILT_IN_FORGE_API_KEY=dev-key
BUILT_IN_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=dev-key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
OWNER_NAME=Seu Nome
OWNER_OPEN_ID=seu-open-id
VITE_ANALYTICS_ENDPOINT=https://analytics.manus.im
VITE_ANALYTICS_WEBSITE_ID=seu-website-id
```

#### 3. Aplicar migrações
```powershell
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

---

## 🧪 Executar Testes

```powershell
pnpm test
```

---

## 🔨 Outros Comandos

| Comando | Descrição |
|---------|-----------|
| `pnpm dev` | Inicia servidor (pode não funcionar no Windows) |
| `.\dev.bat` | Inicia servidor (Windows - Recomendado) |
| `.\dev.ps1` | Inicia servidor (PowerShell) |
| `pnpm build` | Build para produção |
| `pnpm start` | Inicia servidor de produção |
| `pnpm check` | Verifica erros TypeScript |
| `pnpm test` | Executa testes |
| `pnpm format` | Formata código |

---

## 🐛 Troubleshooting

### Erro: "'cross-env' não é reconhecido"
**Solução:** Execute `pnpm install` novamente

### Erro: "NODE_ENV não é reconhecido"
**Solução:** Use `dev.bat` ou `dev.ps1` em vez de `pnpm dev`

### Erro: "Porta 3000 já está em uso"
**Solução:** Mude a porta no arquivo `server/_core/index.ts` ou encerre o processo que está usando a porta

### Erro: "Banco de dados não conecta"
**Solução:** Verifique se MySQL está rodando e se as credenciais no `.env` estão corretas

---

## 📁 Estrutura do Projeto

```
legal_process_analyzer/
├── client/              # Frontend React
├── server/              # Backend Express + tRPC
├── drizzle/             # Banco de dados
├── dev.bat              # Script para iniciar (Windows)
├── dev.ps1              # Script para iniciar (PowerShell)
├── package.json         # Dependências
├── .env                 # Variáveis de ambiente
└── README-WINDOWS.md    # Este arquivo
```

---

## ✅ Funcionalidades

- ✅ Upload de PDFs com drag-and-drop
- ✅ Extração automática de informações processuais
- ✅ Cálculo inteligente de dias úteis
- ✅ Dashboard com gráficos em tempo real
- ✅ Chatbot com IA
- ✅ Notificações automáticas
- ✅ Autenticação OAuth
- ✅ Banco de dados MySQL

---

## 🆘 Precisa de Ajuda?

Se tiver problemas:
1. Verifique se todas as dependências foram instaladas (`pnpm install`)
2. Verifique se o MySQL está rodando
3. Verifique se o arquivo `.env` está correto
4. Tente limpar o cache: `pnpm store prune`

---

**Versão:** 1.1.1  
**Data:** 02/04/2026  
**Status:** ✅ Pronto para Uso
