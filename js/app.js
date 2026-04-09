document.addEventListener('DOMContentLoaded', function () {
  const { menus, toppings, drinks, defaultComboStats, storageKey } = window.KioskData;
  const {
    calculateSelectionSubtotal,
    createCartItem,
    removeCartItem,
    calculateCartSummary,
    getTopCombos,
    recordCompletedOrder,
    loadComboStats
  } = window.KioskCore;

  const state = {
    selectedMenuId: menus[0].id,
    selectedToppingNames: [],
    selectedDrinks: [],
    selectedQuantity: 1,
    cartItems: [],
    comboStats: loadStoredComboStats(),
    latestCompletionSummary: null
  };

  const elements = {
    menuGrid: document.getElementById('menu-grid'),
    selectedMenuMedia: document.getElementById('selected-menu-media'),
    selectedMenuTitle: document.getElementById('selected-menu-title'),
    selectedMenuCopy: document.getElementById('selected-menu-copy'),
    selectedMenuPrice: document.getElementById('selected-menu-price'),
    recommendationList: document.getElementById('recommendation-list'),
    toppingList: document.getElementById('topping-list'),
    drinkList: document.getElementById('drink-list'),
    selectedQuantity: document.getElementById('selected-quantity'),
    currentSubtotal: document.getElementById('current-subtotal'),
    addToCartButton: document.getElementById('add-to-cart-button'),
    cartList: document.getElementById('cart-list'),
    orderTotal: document.getElementById('order-total'),
    clearCartButton: document.getElementById('clear-cart-button'),
    completeOrderButton: document.getElementById('complete-order-button'),
    completionPanel: document.getElementById('completion-panel'),
    decreaseQuantityButton: document.getElementById('decrease-quantity-button'),
    increaseQuantityButton: document.getElementById('increase-quantity-button')
  };

  function loadStoredComboStats() {
    try {
      return loadComboStats(window.localStorage.getItem(storageKey), defaultComboStats);
    } catch (error) {
      return loadComboStats(null, defaultComboStats);
    }
  }

  function saveComboStats() {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(state.comboStats));
    } catch (error) {
      // Keep the kiosk usable even if localStorage is unavailable.
    }
  }

  function getSelectedMenu() {
    return menus.find((menu) => menu.id === state.selectedMenuId) || menus[0];
  }

  function buildSelection() {
    return {
      menuId: state.selectedMenuId,
      quantity: state.selectedQuantity,
      toppingNames: [...state.selectedToppingNames],
      drinks: state.selectedDrinks.map((line) => ({ ...line }))
    };
  }

  function formatCurrency(value) {
    return `${value.toLocaleString('ko-KR')}원`;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getDrinkName(drinkId) {
    const drink = drinks.find((item) => item.id === drinkId);
    return drink ? drink.name : drinkId;
  }

  function resetSelectionForMenu(menuId) {
    state.selectedMenuId = menuId;
    state.selectedToppingNames = [];
    state.selectedDrinks = [];
    state.selectedQuantity = 1;
  }

  function buildPhotoMarkup(menu) {
    return `
      <div class="menu-card__media">
        <img class="menu-card__image" src="${menu.imagePath}" alt="${menu.imageAlt}" loading="lazy">
        <span class="menu-card__shine"></span>
        <span class="photo-fallback" hidden>${escapeHtml(menu.name)} 이미지 준비 중</span>
      </div>
    `;
  }

  function renderMenuGrid() {
    elements.menuGrid.innerHTML = menus.map((menu) => `
      <article class="menu-card ${menu.id === state.selectedMenuId ? 'is-active' : ''}">
        <button class="menu-card__button" type="button" data-menu-id="${menu.id}">
          ${buildPhotoMarkup(menu)}
          <div class="menu-card__body">
            <p class="menu-card__badge">${escapeHtml(menu.badge)}</p>
            <h3>${escapeHtml(menu.name)}</h3>
            <p>${escapeHtml(menu.subtitle)}</p>
            <strong class="menu-card__price">${formatCurrency(menu.price)}</strong>
          </div>
        </button>
      </article>
    `).join('');
  }

  function renderSelectedMenu() {
    const menu = getSelectedMenu();
    const subtotal = calculateSelectionSubtotal(buildSelection(), { menus, toppings, drinks });

    elements.selectedMenuMedia.innerHTML = buildPhotoMarkup(menu);
    elements.selectedMenuTitle.textContent = menu.name;
    elements.selectedMenuCopy.textContent = menu.subtitle;
    elements.selectedMenuPrice.textContent = formatCurrency(menu.price);
    elements.selectedQuantity.textContent = String(state.selectedQuantity);
    elements.currentSubtotal.textContent = formatCurrency(subtotal);
  }

  function renderRecommendations() {
    const combos = getTopCombos(state.selectedMenuId, state.comboStats, 3);

    elements.recommendationList.innerHTML = combos.length
      ? combos.map((combo, index) => `
          <button class="recommendation-card" type="button" data-combo-key="${combo.comboKey}">
            <strong>${index === 0 ? '지금 가장 많이 담는 조합' : `추천 조합 ${index + 1}`}</strong>
            <div>${escapeHtml(combo.toppingNames.join(' + '))}</div>
            <span>실시간 점수 ${combo.score}</span>
          </button>
        `).join('')
      : '<p class="empty-state">가장 먼저 인기 조합을 만들어보세요.</p>';
  }

  function renderToppings() {
    elements.toppingList.innerHTML = toppings.map((topping) => `
      <button class="chip-button ${state.selectedToppingNames.includes(topping.name) ? 'is-active' : ''}" type="button" data-topping-name="${escapeHtml(topping.name)}">
        ${escapeHtml(topping.name)} +${topping.price.toLocaleString('ko-KR')}
      </button>
    `).join('');
  }

  function renderDrinks() {
    elements.drinkList.innerHTML = drinks.map((drink) => {
      const current = state.selectedDrinks.find((line) => line.id === drink.id);
      const quantity = current ? current.quantity : 0;

      return `
        <div class="drink-row">
          <div>
            <strong>${escapeHtml(drink.name)}</strong>
            <p>${formatCurrency(drink.price)}</p>
          </div>
          <div class="drink-stepper">
            <button type="button" data-drink-id="${drink.id}" data-delta="-1" aria-label="${escapeHtml(drink.name)} 감소">-</button>
            <strong>${quantity}</strong>
            <button type="button" data-drink-id="${drink.id}" data-delta="1" aria-label="${escapeHtml(drink.name)} 증가">+</button>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderCart() {
    if (state.cartItems.length === 0) {
      elements.cartList.innerHTML = '<p class="empty-state">장바구니가 비어 있습니다. 메뉴를 담아보세요.</p>';
      elements.orderTotal.textContent = formatCurrency(0);
      elements.clearCartButton.disabled = true;
      elements.completeOrderButton.disabled = true;
      return;
    }

    const summary = calculateCartSummary(state.cartItems);

    elements.cartList.innerHTML = state.cartItems.map((item) => {
      const toppingsText = item.toppingNames.length ? item.toppingNames.join(', ') : '기본 구성';
      const drinksText = item.drinks.length
        ? item.drinks.map((drinkLine) => `${getDrinkName(drinkLine.id)} x${drinkLine.quantity}`).join(', ')
        : '음료 없음';

      return `
        <article class="cart-item">
          <div class="cart-item__top">
            <div class="cart-item__meta">
              <h3>${escapeHtml(item.menuName)} x${item.quantity}</h3>
              <p>${escapeHtml(toppingsText)}</p>
              <p>${escapeHtml(drinksText)}</p>
            </div>
            <button class="cart-item__remove" type="button" data-remove-cart-id="${item.lineId}">삭제</button>
          </div>
          <strong class="cart-item__price">${formatCurrency(item.lineTotal)}</strong>
        </article>
      `;
    }).join('');

    elements.orderTotal.textContent = formatCurrency(summary.totalAmount);
    elements.clearCartButton.disabled = false;
    elements.completeOrderButton.disabled = false;
  }

  function renderCompletionPanel() {
    if (!state.latestCompletionSummary) {
      elements.completionPanel.hidden = true;
      elements.completionPanel.innerHTML = '';
      return;
    }

    const { summary, items } = state.latestCompletionSummary;
    elements.completionPanel.innerHTML = `
      <h2>주문이 완료되었습니다</h2>
      <p>${summary.lineCount}개 메뉴 라인, 총 ${summary.totalQuantity}개, ${formatCurrency(summary.totalAmount)}</p>
      <ul>
        ${items.map((item) => `<li>${escapeHtml(item.menuName)} x${item.quantity} - ${formatCurrency(item.lineTotal)}</li>`).join('')}
      </ul>
      <button id="reset-order-button" class="primary-button" type="button">새 주문 시작</button>
    `;
    elements.completionPanel.hidden = false;
  }

  function syncPhotoFallbacks() {
    document.querySelectorAll('.menu-card__image').forEach((image) => {
      image.onerror = function () {
        this.hidden = true;
        const fallback = this.parentElement.querySelector('.photo-fallback');
        if (fallback) {
          fallback.hidden = false;
        }
      };
    });
  }

  function rerender() {
    renderMenuGrid();
    renderSelectedMenu();
    renderRecommendations();
    renderToppings();
    renderDrinks();
    renderCart();
    renderCompletionPanel();
    syncPhotoFallbacks();
  }

  function setSelectedMenu(menuId) {
    resetSelectionForMenu(menuId);
    rerender();
  }

  function toggleTopping(toppingName) {
    state.selectedToppingNames = state.selectedToppingNames.includes(toppingName)
      ? state.selectedToppingNames.filter((name) => name !== toppingName)
      : [...state.selectedToppingNames, toppingName];
    rerender();
  }

  function updateDrink(drinkId, delta) {
    const next = state.selectedDrinks.map((line) => ({ ...line }));
    const current = next.find((line) => line.id === drinkId);

    if (!current && delta > 0) {
      next.push({ id: drinkId, quantity: 1 });
    } else if (current) {
      current.quantity += delta;
    }

    state.selectedDrinks = next.filter((line) => line.quantity > 0);
    rerender();
  }

  function updateQuantity(delta) {
    state.selectedQuantity = Math.max(1, state.selectedQuantity + delta);
    rerender();
  }

  function addCurrentSelectionToCart() {
    const item = createCartItem(buildSelection(), { menus, toppings, drinks });
    state.cartItems = [...state.cartItems, item];
    state.latestCompletionSummary = null;
    rerender();
  }

  function removeLine(lineId) {
    state.cartItems = removeCartItem(state.cartItems, lineId);
    rerender();
  }

  function clearCart() {
    state.cartItems = [];
    rerender();
  }

  function completeOrder() {
    if (state.cartItems.length === 0) {
      return;
    }

    state.comboStats = recordCompletedOrder(state.comboStats, state.cartItems);
    saveComboStats();
    state.latestCompletionSummary = {
      summary: calculateCartSummary(state.cartItems),
      items: state.cartItems.map((item) => ({ ...item }))
    };
    state.cartItems = [];
    rerender();
  }

  document.body.addEventListener('click', function (event) {
    const menuButton = event.target.closest('[data-menu-id]');
    if (menuButton) {
      setSelectedMenu(menuButton.dataset.menuId);
      return;
    }

    const toppingButton = event.target.closest('[data-topping-name]');
    if (toppingButton) {
      toggleTopping(toppingButton.dataset.toppingName);
      return;
    }

    const recommendationButton = event.target.closest('[data-combo-key]');
    if (recommendationButton) {
      state.selectedToppingNames = recommendationButton.dataset.comboKey
        ? recommendationButton.dataset.comboKey.split('|')
        : [];
      rerender();
      return;
    }

    const drinkButton = event.target.closest('[data-drink-id]');
    if (drinkButton) {
      updateDrink(drinkButton.dataset.drinkId, Number(drinkButton.dataset.delta));
      return;
    }

    const removeButton = event.target.closest('[data-remove-cart-id]');
    if (removeButton) {
      removeLine(removeButton.dataset.removeCartId);
      return;
    }

    if (event.target.id === 'reset-order-button') {
      state.latestCompletionSummary = null;
      resetSelectionForMenu(menus[0].id);
      rerender();
    }
  });

  elements.decreaseQuantityButton.addEventListener('click', function () {
    updateQuantity(-1);
  });

  elements.increaseQuantityButton.addEventListener('click', function () {
    updateQuantity(1);
  });

  elements.addToCartButton.addEventListener('click', addCurrentSelectionToCart);
  elements.clearCartButton.addEventListener('click', clearCart);
  elements.completeOrderButton.addEventListener('click', completeOrder);

  rerender();
});
