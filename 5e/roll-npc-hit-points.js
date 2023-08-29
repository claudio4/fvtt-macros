// Recommended icon icons/magic/life/heart-glowing-red.webp
// This macro rolls the actors hp formula of each selected token and sets the token's hp to the result.
// If a token has no hp formula, it is silently ignored.

canvas.tokens.controlled.map(async (token) => {
  let actor = token.actor
  if (actor.type !== "npc") {
    return
  }

  let formula = token.actor?.system?.attributes?.hp?.formula
  if (!formula) {
    return
  }

  let roll = await (new Roll(formula).evaluate({ async: true }))
  roll.toMessage({ flavor: 'Rolling ' + token.name + ' max HP' })
  let hp = roll.total

  return actor.update({ "system.attributes.hp.value": hp, "system.attributes.hp.max": hp })
})
