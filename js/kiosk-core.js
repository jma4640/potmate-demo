(function (global) {
  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function findById(items, id) {
    return items.find((item) => item.id === id);
  }

  function serializeComboKey(toppingNames) {
    return [...toppingNames].sort((left, right) => left.localeCompare(right, 'ko')).join('|');
  }

  function calculateSelectionSubtotal(selection, catalogs) {
    const menu = findById(catalogs.menus, selection.menuId);

    if (!menu) {
      return 0;
    }

    const toppingTotal = (selection.toppingNames || []).reduce((sum, toppingName) => {
      const topping = catalogs.toppings.find((item) => item.name === toppingName);
      return sum + (topping ? topping.price : 0);
    }, 0);

    const drinkTotal = (selection.drinks || []).reduce((sum, drinkLine) => {
      const drink = findById(catalogs.drinks, drinkLine.id);
      return sum + (drink ? drink.price * drinkLine.quantity : 0);
    }, 0);

    return (menu.price + toppingTotal) * selection.quantity + drinkTotal;
  }

  function createCartItem(selection, catalogs, createId) {
    const menu = findById(catalogs.menus, selection.menuId);
    const lineId = createId ? createId() : `line-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

    return {
      lineId,
      menuId: selection.menuId,
      menuName: menu ? menu.name : '',
      menuImagePath: menu ? menu.imagePath : '',
      quantity: selection.quantity,
      toppingNames: [...(selection.toppingNames || [])],
      drinks: [...(selection.drinks || [])],
      lineTotal: calculateSelectionSubtotal(selection, catalogs)
    };
  }

  function removeCartItem(cartItems, lineId) {
    return cartItems.filter((item) => item.lineId !== lineId);
  }

  function calculateCartSummary(cartItems) {
    return cartItems.reduce(
      (summary, item) => {
        summary.lineCount += 1;
        summary.totalQuantity += item.quantity;
        summary.totalAmount += item.lineTotal;
        return summary;
      },
      {
        lineCount: 0,
        totalQuantity: 0,
        totalAmount: 0
      }
    );
  }

  function getTopCombos(menuId, comboStats, limit) {
    return Object.entries(comboStats[menuId] || {})
      .map(([comboKey, score]) => ({
        comboKey,
        toppingNames: comboKey ? comboKey.split('|') : [],
        score
      }))
      .sort((left, right) => right.score - left.score)
      .slice(0, limit);
  }

  function recordCompletedOrder(comboStats, cartItems) {
    const next = clone(comboStats);

    cartItems.forEach((item) => {
      const comboKey = serializeComboKey(item.toppingNames || []);

      if (!next[item.menuId]) {
        next[item.menuId] = {};
      }

      next[item.menuId][comboKey] = (next[item.menuId][comboKey] || 0) + item.quantity;
    });

    return next;
  }

  function loadComboStats(storedValue, defaults) {
    try {
      if (!storedValue) {
        return clone(defaults);
      }

      const parsed = JSON.parse(storedValue);
      return typeof parsed === 'object' && parsed !== null ? parsed : clone(defaults);
    } catch (error) {
      return clone(defaults);
    }
  }

  const api = {
    serializeComboKey,
    calculateSelectionSubtotal,
    createCartItem,
    removeCartItem,
    calculateCartSummary,
    getTopCombos,
    recordCompletedOrder,
    loadComboStats
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  global.KioskCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
