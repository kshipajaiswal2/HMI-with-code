# Stopper HMI Template

## Screen Title
PC01 Stopper

## Indicators
- Up Position Indicator
    - Tag: {Equipment}.UpFb

- Down Position Indicator
    - Tag: {Equipment}.DownFb

## Push Buttons
- Up Button
    - Command Tag: {Equipment}.UpCmd

- Down Button
    - Command Tag: {Equipment}.DownCmd

## Interlocking Rules
- Up and Down commands cannot be active simultaneously
- Show active state indication

## Color Rules
- Active = Green
- Fault = Red
- Inactive = Gray

## Naming Rules
Example Equipment:
STP_PC01

Example Tags:
STP_PC01.UpCmd
STP_PC01.DownCmd
STP_PC01.UpFb
STP_PC01.DownFb