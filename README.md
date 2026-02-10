# PulseBoard — Backend API

Backend API for PulseBoard, a personal and professional Kanban dashboard used to manage tasks, notes, and goals through a workflow system.

## Stack

* Node.js
* Fastify
* Prisma ORM
* SQLite (embedded database)

---

## Features

* Card management (Task / Note / Goal)
* Workflow statuses (Todo, Doing, Done)
* Tagging system
* Search and filtering
* Embedded SQLite database (no external DB required)
* REST API ready for any frontend integration

---

## Project Structure

```
pulseboard-backend/
├── prisma/
│   └── schema.prisma
├── src/
│   └── server.ts
├── data/                # SQLite database (ignored by git)
├── .env.example
├── package.json
└── tsconfig.json
```

---

## Requirements

* Node.js 20 or later
* npm

---

## Installation

Clone the repository:

```bash
git clone https://github.com/Fehd-md/pulseboard-backend.git
cd pulseboard-backend
npm install
```

---

## Environment Variables

Create a `.env` file at the project root:

```env
PORT=4000
CORS_ORIGIN=http://localhost:5173
DATABASE_URL="file:./data/pulseboard.db"
```

---

## Database Initialization

Generate the SQLite database and Prisma client:

```bash
npm run db:push
```

This command will:

* Create `/data/pulseboard.db`
* Synchronize the Prisma schema

---

## Run the Server

```bash
npm run dev
```

The API will be available at:

```
http://localhost:4000
```

Health check:

```
http://localhost:4000/health
```

---

## API Endpoints

### Cards

| Method | Endpoint   | Description    |
| ------ | ---------- | -------------- |
| GET    | /cards     | List all cards |
| POST   | /cards     | Create a card  |
| PATCH  | /cards/:id | Update a card  |
| DELETE | /cards/:id | Delete a card  |

---

## Example Request

```bash
curl http://localhost:4000/cards
```

---

## Git Ignore Notes

Sensitive and local files are excluded:

```
data/
*.db
.env
node_modules
```

---

## Frontend Repository

[https://github.com/Fehd-md/pulseboard-frontend](https://github.com/Fehd-md/pulseboard-frontend)

---

## Author

Fehd EL ABOUBI
Systems & Networks Administrator
