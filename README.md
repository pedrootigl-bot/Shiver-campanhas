# 🚀 Shiver-Campanhas

> Plataforma web para **gerenciamento, organização e divulgação de campanhas promocionais**, centralizando informações, materiais e recursos de marketing em um único ambiente.

O **Shiver-Campanhas** permite que equipes administrativas criem e gerenciem campanhas, organizem materiais de divulgação, disponibilizem copies, regras e ângulos de comunicação, acompanhem indicadores e automatizem notificações relacionadas ao ciclo de vida das campanhas.

A plataforma é dividida entre uma **área pública**, destinada à consulta e divulgação das campanhas, e um **painel administrativo**, utilizado para gerenciamento e operação interna.

---

## 📌 Visão geral

O Shiver-Campanhas foi desenvolvido para centralizar informações e materiais que normalmente ficam distribuídos em diferentes ferramentas e canais.

Cada campanha pode concentrar em um único ambiente:

* 📢 Informações da campanha
* 📅 Período de divulgação
* 🖼️ Materiais gráficos
* 🎥 Vídeos
* ✍️ Copies
* 📋 Regras
* 🎯 Ângulos de comunicação
* 📦 Kits completos de materiais
* 🔔 Notificações automáticas
* 📊 Estatísticas e indicadores
* 👀 Visão geral estratégica

---

# ✨ Principais funcionalidades

## 📢 Gerenciamento de campanhas

* Criação e edição de campanhas
* Definição de período de início e término
* Controle automático do status
* Organização por categorias
* Banner e imagem de destaque
* Visão geral estratégica
* Controle de publicação da campanha
* Validação dos requisitos necessários para publicação

### Status automático

As campanhas possuem status determinado automaticamente de acordo com suas datas:

```text
AGENDADA
    │
    │ data_inicio
    ▼
 ATIVA
    │
    │ data_fim
    ▼
FINALIZADA
```

---

## 📦 Gerenciamento de materiais

Os materiais de cada campanha podem ser organizados de acordo com o formato de publicação:

* Stories
* Feed
* Vídeos
* Banners

Cada material possui informações relacionadas ao seu tipo e formato, permitindo uma organização mais intuitiva.

Também é possível:

* Fazer upload de múltiplos arquivos
* Visualizar materiais
* Baixar arquivos individualmente
* Baixar todos os materiais como um kit `.ZIP`
* Organizar automaticamente o ZIP por formato de publicação

### Organização

```text
Campanha
│
├── Stories
│   ├── Imagens
│   └── Vídeos
│
├── Feed
│   └── Imagens
│
├── Vídeos
│   └── Vídeos
│
└── Banners
    └── Imagens
```

---

# ✍️ Copies

Cada campanha pode possuir diferentes copies para utilização na divulgação.

As copies ficam vinculadas à campanha e podem ser consultadas pela equipe responsável pela publicação e comunicação.

Isso permite manter textos de divulgação organizados e disponíveis em um único ambiente.

---

# 📋 Regras

As regras são cadastradas diretamente na campanha.

A área pública disponibiliza essas informações de maneira organizada, permitindo que os usuários tenham acesso às orientações necessárias para cada campanha.

---

# 🎯 Ângulos de divulgação

O sistema permite cadastrar diferentes ângulos estratégicos de comunicação.

Os ângulos ajudam a orientar a equipe na criação e utilização dos materiais de divulgação da campanha.

---

# 👀 Visão geral estratégica

Cada campanha pode possuir uma visão geral com informações estratégicas para facilitar o entendimento da ação.

Esse espaço pode concentrar informações como:

* Objetivo da campanha
* Contexto
* Estratégia
* Direcionamento de comunicação
* Informações relevantes para divulgação

---

# 📊 Dashboard administrativo

O painel administrativo apresenta indicadores relacionados à operação da plataforma.

Entre os dados disponíveis estão:

* Campanhas
* Materiais
* Copies
* Vídeos
* Outros indicadores operacionais

A dashboard tem como objetivo fornecer uma visão rápida do estado atual da operação.

---

# 🔔 Central de notificações

O Shiver-Campanhas possui uma central de notificações administrativa responsável por acompanhar automaticamente eventos relacionados ao ciclo das campanhas.

São geradas notificações para eventos como:

```text
🚀 Campanha iniciada
        ↓
⏳ Campanha terminando em 7 dias
        ↓
⏳ Campanha terminando em 3 dias
        ↓
⚠️ Campanha terminando amanhã
        ↓
🏁 Campanha encerrada
```

O sistema possui mecanismos para evitar a criação de notificações duplicadas.

---

# 🤖 Automação e Scheduler

O backend possui um sistema de tarefas automáticas responsável por executar rotinas relacionadas às campanhas e notificações.

