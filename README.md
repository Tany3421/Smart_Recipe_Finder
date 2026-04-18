# 🍳 Smart Recipe Finder — v2.0 (MySQL + Meal Planner)

A full-stack recipe platform with MySQL, Express, a premium red/white frontend,
meal planning, weekly planner, favorites, forgot password, and admin panel.

---

## 📁 Folder Structure

```
smart-recipe-finder/
├── backend/
│   ├── server.js           ← Express entry point (port 3000)
│   ├── package.json
│   ├── .env.example        ← Copy to .env and configure
│   ├── config/db.js        ← MySQL connection pool
│   ├── database/
│   │   ├── schema.sql      ← CREATE TABLE statements
│   │   └── seed.js         ← Seeds 45 recipes + 2 users
│   ├── middleware/
│   │   ├── auth.js         ← JWT authentication
│   │   └── upload.js       ← Multer file upload
│   ├── routes/
│   │   ├── auth.js         ← Login, Register, Forgot/Reset password
│   │   ├── recipes.js      ← Recipe CRUD + search + meal_type filter
│   │   ├── favorites.js    ← User favorites
│   │   ├── mealplanner.js  ← Weekly meal plan + shopping list
│   │   └── admin.js        ← Stats + user management
│   └── uploads/
│       ├── images/         ← Uploaded recipe images
│       └── videos/         ← Uploaded recipe videos
└── frontend/
    ├── index.html          ← Homepage — hero, meal tabs, recipe grid
    ├── login.html          ← Login / Register / Forgot Password
    ├── recipe.html         ← Recipe detail — gallery, steps, video
    ├── favorites.html      ← Saved favorites (auth-protected)
    ├── meal-planner.html   ← Weekly planner + shopping list
    ├── reset-password.html ← Password reset via email token
    ├── admin.html          ← Admin panel — stats, CRUD, users
    ├── css/style.css       ← Premium red/white theme + dark mode
    └── js/
        ├── app.js          ← Shared: Auth, API, Toast, Navbar
        └── meal-planner.js ← Planner grid + shopping list logic
```

---

## 🚀 Quick Setup

### 1. Install MySQL and create the database

```bash
mysql -u root -p < backend/database/schema.sql
```

### 2. Configure environment

```bash
cd backend
cp .env.example .env
# Edit .env with your MySQL credentials and Gmail App Password
```

**Required `.env` values:**

| Variable      | Description                               |
|---------------|-------------------------------------------|
| DB_HOST       | MySQL host (default: localhost)           |
| DB_USER       | MySQL username                            |
| DB_PASSWORD   | MySQL password                            |
| DB_NAME       | Database name (smart_recipe_finder)       |
| JWT_SECRET    | Any long random string                    |
| EMAIL_USER    | Your Gmail address                        |
| EMAIL_PASS    | Gmail App Password (16 chars, no spaces)  |
| SITE_URL      | http://localhost:3000                     |

> **Gmail App Password**: Google Account → Security → 2-Step Verification → App Passwords

### 3. Install dependencies and seed data

```bash
cd backend
npm install
npm run seed      # Inserts 45 recipes and 2 demo users
```

### 4. Start the server

```bash
npm start         # Production
npm run dev       # Development (auto-restart with nodemon)
```

Open **http://localhost:3000** in your browser.

---

## 👤 Demo Accounts

| Role  | Username   | Password  |
|-------|------------|-----------|
| Admin | admin      | admin123  |
| User  | foodlover  | food123   |

---

## 🍽 Features

### Recipes
- **45 recipes** across 6 meal types: Breakfast, Brunch, Lunch, Dinner, Snack, Dessert
- Search by title, filter by meal type, cuisine, difficulty
- Featured recipes, ratings, star highlights
- Step-by-step ingredients checklist
- YouTube / video embed support
- Image gallery

### Meal Planner
- Weekly grid view (Mon – Sun × 6 meal slots)
- Click any cell to search and add a recipe
- Navigate between weeks
- One recipe per slot (replaces on re-add)
- **Shopping list**: aggregates all ingredients for the week with checkboxes

### Auth & Users
- Register / Login with JWT (7-day token)
- **Forgot password** email via Gmail nodemailer
- **Reset password** via secure token link
- Dark mode toggle (persisted)

### Admin Panel
- Dashboard with live stats
- Recipe CRUD with image upload + meal type tabs
- User management with role badges
- Recent activity table

---

## 📡 API Reference

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/forgot-password
POST   /api/auth/reset-password

GET    /api/recipes?search=&meal_type=&cuisine=&difficulty=&featured=&page=&limit=
GET    /api/recipes/meta
GET    /api/recipes/:id
POST   /api/recipes          (admin)
PUT    /api/recipes/:id      (admin)
DELETE /api/recipes/:id      (admin)

GET    /api/favorites
GET    /api/favorites/ids
POST   /api/favorites/:id
DELETE /api/favorites/:id

GET    /api/meal-planner?week=YYYY-MM-DD
POST   /api/meal-planner/item
DELETE /api/meal-planner/item/:id
GET    /api/meal-planner/shopping-list?week=YYYY-MM-DD

GET    /api/admin/stats
GET    /api/admin/users
DELETE /api/admin/users/:id
```

---

## 🛠 Tech Stack

| Layer    | Technology                         |
|----------|------------------------------------|
| Backend  | Node.js, Express 4                 |
| Database | MySQL 8 + mysql2/promise           |
| Auth     | bcryptjs, jsonwebtoken             |
| Email    | nodemailer (Gmail SMTP)            |
| Uploads  | multer                             |
| Frontend | Vanilla HTML/CSS/JS (no framework) |
| Fonts    | Playfair Display + DM Sans (Google)|
