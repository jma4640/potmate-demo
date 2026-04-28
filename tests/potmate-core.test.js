const test = require('node:test');
const assert = require('node:assert/strict');
const {
  filterPots,
  createPot,
  canJoinPot,
  joinPot,
  requestSettlement,
  sendReminder,
  chargePoints,
  markParticipantPaid,
  getPaymentHistory
} = require('../js/potmate-core.js');

const pots = [
  {
    id: 'pot-1',
    title: '마라탕 배달 같이 시켜요',
    category: '배달팟',
    location: '가천대 비전타워',
    distance: 350,
    perPersonAmount: 12000,
    currentMembers: 2,
    maxMembers: 4,
    detail: { menu: '마라탕' }
  },
  {
    id: 'pot-2',
    title: '강남역 택시팟',
    category: '택시팟',
    location: '정문',
    distance: 900,
    perPersonAmount: 6500,
    currentMembers: 3,
    maxMembers: 4,
    detail: { destination: '강남역' }
  }
];

test('filterPots filters by category and Korean search terms across title, place, and details', () => {
  assert.deepEqual(filterPots(pots, { category: '배달팟', query: '마라탕' }).map((pot) => pot.id), ['pot-1']);
  assert.deepEqual(filterPots(pots, { category: '전체', query: '강남역' }).map((pot) => pot.id), ['pot-2']);
});

test('createPot normalizes user input into a joinable pot card', () => {
  const pot = createPot(
    {
      category: '구독팟',
      title: '넷플릭스 프리미엄',
      maxMembers: '4',
      perPersonAmount: '4250',
      location: '온라인',
      deadline: '오늘 22:00',
      description: '한 달 같이 써요',
      serviceName: '넷플릭스',
      period: '1개월'
    },
    () => 'new-pot'
  );

  assert.equal(pot.id, 'new-pot');
  assert.equal(pot.currentMembers, 1);
  assert.equal(pot.maxMembers, 4);
  assert.equal(pot.perPersonAmount, 4250);
  assert.equal(pot.detail.serviceName, '넷플릭스');
});

test('canJoinPot blocks joins when point balance is below estimated amount', () => {
  assert.equal(canJoinPot(pots[0], 20000).ok, true);
  assert.deepEqual(canJoinPot(pots[0], 3000), {
    ok: false,
    reason: '포인트 잔액이 부족해 참여할 수 없어요'
  });
});

test('joinPot adds the current user to the pot and records pending payment state', () => {
  const state = {
    user: { id: 'me', name: '나' },
    pots: [pots[0]],
    chats: {},
    payments: []
  };

  const next = joinPot(state, 'pot-1');

  assert.equal(next.pots[0].currentMembers, 3);
  assert.equal(next.pots[0].participants.some((member) => member.id === 'me'), true);
  assert.equal(next.payments[0].status, '참여중');
  assert.equal(next.chats['pot-1'].messages.at(-1).text.includes('입장'), true);
});

test('requestSettlement marks every unpaid participant and creates settlement messages', () => {
  const state = {
    pots: [
      {
        ...pots[0],
        participants: [
          { id: 'host', name: '수빈', paid: true },
          { id: 'me', name: '나', paid: false }
        ],
        settlementStatus: '정산 대기'
      }
    ],
    chats: { 'pot-1': { messages: [] } },
    settlements: []
  };

  const next = requestSettlement(state, 'pot-1', 48000);

  assert.equal(next.pots[0].settlementStatus, '정산 요청됨');
  assert.equal(next.pots[0].perPersonAmount, 24000);
  assert.equal(next.settlements[0].amount, 24000);
  assert.match(next.chats['pot-1'].messages[0].text, /정산 요청/);
});

test('sendReminder returns the expected toast copy for unpaid participants', () => {
  assert.equal(
    sendReminder('지민'),
    '지민님에게 리마인드 알림을 보냈어요. 아직 정산하지 않은 메이트가 있어요.'
  );
});

test('markParticipantPaid completes settlement only after every participant paid', () => {
  const state = {
    pots: [
      {
        id: 'pot-1',
        settlementStatus: '정산 요청됨',
        participants: [
          { id: 'host', paid: true },
          { id: 'me', paid: false }
        ]
      }
    ],
    payments: []
  };

  const next = markParticipantPaid(state, 'pot-1', 'me', 12000);

  assert.equal(next.pots[0].settlementStatus, '정산 완료');
  assert.equal(next.payments[0].status, '정산 완료');
});

test('chargePoints increases balance and appends payment history', () => {
  const next = chargePoints({ pointBalance: 18000, payments: [] }, 10000);

  assert.equal(next.pointBalance, 28000);
  assert.equal(getPaymentHistory(next)[0].title, '포인트 충전');
});
