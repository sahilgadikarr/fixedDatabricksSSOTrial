# Databricks SSO Learning App

A small full-stack starter to learn the difference between **Databricks-managed app-entry authentication** and **application code that reads the signed-in identity**.

## What is included

- React + Vite frontend with a simple SSO learning dashboard.
- FastAPI backend serving the frontend build on the same origin.
- `GET /api/health` — health check.
- `GET /api/me` — reads `X-Forwarded-User`, `X-Forwarded-Email`, and `X-Forwarded-Preferred-Username` when present.
- `app.yaml` — Databricks Apps runtime command that starts the backend using `backend/run.py` and the assigned `DATABRICKS_APP_PORT`.
- Root `package.json` — so Databricks builds the Vite frontend during deployment.

## What this project does not do

It does **not** implement a custom “Sign in with Databricks” button, OAuth authorization URL, redirect callback, client secret, or token exchange. For a Databricks-hosted app, Databricks manages the app-entry authentication and permission boundary. Your code reads identity headers after a request reaches the app.

This demo does **not** make the Databricks App anonymous/public. Users still need to be authenticated and have permission to use the Databricks App. A separate application login for external users would require a different identity and hosting/access design.

## Run locally on Windows / macOS / Linux

Requirements: Node.js 22+ (Databricks Apps currently documents Node 22.16) and Python 3.11+.

### 1. Install dependencies and build React

From the repository root:

```bash
npm install
npm run build
```

### 2. Install Python dependencies

Windows PowerShell:

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

macOS / Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Start FastAPI

```bash
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

Open http://127.0.0.1:8000. The frontend should load. Locally, `/api/me` will normally show “Identity not available” because Databricks does not inject its forwarded user headers into your local server. This is expected.

If you want to test the response shape locally, you can send a mock header **only to your local development server**:

```bash
curl -H "X-Forwarded-User: local-demo-user" \
     -H "X-Forwarded-Email: demo@example.com" \
     -H "X-Forwarded-Preferred-Username: local-demo" \
     http://127.0.0.1:8000/api/me
```

Never use caller-controlled identity headers as authentication on a public/directly exposed backend. In the Databricks deployment, rely on the trusted Databricks Apps gateway and the app's permission configuration.

## Push this project to GitHub

1. Create a new GitHub repository (for example, `databricks-sso-learning-app`).
2. From this folder, initialize and push the project:

```bash
git init
git add .
git commit -m "Add Databricks SSO learning app"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/databricks-sso-learning-app.git
git push -u origin main
```

Replace the remote URL with your own repository URL. Do not commit credentials or `.env` files.

## Deploy through Databricks Apps

1. In your Databricks workspace, open **Databricks Apps** and choose **Create app** → **Create a custom app**.
2. In **Configure Git**, select GitHub and provide your repository URL and branch (`main`). For a private repository, configure Git credentials for the app's service principal as required by your workspace.
3. Create the app, then open its overview page and choose **Deploy** → **From Git**. Choose `main` as the Git reference and keep the source-code path at the repository root.
4. Wait for deployment to finish, then open the app URL.
5. Configure the app's **CAN USE** permissions for the workspace users/groups who should open it. Users must also be able to authenticate through your workspace's configured identity provider.
6. Open the app URL in a private browser window. If the browser doesn't already have a valid session, observe the Databricks sign-in flow. After access is granted, the React page should call `/api/me` and show whichever forwarded identity headers are available.
7. If the app does not start, review the deployment and runtime logs. Confirm that `app.yaml`, root `package.json`, and `requirements.txt` are included in the repository root.

Official deployment docs: https://docs.databricks.com/aws/en/dev-tools/databricks-apps/deploy

Official forwarded-header docs: https://docs.databricks.com/aws/en/dev-tools/databricks-apps/http-headers

## How the code works

- During deployment, Databricks sees the root `package.json`, installs Node dependencies and runs `npm run build`.
- Vite writes the static React app into `frontend/dist/`.
- At runtime, `app.yaml` runs `backend/run.py`; that script reads `DATABRICKS_APP_PORT` from the environment and starts Uvicorn on that port.
- FastAPI serves the static React build and handles `/api/*` on the same origin.
- `GET /api/me` reads identity values from request headers. These headers are only expected when requests go through the Databricks Apps runtime/gateway.

## Next steps after the demo

1. Map the forwarded identity to a user record in your application database.
2. Implement role/ownership-based authorization for protected business operations.
3. If you later need to call Databricks APIs on behalf of the user, study user authorization and access tokens separately. These are distinct from reading user identity headers.
