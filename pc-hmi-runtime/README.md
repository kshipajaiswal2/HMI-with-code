# Plant HMI — Windows PC Platform

Our own HMI software for Windows, equivalent to Rockwell FactoryTalk View.

## Two apps in one platform

| App | Purpose | Launch |
|-----|---------|--------|
| **Studio** | Engineering — new projects, explorer, display editing | `npm run desktop` |
| **Runtime** | Operator — live HMI on panel PC | `npm run desktop:runtime` |

## Quick start (Windows)

```powershell
cd pc-hmi-runtime
npm install
npm start
```

Open **http://127.0.0.1:8080** — Studio IDE with project explorer.

### Windows desktop app

```powershell
npm install
npm run desktop          # Studio (like View Studio)
npm run desktop:runtime  # Operator runtime (like View Runtime)
npm run desktop:kiosk    # Full-screen operator mode
```

## New project workflow

1. Open Studio → **New Project** → enter name
2. All **18 standard displays** are created automatically (Overview, Settings, Manual, Alarms, Recipe, etc.)
3. Click displays in explorer to preview
4. **＋ Display** to add custom screens
5. **✕ Display** to remove screens
6. **▶ Run** to launch operator runtime

## Standard display library

Every new project includes:

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

## Project structure

Each application gets its own folder under `projects/`, laid out like **FactoryTalk View** on disk:

```
projects/
  MyProject/
    project.json              ← master config (tags, alarms, users, runtime)
    navigation.json           ← runtime nav bar
    Gfx/                      ← all displays (like FactoryTalk .gfx files)
      100_Overview.json
      200_Settings.json
      ...
    Tag/
      MyProject-Tags.CSV      ← exported tag list (auto-synced)
    M_Alarms/
      alarms.json             ← alarm definitions (auto-synced)
    ProjectSettings/
      project.json            ← settings snapshot (auto-synced)
    Images/                   ← bitmap assets (planned)
    Macros/                   ← macro scripts (planned)
    RecipePlus/               ← recipe data (planned)
    Global Objects/           ← shared faceplates (planned)
    Accounts/ ActivityLog/ AuditTrail/ ...   ← other FT folders (ready)
```

| FactoryTalk folder | Plant HMI Studio |
|--------------------|------------------|
| `Gfx/*.gfx` | `Gfx/*.json` — one JSON file per display/screen |
| `Tag/*-Tags.CSV` | `Tag/{projectId}-Tags.CSV` — auto-exported from `project.json` |
| `M_Alarms/` | `M_Alarms/alarms.json` — synced from `project.json` |
| `ProjectSettings/` | `ProjectSettings/project.json` — copy of project settings |
| `Images/` | Reserved for imported images |
| Other folders | Created empty on new project; wired as features are added |

Legacy projects with a `screens/` folder are migrated automatically to `Gfx/` on first open.

The shared screen library lives in `screens/` at repo root and is copied into each new project's `Gfx/` folder.

## Features (Rockwell parity)

| Feature | Status |
|---------|--------|
| Project Studio + explorer | Done |
| 18 standard displays / new project | Done |
| Add / delete displays | Done |
| Runtime navigation | Done |
| Alarms (active, ack, history) | Done |
| User login / security | Done |
| IO diagnostics screens | Done |
| Windows desktop (Electron) | Done |
| OPC UA live PLC | Planned |
| Faceplate library | Planned |
| Trending + historian | Planned |
| Recipe PLC download | Planned |

Full architecture: `docs/pc_hmi_platform.md`

## Port

Default **8080** (Chrome blocks 5060). Override with `PORT` env variable.

Login: operator/operator · engineer/engineer · admin/admin
