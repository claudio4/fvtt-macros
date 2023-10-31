// Recommended icon icons/containers/bags/case-leather-tan.webp
// This macro sorts alphabetically the items (spells, features, inventory) of the actor whose sheet is in focus.

(() => {
  // Code from https://github.com/illandril/FoundryVTT-inventory-sorter
  const compareStringCaseInsensitive = (strA, strB) => strA.localeCompare(strB, undefined, { sensitivity: "base" });

  const compareItemToSort = (itemA, itemB) => {
    let compare = compareStringCaseInsensitive(itemA.group, itemB.group);
    if (compare === 0) {
      compare = compareStringCaseInsensitive(itemA.name, itemB.name);
    }
    return compare;
  };

  const getSpellSubtype = (system) => {
    const prepMode = system.preparation?.mode;
    let subtype;
    if (prepMode === "atwill" || prepMode === "innate" || prepMode === "pact") {
      subtype = prepMode;
    } else {
      subtype = `${system.level || 0}`;
    }
    return subtype;
  };

  const getFeatSubtype = (system) => {
    let subtype;
    if (!system.activation || !system.activation.type) {
      // Passive feats
      subtype = "passive";
    } else {
      // Active feats
      subtype = "active";
    }
    return subtype;
  };

  const extractSortInformation = (items) => {
    if (!items) {
      return [];
    }
    const unsortedItems = items.map((item) => {
      const type = item.type;
      const name = item.name;
      let subtype;
      if (type === "spell") {
        subtype = getSpellSubtype(item.system);
      } else if (type === "feat") {
        subtype = getFeatSubtype(item.system);
      }
      return {
        id: item.id,
        group: subtype ? `${type}_${subtype}` : type,
        name: name,
      };
    });

    return unsortedItems.sort(compareItemToSort);
  };

  const calculateItemSorts = (actor) => {
    const itemSorts = new Map();
    if (actor) {
      const sortedItems = extractSortInformation(actor.items);
      let nextSort = 0;
      let lastGroup = null;
      for (const item of sortedItems) {
        if (item.group !== lastGroup) {
          nextSort = 0;
          lastGroup = item.group;
        }
        nextSort++;

        const newSort = nextSort * foundry.CONST.SORT_INTEGER_DENSITY;
        itemSorts.set(item.id, { _id: item.id, sort: newSort });
      }
    }
    return itemSorts;
  };

  const sortActorItems = async (actor) => {
    const itemSorts = calculateItemSorts(actor);
    const itemUpdates = [];
    for (const itemSort of itemSorts.values()) {
      const item = actor.items.get(itemSort._id);
      if (item.sort !== itemSort.sort) {
        itemUpdates.push(itemSort);
      }
    }
    if (itemUpdates.length > 0) {
      try {
        await actor.updateEmbeddedDocuments("Item", itemUpdates, {
          illandrilInventorySorterUpdate: true,
        });
      } catch (error) {
        ui.notifications.error("Error sorting actor's items. Please check the console");
        console.error("Error sorting items for actor", actor, error);
      }
    }
  };

  if (!(ui.activeWindow instanceof ActorSheet)) {
    ui.notifications.error("Sort operation failed. No actor sheet in focus");
    return;
  }
  const actor = ui.activeWindow.actor;
  sortActorItems(actor).then(() => {
    ui.notifications.info(`Successfully sorted ${actor.name}'s inventory`);
  });
})();
