// Recommended icon icons/commodities/currency/coins-assorted-mix-copper-silver-gold.webp
// This macro allows you to add or remove money from an actor's sheet automatically handling money conversions.
const actor = ui.activeWindow?.actor;
if (!actor) {
  ui.notifications.error("No actor sheet in focus");
  return;
}

return launchTransactionFlow();

async function launchTransactionFlow(inputPromptValues = {}){
  const userInput = await promptForInput(inputPromptValues);
  if (!userInput) return;

  const { normalize: shouldNormalize, ...transactionCoinsStr } = userInput; 
  const transactionCoins = {
    pp: evalArithmetic(transactionCoinsStr.pp),
    gp: evalArithmetic(transactionCoinsStr.gp),
    sp: evalArithmetic(transactionCoinsStr.sp),
    cp: evalArithmetic(transactionCoinsStr.cp)
  }

  const newActorCoins = calculateTransaction(shouldNormalize, transactionCoins, actor.system.currency);
  if (!newActorCoins) {
    ui.notifications.error("Not enough money. Transaction would result in negative money!");
    return launchTransactionFlow(userInput);
  }

  const confirmed = await promptConfirmTransaction(newActorCoins);
  if (confirmed === null) {
    return actor.sheet.bringToTop();
  }
  if (!confirmed) {
    return launchTransactionFlow(userInput);
  }

  await actor.update({ system: { currency: newActorCoins } });
  return actor.sheet.bringToTop();
}

function promptForInput({ pp, gp, sp, cp, normalize } = {}) {
  return new Promise((resolve, reject) => {
  new Dialog({
    title: "Coin transaction",
    content: `
      <form>
          <div class="form-group">
            <label for="platinum"><span style="color:#e5e4e2;background: #1c1c1c;border-radius: 0.3em;padding: 0.2em;">Platinum</span>:</label>
            <input type="text" id="platinum" name="platinum" value="${pp ?? ""}">
            <button class="coin-calculator" style="max-width: 2em;" data-coin-type="platinum" title="Calculate expression in platinum input"><i class="fas fa-calculator"></i></button>
          </div>
          <div class="form-group">
            <label for="gold"><span style="color:goldenrod;background: #1c1c1c;border-radius: 0.3em;padding: 0.2em;">Gold</span>:</label>
            <input type="text" id="gold" name="gold" value="${gp ?? ""}">
            <button class="coin-calculator" style="max-width: 2em;" data-coin-type="gold" title="Calculate expression in gold input"><i class="fas fa-calculator"></i></button>
          </div>
          <div class="form-group">
            <label for="silver"><span style="color:silver;background: #1c1c1c;border-radius: 0.3em;padding: 0.2em;">Silver</span>:</label>
            <input type="text" id="silver" name="silver" value="${sp ?? ""}">
            <button class="coin-calculator" style="max-width: 2em;" data-coin-type="silver" title="Calculate expression in silver input"><i class="fas fa-calculator"></i></button>
          </div>
          <div class="form-group">
            <label for="copper"><span style="color:#b87333;background: #1c1c1c;border-radius: 0.3em;padding: 0.2em;">Copper</span>:</label>
            <input type="text" id="copper" name="copper" value="${cp ?? ""}">
            <button class="coin-calculator" style="max-width: 2em;" data-coin-type="copper" title="Calculate expression in copper input"><i class="fas fa-calculator"></i></button>
          </div>
          <div class="form-group">
              <label for="normalize">Normalize all of the actor's money?:</label>
              <input type="checkbox" id="normalize" name="normalize" ${ normalize ? "checked" : ""}>
          </div>
      </form>
  `,
    buttons: {
      ok: {
        label: "OK",
        callback: (html) => {

          const pp = html.find("#platinum").val();
          const gp = html.find("#gold").val();
          const sp = html.find("#silver").val();
          const cp = html.find("#copper").val();

          const normalize = html.find("#normalize").prop("checked");

          resolve({ pp, gp, sp, cp, normalize });
        }
      },
      cancel: {
        label: "Cancel",
        callback: () => {
          resolve(null);
        }
      }
    },
    render: (html) => {
      const coinCalculatorButtons = html.find(".coin-calculator");
      coinCalculatorButtons.on("click", function() {
        const coinType = $(this).data("coin-type");
        const coinInput = html.find(`#${coinType}`);
        const coinInputValue = coinInput.val();
        const newCoinInputValue = evalArithmetic(coinInputValue);
        const newCoinInputValueStr = newCoinInputValue === 0 ? "" : newCoinInputValue;
        coinInput.val(newCoinInputValueStr);
      });
    },
    close: () => resolve(null),
    default: "ok"
  }).render(true);
});
}

