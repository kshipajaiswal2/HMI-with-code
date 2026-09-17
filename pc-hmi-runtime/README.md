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

### Building an installer (deploy to another PC as real software)

`npm run desktop*` above is for running from this checkout during development —
it still needs this whole project folder plus `node_modules` present. To turn
Plant HMI into an actual installable Windows application (double-click a
setup file, get Start Menu shortcuts, no Node.js or npm required on the
target PC at all), build the installer with **electron-builder**:

```powershell
cd "D:\Kshipa\Trial hmi\pc-hmi-runtime"
npm install               # first time only — installs electron-builder too
npm run dist
```

This produces two files in `dist\`:

- `PlantHMI-Setup-<version>.exe` — installer (Start Menu + desktop shortcuts)
- `PlantHMI-Portable-<version>.exe` — single-file app, no install step

Copy either file to the target PC. No Node.js or npm is required there. The
installer is per-user (no admin rights) and creates three Start Menu
shortcuts plus a desktop shortcut:

| Shortcut | Launches |
|----------|----------|
| Plant HMI Studio | Engineering workspace (same as `npm run desktop`) |
| Plant HMI Runtime | Operator runtime, windowed (same as `npm run desktop:runtime`) |
| Plant HMI Kiosk | Operator runtime, fullscreen/locked (same as `npm run desktop:kiosk`) |

Studio and Runtime can stay open at the same time. In Studio, **▶ Run** and **Test Display** open the operator window inside the app (not the system browser). If a shortcut appears to do nothing, an older Plant HMI process is probably still running — close it in Task Manager, then launch again.

The installed app runs its own bundled copy of Node (via Electron), so it
does **not** depend on Node.js being installed on the target machine — only
the packaged app itself needs to be there.

Installed Studio stores your working projects in a writable user folder so
reinstalling the app does not wipe your work:

`%APPDATA%\Plant HMI\projects`

Windows may show a SmartScreen prompt on first run because the installer is
unsigned. Choose **More info → Run anyway** if you built it yourself.

The first launch copies the bundled starter projects there. After that, all
edits stay in that folder. Dev checkouts (`npm run desktop`) still use
`pc-hmi-runtime/projects/` in this repo.

Rebuild and re-run the installer any time you want to push an updated build
to another PC; it overwrites the previous install in place.

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
4. Explorer: **Application** tab (Graphics, Tags, Alarms, Information, Macros, Data Log, RecipePlus) and **Communications** tab (Linx topology)
5. Click a display to preview in the workspace
6. Right-click → **Import and Export...** for graphics transfer (JSON)
7. **▶ Run** to test operator runtime

---

## Project folder structure

Each application lives under `projects/<id>/`:

```
projects/MyPlant/
  project.json              ← tags, alarms, users, runtime, communication, and setup files
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

Setup editors persist extra keys on `project.json` (`alarmSetup`, `informationSetup`, `localMessages`, `macros`, `dataLogModels`, `recipePlusSetup`, `recipePlusFiles`). `PATCH /api/projects/:id/config` merges those keys and reloads runtime services.

---

## Explorer

The left Explorer pane has two tabs, matching FactoryTalk View Studio:

| Tab | Contents |
|-----|----------|
| **Application** | Project tree: System, Tags, Graphics, Alarms, Information, Logic and Control (Macros), Data Log Models, RecipePlus, FactoryTalk Linx → Communications Setup |
| **Communications** | FactoryTalk Linx topology: this PC → `1789-A17` backplane → RSLinx, Linx Desktop, and the configured PLC/simulator. Status bar shows **Mode** (Online/Offline) and **Browsing**. Double-click the PLC node to open Communications Setup. |

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
3. **Communication driver** reads/writes live values to the PLC (simulator, EtherNet/IP, or OPC UA endpoint)
4. **Deploy** — copy `projects/MyPlant/` to the panel and run `npm start` or `npm run desktop:runtime`

JSON does **not** go to the PLC. Only tag read/write traffic crosses the network.

### PLC tag aliases

When the HMI tag name differs from the Logix controller tag, set **`plcAddress`** on the tag definition:

```json
{
  "name": "Production.Count",
  "type": "int",
  "plcAddress": "Program:MainProgram.ProductionCount",
  "description": "Parts produced"
}
```

Edit in Studio → Tags → New/Edit Tag → **PLC Address**, or import via JSON. Exported CSV includes a **PLC Address** column.

---

