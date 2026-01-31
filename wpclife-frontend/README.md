# WPCLife Frontend

Angular 17 frontend for the WPCLife Family Organizer application.

## Tech Stack

- **Angular 17** - Frontend framework with standalone components
- **TypeScript 5.2** - Type-safe JavaScript
- **RxJS** - Reactive programming
- **SCSS** - Styling

## Prerequisites

- Node.js 20+
- npm 10+

## Quick Start

### 1. Clone and Navigate

```bash
cd wpclife-frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Update `src/environments/environment.ts` if needed:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'
};
```

### 4. Run Development Server

```bash
npm start
# or
ng serve
```

The app will be available at `http://localhost:4200`

## Project Structure

```
src/app/
├── core/                   # Core module
│   ├── guards/             # Route guards
│   ├── interceptors/       # HTTP interceptors
│   └── services/           # Global services
├── features/               # Feature modules
│   ├── auth/               # Login/Register
│   ├── calendar/           # Family calendar
│   ├── chores/             # Chore management
│   ├── dashboard/          # Home dashboard
│   ├── groceries/          # Grocery list
│   └── medications/        # Medication tracker
└── shared/                 # Shared module
    ├── components/         # Reusable components
    ├── models/             # TypeScript interfaces
    └── pipes/              # Custom pipes
```

## Features

### Authentication
- User registration with household creation or invite code
- JWT-based login with automatic token refresh
- Role-based access (Guardian/Member)

### Dashboard
- Today's events overview
- Pending chores summary
- Medication schedule
- Grocery list count
- Chore leaderboard

### Calendar
- Monthly calendar view
- Event creation and management
- Event types: Family, School, Medical, Other

### Medications
- Track medications for family members
- Schedule (morning/afternoon/evening)
- Inventory management with low-stock alerts
- Dose logging (taken/skipped)

### Chores
- Assign chores to family members
- Point-based gamification
- Leaderboard for motivation
- Due date tracking

### Groceries
- Shared family grocery list
- Category organization
- Check off items as purchased
- Clear checked items

## Available Scripts

```bash
# Development server
npm start

# Production build
npm run build:prod

# Run tests
npm test

# Lint code
npm run lint
```

## Docker

```bash
# Build image
docker build -t wpclife-frontend .

# Run container
docker run -p 80:80 wpclife-frontend
```

## Environment Variables

For production, update `src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: '/api'  // Uses nginx proxy
};
```

## Styling

Global styles are in `src/styles.scss` with CSS variables:

```scss
:root {
  --primary: #6366f1;
  --primary-dark: #4f46e5;
  --secondary: #64748b;
  --success: #22c55e;
  --warning: #f59e0b;
  --danger: #ef4444;
  --background: #f8fafc;
  --surface: #ffffff;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --border: #e2e8f0;
}
```
