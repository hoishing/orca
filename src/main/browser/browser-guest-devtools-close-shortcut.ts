import { keybindingMatchesAction, type KeybindingOverrides } from '../../shared/keybindings'

const installedDevTools = new WeakSet<Electron.WebContents>()

// Why: the app menu has no close role (main-window Cmd/Ctrl+W closes Orca tabs), so a detached
// guest DevTools window has nothing handling the close chord unless its webContents claims it.
export function installGuestDevToolsCloseShortcut(
  guest: Electron.WebContents,
  getKeybindings: () => KeybindingOverrides | undefined
): void {
  const install = (): void => {
    const devTools = guest.devToolsWebContents
    if (!devTools || devTools.isDestroyed() || installedDevTools.has(devTools)) {
      return
    }
    installedDevTools.add(devTools)
    // Listener dies with the DevTools webContents, which is destroyed on close.
    devTools.on('before-input-event', (event, input) => {
      if (input.type !== 'keyDown' || input.isAutoRepeat) {
        return
      }
      if (!keybindingMatchesAction('tab.close', input, process.platform, getKeybindings())) {
        return
      }
      event.preventDefault()
      if (!guest.isDestroyed()) {
        guest.closeDevTools()
      }
    })
  }
  if (guest.isDevToolsOpened()) {
    install()
    return
  }
  guest.once('devtools-opened', install)
}
