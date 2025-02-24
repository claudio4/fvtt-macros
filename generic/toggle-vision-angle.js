// Toggle the token vision angle between 360 degrees and 300 degrees. Recommended icon icons/magic/perception/orb-eye-scrying.webp
if (!canvas.tokens.controlled.length) {
  ui.notifications.warn("Please select at least one token.");
  return;
}

canvas.tokens.controlled.forEach((token) => {
  const currentAngle = token.document.sight.angle;
  const newAngle = currentAngle === 300 ? 360 : 300;
  token.document.update({ "sight.angle": newAngle });
});

ui.notifications.info("Toggled vision angle for selected token(s).");
