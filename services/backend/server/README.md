BG Services Portal API (FastAPI + Postgres)

Quick start
1) Create a virtualenv (Windows):
   python -m venv venv
   venv\Scripts\activate

2) Install dependencies:
   pip install -r server/requirements.txt

3) Create a Postgres database and user (example):
   createdb bgsale_portal
   # Or via GUI like pgAdmin. Ensure the URL below matches your setup.

4) Set environment variables (create .env at project root or server/.env):
   JWT_SECRET=change-this-secret
   JWT_ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=15
   REFRESH_TOKEN_EXPIRE_DAYS=7
   DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/bgsale_portal
   CORS_ORIGINS=http://localhost:5173

5) Run the API (choose one method):

   Method 1 - Using PowerShell script (recommended):
   .\server\start.ps1

   Method 2 - Using Batch script:
   server\start.bat

   Method 3 - Manual activation:
   .\venv\Scripts\Activate.ps1  (PowerShell)
   # or
   venv\Scripts\activate.bat     (Command Prompt)
   cd server
   python -m uvicorn main:app --reload

6) Seed demo users (Admin, HR, Employee):
   curl -X POST http://localhost:8000/dev/seed

7) Test login (form-encoded):
   curl -X POST -d "username=admin@bg.com&password=admin123" http://localhost:8000/auth/login

API routes

Authentication:
- POST /auth/register -> Create user (name, email, password, role)
- POST /auth/login -> OAuth2PasswordRequestForm (username, password)
- POST /auth/refresh -> Reads refresh_token httpOnly cookie, returns new access token
- POST /auth/logout -> Clears cookie
- GET /me -> Get current user (Authorization: Bearer <access>)
- GET /dashboard -> Example role-aware payload

Employee Management (Admin/HR):
- POST /api/employees -> Create employee (Admin/HR only)
- GET /api/employees -> List all employees (with filters: department, status)
- GET /api/employees/{id} -> Get specific employee
- PUT /api/employees/{id} -> Update employee (Admin/HR only)
- DELETE /api/employees/{id} -> Delete employee (Admin only)

Inventory Management (Admin):
- POST /api/inventory -> Create inventory item (Admin only)
- GET /api/inventory -> List all items (with filters: category, status)
- GET /api/inventory/{id} -> Get specific item
- GET /api/inventory/sku/{sku} -> Get item by SKU
- PUT /api/inventory/{id} -> Update inventory item (Admin only)
- DELETE /api/inventory/{id} -> Delete inventory item (Admin only)
- PATCH /api/inventory/{id}/adjust -> Adjust quantity (Admin only)

Development:
- POST /dev/seed -> Development utility to create default users

Database migrations
- Alembic is now configured under `server/alembic`.
- Run migrations from the backend folder:
  - `cd services/backend/server`
  - `alembic upgrade head`
- Create a new migration:
  - `alembic revision -m "describe_change"`
- Auto-generate from model metadata when appropriate:
  - `alembic revision --autogenerate -m "describe_change"`
- For production-style environments, set `AUTO_CREATE_TABLES=false` and rely on Alembic migrations instead of runtime table creation.

Notes
- Refresh token is set on the /auth/* cookie path, httpOnly; set secure=True in production.
- Access token is a JWT sent via Authorization header; keep TTL short (default 15 minutes).
- DB is SQLAlchemy sync engine with Alembic-based schema migrations.
