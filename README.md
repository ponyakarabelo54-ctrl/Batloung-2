# Batloung Farm Distribution Management System

A web-based system for **Batloung Farm**, a fruit distribution business in Maseru, Lesotho. The company buys fruit (apples, bananas, oranges, mangoes, grapes) from suppliers in South African provinces and sells it in **small, medium and large boxes** to street vendors and small retailers. The system replaces notebooks and spreadsheets and solves these problems:

| Problem | How the system solves it |
|---|---|
| Hard to track stock | `stock` table keeps a separate balance for every fruit **and** packaging size |
| Errors in totals | Purchase and sale totals are calculated automatically by the backend |
| Vendors who owe money | Payment status (PAID / PARTIALLY_PAID / UNPAID) and outstanding balances per vendor |
| Inconsistent supplier records | Validated supplier records, unique phone numbers, protected deletion |
| No sales reports | Reports page (top fruits, revenue by date range, top vendor, stock, balances) |
| Stock movement | Purchases add stock, sales remove it, all inside database transactions |

---

## 1. Technologies used

- **Frontend:** React 18, Vite, React Router, HTML, CSS, JavaScript
- **Backend:** Node.js, Express.js, mysql2 (connection pool), dotenv, cors
- **Database:** MySQL 8.0 (database name `batloung_farm_db`)

## 2. Folder structure

```
Batloung-Farm-System/
├── backend/
│   ├── config/         db.js (connection pool + transaction helper), constants.js
│   ├── controllers/    request handling, validation, business rules
│   ├── models/         all SQL queries (one file per table / topic)
│   ├── routes/         URL -> controller mapping
│   ├── middleware/     errorHandler, requestLogger, validateId
│   ├── utils/          validators, money maths, sales calculations, AppError
│   ├── scripts/        apiSmokeTest.js (automatic API test)
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/ Layout (sidebar), Modal, Toasts, tables helpers ...
│   │   ├── pages/      Dashboard, Suppliers, Fruits, Vendors, Purchases, Sales, Stock, Reports
│   │   ├── services/   api.js (every call to the backend)
│   │   ├── hooks/ utils/ assets/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   ├── index.html
│   └── package.json
├── database/
│   ├── batloung_farm.sql        <- schema + sample data (import this)
│   ├── reports.sql              <- the 4 required reporting queries (+2 extra)
│   └── transaction_demo.sql     <- BEGIN / COMMIT / ROLLBACK demonstration
├── .gitignore
└── README.md
```

## 3. Requirements (install once)

- **Node.js 18 or newer** (LTS) - https://nodejs.org  (check with `node -v`)
- **MySQL Server 8.0** and **MySQL Workbench**
- **Visual Studio Code**

## 4. Import the database into MySQL Workbench

1. Open **MySQL Workbench** and connect to your local server (usually `Local instance MySQL80`).
2. Choose **File -> Open SQL Script...** and select `database/batloung_farm.sql`.
3. Click the **lightning bolt** (Execute) button.
4. Refresh the *Schemas* panel (left). You should see `batloung_farm_db` with **8 tables**: `suppliers, fruits, vendors, purchases, purchase_details, sales, sales_details, stock`.
5. Check the data: `SELECT * FROM batloung_farm_db.stock;` returns 15 rows (5 fruits x 3 sizes).

*Alternative:* **Server -> Data Import -> Import from Self-Contained File** -> choose the file -> **Start Import**.

> The script drops and recreates the tables, so running it again **resets the sample data**.

## 5. Configure the `.env` file (backend)

Open a terminal in the project folder (in VS Code: **Terminal -> New Terminal**), then (Windows Command Prompt):

```bat
cd backend
copy .env.example .env
```

(PowerShell also understands `copy`.) Open `backend\.env` and type **your MySQL root password** after `DB_PASSWORD=`:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=batloung_farm_db
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
```

`.env` is in `.gitignore`, so your password is never uploaded to GitHub.

## 6. Install dependencies (Windows)

```bat
cd backend
npm install

cd ..\frontend
npm install
```

## 7. Start the backend

```bat
cd backend
npm start
```

You should see:

```
Batloung Farm API running on http://localhost:5000
MySQL connected: batloung_farm_db
```

(`npm run dev` restarts automatically when you edit files.) If MySQL is off or the password is wrong the server **does not crash** - it prints a clear message and answers `503` until the database is available.

**Common errors**
- `ER_ACCESS_DENIED_ERROR` -> wrong `DB_PASSWORD` in `.env`.
- `ER_BAD_DB_ERROR` -> you have not imported `batloung_farm.sql` yet.
- `ECONNREFUSED` -> MySQL service is not running (Windows: *Services -> MySQL80 -> Start*).
- `EADDRINUSE` -> port 5000 is busy; change `PORT` in `.env` and `VITE_API_URL` in the frontend.

## 8. Start the frontend

Open a **second** terminal:

```bat
cd frontend
npm run dev
```

## 9. Open the website

Go to **http://localhost:5173** in your browser. Use the sidebar to open Dashboard, Suppliers, Fruits, Vendors, Purchases, Sales, Stock and Reports.

If you changed the backend port, copy `frontend\.env.example` to `frontend\.env` and set `VITE_API_URL=http://localhost:<port>/api`.