O Scheduler:

* Executa rotinas automaticamente
* Realiza uma execução inicial ao iniciar o servidor
* Executa novamente em intervalos configuráveis
* Evita execuções simultâneas
* Isola erros dos jobs para evitar a interrupção do servidor

O intervalo pode ser configurado através da variável:

```env
SCHEDULER_INTERVAL_MINUTES=5
```

### Jobs

```text
backend/jobs/
│
├── index.js
├── campanhas.job.js
└── notificacoes.job.js
```

---

# ✅ Validação de campanhas

O sistema possui uma camada de validação para determinar se uma campanha possui os requisitos mínimos necessários para publicação.

Entre os requisitos avaliados estão:

* Título
* Data de início
* Data de término
* Banner ou imagem da campanha
* Visão geral ou resumo
* Pelo menos uma copy
* Pelo menos uma regra
* Pelo menos um material

A validação retorna:

```javascript
{
    pronta: true,
    pendencias: []
}
```

Ou:

```javascript
{
    pronta: false,
    pendencias: [
        "Campanha não possui materiais",
        "Campanha não possui regras"
    ]
}
```

O resultado também pode atualizar automaticamente o campo:

```text
pronta_publicacao
```

---

# 🏗️ Arquitetura

A aplicação utiliza uma arquitetura dividida em três principais camadas:

```text
┌──────────────────────────────┐
│          Frontend            │
│       HTML / CSS / JS        │
└──────────────┬───────────────┘
               │
               │ HTTP / REST
               ▼
┌──────────────────────────────┐
│           Backend            │
│       Node.js / Express      │
└──────────────┬───────────────┘
               │
               │ Supabase SDK
               ▼
┌──────────────────────────────┐
│           Supabase           │
│ PostgreSQL / Auth / Storage  │
└──────────────────────────────┘
```

### Fluxo principal

```text
Administrador
      │
      ▼
Painel Administrativo
      │
      ▼
API REST
      │
      ▼
Supabase
      │
      ├── PostgreSQL
      ├── Authentication
      └── Storage
      │
      ▼
Área Pública
      │
      ▼
Usuário final
```

---

# 🛠️ Stack

| Camada                      | Tecnologia              |
| --------------------------- | ----------------------- |
| Frontend                    | HTML5, CSS3, JavaScript |
| Backend                     | Node.js + Express       |
| Banco de dados              | PostgreSQL              |
| Backend as a Service        | Supabase                |
| Autenticação                | Supabase Auth           |
| Armazenamento               | Supabase Storage        |
| Segurança                   | JWT + RLS               |
| Controle de versão          | Git + GitHub            |
| Ambiente de desenvolvimento | Node.js + Nodemon       |

---

# 📁 Estrutura do projeto

```text
Shiver-Campanhas/
│
├── frontend/
│   ├── index.html
│   │
│   ├── admin/
│   │   ├── login.html
│   │   ├── dashboard.html
│   │   ├── campanhas.html
│   │   ├── campanha-detalhes.html
│   │   └── ...
│   │
│   ├── css/
│   │   ├── admin/
│   │   └── ...
│   │
│   ├── js/
│   │   ├── main.js
│   │   ├── campanhas.js
│   │   ├── materiais.js
│   │   ├── campanha-modal.js
│   │   ├── stats.js
│   │   └── ...
│   │
│   ├── images/
│   └── downloads/
│
├── backend/
│   ├── server.js
│   ├── routes/
│   ├── services/
│   ├── jobs/
│   ├── utils/
│   ├── middleware/
│   ├── config/
│   ├── .env.example
│   └── package.json
│
├── database/
│   └── *.sql
│
├── documents/
│   └── *.md
│
└── README.md
```

---

# ⚙️ Pré-requisitos

Antes de executar o projeto, tenha instalado:

