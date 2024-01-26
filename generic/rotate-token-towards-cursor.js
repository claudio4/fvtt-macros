// Recommended icon icons/svg/sun.svg
// This macro rotates the selected token towards the mouse cursor.
// It is done 45ª increments, if the "Y" key is pressed while rotating it will be done freely.
const mousePosition = game.canvas.app.stage.toLocal(game.canvas.app.renderer.plugins.interaction.pointer.global);
const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token first");

const angleRad = Math.atan2(mousePosition.y - token.center.y, mousePosition.x - token.center.x);
const angleDeg = angleRad * (180 / Math.PI);
// The token's rotation is 0 when facing down, while the mouse cursor is 0 when facing right. So we need to subtract 90.
let angle = angleDeg - 90;


// If the "Y" is not pressed while rotating, snap to 45 degree increments.Otherwise rotate freely.
// Ideally this would be the ctrl key to be consistent with how rotation works in Foundry, but the macrobar key shortcuts
// don't seem to work while ctrl is pressed down.
if (!game.keyboard.downKeys.has("KeyY")) {
  angle = Math.round(angle / 45) * 45;
}

return token.document.update({ "rotation": angle });
