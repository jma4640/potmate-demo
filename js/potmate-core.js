(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PotMateCore = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  const CATEGORY_FIELDS = {
    '배달팟': ['menu', 'pickup', 'orderTime'],
    '택시팟': ['start', 'destination', 'departureTime', 'taxiFare'],
    '구독팟': ['serviceName', 'period', 'subscriptionAmount'],
    '기타팟': ['purpose', 'place', 'estimatedAmount']
  };

  function formatWon(amount) {
    return `${Number(amount || 0).toLocaleString('ko-KR')}원`;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function searchTextFor(pot) {
    return [
      pot.title,
      pot.category,
      pot.location,
      pot.description,
      ...Object.values(pot.detail || {})
    ].join(' ').toLowerCase();
  }

  function filterPots(pots, filters) {
    const category = filters.category || '전체';
    const query = (filters.query || '').trim().toLowerCase();

    return pots.filter((pot) => {
      const categoryMatches = category === '전체' || pot.category === category;
      const queryMatches = !query || searchTextFor(pot).includes(query);
      return categoryMatches && queryMatches;
    });
  }

  function createPot(input, idFactory) {
    const category = input.category || '기타팟';
    const detail = {};
    (CATEGORY_FIELDS[category] || CATEGORY_FIELDS['기타팟']).forEach((field) => {
      if (input[field]) detail[field] = input[field];
    });

    return {
      id: idFactory ? idFactory() : `pot-${Date.now()}`,
      title: input.title || '새 팟',
      category,
      host: input.host || { id: 'me', name: '나', avatar: '나', isMe: true },
      currentMembers: 1,
      maxMembers: Number(input.maxMembers || 2),
      perPersonAmount: Number(input.perPersonAmount || 0),
      location: input.location || input.pickup || input.place || '캠퍼스 근처',
      distance: Number(input.distance || 120),
      deadline: input.deadline || '오늘 23:00',
      description: input.description || '같이 N빵할 메이트를 찾고 있어요.',
      settlementStatus: '정산 대기',
      safePay: true,
      participants: [input.host || { id: 'me', name: '나', avatar: '나', paid: false, isMe: true }],
      detail
    };
  }

  function canJoinPot(pot, pointBalance) {
    if (pot.currentMembers >= pot.maxMembers) {
      return { ok: false, reason: '모집 인원이 이미 가득 찼어요' };
    }

    if (pointBalance < pot.perPersonAmount) {
      return { ok: false, reason: '포인트 잔액이 부족해 참여할 수 없어요' };
    }

    return { ok: true };
  }

  function ensureChat(chats, pot) {
    const host = pot.host || { id: 'host', name: '방장' };
    return chats[pot.id] || {
      potId: pot.id,
      messages: [
        { from: host.id, name: host.name, text: '안전정산으로 진행할게요. 참여하면 여기서 얘기해요!', mine: false }
      ]
    };
  }

  function joinPot(state, potId) {
    const next = clone(state);
    const pot = next.pots.find((item) => item.id === potId);
    if (!pot) return next;

    pot.participants = pot.participants || [];
    if (!pot.participants.some((member) => member.id === next.user.id)) {
      pot.participants.push({ id: next.user.id, name: next.user.name, avatar: '나', paid: false, isMe: true });
      pot.currentMembers += 1;
    }

    next.chats[potId] = ensureChat(next.chats, pot);
    next.chats[potId].messages.push({
      from: next.user.id,
      name: next.user.name,
      text: `${next.user.name}님이 팟에 입장했어요.`,
      system: true
    });

    next.payments.push({
      id: `pay-${Date.now()}`,
      potId,
      title: pot.title,
      category: pot.category,
      amount: pot.perPersonAmount,
      status: '참여중',
      date: '오늘'
    });

    return next;
  }

  function requestSettlement(state, potId, totalAmount) {
    const next = clone(state);
    const pot = next.pots.find((item) => item.id === potId);
    if (!pot) return next;

    const participants = pot.participants && pot.participants.length ? pot.participants : [];
    const perPerson = Math.ceil(Number(totalAmount || 0) / Math.max(participants.length, 1));
    pot.perPersonAmount = perPerson;
    pot.settlementStatus = '정산 요청됨';
    pot.participants = participants.map((member) => ({ ...member, paid: Boolean(member.paid) }));
    next.settlements = next.settlements || [];
    next.settlements.unshift({
      id: `settlement-${Date.now()}`,
      potId,
      title: pot.title,
      amount: perPerson,
      status: '정산 요청됨',
      date: '오늘'
    });

    next.chats[potId] = ensureChat(next.chats || {}, pot);
    next.chats[potId].messages.push({
      from: 'system',
      text: `팟메이트 정산 요청이 도착했어요. ${formatWon(perPerson)}을 결제해주세요.`,
      system: true
    });

    return next;
  }

  function sendReminder(name) {
    return `${name}님에게 리마인드 알림을 보냈어요. 아직 정산하지 않은 메이트가 있어요.`;
  }

  function markParticipantPaid(state, potId, participantId, amount) {
    const next = clone(state);
    const pot = next.pots.find((item) => item.id === potId);
    if (!pot) return next;

    pot.participants = (pot.participants || []).map((member) => (
      member.id === participantId ? { ...member, paid: true } : member
    ));

    if (pot.participants.length && pot.participants.every((member) => member.paid)) {
      pot.settlementStatus = '정산 완료';
    }

    next.payments = next.payments || [];
    next.payments.unshift({
      id: `paid-${Date.now()}`,
      potId,
      title: pot.title || '팟 정산',
      category: pot.category || '기타팟',
      amount: Number(amount || pot.perPersonAmount || 0),
      status: '정산 완료',
      date: '오늘'
    });

    return next;
  }

  function chargePoints(state, amount) {
    const next = clone(state);
    next.pointBalance = Number(next.pointBalance || 0) + Number(amount || 0);
    next.payments = next.payments || [];
    next.payments.unshift({
      id: `charge-${Date.now()}`,
      title: '포인트 충전',
      category: '포인트',
      amount: Number(amount || 0),
      status: '충전 완료',
      date: '오늘'
    });
    return next;
  }

  function getPaymentHistory(state) {
    return clone(state.payments || []);
  }

  return {
    formatWon,
    filterPots,
    createPot,
    canJoinPot,
    joinPot,
    requestSettlement,
    sendReminder,
    chargePoints,
    markParticipantPaid,
    getPaymentHistory
  };
});
