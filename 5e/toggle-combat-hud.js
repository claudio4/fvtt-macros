// Requires Argon - Combat HUD. Recommended icon icons/weapons/swords/swords-short.webp
const tool = ui
  .controls
  .controls
  .find(c => c.name === "token")
  .tools
  .find(t => t.name === "echtoggle");

tool.active = !tool.active;
tool.onClick(tool.active);
