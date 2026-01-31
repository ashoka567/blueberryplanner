# WPCLife - Family Organizer

A comprehensive family organization application for managing medications, chores, groceries, and events for multi-tenant households.

## Features

- **Multi-Tenant Households** - Create or join families using invite codes
- **Role-Based Access** - Guardians and Members with different permissions
- **Medication Tracking** - Schedule doses, track inventory, log taken/skipped
- **Chore Management** - Assign tasks with points for gamification
- **Leaderboard** - Motivate family members with point rankings
- **Grocery Lists** - Shared shopping lists by category
- **Family Calendar** - Schedule and view family events
- **Secure Authentication** - JWT-based auth with refresh tokens

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Angular 17, TypeScript, SCSS |
| Backend | Java 21, Spring Boot 3.2 |
| Database | MongoDB |
| Auth | JWT (24h access, 7d refresh) |
| Container | Docker, Docker Compose |
| CI/CD | GitHub Actions |

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Git

### Run with Docker Compose

```bash
# Clone the repository
git clone https://github.com/yourusername/wpclife.git
cd wpclife

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

Access the application:
- **Frontend**: http://localhost:80
- **Backend API**: http://localhost:8080
- **MongoDB**: localhost:27017

### Stop Services

```bash
docker-compose down

# To also remove volumes
docker-compose down -v
```

## Development Setup

### Backend (Java/Spring Boot)

```bash
cd wpclife-backend

# Install dependencies and run
mvn spring-boot:run
```

See [wpclife-backend/README.md](./wpclife-backend/README.md) for details.

### Frontend (Angular)

```bash
cd wpclife-frontend

# Install dependencies
npm install

# Start dev server
npm start
```

See [wpclife-frontend/README.md](./wpclife-frontend/README.md) for details.

## Project Structure

```
wpclife/
├── wpclife-backend/        # Spring Boot API
│   ├── src/
│   ├── pom.xml
│   └── Dockerfile
├── wpclife-frontend/       # Angular SPA
│   ├── src/
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf
├── .github/workflows/      # CI/CD pipelines
├── docker-compose.yml
└── README.md
```

## Environment Variables

### Backend

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGO_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret for JWT signing (256-bit) | Yes |
| `CORS_ORIGINS` | Allowed CORS origins | Yes |

### Frontend

Configure in `src/environments/`:

| Variable | Description |
|----------|-------------|
| `apiUrl` | Backend API URL |

## MongoDB Atlas Setup

1. Create a free M0 cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a database user
3. Whitelist your IP or use 0.0.0.0/0 for all
4. Get connection string and set as `MONGO_URI`

## Deployment

### Backend - Render

1. Create a new Web Service
2. Connect your GitHub repository
3. Set environment variables
4. Deploy automatically on push

### Frontend - Cloudflare Pages

1. Connect your repository
2. Set build command: `npm run build:prod`
3. Set output directory: `dist/wpclife-frontend/browser`
4. Deploy automatically on push

## API Documentation

See [wpclife-backend/README.md](./wpclife-backend/README.md#api-endpoints) for full API documentation.

## CI/CD

GitHub Actions workflows:
- **backend-ci.yml** - Build, test, and push backend Docker image
- **frontend-ci.yml** - Build, lint, and push frontend Docker image
- **deploy.yml** - Manual deployment trigger

## License

MIT License
