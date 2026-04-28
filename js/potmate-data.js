window.PotMateSeed = {
  user: { id: 'me', name: '민아', campus: '가천대학교', role: 'student' },
  pointBalance: 18000,
  activeChatId: 'pot-delivery-1',
  pots: [
    {
      id: 'pot-delivery-1',
      title: '마라탕 배달 같이 시켜요',
      category: '배달팟',
      host: { id: 'host-1', name: '수빈', avatar: '수' },
      currentMembers: 2,
      maxMembers: 4,
      perPersonAmount: 12000,
      location: '가천대 비전타워 1층',
      distance: 350,
      deadline: '18분 남음',
      description: '최소주문금액 맞춰서 마라탕이랑 꿔바로우 같이 주문해요.',
      settlementStatus: '정산 대기',
      safePay: true,
      participants: [
        { id: 'host-1', name: '수빈', avatar: '수', paid: true },
        { id: 'mate-1', name: '지민', avatar: '지', paid: false }
      ],
      detail: { menu: '마라탕, 꿔바로우', pickup: '비전타워 1층 로비', orderTime: '오늘 18:40' }
    },
    {
      id: 'pot-taxi-1',
      title: '강남역 가는 택시팟',
      category: '택시팟',
      host: { id: 'me', name: '민아', avatar: '나', isMe: true },
      currentMembers: 3,
      maxMembers: 4,
      perPersonAmount: 6500,
      location: '가천대 정문',
      distance: 120,
      deadline: '오늘 21:10',
      description: '강남역 11번 출구까지 바로 가요. 늦지 않게 정문에서 만나요.',
      settlementStatus: '정산 대기',
      safePay: true,
      participants: [
        { id: 'me', name: '민아', avatar: '나', paid: true, isMe: true },
        { id: 'mate-2', name: '도윤', avatar: '도', paid: false },
        { id: 'mate-3', name: '하린', avatar: '하', paid: false }
      ],
      detail: { start: '가천대 정문', destination: '강남역 11번 출구', departureTime: '오늘 21:20', taxiFare: '26,000원 예상' }
    },
    {
      id: 'pot-sub-1',
      title: '넷플릭스 프리미엄 4인팟',
      category: '구독팟',
      host: { id: 'host-3', name: '유진', avatar: '유' },
      currentMembers: 3,
      maxMembers: 4,
      perPersonAmount: 4250,
      location: '온라인 공유',
      distance: 0,
      deadline: '오늘 23:50',
      description: '이번 달 넷플릭스 프리미엄 계정 같이 쓸 분 구해요.',
      settlementStatus: '정산 요청됨',
      safePay: true,
      participants: [
        { id: 'host-3', name: '유진', avatar: '유', paid: true },
        { id: 'mate-4', name: '서연', avatar: '서', paid: true },
        { id: 'mate-5', name: '준호', avatar: '준', paid: false }
      ],
      detail: { serviceName: '넷플릭스 프리미엄', period: '2026.05.01 - 2026.05.31', subscriptionAmount: '1인 4,250원' }
    },
    {
      id: 'pot-etc-1',
      title: '팀플 간식 공동구매',
      category: '기타팟',
      host: { id: 'host-4', name: '태희', avatar: '태' },
      currentMembers: 5,
      maxMembers: 8,
      perPersonAmount: 3000,
      location: '중앙도서관 라운지',
      distance: 480,
      deadline: '내일 13:00',
      description: '팀플하면서 먹을 쿠키랑 커피를 같이 사요.',
      settlementStatus: '정산 대기',
      safePay: true,
      participants: [
        { id: 'host-4', name: '태희', avatar: '태', paid: true },
        { id: 'mate-6', name: '민재', avatar: '민', paid: false }
      ],
      detail: { purpose: '팀플 간식 공동구매', place: '중앙도서관 라운지', estimatedAmount: '총 24,000원 예상' }
    }
  ],
  chats: {
    'pot-delivery-1': {
      potId: 'pot-delivery-1',
      messages: [
        { from: 'host-1', name: '수빈', text: '마라맛은 2단계로 괜찮나요?', mine: false },
        { from: 'mate-1', name: '지민', text: '좋아요. 저는 숙주 추가할게요.', mine: false }
      ]
    },
    'pot-taxi-1': {
      potId: 'pot-taxi-1',
      messages: [
        { from: 'me', name: '민아', text: '21시 20분에 정문 앞에서 출발할게요.', mine: true },
        { from: 'mate-2', name: '도윤', text: '도착하면 알려주세요!', mine: false }
      ]
    }
  },
  settlements: [
    { id: 'set-1', potId: 'pot-sub-1', title: '넷플릭스 프리미엄 4인팟', amount: 4250, status: '정산 요청됨', date: '오늘' }
  ],
  payments: [
    { id: 'pay-1', potId: 'pot-sub-1', title: '넷플릭스 프리미엄 4인팟', category: '구독팟', amount: 4250, status: '정산 요청됨', date: '오늘' },
    { id: 'pay-2', potId: 'old-1', title: '어제 치킨 배달팟', category: '배달팟', amount: 9800, status: '정산 완료', date: '어제' }
  ]
};
