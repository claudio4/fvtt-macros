// Recommended icon icons/tools/hand/ruler-steel-grey.webp
// This macro toggles the visibility of the DM ruler for the rest of the players. This is useful as the ruler is shown
// by default to all players even when using it under the fog of war.

let settings = duplicate(game.settings.get("core", "permissions"));

let dmSettingPosition = settings.SHOW_RULER.indexOf(4);
let toggleMSg;

if (dmSettingPosition === -1) {
  toggleMSg = "Showing";
  settings.SHOW_RULER.push(4);
} else {
  toggleMSg = "Hiding";
  settings.SHOW_RULER.splice(dmSettingPosition, 1);
}
ui.notifications.info(toggleMSg + " the DM ruler");

game.settings.set("core", "permissions", settings);
