# Logement-

A full-stack web application for exploring French housing/rental listings. Built with Django REST Framework (backend) and React + Vite (frontend), connected to a PostgreSQL database hosted on Supabase.

---

## Prerequisites

Make sure you have the following installed:

- **Python 3.12**
- **Node.js 18+** and npm
- **Git**

> If you want to run via Docker instead, you only need Docker Desktop installed.

---

## Project Structure

```
Logement-/
├── backend/        # Django REST API
├── frontend/       # React + Vite app
├── data/           # Data scraping and processing scripts
├── .env.example    # Template for environment variables
└── docker-compose.yml
```

---

## Setup

### 1. Clone the repository

```bash
git clone <repo-url>
cd Logement-
```

### 2. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

Open `.env.local` and set your database connection URL:

```
DATABASE_URL=postgresql://postgres.imdkndaefmcaouxfwoxx:logement.2026@aws-1-eu-west-3.pooler.supabase.com:6543/postgres?sslmode=require
```

> The project uses a cloud PostgreSQL database (Supabase). Ask the project owner for the connection string.

---

## Running the Backend

```bash
cd backend

# Create and activate a virtual environment
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations (creates tables if not already present)
python manage.py migrate

# Start the development server
python manage.py runserver
```

The API will be available at `http://localhost:8000`.

---

## Running the Frontend

Open a **new terminal** (keep the backend running):

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

> The frontend proxies all `/api/` requests to `http://localhost:8000` automatically — no CORS issues in development.

---

## Running with Docker (alternative)

If you prefer Docker, this runs both the database and Django together:

```bash
# Copy the example env file
cp .env.example .env

# Edit .env and fill in your Postgres credentials, then:
docker-compose up --build
```

The API will be available at `http://localhost:8000`. Run the frontend separately as shown above.

---

## Environment Variables Reference

| Variable | Description |
|---|---|
| `DATABASE_URL` | Full PostgreSQL connection string (overrides individual vars below) |
| `DJANGO_SECRET_KEY` | Django secret key — use any long random string |
| `DJANGO_DEBUG` | Set to `1` for development, `0` for production |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated list of allowed hostnames |
| `POSTGRES_DB` | Database name (used by Docker) |
| `POSTGRES_USER` | Database user (used by Docker) |
| `POSTGRES_PASSWORD` | Database password (used by Docker) |
| `POSTGRES_HOST` | Database host — use `db` for Docker, `localhost` for local |
| `POSTGRES_PORT` | Database port (default: `5432`) |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.12, Django 6, Django REST Framework |
| Frontend | React 19, Vite 7, Leaflet (maps) |
| Database | PostgreSQL 16 (Supabase) |
| Containerization | Docker + Docker Compose |