## 10. Deploy on Railway

The app uses three Railway services: **MySQL**, **Backend API**, and **Frontend**. The backend reads Railway's `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, and `MYSQLDATABASE` variables. The frontend is built with `VITE_API_URL` and served from `dist`.

### Prepare and migrate your database

1. Publish the project to a private or public GitHub repository. Do not commit either `.env` file; they contain local configuration and are ignored by Git.
2. In Railway, create a project and add a **MySQL** service with **+ New -> Database -> MySQL**.
3. If your eight tables and data are currently only in local Workbench, export them first using **Server -> Data Export**, selecting all eight tables and **Dump Structure and Data**. Back up the export before proceeding.
4. To import from Workbench, temporarily enable **TCP Proxy / Public Networking** on the Railway MySQL service. Use its public host, port, username, and password in a new Workbench connection, select the Railway database, and import the saved export. Public access exposes a database endpoint and may incur network egress charges, so disable it after importing; the application connects over Railway's private network.

Do **not** run `database/batloung_farm.sql` against a database that already contains data: that script drops and recreates the tables. Use an export of your existing schema/data for migration.

### Deploy the backend

1. Add a service from the GitHub repository and set its **Root Directory** to `/backend`. Use `npm start` as the start command.
2. In the backend service's **Variables**, add references to the MySQL service's variables. Use Railway's reference picker (or replace `MySQL` with the exact database service name):

   ```text
   MYSQLHOST=${{MySQL.MYSQLHOST}}
   MYSQLPORT=${{MySQL.MYSQLPORT}}
   MYSQLUSER=${{MySQL.MYSQLUSER}}
   MYSQLPASSWORD=${{MySQL.MYSQLPASSWORD}}
   MYSQLDATABASE=${{MySQL.MYSQLDATABASE}}
   ```

3. Generate a public domain for the backend in **Settings -> Networking**. Set the backend health check path to `/api/health`.

### Deploy the frontend

1. Add a second service from the same GitHub repository and set its **Root Directory** to `/frontend`. Use `npm run build` as the build command and `npm start` as the start command.
2. Generate a public domain for the frontend.
3. In the frontend service's **Variables**, set `VITE_API_URL` to `https://<backend-public-domain>/api`.
4. In the backend service's **Variables**, set `CLIENT_ORIGIN` to `https://<frontend-public-domain>`. Redeploy both services after changing variables so the frontend is rebuilt with the API URL.
5. Open the frontend public domain. Check `https://<backend-public-domain>/api/health`; it should report that the API and database are running.

Keep Railway credentials in Railway's **Variables**; never put them in frontend code or commit them. Railway uses the `PORT` it provides, so don't hard-code a production port.

## 11. Test the API

### Automatic test (easiest)
With the backend running, in another terminal:

```bat
cd backend
npm run test:api
```

It runs ~40 checks (validation, status codes, totals, stock changes, **rollback of a failed multi-item sale**, payments, reports). Re-import the SQL afterwards to reset the data.

### Manually
Use **Thunder Client** (VS Code extension), **Postman**, or the browser for GET requests. Base URL: `http://localhost:5000/api`

