// Recommended icon icons/commodities/tech/cog-large-steel-white.webp
//! { "flags": { "advanced-macros": { "runForSpecificUser": "GM" } } }
/**
 * This macro is a necessary component for the "Delete polymorphed actors" macro to function correctly.
 *
 * It must be imported by the Game Master (GM) ONLY.
 *
 * For security and proper functionality, the GM must be the sole user with owner permissions over this macro.
 * If other users have ownership permissions, the "Delete polymorphed actors" macro will not work as intended.
 */

if (game.user.role !== CONST.USER_ROLES.GAMEMASTER && game.user.role !== CONST.USER_ROLES.ASSISTANT) {
  const errMsg =
    'The "Delete polymorphed actors (gm helper)" macro should be executed as GM. Ensure that the GM is the only owner.';
  ui.notifications.error(errMsg);
  return { error: errMsg };
}

const { actorId, userId: userId } = scope;

const isGM = game.users.get(userId).isTheGM;
const actor = game.actors.get(actorId);
if (!actor) {
  return;
}

if (!isGM && actor.ownership.default < 3 && actor.ownership[userId] < 3) {
  return { error: "User lacks permission to delete Actor" };
}

const trimmedName = actor.name.trim();
const polymorphedActorPattern = / \([^)]+\)/;

const actorsToDelete = game.actors.filter(
  (actor) =>
    actor.name.startsWith(trimmedName) &&
    polymorphedActorPattern.test(actor.name.substring(trimmedName)) &&
    (isGM || actor.ownership.default > 2 || actor.ownership[userId] > 2),
);

await Actor.deleteDocuments(actorsToDelete.map((actor) => actor.id));
return { deletedActorsLength: actorsToDelete.length };
