# WPCLife Backend

Spring Boot 3.2 REST API for the WPCLife Family Organizer application.

## Tech Stack

- **Java 21** - Latest LTS release
- **Spring Boot 3.2** - Application framework
- **Spring Security** - JWT-based authentication
- **Spring Data MongoDB** - Database access
- **MongoDB** - Document database
- **Maven** - Build tool

## Prerequisites

- JDK 21
- Maven 3.9+
- MongoDB 7.0+ (or MongoDB Atlas account)

## Quick Start

### 1. Clone and Navigate

```bash
cd wpclife-backend
```

### 2. Configure Environment

Copy the example environment file and update values:

```bash
# Set environment variables
export MONGO_URI=mongodb://localhost:27017/wpclife
export JWT_SECRET=your-256-bit-secret-key-change-in-production
export CORS_ORIGINS=http://localhost:4200
```

### 3. Run MongoDB Locally (Optional)

```bash
docker run -d -p 27017:27017 --name mongodb mongo:7
```

### 4. Build and Run

```bash
# Build
mvn clean package -DskipTests

# Run
mvn spring-boot:run

# Or run the JAR directly
java -jar target/wpclife-backend-1.0.0.jar
```

The API will be available at `http://localhost:8080`

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh token |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/me` | Get current user |
| GET | `/api/users/household` | Get household members |
| GET | `/api/users/household/invite-code` | Get invite code |
| PATCH | `/api/users/me` | Update profile |

### Calendar Events

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | Get all events |
| POST | `/api/events` | Create event |
| PUT | `/api/events/:id` | Update event |
| DELETE | `/api/events/:id` | Delete event |

### Medications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/medications` | Get all medications |
| POST | `/api/medications` | Create medication |
| POST | `/api/medications/log` | Log medication dose |
| GET | `/api/medications/:id/logs` | Get medication logs |
| PATCH | `/api/medications/:id/inventory` | Update inventory |
| DELETE | `/api/medications/:id` | Delete medication |

### Chores

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chores` | Get all chores |
| GET | `/api/chores/pending` | Get pending chores |
| GET | `/api/chores/leaderboard` | Get leaderboard |
| POST | `/api/chores` | Create chore |
| PATCH | `/api/chores/:id/complete` | Complete chore |
| DELETE | `/api/chores/:id` | Delete chore |

### Groceries

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/groceries` | Get all items |
| GET | `/api/groceries/pending` | Get unchecked items |
| POST | `/api/groceries` | Add item |
| PATCH | `/api/groceries/:id/toggle` | Toggle checked |
| DELETE | `/api/groceries/:id` | Delete item |
| DELETE | `/api/groceries/clear-checked` | Clear checked items |

## Project Structure

```
src/main/java/com/wpclife/
├── config/         # Security and app configuration
├── controller/     # REST API endpoints
├── dto/            # Request/Response objects
├── model/          # MongoDB document entities
├── repository/     # Data access layer
├── security/       # JWT and auth components
└── service/        # Business logic
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/wpclife` |
| `JWT_SECRET` | Secret key for JWT signing | - |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:4200` |
| `SPRING_PROFILES_ACTIVE` | Active Spring profile | `dev` |

## Docker

```bash
# Build image
docker build -t wpclife-backend .

# Run container
docker run -p 8080:8080 \
  -e MONGO_URI=mongodb://host.docker.internal:27017/wpclife \
  -e JWT_SECRET=your-secret-key \
  wpclife-backend
```

## Testing

```bash
# Run all tests
mvn test

# Run with coverage
mvn test jacoco:report
```
