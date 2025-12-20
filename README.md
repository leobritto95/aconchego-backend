# Aconchego API - Backend

Backend REST API desenvolvido para suportar o frontend do Aconchego App.

## 📋 Visão Geral

Este é um backend REST API desenvolvido com as seguintes tecnologias:

- **Express.js** - Framework web
- **Prisma** - ORM para MongoDB
- **MongoDB** - Banco de dados NoSQL
- **JWT** - Autenticação
- **TypeScript** - Tipagem estática

## 🚀 Como Iniciar o Projeto

### Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** (versão 18 ou superior)
- **npm** ou **bun** (gerenciador de pacotes)
- **Docker** e **Docker Compose** (para usar MongoDB via Docker) ou **MongoDB** (local ou remoto - MongoDB Atlas)

### Passo 1: Clonar o Repositório

```bash
git clone <url-do-repositorio>
cd backend-api
```

### Passo 2: Instalar Dependências

```bash
npm install
```

ou se estiver usando bun:

```bash
bun install
```

### Passo 3: Iniciar o MongoDB com Docker (Recomendado)

O projeto inclui um `docker-compose.yml` configurado com MongoDB em modo replica set, necessário para o Prisma funcionar corretamente.

Para iniciar o MongoDB:

```bash
docker-compose up -d
```

Para verificar se o container está rodando:

```bash
docker-compose ps
```

Para parar o MongoDB:

```bash
docker-compose down
```

Para ver os logs do MongoDB:

```bash
docker-compose logs -f mongo-aconchego
```

**Nota:** Se preferir usar MongoDB local ou Atlas, pule este passo e configure a `DATABASE_URL` adequadamente no `.env`.

### Passo 4: Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Porta do servidor (opcional, padrão: 3000)
PORT=3000

# URL de conexão com MongoDB
# Para MongoDB via Docker (recomendado - porta 27018):
DATABASE_URL="mongodb://root:password@localhost:27018/aconchego?replicaSet=replicaset&authSource=admin"
# Para MongoDB local sem autenticação (porta 27017):
# DATABASE_URL="mongodb://localhost:27017/aconchego?replicaSet=rs0"
# Para MongoDB Atlas:
# DATABASE_URL="mongodb+srv://usuario:senha@cluster.mongodb.net/aconchego?retryWrites=true&w=majority"

# Secret para assinatura de tokens JWT (use uma string aleatória e segura)
JWT_SECRET="sua-chave-secreta-super-segura-aqui"
```

**⚠️ Importante:** 
- Nunca commite o arquivo `.env` no repositório
- Use uma chave JWT_SECRET forte e única em produção
- Para MongoDB Atlas, substitua `usuario`, `senha` e `cluster` pelos seus dados reais
- O MongoDB no Docker usa as credenciais: `admin` / `password` (altere em produção!)

### Passo 5: Configurar o Banco de Dados

#### 5.1. Gerar o Prisma Client

```bash
npm run prisma:generate
```

### Passo 6: Popular o Banco de Dados (Opcional)

Para popular o banco com dados iniciais de exemplo:

```bash
npm run seed
```

### Passo 7: Iniciar o Servidor

#### Modo Desenvolvimento (com hot reload)

```bash
npm run dev
```

O servidor será iniciado em `http://localhost:3000` (ou na porta configurada no `.env`).

#### Modo Produção

Primeiro, compile o TypeScript:

```bash
npm run build
```

Depois, inicie o servidor:

```bash
npm start
```

## ✅ Verificar se Está Funcionando

Após iniciar o servidor, você verá a mensagem:
```
🚀 Server running on http://localhost:3000
```

Teste a API fazendo uma requisição para o endpoint de health check:

```bash
curl http://localhost:3000/health
```

Ou acesse no navegador: `http://localhost:3000/health`

A resposta esperada é:
```json
{
  "status": "ok",
  "message": "API is running"
}
```

## 📚 Estrutura do Projeto

```
backend-api/
├── src/
│   ├── controllers/    # Lógica de negócio
│   ├── routes/         # Definição de rotas
│   ├── middleware/     # Middlewares (auth, error)
│   ├── utils/          # Utilitários (Prisma, ID converter)
│   ├── scripts/        # Scripts (seed)
│   └── index.ts        # Arquivo principal
├── prisma/
│   └── schema.prisma   # Schema do banco de dados
├── docker-compose.yml  # Configuração do MongoDB via Docker
├── .env                # Variáveis de ambiente (não versionado)
├── package.json        # Dependências e scripts
└── tsconfig.json       # Configuração TypeScript
```

## 🔐 Autenticação

A API usa JWT (JSON Web Tokens) para autenticação. Rotas protegidas requerem o header:

```
Authorization: Bearer <token>
```

Para obter um token, faça login através do endpoint `/api/auth/login`.

## 📖 Endpoints Disponíveis

- `/api/auth` - Autenticação (login, registro)
- `/api/events` - Eventos
- `/api/news` - Notícias
- `/api/feedback` - Feedback
- `/api/filters` - Filtros
- `/api/classes` - Aulas
- `/api/users` - Usuários
- `/api/attendance` - Frequência
- `/health` - Health check

## ⚙️ Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia o servidor em modo desenvolvimento com hot reload |
| `npm run build` | Compila o TypeScript para JavaScript |
| `npm start` | Executa a versão compilada (produção) |
| `npm run prisma:generate` | Gera o Prisma Client |
| `npm run prisma:studio` | Abre o Prisma Studio (interface gráfica para o banco) |
| `npm run seed` | Popula o banco de dados com dados iniciais |

## 🛠️ Solução de Problemas

### Erro: "JWT secret não configurado"
- Certifique-se de que o arquivo `.env` existe e contém a variável `JWT_SECRET`

### Erro: "Cannot connect to database"
- Se estiver usando Docker, verifique se o container está rodando: `docker-compose ps`
- Se o MongoDB não estiver rodando, inicie com: `docker-compose up -d`
- Confirme que a `DATABASE_URL` no `.env` está correta
- Teste a conexão com o MongoDB usando o MongoDB Compass ou CLI

### Erro: "Prisma needs to perform transactions, which requires your MongoDB server to be run as a replica set"
- Certifique-se de que o MongoDB está configurado como replica set
- Se estiver usando Docker, o `docker-compose.yml` já está configurado corretamente
- Verifique se a `DATABASE_URL` inclui `replicaSet=replicaset` na string de conexão
- Reinicie o container MongoDB: `docker-compose restart mongo-aconchego`

### Erro: "Prisma Client not generated"
- Execute `npm run prisma:generate`

### Porta já em uso
- Altere a porta no arquivo `.env` ou encerre o processo que está usando a porta 3000

## 📝 Notas Adicionais

- O servidor aceita requisições de qualquer origem (CORS configurado para desenvolvimento)
- Em produção, configure o CORS adequadamente no arquivo `src/index.ts`
- O Prisma Studio pode ser acessado com `npm run prisma:studio` para visualizar e editar dados diretamente

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença ISC.





