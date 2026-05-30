# RPG Virtual Tabletop

A local-first virtual tabletop for tabletop RPG campaigns. The app combines a React/Vite frontend with a FastAPI backend, campaign-scoped storage, maps, character sheets, drag-and-drop tokens, chat, party management, and campaign media display.

## Current Applications

This repository contains two applications:

- `backend/`: FastAPI API, WebSocket chat, SQLite database, file storage, campaign media folders.
- `frontend/`: React Vite app for the VTT table, campaign UI, map canvas, sheets, party, media, chat, and controls.

## Stack

Backend:

- Python 3.10+
- FastAPI
- Uvicorn
- SQLAlchemy
- SQLite
- Pydantic
- WebSockets
- bcrypt
- python-multipart for uploads
- pytest/httpx for tests

Frontend:

- Node.js 18+
- React 18
- Vite 5
- lucide-react icons
- Tailwind CSS is installed/configured, but most VTT-specific layout currently lives in `frontend/src/App.css`
- HTML canvas for the battle map
- Native HTML5 drag/drop for tokens and sheet placement

## Main Features

- User registration, login, logout, and cookie-based sessions.
- Campaign creation and management.
- Supported campaign game systems:
  - `Dnd5e 2014`
  - `Tormenta20`
- Campaign-scoped maps uploaded to the campaign folder.
- Map canvas with:
  - image maps
  - grid toggle
  - grid size and color controls
  - snap-to-grid token movement
  - pan and zoom
  - draw tools
  - ruler
  - optional HUD visibility
- D&D 5e 2014 character sheet modal with broad character data coverage.
- Tormenta20 character sheet model.
- Character sheet CRUD by campaign and game system.
- Character-sheet accordions in the Sheets panel.
- Character image/avatar upload inside D&D sheet modal.
- Drag a character sheet onto the map to create a token.
- Placed token features:
  - drag movement
  - grid snap
  - HP bar
  - selection outline
  - double-click inspector
  - edit name, HP, AC, size, rotation, notes, conditions
  - delete, bring to front, send to back
- RightDock tabs:
  - Chat
  - Sheets
  - Media
  - Party
- Real-time table chat through WebSocket.
- Party panel:
  - DM shown at top
  - DM can add/remove players from the campaign
- Campaign media panel:
  - DM can upload images, audio, video, GIFs, and PDFs
  - files are stored inside the selected campaign folder
  - media can be displayed to the table in a modal
- Campaign deletion removes campaign character sheets and campaign media folders.

## Project Structure

