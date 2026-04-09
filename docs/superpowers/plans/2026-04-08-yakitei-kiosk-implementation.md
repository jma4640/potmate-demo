# Yakitei Kiosk Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current study planner page with a photorealistic, soft-3D `야끼테이 (やきてい)` kiosk that uses real yakisoba photos, menu-specific live topping recommendations, a multi-line cart, and an order completion flow.

**Architecture:** Keep the project as static `HTML/CSS/JS`, but split the work so that product catalogs live in `js/kiosk-data.js`, all pricing/cart/recommendation/storage helpers live in pure functions inside `js/kiosk-core.js`, and `js/app.js` only handles DOM rendering, events, and persistence. Save real food photos locally under `assets/images/menu/`, stop loading the old study-planner script from `index.html`, and use Node's built-in test runner to cover the pure logic plus HTML/CSS smoke contracts.

**Tech Stack:** HTML5, CSS3, vanilla JavaScript, Node 24 built-in test runner (`node --test`), PowerShell for local asset downloads, local image assets, browser `localStorage`.

---

## File Structure

- Create: `assets/images/menu/base-yakisoba.jpg`
- Create: `assets/images/menu/shio-yakisoba.jpg`
- Create: `docs/superpowers/references/yakitei-photo-sources.md`
- Create: `js/kiosk-data.js`
- Create: `js/kiosk-core.js`
- Create: `tests/kiosk-core.test.js`
- Create: `tests/index-shell.test.js`
- Create: `tests/style-smoke.test.js`
- Modify: `index.html`
- Modify: `css/style.css`
- Modify: `js/app.js`
- Stop loading: `js/planner.js` from `index.html` (leave the file on disk unless cleanup is explicitly requested later)

**Workspace note:** This folder is currently not a Git repository. Use the commit commands exactly as written once the work lives inside a repo. If `git status` still prints `fatal: not a git repository`, skip that step and keep moving instead of initializing Git as part of this feature task.

### Task 1: Download Real Food Photos And Record Their Sources

**Files:**
- Create: `assets/images/menu/base-yakisoba.jpg`
- Create: `assets/images/menu/shio-yakisoba.jpg`
- Create: `docs/superpowers/references/yakitei-photo-sources.md`

- [ ] **Step 1: Create the asset folders and download the teriyaki-style yakisoba photo**

Run:

```powershell
New-Item -ItemType Directory -Force -Path 'assets\images\menu' | Out-Null
New-Item -ItemType Directory -Force -Path 'docs\superpowers\references' | Out-Null
Invoke-WebRequest -Uri 'https://images.pexels.com/photos/19264289/pexels-photo-19264289.jpeg?cs=srgb&dl=pexels-kawerodriguess-19264289.jpg&fm=jpg&w=1400' -OutFile 'assets\images\menu\base-yakisoba.jpg'
```

Expected: `assets/images/menu/base-yakisoba.jpg` exists and opens as a real yakisoba photo.

- [ ] **Step 2: Download the shio-style yakisoba photo**

Run:

```powershell
Invoke-WebRequest -Uri 'https://images.pexels.com/photos/19264271/pexels-photo-19264271.jpeg?cs=srgb&dl=pexels-kawerodriguess-19264271.jpg&fm=jpg&w=1400' -OutFile 'assets\images\menu\shio-yakisoba.jpg'
```

Expected: `assets/images/menu/shio-yakisoba.jpg` exists and opens as a second real yakisoba photo.

- [ ] **Step 3: Record the source pages and license note so the assets stay traceable**

Write `docs/superpowers/references/yakitei-photo-sources.md` with this content:

```md
# Yakitei Photo Sources

- `assets/images/menu/base-yakisoba.jpg`
  - Source page: https://www.pexels.com/photo/a-bowl-with-the-yakisoba-dish-standing-on-pink-background-19264289/
  - Photographer: Kawe Rodrigues
  - Download URL: https://images.pexels.com/photos/19264289/pexels-photo-19264289.jpeg?cs=srgb&dl=pexels-kawerodriguess-19264289.jpg&fm=jpg&w=1400
  - Usage note: Pexels license, stored locally for kiosk rendering stability

- `assets/images/menu/shio-yakisoba.jpg`
  - Source page: https://www.pexels.com/photo/close-up-top-view-of-a-bowl-with-yakisoba-dish-19264271/
  - Photographer: Kawe Rodrigues
  - Download URL: https://images.pexels.com/photos/19264271/pexels-photo-19264271.jpeg?cs=srgb&dl=pexels-kawerodriguess-19264271.jpg&fm=jpg&w=1400
  - Usage note: Pexels license, stored locally for kiosk rendering stability
```

