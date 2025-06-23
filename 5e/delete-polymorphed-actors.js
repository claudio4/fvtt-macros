// Recommended icon icons/magic/death/skeleton-dinosaur-skull-tan.webp
/**
 * This macro empowers you to clean up your game by deleting all polymorphed versions of an actor you own.
 *
 * Important Note: For this macro to function correctly, your Game Master (GM) must import the
 * "Delete polymorphed actors (gm helper)" macro from the compendium into their macro directory.
 *
 * ⚠️ WARNING: Irreversible Action ⚠️
 * This macro will permanently delete any actor in your world with a name matching the pattern
 * "Original Actor Name (any text)". This action cannot be undone.
 */

let actor;

if (canvas.tokens.controlled.length > 0) {
  actor = canvas.tokens.controlled[0].actor;
} else if (ui.activeWindow instanceof ActorSheet) {
  actor = ui.activeWindow?.actor;
} else {
  actor = game.user.character;
}

if (!actor) {
  ui.notifications.error("No actor selected");
  return;
}

const helperMacro = game.macros.getName("Delete polymorphed actors (gm helper)");

if (!helperMacro) {
  ui.notifications.error("Helper macro not found! Make sure your GM has taken it out of the compemdium");
  return;
}

Dialog.confirm({
  title: "Delete Actors",
  content: `Are you sure you want to delete polymorphed actors of ${actor.name}?`,
  yes: async () => {
    try {
      const { error, deletedActorsLength } = await helperMacro.execute({
        actorId: actor.id,
        userId: game.user.id,
      });
      if (error) {
        ui.notifications.error(error);
        return;
      }
      ui.notifications.info(`Deleted ${deletedActorsLength} actors`);
    } catch (error) {
      ui.notifications.error("Failed to execute helper macro");
      throw error;
    }
  },
  no: () => {},
});
