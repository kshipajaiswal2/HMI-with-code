# Plant HMI — Studio + Runtime

Windows PC HMI platform — engineering studio and operator runtime, equivalent to Rockwell FactoryTalk View Studio + View Runtime.

Projects are stored as **JSON on disk**. No compile step. The runtime reads those files directly and renders live screens on a panel PC.

---

## Quick start

```powershell
cd "D:\Kshipa\Trial hmi\pc-hmi-runtime"
npm install    # first time only
npm start
```

Open **http://127.0.0.1:8080**

> Run all npm commands from **`pc-hmi-runtime/`**, not the repo root.

### Desktop apps (Electron)

```powershell
npm run desktop          # Studio window
npm run desktop:runtime  # Operator runtime
npm run desktop:kiosk    # Full-screen operator mode
```

First `npm install` may take several minutes while Electron downloads.

---

## Two applications

| App | Role | URL / launch |
|-----|------|--------------|
| **Studio** | Engineering — projects, explorer, display preview, settings | http://127.0.0.1:8080 |
| **Runtime** | Operator — live tags, alarms, navigation, login | http://127.0.0.1:8080/runtime.html |

Click **▶ Run** in Studio to open runtime for the active project.

Default port: **8080** (override with `PORT` env variable).

Default users: `operator/operator` · `engineer/engineer` · `admin/admin`

---

## New project workflow

1. Launch Studio → **New/Open Application** dialog appears
2. **New** tab → enter application name → **Create**
3. **18 standard displays** are created automatically (Overview, Settings, Manual, Alarms, Recipe, etc.)
4. Explorer tree: **Graphics → Displays**, **Global Objects → Template**, **Images**
5. Click a display to preview in the workspace
6. Right-click → **Import and Export...** for graphics transfer (JSON)
7. **▶ Run** to test operator runtime

---

## Project folder structure

Each application lives under `projects/<id>/`:

```
projects/MyPlant/
  project.json              ← tags, alarms, users, runtime & comm settings
  navigation.json           ← bottom nav bar
  Gfx/                      ← displays (one JSON file per screen)
    100_Overview.json
    200_Settings.json
    ...
  Global Objects/
    Template.json           ← global object defaults
  Images/                   ← bitmap assets
  Tag/
    MyPlant-Tags.CSV        ← auto-synced tag export
  M_Alarms/
    alarms.json             ← auto-synced alarm definitions
  ProjectSettings/
    project.json            ← settings snapshot
```

| FactoryTalk | Plant HMI |
|-------------|-----------|
| `Gfx/*.gfx` | `Gfx/*.json` |
| `Tag/*-Tags.CSV` | `Tag/{projectId}-Tags.CSV` |
| `M_Alarms/` | `M_Alarms/alarms.json` |
| `Images/` | `Images/` |
| `Global Objects/` | `Global Objects/Template.json` |

Legacy `screens/` folders are migrated to `Gfx/` automatically on open.

The shared screen library is in `screens/` at this folder root and is copied into every new project.

---

## Standard displays (every new project)

| Folder | Screens |
|--------|---------|
| 100 Overview | Overview, Production Data, Prestart, Safety, Mimic |
| 200 Settings | Settings |
| 300 Manual | Manual Operation, PLC IO List, PLC Architecture, IO List, Cycle Time |
| 400 Alarms | Active Alarms, Alarm History, Alarm Remedies |
| 500 Recipe | Recipe, Recipe Detail |
| 600 Legends | Legends |
| 700 Users | User Management |

Defined in `config/standard-screens.json`.

---

## How JSON reaches a real HMI

```
Studio saves JSON  →  projects/MyPlant/  →  Runtime on panel PC  →  PLC (tags)
```

1. **JSON = blueprint** — screens, tag names, alarm definitions, images
2. **Panel PC runs Plant HMI Runtime** — reads JSON and draws the operator UI
3. **Communication driver** reads/writes live values to the PLC (simulator today; OPC UA planned)
4. **Deploy** — copy `projects/MyPlant/` to the panel and run `npm start` or `npm run desktop:runtime`

JSON does **not** go to the PLC. Only tag read/write traffic crosses the network.

---

## Features

| Feature | Status |
|---------|--------|
| Project Studio + explorer tree | Done |
| New/Open application dialog | Done |
| 18 standard displays per project | Done |
| Add / delete displays | Done |
| Global Objects → Template | Done |
| Images folder + upload + properties | Done |
| Graphics Import/Export wizard | Done |
| Display settings (size, background `#EBEBEB`) | Done |
| Runtime navigation + live tags | Done |
| Alarms (active, ack, history) | Done |
| User login / security | Done |
| Windows desktop (Electron) | Done |
| PLC simulator (offline dev) | Done |
| OPC UA live PLC | Planned |
| Automated FTP/USB transfer | Planned |
| Packaged `.exe` installer | Planned |
| Faceplate library | Planned |
| Trending + historian | Planned |
| Recipe PLC download | Planned |

Architecture details: [../docs/pc_hmi_platform.md](../docs/pc_hmi_platform.md)

---

## Key Studio menus

| Menu | Action |
|------|--------|
| File → New / Open Application | Create or open project |
| File → Save | Save project settings |
| View → Explorer / Status Bar | Toggle panels |
| Application → Create Runtime Application | Launch operator runtime |
| Tools → Transfer Utility | Deploy project to panel PC (manual copy today) |
| Explorer right-click → Import and Export | Graphics JSON export/import |

Hard refresh after updates: **Ctrl+F5**

---

## API overview (for developers)

| Endpoint | Purpose |
|----------|---------|
| `GET /api/projects` | List projects |
| `POST /api/projects` | Create project |
| `POST /api/projects/:id/open` | Open + migrate project |
| `GET /api/projects/:id/explorer` | Explorer tree |
| `POST /api/projects/:id/graphics/export` | Export displays to folder |
| `POST /api/projects/:id/graphics/import` | Import displays from folder |
| `POST /api/projects/:id/images` | Upload image (base64 JSON) |
| `GET /api/runtime/screens/:id` | Screen JSON for runtime |
| `GET /api/runtime/tags` | Live tag values |
| `POST /api/runtime/tags/write` | Write tag to PLC/simulator |

Static project files are served at `/projects/<id>/`.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `package.json` not found | `cd pc-hmi-runtime` before npm commands |
| `npm install` stuck on spinner | Wait — Electron download is slow on first run |
| Port 8080 already in use | Stop the old server process and restart |
| Blank Studio / old UI | Hard refresh **Ctrl+F5** |
| Image size shows 0×0 | Restart server after updates; images may be PNG with `.bmp` extension (now detected by content) |
| Changes not visible | Restart `npm start` after server-side code changes |

---

## Folder map

```
pc-hmi-runtime/
├── public/           studio.html, studio.js, runtime.html, app.js
├── server/           Express API, tag/alarm/user services
├── projects/         application data (JSON + images)
├── screens/          shared display library (seed for new projects)
├── config/           standard-screens.json, navigation template
├── electron/         desktop app wrapper
└── scripts/          dev utilities
```
