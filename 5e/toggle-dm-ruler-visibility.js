// Recommended icon icons/tools/hand/ruler-steel-grey.webp

let settings = duplicate(game.settings.get("core", "permissions"));

let dmSettingPosition = settings.SHOW_RULER.indexOf(4)
let toggleMSg

if (dmSettingPosition === -1) {
  toggleMSg = "Showing"
  settings.SHOW_RULER.push(4)
} else {
  toggleMSg = "Hiding"
  settings.SHOW_RULER.splice(dmSettingPosition, 1)
}
ui.notifications.info(toggleMSg + " the DM ruler")

game.settings.set("core", "permissions", settings);