function calculateTransaction(shouldNormalize, transactionCoins, actorCoins) {
  const normalizedTransactionCoins = normalizeCoins(transactionCoins);

  if (shouldNormalize) {
    const coins = normalizeCoins(actorCoins);
    const newCoins = coins + normalizedTransactionCoins;
    return newCoins < 0 ? null : denormalizeCoins(newCoins);
  } else if (normalizedTransactionCoins < 0) {
    let carry, cp, sp, gp, pp;
  
    ({ carry, coin: cp } = carryCoin(actorCoins.cp + normalizedTransactionCoins));
    ({ carry, coin: sp } = carryCoin(actorCoins.sp - carry));
    ({ carry, coin: gp } = carryCoin(actorCoins.gp - carry));
    pp = actorCoins.pp - carry;
  
    return pp < 0 ? null : { cp, sp, gp, pp };
  } else {
    const expandedTransactionCoins = denormalizeCoins(normalizedTransactionCoins);
    const coins = actor.system.currency;
  
    return {
      cp: coins.cp + expandedTransactionCoins.cp,
      sp: coins.sp + expandedTransactionCoins.sp,
      gp: coins.gp + expandedTransactionCoins.gp,
      pp: coins.pp + expandedTransactionCoins.pp
    };
  }

}

function promptConfirmTransaction(newActorCoins) {
  return new Promise((resolve, reject) => {
    const diffCp = newActorCoins.cp - actor.system.currency.cp;
    const diffSp = newActorCoins.sp - actor.system.currency.sp;
    const diffGp = newActorCoins.gp - actor.system.currency.gp;
    const diffPp = newActorCoins.pp - actor.system.currency.pp;
    let message = `Your new balances will be:<br/>
      <span style="color:#e5e4e2;background: #1c1c1c;border-radius: 0.3em;padding: 0.1em;">PP</span>: ${newActorCoins.pp} (${diffPp === 0 ? '<span>+' : (diffPp >= 0 ? '<span style="color:green;">+' : '<span style="color:red;">')}${diffPp}</span>)<br/>
      <span style="color:goldenrod;background: #1c1c1c;border-radius: 0.3em;padding: 0.1em;">GP</span>: ${newActorCoins.gp} (${diffGp === 0 ? '<span>+' : (diffGp >= 0 ? '<span style="color:green;">+' : '<span style="color:red;">')}${diffGp}</span>)<br/>
      <span style="color:silver;background: #1c1c1c;border-radius: 0.3em;padding: 0.1em;">SP</span>: ${newActorCoins.sp} (${diffSp === 0 ? '<span>+' : (diffSp >= 0 ? '<span style="color:green;">+' : '<span style="color:red;">')}${diffSp}</span>)<br/>
      <span style="color:#b87333;background: #1c1c1c;border-radius: 0.3em;padding: 0.1em;">CP</span>: ${newActorCoins.cp} (${diffCp === 0 ? '<span>+' : (diffCp >= 0 ? '<span style="color:green;">+' : '<span style="color:red;">')}${diffCp}</span>)
    `;

    new Dialog({
      title: "Confirm Transaction",
      content: message,
      buttons: {
        ok: {
          icon: '<i class="fas fa-check"></i>',
          label: "Confirm",
          callback: () => {resolve(true);}
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Go back>>>",
          callback: () => {resolve(false);}
        }
      },
      close: () => resolve(null),
      default: "cancel"
    }).render(true);
  });
}

function carryCoin(coin) {
  if (coin >= 0) {
    return { carry: 0, coin };
  }

  const carry = Math.floor(coin / -10) + (coin % 10 !== 0 ? 1 : 0);
  const newCoin = carry * 10 + coin;

  return { carry, coin: newCoin };
}
// This function "normalizes" the coins by expressing their value in cp.
function normalizeCoins(coins) {
  return coins.pp * 1000 + coins.gp * 100 + coins.sp * 10 + coins.cp;
}

// This function "denormalizes" the coins by expressing their value in pp, gp, sp, and cp. This is done while prefering
// the highest value coins first. For example, 100 cp would be expressed as 1 gp, not 10 sp.
function denormalizeCoins(coins) {
  const cp = coins % 10;
  const sp = Math.floor(coins / 10) % 10;
  const gp = Math.floor(coins / 100) % 10;
  const pp = Math.floor(coins / 1000);

  return { pp, gp, sp, cp };
}

// From https://stackoverflow.com/a/2276173 
function evalArithmetic(s) {
  let total = 0;
  s = s.match(/[+\-]*(\.\d+|\d+(\.\d+)?)/g) || [];
      
  while (s.length) {
    total += parseInt(s.shift());
  }
  return total;
}

