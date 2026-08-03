# PC HMI Runtime

Standalone operator HMI for PC deployment. Live tag communication, alarms, navigation, and modular JSON-based screen authoring.

This is separate from the FactoryTalk engineering bridge in `web-hmi-bridge/`.

## Quick start

```powershell
cd pc-hmi-runtime
npm install
npm start
```

Open `http://localhost:5060` in a browser. For kiosk deployment, use Chrome/Edge in fullscreen mode.

## What works now

- Live tag simulator with realistic value changes
- Overview screen with production metrics and status indicators
- Active Alarms screen with acknowledge
- Alarm banner across all screens
- Standard navigation bar (Overview, Settings, Manual, Alarms, Recipe, Legends, Login)
- JSON screen definitions — add screens without code changes to the renderer
- Socket.io real-time tag and alarm updates

## Project structure

```
pc-hmi-runtime/
├── config/project.json     Project settings, tags, alarms, users
├── screens/                JSON screen definitions
├── faceplates/             Reusable equipment popup templates
├── schemas/                JSON Schema for screen/faceplate validation
├── server/                 Express + Socket.io backend
│   └── services/           Tag, Alarm, User services + Simulator driver
└── public/                 Browser UI + component registry
```

## Adding a new screen

Create `screens/200_Settings.json`:

```json
{
  "id": "200_Settings",
  "title": "Settings",
  "navGroup": "settings",
  "layout": "standard",
  "components": [
    {
      "type": "Grid",
      "style": { "className": "metric-grid" },
      "children": [
        { "type": "NumericDisplay", "tag": "Production.Rate", "label": "Rate", "format": "float", "decimals": 1 }
      ]
    }
  ]
}
```

Restart is not required — refresh the browser and click the nav button.

## Configuration

Edit `config/project.json` to define tags, alarms, users, and communication settings.

| Setting | Description |
|---------|-------------|
| `communication.driver` | `simulator` (now) or `opcua` (planned) |
| `startupScreen` | Screen id shown on launch |
| `tags` | Tag definitions loaded at startup |
| `alarms` | Alarm definitions bound to boolean tags |

## Architecture

See `docs/pc_hmi_platform.md` for the full platform architecture and roadmap.

## Port

Default: **5060** (engineering bridge uses 5050). Override with `PORT` environment variable.
