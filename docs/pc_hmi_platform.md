# PC-Based HMI Platform — Windows Native

Our own HMI software for Windows PCs — same operator experience as Rockwell FactoryTalk View, with full control over customization and no FactoryTalk license required.

## Product vision

| Rockwell FactoryTalk | Our platform |
|---------------------|--------------|
| View Studio (engineering) | **Plant HMI Studio** — project explorer, display library, new project |
| View Runtime (operator PC) | **Plant HMI Runtime** — live tags, alarms, navigation, faceplates |
| FactoryTalk Linx (PLC comm) | **Communication layer** — OPC UA + Allen-Bradley EtherNet/IP (planned) |
| Global Objects / faceplates | **Faceplate library** — Motor, VFD, Conveyor JSON templates |
| Tag database | **HMI Tags** — project-scoped tag definitions |
| Alarm server | **Alarm service** — active, ack, history |
| Trend objects | **Trend service + historian** (planned) |
| Recipe system | **Recipe service** (planned) |
| Security / users | **User service** — role-based login |

## Two applications, one platform

```
┌─────────────────────────────────────────────────────────────┐
│  Plant HMI Studio (Engineering)          Windows Desktop    │
│  ├── Project explorer (like FT View Studio tree)            │
│  ├── New Project → 18 standard displays                     │
│  ├── Add / delete displays                                  │
│  ├── Tag & alarm configuration                              │
│  └── ▶ Run → launches operator runtime                      │
├─────────────────────────────────────────────────────────────┤
│  Plant HMI Runtime (Operator)            Windows Desktop    │
│  ├── Live PLC communication                                 │
│  ├── Standard navigation (Overview, Manual, Alarms, etc.)   │
│  ├── Faceplates, trending, recipes                          │
│  └── Full-screen kiosk mode for panel PC                    │
└─────────────────────────────────────────────────────────────┘
```

Separate from `web-hmi-bridge/` (FactoryTalk XML engineering tool).

## Standard display library (every new project)

All new projects start with 18 Rockwell-equivalent screens defined in `config/standard-screens.json`:

- **100 Overview** — Overview, Production Data, Prestart, Safety, Mimic
- **200 Settings** — Machine settings
- **300 Manual** — Manual Operation, PLC IO List, PLC Architecture, IO List, Cycle Time
- **400 Alarms** — Active Alarms, Alarm History, Alarm Remedies
- **500 Recipe** — Recipe select, Recipe detail
- **600 Legends** — Color/symbol legend
- **700 Users** — User login / management

Developers add or remove displays per project after creation.

## Modular architecture

```
Windows PC
    │
    ▼
Plant HMI Desktop (Electron)
    │
    ├── Studio UI ──────────── project authoring
    │
    └── Runtime Engine
            │
            ▼
        Communication Layer
            ├── OPC UA client (Allen-Bradley, Siemens, …)
            ├── EtherNet/IP (Rockwell native, planned)
            └── Simulator (development / offline)
            │
            ▼
        Platform Services
            ├── Tag Service
            ├── Alarm Service
            ├── Trend Service + Historian
            ├── Recipe Service
            ├── User / Security Service
            └── Diagnostics Service
            │
            ▼
        Screen Renderer
            ├── JSON screen definitions
            ├── Component library
            └── Faceplate library
```

## Screen authoring (easy maintenance)

Screens are JSON — any developer can create or edit without a special IDE:

```
projects/MyProject/screens/100_Overview.json
```

Component types: `NumericDisplay`, `StateIndicator`, `AlarmList`, `ToggleButton`, `DataTable`, `TrendChart`, `SubNav`, etc.

See `schemas/screen.schema.json` for the full specification.

## Feature parity roadmap

| Feature | Rockwell equivalent | Status |
|---------|--------------------|--------|
| Project Studio (explorer, new project) | View Studio | **Done** |
| 18 standard displays per project | Display library | **Done** |
| Add / delete displays | Display management | **Done** |
| Runtime navigation | Bottom nav bar | **Done** |
| Live tag binding | Linx shortcuts | **Done** (simulator) |
| Alarms (active, ack, history) | Alarm server | **Done** |
| User login / security levels | FT Security | **Done** (basic) |
| Diagnostics / IO monitoring | Diagnostic screens | **Done** |
| Windows desktop app | PanelView / FT View Runtime | **In progress** (Electron) |
| OPC UA live PLC comm | FactoryTalk Linx | Planned |
| EtherNet/IP (Allen-Bradley) | RSLinx / Linx | Planned |
| Faceplate library (Motor, VFD, …) | Global Objects | Planned |
| Trending + historian | FT Trend | Planned |
| Recipe download to PLC | FT Recipe | Planned |
| Visual screen editor | View Studio GUI | Planned |
| Import from master sheet pipeline | — | Planned |

## Windows deployment

### Development (today)
```powershell
cd pc-hmi-runtime
npm install
npm start
# Open http://127.0.0.1:8080
```

### Windows desktop (target)
```powershell
npm run desktop        # Studio + Runtime as Windows app
npm run desktop:runtime  # Operator kiosk fullscreen
```

Electron wraps the Node.js engine — single `.exe` installer for panel PC deployment, auto-start on boot, no browser required.

## Developer workflow (standard for all projects)

1. Open **Plant HMI Studio** on Windows
2. **New Project** → name it (e.g. `VAPR069`) → 18 standard screens created
3. Customize displays, add equipment faceplates, configure tags/alarms
4. Connect PLC (OPC UA endpoint in project settings)
5. **▶ Run** → operator runtime on panel PC
6. Deploy: copy `projects/VAPR069/` or install Windows package

## Relationship to engineering pipeline

| Tool | Role |
|------|------|
| PowerShell pipeline (`scripts/`) | Generate tags, alarms, device maps from master sheet |
| `web-hmi-bridge/` | FactoryTalk XML editing (legacy projects) |
| `pc-hmi-runtime/` | **Our own Windows HMI** — runtime + studio |

Future: import pipeline CSV output directly into project tag/alarm definitions.
