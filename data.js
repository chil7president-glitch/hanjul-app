/* 한줄 기본 데이터 — 단가·패키지·안내 문구를 바꾸려면 이 파일을 고치세요. */
window.HJ = (function () {
  // 단가표: [id, 그룹, 항목명, 타일 기준, 폴리, 스타라이크]
  var ITEMS = [
    ['entry', 'floor', '현관', '600×600 기준', 50000, 100000],
    ['bathFloorC', 'floor', '공용 욕실 바닥', '300×300 기준', 100000, 200000],
    ['bathFloorM', 'floor', '안방 욕실 바닥', '300×300 기준', 150000, 300000],
    ['laundryL', 'floor', '세탁실 (큰 사이즈)', '300×300 기준', 120000, 200000],
    ['laundryS', 'floor', '세탁실 (작은 사이즈)', '300×300 기준', 100000, 160000],
    ['veranda', 'floor', '안방 베란다', '300×300 기준', 100000, 150000],
    ['living59', 'floor', '거실 59타입', '600×600 기준', 500000, 900000],
    ['living84', 'floor', '거실 84타입', '600×600 기준', 600000, 1100000],
    ['booth', 'wall', '부스 내부 3면', '600×300 기준', 120000, 240000],
    ['tub', 'wall', '욕조 ㄷ 3면', '600×300 기준', 120000, 240000],
    ['wallC', 'wall', '공용 욕실 전체 벽면', '600×300 기준', 300000, 500000],
    ['wallM', 'wall', '안방 욕실 전체 벽면', '600×300 기준', 350000, 600000],
    ['kitchenWall', 'wall', '주방 벽면', '600×300 기준', 120000, 200000],
    ['silBath', 'sil', '욕실 2곳', '', 50000, 50000],
    ['silShelf', 'sil', '주방 선반', '', 50000, 50000],
    ['silTub', 'sil', '욕조 테두리', '', 50000, 50000]
  ];
  var GROUPS = [['floor', '바닥 줄눈'], ['wall', '벽 줄눈'], ['sil', '실리콘 오염방지 코팅']];
  var EXCLUSIVE = { laundryL: 'laundryS', laundryS: 'laundryL', living59: 'living84', living84: 'living59' };
  var MUST = ['entry', 'bathFloorC', 'bathFloorM', 'silBath', 'silShelf', 'silTub'];
  // [id, 이름, 설명, 포함 항목, 폴리, 스타라이크]
  var PACKS = [
    ['must', '필수패키지', '현관 + 욕실 바닥(공용·안방) + 실리콘 오염방지 코팅', MUST, 350000, 650000],
    ['rec', '추천패키지', '필수패키지 + 부스 내부 3면', MUST.concat(['booth']), 470000, 850000],
    ['value', '실속패키지', '추천패키지 + 욕조 ㄷ 3면', MUST.concat(['booth', 'tub']), 590000, 1100000],
    ['premium', '프리미엄패키지', '필수패키지 + 욕실 전체 벽면(공용·안방)', MUST.concat(['wallC', 'wallM']), 1000000, 1500000]
  ];
  var ACCEL = 100000; // 스타라이크 속경제
  var MATS = [['poly', '폴리', '폴리우레아'], ['star', '스타라이크', '에폭시']];

  var GROUTS = [
    ['white', '화이트', '#F1EFEA', '오염이 잘 보여요', 'assets/grout-white.jpg'],
    ['silver', '실버그레이', '#B9BCBC', '가장 많이 골라요', 'assets/grout-silver.jpg'],
    ['gray', '그레이', '#878D8E', '관리가 편해요', 'assets/grout-gray.jpg'],
    ['charcoal', '차콜', '#4A4E50', '모던한 느낌', 'assets/grout-charcoal.jpg'],
    ['beige', '베이지', '#CBBDA3', '따뜻한 느낌', 'assets/grout-beige.jpg'],
    ['black', '블랙', '#242627', '대비가 강해요', 'assets/grout-black.jpg']
  ];

  var GUIDE = [
    ['1단계', '탄성코트', [['a1', '시공 공간 정하기 (베란다·다용도실·실외기실)'], ['a2', '탄성코트 색상 정하기'], ['a3', '탄성코트 일정 예약', 1]]],
    ['2단계', '줄눈', [['b1', '줄눈 색상 정하기', 'color'], ['b2', '시공 위치 정하기 (욕실·현관·주방)'], ['b3', '줄눈 시공 예약', 1]]],
    ['3단계', '입주청소', [['c1', '입주청소 예약', 1], ['c2', '청소 후 마감 상태 확인']]],
    ['4단계', '나노코팅', [['d1', '코팅할 곳 정하기 (욕실 도기·주방 상판)'], ['d2', '나노코팅 예약', 1]]],
    ['5단계', '새집증후군', [['e1', '시공 방식 상담받기'], ['e2', '새집증후군 시공 예약', 1], ['e3', '시공 후 환기하기']]]
  ];

  var NOTICES = [
    { title: '줄눈 스케줄 편성 및 사후관리 안내', lines: [
      '시공을 원하시는 날로부터 최소 1개월 이전에 예약해 주셔야 합니다.',
      '14일 이전에 취소 시 계약금은 전액 환불됩니다.',
      '줄눈 시공일로부터 2개월 이내 하자 보수 완료 시 1회 무상 A/S입니다.',
      '무상 서비스로 시공된 싱크대, 욕조테두리, 세면대 항목은 A/S 자체가 불가합니다.'
    ] },
    { title: 'A/S 기간', lines: ['실리콘 오염방지 줄눈 1년 / 바닥 및 벽 줄눈 2년 무상 A/S'] },
    { title: '추가요금 발생 안내', lines: [
      '타일 크기가 기준보다 작은 경우 (현관 및 현관 펜트리 600×600, 화장실 바닥 및 세탁실·베란다 300×300, 화장실 및 주방 벽면 600×300, 거실 600×600)',
      '거실을 넓힌 경우 (방 1개를 터서 거실이 넓어진 경우)',
      '스타라이크 속경제를 사용하는 경우 (100,000원 추가)',
      '구축인 경우',
      '현관이 타일이 아닌 대리석일 경우 시공이 불가할 수 있습니다.'
    ] },
    { title: '줄눈 작업 안내사항', lines: [
      '줄눈 시공은 기계 작업이 아닌 모든 작업이 100% 수작업이므로 모든 부분이 일정하고 똑같을 수 없습니다.',
      '실리콘 마감, 타일 시공 마감에 따라 줄눈 시공 후 이질감이 발생될 수 있습니다.',
      '토·일요일·공휴일은 시공이 불가합니다.'
    ] }
  ];

  // 서버(구글 시트)에 사례가 하나도 없을 때만 보여주는 예시
  var SAMPLE_CASES = [
    { id: 'sample1', apt: '[예시] 한줄센트럴파크', svcs: ['줄눈'], color: '화이트', memo: '전후 비교 예시예요. 사진 위를 좌우로 밀어보세요.', before: 'assets/original.jpg', after: 'assets/grout-white.jpg', date: '2026.10.12' },
    { id: 'sample2', apt: '[예시] 한줄센트럴파크', svcs: ['줄눈', '입주청소'], color: '차콜', memo: '같은 단지 차콜 줄눈 예시예요.', before: 'assets/original.jpg', after: 'assets/grout-charcoal.jpg', date: '2026.10.12' }
  ];

  function won(n) { return Number(n || 0).toLocaleString('ko-KR') + '원'; }
  function num(v) { var n = parseInt(String(v == null ? '' : v).replace(/\D/g, ''), 10); return isNaN(n) ? 0 : n; }
  function item(id) { return ITEMS.find(function (x) { return x[0] === id; }); }
  function pack(id) { return PACKS.find(function (x) { return x[0] === id; }); }

  // 계약 금액: 패키지 + 패키지 밖 항목 단가 + 속경제 + 입주청소
  function price(sel, mat, packId, accel, cleanAmt) {
    var col = mat === 'star' ? 5 : 4;
    var p = pack(packId);
    var inPack = p ? p[3] : [];
    var lines = [], total = 0;
    if (p) { lines.push([p[1], p[col]]); total += p[col]; }
    ITEMS.forEach(function (it) {
      if (sel[it[0]] && inPack.indexOf(it[0]) < 0) { lines.push([it[2], it[col]]); total += it[col]; }
    });
    if (mat === 'star' && accel) { lines.push(['스타라이크 속경제', ACCEL]); total += ACCEL; }
    if (cleanAmt > 0) { lines.push(['입주청소', cleanAmt]); total += cleanAmt; }
    return { lines: lines, total: total };
  }

  // 견적: 고른 항목을 가장 저렴하게 (패키지 포함) 계산
  function bestPrice(ids, mat) {
    var col = mat === 'star' ? 5 : 4;
    var unit = function (id) { var it = item(id); return it ? it[col] : 0; };
    var best = ids.reduce(function (a, id) { return a + unit(id); }, 0), bestPack = '';
    if (!ids.length) return { total: 0, pack: '' };
    PACKS.forEach(function (p) {
      var cost = p[col] + ids.filter(function (id) { return p[3].indexOf(id) < 0; }).reduce(function (a, id) { return a + unit(id); }, 0);
      if (cost <= best) { best = cost; bestPack = p[1]; }
    });
    return { total: best, pack: bestPack };
  }

  return { ITEMS: ITEMS, GROUPS: GROUPS, EXCLUSIVE: EXCLUSIVE, PACKS: PACKS, ACCEL: ACCEL, MATS: MATS, GROUTS: GROUTS, GUIDE: GUIDE, NOTICES: NOTICES, SAMPLE_CASES: SAMPLE_CASES, won: won, num: num, item: item, pack: pack, price: price, bestPrice: bestPrice };
})();
