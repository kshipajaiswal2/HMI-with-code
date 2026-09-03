# PlantHMI

Windows HMI platform — our own alternative to Rockwell FactoryTalk View, plus engineering tools for legacy FactoryTalk workflows.

## What's in this repo

| Folder | What it is | Start command |
|--------|------------|---------------|
| **`pc-hmi-runtime/`** | **Plant HMI Studio + Runtime** — JSON projects, explorer, live operator HMI | See below |
| **`web-hmi-bridge/`** | Legacy FactoryTalk XML bridge — tag CSV, PAR files, import packages | `cd web-hmi-bridge` → `npm start` |
| **`hmi/import_templates/`** | Reference Tags CSV, PAR files, graphics export folder | — |
| **`scripts/`** | PowerShell pipelines (tags, alarms, device maps from master sheet) | — |
| **`docs/`** | Architecture and workflow docs | — |

> **Important:** There is no `package.json` at the repo root. Always `cd` into the app folder before `npm install` or `npm start`.

---

## Plant HMI — quick start

Engineering studio and operator runtime live in **`pc-hmi-runtime/`**.

```powershell
cd "D:\Kshipa\Trial hmi\pc-hmi-runtime"
npm install    # first time only — may take a few minutes (downloads Electron)
npm start
```

Open **http://127.0.0.1:8080** for Plant HMI Studio.

| Goal | Command |
|------|---------|
| Studio in browser | `npm start` → http://127.0.0.1:8080 |
| Studio with file watching | `npm run dev` |
| Studio desktop app | `npm run desktop` |
| Operator runtime | `npm run desktop:runtime` |
| Full-screen kiosk | `npm run desktop:kiosk` |
| Run automated tests | `npm test` |
| Build a panel deployment package | `npm run build:panel -- <projectId>` |

Default login: `operator` / `operator` · `engineer` / `engineer` · `admin` / `admin`

Full Studio docs: **[pc-hmi-runtime/README.md](pc-hmi-runtime/README.md)**

---

## Why JSON instead of FactoryTalk files?

| FactoryTalk | Plant HMI |
|---------------|-----------|
| Proprietary `.gfx` → compile → `.mer` → transfer | Plain `Gfx/*.json` — no compile step |
| Needs View Studio + licenses | Runs on any Windows panel PC |
| Hard to version in Git | JSON diffs and merges in source control |
| Manual tag/screen work | Scripts can generate JSON from master sheet |

JSON is the **project format**. The **panel PC runs Plant HMI Runtime**, which reads those files and talks to the PLC via a communication driver (simulator today, OPC UA planned). JSON never goes to the PLC — only live tag values do.

---

## Deploy to a panel PC

1. Build a deployment package from `pc-hmi-runtime/`:
  `npm run build:panel -- <projectId>`
2. Copy the generated package from `pc-hmi-runtime/deploy/packages/` to the target machine.
3. Extract it and run the included start script, or copy
  `pc-hmi-runtime/projects/<YourProject>/` and start the runtime manually.
4. For a manual setup, install Node.js and run
  `npm run desktop:runtime`, or open
  `http://127.0.0.1:8080/runtime.html?project=<YourProject>` after `npm start`.

Studio’s **Tools → Transfer Utility** can also create a ZIP or folder deployment.

---

## Web HMI Bridge — quick start

For FactoryTalk XML editing, Tags CSV export, and import package generation:

```powershell
cd "D:\Kshipa\Trial hmi\web-hmi-bridge"
npm install
npm start
```

Open **http://localhost:5050**

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `5050` | Web server port |
| `FT_EXPORT_DIR` | `..\Export import` | FactoryTalk export folder |
| `FT_IMAGE_DIR` | `..\hmi\MyPlantHMI\Images` | Preview image library |
| `FT_HMI_DIR` | `..\hmi` | HMI project root |

### Typical bridge workflow

1. **New Project** — seeds displays from `web-hmi-bridge/ftio/default-pages/`
2. **Import Folder** — load exported display XML
3. **IO List** — upload master sheet → download Tags CSV + PAR files per zone
4. **Page Import / All Import** — generate FactoryTalk import packages under `ftio/reimport/packages/`

Reference files: `hmi/import_templates/69zone3.csv`, `hmi/import_templates/PAR/`

---

## Generate engineering assets (PowerShell)

From repo root:

```powershell
.\scripts\generate_factorytalk_assets.ps1 `
  -MasterSheetPath "hmi\VAPR067_Master Sheet_V08 2 1.xlsx" `
  -ProjectRoot "hmi\MyPlantHMI" `
  -ConfigPath "templates\factorytalk_pipeline.config.json" `
  -OutputDir "generated"
```

---

## Repository layout

```
Trial hmi/
├── pc-hmi-runtime/          ← Plant HMI Studio + Runtime (start here for HMI)
│   ├── projects/            ← one folder per application (JSON + Images)
│   ├── public/              ← Studio + Runtime UI
│   └── server/              ← APIs, tag/alarm services
├── web-hmi-bridge/          ← FactoryTalk XML bridge
├── hmi/import_templates/    ← reference Tags, PAR, graphics exports
├── Export import/           ← FactoryTalk XML drop folder
├── scripts/                 ← PowerShell generators
├── templates/             ← pipeline config
├── generated/               ← build output (disposable)
└── docs/                    ← architecture docs
```

---

## Documentation

| Doc | Topic |
|-----|-------|
| [pc-hmi-runtime/README.md](pc-hmi-runtime/README.md) | Studio, runtime, project structure, features |
| [docs/pc_hmi_platform.md](docs/pc_hmi_platform.md) | Platform architecture and roadmap |
| [docs/offline_hmi_workflow.md](docs/offline_hmi_workflow.md) | Offline engineering workflow |
| [docs/factorytalk_reusable_pipeline.md](docs/factorytalk_reusable_pipeline.md) | FactoryTalk pipeline |
| [docs/factorytalk_import_ready_steps.md](docs/factorytalk_import_ready_steps.md) | Import checklist |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `ENOENT package.json` at repo root | Run npm inside `pc-hmi-runtime/` or `web-hmi-bridge/`, not the root |
| `npm install` appears stuck | Normal — Electron is large; wait 2–10 minutes on first install |
| Port 8080 in use | Kill old node: `Get-NetTCPConnection -LocalPort 8080 \| ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }` |
| Studio UI looks old | Hard refresh: **Ctrl+F5** |
| Bridge on port 5050 stale | Hard refresh: **Ctrl+Shift+R** |
| Tags CSV only has Temp_Tags | Pick a zone in IO List editor before downloading |
| Preview images missing (bridge) | Check `FT_IMAGE_DIR` points to your Images folder |
