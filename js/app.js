const core = window.PotMateCore;
const categories = ['전체', '배달팟', '택시팟', '구독팟', '기타팟'];

let state = {
  ...JSON.parse(JSON.stringify(window.PotMateSeed)),
  route: 'onboarding',
  selectedCategory: '전체',
  query: '',
  selectedPotId: null,
  settlementTotal: 48000
};

const app = document.querySelector('#app');
const toast = document.querySelector('#toast');

function won(amount) {
  return core.formatWon(amount);
}

function potById(id) {
  return state.pots.find((pot) => pot.id === id);
}

function setRoute(route, selectedPotId) {
  state.route = route;
  if (selectedPotId) state.selectedPotId = selectedPotId;
  render();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('is-visible');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove('is-visible'), 2200);
}

function nav(active) {
  return `
    <nav class="bottom-nav">
      ${[
        ['home', '홈'],
        ['create', '팟 만들기'],
        ['chat', '채팅'],
        ['my', 'My 결제']
      ].map(([route, label]) => `
        <button type="button" class="${active === route ? 'is-active' : ''}" data-route="${route}">${label}</button>
      `).join('')}
    </nav>
  `;
}

function backButton(target = 'home') {
  return `<button class="back-button" type="button" data-route="${target}" aria-label="뒤로">‹</button>`;
}

function potCard(pot) {
  return `
    <article class="pot-card" data-pot-id="${pot.id}">
      <div class="pot-card__head">
        <span class="category-badge">${pot.category}</span>
        <span class="safe-pay">안전정산 가능</span>
      </div>
      <h2>${pot.title}</h2>
      <div class="meta-grid">
        <div class="meta-chip">인원<strong>${pot.currentMembers}/${pot.maxMembers}명</strong></div>
        <div class="meta-chip">예상 1인 금액<strong>${won(pot.perPersonAmount)}</strong></div>
        <div class="meta-chip">위치<strong>${pot.location}</strong></div>
        <div class="meta-chip">거리/마감<strong>${pot.distance}m · ${pot.deadline}</strong></div>
      </div>
      <button class="gradient-button full-button" type="button" data-join-id="${pot.id}">참여하기</button>
    </article>
  `;
}

function renderOnboarding() {
  app.innerHTML = `
    <section class="onboarding-screen">
      <div>
        <div class="brand-mark"><span class="brand-icon">P</span>팟메이트(PotMate)</div>
        <div class="onboarding-hero">
          <h1>같이 N빵할 사람 구해요</h1>
          <p>근처 메이트와 배달, 택시, 구독까지 안전하게 나눠요.</p>
        </div>
        <div class="floating-preview">
          <div class="preview-card"><strong>가천대학교 근처 350m</strong><span>마라탕 배달팟 · 2/4명 · 12,000원</span></div>
          <div class="preview-card"><strong>안전정산 보관중</strong><span>정산 요청 전까지 포인트가 안전하게 관리돼요.</span></div>
        </div>
      </div>
      <button class="gradient-button full-button" type="button" data-route="home">시작하기</button>
    </section>
  `;
}

function renderHome() {
  const filtered = core.filterPots(state.pots, { category: state.selectedCategory, query: state.query });
  app.innerHTML = `
    <section class="screen">
      <header class="topbar">
        <span class="location-pill">현재 위치 · ${state.user.campus} 근처</span>
        <span class="status-pill">${won(state.pointBalance)}</span>
      </header>
      <div class="hero-copy">
        <h1>같이 N빵할 사람 구해요</h1>
        <p>지금 내 주변에서 열려 있는 팟이에요</p>
      </div>
      <label class="search-box">
        <input id="search-input" type="search" value="${state.query}" placeholder="마라탕, 강남역, 넷플릭스 검색">
      </label>
      <div class="category-tabs">
        ${categories.map((category) => `
          <button type="button" class="${category === state.selectedCategory ? 'is-active' : ''}" data-category="${category}">${category}</button>
        `).join('')}
      </div>
      <section class="pot-list">
        ${filtered.length ? filtered.map(potCard).join('') : '<div class="empty-state">조건에 맞는 팟이 없어요.</div>'}
      </section>
    </section>
    ${nav('home')}
  `;
}

