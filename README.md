# backend-warehouse-monitor

API para monitoramento de ambientes de armazém (temperatura e umidade) via dispositivos IoT. Recebe medições de sensores por **MQTT**, valida contra limites configurados por ambiente, gera **alertas** e **notificações**, e expõe uma **API REST** para gestão de usuários, ambientes, dispositivos e histórico de medições. Construído em **Node.js + TypeScript**, seguindo Clean Architecture / DDD com cobertura de testes unitários e e2e.

## Sumário

- [Funcionalidades](#funcionalidades)
- [Arquitetura](#arquitetura)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Executando o projeto](#executando-o-projeto)
- [Testes e qualidade](#testes-e-qualidade)
- [Docker](#docker)
- [CI/CD](#cicd)
- [Estrutura de pastas](#estrutura-de-pastas)
- [API REST](#api-rest)
- [Fluxo MQTT](#fluxo-mqtt)

## Funcionalidades

- Autenticação de usuários via JWT (cookie `httpOnly`)
- CRUD de usuários, com opção de ativar/desativar recebimento de e-mails
- CRUD de ambientes, com limites configuráveis de temperatura e umidade
- CRUD de dispositivos, associáveis a um ambiente e inscritos automaticamente em tópicos MQTT
- Ingestão de medições de temperatura/umidade publicadas pelos dispositivos via **MQTT**
- Geração automática de **alertas** quando uma medição sai do range configurado para o ambiente
- **Notificações** por usuário (listagem e marcação como lida) e envio de **e-mail** (SMTP) para usuários com recebimento habilitado
- Consulta de histórico de medições e da última medição registrada

## Arquitetura

O projeto segue uma organização em camadas (Clean Architecture):

- **domain** — entidades e regras de negócio puras (`Usuario`, `Ambiente`, `Dispositivo`, `Medicao`, `Alerta`, `Notificacao`) e interfaces de repositório
- **application** — casos de uso, DTOs e mappers que orquestram as regras de domínio
- **infra** — implementações concretas: banco de dados (MongoDB/Mongoose), servidor HTTP (Express), cliente MQTT, envio de e-mail (Nodemailer) e middlewares
- **interface** — controllers e schemas de validação (Zod) que traduzem requisições HTTP/MQTT em chamadas aos casos de uso

Os módulos de negócio são organizados por domínio: `ambiente`, `dispositivo`, `medicao`, `usuario`, `autenticacao` e `notificacao`.

## Tecnologias

- [Node.js](https://nodejs.org/) + [TypeScript](https://www.typescriptlang.org/)
- [Express](https://expressjs.com/) — servidor HTTP
- [MongoDB](https://www.mongodb.com/) + [Mongoose](https://mongoosejs.com/) — persistência de dados
- [MQTT.js](https://github.com/mqttjs/MQTT.js) — comunicação com os dispositivos IoT
- [Nodemailer](https://nodemailer.com/) — envio de notificações por e-mail
- [JWT](https://jwt.io/) (`jsonwebtoken`) + [bcrypt](https://www.npmjs.com/package/bcrypt) — autenticação e hash de senhas
- [Zod](https://zod.dev/) — validação de schemas
- [Vitest](https://vitest.dev/) + [Supertest](https://github.com/ladjs/supertest) — testes unitários, de integração e e2e
- [Biome](https://biomejs.dev/) — lint e formatação
- [Husky](https://typicode.github.io/husky/) + [commitlint](https://commitlint.js.org/) — hooks de git e padronização de commits
- [Docker](https://www.docker.com/) — build multi-stage para produção

## Pré-requisitos

- Node.js 20+ (recomendado)
- npm
- Uma instância MongoDB acessível (local ou remota)
- Um broker MQTT acessível (ex.: HiveMQ Cloud, Mosquitto)

## Instalação

```bash
git clone https://github.com/NKRaff/backend-warehouse-monitor.git
cd backend-warehouse-monitor
npm install
```

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha os valores:

```bash
cp .env.example .env
```

| Variável                  | Descrição                                                  |
|---------------------------|-------------------------------------------------------------|
| `SERVER`                  | Nome/identificação do servidor                              |
| `PORT`                    | Porta em que a API HTTP irá escutar                          |
| `CORS_ORIGIN`              | Origem permitida para requisições CORS                       |
| `NODE_ENV`                 | Ambiente de execução (`development`, `production`, etc.)    |
| `DB_URI`                   | String de conexão do MongoDB                                 |
| `BROKER_URL`               | URL do broker MQTT (ex.: `mqtts://host:8883`)                |
| `BROKER_CLIENT_USERNAME`   | Usuário de autenticação no broker MQTT                       |
| `BROKER_CLIENT_PASSWORD`   | Senha de autenticação no broker MQTT                          |
| `MAIL_HOST`                | Host do servidor SMTP                                        |
| `MAIL_PORT`                | Porta do servidor SMTP                                       |
| `MAIL_SECURE`              | Define se a conexão SMTP usa TLS (`true`/`false`)             |
| `MAIL_USER`                | Usuário de autenticação SMTP                                  |
| `MAIL_PASS`                | Senha de autenticação SMTP                                    |
| `MAIL_FROM`                | Endereço de remetente dos e-mails enviados                    |
| `BCRYPT_SALT`              | Número de rounds do salt usado pelo bcrypt                    |
| `JWT_SECRET`               | Segredo usado para assinar/verificar os tokens JWT             |

## Executando o projeto

**Modo desenvolvimento** (hot reload com `tsx`):

```bash
npm run start:dev
```

**Build de produção:**

```bash
npm run build
npm start
```

Ao iniciar, a aplicação conecta ao MongoDB, conecta ao broker MQTT, reinscreve os tópicos dos dispositivos já cadastrados e sobe o servidor HTTP na porta configurada.

## Testes e qualidade

```bash
npm test               # roda toda a suíte (vitest)
npm run test:unit      # apenas testes unitários
npm run test:integration  # apenas testes de integração
npm run test:e2e       # apenas testes end-to-end
npm run coverage       # roda os testes com relatório de cobertura
npm run check          # lint com Biome
npm run check:format   # lint com correção automática
```

O projeto usa **Husky** + **commitlint** para validar mensagens de commit no padrão *Conventional Commits* e rodar checagens antes de commits/pushes.

## Docker

```bash
docker build -t backend-warehouse-monitor .
docker run -p 3000:3000 --env-file .env backend-warehouse-monitor
```

O `Dockerfile` usa build multi-stage: compila o TypeScript em uma imagem `node:24-alpine` e gera uma imagem final enxuta apenas com as dependências de produção e o build (`dist`).

## CI/CD

O repositório conta com workflows do GitHub Actions em `.github/workflows/`:

- **ci.yml** — pipeline de integração contínua (lint, testes)
- **quality.yml** — checagens de qualidade de código
- **docker-publish.yml** — build e publicação da imagem Docker

## Estrutura de pastas

```
backend-warehouse-monitor/
├── src/
│   ├── domain/            # Entidades e interfaces de repositório
│   │   ├── alerta/
│   │   ├── ambiente/
│   │   ├── autenticacao/
│   │   ├── dispositivo/
│   │   ├── medicao/
│   │   ├── notificacao/
│   │   └── usuario/
│   ├── application/       # Casos de uso, DTOs e mappers
│   ├── infra/
│   │   ├── database/       # Modelos e repositórios Mongoose
│   │   ├── http/            # Servidor Express, rotas e middlewares
│   │   ├── mqtt/             # Cliente MQTT e inscrição em tópicos
│   │   └── smtp/             # Envio de e-mails (Nodemailer)
│   ├── interface/          # Controllers e schemas (Zod) por caso de uso
│   └── main.ts              # Composição das dependências e bootstrap
├── test/e2e/                # Testes end-to-end por domínio
├── Dockerfile
└── vitest.config.ts
```

## API REST

Base URL: `http://localhost:<PORT>`

### Autenticação (`/autenticacao`)

| Método | Rota  | Autenticação | Descrição                                    |
|--------|-------|--------------|-------------------------------------------------|
| POST   | `/`   | Não          | Login; retorna cookie `token` (JWT) e o `id` do usuário |

### Usuários (`/usuario`)

| Método | Rota                              | Autenticação | Descrição                          |
|--------|------------------------------------|--------------|--------------------------------------|
| GET    | `/:id`                             | Não          | Busca um usuário pelo ID            |
| POST   | `/`                                 | Não          | Cria um novo usuário                |
| PATCH  | `/`                                 | Sim          | Atualiza o usuário autenticado       |
| DELETE | `/`                                 | Sim          | Remove um usuário                    |
| POST   | `/ativar-recebimento-email`        | Sim          | Ativa o recebimento de e-mails       |
| POST   | `/desativar-recebimento-email`     | Sim          | Desativa o recebimento de e-mails    |

### Ambientes (`/ambiente`)

| Método | Rota    | Autenticação | Descrição                     |
|--------|---------|--------------|----------------------------------|
| POST   | `/`     | Sim          | Cria um novo ambiente            |
| GET    | `/`     | Sim          | Lista todos os ambientes         |
| PATCH  | `/:id`  | Sim          | Atualiza um ambiente             |
| DELETE | `/:id`  | Sim          | Remove um ambiente               |

### Dispositivos (`/dispositivo`)

| Método | Rota    | Autenticação | Descrição                                                        |
|--------|---------|--------------|---------------------------------------------------------------------|
| POST   | `/`     | Sim          | Cadastra um novo dispositivo                                      |
| GET    | `/`     | Sim          | Lista todos os dispositivos                                        |
| PATCH  | `/:id`  | Sim          | Atualiza um dispositivo (associa/desassocia ambiente, inscreve/desinscreve tópicos MQTT) |
| DELETE | `/:id`  | Sim          | Remove um dispositivo                                              |

### Medições (`/medicao`)

| Método | Rota              | Autenticação | Descrição                              |
|--------|-------------------|--------------|-------------------------------------------|
| POST   | `/buscar`         | Sim          | Busca medições com filtros                |
| POST   | `/buscar-ultima`  | Sim          | Busca a última medição registrada         |

### Notificações (`/notificacao`)

| Método | Rota           | Autenticação | Descrição                                  |
|--------|-----------------|--------------|-----------------------------------------------|
| GET    | `/:usuarioId`   | Sim          | Lista as notificações de um usuário            |
| POST   | `/`             | Sim          | Marca uma notificação como lida                |

> A autenticação é feita via cookie `token` (JWT), definido no login.

## Fluxo MQTT

1. Ao cadastrar/atualizar um dispositivo com um ambiente associado, a API se inscreve automaticamente nos tópicos `<deviceId>/temperatura` e `<deviceId>/umidade` no broker MQTT.
2. Cada mensagem MQTT recebida é encaminhada ao caso de uso de **cadastro de medição**, que:
   - Persiste a medição;
   - Valida o valor contra os limites do ambiente correspondente;
   - Caso o valor esteja fora do range, cria um **alerta** e gera **notificações** para os usuários com recebimento de e-mail habilitado (enviadas via SMTP).
3. Ao remover a associação de um dispositivo com um ambiente, a API se desinscreve dos tópicos correspondentes.