- [ ] **Step 4: Verify that the downloaded files and source note are present**

Run:

```powershell
Get-Item -LiteralPath 'assets\images\menu\base-yakisoba.jpg','assets\images\menu\shio-yakisoba.jpg','docs\superpowers\references\yakitei-photo-sources.md' | Select-Object FullName,Length | Format-Table -AutoSize
```

Expected: all three paths print with non-zero lengths.

- [ ] **Step 5: Commit**

```bash
git add assets/images/menu/base-yakisoba.jpg assets/images/menu/shio-yakisoba.jpg docs/superpowers/references/yakitei-photo-sources.md
git commit -m "feat: add yakitei menu photo assets"
```

Expected: commit succeeds if the workspace is inside a Git repo. If it still says `fatal: not a git repository`, skip this step and note that the workspace is unversioned.
### Task 2: Build Product Catalogs And Pure Kiosk Logic Under Test

**Files:**
- Create: `js/kiosk-data.js`
- Create: `js/kiosk-core.js`
- Create: `tests/kiosk-core.test.js`

- [ ] **Step 1: Create the test directory and write the failing Node tests for money, cart, and recommendation behavior**

Run:

```powershell
New-Item -ItemType Directory -Force -Path 'tests' | Out-Null
```

Then create `tests/kiosk-core.test.js` with this content:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  serializeComboKey,
  calculateSelectionSubtotal,
  createCartItem,
  removeCartItem,
  calculateCartSummary,
  getTopCombos,
  recordCompletedOrder,
  loadComboStats
} = require('../js/kiosk-core.js');

const catalogs = {
  menus: [
    { id: 'teriyaki', name: '기본 야끼소바', price: 11000 },
    { id: 'shio', name: '소금 야끼소바', price: 11000 }
  ],
  toppings: [
    { id: 'squid-shrimp', name: '오징어새우', price: 1500 },
    { id: 'vienna', name: '비엔나', price: 1500 },
    { id: 'extra-noodles', name: '면 추가', price: 1000 },
    { id: 'fried-egg', name: '계란 프라이 추가', price: 1000 },
    { id: 'cheese', name: '치즈 추가', price: 1000 }
  ],
  drinks: [
    { id: 'cola', name: '콜라', price: 2000 },
    { id: 'highball', name: '하이볼', price: 7000 }
  ]
};

const defaults = {
  teriyaki: {
    '계란 프라이 추가|치즈 추가': 9,
    '비엔나|치즈 추가': 6
  },
  shio: {
    '면 추가|오징어새우': 10,
    '계란 프라이 추가|오징어새우': 7
  }
};

test('serializeComboKey sorts topping names so ranking keys stay stable', () => {
  assert.equal(serializeComboKey(['면 추가', '오징어새우']), '면 추가|오징어새우');
  assert.equal(serializeComboKey(['오징어새우', '면 추가']), '면 추가|오징어새우');
});

test('calculateSelectionSubtotal includes toppings, drinks, and quantity', () => {
  const subtotal = calculateSelectionSubtotal(
    {
      menuId: 'shio',
      quantity: 2,
      toppingNames: ['오징어새우', '면 추가'],
      drinks: [{ id: 'highball', quantity: 1 }]
    },
    catalogs
  );

  assert.equal(subtotal, 34000);
});

test('createCartItem preserves line details and deterministic ids', () => {
  const item = createCartItem(
    {
      menuId: 'teriyaki',
      quantity: 1,
      toppingNames: ['치즈 추가'],
      drinks: [{ id: 'cola', quantity: 1 }]
    },
    catalogs,
    () => 'line-1'
  );

  assert.equal(item.lineId, 'line-1');
  assert.equal(item.menuName, '기본 야끼소바');
  assert.deepEqual(item.toppingNames, ['치즈 추가']);
  assert.equal(item.lineTotal, 14000);
});

test('removeCartItem only removes the targeted line', () => {
  const next = removeCartItem(
    [
      { lineId: 'line-1', lineTotal: 14000 },
      { lineId: 'line-2', lineTotal: 18000 }
    ],
    'line-1'
  );

  assert.deepEqual(next, [{ lineId: 'line-2', lineTotal: 18000 }]);
});