function detailRows(pot) {
  const labelMap = {
    menu: '희망 메뉴',
    pickup: '수령지',
    orderTime: '주문 예정 시간',
    start: '출발지',
    destination: '도착지',
    departureTime: '출발 시간',
    taxiFare: '예상 택시비',
    serviceName: '구독 서비스명',
    period: '이용 기간',
    subscriptionAmount: '1인당 금액',
    purpose: '팟 목적',
    place: '장소',
    estimatedAmount: '예상 금액'
  };

  return Object.entries(pot.detail || {}).map(([key, value]) => `
    <div class="info-row"><span>${labelMap[key] || key}</span><strong>${value}</strong></div>
  `).join('');
}

function renderDetail() {
  const pot = potById(state.selectedPotId);
  if (!pot) return setRoute('home');

  app.innerHTML = `
    <section class="screen">
      <header class="topbar">${backButton()}<span class="status-pill">${pot.category}</span></header>
      <div class="detail-stack">
        <article class="glass-card">
          <span class="category-badge">${pot.category}</span>
          <h1>${pot.title}</h1>
          <p>${pot.description}</p>
          <div class="participant-strip">
            ${(pot.participants || []).map((member) => `<span class="avatar">${member.avatar || member.name[0]}</span>`).join('')}
          </div>
        </article>
        <article class="glass-card detail-stack">
          <div class="info-row"><span>방장</span><strong>${pot.host.name}</strong></div>
          <div class="info-row"><span>인원</span><strong>${pot.currentMembers}/${pot.maxMembers}명</strong></div>
          <div class="info-row"><span>예상 1인 금액</span><strong>${won(pot.perPersonAmount)}</strong></div>
          <div class="info-row"><span>위치</span><strong>${pot.location}</strong></div>
          <div class="info-row"><span>마감 시간</span><strong>${pot.deadline}</strong></div>
          ${detailRows(pot)}
        </article>
      </div>
      <div class="fixed-action">
        <button class="gradient-button full-button" type="button" data-route="confirm">팟 참여하기</button>
      </div>
    </section>
    ${nav('home')}
  `;
}

function renderConfirm() {
  const pot = potById(state.selectedPotId);
  const result = core.canJoinPot(pot, state.pointBalance);

  app.innerHTML = `
    <section class="screen">
      <header class="topbar">${backButton('detail')}<span class="status-pill">참여 확인</span></header>
      <article class="glass-card join-summary">
        <span class="category-badge">${pot.category}</span>
        <h1>${pot.title}</h1>
        <span class="price-xl">${won(pot.perPersonAmount)}</span>
        <div class="info-row"><span>내 포인트 잔액</span><strong>${won(state.pointBalance)}</strong></div>
      </article>
      <p class="notice">정산 요청 전까지 포인트가 안전하게 보관돼요.</p>
      ${result.ok ? `
        <button class="gradient-button full-button" type="button" data-confirm-join="${pot.id}">참여 확정 후 채팅방 입장</button>
      ` : `
        <p class="notice">${result.reason}</p>
        <button class="secondary-button full-button" type="button" data-charge="10000">충전하기</button>
        <button class="gradient-button full-button" type="button" disabled>참여 확정 후 채팅방 입장</button>
      `}
    </section>
    ${nav('home')}
  `;
}

function memberForMessage(pot, message) {
  if (message.from === state.user.id || message.mine) {
    return { id: state.user.id, name: state.user.name, avatar: '나', isMe: true };
  }

  return (pot.participants || []).find((member) => member.id === message.from)
    || (message.from === pot.host.id ? pot.host : null)
    || { id: message.from, name: message.name || '메이트', avatar: (message.name || '메')[0] };
}

