(function (global) {
  const data = {
    menus: [
      {
        id: 'teriyaki',
        name: '기본 야끼소바',
        subtitle: '달콤한 데리야끼 풍미, 가장 익숙한 시그니처 메뉴',
        price: 11000,
        badge: 'SIGNATURE',
        imagePath: './assets/images/menu/base-yakisoba.jpg',
        imageAlt: '기본 야끼소바 실사 사진'
      },
      {
        id: 'shio',
        name: '소금 야끼소바',
        subtitle: '깔끔하고 고소한 풍미, 해산물 토핑과 잘 어울리는 메뉴',
        price: 11000,
        badge: 'SEAFOOD PICK',
        imagePath: './assets/images/menu/shio-yakisoba.jpg',
        imageAlt: '소금 야끼소바 실사 사진'
      }
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
      { id: 'cider', name: '사이다', price: 2000 },
      { id: 'draft-beer', name: '생맥주', price: 5000 },
      { id: 'highball', name: '하이볼', price: 7000 }
    ],
    defaultComboStats: {
      teriyaki: {
        '계란 프라이 추가|치즈 추가': 9,
        '비엔나|치즈 추가': 6
      },
      shio: {
        '면 추가|오징어새우': 10,
        '계란 프라이 추가|오징어새우': 7
      }
    },
    storageKey: 'yakitei.combo-stats.v1'
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = data;
  }

  global.KioskData = data;
})(typeof globalThis !== 'undefined' ? globalThis : window);
