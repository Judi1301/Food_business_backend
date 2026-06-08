# 🍽️ Food Business — Backend API

REST API + SQLite database for **Food Business, Yelahanka, Bengaluru**.

---

## Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Runtime    | Node.js ≥ 18                      |
| Framework  | Express 4                         |
| Database   | SQLite via `better-sqlite3`       |
| Auth       | JWT (`jsonwebtoken`) + `bcryptjs` |
| Validation | `express-validator`               |
| Security   | `helmet`, `cors`, `express-rate-limit` |

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# → Edit .env: set JWT_SECRET and SETUP_KEY to strong random strings

# 3. Start the server
npm run dev        # development (auto-restart)
npm start          # production

# Server starts at http://localhost:3000
```

The **SQLite database is created automatically** at `./data/food_business.db` on first run,
with all tables and seed data (menu items + 4 reviews from the website).

---

## First-Time Admin Setup

After starting the server, create your owner account **once**:

```bash
curl -X POST http://localhost:3000/api/admin/setup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "owner",
    "password": "YourStrongPassword123",
    "setup_key": "food-business-setup-2024"
  }'
```

Then log in to get a JWT token:

```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username": "owner", "password": "YourStrongPassword123"}'

# → { "success": true, "token": "eyJ..." }
```

Use `Authorization: Bearer <token>` on all admin endpoints.

---

## API Reference

### Health
| Method | Path          | Auth   | Description          |
|--------|---------------|--------|----------------------|
| GET    | /api/health   | Public | Server health check  |

---

### 🥘 Menu  `/api/menu`

| Method | Path               | Auth  | Description                        |
|--------|--------------------|-------|------------------------------------|
| GET    | /api/menu          | Public | Full menu grouped by category      |
| GET    | /api/menu/featured | Public | Featured/highlighted items only    |
| GET    | /api/menu/categories | Public | Category list                    |
| GET    | /api/menu/:id      | Public | Single menu item                   |
| POST   | /api/menu          | Admin | Create a new menu item             |
| PUT    | /api/menu/:id      | Admin | Update a menu item                 |
| DELETE | /api/menu/:id      | Admin | Delete a menu item                 |

**GET /api/menu** — response shape:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Starters",
      "slug": "starters",
      "items": [
        {
          "id": 1,
          "name": "Crispy Veg Pakoras",
          "description": "...",
          "price": 140,
          "image_url": "https://...",
          "badge": "🌶 Spicy",
          "tags": ["veg", "spicy"],
          "is_available": true,
          "is_featured": false
        }
      ]
    }
  ]
}
```

**POST /api/menu** — required body fields:
```json
{
  "category_id": 1,
  "name": "Paneer Tikka",
  "description": "Grilled cottage cheese with spices",
  "price": 280,
  "image_url": "https://example.com/image.jpg",
  "badge": "🌱 Veg",
  "tags": "veg,starter",
  "is_featured": false
}
```

---

### 📬 Enquiries  `/api/enquiries`

Powers the **"Send Us a Message"** contact form.

| Method | Path                 | Auth  | Description                          |
|--------|----------------------|-------|--------------------------------------|
| POST   | /api/enquiries       | Public | Submit a contact form                |
| GET    | /api/enquiries       | Admin | List all enquiries (filterable)      |
| GET    | /api/enquiries/:id   | Admin | Get single enquiry                   |
| PATCH  | /api/enquiries/:id   | Admin | Update status / add notes            |
| DELETE | /api/enquiries/:id   | Admin | Delete enquiry                       |

**POST /api/enquiries** — body:
```json
{
  "full_name": "Radhika Sharma",
  "phone": "+91 98765 43210",
  "email": "radhika@example.com",
  "enquiry_type": "Catering / Event Order",
  "message": "I'd like to book catering for 80 guests on Dec 15."
}
```

`enquiry_type` options: `"Catering / Event Order"`, `"Bulk / Corporate Order"`, `"General Enquiry"`, `"Feedback"`

**GET /api/enquiries** — query params:
- `status`: `new` | `read` | `replied` | `archived`
- `page`, `limit`

---

### 📦 Orders  `/api/orders`

Catering, bulk, takeaway, and delivery orders.

| Method | Path             | Auth  | Description                      |
|--------|------------------|-------|----------------------------------|
| POST   | /api/orders      | Public | Place a new order               |
| GET    | /api/orders      | Admin | List orders (filterable)        |
| GET    | /api/orders/:id  | Admin | Order details with line items   |
| PATCH  | /api/orders/:id  | Admin | Update status / notes / total   |

