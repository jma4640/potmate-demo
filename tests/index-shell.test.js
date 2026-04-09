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