| Area | Method & URL | Notes |
|---|---|---|
| Health | `GET /health` | API + database status |
| Suppliers | `GET /suppliers`, `GET /suppliers/:id` | `?search=` optional |
| | `POST /suppliers` | `business_name, contact_person, phone, province, address` |
| | `PUT /suppliers/:id`, `DELETE /suppliers/:id` | delete blocked (409) if supplier has purchases |
| Fruits | `GET /fruits`, `GET /fruits/:id` | |
| | `POST /fruits` | `fruit_name, description, status` - also creates 3 stock rows |
| | `PUT /fruits/:id`, `PATCH /fruits/:id/status` | status `AVAILABLE` / `UNAVAILABLE` |
| Vendors | `GET /vendors` , `GET /vendors?search=Mamello` | search by name **or** phone; includes `outstanding_balance` |
| | `POST /vendors`, `PUT /vendors/:id` | `vendor_name, phone_number, location, registration_date?` |
| Purchases | `GET /purchases`, `GET /purchases/:id` | |
| | `POST /purchases` | see example below |
| Sales | `GET /sales`, `GET /sales/:id`, `GET /sales/prices` | |
| | `POST /sales` | see example below |
| | `POST /sales/:id/payments` | `{ "amount": 200 }` - vendor pays later |
| Stock | `GET /stock` | filters `?fruit_id=1&packaging_size=LARGE` |
| | `GET /stock/fruit/:id`, `GET /stock/low?threshold=20` | |
| Reports | `GET /reports/top-fruits` | top 5 most sold fruits |
| | `GET /reports/revenue?from=2026-09-01&to=2026-10-31` | revenue in a date range |
| | `GET /reports/top-vendor` | vendor with most boxes bought |
| | `GET /reports/stock` | stock by fruit and size |
| | `GET /reports/outstanding-balances` | amounts owed per vendor |
| | `GET /reports/dashboard` | numbers for the dashboard |

**Record a purchase** - `POST /api/purchases`
```json
{
  "supplier_id": 1,
  "items": [
    { "fruit_id": 1, "packaging_size": "LARGE",  "quantity": 20, "unit_cost": 155 },
    { "fruit_id": 2, "packaging_size": "SMALL",  "quantity": 50, "unit_cost": 70 }
  ]
}
```
-> `201 Created`, total = 20x155 + 50x70 = 6600 (calculated automatically), stock increases.

**Record a sale** - `POST /api/sales`
```json
{
  "vendor_id": 1,
  "payment_method": "CREDIT",
  "amount_paid": 500,
  "items": [
    { "fruit_id": 1, "packaging_size": "MEDIUM", "quantity": 5 },
    { "fruit_id": 3, "packaging_size": "LARGE",  "quantity": 4, "unit_price": 230 }
  ]
}
```
- `unit_price` is optional: default prices per box are **SMALL M120, MEDIUM M170, LARGE M220** (each size has a different price; change them in `backend/config/constants.js`).
- `amount_paid` is optional: CASH / MOBILE_MONEY default to the full total, CREDIT defaults to 0. The status becomes `PAID`, `PARTIALLY_PAID` or `UNPAID` automatically.

**Insufficient stock demonstration** - ask for more than is available (Apples LARGE has 10 boxes in the sample data):
```json
{ "vendor_id": 1, "payment_method": "CASH",
  "items": [ { "fruit_id": 2, "packaging_size": "SMALL", "quantity": 5 },
             { "fruit_id": 1, "packaging_size": "LARGE", "quantity": 15 } ] }
```
-> `400 Bad Request` "Insufficient stock...". The **whole sale is rolled back**: the 5 banana boxes are *not* removed and no sale row is saved. The same scenario is shown in plain SQL in `database/transaction_demo.sql`.

### HTTP status codes used
`200` OK - `201` Created - `400` invalid input / insufficient stock - `404` not found - `409` conflict (duplicate phone, supplier in use) - `503` database unavailable - `500` unexpected error.

---

## How the main rules are implemented

- **Stock per packaging size:** `stock` has `UNIQUE (fruit_id, packaging_size)` and `CHECK (available_quantity >= 0)`.
- **No negative stock:** the sale code locks the stock rows (`SELECT ... FOR UPDATE`), checks every item, and the update only runs when `available_quantity >= requested`; the CHECK constraint is a second safety net.
- **Transactions:** `backend/config/db.js` -> `withTransaction()` runs `BEGIN`, then `COMMIT`, or `ROLLBACK` when any error is thrown. Used for purchases, sales, payments and creating a fruit.
- **Totals:** `backend/utils/salesCalculations.js` -> `calculateSaleTotal()` (money is handled in cents to avoid rounding errors).
- **Reports:** SQL in `backend/models/reportModel.js` (same queries as `database/reports.sql`).

## Assignment submission checklist
The take-home test also asks for a **live link, a GitHub repository link and a demo video**:
1. Push this folder to GitHub (`.env` is ignored automatically).
2. Record a short video: import SQL -> start both servers -> add supplier/vendor -> record a purchase -> record a sale -> show the rejected sale -> show Reports.
3. For a live link you need hosting for the React app, the Node API **and** a MySQL database (for example Railway or Render + a hosted MySQL). Set the same environment variables there and set `VITE_API_URL` to your hosted API address.

## Ideas for continuing development
Admin login (JWT), editable selling prices per fruit, printing invoices, stock adjustments for damaged fruit, pagination, and charts.
#   B a t l o u n g  
 #   B a t l o u n g - 2  
 