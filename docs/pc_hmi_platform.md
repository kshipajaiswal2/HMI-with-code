# PC-Based HMI Platform

Standalone operator HMI runtime for PC deployment. This is separate from the FactoryTalk engineering bridge (`web-hmi-bridge/`).

## Two products, one ecosystem

| Product | Folder | Purpose |
|---------|--------|---------|
| **Engineering Bridge** | `web-hmi-bridge/` | Build FactoryTalk projects offline — tag generation, XML editing, import packaging |
| **PC HMI Runtime** | `pc-hmi-runtime/` | Live operator station — PLC communication, alarms, trends, recipes, user management |

The engineering bridge produces tag definitions, alarm seeds, and screen specs. The runtime consumes them.

## Architecture

```
PLC / Controller
       │
       ▼
Communication Layer (OPC UA / Simulator)
       │
       ▼
Platform Core Services
  ├── Tag Service        — subscribe, cache, read/write
  ├── Alarm Service      — active, ack, history
  ├── Trend Service      — historian, charts (Phase 3)
  ├── Recipe Service     — CRUD, PLC download (Phase 3)
  ├── User Service       — login, roles, permissions
  └── Diagnostics        — comm health, device status
       │
       ▼
Screen Renderer
  ├── Component library  — NavBar, AlarmList, NumericDisplay, etc.
  ├── Faceplate library  — Motor, VFD, Conveyor popups
  └── JSON screen defs   — declarative screen authoring
```

## Screen definition format

Screens are JSON files in `pc-hmi-runtime/screens/`. Any developer can create or modify a screen without FactoryTalk Studio.

```json
{
  "id": "100_Overview",
  "title": "Overview",
  "navGroup": "overview",
  "layout": "standard",
  "components": [
    { "type": "StateIndicator", "tag": "System.AutoMode", "label": "Mode",
      "states": { "0": { "text": "Manual", "color": "#0066cc" }, "1": { "text": "Auto", "color": "#00c000" } } },
    { "type": "NavButton", "label": "Production Data", "target": "101_Production_Data" }
  ]
}
```

See `pc-hmi-runtime/schemas/screen.schema.json` for the full spec.

## Developer workflow for a new project

1. Run the PowerShell pipeline to generate tags and alarms from the master sheet.
2. Copy the standard screen library from `pc-hmi-runtime/screens/`.
3. Customize faceplates in `pc-hmi-runtime/faceplates/` for project equipment.
4. Point `config/project.json` at the PLC OPC UA endpoint (or use simulator for dev).
5. Start the runtime: `cd pc-hmi-runtime && npm start`.
6. Deploy on PC in kiosk/fullscreen mode.

## Module roadmap

| Phase | Module | Status |
|-------|--------|--------|
| 1 | Tag service + simulator | Done |
| 1 | Screen renderer + navigation | Done |
| 1 | Overview screen | Done |
| 2 | Alarm service + screens | Done |
| 2 | User management | Planned |
| 2 | Faceplate library | Planned |
| 2 | Diagnostics screen | Planned |
| 3 | Trending + historian | Planned |
| 3 | Recipe management | Planned |
| 3 | OPC UA live driver | Planned |
| 4 | Import from engineering pipeline | Planned |
| 4 | Electron kiosk wrapper | Planned |

## Communication

- **Development:** Built-in tag simulator with realistic value changes.
- **Production:** OPC UA client (Phase 3) — works with Allen-Bradley, Siemens, and others.
- **Offline fallback:** Simulator mode when PLC is unreachable.

## Deployment

Current: browser-based runtime at `http://localhost:5060`, deployable in Chrome/Edge kiosk mode.

Future: Electron wrapper for native PC app with auto-start and fullscreen.