## Features

| Feature | Status |
|---------|--------|
| Project Studio + explorer tree | Done |
| New/Open application dialog | Done |
| 18 standard displays per project | Done |
| Add / delete displays | Done |
| Canvas edit (select, move, cut/copy/paste, undo) | Done |
| Animation, connections, tag substitution | Done |
| Global Objects → Template | Done |
| Images folder + upload + properties | Done |
| Graphics Import/Export wizard | Done |
| Display settings (size, background `#EBEBEB`) | Done |
| Alarm Setup (triggers, messages, advanced) | Done |
| Information Setup + Information Messages | Done |
| Local Messages spreadsheet | Done |
| Logic and Control → Macros | Done |
| Data Log Models (setup, paths, triggers, tags) | Done |
| RecipePlus Setup + RecipePlus Editor | Done |
| Trend object (display-level) | Done |
| Runtime navigation + live tags | Done |
| Alarms (active, ack, history) | Done |
| User login / security | Done |
| Windows desktop (Electron) | Done |
| PLC simulator (offline dev) | Done |
| EtherNet/IP live PLC (Allen-Bradley) | Implemented — tag poll + write via `st-ethernet-ip` |
| OPC UA driver | Implemented — endpoint + connection test (full browse planned) |
| PLC tag aliases (`plcAddress`) | Implemented — map HMI tag names to Logix paths |
| Panel deploy package | `npm run build:panel -- <projectId>` or Transfer Utility |
| Automated FTP/USB transfer | Implemented — Transfer Utility builds ZIP + folder deploy |
| Packaged panel runtime | Implemented — `deploy/packages/<project>-panel-*.zip` with start scripts |
| Faceplate / Symbol Factory library | Partial — Libraries browser lists global objects and images |
| Recipe PLC download API | Planned |
| Data log file write to custom paths | Planned |

Architecture details: [../docs/pc_hmi_platform.md](../docs/pc_hmi_platform.md)

---

## Key Studio menus

FactoryTalk View ME-style menus. File → New, Edit, View, Application, and Tools items open real dialogs or editors (not stubs).

| Menu | Action |
|------|--------|
| File → New → Display / Parameter / Data Log / Macro / Information Message / RecipePlus / Local Message | Create that document or editor |
| File → New → Library | Browse global objects and images |
| File → New / Open / Close Application | Project lifecycle |
| File → Save | Save open spreadsheet editors and project files |
| Edit → Cut / Copy / Paste / Duplicate / Delete | Canvas objects (when a display object is selected) |
| Edit → Tag Substitution (Ctrl+R) | Replace tags on selected objects, this display, or all displays |
| Edit → Connections / Animation | Tag bindings and visibility/color/size expressions |
| Edit → Display Settings, Key Assignments, Wallpaper | Display chrome |
| View → Explorer / Status Bar / Toolbars / Grid / Zoom | Studio chrome |
| View → Test Display | Operator preview of the open display |
| Application → Test Application | Launch operator runtime |
| Application → Create Runtime Application | Packaged runtime dialog |
| Application → Change Application Language / Properties | Language + project settings |
| Tools → Tag / Alarm Import and Export Wizards | CSV/JSON transfer |
| Tools → Transfer Utility | Deploy project to a panel PC |
| Tools → Find / Replace / Cross Reference | Search across displays and tags |
| Tools → Firmware Upgrade Wizard | Rebuild or transfer the PC runtime |
| Tools → Domain Certificate | HTTPS cert/key paths on the project |
| Tools → CSV Data Log Tamper Detection | Seal / verify data log hashes |
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
| `PATCH /api/projects/:id/config` | Merge project.json (setup files, communication, runtime) |
| `POST /api/projects/:id/graphics/export` | Export displays to folder |
| `POST /api/projects/:id/graphics/import` | Import displays from folder |
| `POST /api/projects/:id/images` | Upload image (base64 JSON) |
| `GET /api/runtime/screens/:id` | Screen JSON for runtime |
| `GET /api/runtime/tags` | Live tag values |
| `POST /api/runtime/tags/write` | Write tag to PLC/simulator |
| `GET /api/runtime/communication` | Driver, path, and connection status |
| `POST /api/runtime/macros/run` | Run a named macro |
| `GET /api/runtime/data-log` | Data log models and samples |
| `GET /api/studio/fs/roots` · `/list` · `POST .../mkdir` | Folder browser (RecipePlus Setup) |

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