test('calculateCartSummary totals the full multi-line cart', () => {
  const summary = calculateCartSummary([
    { lineId: 'line-1', quantity: 1, lineTotal: 14000 },
    { lineId: 'line-2', quantity: 2, lineTotal: 34000 }
  ]);

  assert.deepEqual(summary, {
    lineCount: 2,
    totalQuantity: 3,
    totalAmount: 48000
  });
});

test('getTopCombos returns the highest ranked combos first', () => {
  const ranked = getTopCombos('shio', {
    ...defaults,
    shio: {
      ...defaults.shio,
      '치즈 추가': 15
    }
  }, 2);

  assert.deepEqual(ranked, [
    { comboKey: '치즈 추가', toppingNames: ['치즈 추가'], score: 15 },
    { comboKey: '면 추가|오징어새우', toppingNames: ['면 추가', '오징어새우'], score: 10 }
  ]);
});

test('recordCompletedOrder increments combo scores by line quantity', () => {
  const next = recordCompletedOrder(defaults, [
    {
      menuId: 'shio',
      quantity: 2,
      toppingNames: ['오징어새우', '면 추가']
    }
  ]);

  assert.equal(next.shio['면 추가|오징어새우'], 12);
});

test('loadComboStats falls back to defaults when storage is invalid', () => {
  const loaded = loadComboStats('not-json', defaults);
  assert.deepEqual(loaded, defaults);
});
```

- [ ] **Step 2: Run the test to verify it fails before the new modules exist**

Run:

```powershell
node --test tests/kiosk-core.test.js
```

Expected: FAIL with `Cannot find module '../js/kiosk-core.js'` or missing export errors.

- [ ] **Step 3: Create `js/kiosk-data.js` with the real menu, topping, drink, and default combo data**

Write `js/kiosk-data.js` with this content:

```js
(function (global) {
  const data = {
    menus: [
      {
        id: 'teriyaki',
        name: '기본 야끼소바',
        subtitle: '달콤한 데리야끼 풍미, 가장 익숙한 시그니처 메뉴',
        price: 11000,
        badge: 'SIGNATURE',
        imagePath: './assets/images/menu/base-yakisoba.jpg',
        imageAlt: '기본 야끼소바 실사 사진'
      },
      {
        id: 'shio',
        name: '소금 야끼소바',
        subtitle: '깔끔하고 고소한 풍미, 해산물 토핑과 잘 어울리는 메뉴',
        price: 11000,
        badge: 'SEAFOOD PICK',
        imagePath: './assets/images/menu/shio-yakisoba.jpg',
        imageAlt: '소금 야끼소바 실사 사진'
      }
    ],
    toppings: [
      { id: 'squid-shrimp', name: '오징어새우', price: 1500 },
      { id: 'vienna', name: '비엔나', price: 1500 },
      { id: 'extra-noodles', name: '면 추가', price: 1000 },
      { id: 'fried-egg', name: '계란 프라이 추가', price: 1000 },
      { id: 'cheese', name: '치즈 추가', price: 1000 }
    ],
    drinks: [
      { id: 'cola', name: '콜라', price: 2000 },
      { id: 'cider', name: '사이다', price: 2000 },
      { id: 'draft-beer', name: '생맥주', price: 5000 },
      { id: 'highball', name: '하이볼', price: 7000 }
    ],
    defaultComboStats: {
      teriyaki: {
        '계란 프라이 추가|치즈 추가': 9,
        '비엔나|치즈 추가': 6
      },
      shio: {
        '면 추가|오징어새우': 10,
        '계란 프라이 추가|오징어새우': 7
      }
    },
    storageKey: 'yakitei.combo-stats.v1'
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = data;
  }

  global.KioskData = data;
})(typeof globalThis !== 'undefined' ? globalThis : window);
```
- [ ] **Step 4: Add the pricing, cart, recommendation, and storage helpers to `js/kiosk-core.js`**

Write `js/kiosk-core.js` with this content:

```js
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
```

- [ ] **Step 5: Run the tests to verify the core module now passes**

Run:

```powershell
node --test tests/kiosk-core.test.js
```

Expected: PASS with 8 passing tests.

- [ ] **Step 6: Commit**

```bash
git add js/kiosk-data.js js/kiosk-core.js tests/kiosk-core.test.js
git commit -m "feat: add yakitei kiosk domain logic"
```

Expected: commit succeeds if the workspace is inside a Git repo. If not, skip and keep the working tree changes intact.

### Task 3: Replace The Study Planner HTML With The Kiosk Shell

**Files:**
- Create: `tests/index-shell.test.js`
- Modify: `index.html`

- [ ] **Step 1: Write a failing shell test that locks the required kiosk mount points**

Create `tests/index-shell.test.js` with this content:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('index.html', 'utf8');

test('index.html exposes the yakitei kiosk mount points', () => {
  [
    'menu-grid',
    'selected-menu-media',
    'selected-menu-title',
    'selected-menu-price',
    'recommendation-list',
    'topping-list',
    'drink-list',
    'selected-quantity',
    'current-subtotal',
    'add-to-cart-button',
    'cart-list',
    'order-total',
    'clear-cart-button',
    'complete-order-button',
    'completion-panel'
  ].forEach((id) => {
    assert.match(html, new RegExp(`id="${id}"`));
  });

  assert.match(html, /src="\.\/js\/kiosk-data\.js"/);
  assert.match(html, /src="\.\/js\/kiosk-core\.js"/);
  assert.match(html, /src="\.\/js\/app\.js"/);
  assert.doesNotMatch(html, /planner\.js/);
});
```

