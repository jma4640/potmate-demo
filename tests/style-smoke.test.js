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
