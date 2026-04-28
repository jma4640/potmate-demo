const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const app = fs.readFileSync('js/app.js', 'utf8');

test('chat renderer includes profile rows, host badge, and own-message alignment hooks', () => {
  [
    'message-row',
    'message-profile',
    'message-body',
    'message-name',
    'host-badge',
    'is-own'
  ].forEach((token) => {
    assert.ok(app.includes(token), `Missing token: ${token}`);
  });
});
