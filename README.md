# Bahay Kubo

A product catalog of locally made furnitures with a simple admin area. Visitors can browse, search, and filter products by category; signed-in admins can add, edit and delete them.


## Tech Stack
1. Frontend -> Angular 22 + Tailwind CSS 3
2. Backend	-> Node.js + Express
3. Database -> MongoDB
4. Auth -> JWT

## Features
- Add a new product
- View list of products
- Filter products by category
- Edit products
- Delete products

## How to run locally

```bash
cd frontend && npm install && npm run build
cd backend && npm install && cp .env.example .env
npm start
```

Open http://localhost:4200. API calls are proxied to port 3000.

## API

Viewing is public. Changes need `Authorization: Bearer <token>`.

| Method | Endpoint             | Auth | Description                          |
| ------ | -------------------- | ---- | ------------------------------------ |
| POST   | `/api/auth/register` | No   | Create an admin                      |
| POST   | `/api/auth/login`    | No   | Sign in, returns a token             |
| GET    | `/api/products`      | No   | List products (`?category=Name`)     |
| GET    | `/api/categories`    | No   | List categories                      |
| POST   | `/api/products`      | Yes  | Add a product                        |
| PUT    | `/api/products/:id`  | Yes  | Update a product                     |
| DELETE | `/api/products/:id`  | Yes  | Delete a product                     |

