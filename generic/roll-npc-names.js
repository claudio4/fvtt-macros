// Recommended icon icons/sundries/misc/pet-collar-red.webp
// This macro prompts the user to select a roll table in the "Names" folder (this folder needs to be manually created)
// and then rolls on it for each selected token, setting the token's name to the result.

const tables = game.tables.folders.find(f => f.name === "Names");
if (!tables) {
    ui.notifications.error("Could not find the 'Names' folder in the Rollable Tables directory.");
    return;
}
if (tables.contents.length === 0) {
    ui.notifications.error("The 'Names' folder has no Rollable Tables in it.");
    return;
}

let table;
try  {
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
                }
            }
            },
            default: "ok",
            close: reject
        });
        d.render(true);
    });
} catch (e) {
    ui.notifications.console.warn("No table selected. Operation cancelled.");
    return;
}

if (!table) {
    ui.notifications.error("The selected table no longer exists.");
    return;
}

const updates = canvas.tokens.controlled.map(async (token) => {
    const name = (await table.roll()).results?.[0]?.text
    if (!name) {
        return {"_id": token.id}
    }

    return {"_id": token.id, name}
});

Promise.all(updates).then(updates => canvas.scene.updateEmbeddedDocuments('Token', updates)).catch(e => {
    ui.notifications.error("Something went wrong while updating the tokens' names.");
    console.error(e);
});