- [ ] **Step 2: Run the shell test to confirm the old study-planner page fails it**

Run:

```powershell
node --test tests/index-shell.test.js
```

Expected: FAIL because the current `index.html` does not expose the kiosk ids and still references the study-planner flow.

- [ ] **Step 3: Replace `index.html` with the kiosk layout and the new script includes**

Write `index.html` with this content:

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>야끼테이 (やきてい) 키오스크</title>
  <link rel="stylesheet" href="./css/style.css">
</head>
<body>
  <main class="app-shell">
    <header class="hero-panel glass-panel">
      <p class="hero-panel__eyebrow">YAKITEI KIOSK</p>
      <h1>야끼테이 <span lang="ja">やきてい</span></h1>
      <p class="hero-panel__description">실사 음식 사진과 실시간 토핑 추천으로 빠르게 주문하는 야끼소바 키오스크</p>
    </header>

    <section class="kiosk-layout">
      <section class="menu-panel glass-panel">
        <div class="section-heading">
          <p class="section-heading__eyebrow">MENU</p>
          <h2>메뉴를 선택하세요</h2>
        </div>
        <div id="menu-grid" class="menu-grid" aria-live="polite"></div>
      </section>

      <aside class="side-stack">
        <section class="builder-panel glass-panel">
          <div id="selected-menu-media" class="selected-menu-media"></div>
          <div class="selected-menu-copy">
            <p class="section-heading__eyebrow">CUSTOMIZE</p>
            <h2 id="selected-menu-title">메뉴를 선택하세요</h2>
            <p id="selected-menu-copy" class="selected-menu-copy__body">왼쪽 메뉴에서 야끼소바를 고르면 토핑과 음료를 조합할 수 있습니다.</p>
            <strong id="selected-menu-price" class="selected-menu-copy__price">0원</strong>
          </div>

          <section class="builder-section">
            <h3>지금 가장 많이 담는 조합</h3>
            <div id="recommendation-list" class="recommendation-list"></div>
          </section>

          <section class="builder-section">
            <h3>토핑 선택</h3>
            <div id="topping-list" class="chip-grid"></div>
          </section>

          <section class="builder-section">
            <h3>음료 선택</h3>
            <div id="drink-list" class="drink-list"></div>
          </section>

          <section class="builder-footer">
            <div class="quantity-control">
              <button id="decrease-quantity-button" type="button">-</button>
              <strong id="selected-quantity">1</strong>
              <button id="increase-quantity-button" type="button">+</button>
            </div>
            <div class="subtotal-block">
              <span>현재 구성</span>
              <strong id="current-subtotal">0원</strong>
            </div>
          </section>

          <button id="add-to-cart-button" class="primary-button" type="button">장바구니 담기</button>
        </section>

        <section class="cart-panel glass-panel">
          <div class="section-heading">
            <p class="section-heading__eyebrow">CART</p>
            <h2>장바구니</h2>
          </div>
          <div id="cart-list" class="cart-list"></div>
          <div class="cart-summary">
            <span>총 결제 예상 금액</span>
            <strong id="order-total">0원</strong>
          </div>
          <div class="cart-actions">
            <button id="clear-cart-button" type="button">전체 비우기</button>
            <button id="complete-order-button" class="primary-button" type="button">주문하기</button>
          </div>
        </section>
      </aside>
    </section>

    <section id="completion-panel" class="completion-panel glass-panel" hidden></section>
  </main>

  <script src="./js/kiosk-data.js"></script>
  <script src="./js/kiosk-core.js"></script>
  <script src="./js/app.js"></script>
