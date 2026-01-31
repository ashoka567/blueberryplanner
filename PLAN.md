# WPCLife - Architecture & Deployment Plan

## 1. Repo Structure Decision

**Recommendation: Two Separate Repositories (Polyrepo)**

For an MVP with a clear separation of concerns (Angular Frontend vs Spring Boot Backend) and distinct deployment targets (Cloudflare Pages vs Render), **Two Repositories** is the pragmatic choice.

**Justification:**
- **Deployment Simplicity:** Free tier hosting services (Cloudflare Pages, Render) connect most easily to the root of a repository. Monorepos often require complex build settings (setting root directories, separate build contexts) that can be finicky on free tiers.
- **Team Isolation:** Frontend and Backend development lifecycles in an MVP often move at different speeds.
- **Tooling Overhead:** Avoids the complexity of setting up Monorepo tooling (Nx, Lerna, Bazel) when the team size is small or solo.

**Folder Layouts:**

**Repo 1: `wpclife-frontend` (Angular)**
```
/
├── .github/workflows/deploy.yml  # CI/CD
├── src/
│   ├── app/
│   │   ├── core/                 # Singleton services, guards, interceptors
│   │   ├── shared/               # Reusable components, pipes, directives
│   │   ├── features/             # Lazy loaded modules (calendar, meds, chores)
│   │   └── app.component.ts
│   ├── assets/
│   ├── environments/             # environment.ts, environment.prod.ts
│   └── styles.scss
├── angular.json
├── package.json
└── README.md
```

**Repo 2: `wpclife-backend` (Spring Boot)**
```
/
├── .github/workflows/deploy.yml  # CI/CD
├── src/
│   ├── main/
│   │   ├── java/com/wpclife/
│   │   │   ├── config/           # Security, WebConfig, Swagger
│   │   │   ├── controller/       # REST Endpoints
│   │   │   ├── model/            # Entities
│   │   │   ├── repository/       # JPA/Mongo Repositories
│   │   │   ├── service/          # Business Logic
│   │   │   └── WpcLifeApplication.java
│   │   └── resources/
│   │       ├── application.yml   # Default config
│   │       └── application-prod.yml # Prod config overrides
├── Dockerfile                    # For Render deployment
├── pom.xml (or build.gradle)
└── README.md
```

---

## 2. Local Development Setup

**`docker-compose.yml`**
Place this in the backend repo root or a dedicated `wpclife-infra` folder.

```yaml
version: '3.8'

services:
  # Database
  mongodb:
    image: mongo:latest
    container_name: wpclife-mongo
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
    volumes:
      - mongo-data:/data/db

  # DB UI (Optional)
  mongo-express:
    image: mongo-express
    container_name: wpclife-mongo-ui
    restart: always
    ports:
      - "8081:8081"
    environment:
      ME_CONFIG_MONGODB_ADMINUSERNAME: admin
      ME_CONFIG_MONGODB_ADMINPASSWORD: password
      ME_CONFIG_MONGODB_URL: mongodb://admin:password@mongodb:27017/

volumes:
  mongo-data:
```

**Backend `.env` (Template)**
```properties
MONGO_URI=mongodb://admin:password@localhost:27017/wpclife?authSource=admin
JWT_SECRET=replace_with_a_very_long_secure_random_string_locally
CORS_ORIGINS=http://localhost:4200
```

**Backend `application.yml` placeholders**
```yaml
spring:
  data:
    mongodb:
      uri: ${MONGO_URI}
security:
  jwt:
    secret: ${JWT_SECRET}
    expiration: 86400000 # 24 hours
management:
  endpoints:
    web:
      exposure:
        include: "health,info"
```

