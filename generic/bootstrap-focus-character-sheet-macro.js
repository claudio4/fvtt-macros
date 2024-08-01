// Recommended icon: icons/sundries/documents/document-official-capital.webp
// This macro create other macros to quickly focus on a particular character sheet.
const actors = game.user.isGM ? game.actors : game.actors.filter(actor => actor.ownership[game.userId] === 3);

const actorId = await new Promise((resolve) => {
  new Dialog({
    title: "Choose an Actor",
    content: `
      <div>
        <h3>Select an actor:</h3>
        <select id="actor-select">
          ${actors.map(actor => `<option value="${actor.id}">${actor.name}</option>`).join('')}
        </select>
        <h3>OR enter an actor ID:</h3>
        <label for="actor-id">Actor ID:</label>
        <input type="text" name="actor-id" id="actor-id" placeholder="Leave this field empty if you prefer to use the field above" />
      </div>
    `,
    buttons: {
      Ok: {
        icon: '<i class="fas fa-check"></i>',
        label: "Ok",
        callback: async (html) => {
          const enteredActorId = html.find('#actor-id').val();
          const selectedActorId = html.find('#actor-select').val();
          resolve(enteredActorId || selectedActorId);
        }
      },
      Cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: "Cancel",
        callback: () => resolve(null)
      }
    },
    close: () => resolve(null),
    default: "Ok"
  }).render(true);
});

if (!actorId) {
  ui.notifications.warn("No actor selected. Aborting...");
  return;
}

const actor = game.actors.get(actorId);
if (!actor) {
  ui.notifications.error("Invalid actor ID provided.");
  return;
}

const prevMacro = game.macros.find(macro => (
  macro.flags?.["claudio4-macros"]?.["focus-macro-for=actor"] === actor.uuid
  && (macro.ownership[game.userId] >= 2 || macro.ownership.default >= 2)
  ));
if (prevMacro) {
  const dialogResult = await new Promise((resolve) => {
    new Dialog({
      title: "Macro already exists",
      content: `
        <div>
          <p>A macro for this actor already exists. What would you like to do?</p>
        </div>
      `,
      buttons: {
        NewMacro: {
          icon: '<i class="fas fa-plus"></i>',
          label: "Create new macro anyway",
          callback: () => resolve("new")
        },
        AddToMacroBar: {
          icon: '<i class="fas fa-plus-square"></i>',
          label: "Add the existing macro to the macro bar.",
          callback: () => resolve("add")
        },
        Cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancel the creation of the new macro",
          callback: () => resolve("cancel")
        }
      },
      close: () => resolve("cancel"),
      default: "AddToMacroBar"
    }).render(true);
  });

  if (dialogResult === "cancel") {
    return;
  }
  if (dialogResult === "add") {
    const slot = findEmptySlotInMacroBard(prevMacro.id);
    if (slot === null) {
      ui.notifications.warn(`The macro bar if full! Macro "${prevMacro.name}" can be found in the macro directory.`);
      return;
    }

    game.user.assignHotbarMacro(prevMacro, slot);
    const displaySlot = slot === 10 ? "0" : slot;
    ui.notifications.info(`Macro "${prevMacro.name}" can be found in slot ${displaySlot} of the macro bard.`);
    return;
  }
}

const macroName = `Focus ${actor.name + (actor.name.toLowerCase().endsWith('s') ? "'" : "'s")} Character Sheet`;
const macroTemplate = {
  name: macroName,
  flags: { "claudio4-macros": { "focus-macro-for=actor": actor.uuid } },
  scope: "global",
  img: "icons/sundries/documents/document-official-capital.webp",
  type: "script",
  command: `
const uuid = "${actor.uuid}"
const actor = await fromUuid(uuid);
if (!actor) {
  ui.notifications.warn(game.i18n.format("WARNING.ObjectDoesNotExist", {
    name: game.i18n.localize("Document"),
    identifier: uuid
    }));
}

const sheet = actor.sheet;

if (!sheet.rendered) {
  return sheet.render(true);
}

if (sheet._minimized) {
  sheet.maximize();
} else if (ui.activeWindow == sheet) {
  return sheet.close();
}

return sheet.bringToTop();`
};

try {
  const macro = await Macro.create(macroTemplate);
  const slot = findEmptySlotInMacroBard();
  if (slot === null) {
    ui.notifications.info(`Macro "${macroName}" created. It can be found in the macro directory.`);
    return;
  }

  game.user.assignHotbarMacro(macro, slot);
  const displaySlot = slot === 10 ? "0" : slot;
  ui.notifications.info(`Macro "${macroName}" created. It can be found in slot ${displaySlot} of the macro bard.`);
  return;
} catch (error) {
  ui.notifications.error("An error occurred while creating the macro.");
  throw error;
}

function findEmptySlotInMacroBard(macroToPlaceId) {
  for (let i = 1; i <= 10; i++) {
    const macroId = game.user.hotbar[i];
    if (!macroId) {
      return i;
    }

    if (macroToPlaceId && macroId === macroToPlaceId) {
      return i;
    }

    const macro = game.macros.get(macroId);
    if (!macro) {
      return i;
    }
  }

  return null;
}
