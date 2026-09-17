; Custom NSIS hooks for the Plant HMI installer (electron-builder "include" script).
;
; electron-builder's default Start Menu / Desktop shortcut only ever launches
; the exe with no arguments (Studio mode). This app actually has three launch
; modes (Studio / Runtime / Runtime Kiosk) selected by CLI flags, so the
; default shortcut creation is disabled in package.json's "nsis" config
; (createDesktopShortcut/createStartMenuShortcut: false) and all three
; shortcuts are created here instead, each pointing at the same installed
; exe with different arguments.

!macro customInstall
  CreateDirectory "$SMPROGRAMS\Plant HMI"

  CreateShortCut "$SMPROGRAMS\Plant HMI\Plant HMI Studio.lnk" \
    "$INSTDIR\Plant HMI.exe" "" "$INSTDIR\Plant HMI.exe" 0

  CreateShortCut "$SMPROGRAMS\Plant HMI\Plant HMI Runtime.lnk" \
    "$INSTDIR\Plant HMI.exe" "--runtime" "$INSTDIR\Plant HMI.exe" 0

  CreateShortCut "$SMPROGRAMS\Plant HMI\Plant HMI Kiosk.lnk" \
    "$INSTDIR\Plant HMI.exe" "--runtime --kiosk" "$INSTDIR\Plant HMI.exe" 0

  CreateShortCut "$DESKTOP\Plant HMI Studio.lnk" \
    "$INSTDIR\Plant HMI.exe" "" "$INSTDIR\Plant HMI.exe" 0

  CreateShortCut "$DESKTOP\Plant HMI Runtime.lnk" \
    "$INSTDIR\Plant HMI.exe" "--runtime" "$INSTDIR\Plant HMI.exe" 0
!macroend

!macro customUnInstall
  Delete "$SMPROGRAMS\Plant HMI\Plant HMI Studio.lnk"
  Delete "$SMPROGRAMS\Plant HMI\Plant HMI Runtime.lnk"
  Delete "$SMPROGRAMS\Plant HMI\Plant HMI Kiosk.lnk"
  RMDir "$SMPROGRAMS\Plant HMI"
  Delete "$DESKTOP\Plant HMI Studio.lnk"
  Delete "$DESKTOP\Plant HMI Runtime.lnk"
!macroend
