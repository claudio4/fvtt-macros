// Recommended icon icons/magic/control/silhouette-grow-shrink-tan.webp
// This macro will change the size of the selected token's sheet and resize the token to match its new size.

const tokens = canvas.tokens.controlled;
if (tokens.length === 0) {
  ui.notifications.error("Please select a token");
}
const token = canvas.tokens.controlled[0]

const size = await new Promise((resolve) => {
  const dialog = new Dialog({
    title: "Select the desired size",
    buttons: {
      tiny: {
        label: "Tiny",
        callback: () => resolve({dim: {width: 0.5, height: 0.5}, size: "tiny"})
      },
      small: {
        label: "Small",
        callback: () => resolve({dim: {width: 1, height: 1}, size: "sm"})
      },
      medium: {
        label: "Medium",
        callback: () => resolve({dim: {width: 1, height: 1}, size: "med"})
      },
      long: {
        label: "Long",
        callback: () => resolve({dim: {width: 1, height: 2}, size: "lg"})
      },
      large: {
        label: "Large",
        callback: () => resolve({dim: {width: 2, height: 2}, size: "lg"})
      },
      huge: {
        label: "Huge",
        callback: () => resolve({dim: {width: 3, height: 3}, size: "huge"})
      },
      gargantuan: {
        label: "Gargantuan",
        callback: () => resolve({dim: {width: 4, height: 4}, size: "grg"})
      },
    },
    close: () => resolve(null)
  })
  dialog.render(true)
});

if (!size) {
  return;
}

token.actor.update({ "system.traits.size": size.size });
token.document.update(size.dim);
