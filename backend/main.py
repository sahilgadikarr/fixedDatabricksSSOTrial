from __future__ import annotations

from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

ROOT_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIST = ROOT_DIR / "frontend" / "dist"
ASSETS_DIR = FRONTEND_DIST / "assets"

app = FastAPI(
    title="Databricks SSO Learning App",
    description=(
        "A small React + FastAPI app that demonstrates how a Databricks App "
        "can read the signed-in user's forwarded identity headers."
    ),
    version="1.0.0",
)


@app.get("/api/health", tags=["Health"])
async def health() -> dict[str, str]:
    """Simple deployment health endpoint; it does not authenticate a user."""
    return {"status": "ok", "service": "databricks-sso-learning-app"}


@app.get("/api/me", tags=["Authentication"])
async def get_current_user(request: Request) -> dict[str, Any]:
    """Return identity headers forwarded by the Databricks Apps gateway.

    Important: this endpoint is safe to use this way only when the app is
    accessed through the Databricks Apps gateway and arbitrary direct access
    to this backend is not exposed. Do not treat caller-supplied forwarded
    headers as trustworthy on a separately exposed backend.
    """
    user_id = request.headers.get("x-forwarded-user")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=(
                "Databricks user identity was not found. Open this endpoint "
                "through the deployed Databricks App. Locally, forwarded "
                "identity headers are not automatically provided."
            ),
        )

    # These are identity claims supplied by the Databricks Apps gateway / IdP.
    # They are not a Databricks API access token.
    return {
        "authenticated": True,
        "user_id": user_id,
        "email": request.headers.get("x-forwarded-email"),
        "username": request.headers.get("x-forwarded-preferred-username"),
        "identity_source": "Databricks Apps forwarded identity headers",
    }


# Serve the Vite build from the same origin as FastAPI. This keeps the starter
# simple: one Databricks App, one external URL, and no browser CORS setup.
if ASSETS_DIR.is_dir():
    app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")


@app.get("/{frontend_path:path}", include_in_schema=False)
async def serve_frontend(frontend_path: str) -> FileResponse:
    """Serve the React single-page application for non-API routes."""
    if frontend_path == "api" or frontend_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="API route not found")

    index_file = FRONTEND_DIST / "index.html"
    if not index_file.is_file():
        raise HTTPException(
            status_code=503,
            detail=(
                "Frontend build not found. Run `npm install` and `npm run build` "
                "before starting FastAPI."
            ),
        )

    # Serve index.html for / and client-side SPA routes. Static assets are
    # served separately from /assets by the mount above.
    return FileResponse(index_file)
