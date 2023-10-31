// Recommended icon icons/sundries/misc/pet-collar-red.webp
// This macro prompts the user to select a roll table in the "Names" folder (this folder needs to be manually created)
// and then rolls on it for each selected token, setting the token's name to the result.

const tables = game.tables.folders.find((f) => f.name === "Names");
if (!tables) {
  ui.notifications.error("Could not find the 'Names' folder in the Rollable Tables directory.");
  return;
}
if (tables.contents.length === 0) {
  ui.notifications.error("The 'Names' folder has no Rollable Tables in it.");
  return;
}

let table;
try {
  table = await new Promise((resolve, reject) => {
    let content = `<form>
            <div class="form-group">
                <label>Select a table:</label>
                <select id="table-select" name="table-select">`;
    for (const table of tables.contents) {
      content += `<option value="${table.id}">${table.name}</option>`;
    }
    content += "</select></div></form>";
    const d = new Dialog({
      title: "Select a table",
      content: content,
      buttons: {
        ok: {
          icon: '<i class="fas fa-check"></i>',
          label: "Confirm",
          callback: (html) => {
            const table = game.tables.get(html.find("#table-select").val());
            resolve(table);
          },
        },
      },
      default: "ok",
      close: reject,
    });
    d.render(true);
  });
} catch (e) {
  ui.notifications.warn("No table selected. Operation cancelled.");
  return;
}

if (!table) {
  ui.notifications.error("The selected table no longer exists.");
  return;
}

const usedNames = new Set();
const updates = canvas.tokens.controlled.map(async (token) => {
  let name;
  for (;;) {
    name = (await table.roll()).results?.[0]?.text;
    if (!name) {
      return { _id: token.id };
    }

    // ideally the no-replacement rolltable feature should be use instead of manually checking for duplicates, but that
    // would require for the rolls to be made in sequence.
    if (usedNames.has(name)) {
      if (usedNames.size < table.results.size) {
        // if the name is already in use but there are some free, we try again in hopes of getting a new name.
        continue;
      }

      usedNames.clear();
      ui.notifications.warn("All names in the table have been used. Some token will have the same.");
    }

    usedNames.add(name);
    break;
  }
  return { _id: token.id, name };
});

Promise.all(updates)
  .then((updates) => canvas.scene.updateEmbeddedDocuments("Token", updates))
  .catch((e) => {
    ui.notifications.error("Something went wrong while updating the tokens' names.");
    console.error(e);
  });
