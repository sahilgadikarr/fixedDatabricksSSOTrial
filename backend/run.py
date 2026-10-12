
import os
import sys
from pathlib import Path

# Add the repository root to Python's module search path.
PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

import uvicorn

if __name__ == "__main__":
    port = int(os.environ.get("DATABRICKS_APP_PORT", "8000"))

    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=port,
    )
