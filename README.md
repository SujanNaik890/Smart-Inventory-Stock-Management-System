# StockSmart AI — Smart Inventory & Stock Management System

A professional, modern, responsive full-stack inventory management web application crafted for small businesses, university laboratories, warehouses, and campus equipment centers.

Built using **React (Vite)**, **Node.js (Express)**, and a **relational database engine** with strict transaction isolation, atomic quantity balancing, and an intelligent **AI Inventory Assistant** capable of real-time catalog analysis and multi-format report exports (PDF, DOC/Word, TXT, CSV).

---

## 📸 Visual Design & Theme

StockSmart AI faithfully reproduces the dashboard layout, color system, and UI components from the reference dashboard:

- **Primary Blue:** `#405BFF`
- **Secondary Purple:** `#8267F5`
- **Main Background:** `#F6F8FF`
- **Card Background:** `#FFFFFF` with soft shadows (`box-shadow: 0 4px 20px rgba(64, 91, 255, 0.05)`)
- **Primary Text:** `#101A46` | **Secondary Text:** `#727D9E`
- **Status Accents:** `#16B979` (Green / Stock In), `#FF9B38` (Warning / Low Stock), `#FF525C` (Red / Out of Stock)
- **Persistent Left Sidebar:** 3D isometric cube logo, active gradient pill navigation, and bottom "Need Help?" AI Assistant card with 3D robot illustration.
- **Top Navigation Bar:** Global search input, live notification bell with badge indicator, admin avatar, name ("Aarav Sharma"), role ("Admin"), and dropdown menu.

---

## 🚀 Key Features

### 1. Admin Authentication & Protection
- JWT authentication with secure HTTP Authorization headers (`Bearer <token>`).
- Bcrypt password hashing (never plaintext).
- Protected API routes and protected React Router DOM routes.
- Pre-seeded admin account with one-click demo login helper.

### 2. Live Dashboard
- **4 Metric KPI Cards:** Total Products (48+), Total Stock Units (1,280+), Low Stock Items, Out of Stock Items.
- **Stock Overview Chart:** Smooth spline curves displaying monthly Stock In, Stock Out, and Current Stock trends across Last 7 Days, Last 30 Days, or Last 6 Months.
- **Category Distribution Chart:** Donut chart with centered product count and categorical percentage allocation.
- **Recent Stock Transactions:** Table displaying recent movements with product thumbnails, `IN`/`OUT` badges, signed quantities, timestamps, and status pills.
- **Low Stock Alerts Widget:** Real-time alert cards highlighting items below minimum threshold with quick replenishment links.
- **AI Banner Card:** Gradient card with custom 3D robot character and direct link to the AI Assistant.

### 3. Products Management (Full CRUD)
- Create, view details, update pricing and thresholds, and archive products.
- Unique SKU validation on frontend and backend.
- Filter by category, filter by stock status (`in_stock`, `low_stock`, `out_of_stock`), sort by column, search by name or SKU.
- **Audit Preservation:** Deleting products with historical transactions automatically uses safe archival (`is_archived = 1`) to preserve inventory ledger integrity.
- One-click **Export to CSV**.

### 4. Stock In & Stock Out Operations
- **Stock In (Intake):** Atomic transaction increasing product quantity, logging previous and new balance, supplier info, and invoice reference. Formula: `newQuantity = currentQuantity + purchasedQuantity`.
- **Stock Out (Issue):** Atomic transaction decreasing product quantity. Strict negative inventory prevention (rejects attempts to issue more than available stock). Formula: `newQuantity = currentQuantity - issuedQuantity`.
- **Audit Transaction Ledger:** Filterable by movement type (`IN` / `OUT`), keyword, product, and date range.

### 5. Suppliers Management
- Complete supplier directory with contact person, email, phone, and address.
- Shows real-time count of linked catalog products.
- Safety checks preventing deletion of suppliers with historical transactions.

### 6. Categories Management
- Category classification with custom colors, descriptions, and product counts.
- Rejection of deletions when active products are assigned.

### 7. Inventory Analytics & Reports
- **5 Comprehensive Sections:**
  1. *Inventory Summary:* Asset valuation, SKU count, average unit price.
  2. *Low-Stock Schedule:* Suggested replenishment quantities (`(min_stock * 2) - current_qty`).
  3. *Stock Movement:* Total IN vs OUT units and net volume velocity.
  4. *Category Valuation:* Portfolio capital share and breakdown.
  5. *Transaction Ledger:* Filterable historical audit records.
- Export to CSV and clean Print styling.

### 8. AI Inventory Assistant & Multi-Format Report Generator
- **Live Inventory Context:** Chatbot has real-time access to the database (knows all products, exact counts, prices, and low-stock alerts).
- **Multi-Format Document Export:**
  - 📄 **Download PDF (.pdf):** Professional executive summary with tables and key statistics generated via `jspdf`.
  - 📝 **Download Word (.doc):** Styled HTML-formatted Word document.
  - 📃 **Download Text (.txt):** Clean, monospace plain text audit summary.
- **Restock Priority Engine:** Automatically classifies depleted products as *Critical*, *High*, or *Medium* priority with estimated restocking capital.

### 9. Settings
- Organization and laboratory naming.
- Default low-stock threshold preferences.
- Admin profile customization (name, avatar URL, password change).
- Strictly light theme compliant.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, React Router DOM v7, Lucide React, Recharts, Axios, jsPDF |
| **Backend** | Node.js (v24), Express.js, JSON Web Tokens (JWT), bcryptjs, Morgan |
| **Database** | Relational SQL schema (`database/schema.sql`, `stocksmart.db`) with foreign keys, constraints, and ACID transactions |
| **Styling** | Custom SaaS CSS design system matching reference image specifications |