</body>
</html>
```

- [ ] **Step 4: Re-run the shell test and verify the new HTML contract passes**

Run:

```powershell
node --test tests/index-shell.test.js
```

Expected: PASS with the kiosk ids present and no `planner.js` reference.

- [ ] **Step 5: Commit**

```bash
git add index.html tests/index-shell.test.js
git commit -m "feat: add yakitei kiosk HTML shell"
```

Expected: commit succeeds inside a Git repo, otherwise skip.
### Task 4: Replace The Stylesheet With The Soft-3D Kiosk Visual System

**Files:**
- Create: `tests/style-smoke.test.js`
- Modify: `css/style.css`

- [ ] **Step 1: Write a failing CSS smoke test for the required visual tokens and selectors**

Create `tests/style-smoke.test.js` with this content:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const css = fs.readFileSync('css/style.css', 'utf8');

test('style.css defines the yakitei palette, 3D cards, and responsive layout hooks', () => {
  [
    '--color-cream: #FFF8F0',
    '--color-caramel: #C08552',
    '--color-toast: #8C5A3C',
    '--color-espresso: #4B2E2B',
    '.glass-panel',
    '.menu-card',
    '.menu-card__media',
    '.recommendation-card',
    '.cart-item',
    '.cart-item__remove',
    '.photo-fallback',
    '@media (max-width: 1100px)',
    '@media (max-width: 720px)'
  ].forEach((token) => {
    assert.ok(css.includes(token), `Missing token: ${token}`);
  });
});
```

- [ ] **Step 2: Run the CSS smoke test to confirm the old stylesheet fails it**

Run:

```powershell
node --test tests/style-smoke.test.js
```

Expected: FAIL because the current stylesheet still contains the old study-planner rules.

- [ ] **Step 3: Rewrite `css/style.css` with the palette, 3D layering, real-photo framing, and responsive layout**

Replace `css/style.css` with this content:

