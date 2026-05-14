# Pallet Dispenser HMI Template

## Screen Title
Pallet Dispenser

## Indicators
- MPCB Healthy
    - Red/Green pilot light
    - Tag: {Equipment}.MPCB_Healthy

## Numeric Displays
- Set Speed
    - Tag: {Equipment}.SetSpeed
    - Units: m/sec

- Running Speed
    - Tag: {Equipment}.RunningSpeed
    - Units: m/sec

- Motor Current
    - Tag: {Equipment}.MotorCurrent
    - Units: Amp

## Push Buttons
- Start
    - Command Tag: {Equipment}.StartCmd

- Stop
    - Command Tag: {Equipment}.StopCmd

## Color Rules
- Healthy = Green
- Fault = Red
- Running = Green
- Stopped = Gray

## Naming Rules
Example Equipment:
PD_101

Example Tags:
PD_101.StartCmd
PD_101.StopCmd
PD_101.SetSpeed
PD_101.RunningSpeed
PD_101.MotorCurrent
PD_101.MPCB_Healthy