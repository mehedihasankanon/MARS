# MARS Frontend - Complete Beginner's Guide

This document explains every part of the MARS (Marketplace and Retailing System) frontend in detail. It assumes you are new to Next.js, React, and Express.

---

## Table of Contents

1. [What is This Project?](#1-what-is-this-project)
2. [Technology Stack Explained](#2-technology-stack-explained)
3. [Project Structure Overview](#3-project-structure-overview)
4. [How Next.js Routing Works](#4-how-nextjs-routing-works)
5. [Configuration Files](#5-configuration-files)
6. [The API Layer (lib/api.js)](#6-the-api-layer-libapijs)
7. [Authentication System (context/AuthContext.js)](#7-authentication-system-contextauthcontextjs)
8. [The Navbar Component (components/Navbar.js)](#8-the-navbar-component-componentsnavbarjs)
9. [Global Styles (globals.css)](#9-global-styles-globalscss)
10. [Root Layout (app/layout.js)](#10-root-layout-applayoutjs)
11. [Home Page (app/page.js)](#11-home-page-apppagejs)
12. [Login Page (app/auth/login/page.js)](#12-login-page-appauthloginpagejs)
13. [Register Page (app/auth/register/page.js)](#13-register-page-appauthregisterpagejs)
14. [Products Page (app/products/page.js)](#14-products-page-appproductspagejs)
15. [Product Detail Page (app/products/[id]/page.js)](#15-product-detail-page-appproductsidpagejs)
16. [Cart Page (app/cart/page.js)](#16-cart-page-appcartpagejs)
17. [Checkout Page (app/checkout/page.js)](#17-checkout-page-appcheckoutpagejs)
18. [Orders Page (app/orders/page.js)](#18-orders-page-apporderspagejs)
19. [Profile Page (app/profile/page.js)](#19-profile-page-appprofilepagejs)
20. [Dashboard Page (app/dashboard/page.js)](#20-dashboard-page-appdashboardpagejs)
21. [Admin Page (app/admin/page.js)](#21-admin-page-appadminpagejs)
22. [Categories Page (app/categories/page.js)](#22-categories-page-appcategoriespagejs)
23. [Static Pages (About, Contact, Privacy, Terms)](#23-static-pages)
24. [How the Frontend Talks to the Backend](#24-how-the-frontend-talks-to-the-backend)
25. [Common Patterns Used Throughout](#25-common-patterns-used-throughout)

---

## 1. What is This Project?

MARS is a full-stack e-commerce web application. It has three types of users:

- **Customer**: Can browse products, add items to a cart, place orders, and view order history.
- **Seller**: Can list products for sale and manage their listings through a dashboard.
- **Admin**: Can view all users, manage categories, and has elevated permissions.

The frontend is what users see and interact with in their browser. The backend is a separate server that handles data storage, authentication, and business logic.

---

## 2. Technology Stack Explained

### Next.js (v16)
Next.js is a React framework. React by itself only handles the UI (what you see on screen). Next.js adds:
- **File-based routing**: Instead of configuring routes in a file, you create folders. A file at `app/products/page.js` automatically becomes the `/products` URL.
- **Server-side rendering**: Pages can be rendered on the server before being sent to the browser, which improves initial load speed.
- **Font optimization**: Next.js can load Google Fonts efficiently without blocking page rendering.
- **Image optimization**: The `<Image>` component from Next.js automatically resizes and lazy-loads images.

### React (v19)
React is a JavaScript library for building user interfaces. Key concepts used in this project:
- **Components**: Reusable pieces of UI. For example, `Navbar` is a component used on every page.
- **State (`useState`)**: Variables that, when changed, cause the component to re-render. For example, the search query on the products page.
- **Effects (`useEffect`)**: Code that runs after a component renders. Used to fetch data from the backend when a page loads.
- **Context (`createContext`, `useContext`)**: A way to share data across many components without passing it through every level. The `AuthContext` shares login state across the entire app.

### Tailwind CSS (v4)
Tailwind is a CSS framework where you style elements using class names directly in your HTML/JSX. Instead of writing a separate CSS file with `.button { background: red; padding: 10px; }`, you write `className="bg-red-500 p-2.5"` directly on the element. Key patterns:
- `bg-[#0A0A0A]`: Sets background color to the hex value `#0A0A0A`.
- `text-white`: Sets text color to white.
- `p-4`: Adds padding of 1rem (16px) on all sides.
- `mb-8`: Adds margin-bottom of 2rem (32px).
- `flex`: Uses CSS Flexbox for layout.
- `grid md:grid-cols-3`: Creates a grid with 3 columns on medium screens and up.
- `hidden md:flex`: Hidden on small screens, visible as flex on medium screens and up.
- `hover:bg-[#D14F1E]`: Changes background color on mouse hover.
- `transition-colors`: Smoothly animates color changes.
- `animate-pulse`: Creates a pulsing animation (used for loading skeletons).

### Axios
Axios is a library for making HTTP requests (GET, POST, PUT, DELETE) from the browser to the backend server. It is configured once in `lib/api.js` with the base URL and authentication token.

### Express.js (Backend)
Express is a Node.js framework for building web servers. It handles incoming HTTP requests, runs business logic (like checking passwords or querying the database), and sends responses back. The frontend communicates with Express through API calls.

### PostgreSQL (Database)
PostgreSQL is the relational database that stores all data: users, products, orders, carts, addresses, categories, etc. The backend queries PostgreSQL using raw SQL statements through the `pg` library.

### JWT (JSON Web Tokens)
JWTs are used for authentication. When a user logs in, the backend creates a token containing the user's ID and role. This token is stored in the browser's `localStorage` and sent with every subsequent request so the backend knows who is making the request.

---

## 3. Project Structure Overview

```
mars/
  frontend/
    src/
      app/                    <-- All pages live here (Next.js App Router)
        layout.js             <-- Root layout wrapping every page
        page.js               <-- Home page (/)
        globals.css           <-- Global styles and CSS variables
        auth/
          login/page.js       <-- Login page (/auth/login)
          register/page.js    <-- Register page (/auth/register)
        products/
          page.js             <-- Products listing (/products)
          [id]/page.js        <-- Single product detail (/products/:id)
        cart/page.js          <-- Shopping cart (/cart)
        checkout/page.js      <-- Checkout flow (/checkout)
        orders/page.js        <-- Order history (/orders)
        profile/page.js       <-- User profile (/profile)
        dashboard/page.js     <-- Seller dashboard (/dashboard)
        admin/page.js         <-- Admin panel (/admin)
        categories/page.js   <-- Categories listing (/categories)
        about/page.js         <-- About page (/about)
        contact/page.js       <-- Contact form (/contact)
        privacy/page.js       <-- Privacy policy (/privacy)
        terms/page.js         <-- Terms of service (/terms)
      components/
        Navbar.js             <-- Navigation bar component
      context/
        AuthContext.js        <-- Global authentication state
      lib/
        api.js                <-- Axios instance for API calls
    public/                   <-- Static files (images, favicon)
    next.config.mjs           <-- Next.js configuration
    postcss.config.mjs        <-- PostCSS configuration (for Tailwind)
    jsconfig.json             <-- Path aliases configuration
    eslint.config.mjs         <-- Linting rules

  backend/
    server/
      server.js               <-- Express server entry point
      middleware/
        jwt.js                <-- Authentication middleware
      controllers/            <-- Business logic for each resource
        authController.js     <-- Login/Register logic
        productController.js  <-- Product CRUD
        cartController.js     <-- Cart operations
        orderController.js    <-- Order placement and retrieval
        userController.js     <-- User management
        addressController.js  <-- Address CRUD
        categoryController.js <-- Category operations
      routes/                 <-- URL-to-controller mapping
        authRoutes.js
        productRoutes.js
        cartRoutes.js
        orderRoutes.js
        userRoutes.js
        addressRoutes.js
        categoryRoutes.js

  database/
    db.js                     <-- PostgreSQL connection pool
```

---

## 4. How Next.js Routing Works

Next.js uses **file-based routing** with the App Router (the `app/` directory). Here is how folder names map to URLs:

| File Path                          | URL in Browser     |
|------------------------------------|--------------------|
| `app/page.js`                      | `/`                |
| `app/products/page.js`             | `/products`        |
| `app/products/[id]/page.js`        | `/products/abc123` |
| `app/auth/login/page.js`           | `/auth/login`      |
| `app/auth/register/page.js`        | `/auth/register`   |
| `app/cart/page.js`                 | `/cart`            |
| `app/checkout/page.js`             | `/checkout`        |
| `app/orders/page.js`               | `/orders`          |
| `app/profile/page.js`              | `/profile`         |
| `app/dashboard/page.js`            | `/dashboard`       |
| `app/admin/page.js`                | `/admin`           |

The `[id]` folder name is a **dynamic route**. The square brackets mean the value is variable. When a user visits `/products/abc-123`, the `id` parameter equals `"abc-123"` and can be read using `useParams()`.

Every `page.js` file must export a default React component. That component becomes the page content.

`layout.js` is a special file that wraps all pages. The root `layout.js` provides the HTML structure, fonts, the `AuthProvider` (for global auth state), and the `Navbar` (which appears on every page).

---

## 5. Configuration Files

### package.json
Located at `mars/package.json`. Defines the project name, scripts, and dependencies.

**Key scripts:**
- `npm run dev`: Starts the Next.js frontend development server (hot reload on code changes).
- `npm run server`: Starts the Express backend using `nodemon` (auto-restarts on code changes).
- `npm run dev:all`: Runs both frontend and backend simultaneously using `concurrently`.

**Key dependencies:**
- `next`, `react`, `react-dom`: The frontend framework.
- `express`: The backend framework.
- `pg`: PostgreSQL client for Node.js.
- `bcryptjs`: Password hashing library.
- `jsonwebtoken`: JWT creation and verification.
- `axios`: HTTP client for making API requests.
- `cors`: Middleware that allows the frontend (port 3000) to talk to the backend (port 5001).
- `tailwindcss`, `@tailwindcss/postcss`: CSS framework and its PostCSS plugin.

### next.config.mjs
The Next.js configuration file. Currently empty (using all defaults). You could add custom settings here like environment variables, image domains, redirects, etc.

### postcss.config.mjs
Configures PostCSS to use the Tailwind CSS plugin. PostCSS is a tool that transforms CSS; Tailwind uses it to process its utility classes into actual CSS.

### jsconfig.json
Configures a path alias: `@/*` maps to `./src/*`. This means instead of writing `import Navbar from '../../../components/Navbar'`, you can write `import Navbar from '@/components/Navbar'`. The `@` symbol represents the `src/` directory.

### eslint.config.mjs
Configures ESLint (a code quality tool) with Next.js recommended rules. It checks your code for common errors and style issues.

---

## 6. The API Layer (lib/api.js)

**File**: `frontend/src/lib/api.js`

This file creates and exports a pre-configured Axios instance that all components use to communicate with the Express backend.

### What it does:

1. **Sets the base URL**: All requests go to `http://localhost:5001/api`. So when a component calls `api.get('/products')`, the actual request goes to `http://localhost:5001/api/products`.

2. **Sets default headers**: Every request includes `Content-Type: application/json`, telling the backend that the request body is JSON.

3. **Attaches the JWT token automatically**: An Axios **request interceptor** runs before every outgoing request. It reads the JWT token from `localStorage` (where it was saved during login) and adds it to the `Authorization` header as `Bearer <token>`. This means individual components never need to manually handle authentication headers.

### How components use it:

```javascript
import api from '@/lib/api';

// GET request (fetching data)
const response = await api.get('/products');
const products = response.data;

// POST request (sending data)
const response = await api.post('/auth/login', { email, password });
const { token, user } = response.data;

// PUT request (updating data)
await api.put('/cart/items/product-id', { quantity: 3 });

// DELETE request (removing data)
await api.delete('/cart/items/product-id');
```

---

## 7. Authentication System (context/AuthContext.js)

**File**: `frontend/src/context/AuthContext.js`

This is the core of the authentication system. It uses React Context to provide login state to every component in the app.

### What is React Context?

React Context is like a global variable for your component tree. Normally, to pass data from a parent component to a deeply nested child, you would need to pass it through every intermediate component as "props." Context lets any component access the data directly by calling `useAuth()`.

### What AuthContext provides:

| Value      | Type     | Description                                      |
|------------|----------|--------------------------------------------------|
| `user`     | Object   | The logged-in user's data (name, email, role), or `null` if not logged in |
| `token`    | String   | The JWT token string, or `null`                  |
| `login`    | Function | Accepts `(email, password)`, sends login request, stores token, redirects to home |
| `register` | Function | Accepts form data object, sends register request, stores token, redirects to home |
| `logout`   | Function | Clears token and user data, redirects to home    |
| `loading`  | Boolean  | `true` while checking if a saved token exists (prevents flash of login page) |

### How it works step by step:

**On first page load (or refresh):**
1. The `AuthProvider` component mounts.
2. `useEffect` runs and checks `localStorage` for a saved token.
3. If a token exists, it sends `GET /api/users/profile` to the backend.
4. The backend verifies the token and returns the user's data (including their role).
5. The user data is stored in state, making the user "logged in."
6. If the token is invalid or expired, it is removed from `localStorage`.

**When a user logs in:**
1. The login page calls `login(email, password)`.
2. `AuthContext.login()` sends `POST /api/auth/login` to the backend.
3. The backend checks the credentials against the database.
4. If valid, it returns a JWT token and user data.
5. The token is saved to `localStorage` (persists across page refreshes).
6. The user data is stored in state.
7. The browser navigates to the home page.

**When a user registers:**
1. Same flow as login, but sends `POST /api/auth/register` with full form data.
2. The backend creates the user in PostgreSQL and returns a token.

**When a user logs out:**
1. The token is removed from `localStorage`.
2. User and token state are set to `null`.
3. The browser navigates to the home page.

### How components use it:

```javascript
import { useAuth } from '@/context/AuthContext';

function SomeComponent() {
  const { user, login, logout, loading } = useAuth();

  if (loading) return <p>Loading...</p>;
  if (!user) return <p>Please log in</p>;
  return <p>Hello, {user.first_name}!</p>;
}
```

---

## 8. The Navbar Component (components/Navbar.js)

**File**: `frontend/src/components/Navbar.js`

The navigation bar appears on every page (it is included in `layout.js`). It is "auth-aware," meaning it shows different content depending on whether a user is logged in.

### Behavior:

| State         | What is shown                                              |
|---------------|------------------------------------------------------------|
| Not logged in | Logo, Home, Products, Login button, Sign Up button         |
| Logged in (Customer) | Logo, Home, Products, Cart, Orders, user's name, Logout |
| Logged in (Seller)   | Same as customer + Dashboard link                       |
| Logged in (Admin)    | Same as seller + Admin Panel link                       |

### Responsive Design:

- **Desktop (768px and wider)**: Full horizontal navigation bar with all links visible in a row.
- **Mobile (below 768px)**: Only the logo and a hamburger menu icon are visible. Clicking the hamburger icon opens a vertical dropdown menu with all links.

### Key implementation details:

- Uses `useState` to track whether the mobile menu is open or closed.
- Uses `useAuth()` to get the current user and logout function.
- The `loading` state from auth is used to prevent a brief flash where the "Login" button appears before the saved token is checked.
- Two helper components (`NavLink` and `MobileNavLink`) are defined at the bottom of the file to avoid repeating the same styling for each link.
- The navbar is `sticky top-0`, meaning it stays at the top of the viewport when scrolling.
- `backdrop-blur-md` gives it a frosted glass effect.

---

## 9. Global Styles (globals.css)

**File**: `frontend/src/app/globals.css`

This file defines the global CSS for the entire application. It is imported in `layout.js`, so its styles apply to every page.

### What it contains:

1. **Tailwind import**: `@import "tailwindcss"` activates Tailwind CSS processing.

2. **CSS Custom Properties (Variables)**: Defined in `:root`, these are reusable color values:
   - `--mars-primary: #E85D26` (Mars orange, the main brand color)
   - `--mars-bg: #0A0A0A` (Dark background)
   - `--mars-bg-card: #111111` (Slightly lighter background for cards)
   - `--mars-text: #FFFFFF` (White text)
   - `--mars-text-secondary: #9CA3AF` (Gray text for descriptions)
   - `--mars-gradient: linear-gradient(135deg, #E85D26, #F59E0B)` (Orange-to-gold gradient)

3. **Custom utility classes**:
   - `.mars-glow`: Adds an orange box-shadow glow effect.
   - `.mars-text-gradient`: Makes text display with the orange-to-gold gradient fill.
   - `.mars-pulse-glow`: An animated pulsing glow for call-to-action elements.

4. **Base styles**:
   - `body`: Sets the deep dark background and white text color.
   - `html`: Smooth scrolling behavior.
   - `::selection`: When a user highlights text, it appears with an orange tint.

---

## 10. Root Layout (app/layout.js)

**File**: `frontend/src/app/layout.js`

This is the most important layout file. It wraps every single page in the application.

### What it does:

1. **Loads Google Fonts**: Imports `Geist` (sans-serif for body text) and `Geist_Mono` (monospaced for code). These are loaded through Next.js font optimization, which means they are self-hosted and do not make external requests to Google.

2. **Sets page metadata**: The `metadata` export sets the HTML `<title>` tag to "MARS -- Marketplace and Retailing System" and provides a `<meta description>` for search engines. It also points to the favicon file.

3. **Defines the HTML structure**: Returns `<html>` and `<body>` tags. The body tag includes the font CSS variables as class names.

4. **Wraps everything in AuthProvider**: The `<AuthProvider>` component from `AuthContext.js` wraps all children. This means every page in the app can access authentication state through `useAuth()`.

5. **Includes the Navbar**: The `<Navbar />` component is placed above `{children}`, so it appears at the top of every page.

6. **Renders page content**: The `{children}` prop is where the current page's content appears. When you navigate from `/` to `/products`, only `{children}` changes; the layout, navbar, and auth provider remain.

### Component hierarchy:

```
<html>
  <body>
    <AuthProvider>          // Provides user/login/logout to all pages
      <Navbar />            // Navigation bar at the top
      {children}            // The current page content
    </AuthProvider>
  </body>
</html>
```

---

## 11. Home Page (app/page.js)

**File**: `frontend/src/app/page.js`

This is the landing page at URL `/`. It is a "client component" (`'use client'` at the top), meaning it runs in the browser.

### Sections (top to bottom):

**1. Hero Section**
- Full-width area with a dark-to-orange gradient background.
- Contains the MARS logo, a large heading ("Welcome to MARS"), a tagline, and two call-to-action buttons.
- "Browse Products" button links to `/products`.
- "Start Selling" button links to `/auth/register`.
- A decorative blurred circle creates an ambient orange glow behind the content.

**2. Features Section**
- Three cards in a grid layout explaining why users should choose MARS.
- Card 1: "Wide Selection" - Browse thousands of products.
- Card 2: "Secure & Safe" - Transaction protection.
- Card 3: "Fast Shipping" - Quick delivery with tracking.
- Each card has an icon, a title, and a description.

**3. How It Works Section**
- Three numbered steps: Browse & Discover, Add to Cart, Checkout & Enjoy.
- Each step has a numbered orange circle, a title, and a description.
- Helps new users understand the buying process.

**4. Call to Action Section**
- Orange gradient background section urging users to create an account.
- Contains a "Create an Account" button linking to `/auth/register`.

**5. Footer**
- Four-column layout: Brand info, Explore links, Company links, Legal links.
- Copyright notice at the bottom.
- Links to Products, Categories, About, Contact, Privacy Policy, and Terms of Service.

---

## 12. Login Page (app/auth/login/page.js)

**File**: `frontend/src/app/auth/login/page.js`

URL: `/auth/login`

### Purpose:
Allows existing users to sign in with their email and password.

### State variables:
- `email`: The text in the email input field.
- `password`: The text in the password input field.
- `error`: An error message string (empty if no error).
- `isLoading`: Boolean, true while waiting for the backend response.

### How the form works:

1. The user types their email and password into the input fields.
2. Each input field is a "controlled component": its `value` is tied to state, and `onChange` updates state on every keystroke.
3. When the form is submitted (user clicks "Sign In"), `handleSubmit` runs.
4. `e.preventDefault()` stops the browser from reloading the page (the default behavior of HTML form submission).
5. The `login()` function from `AuthContext` is called with the email and password.
6. If successful, `AuthContext` stores the JWT token and redirects to the home page.
7. If it fails (wrong password, user not found), the error from the backend is displayed in a red banner above the form.
8. The submit button is disabled while `isLoading` is true to prevent double-submission.

### Layout:
- Centered card on a dark background.
- Contains a title, a link to the register page for new users, an error display area, the form fields, and the submit button.

---

## 13. Register Page (app/auth/register/page.js)

**File**: `frontend/src/app/auth/register/page.js`

URL: `/auth/register`

### Purpose:
Allows new users to create an account as either a Customer or a Seller.

### State variables:
- `formData`: An object containing all form field values: `username`, `email`, `password`, `confirmPassword`, `firstName`, `lastName`, `phone`, `role`.
- `error`: Error message string.
- `isLoading`: Boolean for loading state.

### Form fields:
1. First Name + Last Name (side by side in a two-column grid).
2. Username.
3. Email address.
4. Phone number.
5. Password.
6. Confirm Password.
7. Role selection: Two toggle buttons -- "Buy Products" (customer) or "Sell Products" (seller).

### How the generic change handler works:

Instead of writing a separate handler for each input, there is one `handleChange` function. Each input has a `name` attribute (like `name="email"`). When the user types, `handleChange` reads `e.target.name` (which input changed) and `e.target.value` (what was typed), then updates only that field in `formData` using the spread operator pattern: `{ ...formData, [name]: value }`.

### Client-side validation:
- Checks that passwords match before sending to the backend.
- Checks that the password is at least 6 characters long.
- If either check fails, an error message is shown without making a network request.

### On successful registration:
The `register()` function from `AuthContext` sends the data to `POST /api/auth/register`, stores the returned token, and redirects to the home page.

---

## 14. Products Page (app/products/page.js)

**File**: `frontend/src/app/products/page.js`

URL: `/products`

### Purpose:
Displays all products from the database in a browsable, filterable grid. This is the main shopping page.

### State variables:
- `products`: The complete list of products fetched from the API.
- `filteredProducts`: The list after applying search and category filters.
- `searchQuery`: The text typed in the search bar.
- `selectedCategory`: The currently selected category from the dropdown (or "All").
- `categories`: A list of unique category names derived from the products data.
- `loading`: True while the initial data fetch is in progress.
- `error`: Error message if the API call fails.

### Data fetching:
When the page first loads, `useEffect` (with an empty dependency array `[]`) runs once. It calls `GET /api/products`, which returns all products. The response includes each product's name, description, price, stock quantity, category name, seller name, and more.

### Client-side filtering:
A second `useEffect` watches for changes to `searchQuery`, `selectedCategory`, or `products`. When any of these change, it filters the products list:
1. If a category is selected (not "All"), keep only products in that category.
2. If search text exists, keep only products whose name contains the search text (case-insensitive).

This filtering happens entirely in the browser since all products are already loaded into memory. This makes searching feel instant with no network delay.

### Search and filter bar:
- A text input with a magnifying glass icon for searching product names.
- A dropdown (`<select>`) populated with unique category names extracted from the products data.

### Product cards:
Each product is rendered as a card that links to `/products/{product_id}`. Each card shows:
- A placeholder image area.
- A category badge (small orange label).
- The product name (truncated to 2 lines).
- A short description preview.
- The price in orange text.
- Stock status: green "X in stock" badge or red "Out of stock" badge.
- The seller's username.

### Loading skeleton:
While data is loading, six placeholder cards are shown with pulsing gray blocks (using `animate-pulse`). This gives the user visual feedback that content is loading.

### Responsive grid:
- Mobile: 1 column.
- Tablet (`sm`): 2 columns.
- Desktop (`lg`): 3 columns.

---

## 15. Product Detail Page (app/products/[id]/page.js)

**File**: `frontend/src/app/products/[id]/page.js`

URL: `/products/:id` (for example, `/products/a1b2c3d4`)

### Purpose:
Shows full details of a single product and allows logged-in customers to add it to their cart.

### Dynamic routing:
The `[id]` folder name makes this a dynamic route. The `useParams()` hook from Next.js returns an object like `{ id: "a1b2c3d4" }`, which is the product's UUID from the URL.

### State variables:
- `product`: The product data object from the API.
- `quantity`: How many units the user wants to add to their cart (starts at 1).
- `loading`: True while fetching product data.
- `addingToCart`: True while the add-to-cart request is in progress.
- `cartMessage`: An object `{ type: 'success'|'error', text: '...' }` for feedback after the cart action.

### Data fetching:
On page load, `useEffect` calls `GET /api/products/:id` to fetch the specific product's details.

### Add to Cart:
When the user clicks "Add to Cart":
1. If not logged in, they are redirected to the login page.
2. `POST /api/cart/items` is called with `{ product_id, quantity }`.
3. The JWT token is automatically attached by the `api.js` interceptor.
4. On success, a green message appears: "Added X item(s) to your cart!"
5. On failure, a red error message appears.

### Layout:
- **Breadcrumb navigation**: "Products / Product Name" at the top.
- **Two columns on desktop**: Left column has the product image placeholder. Right column has category badge, product name, seller info, price, description, condition, stock availability, quantity selector, and add-to-cart button.
- **Quantity selector**: Minus button, number display, plus button. Minimum is 1, maximum is the available stock.
- **Out of stock**: If stock is 0, the add-to-cart section is replaced with a red "out of stock" message.

---

## 16. Cart Page (app/cart/page.js)

**File**: `frontend/src/app/cart/page.js`

URL: `/cart`

### Purpose:
Shows the customer's shopping cart contents. Allows quantity updates, item removal, and proceeding to checkout.

### Access control:
- If not logged in, the user is redirected to `/auth/login`.
- The cart API endpoints require the "customer" role.

### Data fetching (enrichment process):
The cart API (`GET /api/cart`) returns items with only `product_id`, `quantity`, and `net_price`. To display product names and unit prices, the page makes an additional `GET /api/products/:id` request for each item. These requests are made in parallel using `Promise.all()` for better performance.

### State variables:
- `cart`: Raw cart data from the API.
- `cartItems`: Enriched items with full product details.
- `loading`: True during data fetch.
- `updating`: The product ID currently being updated (prevents double-click issues).
- `error`: Error message string.

### Cart item operations:
- **Update quantity**: Clicking + or - calls `PUT /api/cart/items/:productId` with the new quantity, then refreshes the entire cart.
- **Remove item**: Clicking "Remove" calls `DELETE /api/cart/items/:itemId`, then refreshes the cart.
- **Cart total**: Calculated by summing all items' `net_price` values.

### Layout:
- **Page header**: Shows "Shopping Cart" and the item count.
- **Empty state**: If the cart is empty, shows a message with a link to browse products.
- **Two-column layout** (when items exist):
  - Left (2/3 width): List of cart items. Each item shows a placeholder image, product name (linked to detail page), unit price, quantity controls (- / number / +), total price for that line, and a remove button.
  - Right (1/3 width): Order summary sidebar showing subtotal, shipping note, total, a "Proceed to Checkout" button, and a "Continue Shopping" link. This sidebar is `sticky`, meaning it stays visible while scrolling through a long cart.

---

## 17. Checkout Page (app/checkout/page.js)

**File**: `frontend/src/app/checkout/page.js`

URL: `/checkout`

### Purpose:
The final step before placing an order. The user reviews their cart, selects or enters a shipping address, and clicks "Place Order."

### Data fetching:
On page load, three things are fetched in parallel:
1. `GET /api/cart` - The current cart contents.
2. `GET /api/addresses` - The user's saved shipping addresses.
3. `GET /api/products/:id` - For each cart item, to get product names and prices.

### Address selection:
- If the user has previously saved addresses, they are shown as radio button options.
- There is always an "+ Add new address" option.
- If "new" is selected, a form appears with fields for House/Apt, Street, City, and Zip Code.
- When placing an order with a new address, the address is first created via `POST /api/addresses`, then the returned `address_id` is used for the order.

### Order placement flow:
1. Validate that the cart is not empty.
2. If using a new address, validate required fields (street, city, zip code) and create the address.
3. Build an `Items` array: `[{ product_id, quantity }, ...]`.
4. Send `POST /api/orders` with `{ Items, addressId, deliveryFee }`.
5. The backend runs a database **transaction** that:
   - Calculates the total amount.
   - Creates the order record.
   - Creates order item records.
   - Decrements product stock quantities.
   - Creates a shipment record.
   - Clears the customer's cart.
   - Commits everything (or rolls back if any step fails).
6. On success, redirect to `/orders`.

### Layout:
- Two-column layout:
  - Left: Order items review (list of products with quantities and prices) + shipping address section.
  - Right: Order summary showing subtotal, delivery fee ($5.99), total, and "Place Order" button.

---

## 18. Orders Page (app/orders/page.js)

**File**: `frontend/src/app/orders/page.js`

URL: `/orders`

### Purpose:
Shows the logged-in user's order history. Each order displays its status, date, items, and total amount.

### Data fetching:
Calls `GET /api/orders/my-orders`. The backend uses `json_agg` (a PostgreSQL aggregation function) to bundle order items into the order object, so each order comes with an `items` array.

### Order status badges:
Each order has a status (from the database), and the badge color changes accordingly:
- Pending: Yellow
- Processing: Blue
- Shipped: Purple
- Delivered: Green
- Cancelled: Red

### Layout:
Each order is rendered as a card containing:
- **Header row**: Shortened order ID (first 8 characters of the UUID), formatted date, and status badge.
- **Items section**: List of items showing quantity, product ID (linked to product page), and net price.
- **Footer**: Delivery fee, item count, and total amount in orange text.

---

## 19. Profile Page (app/profile/page.js)

**File**: `frontend/src/app/profile/page.js`

URL: `/profile`

### Purpose:
Displays the logged-in user's account information and provides quick navigation links.

### No API call needed:
The user data is already available from `AuthContext` (loaded at login or page refresh). This page simply reads from `useAuth()`.

### Layout:
1. **Profile header card**: Shows an avatar (first letter of the user's name on an orange gradient circle), full name, username, and a role badge (Customer/Seller/Admin with different colors).
2. **Account details card**: A grid showing email, username, phone number, and "Member Since" date.
3. **Quick actions grid**: Shortcut cards that link to:
   - My Orders (all users)
   - Shopping Cart (customers only)
   - Seller Dashboard (sellers only)
   - Browse Products (all users)
4. **Logout button**: Red-text button at the bottom.

---

## 20. Dashboard Page (app/dashboard/page.js)

**File**: `frontend/src/app/dashboard/page.js`

URL: `/dashboard`

### Purpose:
The seller's management interface. Sellers can view their existing product listings and create new ones.

### Access control:
Only users with `role="seller"` or `role="admin"` can access this page. Customers are redirected to the home page.

### Two-tab interface:

**Tab 1: "My Products"**
- Fetches all products via `GET /api/products`, then filters client-side to show only products where `seller_name` matches the logged-in user's username.
- Displays products in a card grid showing name, category, price, stock status, condition, and listing date.
- If no products exist, shows an empty state with a button to switch to the "Add Product" tab.

**Tab 2: "Add Product"**
- A form to create a new product listing.
- Form fields: Product Name (required), Description, Unit Price (required), Stock Quantity, Category (required, populated from `GET /api/categories`), and Condition (dropdown: New, Like New, Used, Refurbished).
- On submit, sends `POST /api/products` with the form data. The JWT token identifies the seller.
- On success: Clears the form, shows a success message, refetches the products list, and switches back to the "My Products" tab after 1.5 seconds.

### Categories:
The category list is fetched from `GET /api/categories` (a dedicated endpoint) so that the seller can select a category for their product from a dropdown menu.

---

## 21. Admin Page (app/admin/page.js)

**File**: `frontend/src/app/admin/page.js`

URL: `/admin`

### Purpose:
The administrator's management panel. Admins can view all registered users, search/filter them, and see platform statistics.

### Access control:
Only users with `role="admin"` can access this page. Non-admins are redirected.

### Data fetching:
Calls `GET /api/users` (admin-only endpoint). The backend returns all users with their determined role (admin, seller, or customer) by joining the Users table with the Admins and Sellers tables.

### Statistics cards:
Four cards at the top showing:
- Total Users
- Number of Admins
- Number of Sellers
- Number of Customers

### Search and filter:
- A text input that searches across username, email, first name, and last name.
- A dropdown filter for role (All, Admin, Seller, Customer).
- Filtering is done client-side since all users are already loaded.

### User table:
A table/grid showing each user's:
- Full name and username
- Email address
- Phone number
- Role badge (color-coded: admin=red, seller=amber, customer=green)
- Last login date
- Join date

---

## 22. Categories Page (app/categories/page.js)

**File**: `frontend/src/app/categories/page.js`

URL: `/categories`

### Purpose:
Displays all product categories. If the user is an admin, they can create new categories.

### Data fetching:
Calls `GET /api/categories`, which returns all categories with their parent category name (for sub-categories).

### Admin features:
If `user.role === 'admin'`, a "+ Add Category" button appears. Clicking it reveals a form with:
- Name (required, max 50 characters)
- Description (optional)
- Parent Category (optional dropdown, makes it a sub-category)

Creating a category sends `POST /api/categories`.

### Category display:
Categories are shown in a grid of cards. Each card links to `/products?category=CategoryName` (the products page filtered by that category). Cards show the category name, description, and parent category if applicable.

---

## 23. Static Pages

### About Page (app/about/page.js) - URL: `/about`
An informational page describing what MARS is and its key features (multi-role system, shopping flow, secure auth, PostgreSQL database). Also shows the tech stack in a grid (Frontend: Next.js, Backend: Express.js, Database: PostgreSQL, Auth: JWT + bcrypt).

### Contact Page (app/contact/page.js) - URL: `/contact`
A simple contact form with Name, Email, and Message fields. Currently frontend-only (no backend endpoint). On submit, shows a "Message Sent!" confirmation. In a real app, this would send the data to a backend endpoint or email service.

### Privacy Page (app/privacy/page.js) - URL: `/privacy`
A privacy policy page with sections covering: Information We Collect, How We Use Your Information, Data Security (mentions bcrypt and JWT), and Your Rights.

### Terms Page (app/terms/page.js) - URL: `/terms`
A terms of service page with sections covering: Acceptance of Terms, User Accounts, Seller Responsibilities, Purchases and Orders (mentions the order status flow), and Limitation of Liability.

---

## 24. How the Frontend Talks to the Backend

The communication between frontend and backend follows a standard REST API pattern:

```
Browser (Next.js)  -->  HTTP Request  -->  Express Server  -->  PostgreSQL
                   <--  JSON Response <--                  <--
```

### Request flow for a typical action (adding to cart):

1. User clicks "Add to Cart" on the product detail page.
2. The click handler calls `api.post('/cart/items', { product_id, quantity })`.
3. The `api.js` interceptor reads the JWT from `localStorage` and adds it to the `Authorization` header.
4. Axios sends an HTTP POST request to `http://localhost:5001/api/cart/items`.
5. Express receives the request. The route is defined in `cartRoutes.js`:
   ```
   router.post("/items", authenticateToken, authorizeRoles("customer"), cartController.addItemToCart);
   ```
6. `authenticateToken` middleware verifies the JWT and adds `req.user = { userId, role }`.
7. `authorizeRoles("customer")` checks that `req.user.role` is "customer."
8. `cartController.addItemToCart` runs the business logic: ensures a cart exists, looks up the product price, and inserts/updates the cart item in PostgreSQL.
9. Express sends a JSON response: `{ message: "Item added to cart" }`.
10. Axios receives the response in the browser.
11. The component updates its state to show a success message.

### API endpoints used by the frontend:

| Frontend Action          | HTTP Method | Backend URL              | Auth Required | Role Required |
|--------------------------|-------------|--------------------------|--------------|---------------|
| Login                    | POST        | /api/auth/login          | No           | None          |
| Register                 | POST        | /api/auth/register       | No           | None          |
| Get user profile         | GET         | /api/users/profile       | Yes          | Any           |
| Get all users            | GET         | /api/users               | Yes          | Admin         |
| Get all products         | GET         | /api/products            | No           | None          |
| Get single product       | GET         | /api/products/:id        | No           | None          |
| Create product           | POST        | /api/products            | Yes          | Seller/Admin  |
| Update product           | PUT         | /api/products/:id        | Yes          | Seller/Admin  |
| Delete product           | DELETE      | /api/products/:id        | Yes          | Seller/Admin  |
| Get cart                 | GET         | /api/cart                | Yes          | Customer      |
| Add to cart              | POST        | /api/cart/items          | Yes          | Customer      |
| Update cart item         | PUT         | /api/cart/items/:id      | Yes          | Customer      |
| Remove cart item         | DELETE      | /api/cart/items/:id      | Yes          | Customer      |
| Get orders               | GET         | /api/orders/my-orders    | Yes          | Any           |
| Place order              | POST        | /api/orders              | Yes          | Customer      |
| Get addresses            | GET         | /api/addresses           | Yes          | Any           |
| Create address           | POST        | /api/addresses           | Yes          | Any           |
| Get categories           | GET         | /api/categories          | No           | None          |
| Create category          | POST        | /api/categories          | Yes          | Admin         |

---

## 25. Common Patterns Used Throughout

### 'use client' Directive
Every page file starts with `'use client'`. In Next.js, components are server components by default (rendered on the server). Adding `'use client'` makes them client components (rendered in the browser). This is required whenever you use React hooks (`useState`, `useEffect`, `useContext`), browser APIs (`localStorage`), or event handlers (`onClick`).

### Loading Skeletons
While data is being fetched, most pages show "skeleton" placeholders: gray boxes with the `animate-pulse` class that gently pulse. This tells the user that content is loading and gives a preview of the page layout. The pattern is:
```jsx
if (loading) {
  return (
    <div className="animate-pulse">
      <div className="h-5 bg-[#1A1A1A] rounded w-3/4 mb-3" />
      <div className="h-4 bg-[#1A1A1A] rounded w-1/3" />
    </div>
  );
}
```

### Auth Guards
Pages that require login (Cart, Orders, Profile, etc.) check authentication in a `useEffect`:
```jsx
useEffect(() => {
  if (!loading && !user) {
    router.push('/auth/login');
  }
}, [user, loading]);
```
The `loading` check is important: it prevents redirecting the user before the saved token has been checked (which happens asynchronously on page load).

### Error Handling Pattern
Most pages follow this pattern for error states:
```jsx
if (error) {
  return (
    <div className="text-center">
      <p className="text-red-400">{error}</p>
      <button onClick={retry}>Try Again</button>
    </div>
  );
}
```

### Controlled Form Inputs
All form inputs in the project are "controlled components." This means:
- The input's `value` is always tied to a state variable.
- The `onChange` handler updates the state on every keystroke.
- React re-renders the input with the new value.

This gives you full control over the input value, allows validation, and makes it easy to submit the form data.

### Conditional Rendering
JSX uses JavaScript expressions for conditional rendering:
- `{condition && <Component />}`: Renders the component only if the condition is true.
- `{condition ? <A /> : <B />}`: Renders A if true, B if false.

### Responsive Design with Tailwind
Tailwind uses responsive prefixes:
- No prefix: All screen sizes (mobile-first).
- `sm:`: 640px and up.
- `md:`: 768px and up.
- `lg:`: 1024px and up.

Example: `className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"` means 1 column on mobile, 2 on tablet, 3 on desktop.

---

## Summary

The MARS frontend is a Next.js application structured around the App Router. Each page is a folder inside `app/` with a `page.js` file. The `AuthContext` manages global login state, `api.js` handles all communication with the Express backend, and `Navbar.js` provides consistent navigation across all pages. Data is fetched from the backend using Axios, displayed using React state, and styled using Tailwind CSS utility classes. The application supports three user roles (Customer, Seller, Admin), each with different permissions and UI elements.
