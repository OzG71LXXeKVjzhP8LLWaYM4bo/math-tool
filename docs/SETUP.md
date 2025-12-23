# Setup Guide

This guide walks you through setting up the IB Quiz App for development.

## Prerequisites

### Required Software

| Software | Version | Installation |
|----------|---------|--------------|
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| Rust | 1.75+ | [rustup.rs](https://rustup.rs) |
| Python | 3.11+ | [python.org](https://python.org) |
| UV | Latest | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |

### External Services

1. **Neon PostgreSQL** - [neon.tech](https://neon.tech) (free tier available)
2. **Google Gemini API** - [aistudio.google.com](https://aistudio.google.com)

---

## Step 1: Clone the Repository

```bash
git clone <repository-url>
cd math-tool
```

---

## Step 2: Set Up Neon Database

1. Create an account at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string (looks like `postgres://user:pass@ep-xxx.neon.tech/dbname?sslmode=require`)
4. Save this for the backend `.env` file

---

## Step 3: Get Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com)
2. Click "Get API Key"
3. Create a new API key
4. Save this for the backend `.env` file

---

## Step 4: Python Microservice Setup

```bash
cd python-service

# Install dependencies with UV
uv sync

# Test the installation
uv run python -c "import sympy; print('SymPy OK')"
uv run python -c "from pix2tex.cli import LatexOCR; print('Pix2Tex OK')"
```

**Note:** Pix2Tex will download models on first use (~500MB). This requires an internet connection.

### Start the Python Service

```bash
uv run uvicorn main:app --reload --port 8000
```

Verify it's running:
```bash
curl http://localhost:8000/health
# Should return: {"status":"ok","version":"0.1.0"}
```

---

## Step 5: Rust Backend Setup

```bash
cd backend

# Create environment file
cp .env.example .env
```

Edit `.env` with your credentials:
```env
DATABASE_URL=postgres://user:pass@ep-xxx.neon.tech/dbname?sslmode=require
GEMINI_API_KEY=your-gemini-api-key-here
PYTHON_SERVICE_URL=http://localhost:8000
PORT=3000
HOST=0.0.0.0
```

### Build and Run

```bash
# Build (first time will be slow)
cargo build

# Run
cargo run
```

The server will:
1. Connect to Neon PostgreSQL
2. Run database migrations (creates tables)
3. Start listening on port 3000

Verify it's running:
```bash
curl http://localhost:3000/health
# Should return: {"status":"ok","version":"0.1.0"}
```

---

## Step 6: Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start Expo development server
npx expo start
```

### Running the App

- **iOS Simulator**: Press `i` in the terminal
- **Android Emulator**: Press `a` in the terminal
- **Physical Device**: Scan the QR code with Expo Go app
- **Web Browser**: Press `w` in the terminal

### Configure API URL (Optional)

For physical devices, you may need to update the API URL. Create `frontend/.env`:

```env
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3000/api
```

Replace `YOUR_LOCAL_IP` with your machine's local IP address (e.g., `192.168.1.100`).

---

## Verification Checklist

Run these commands to verify your setup:

### 1. Python Service
```bash
curl -X POST http://localhost:8000/solve \
  -H "Content-Type: application/json" \
  -d '{"expression_latex": "x^2 - 4 = 0", "operation": "solve"}'
```

Expected response:
```json
{
  "success": true,
  "answer_latex": "x = -2 \\vee x = 2",
  "steps": [...],
  "error": null
}
```

### 2. Rust Backend
```bash
curl -X POST http://localhost:3000/api/generate-question \
  -H "Content-Type: application/json" \
  -d '{"subject": "math", "topic": "Algebra", "difficulty": 2}'
```

Expected response: A generated question (or template fallback if no API key).

### 3. Frontend
- Open the app
- Navigate to "Quiz" tab
- Select a topic
- Start a quiz

---

## Troubleshooting

### Python: "ModuleNotFoundError: No module named 'pix2tex'"

```bash
cd python-service
uv sync --reinstall
```

### Rust: "error connecting to database"

1. Check your `DATABASE_URL` in `.env`
2. Ensure Neon project is active
3. Check if your IP is whitelisted (Neon dashboard → Settings → IP Allow)

### Rust: "Connection refused to Python service"

Ensure Python service is running:
```bash
cd python-service
uv run uvicorn main:app --reload --port 8000
```

### Frontend: "Network request failed"

1. Check if backend is running on port 3000
2. For physical devices, ensure you're using your local IP, not `localhost`
3. Check that all services are on the same network

### Pix2Tex: Model download fails

Download models manually:
```bash
cd python-service
uv run python -c "from pix2tex.cli import LatexOCR; LatexOCR()"
```

This will download and cache the models.

---

## Development Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend (Expo) | 8081 | http://localhost:8081 |
| Rust Backend | 3000 | http://localhost:3000 |
| Python Service | 8000 | http://localhost:8000 |

---

## Next Steps

1. Read [ARCHITECTURE.md](./ARCHITECTURE.md) to understand the system design
2. Read [API.md](./API.md) for API documentation
3. Read [DEVELOPMENT.md](./DEVELOPMENT.md) for development guidelines