function renderMessage(pot, message) {
  if (message.system) {
    return `<div class="message system">${message.text}</div>`;
  }

  const isOwn = message.mine || message.from === state.user.id;
  const member = memberForMessage(pot, message);
  const isHostMessage = message.from === pot.host.id;
  const avatar = member.avatar || member.name[0];

  return `
    <div class="message-row ${isOwn ? 'is-own' : ''}">
      ${isOwn ? '' : `<div class="message-profile">${avatar}</div>`}
      <div class="message-body">
        ${isOwn ? '' : `
          <div class="message-name">
            <span>${member.name}</span>
            ${isHostMessage ? '<span class="host-badge">방장</span>' : ''}
          </div>
        `}
        <div class="message ${isOwn ? 'mine' : ''}">${message.text}</div>
      </div>
    </div>
  `;
}

function renderChat() {
  const pot = potById(state.selectedPotId || state.activeChatId) || state.pots[0];
  state.selectedPotId = pot.id;
  const chat = state.chats[pot.id] || { messages: [] };
  const isHost = pot.host.id === state.user.id;

  app.innerHTML = `
    <section class="screen">
      <header class="chat-header">
        <div class="topbar">
          <strong>${pot.title}</strong>
          <span>${pot.currentMembers}/${pot.maxMembers}명</span>
        </div>
        <span class="status-pill">${pot.settlementStatus}</span>
      </header>
      ${isHost ? `
        <div class="host-actions">
          <button type="button" data-close-pot="${pot.id}">모집 마감하기</button>
          <button type="button" data-route="settlement">정산 요청하기</button>
          <button type="button" data-manage="${pot.id}">참여자 관리하기</button>
        </div>
      ` : ''}
      <div class="announcement">방장 공지: 만남 장소와 정산 금액은 채팅에서 한 번 더 확인해요.</div>
      <section class="chat-list">
        ${chat.messages.map((message) => renderMessage(pot, message)).join('')}
      </section>
      <article class="glass-card">
        <div class="info-row"><span>내 정산 상태</span><strong>${pot.settlementStatus}</strong></div>
        <div class="info-row"><span>예상 결제 금액</span><strong>${won(pot.perPersonAmount)}</strong></div>
      </article>
      <div class="chat-input">
        <input id="message-input" placeholder="메시지 입력">
        <button class="gradient-button" type="button" data-send-message="${pot.id}">보내기</button>
      </div>
    </section>
    ${nav('chat')}
  `;
}

function renderSettlement() {
  const pot = potById(state.selectedPotId);
  const participants = pot.participants || [];
  const perPerson = Math.ceil(Number(state.settlementTotal || 0) / Math.max(participants.length, 1));

  app.innerHTML = `
    <section class="screen">
      <header class="topbar">${backButton('chat')}<span class="status-pill">정산</span></header>
      <div class="page-title"><h1>정산 요청하기</h1><p>총 금액을 입력하면 1인당 금액이 자동 계산돼요.</p></div>
      <div class="form-stack">
        <label class="form-field">
          <span>총 금액</span>
          <input id="settlement-total" type="number" value="${state.settlementTotal}">
        </label>
        <article class="glass-card">
          <div class="info-row"><span>참여자 수</span><strong>${participants.length}명</strong></div>
          <div class="info-row"><span>1인당 금액</span><strong>${won(perPerson)}</strong></div>
        </article>
        <button class="gradient-button full-button" type="button" data-request-settlement="${pot.id}">정산 요청 보내기</button>
        <div class="detail-stack">
          ${participants.map((member) => `
            <div class="settlement-row">
              <div><strong>${member.name}</strong><br><span>${member.paid ? '정산 완료' : '미정산'}</span></div>
              ${member.paid ? '<span class="status-pill">완료</span>' : `<button class="ghost-button" type="button" data-remind="${member.name}">리마인드</button>`}
            </div>
          `).join('')}
        </div>
      </div>
    </section>
    ${nav('chat')}
  `;
}

