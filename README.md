# Aconchego API - Backend

Backend REST API desenvolvido para suportar o frontend do Aconchego App, desenvolvido como Trabalho de Conclusão de Curso (TCC).

## 📋 Visão Geral

O Aconchego API é uma aplicação backend que oferece:

- **API REST** para gerenciamento de aulas, eventos e notícias
- **Sistema de autenticação** com JWT
- **Gerenciamento de feedback** de alunos
- **Controle de frequência** por aula
- **Sistema de recorrência** para aulas

## 🎨 Frontend

> **📌 Importante:** Este repositório contém apenas o **backend** da aplicação. O frontend está disponível em um repositório separado: **[aconchego-app](https://github.com/leobritto95/aconchego-backend)**.

## 🛠️ Tecnologias

- **Express.js** - Framework web
- **TypeScript** - Tipagem estática
- **Prisma** - ORM para MongoDB
- **MongoDB** - Banco de dados NoSQL
- **JWT** - Autenticação
- **bcryptjs** - Hash de senhas
- **Docker** - Containerização do MongoDB

## 🚀 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** (versão 18 ou superior)
- **npm**, **yarn** ou **bun** (gerenciador de pacotes)
- **Docker** e **Docker Compose** (para MongoDB via Docker) ou **MongoDB** instalado localmente

## 📦 Instalação

### 1. Clonar o repositório

```bash
git clone <url-do-repositorio>
cd backend-api
```

### 2. Instalar dependências

```bash
npm install
# ou
yarn install
```

### 3. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
PORT=3000
DATABASE_URL="mongodb://root:password@localhost:27018/aconchego?replicaSet=replicaset&authSource=admin"
JWT_SECRET="sua-chave-secreta-super-segura-aqui"
```

### 4. Iniciar MongoDB com Docker

```bash
docker-compose up -d
```

### 5. Gerar Prisma Client

```bash
npm run prisma:generate
```

## ▶️ Como Executar

### Desenvolvimento

```bash
npm run dev
```

O servidor será iniciado em `http://localhost:3000` (ou na porta configurada no `.env`)

### Produção

```bash
npm run build
npm start
```

## 🔐 Autenticação

A API usa JWT (JSON Web Tokens) para autenticação. Rotas protegidas requerem o header:

```
Authorization: Bearer <token>
```

Para obter um token, faça login através do endpoint `/api/auth/login`.

### Perfis de Usuário

- **STUDENT** - Aluno: visualiza aulas, eventos e pode enviar feedbacks
- **TEACHER** - Professor: gerencia aulas e visualiza feedbacks dos alunos
- **SECRETARY** - Secretário: acesso administrativo limitado
- **ADMIN** - Administrador: acesso completo ao sistema
