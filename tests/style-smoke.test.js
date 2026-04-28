const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const css = fs.readFileSync('css/style.css', 'utf8');

test('style.css defines the PotMate palette, glossy cards, and mobile layout hooks', () => {
  [
    '--color-main: #AA01E7',
    '--color-soft: #F8E7FE',
    '--gradient-onboarding',
    '.mobile-shell',
    '.onboarding-screen',
    '.gradient-button',
    '.pot-card',
    '.message-row',
    '.message-profile',
    '.host-badge',
    '.bottom-nav',
    '.settlement-row',
    '.toast',
    '@media (min-width: 720px)',
    '@media (max-width: 420px)'
  ].forEach((token) => {
    assert.ok(css.includes(token), `Missing token: ${token}`);
  });
});