function historyCard(payment) {
  return `
    <article class="history-card">
      <div><strong>${payment.title}</strong><br><span>${payment.category} · ${payment.date}</span></div>
      <div><strong>${won(payment.amount)}</strong><br><span>${payment.status}</span></div>
    </article>
  `;
}

function renderMy() {
  const requested = state.payments.filter((payment) => payment.status === '정산 요청됨' || payment.status === '참여중');
  const completed = state.payments.filter((payment) => payment.status === '정산 완료' || payment.status === '충전 완료');

  app.innerHTML = `
    <section class="screen">
      <div class="page-title"><h1>My 결제</h1><p>포인트와 팟별 결제 상태를 한 번에 확인해요.</p></div>
      <article class="glass-card wallet-card">
        <span>내 포인트 잔액</span>
        <strong class="price-xl">${won(state.pointBalance)}</strong>
        <button class="secondary-button full-button" type="button" data-charge="10000">포인트 충전</button>
      </article>
      <section class="payment-stack">
        <h2>참여 중인 팟의 결제 상태</h2>
        ${requested.map(historyCard).join('') || '<div class="empty-state">대기 중인 결제가 없어요.</div>'}
        <h2>정산 완료 내역</h2>
        ${completed.map(historyCard).join('') || '<div class="empty-state">완료 내역이 없어요.</div>'}
        <h2>최근 결제 내역</h2>
        ${core.getPaymentHistory(state).map(historyCard).join('')}
      </section>
    </section>
    ${nav('my')}
  `;
}

function extraFields(category) {
  const groups = {
    '배달팟': [['menu', '메뉴'], ['orderTime', '주문 예정 시간']],
    '택시팟': [['start', '출발지'], ['destination', '도착지'], ['departureTime', '출발 시간']],
    '구독팟': [['serviceName', '구독 서비스명'], ['period', '이용 기간']],
    '기타팟': [['purpose', '팟 목적'], ['place', '장소']]
  };

  return groups[category].map(([name, label]) => `
    <label class="form-field"><span>${label}</span><input name="${name}" placeholder="${label} 입력"></label>
  `).join('');
}

function renderCreate() {
  const category = state.createCategory || '배달팟';

  app.innerHTML = `
    <section class="screen">
      <div class="page-title"><h1>팟 만들기</h1><p>근처 메이트와 나눌 새 팟을 열어보세요.</p></div>
      <form id="create-form" class="form-stack">
        <label class="form-field"><span>카테고리</span><select name="category" id="create-category">${categories.slice(1).map((item) => `<option ${item === category ? 'selected' : ''}>${item}</option>`).join('')}</select></label>
        <label class="form-field"><span>팟 제목</span><input name="title" required placeholder="예: 마라탕 배달 같이 시켜요"></label>
        <label class="form-field"><span>모집 인원</span><input name="maxMembers" type="number" min="2" value="4"></label>
        <label class="form-field"><span>예상 1인 금액</span><input name="perPersonAmount" type="number" value="8000"></label>
        <label class="form-field"><span>위치 또는 수령지</span><input name="location" required placeholder="가천대 정문"></label>
        <label class="form-field"><span>마감 시간</span><input name="deadline" placeholder="오늘 22:00"></label>
        ${extraFields(category)}
        <label class="form-field"><span>설명</span><textarea name="description" placeholder="메이트에게 보여줄 설명"></textarea></label>
        <button class="gradient-button full-button" type="submit">팟 생성</button>
      </form>
    </section>
    ${nav('create')}
  `;
}