* [Node.js](https://nodejs.org/) 18 ou superior
* Git
* Um projeto no [Supabase](https://supabase.com/)
* VS Code, Cursor ou outro editor de código
* Um servidor HTTP para executar o frontend

---

# 🚀 Instalação

## 1. Clonar o repositório

```bash
git clone https://github.com/pedrootigl-bot/Shiver-Campanhas.git
cd Shiver-Campanhas
```

---

## 2. Instalar dependências do backend

```bash
cd backend
npm install
```

---

## 3. Configurar variáveis de ambiente

Crie:

```text
backend/.env
```

Utilizando:

```text
backend/.env.example
```

como referência.

Exemplo:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua_chave_anon
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key

PORT=3000

CORS_ORIGINS=http://localhost:5500,http://127.0.0.1:5500,http://localhost:3000

SCHEDULER_INTERVAL_MINUTES=5
```

### ⚠️ Importante

A variável:

```env
SUPABASE_SERVICE_ROLE_KEY
```

deve existir **somente no backend**.

Nunca coloque a Service Role Key em arquivos JavaScript do frontend ou em arquivos versionados no Git.

---

# ▶️ Executando o projeto

## Backend

Dentro da pasta `backend`:

```bash
npm run dev
```

Ou:

```bash
npm start
```

A API ficará disponível em:

```text
http://localhost:3000
```

---

## Frontend

Execute a pasta `frontend` através de um servidor HTTP.

Por exemplo:

* Live Server
* VS Code
* Cursor
* Outro servidor HTTP local

### Área pública

```text
frontend/index.html
```

### Painel administrativo

```text
frontend/admin/login.html
```

---

# 🗄️ Banco de dados

O Shiver-Campanhas utiliza **Supabase PostgreSQL** para armazenar os dados da aplicação.

Principais entidades:

```text
campanhas
│
├── materiais
├── copies
├── regras
├── kits
├── angulos
├── notificacoes
└── estatísticas
```

Os scripts SQL auxiliares ficam disponíveis em:

```text
database/
```

---

# 📅 Status automático das campanhas

O status das campanhas é determinado automaticamente com base no período configurado.

Timezone utilizado:

```text
America/Sao_Paulo
```

| Status       | Condição                         | Área pública |
| ------------ | -------------------------------- | ------------ |
| `agendada`   | Antes de `data_inicio`           | Oculta       |
| `ativa`      | Entre `data_inicio` e `data_fim` | Visível      |
| `finalizada` | A partir de `data_fim`           | Oculta       |

Fluxo:

```text
        data_inicio
             │
             ▼
       ┌───────────┐
       │ AGENDADA  │
       └─────┬─────┘
             │
             ▼
       ┌───────────┐
       │   ATIVA   │
       └─────┬─────┘
             │
             ▼
       ┌────────────┐
       │ FINALIZADA │
       └────────────┘
```

---

# 🖼️ Organização dos materiais

Os materiais possuem duas classificações principais.

### Tipo do arquivo

```text
imagem
video
arquivo
```

### Formato da publicação

```text
stories
feed
videos
banners
```

Exemplo:

```text
Campanha
│
├── Stories
│   ├── imagem
│   └── video
│
├── Feed
│   └── imagem
│
├── Vídeos
│   └── video
│
└── Banners
    └── imagem
```

---

# 📦 Download de materiais

O usuário pode realizar downloads de duas maneiras.

### Download individual

Baixa somente o arquivo selecionado.

### Download do kit completo

Baixa todos os materiais da campanha em um único arquivo:

```text
kit-campanha.zip
```

O ZIP mantém a organização por formato:

```text
kit-campanha.zip
│
├── stories/
│   ├── material-01.png
│   └── material-02.png
│
├── feed/
│   └── material-03.png
│
├── videos/
│   └── video-01.mp4
│
└── banners/
    └── banner-01.png
```

Endpoint:

```http
GET /api/download/kit/:campanhaId
```

---

# 🔔 Sistema de notificações

As notificações são armazenadas na tabela:

```text
notificacoes
```

O sistema identifica automaticamente eventos importantes no ciclo de vida das campanhas.

### Eventos monitorados

```text
Campanha iniciada
        ↓
Campanha terminando em 7 dias
        ↓
Campanha terminando em 3 dias
        ↓
Campanha terminando amanhã
        ↓
Campanha encerrada
```

O sistema evita a criação de notificações duplicadas.

---

# 🔌 API

Principais endpoints disponíveis:

| Método | Endpoint                      | Descrição            |
| ------ | ----------------------------- | -------------------- |
| `GET`  | `/api/campanhas`              | Lista campanhas      |
| `GET`  | `/api/campanhas/:id`          | Detalha uma campanha |
| `POST` | `/api/campanhas`              | Cria campanha        |
| `PUT`  | `/api/campanhas`              | Atualiza campanha    |
| `GET`  | `/api/materiais/:campanha_id` | Lista materiais      |
| `GET`  | `/api/copies/:campanha_id`    | Lista copies         |
| `GET`  | `/api/regras/:campanha_id`    | Lista regras         |
| `GET`  | `/api/kits/:campanha_id`      | Lista kits           |
| `GET`  | `/api/angulos/:campanha_id`   | Lista ângulos        |
| `GET`  | `/api/download/kit/:id`       | Gera/download do ZIP |
| `GET`  | `/api/stats`                  | Retorna estatísticas |
| `GET`  | `/api/notificacoes`           | Lista notificações   |
| `POST` | `/api/upload`                 | Realiza upload       |

> Rotas administrativas e operações de escrita exigem autenticação.

---

# 🔐 Segurança

O projeto utiliza diferentes camadas de proteção.

## Autenticação

O painel administrativo utiliza:

```text
Supabase Auth
        ↓
JWT
        ↓
Middleware de autenticação
        ↓
API protegida
```

## Row Level Security

O Supabase utiliza **Row Level Security (RLS)** para controlar o acesso aos dados e operações permitidas.

O Storage também utiliza políticas de acesso para controlar operações com arquivos.

## Service Role

A:

```env
SUPABASE_SERVICE_ROLE_KEY
```

é utilizada exclusivamente no backend.

## Variáveis de ambiente

Informações sensíveis devem permanecer em:

```text
backend/.env
```

O arquivo `.env` não deve ser versionado.

---

# 🔄 Fluxo operacional

```text
┌─────────────────────┐
│ Admin cria campanha │
└──────────┬──────────┘
           ↓
┌──────────────────────────────┐
│ Define datas e informações   │
│ Copies, regras e materiais   │
└──────────┬───────────────────┘
           ↓
┌──────────────────────────┐
│ Validação da campanha    │
│ pronta para publicação   │
└──────────┬───────────────┘
           ↓
┌──────────────────────────┐
│ Status automático        │
│ agendada / ativa / fim   │
└──────────┬───────────────┘
           ↓
┌──────────────────────────┐
│ Área pública             │
│ exibe campanhas ativas   │
└──────────┬───────────────┘
           ↓
┌──────────────────────────┐
│ Usuário acessa materiais │
└──────────┬───────────────┘
           ↓
     ┌─────┴─────┐
     ↓           ↓
 Download      Kit ZIP
 individual    completo
```

---

# 📚 Documentação

Documentações técnicas e funcionais adicionais podem ser encontradas em:

```text
documents/
```

Exemplos:

```text
documents/
├── status-automatico-campanhas.md
├── formato-materiais.md
├── central-notificacoes.md
├── visao-geral-campanha.md
├── camada-1-testes-sistema-atual.md
└── camada-2-seguranca.md
```

---

# 🧪 Desenvolvimento

Para iniciar o backend em modo de desenvolvimento:

```bash
cd backend
npm run dev
```

O projeto utiliza **Nodemon** para reiniciar automaticamente o servidor durante alterações no código.

Arquitetura local:

```text
Frontend
   │
   │ HTTP
   ▼
Express API
   │
   │ Supabase SDK
   ▼
Supabase
   ├── PostgreSQL
   ├── Auth
   └── Storage
```

---

# 🌎 Variáveis de ambiente

| Variável                     | Descrição                                   |
| ---------------------------- | ------------------------------------------- |
| `SUPABASE_URL`               | URL do projeto Supabase                     |
| `SUPABASE_KEY`               | Chave pública/anon                          |
| `SUPABASE_SERVICE_ROLE_KEY`  | Chave administrativa utilizada pelo backend |
| `PORT`                       | Porta da API                                |
| `CORS_ORIGINS`               | Origens autorizadas                         |
| `SCHEDULER_INTERVAL_MINUTES` | Intervalo de execução do Scheduler          |

---

# 🚧 Status do projeto

**Em desenvolvimento ativo.**

O núcleo da plataforma contempla:

* [x] Gerenciamento de campanhas
* [x] Status automático
* [x] Dashboard administrativo
* [x] Materiais por formato
* [x] Upload de arquivos
* [x] Downloads individuais
* [x] Download de kit completo em ZIP
* [x] Copies
* [x] Regras
* [x] Ângulos de divulgação
* [x] Visão geral estratégica
* [x] Central de notificações
* [x] Scheduler automático
* [x] Validação de campanhas
* [x] Controle de publicação
* [x] Autenticação administrativa
* [x] Supabase Storage
* [x] Políticas de segurança
* [x] API REST

---

# 🔮 Próximos passos

Possíveis evoluções da plataforma:

* [ ] Melhorias no dashboard
* [ ] Mais indicadores e métricas
* [ ] Melhorias na gestão de permissões
* [ ] Histórico de alterações
* [ ] Auditoria de ações administrativas
* [ ] Melhorias de UX/UI
* [ ] Testes automatizados
* [ ] CI/CD
* [ ] Deploy em ambiente de produção
* [ ] Monitoramento e observabilidade

---

# 👨‍💻 Desenvolvedor

**Pedro Henrique Sá Pinheiro**

Desenvolvimento e implementação da plataforma **Shiver-Campanhas**.

---

# 📄 Licença

Projeto **privado e de uso interno**.

Todos os direitos reservados.

---

<div align="center">

### 🚀 Shiver-Campanhas

**Organização • Automação • Performance • Experiência**

Desenvolvido para centralizar e simplificar a operação de campanhas promocionais.

</div>
