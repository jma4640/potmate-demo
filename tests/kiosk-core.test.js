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