**POST /api/orders** — body:
```json
{
  "customer_name": "Arun Venkatesh",
  "phone": "+91 97415 30094",
  "email": "arun@example.com",
  "order_type": "Catering / Event Order",
  "event_date": "2024-12-20",
  "guest_count": 120,
  "message": "Full South Indian meal for wedding reception.",
  "items": [
    { "menu_item_id": 3, "quantity": 5 },
    { "name": "Custom Cake", "price": 800, "quantity": 1 }
  ]
}
```

Order statuses: `pending` → `confirmed` → `in_progress` → `completed` | `cancelled`

---

### ⭐ Reviews  `/api/reviews`

| Method | Path              | Auth  | Description                          |
|--------|-------------------|-------|--------------------------------------|
| GET    | /api/reviews      | Public | Approved reviews (paginated)         |
| POST   | /api/reviews      | Public | Submit a new review (pending approval)|
| GET    | /api/reviews/all  | Admin | All reviews including pending        |
| PATCH  | /api/reviews/:id  | Admin | Approve / feature a review           |
| DELETE | /api/reviews/:id  | Admin | Delete a review                      |

**GET /api/reviews** — query params:
- `featured=true` — only featured reviews
- `limit` — max results (default 10)

---

### 🔐 Admin  `/api/admin`

| Method | Path                 | Auth   | Description                        |
|--------|----------------------|--------|------------------------------------|
| POST   | /api/admin/setup     | Public | Create first owner account (once)  |
| POST   | /api/admin/login     | Public | Log in, receive JWT token          |
| GET    | /api/admin/me        | Admin  | Current user info                  |
| GET    | /api/admin/dashboard | Admin  | Summary stats + recent activity    |
| POST   | /api/admin/users     | Owner  | Create staff/manager account       |

**GET /api/admin/dashboard** — response:
```json
{
  "success": true,
  "data": {
    "menu":      { "total_available": 8 },
    "enquiries": { "total": 12, "new": 3 },
    "orders":    { "total": 47, "pending": 5 },
    "reviews":   { "total": 28, "pending_approval": 2, "avg_rating": 4.9 },
    "recent": {
      "enquiries": [...],
      "orders": [...]
    }
  }
}
```

---

## Database Schema

```
menu_categories   id, name, slug, sort_order
menu_items        id, category_id→, name, description, price, image_url,
                  badge, tags, is_available, is_featured, sort_order
enquiries         id, full_name, phone, email, enquiry_type, message,
                  status, admin_notes
reviews           id, reviewer_name, location, rating, body,
                  is_approved, is_featured
orders            id, customer_name, phone, email, order_type,
                  event_date, guest_count, message, status,
                  total_amount, admin_notes
order_items       id, order_id→, menu_item_id→, name, price, quantity, notes
admin_users       id, username, password_hash, role, is_active, last_login
```

---

## Connecting the Frontend

Replace the static form submit with a `fetch` call:

```javascript
// Contact form
document.querySelector('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const res = await fetch('https://your-api-domain.com/api/enquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      full_name:    document.getElementById('name').value,
      phone:        document.getElementById('phone').value,
      email:        document.getElementById('email').value,
      enquiry_type: document.getElementById('type').value,
      message:      document.getElementById('message').value,
    }),
  });
  const data = await res.json();
  if (data.success) showSuccessBanner();
});

// Load menu
const menuRes = await fetch('https://your-api-domain.com/api/menu');
const { data: menu } = await menuRes.json();
// menu is an array of categories, each with an `items` array
```

---

## Deployment (Railway / Render / Fly.io)

1. Push this folder to a GitHub repo.
2. Connect to Railway or Render; set env vars from `.env.example`.
3. Set `NODE_ENV=production` and a strong `JWT_SECRET`.
4. The SQLite file persists on a mounted volume — set `DB_PATH=/data/food_business.db`.
5. Update `ALLOWED_ORIGINS` to include `https://food-business-69w2.vercel.app`.

For production scale, swap `better-sqlite3` for **PostgreSQL** using `pg` + the same SQL logic — the schema is fully compatible.

---

## Project Structure

```
food-business-backend/
├── src/
│   ├── server.js              ← Express app + middleware setup
│   ├── db/
│   │   └── database.js        ← SQLite init, schema, seed data
│   ├── routes/
│   │   ├── menu.js            ← Menu CRUD
│   │   ├── enquiries.js       ← Contact form
│   │   ├── reviews.js         ← Customer reviews
│   │   ├── orders.js          ← Catering / bulk orders
│   │   └── admin.js           ← Auth + dashboard
│   └── middleware/
│       └── auth.js            ← JWT verification
├── data/                      ← SQLite DB file (auto-created)
├── .env.example
├── package.json
└── README.md
```