function render() {
  if (state.route === 'onboarding') renderOnboarding();
  if (state.route === 'home') renderHome();
  if (state.route === 'detail') renderDetail();
  if (state.route === 'confirm') renderConfirm();
  if (state.route === 'chat') renderChat();
  if (state.route === 'settlement') renderSettlement();
  if (state.route === 'my') renderMy();
  if (state.route === 'create') renderCreate();
}

app.addEventListener('click', (event) => {
  const routeButton = event.target.closest('[data-route]');
  const potCardButton = event.target.closest('[data-pot-id]');
  const joinButton = event.target.closest('[data-join-id]');
  const confirmJoin = event.target.closest('[data-confirm-join]');
  const charge = event.target.closest('[data-charge]');
  const requestSettlement = event.target.closest('[data-request-settlement]');
  const remind = event.target.closest('[data-remind]');
  const sendMessage = event.target.closest('[data-send-message]');
  const closePot = event.target.closest('[data-close-pot]');
  const manage = event.target.closest('[data-manage]');

  if (joinButton) {
    event.stopPropagation();
    setRoute('confirm', joinButton.dataset.joinId);
  } else if (potCardButton) {
    setRoute('detail', potCardButton.dataset.potId);
  } else if (routeButton) {
    setRoute(routeButton.dataset.route);
  } else if (confirmJoin) {
    state = core.joinPot(state, confirmJoin.dataset.confirmJoin);
    state.activeChatId = confirmJoin.dataset.confirmJoin;
    showToast('참여가 확정됐어요. 채팅방으로 이동합니다.');
    setRoute('chat', confirmJoin.dataset.confirmJoin);
  } else if (charge) {
    state = core.chargePoints(state, Number(charge.dataset.charge));
    showToast('포인트 10,000원이 충전됐어요.');
    render();
  } else if (requestSettlement) {
    state = core.requestSettlement(state, requestSettlement.dataset.requestSettlement, state.settlementTotal);
    showToast(`팟메이트 정산 요청이 도착했어요. ${won(potById(requestSettlement.dataset.requestSettlement).perPersonAmount)}을 결제해주세요.`);
    render();
  } else if (remind) {
    showToast(core.sendReminder(remind.dataset.remind));
  } else if (sendMessage) {
    const input = document.querySelector('#message-input');
    const text = input.value.trim();
    if (!text) return;
    const potId = sendMessage.dataset.sendMessage;
    state.chats[potId] = state.chats[potId] || { potId, messages: [] };
    state.chats[potId].messages.push({ from: state.user.id, name: state.user.name, text, mine: true });
    render();
  } else if (closePot) {
    showToast('모집을 마감했어요.');
  } else if (manage) {
    showToast('참여자 관리 상태를 확인했어요.');
  }
});

app.addEventListener('input', (event) => {
  if (event.target.id === 'search-input') {
    state.query = event.target.value;
    renderHome();
  }

  if (event.target.id === 'settlement-total') {
    state.settlementTotal = Number(event.target.value || 0);
    renderSettlement();
  }
});

app.addEventListener('change', (event) => {
  if (event.target.id === 'create-category') {
    state.createCategory = event.target.value;
    renderCreate();
  }
});

app.addEventListener('click', (event) => {
  const category = event.target.closest('[data-category]');
  if (!category) return;
  state.selectedCategory = category.dataset.category;
  renderHome();
});

app.addEventListener('submit', (event) => {
  if (event.target.id !== 'create-form') return;
  event.preventDefault();
  const formData = new FormData(event.target);
  const input = Object.fromEntries(formData.entries());
  const pot = core.createPot({ ...input, host: { id: state.user.id, name: state.user.name, avatar: '나', isMe: true } });
  state.pots.unshift(pot);
  state.activeChatId = pot.id;
  state.chats[pot.id] = { potId: pot.id, messages: [{ from: 'system', text: '새 팟이 만들어졌어요.', system: true }] };
  showToast('팟이 생성되어 홈 리스트에 추가됐어요.');
  setRoute('home');
});

render();