**Frontend `environment.ts`**
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'
};
```

---

## 3. Path A Deployment Plan (Free Tier)

### Frontend: Cloudflare Pages
1.  **Account:** Sign up for Cloudflare.
2.  **Git Connect:** In Cloudflare Dashboard > Pages > "Connect to Git". Select `wpclife-frontend`.
3.  **Build Settings:**
    *   Framework: Angular
    *   Build command: `ng build`
    *   Output directory: `dist/wpclife-frontend/browser` (Check your angular.json for exact path).
4.  **Environment Variables:**
    *   Set `NODE_VERSION` to `20` (or matching local).
5.  **Custom Domain:**
    *   In Pages settings, click "Custom Domains".
    *   Add `wpclife.com` (Cloudflare will guide you to update nameservers if they manage DNS, or provide CNAME record if external).
    *   Cloudflare handles SSL automatically.

### Backend: Render (Free Tier)
1.  **Account:** Sign up for Render.
2.  **Create Service:** New > Web Service. Connect `wpclife-backend`.
3.  **Runtime:** Docker (Recommended for Spring Boot to avoid Java version mismatches).
    *   Ensure `Dockerfile` is in repo root.
4.  **Environment Variables:**
    *   `SPRING_PROFILES_ACTIVE`: `prod`
    *   `MONGO_URI`: (From Atlas connection string)
    *   `JWT_SECRET`: (Generate a secure UUID)
    *   `CORS_ORIGINS`: `https://wpclife.com`
5.  **Custom Domain:**
    *   Render Settings > Custom Domains > Add `api.wpclife.com`.
    *   Add the provided CNAME record to your DNS provider (Cloudflare).

### Database: MongoDB Atlas (M0 Free)
1.  **Cluster:** Create M0 Sandbox in AWS (closest region).
2.  **Security:**
    *   Network Access: Allow `0.0.0.0/0` (Since Render IPs are dynamic) OR use Peering if upgraded later.
    *   Database Access: Create user `wpclife-app` / `secure-password`.
3.  **Connection:** Get string (Java driver). Update Render `MONGO_URI`.

---

## 4. Production Configuration Checklist

*   [ ] **Security Headers:** Spring Security configured to send `X-Content-Type-Options`, `X-Frame-Options`, `Content-Security-Policy`.
*   [ ] **CORS:** Strictly limited to `https://wpclife.com`. No wildcards `*`.
*   [ ] **Rate Limiting:** Implement `Bucket4j` or similar in Spring Boot filter to prevent API abuse (e.g., 50 req/min per IP).
*   [ ] **JWT Strategy:**
    *   Access Token (Short lived, 15m).
    *   Refresh Token (Long lived, 7d, stored in HTTPOnly Secure Cookie or Database with rotation).
*   [ ] **Password Hashing:** Use `BCrypt` (strength 10 or 12).
*   [ ] **Audit Logs:** Create an `@AuditLog` annotation aspect to save critical actions (LOGIN, MED_TAKEN, DELETE_USER) to a separate Mongo collection.
*   [ ] **Monitoring:** Expose `/actuator/health` publicly. Protect `/actuator/metrics` and others behind ADMIN role.
*   [ ] **Backups:** Atlas M0 does **not** support automated backups.
    *   *Workaround:* Write a Github Action cron job that runs `mongodump` against the Atlas URI and saves the archive to an AWS S3 bucket (Free tier) or commits encrypted dump to a private backup repo (risky but free).

---

## 5. Limitations & Risks (Free Tiers)

1.  **Cold Starts (Render Free):**
    *   *Risk:* Backend spins down after inactivity. First request will take 50s+ to load.
    *   *Mitigation:* Use a free uptime monitor (UptimeRobot) to ping `api.wpclife.com/actuator/health` every 10 minutes to keep it awake.
2.  **Atlas M0 Connection Limits:**
    *   *Risk:* Max 500 concurrent connections.
    *   *Mitigation:* Configure Spring Boot HikariCP / Mongo Driver connection pool size conservatively (e.g., min 2, max 10).
3.  **Data Limits:**
    *   *Risk:* 512MB Storage.
    *   *Mitigation:* Avoid storing binary files (images/PDFs) in Mongo. Use external storage or strictly limit "History" retention (delete logs > 90 days).
4.  **No Email Service:**
    *   *Risk:* "Forgot Password" or "Invite Member" flows impossible without email.
    *   *Mitigation:* Use SendGrid (100 emails/day free) or just have Admin manually create users for MVP.
5.  **No Push Notifications:**
    *   *Risk:* Medication reminders won't "pop up" on phone if app is closed (PWA limitations on iOS < 16.4, etc).
    *   *Mitigation:* Rely on SMS (Twilio - paid) or Email reminders for MVP. Or instruct users to "Add to Home Screen" for best PWA support.