```css
:root {
  --color-cream: #FFF8F0;
  --color-caramel: #C08552;
  --color-toast: #8C5A3C;
  --color-espresso: #4B2E2B;
  --color-card: rgba(255, 250, 244, 0.86);
  --color-line: rgba(140, 90, 60, 0.18);
  --shadow-soft: 0 22px 50px rgba(75, 46, 43, 0.12);
  --shadow-deep: 0 30px 80px rgba(75, 46, 43, 0.18);
  --shadow-press: inset 0 2px 6px rgba(255, 255, 255, 0.4);
  --radius-xl: 32px;
  --radius-lg: 24px;
  --radius-md: 18px;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  font-family: 'Segoe UI', 'Noto Sans KR', sans-serif;
  color: var(--color-espresso);
  background:
    radial-gradient(circle at top left, rgba(192, 133, 82, 0.22), transparent 26%),
    radial-gradient(circle at bottom right, rgba(75, 46, 43, 0.12), transparent 18%),
    linear-gradient(180deg, #fffdf9 0%, var(--color-cream) 48%, #f3e2d0 100%);
}

img {
  display: block;
  max-width: 100%;
}

.app-shell {
  width: min(1440px, calc(100% - 32px));
  margin: 0 auto;
  padding: 32px 0 48px;
}

.glass-panel {
  background: var(--color-card);
  border: 1px solid rgba(255, 255, 255, 0.62);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-deep);
  backdrop-filter: blur(18px);
}

.hero-panel {
  padding: 28px 32px;
  margin-bottom: 24px;
}

.hero-panel__eyebrow,
.section-heading__eyebrow {
  margin: 0 0 8px;
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  color: var(--color-caramel);
}

.kiosk-layout {
  display: grid;
  grid-template-columns: 1.4fr 0.9fr;
  gap: 24px;
  align-items: start;
}

.menu-panel,
.builder-panel,
.cart-panel,
.completion-panel {
  padding: 24px;
}

.side-stack {
  display: grid;
  gap: 24px;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.menu-card {
  position: relative;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: linear-gradient(180deg, rgba(255,255,255,0.86), rgba(255,248,240,0.96));
  box-shadow: var(--shadow-soft);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.menu-card.is-active {
  transform: translateY(-4px);
  box-shadow: 0 34px 70px rgba(75, 46, 43, 0.22);
}

.menu-card__button {
  width: 100%;
  border: 0;
  background: transparent;
  padding: 0;
  text-align: left;
  cursor: pointer;
}

.menu-card__media {
  position: relative;
  aspect-ratio: 4 / 3;
  background: linear-gradient(135deg, rgba(140, 90, 60, 0.95), rgba(75, 46, 43, 0.84));
}

.menu-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.menu-card__shine {
  position: absolute;
  inset: 0;
  background: linear-gradient(125deg, rgba(255,255,255,0.38), transparent 45%);
}

.photo-fallback {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 16px;
  text-align: center;
  color: #fff7f0;
  font-weight: 700;
}

.recommendation-list,
.chip-grid,
.drink-list,
.cart-list {
  display: grid;
  gap: 12px;
}

.recommendation-card,
.cart-item,
.drink-row,
.chip-button {
  box-shadow: var(--shadow-press);
}

.chip-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.chip-button,
.drink-stepper button,
.quantity-control button,
.cart-item__remove,
.cart-actions button,
.primary-button {
  border: 0;
  border-radius: 999px;
  font: inherit;
}

.chip-button {
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.74);
  border: 1px solid var(--color-line);
  cursor: pointer;
}

.chip-button.is-active,
.primary-button {
  color: #fff8f0;
  background: linear-gradient(135deg, var(--color-caramel), var(--color-espresso));
}

.drink-row,
.cart-item,
.recommendation-card {
  padding: 16px;
  border-radius: var(--radius-md);
  background: rgba(255,255,255,0.82);
  border: 1px solid var(--color-line);
}

.drink-stepper,
.quantity-control,
.builder-footer,
.cart-summary,
.cart-actions,
.cart-item__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

@media (max-width: 1100px) {
  .kiosk-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .app-shell {
    width: min(100% - 20px, 1440px);
    padding: 20px 0 28px;
  }

  .menu-grid,
  .chip-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 4: Re-run the CSS smoke test to verify the new style contract passes**

Run:

```powershell
node --test tests/style-smoke.test.js
```

Expected: PASS with the yakitei palette, 3D selectors, and responsive breakpoints present.

- [ ] **Step 5: Commit**

```bash
git add css/style.css tests/style-smoke.test.js
git commit -m "feat: add yakitei 3d kiosk styling"
```

Expected: commit succeeds inside a Git repo, otherwise skip.
### Task 5: Replace `js/app.js` With The Interactive Kiosk Controller

**Files:**
- Modify: `js/app.js`

- [ ] **Step 1: Replace the study-planner controller with kiosk state, DOM references, and initialization**

Replace the top of `js/app.js` with this structure:

```js
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
    comboStats: loadComboStats(window.localStorage.getItem(storageKey), defaultComboStats)
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

  function getSelectedMenu() {
    return menus.find((menu) => menu.id === state.selectedMenuId);
  }

  function buildSelection() {
    return {
      menuId: state.selectedMenuId,
      quantity: state.selectedQuantity,
      toppingNames: [...state.selectedToppingNames],
      drinks: [...state.selectedDrinks]
    };
  }