```txt
.
|-- backend/
|   |-- app/
|   |   |-- main.py
|   |   |-- database.py
|   |   |-- models/
|   |   |   |-- campaign.py
|   |   |   |-- user.py
|   |   |   `-- character/
|   |   |       |-- dnd5e_2014.py
|   |   |       `-- tormenta20.py
|   |   |-- routers/
|   |   |   |-- campaigns.py
|   |   |   |-- characters.py
|   |   |   |-- dice.py
|   |   |   |-- maps.py
|   |   |   |-- media.py
|   |   |   |-- users.py
|   |   |   `-- vtt.py
|   |   `-- websockets/
|   |       `-- router.py
|   |-- campaings/
|   |-- requirements.txt
|   `-- vtt.db
|-- frontend/
|   |-- src/
|   |   |-- App.jsx
|   |   |-- App.css
|   |   `-- components/
|   |-- package.json
|   `-- vite.config.js
|-- docs/
`-- shared/
```

Note: the campaign media directory is currently named `campaings` in the codebase.

## Requirements

Install these before running the app:

- Python 3.10 or newer
- Node.js 18 or newer
- npm
- A modern browser

Optional but useful:

- `sqlite3` CLI for inspecting `backend/vtt.db`
- `curl` for API checks

## First-Time Setup

From the repository root:

```bash
cd /path/to/vtt
```

Create and activate a Python virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Install backend dependencies:

```bash
cd backend
pip install -r requirements.txt
```

Install frontend dependencies:

```bash
cd ../frontend
npm install
```

## Run The App

Start FastAPI from the `backend/` folder using the root virtualenv:

```bash
cd backend
source ../.venv/bin/activate
uvicorn app.main:app --host 127.0.0.1 --port 8002
```

Start React from the `frontend/` folder:

```bash
cd frontend
npm run dev -- --host 127.0.0.1
```

Open the frontend:

```txt
http://127.0.0.1:5173/
```

If Vite says port `5173` is already in use, it may use another port such as:

```txt
http://127.0.0.1:5174/
```

FastAPI docs:

```txt
http://127.0.0.1:8002/docs
```

## Typical Usage Flow

1. Register a user.
2. Log in.
3. Create or join a campaign.
4. Choose a game system for the campaign.
5. Upload a map from the top map controls.
6. Open the Sheets tab.
7. Create character sheets.
8. Drag a character sheet onto the map to create a token.
9. Move tokens around the map.
10. Double-click a token to open its inspector.
11. Use the Party tab to manage DM/player campaign membership.
12. Use the Media tab to upload and display campaign media.

## Backend Details

### Database

The backend uses SQLite:

```txt
backend/vtt.db
```

Tables are created on startup through SQLAlchemy metadata in:

```txt
backend/app/main.py
```

### Authentication

The app uses cookie-based sessions:

- Login creates a signed `session_token` cookie.
- Protected API routes use `get_current_user`.
- Session configuration lives in `backend/config.py`.

### Campaign File Storage

Campaign files are stored under:

```txt
backend/campaings/<campaign_id>/
```

Subfolders created by the backend:

```txt
maps/
media/
tokens/
handouts/
audio/
thumbnails/
```

Maps are stored in:

```txt
backend/campaings/<campaign_id>/maps/
```

Media is stored in:

```txt
backend/campaings/<campaign_id>/media/
```

Campaign thumbnails are stored in:

```txt
backend/campaings/<campaign_id>/thumbnails/
```

## Important API Routes

Users:

```txt
POST   /api/users/register
POST   /api/users/login
POST   /api/users/logout
GET    /api/users/me
GET    /api/users/
PUT    /api/users/{user_id}
DELETE /api/users/{user_id}
```

Campaigns:

```txt
POST   /api/campaigns/
GET    /api/campaigns/
GET    /api/campaigns/{campaign_id}
PUT    /api/campaigns/{campaign_id}
DELETE /api/campaigns/{campaign_id}
POST   /api/campaigns/{campaign_id}/join
POST   /api/campaigns/{campaign_id}/players
POST   /api/campaigns/{campaign_id}/thumbnail
GET    /api/campaigns/{campaign_id}/thumbnail/{filename}
```

Maps:

```txt
GET    /api/campaigns/{campaign_id}/maps/
POST   /api/campaigns/{campaign_id}/maps/upload
GET    /api/campaigns/{campaign_id}/maps/{filename}
PUT    /api/campaigns/{campaign_id}/maps/{filename}
DELETE /api/campaigns/{campaign_id}/maps/{filename}
```

Media:

```txt
GET    /api/campaigns/{campaign_id}/media/
POST   /api/campaigns/{campaign_id}/media/upload
GET    /api/campaigns/{campaign_id}/media/{filename}
DELETE /api/campaigns/{campaign_id}/media/{filename}
```

Characters:

```txt
GET    /api/characters/?campaign_id={campaign_id}
POST   /api/characters/
GET    /api/characters/{character_id}
PUT    /api/characters/{character_id}?campaign_id={campaign_id}
DELETE /api/characters/{character_id}?campaign_id={campaign_id}
```

Dice and WebSocket:

```txt
POST /api/dice/roll
WS   /ws
```

## Frontend Notes

Most VTT-specific UI is currently styled in:

```txt
frontend/src/App.css
```

Tailwind is installed and configured, but the main VTT interface uses custom CSS classes for:

- table layout
- canvas overlays
- dock panels
- token layers
- modals
- responsive behavior

Core frontend files:

```txt
frontend/src/App.jsx
frontend/src/components/vtt/SceneStage.jsx
frontend/src/components/MapCanvas.jsx
frontend/src/components/vtt/TokenSystem.jsx
frontend/src/components/CharacterSheet.jsx
frontend/src/components/Dnd5e2014CharacterSheetModal.jsx
frontend/src/components/MediaPanel.jsx
frontend/src/components/PartyPanel.jsx
frontend/src/components/ChatSection.jsx
```

## Testing And Verification

Backend compile check:

```bash
cd backend
../.venv/bin/python -m compileall app
```

Frontend production build:

```bash
cd frontend
npm run build
```

Frontend lint:

```bash
cd frontend
npm run lint
```

Backend tests, where available:

```bash
cd backend
../.venv/bin/pytest
```

## Common Troubleshooting

### React is not running

Start it from `frontend/`:

```bash
npm run dev -- --host 127.0.0.1
```

Check the Vite output. If `5173` is occupied, use the alternate URL Vite prints.

### FastAPI is not running

Start it from `backend/`:

```bash
source ../.venv/bin/activate
uvicorn app.main:app --host 127.0.0.1 --port 8002
```

Open:

```txt
http://127.0.0.1:8002/docs
```

### Authentication required

The backend requires the `session_token` cookie for protected routes. Log out and log in again if the UI shows an authentication error.

### Media route returns 404

Restart FastAPI after adding/changing routers:

```bash
uvicorn app.main:app --host 127.0.0.1 --port 8002
```

### Uploaded media does not appear

Confirm the selected campaign has a folder like:

```txt
backend/campaings/<campaign_id>/media/
```

Also confirm you are logged in as the campaign DM for uploads/deletes.

## Future Improvements

- Persist token templates and placed token positions in the backend.
- Persist character accordion organization.
- Add backend-backed playlist/audio scenes.
- Add Spotify integration with OAuth/PKCE and Spotify Web Playback SDK.
- Add Web Audio API support for local campaign ambience, fades, and layered audio.
- Add migrations instead of startup schema patching.
- Replace or formalize the mixed Tailwind/App.css styling approach.
