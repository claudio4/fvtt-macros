// Recommended icon icons/sundries/misc/pet-collar-red.webp
// This macro prompts the user to select a roll table in the "Names" folder (this folder needs to be manually created) or from the modules included tables
// and then rolls on it for each selected token, setting the token's name to the result.

const tables = game.tables.folders.find((f) => f.name === "Names");
const packTables = game.packs.get("claudio4-macros.cl4-name-tables")?.index;
if (!tables) {
  if (!packTables) {
    ui.notifications.error("Could not find the 'Names' folder in the Rollable Tables directory.");
    return;
  }
  ui.notifications.info("No custom name tables have been found. You can add your creating a 'Names' folder in the Rollable Tables directory.");
}

if ((!tables || tables.contents.length === 0) && !packTables) {
  ui.notifications.error("If the companion module is not enabled, you need to add Rollable Tables to the 'Names' folder.");
  return;
}

let table;
try {
  table = await new Promise((resolve, reject) => {
    let submitted = false;
    let content = `<form>
            <div class="form-group">
                <label>Select a table:</label>
                <select id="table-select" name="table-select">`;
    if (tables && tables.contents.length !== 0) {
      content += '<optgroup label="World Name Tables">'
      for (const table of tables.contents) {
        content += `<option value="${table.uuid}">${table.name}</option>`;
      }
      content += '</optgroup>'
    }
    if (packTables) {
      content += '<optgroup label="Module Name Tables">'
      for (const table of packTables.filter(({ folder }) => !folder)) {
        content += `<option value="${table.uuid}">${table.name}</option>`;
      }
      content += '</optgroup>'
      content += '<optgroup label="Module Variant Name Tables">'
      for (const table of packTables.filter(({ folder }) => folder)) {
        content += `<option value="${table.uuid}">${table.name}</option>`;
      }
      content += '</optgroup>'
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
            submitted = true;
            const tableUuid = html.find("#table-select").val();
            fromUuid(tableUuid).then(resolve).catch(reject);
          },
        },
      },
      default: "ok",
      close: () => { if (!submitted) reject(); },
    });
    d.render(true);
  });
} catch (e) {
  if (e instanceof Error) {
    ui.notifications.error("There was an error with the table selection. Check the console for details.");
    console.error(e);
  } else {
    ui.notifications.warn("No table selected. Operation cancelled.");
  }
  return;
}

if (!table) {
  ui.notifications.error("The selected table no longer exists.");
  return;
}

const usedNames = new Set();
const updates = canvas.tokens.controlled.map(async (token) => {
  let name;
  for (; ;) {
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