```

- [ ] **Step 2: Add the rendering helpers for menu cards, recommendations, topping chips, drink steppers, and cart lines**

Add these functions below the initialization block:

```js
  function formatCurrency(value) {
    return `${value.toLocaleString('ko-KR')}원`;
  }

  function renderMenuGrid() {
    elements.menuGrid.innerHTML = menus.map((menu) => `
      <article class="menu-card ${menu.id === state.selectedMenuId ? 'is-active' : ''}">
        <button class="menu-card__button" type="button" data-menu-id="${menu.id}">
          <div class="menu-card__media">
            <img class="menu-card__image" src="${menu.imagePath}" alt="${menu.imageAlt}" loading="lazy">
            <span class="menu-card__shine"></span>
            <span class="photo-fallback" hidden>${menu.name}</span>
          </div>
          <div class="menu-card__body">
            <p class="menu-card__badge">${menu.badge}</p>
            <h3>${menu.name}</h3>
            <p>${menu.subtitle}</p>
            <strong class="menu-card__price">${formatCurrency(menu.price)}</strong>
          </div>
        </button>
      </article>
    `).join('');
  }

  function renderSelectedMenu() {
    const menu = getSelectedMenu();
    const subtotal = calculateSelectionSubtotal(buildSelection(), { menus, toppings, drinks });

    elements.selectedMenuMedia.innerHTML = `
      <div class="menu-card__media">
        <img class="menu-card__image" src="${menu.imagePath}" alt="${menu.imageAlt}" loading="lazy">
        <span class="menu-card__shine"></span>
        <span class="photo-fallback" hidden>${menu.name}</span>
      </div>
    `;
    elements.selectedMenuTitle.textContent = menu.name;
    elements.selectedMenuCopy.textContent = menu.subtitle;
    elements.selectedMenuPrice.textContent = formatCurrency(menu.price);
    elements.selectedQuantity.textContent = String(state.selectedQuantity);
    elements.currentSubtotal.textContent = formatCurrency(subtotal);
  }

  function renderRecommendations() {
    const combos = getTopCombos(state.selectedMenuId, state.comboStats, 3);

    elements.recommendationList.innerHTML = combos.length
      ? combos.map((combo) => `
          <button class="recommendation-card" type="button" data-combo-key="${combo.comboKey}">
            <strong>${combo.toppingNames.join(' + ')}</strong>
            <span>실시간 점수 ${combo.score}</span>
          </button>
        `).join('')
      : '<p>가장 먼저 인기 조합을 만들어보세요.</p>';
  }

  function renderToppings() {
    elements.toppingList.innerHTML = toppings.map((topping) => `
      <button class="chip-button ${state.selectedToppingNames.includes(topping.name) ? 'is-active' : ''}" type="button" data-topping-name="${topping.name}">
        ${topping.name} +${formatCurrency(topping.price).replace('원', '')}
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
            <strong>${drink.name}</strong>
            <p>${formatCurrency(drink.price)}</p>
          </div>
          <div class="drink-stepper">
            <button type="button" data-drink-id="${drink.id}" data-delta="-1">-</button>
            <strong>${quantity}</strong>
            <button type="button" data-drink-id="${drink.id}" data-delta="1">+</button>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderCart() {
    if (state.cartItems.length === 0) {
      elements.cartList.innerHTML = '<p>장바구니가 비어 있습니다. 메뉴를 담아보세요.</p>';
      elements.orderTotal.textContent = formatCurrency(0);
      elements.completeOrderButton.disabled = true;
      return;
    }

    const summary = calculateCartSummary(state.cartItems);

    elements.cartList.innerHTML = state.cartItems.map((item) => `
      <article class="cart-item">
        <div class="cart-item__top">
          <div>
            <h3>${item.menuName} x${item.quantity}</h3>
            <p>${item.toppingNames.length ? item.toppingNames.join(', ') : '기본 구성'}</p>
            <p>${item.drinks.length ? item.drinks.map((drinkLine) => `${drinks.find((drink) => drink.id === drinkLine.id).name} x${drinkLine.quantity}`).join(', ') : '음료 없음'}</p>
          </div>
          <button class="cart-item__remove" type="button" data-remove-cart-id="${item.lineId}">삭제</button>
        </div>
        <strong>${formatCurrency(item.lineTotal)}</strong>
      </article>
    `).join('');

    elements.orderTotal.textContent = formatCurrency(summary.totalAmount);
    elements.completeOrderButton.disabled = false;
  }
```
- [ ] **Step 3: Add the selection mutators, add-to-cart flow, delete flow, and order completion flow**

Add these functions below the renderers:

```js
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
    syncPhotoFallbacks();
  }

  function setSelectedMenu(menuId) {
    state.selectedMenuId = menuId;
    state.selectedToppingNames = [];
    state.selectedDrinks = [];
    state.selectedQuantity = 1;
    rerender();
  }

  function toggleTopping(toppingName) {
    state.selectedToppingNames = state.selectedToppingNames.includes(toppingName)
      ? state.selectedToppingNames.filter((name) => name !== toppingName)
      : [...state.selectedToppingNames, toppingName];
    rerender();
  }

  function updateDrink(drinkId, delta) {
    const next = [...state.selectedDrinks];
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
    window.localStorage.setItem(storageKey, JSON.stringify(state.comboStats));

    const summary = calculateCartSummary(state.cartItems);
    elements.completionPanel.innerHTML = `
      <h2>주문이 완료되었습니다</h2>
      <p>${summary.lineCount}개 라인 / 총 ${formatCurrency(summary.totalAmount)}</p>
      <ul>
        ${state.cartItems.map((item) => `<li>${item.menuName} x${item.quantity} - ${formatCurrency(item.lineTotal)}</li>`).join('')}
      </ul>
      <button id="reset-order-button" class="primary-button" type="button">새 주문 시작</button>
    `;
    elements.completionPanel.hidden = false;
    state.cartItems = [];
    rerender();
  }
```

- [ ] **Step 4: Add the event delegation and initial boot call at the bottom of `js/app.js`**

Add this block to finish the controller:

```js
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
      state.selectedToppingNames = recommendationButton.dataset.comboKey ? recommendationButton.dataset.comboKey.split('|') : [];
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
      elements.completionPanel.hidden = true;
      return;
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
```

- [ ] **Step 5: Run the automated tests again so the new controller is built on passing contracts**

Run:

```powershell
node --test tests/kiosk-core.test.js tests/index-shell.test.js tests/style-smoke.test.js
```

Expected: PASS with all three test files green.

- [ ] **Step 6: Open the page locally and manually verify the interaction flow**

Run:

```powershell
Start-Process '.\\index.html'
```

Expected: the browser opens the page. Manually confirm these behaviors before moving on:

```md
- The two main menu cards show real photos and deep shadows.
- Switching between menus resets only the current customizer state, not the cart.
- Clicking a recommendation applies the matching toppings.
- `장바구니 담기` adds a new line item.
- The same menu can be added twice with different topping combinations and both lines stay visible.
- Clicking each `삭제` button removes only that line.
- Clicking `주문하기` shows the completion panel, clears the cart, and keeps the updated recommendation ranking for the next order.
- If an image path is temporarily broken in `js/kiosk-data.js`, the photo fallback text appears instead of a broken image icon.
```

- [ ] **Step 7: Commit**

```bash
git add js/app.js
git commit -m "feat: add yakitei kiosk interactions"
```

Expected: commit succeeds inside a Git repo, otherwise skip.

### Task 6: Final Full-Suite Verification And Cleanup Pass

**Files:**
- Modify: `index.html` if any final copy or accessibility fix is discovered
- Modify: `css/style.css` if any responsive overflow or contrast fix is discovered
- Modify: `js/app.js` if any manual QA bug is discovered

- [ ] **Step 1: Run the full automated suite one more time from the project root**

Run:

```powershell
node --test tests\kiosk-core.test.js tests\index-shell.test.js tests\style-smoke.test.js
```

Expected: PASS with all tests green and no skipped files.

- [ ] **Step 2: Run a final visual and responsive smoke pass in the browser**

Run:

```powershell
Start-Process '.\\index.html'
```

Expected: on desktop width the layout stays split into left menu / right customizer+cart, and on a narrow mobile emulator width the layout stacks without clipping the buttons or totals.

- [ ] **Step 3: If the browser smoke pass finds a bug, fix exactly that bug before closing the task**

Use this checklist while patching the specific issue:

```md
- If the bug is visual only, touch `css/style.css` and rerun Step 1 plus Step 2.
- If the bug changes totals, cart behavior, or recommendation state, touch `js/kiosk-core.js` or `js/app.js`, rerun Step 1, then repeat Step 2.
- If the bug is missing markup or a broken id/class hook, touch `index.html`, rerun Step 1, then repeat Step 2.
```

- [ ] **Step 4: Commit the finished kiosk page**

```bash
git add index.html css/style.css js/app.js js/kiosk-data.js js/kiosk-core.js tests/kiosk-core.test.js tests/index-shell.test.js tests/style-smoke.test.js assets/images/menu/base-yakisoba.jpg assets/images/menu/shio-yakisoba.jpg docs/superpowers/references/yakitei-photo-sources.md
git commit -m "feat: ship yakitei kiosk web page"
```

Expected: commit succeeds inside a Git repo, otherwise skip.


