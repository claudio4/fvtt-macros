// Recommended icon icons/magic/control/fear-fright-white.webp

if (canvas.tokens.controlled.length === 0) {
  ui.notifications.error("Please select a token");
  return;
}

const token = canvas.tokens.controlled[0];
new FilePicker({
  type: "image",
  current: token.document.texture.src,
  callback: (path) => {
      token.document.update({img: path})
  }
}).browse()
