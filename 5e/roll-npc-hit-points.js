// Recommended icon icons/magic/life/heart-glowing-red.webp
canvas.tokens.controlled.map(async (token) => {
  let actor = token.actor
  if (actor.data.type !== "npc") {
    return
  }

  let formula = token.actor?.data?.data?.attributes?.hp?.formula
  if (!formula) {
    return
  }

  let roll = await (new Roll(formula).evaluate({ async: true }))
  roll.toMessage({ flavor: 'Rolling ' + token.data.name + ' max HP' })
  let hp = roll.total

  return actor.update({ "data.attributes.hp.value": hp, "data.attributes.hp.max": hp })
})
