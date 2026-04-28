const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('potmate_demo.html is a self-contained browser demo', () => {
  const html = fs.readFileSync('potmate_demo.html', 'utf8');

  [
    '<main id="app"',
    '<style>',
    '--color-main: #AA01E7',
    'window.PotMateSeed',
    'PotMateCore',
    '같이 N빵할 사람 구해요',
    '카테고리',
    '정산 요청하기',
    'My 결제'
  ].forEach((token) => {
    assert.ok(html.includes(token), `Missing token: ${token}`);
  });

  assert.doesNotMatch(html, /<link\b/i);
  assert.doesNotMatch(html, /src=["']\.\/js\//i);
  assert.doesNotMatch(html, /href=["']\.\/css\//i);
});
