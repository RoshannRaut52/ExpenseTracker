# SpendWise

**Track smarter. Spend wiser.**

SpendWise is now organized as a deploy-friendly monorepo with independent application roots:

```text
spendwise/
├── frontend/   # React + Vite app; deploy this folder to Vercel
├── backend/    # Spring Boot API; deploy this folder to Render via Docker
├── README.md
├── plan.md
└── TODO.md
```

## Frontend — Vercel

Set Vercel's **Root Directory** to `frontend`, then use the Vite preset. Install and run locally with:

```bash
cd frontend
npm install
npm run dev
```

Set `VITE_API_BASE_URL` to the deployed backend URL. The SPA rewrite is already in `frontend/vercel.json`.

## Backend — Render

Set Render's **Root Directory** to `backend`, choose Docker, and deploy with `backend/Dockerfile`. The service listens on `${PORT:8080}`. Configure these environment variables in Render:

```text
SPRING_DATASOURCE_URL=jdbc:postgresql://...
SPRING_DATASOURCE_USERNAME=...
SPRING_DATASOURCE_PASSWORD=...
SPRING_DATASOURCE_DRIVER=org.postgresql.Driver
JPA_DIALECT=org.hibernate.dialect.PostgreSQLDialect
JWT_SECRET=replace-with-a-32-character-secret
ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

For local backend development, Maven uses the in-memory H2 defaults from `backend/src/main/resources/application.properties`.

## Root convenience commands

From the repository root:

```bash
npm run dev            # starts the frontend dev server
npm run frontend:build # builds the frontend
```

Or run each deploy root independently for platform parity.

## API surface

The backend exposes `POST /api/auth/register`, `POST /api/auth/login`, CRUD under `/api/expenses`, CRUD under `/api/categories`, `GET /api/dashboard/summary`, and Spring Actuator health at `/actuator/health`. The frontend keeps a JWT-ready Axios interceptor and currently uses realistic demo data for a frictionless preview.