---

## 📂 Project Structure

```
├── client/
│   ├── src/
│   │   ├── components/       # CubeLogo, Sidebar, TopNavbar, StatCard, Charts, Modal, etc.
│   │   ├── context/          # AuthContext (JWT session management)
│   │   ├── layouts/          # DashboardLayout (Sidebar + Navbar + Footer)
│   │   ├── pages/            # 8 core pages (Dashboard, Products, Stock, Reports, AI, etc.)
│   │   ├── services/         # Axios API service client
│   │   ├── App.jsx           # React Router DOM routes
│   │   ├── index.css         # Global SaaS design system
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── src/
│   │   ├── config/           # db.js (Node SQLite adapter), seedRunner.js
│   │   ├── controllers/      # auth, product, stock, dashboard, report, ai, setting
│   │   ├── middleware/       # auth.js (JWT verify), errorHandler.js
│   │   ├── routes/           # REST endpoints
│   │   ├── testE2E.js        # Automated acceptance test suite
│   │   ├── app.js            # Express app configuration
│   │   └── server.js         # Entrypoint & DB seed check
│   ├── package.json
│   └── .env
│
├── database/
│   ├── schema.sql            # Relational DDL (admins, categories, suppliers, products, stock_transactions, settings)
│   ├── seed.sql              # SQL seed script
│   └── stocksmart.db         # Live SQLite ACID relational database
│
├── .gitignore
├── .env.example
├── package.json
└── README.md
```

---

## ⚡ Quick Start Instructions

### Prerequisites
- Node.js (v18+ or v24+)
- npm (v9+)

### 1. Clone & Setup
The project is organized in the workspace:
```bash
# Server directory setup
cd server
npm install

# Client directory setup
cd ../client
npm install
```

### 2. Configure Environment Variables
In `server/.env`:
```ini
PORT=5000
JWT_SECRET=stocksmart_production_secure_jwt_token_key_2026
GEMINI_API_KEY=   # (Optional) Provide Gemini API key to enable generative enhancement
NODE_ENV=development
```

### 3. Seed Database
The database seeds automatically upon server boot. You can also re-seed explicitly:
```bash
cd server
node src/config/seedRunner.js
```

### 4. Start the Application

**Start the Backend Server (Port 5000):**
```bash
cd server
node src/server.js
```

**Start the React Vite Frontend (Port 3000):**
```bash
cd client
node ./node_modules/vite/bin/vite.js --port 3000 --host
```

Access the application in your browser at:
👉 **`http://localhost:3000`**

---

## 🔑 Default Credentials

| Field | Value |
|---|---|
| **Email** | `admin@stocksmart.ai` |
| **Password** | `admin123` |
| **Role** | Administrator |

*(A convenient "Fill Demo Admin Credentials" button is also provided on the login page).*

---

## 🧪 Automated Acceptance Testing

Run the automated test suite verifying all 8 specifications (Authentication, Product CRUD, Stock In, Stock Out, Negative Stock Prevention, Low Stock Alerts, Reports, and AI Assistant):

```bash
cd server
node src/testE2E.js
```

---

## 📋 API Endpoint Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/login` | Admin login & JWT token generation | No |
| `GET` | `/api/auth/me` | Fetch current admin profile | Yes |
| `GET` | `/api/dashboard/stats` | Dashboard 4 summary cards & trends | Yes |
| `GET` | `/api/dashboard/stock-overview` | Stock overview area chart data | Yes |
| `GET` | `/api/dashboard/category-distribution`| Category donut chart & metrics | Yes |
| `GET` | `/api/dashboard/recent-transactions` | Last 5 movements for dashboard | Yes |
| `GET` | `/api/dashboard/low-stock` | Top low-stock alerts for widget | Yes |
| `GET` | `/api/products` | Paginated products with filters & search | Yes |
| `POST` | `/api/products` | Create new product with unique SKU | Yes |
| `PUT` | `/api/products/:id` | Update product details & thresholds | Yes |
| `DELETE`| `/api/products/:id` | Safe delete or archive product | Yes |
| `POST` | `/api/stock/in` | Record purchase & increase stock | Yes |
| `POST` | `/api/stock/out` | Record issue & validate availability | Yes |
| `GET` | `/api/stock/transactions` | Query audit transaction ledger | Yes |
| `GET` | `/api/suppliers` | List vendors with linked product count| Yes |
| `GET` | `/api/categories` | List categories with item distribution| Yes |
| `GET` | `/api/reports/inventory` | Summary asset valuation report | Yes |
| `GET` | `/api/reports/low-stock` | Replenishment recommendation report | Yes |
| `GET` | `/api/reports/stock-movement` | Net movement and volume trends | Yes |
| `POST` | `/api/ai/chat` | AI query assistant (knows live DB) | Yes |
| `GET` | `/api/ai/recommendations` | AI restocking prioritization matrix | Yes |
| `GET` | `/api/ai/report-data` | Multi-format executive audit report | Yes |
| `PUT` | `/api/settings` | Update preferences and admin password | Yes |

---

## 🔒 Data Integrity & Safety Standards

- **Atomic Transactions:** Every Stock In and Stock Out is wrapped in a transactional block. Products and transactions update atomically.
- **Zero Negative Stock Policy:** Requests attempting to issue more stock than currently on hand are rejected with an explicit HTTP 400 error.
- **Audit Preservation:** Removing a product with transaction history sets `is_archived = 1` rather than destroying relational audit links.
- **Password Protection:** Passwords are never returned by API endpoints and are securely hashed with 10 salt rounds.
