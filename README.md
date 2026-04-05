# MARS: Marketplace and Retailing System

> A comprehensive, full-stack e-commerce marketplace platform engineered with a robust relational database backend.

<!-- 
To include a hero image or project banner, uncomment and update the line below:
![MARS Hero Image](link-to-your-image-here) 
-->

## Overview

**MARS (Marketplace and Retailing System)** is a highly structured, scalable e-commerce application developed as a project for the Level 2 Term 1 DBMS Sessional course (CSE 216) at BUET. Unlike basic CRUD applications, MARS features an expansive domain model covering the entire retail lifecycle—from product browsing, cart management, and complex checkout flows to shipment tracking, returns, targeted offers, and analytics. 

Built with a Next.js frontend and an Express/PostgreSQL backend, MARS demonstrates strong software engineering principles, emphasizing security, data integrity, and complex relational modeling.

###  Project Team

- [**Mehedi Hasan Kanon**](https://github.com/mehedihasankanon)
- [**Zarif Mahir**](https://github.com/zarifmahir) 

Supervised by: [**Junaed Younus Khan**](https://www.junaedyounuskhan.com/) (Lecturer, CSE, BUET)

---

## Tech Stack

### Frontend
- **Framework:** Next.js 16 (React 19)
- **Styling:** Tailwind CSS v4
- **State & Data Fetching:** Axios, React Hooks

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js (v5.2.1)
- **Media Management:** Cloudinary via Multer
- **Validation:** Zod, express-validator

### Database
- **Primary Database:** PostgreSQL hosten on [NeonDB](https://neon.tech/)
- **Querying:** Raw SQL and PL/pgSQL using `pg` and `pg-hstore`
- **Tooling:** Custom reset and seeding scripts for catalog population

---

## Architecture Overview

- **Client:** A Next.js frontend that handles routing, server-side rendering (where applicable), and UI state. 
- **API:** Node/Express REST API that securely manages business logic, media uploads, and request validation.
- **Data:** A PostgreSQL database enriched with triggers, stored procedures, and proper relational constraints to ensure atomicity and consistency for transactional data.

---

## Features

### Product & Catalog Management

- **Hierarchical Categories & Varieties:** Classification system for inventory.
- **Dynamic Catalog:** Product filtering, searching, and pagination.
- **Media Uploads:** Integrated with Cloudinary for seamless product image hosting.

### User & Account Management

- **Role-Based Workflows:** Distinct boundaries between customers, sellers, and administrators.
- **Wishlists & Cart:** Persistent cart states and user-specific wishlists.
- **Profile Management:** Address books, order history, and account settings.

### Transactional Core (Checkout & Orders)

- **Checkout Flow:** Order generation handling cart-to-order conversions.
- **Offers & Coupons:** Discount calculation engine supporting percentage-based (seller offers) and fixed promotional codes (from admin).

### Post-Purchase Lifecycle

- **Shipment Tracking:** Tracking from dispatch to delivery.
- **Returns & Reports:** Automated return request flows and seller scam reporting.
- **Reviews & Q&A:** User-generated content features directly tied to products and verified purchases.
- **Notifications:** Real-time user alert system.
- **Analytics:** Data analytics feature for admin dashboards and seller insights.

---

## Security Features

- **Authentication:** Secure token-based authentication using **JSON Web Tokens (JWT)**. Sessions are managed through `express-session` and cookies (`cookie-parser`).
- **Password Hashing:** Salted password hashing via **bcryptjs** before storage to protect user credentials.
- **Input Validation:** Strict payload validation via **Zod** and **express-validator** preventing injection attacks and malformed data entries.
- **CORS Protection:** Configured Cross-Origin Resource Sharing (`cors`) limiting API access to authorized domains.
- **Route Authorization:** Protected API endpoints utilizing custom middleware to enforce role-based access control (RBAC).

---

## Scalability & Performance Considerations

- **Database Optimization:** By utilizing raw `pg` bindings and PL/pgSQL, the system avoids heavy ORM overhead, executing optimized, direct queries for complex joins (e.g., catalog analytics, order aggregation).
- **Asset Offloading:** Images and media are stored on **Cloudinary**, significantly reducing server bandwidth.
- **Stateless Architecture:** The backend API is stateless, using JWT-based authentication where each request is independently verified, enabling horizontal scaling behind a load balancer.
<!--
    horizontal scaling -> basically adding more instances of the backend server to handle increased load, without worrying about session state since JWTs are stateless.
    load balancing -> distributing incoming API requests across multiple backend instances to ensure no single server becomes a bottleneck, improving performance and reliability.

    why our implementation does it well?
    -> because we NEVER store where or how a user is logged in so if server A does a processing, server B can do another from the same user without any issues. This is the core advantage of JWTs and stateless design.
 -->

---

## Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [PostgreSQL](https://www.postgresql.org/) (Running locally or via Docker)
- A [Cloudinary](https://cloudinary.com/) account for image uploads
- a NeonDB(https://neon.tech/) account for hosting the PostgreSQL database in the cloud (optional)

### 1. Clone the Repository
```bash
git clone https://github.com/mehedihasankanon/MARS.git
cd MARS/mars
```

### 2. Install Dependencies
Install all required packages from the project root:
```bash
npm install
```

### 3. Setup Environment Variables
You will need to configure environment variables for both the root environment and the backend environment.

Copy the example configuration files:
```bash
cp .env.example .env
cp backend/.env.example backend/.env
```
*(Fill out the `.env` files with your local PostgreSQL credentials, JWT secrets, and Cloudinary keys as outlined in the "Environment Variables" section below).*

### 4. Database Initialization & Seeding
Reset your database and seed it with dummy/catalog data to quickly test the application:
```bash
# Drops existing tables, recreates schema, and seeds base data
npm run db:seed-full
```

### 5. Run the Application
To run both the backend Express server and the Next.js frontend concurrently:
```bash
npm run dev:all
```
- Frontend will be available at: `http://localhost:3000`
- Backend API will be available at: `http://localhost:5001` (or as configured)

---

## Environment Variables

Copy and fill out the relevant variables in the `.env.example` file to the relevant `.env` files for the backend and frontend.

---

## Usage Guide

- **Administrators:** Can navigate to the analytics and reporting sections to oversee marketplace health, approve returns, and manage categories.
- **Users/Customers:** Can browse products, add items to cart, apply coupons, and track their shipment status via their profile.
- **Sellers:** Can list products, manage inventory (varieties), and answer customer questions via the Q&A routes.

---

## API Documentation

The backend exposes a comprehensive RESTful API under the `/backend/server/routes` structure. Key domains include:

- **`/api/auth`** - Login, Registration, Token Refresh.
- **`/api/products`** - Product querying, creation, and fetching varieties.
- **`/api/cart` & `/api/orders`** - Lifecycle of a transaction.
- **`/api/payments` & `/api/shipment`** - Post-checkout fulfillment.
- **`/api/analytics`** - System and sales aggregations.

*(Note: API routes are protected by JWT middleware. Include `Authorization: Bearer <token>` in your request headers for protected endpoints).*

---

## Project Structure

```text
MARS/
├── mars/
│   ├── backend/
│   │   ├── server/
│   │   │   ├── config/      # External service configurations
│   │   │   ├── controllers/ # Request handlers and business logic
│   │   │   ├── middleware/  # Auth, validation, and error handling
│   │   │   ├── models/      # Data access layer / SQL queries (not used in this project)
│   │   │   ├── routes/      # Express route definitions
│   │   │   ├── utils/       # Helper functions
│   │   │   └── server.js    # Express entry point
│   ├── database/            # Schema definitions, migrations and seeding scripts
│   ├── frontend/            # Next.js Client application
│   ├── package.json         # Project metadata and root scripts
│   └── .env.example         # Environment template
```

<!-- --- -->

<!-- ## Screenshots -->

<!-- 
To include screenshots, remove the comment tags and replace the URL with your image links. Examples:
![Home Page](link_to_home_page_image)
![Product Page](link_to_product_page_image)
![Admin Dashboard](link_to_admin_dashboard_image) 
-->

<!-- *UI previews and Database ER diagrams will be placed here.* -->

<!-- ---

## 🔮 Future Improvements

While this project satisfies the requirements of a rigorous DBMS academic course, potential future enhancements include:
- Implementing a caching layer (e.g., Redis) for product catalogs to improve query performance.
- Integrating real-world payment gateways (e.g., Stripe, SSLCommerz).
- Containerizing the application using Docker and docker-compose for easier deployment.
- Transitioning raw SQL files into a formal migration system (e.g., Flyway or db-migrate). -->

---

## License

This project is open-source and unlicensed for all purposes.
