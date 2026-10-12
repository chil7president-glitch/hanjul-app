/* 한줄 웹앱 — 화면과 동작 */
(function () {
  'use strict';
  var CFG = window.HANJUL_CONFIG || {};
  var BIZ = CFG.BUSINESS || {};
  var app = document.getElementById('app');

  // ---------- helpers ----------
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function load(key, fallback) { try { var v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; } catch (e) { return fallback; } }
  function save(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }
  function fmtPhone(v) {
    var n = String(v || '').replace(/\D/g, '').slice(0, 11);
    return n.length < 4 ? n : n.length < 8 ? n.slice(0, 3) + '-' + n.slice(3) : n.slice(0, 3) + '-' + n.slice(3, n.length - 4) + '-' + n.slice(-4);
  }
  function pad(n) { return ('0' + n).slice(-2); }
  function todayKo() { var d = new Date(); return d.getFullYear() + '년 ' + (d.getMonth() + 1) + '월 ' + d.getDate() + '일'; }
  function stamp() { var d = new Date(); return d.getFullYear() + '.' + pad(d.getMonth() + 1) + '.' + pad(d.getDate()); }
  var toastTimer = null;
  function toast(msg) {
    var old = document.querySelector('.toast'); if (old) old.remove();
    var t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.appendChild(t);
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.remove(); }, 3200);
  }

  // ---------- server (Google Apps Script) ----------
  var API = {
    ready: !!CFG.API_URL,
    get: function (action) {
      if (!CFG.API_URL) return Promise.reject(new Error('noapi'));
      return fetch(CFG.API_URL + '?action=' + encodeURIComponent(action), { method: 'GET' })
        .then(function (r) { return r.json(); })
        .then(function (j) { if (!j || !j.ok) throw new Error((j && j.error) || 'fail'); return j; });
    },
    post: function (payload) {
      if (!CFG.API_URL) return Promise.reject(new Error('noapi'));
      return fetch(CFG.API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) })
        .then(function (r) { return r.json(); })
        .then(function (j) { if (!j || !j.ok) throw new Error((j && j.error) || 'fail'); return j; });
    }
  };

  // ---------- icons ----------
  var I = {
    back: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>',
    next: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>',
    close: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>',
    home: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>',
    grid: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h18M12 3v18"/></svg>',
    cal: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
    doc: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 17c1.5-2 2.5-2 3.5 0s2 2 3.5-.5"/></svg>',
    check: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
    photo: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></svg>',
    camera: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
    pen: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
    ok: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#C9A46A" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>',
    tick: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>',
    down: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>',
    share: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>',
    plus: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    arrows: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#21412F" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l-6 6 6 6M15 6l6 6-6 6"/></svg>',
    chev: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B8915A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
    mark: '<svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true"><rect x="1" y="1" width="24" height="24" rx="6" fill="#21412F"/><rect x="5" y="12" width="16" height="2.4" rx="1.2" fill="#C9A46A"/></svg>'
  };

  // ---------- state ----------
  var now = new Date();
  var S = {
    route: '',
    home: load('hanjul-home', { apt: '', dong: '', ho: '', date: '' }),
    homeDraft: null,
    guide: load('hanjul-guide', {}),
    color: { room: 'bath', grout: 'gray', tile: 'mine', user: null, mineHex: '#C9C7C2', busy: false, err: '' },
    quote: {
      svc: { grout: true, clean: true }, build: 'new', size: 34, baths: 2, material: 'poly',
      spots: { bathFloor: true, bathWall: false, showerWall: false, entry: true, kitchen: false, veranda: false },
      view: { y: now.getFullYear(), m: now.getMonth() }, day: null,
      sheet: null, phone: '', memo: '', agree: false, formErr: '', sending: false
    },
    cases: { list: null, loading: false, error: '', filter: null, pos: {} },
    contract: null,
    admin: { pw: sessionStorage.getItem('hanjul-admin') || '', authed: !!sessionStorage.getItem('hanjul-admin'), list: null, form: null, err: '', busy: false, loginErr: '' },
    install: null
  };

  // ---------- routing ----------
  function go(route) { location.hash = '#/' + route; }
  function currentRoute() {
    var r = location.hash.replace(/^#\/?/, '');
    if (!r) return load('hanjul-intro-seen', false) ? 'home' : 'intro';
    return r;
  }
  window.addEventListener('hashchange', function () { S.route = currentRoute(); onEnter(); render(true); });

  function onEnter() {
    if (S.route === 'cases') loadCases();
    if (S.route === 'quote' && S.quote.sheet === 'done') { S.quote.sheet = null; S.quote.memo = ''; S.quote.agree = false; }
    if (S.route === 'contract' && !S.contract) S.contract = newContract();
    if (S.route === 'admin' && S.admin.authed && !S.admin.list) adminLoad();
  }

  // ---------- render with focus restore ----------
  var sigStrokes = [];
  function render(scrollTop) {
    var active = document.activeElement, fid = active && active.id, sel = null;
    if (fid && active.setSelectionRange && typeof active.selectionStart === 'number') sel = [active.selectionStart, active.selectionEnd];
    var view = ({ intro: viewIntro, home: viewHome, color: viewColor, quote: viewQuote, guide: viewGuide, cases: viewCases, contract: viewContract, admin: viewAdmin })[S.route] || viewHome;
    app.innerHTML = view();
    if (scrollTop) window.scrollTo(0, 0);
    if (fid) {
      var el = document.getElementById(fid);
      if (el) { el.focus({ preventScroll: true }); if (sel && el.setSelectionRange) { try { var L = el.value.length; el.setSelectionRange(Math.min(sel[0], L), Math.min(sel[1], L)); } catch (e) {} } }
    }
    afterRender();
  }

  function afterRender() {
    if (S.route === 'intro') setupIntro();
    if (S.route === 'contract') setupSig();
    document.title = ({ intro: '한줄', home: '한줄 — 줄눈 · 입주청소 · 인테리어', color: '줄눈 색 고르기 · 한줄', quote: '견적·예약 · 한줄', guide: '입주 준비 코스 · 한줄', cases: '시공 사례 · 한줄', contract: '시공 계약서 · 한줄', admin: '관리자 · 한줄' })[S.route] || '한줄';
  }

  // ---------- shared pieces ----------
  function topbar(title, right) {
    return '<header class="topbar"><div class="left"><a class="icon-btn" href="#/home" aria-label="홈으로">' + I.back + '</a><h1>' + esc(title) + '</h1></div>' + (right || '') + '</header>';
  }
  function tabbar(active) {
    var tabs = [['home', '홈', I.home], ['color', '색상', I.grid], ['quote', '예약', I.cal], ['contract', '계약', I.doc], ['guide', '준비', I.check]];
    return '<nav class="tabbar" aria-label="메뉴">' + tabs.map(function (t) {
      return '<a href="#/' + t[0] + '"' + (active === t[0] ? ' aria-current="page"' : '') + '>' + t[2] + t[1] + '</a>';
    }).join('') + '</nav>';
  }
  function chip(label, on, act, data, cls) {
    return '<button type="button" class="chip' + (cls ? ' ' + cls : '') + '" aria-pressed="' + (on ? 'true' : 'false') + '" data-act="' + act + '"' + (data || '') + '>' + esc(label) + '</button>';
  }
  function bizFooter() {
    var parts = [BIZ.name || '한줄', BIZ.ceo ? '대표 ' + BIZ.ceo : '', BIZ.bizNo ? '사업자등록번호 ' + BIZ.bizNo : '', BIZ.phone ? '고객센터 ' + BIZ.phone : '', BIZ.address || ''].filter(Boolean);
    return '<div class="biz">' + esc(parts.join(' · ')) + '<br><a href="privacy.html">개인정보처리방침</a>' + (BIZ.kakao ? ' · <a href="' + esc(BIZ.kakao) + '" target="_blank" rel="noopener">카카오톡 상담</a>' : '') + '</div>';
  }

  // ======================================================
  // 진입 화면
  // ======================================================
  function viewIntro() {
    return '<div class="splash" id="splash"><div class="track"><div class="stage">' +
      '<div class="gold-line" id="sp-line" style="transform:scaleX(0)"></div>' +
      '<img class="logo" id="sp-logo" src="assets/logo.png" alt="한줄 로고" style="transform:scale(1.7)">' +
      '<p class="copy" id="sp-copy" style="opacity:0">입주 준비, 한 줄이면 충분해요</p>' +
      '<div class="hint" id="sp-hint"><span>아래로 스크롤</span><span class="bob">' + I.chev + '</span></div>' +
      '<div class="cta" id="sp-cta" style="opacity:0;pointer-events:none"><a class="btn btn-primary block" href="#/home" data-act="introDone">시작하기</a><span>줄눈 · 입주청소 · 인테리어</span></div>' +
      '</div></div></div>';
  }
  function setupIntro() {
    var sp = document.getElementById('splash');
    if (!sp) return;
    var logo = document.getElementById('sp-logo'), copy = document.getElementById('sp-copy'), line = document.getElementById('sp-line'), hint = document.getElementById('sp-hint'), cta = document.getElementById('sp-cta');
    var clamp = function (v) { return Math.max(0, Math.min(1, v)); };
    var update = function () {
      var max = sp.scrollHeight - sp.clientHeight, p = max > 0 ? sp.scrollTop / max : 0;
      var z = clamp(p / 0.75), e = 1 - Math.pow(1 - z, 3);
      logo.style.transform = 'scale(' + (1.7 - 0.7 * e).toFixed(3) + ')';
      var late = clamp((p - 0.6) / 0.3), end = clamp((p - 0.8) / 0.2);
      copy.style.opacity = late; copy.style.transform = 'translateY(' + ((1 - late) * 12) + 'px)';
      line.style.transform = 'scaleX(' + late + ')';
      hint.style.opacity = 1 - clamp(p / 0.15);
      cta.style.opacity = end; cta.style.pointerEvents = end > 0.5 ? 'auto' : 'none';
      cta.style.transform = 'translateY(' + ((1 - end) * 16) + 'px)';
    };
    sp.addEventListener('scroll', update, { passive: true });
    update();
  }

  // ======================================================
  // 홈
  // ======================================================
  function homeLabel() {
    var h = S.home;
    return h.apt ? h.apt + (h.dong ? ' ' + h.dong + '동' : '') + (h.ho ? ' ' + h.ho + '호' : '') : '우리 집 정보 입력';
  }
  function ddayLabel() {
    if (!S.home.date) return '입주일을 입력해 주세요';
    var p = S.home.date.split('-'), t = new Date(+p[0], +p[1] - 1, +p[2]), n0 = new Date(); n0.setHours(0, 0, 0, 0);
    var n = Math.round((t - n0) / 86400000);
    return n > 0 ? 'D-' + n : n === 0 ? 'D-Day · 오늘 입주해요' : '입주 ' + (-n) + '일째';
  }
  function guideCount() {
    var total = 0, done = 0;
    HJ.GUIDE.forEach(function (s) { s[2].forEach(function (it) { total++; if (S.guide[it[0]]) done++; }); });
    return { total: total, done: done };
  }
  function viewHome() {
    var g = guideCount(), pct = Math.round(g.done / g.total * 100);
    var cases = (S.cases.list && S.cases.list.length ? S.cases.list : HJ.SAMPLE_CASES).slice(0, 2);
    var standalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    var installCard = '';
    if (!standalone) {
      var ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
      installCard = '<section class="card" style="flex-direction:row;align-items:center;gap:14px"><img src="assets/icon-192.png" alt="" width="48" height="48" style="border-radius:12px;flex:none;box-shadow:0 0 0 1px #E6EAE8"><div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px"><b style="font-size:14px">한줄을 앱처럼 쓰기</b><span class="hint">' +
        (S.install ? '홈 화면에 아이콘을 추가해 두면 바로 열 수 있어요' : ios ? '사파리 아래 공유 버튼 → "홈 화면에 추가"를 눌러주세요' : '브라우저 메뉴(⋮) → "홈 화면에 추가"를 눌러주세요') +
        '</span></div>' + (S.install ? '<button type="button" class="chip" aria-pressed="true" data-act="install">추가</button>' : '') + '</section>';
    }
    return '<div class="screen with-tabbar">' +
      '<header class="topbar"><div class="brand">' + I.mark + '한줄</div><a class="icon-btn" href="#/cases" aria-label="시공 사례">' + I.photo + '</a></header>' +
      '<main class="content">' +
      '<section class="hero-copy"><p class="kicker">입주 준비, 한 줄이면 충분해요</p><h1>줄눈부터 입주청소까지<br>새 집의 첫 순간을 같이 준비해요</h1></section>' +
      '<section class="dday" aria-label="입주 D-day"><div class="top"><span class="lbl">입주까지</span><button type="button" class="edit" data-act="openHome">' + esc(homeLabel()) + ' ' + I.pen + '</button></div>' +
      '<div class="num">' + esc(ddayLabel()) + '</div><div class="bar"><i style="width:' + pct + '%"></i></div>' +
      '<div class="foot"><span>입주 준비 코스 ' + g.done + '/' + g.total + '</span><a href="#/guide">이어서 하기 →</a></div></section>' +
      '<section class="grid2">' +
      door('guide', I.check, '입주 준비 코스', '탄성코트부터 새집증후군까지') +
      door('color', I.grid, '줄눈 색 고르기', '우리 집 타일에 미리 대보기') +
      door('quote', I.cal, '견적·예약', '위치만 고르면 바로 계산') +
      door('cases', I.photo, '시공 사례', '우리 단지 시공 사진') +
      '</section>' +
      '<section style="display:flex;flex-direction:column;gap:10px"><div class="section-head"><h2>시공 사례</h2><a href="#/cases" style="font-size:13px;font-weight:600">단지별로 보기</a></div>' +
      '<div class="thumbs">' + cases.map(function (c) {
        return '<a href="#/cases"><img src="' + esc(c.after) + '" alt="' + esc(c.apt) + ' 시공 사진" loading="lazy">' + esc(c.apt.replace('[예시] ', '')) + (c.color ? ' · ' + esc(c.color) : '') + '</a>';
      }).join('') + '</div></section>' +
      installCard + bizFooter() +
      '</main>' + tabbar('home') + (S.homeDraft ? sheetHome() : '') + '</div>';
  }
  function door(route, icon, t, s) {
    return '<a class="door" href="#/' + route + '"><span style="color:var(--green)">' + icon.replace('width="22" height="22"', 'width="28" height="28"') + '</span><span style="display:flex;flex-direction:column;gap:2px"><span class="t">' + t + '</span><span class="s">' + s + '</span></span></a>';
  }
  function sheetHome() {
    var d = S.homeDraft;
    return '<div class="sheet-wrap"><button type="button" class="scrim" aria-label="닫기" data-act="closeHome"></button><div class="sheet" role="dialog" aria-modal="true" aria-label="우리 집 입주 정보"><div class="grabber"></div>' +
      '<div class="sheet-head"><h2>우리 집 입주 정보</h2><button type="button" class="icon-btn" aria-label="닫기" data-act="closeHome">' + I.close + '</button></div>' +
      '<label class="field" for="h-apt">아파트 단지명<input class="input" id="h-apt" type="text" placeholder="예) 한줄센트럴파크" value="' + esc(d.apt) + '" data-bind="homeDraft.apt"></label>' +
      '<div class="field"><span>동 · 호수</span><div class="row"><input class="input small" id="h-dong" type="text" inputmode="numeric" maxlength="4" aria-label="동" placeholder="101" value="' + esc(d.dong) + '" data-bind="homeDraft.dong" data-fmt="digits"><span style="margin-right:10px">동</span>' +
      '<input class="input small" id="h-ho" type="text" inputmode="numeric" maxlength="4" aria-label="호수" placeholder="1203" value="' + esc(d.ho) + '" data-bind="homeDraft.ho" data-fmt="digits"><span>호</span></div></div>' +
      '<label class="field" for="h-date">입주 예정일<input class="input" id="h-date" type="date" value="' + esc(d.date) + '" data-bind="homeDraft.date"><span class="hint" style="font-weight:500">입주일만 고르면 남은 일수는 자동으로 계산돼요</span></label>' +
      '<button type="button" class="btn btn-primary" data-act="saveHome">저장하기</button></div></div>';
  }

  // ======================================================
  // 줄눈 색 고르기
  // ======================================================
  function viewColor() {
    var c = S.color;
    var g = HJ.GROUTS.find(function (x) { return x[0] === c.grout; });
    var TILES = [['mine', '우리 집', c.mineHex], ['white', '화이트', '#F8F8F6'], ['beige', '베이지', '#E7DDCC']];
    var t = TILES.find(function (x) { return x[0] === c.tile; });
    var ROOMS = [['bath', '욕실'], ['entry', '현관'], ['kitchen', '주방'], ['veranda', '베란다']];
    var r = ROOMS.find(function (x) { return x[0] === c.room; });
    var preview;
    if (c.tile === 'mine') {
      preview = '<div class="preview"><img src="' + esc(c.user ? c.user[g[0]] : g[4]) + '" alt="우리 집 타일에 ' + esc(g[1]) + ' 줄눈을 입힌 사진"><span class="badge">' + (c.user ? '내 사진' : '예시 사진') + ' · ' + esc(g[1]) + '</span>' + (c.busy ? '<div class="busy">줄눈 찾는 중…</div>' : '') + '</div>';
    } else {
      var tiles = ''; for (var i = 0; i < 16; i++) tiles += '<i style="background-color:' + t[2] + '"></i>';
      preview = '<div class="tilegrid" style="background:' + g[2] + '" role="img" aria-label="' + esc(t[1]) + ' 타일에 ' + esc(g[1]) + ' 줄눈">' + tiles + '</div>';
    }
    return '<div class="screen with-tabbar">' + topbar('줄눈 색 고르기') +
      '<main class="content">' +
      '<div class="wrap">' + ROOMS.map(function (x) { return chip(x[1], x[0] === c.room, 'colorRoom', ' data-v="' + x[0] + '"'); }).join('') + '</div>' +
      preview +
      (c.err ? '<p class="note-err" role="alert">' + esc(c.err) + '</p>' : '') +
      '<div class="sel-info"><div class="a"><small>' + esc(r[1]) + ' · ' + esc(t[1]) + ' 타일</small><b>' + esc(g[1]) + '</b></div><span class="tip">' + esc(g[3]) + '</span></div>' +
      '<section style="display:flex;flex-direction:column;gap:10px"><h2 class="section-title">줄눈 색상</h2><div class="grid3">' +
      HJ.GROUTS.map(function (x) {
        return '<button type="button" class="swatch" aria-pressed="' + (x[0] === c.grout) + '" data-act="colorGrout" data-v="' + x[0] + '"><span class="dot" style="background:' + x[2] + '"></span>' + x[1] + '</button>';
      }).join('') + '</div></section>' +
      '<section style="display:flex;flex-direction:column;gap:10px"><h2 class="section-title">우리 집 타일 톤</h2><div class="row">' +
      TILES.map(function (x) { return chip(x[1], x[0] === c.tile, 'colorTile', ' data-v="' + x[0] + '"'); }).join('') + '</div>' +
      '<label class="upload">' + I.camera + (c.user ? '다른 타일 사진 올리기' : '우리 집 타일 사진 올리기') + '<input type="file" accept="image/*" aria-label="우리 집 타일 사진" data-file="colorPhoto"></label>' +
      (c.user ? '<button type="button" class="btn btn-ghost" data-act="colorReset">예시 사진으로 돌아가기</button>' : '') +
      '<p class="hint">줄눈이 잘 보이게 가까이에서 찍은 사진일수록 정확해요. 사진은 휴대폰 안에서만 처리되고 어디에도 올라가지 않아요.</p></section>' +
      '<a class="btn btn-primary" href="#/quote">이 색으로 견적 받기</a>' +
      '</main>' + tabbar('color') + '</div>';
  }

  // ======================================================
  // 견적·예약
  // ======================================================
  var MATS_Q = [['poly', '폴리', '폴리우레아'], ['star', '스타라이크', '에폭시'], ['undecided', '상담 후 결정', '추천받기']];
  var SPOTS = [['bathFloor', '욕실 바닥'], ['bathWall', '욕실 벽'], ['showerWall', '샤워부스 벽'], ['entry', '현관'], ['kitchen', '주방 벽'], ['veranda', '베란다']];
  var DOW = ['일', '월', '화', '수', '목', '금', '토'];
  function quoteCalc() {
    var q = S.quote, two = q.baths >= 2, want = [];
    if (q.spots.entry) want.push('entry');
    if (q.spots.bathFloor) { want.push('bathFloorC'); if (two) want.push('bathFloorM'); }
    if (q.spots.bathWall) { want.push('wallC'); if (two) want.push('wallM'); }
    if (q.spots.showerWall) want.push('booth');
    if (q.spots.kitchen) want.push('kitchenWall');
    if (q.spots.veranda) want.push('veranda');
    var best = HJ.bestPrice(want, q.material === 'star' ? 'star' : 'poly');
    var chosen = [];
    if (q.svc.grout) chosen.push('줄눈 시공');
    if (q.svc.clean) chosen.push('입주청소');
    var mat = MATS_Q.find(function (m) { return m[0] === q.material; });
    var summary = (chosen.length ? chosen.join('+') : '서비스 선택') + (q.svc.grout && q.material !== 'undecided' ? '(' + mat[1] + ')' : '') + ' ' + (q.build === 'new' ? '신축' : '구축') + q.size + '평';
    var vague = q.material === 'undecided' || q.build === 'old';
    var estimate = q.svc.grout && want.length ? '예상 ' + best.total.toLocaleString('ko-KR') + '원' + (vague ? '~' : '') : (q.svc.grout ? '시공 위치를 골라주세요' : '입주청소 상담 후 안내');
    var note = q.svc.grout && want.length ? [best.pack ? best.pack + ' 적용가' : '', q.material === 'undecided' ? '폴리 기준' : '', q.build === 'old' ? '구축 추가요금 별도' : '', q.svc.clean ? '입주청소 별도' : ''].filter(Boolean).join(' · ') || '줄눈 시공 기준' : '';
    var dateLabel = '';
    if (q.day) { var p = q.day.split('-'), dd = new Date(+p[0], +p[1] - 1, +p[2]); dateLabel = p[1] + '월 ' + p[2] + '일 (' + DOW[dd.getDay()] + ')'; }
    return { chosen: chosen, mat: mat, summary: summary, estimate: estimate, note: note, dateLabel: dateLabel, best: best };
  }
  function calendar() {
    var q = S.quote, v = q.view, t0 = new Date(); t0.setHours(0, 0, 0, 0);
    var first = new Date(v.y, v.m, 1).getDay(), nDays = new Date(v.y, v.m + 1, 0).getDate();
    var curMonth = v.y === t0.getFullYear() && v.m === t0.getMonth();
    var html = '<div class="cal-head"><button type="button" class="icon-btn" aria-label="이전 달" data-act="calPrev"' + (curMonth ? ' disabled style="opacity:.3"' : '') + '>' + I.back + '</button><b>' + v.y + '년 ' + (v.m + 1) + '월</b><button type="button" class="icon-btn" aria-label="다음 달" data-act="calNext">' + I.next + '</button></div><div class="cal">';
    DOW.forEach(function (d, i) { html += '<span class="dow' + (i === 0 ? ' sun' : '') + '">' + d + '</span>'; });
    for (var i = 0; i < first; i++) html += '<span></span>';
    for (var d = 1; d <= nDays; d++) {
      var dt = new Date(v.y, v.m, d), wd = dt.getDay();
      var off = dt < t0 || wd === 0 || wd === 6, key = v.y + '-' + pad(v.m + 1) + '-' + pad(d);
      var cls = (dt.getTime() === t0.getTime() ? 'today ' : '') + (wd === 0 ? 'sun' : '');
      html += '<button type="button" class="' + cls + '" aria-pressed="' + (q.day === key) + '" aria-label="' + (v.m + 1) + '월 ' + d + '일' + (off ? ' 선택 불가' : '') + '"' + (off ? ' disabled' : ' data-act="pickDay" data-v="' + key + '"') + '>' + d + '</button>';
    }
    return html + '</div>';
  }
  function viewQuote() {
    var q = S.quote, c = quoteCalc();
    var stepper = function (label, val, key) {
      return '<div class="stepper"><span style="font-size:15px">' + label + '</span><div class="ctrl"><button type="button" aria-label="' + label + ' 줄이기" data-act="step" data-k="' + key + '" data-d="-1">−</button><span class="val">' + val + '</span><button type="button" aria-label="' + label + ' 늘리기" data-act="step" data-k="' + key + '" data-d="1">+</button></div></div>';
    };
    var step = 3;
    var html = '<div class="screen with-footer">' + topbar('견적·예약') + '<main class="content">' +
      '<section class="card"><h2>1. 어떤 서비스가 필요하세요?</h2><div class="grid2">' +
      [['grout', '줄눈 시공', '욕실·현관·주방'], ['clean', '입주청소', '전 공간 청소']].map(function (x) {
        return '<button type="button" class="tile" style="min-height:76px" aria-pressed="' + !!q.svc[x[0]] + '" data-act="svc" data-v="' + x[0] + '"><span class="t" style="font-size:15px">' + x[1] + '</span><span class="s" style="font-size:12px">' + x[2] + '</span></button>';
      }).join('') + '</div></section>' +
      '<section class="card" style="gap:4px"><h2 style="margin-bottom:6px">2. 집 정보</h2>' +
      '<div class="stepper"><span style="font-size:15px">건물</span><div class="ctrl">' + [['new', '신축'], ['old', '구축']].map(function (b) {
        return '<button type="button" class="tile center" style="min-height:44px;min-width:64px;font-size:14px;font-weight:600" aria-pressed="' + (q.build === b[0]) + '" data-act="build" data-v="' + b[0] + '">' + b[1] + '</button>';
      }).join('') + '</div></div>' +
      stepper('평수', q.size + '평', 'size') + stepper('욕실 수', q.baths + '개', 'baths') + '</section>';
    if (q.svc.grout) {
      html += '<section class="card"><h2>' + (step++) + '. 줄눈 재료와 시공 위치</h2><div class="grid3">' +
        MATS_Q.map(function (m) { return '<button type="button" class="tile center" style="min-height:62px" aria-pressed="' + (q.material === m[0]) + '" data-act="material" data-v="' + m[0] + '"><span class="t">' + m[1] + '</span><span class="s">' + m[2] + '</span></button>'; }).join('') +
        '</div><span style="font-size:13px;font-weight:600;color:var(--muted)">시공 위치</span><div class="wrap">' +
        SPOTS.map(function (sp) { return chip(sp[1], !!q.spots[sp[0]], 'spot', ' data-v="' + sp[0] + '"', 'soft'); }).join('') + '</div></section>';
    } else step++;
    html += '<section class="card" style="gap:10px"><h2>' + step + '. 희망 날짜</h2>' + calendar() +
      (c.dateLabel ? '<p style="margin:0;font-size:14px;font-weight:600;color:var(--green)">선택한 날짜: ' + c.dateLabel + '</p>' : '') +
      '<p class="hint">입주청소는 줄눈 시공 후, 줄눈은 입주 최소 2일 전을 추천해요. 토·일요일·공휴일은 시공이 어려워요.</p></section>' +
      '</main><div class="footer-bar"><div class="sum-line"><span class="l">' + esc(c.summary) + '</span><span class="r">' + esc(c.estimate) + '</span></div>' +
      (c.note ? '<span class="note-gold" style="margin-top:-6px">' + esc(c.note) + '</span>' : '') +
      '<button type="button" class="btn btn-primary" data-act="openConsult">상담 예약 신청</button></div>' +
      (q.sheet ? sheetConsult(c) : '') + '</div>';
    return html;
  }
  function sheetConsult(c) {
    var q = S.quote;
    var inner;
    if (q.sheet === 'done') {
      inner = '<div class="done-box"><div class="mark">' + I.ok + '</div><h2>상담 신청이 접수됐어요</h2><p>' + esc(q.phone) + ' 번호로<br>담당자가 곧 연락드릴게요.</p></div><a class="btn btn-primary" href="#/home" data-act="closeConsult">홈으로</a>';
    } else {
      inner = '<div class="sheet-head"><h2>상담 예약 신청</h2><button type="button" class="icon-btn" aria-label="닫기" data-act="closeConsult">' + I.close + '</button></div>' +
        '<div class="callout" style="display:flex;flex-direction:column;gap:4px"><span style="font-size:12px;font-weight:600;color:var(--gold-t)">신청 내용</span><b style="font-size:14px;color:var(--ink)">' + esc(c.summary) + '</b><span style="font-size:13px;color:var(--muted)">희망 날짜: ' + esc(c.dateLabel || '상담 때 정하기') + ' · ' + esc(c.estimate) + '</span></div>' +
        '<label class="field" for="q-phone">연락처<input class="input" id="q-phone" type="tel" inputmode="numeric" autocomplete="tel" placeholder="010-0000-0000" value="' + esc(q.phone) + '" data-bind="quote.phone" data-fmt="phone"></label>' +
        '<label class="field" for="q-memo">문의 내용<textarea class="textarea" id="q-memo" rows="4" placeholder="예) 욕실 2곳 줄눈 + 입주청소 같이 하고 싶어요. 오후 시간 통화가 편해요." data-bind="quote.memo">' + esc(q.memo) + '</textarea></label>' +
        '<label class="check"><input type="checkbox" data-check="quote.agree"' + (q.agree ? ' checked' : '') + '>상담을 위한 개인정보(연락처) 수집·이용에 동의해요 <a href="privacy.html" target="_blank" style="font-size:12px;margin-left:auto">보기</a></label>' +
        (q.formErr ? '<p class="note-err" role="alert">' + esc(q.formErr) + '</p>' : '') +
        '<button type="button" class="btn btn-primary" data-act="sendConsult"' + (q.sending ? ' disabled' : '') + '>' + (q.sending ? '보내는 중…' : '신청하기') + '</button>';
    }
    return '<div class="sheet-wrap"><button type="button" class="scrim" aria-label="닫기" data-act="closeConsult"></button><div class="sheet" role="dialog" aria-modal="true" aria-label="상담 예약 신청"><div class="grabber"></div>' + inner + '</div></div>';
  }

  // ======================================================
  // 입주 준비 코스
  // ======================================================
  function viewGuide() {
    var g = guideCount(), pct = Math.round(g.done / g.total * 100);
    return '<div class="screen with-tabbar">' + topbar('입주 준비 코스') + '<main class="content">' +
      '<div style="display:flex;flex-direction:column;gap:8px"><div class="section-head"><span style="font-size:14px;color:var(--muted)">할 일 ' + g.done + '/' + g.total + ' 완료</span><b style="font-size:22px;color:var(--green)">' + pct + '%</b></div><div class="progress"><i style="width:' + pct + '%"></i></div></div>' +
      HJ.GUIDE.map(function (st) {
        return '<section class="stage-card"><div class="hd"><span class="when">' + st[0] + '</span><h2>' + st[1] + '</h2></div>' +
          st[2].map(function (it) {
            var on = !!S.guide[it[0]];
            var link = !on && it[2] === 1 ? '<a href="#/quote">예약 →</a>' : !on && it[2] === 'color' ? '<a href="#/color">고르기 →</a>' : '';
            return '<div class="todo"><button type="button" class="box" aria-pressed="' + on + '" aria-label="' + esc(it[1]) + (on ? ' 완료 취소' : ' 완료 표시') + '" data-act="todo" data-v="' + it[0] + '">' + (on ? I.tick : '') + '</button><span class="lbl' + (on ? ' done' : '') + '">' + esc(it[1]) + '</span>' + link + '</div>';
          }).join('') + '</section>';
      }).join('') + '</main>' + tabbar('guide') + '</div>';
  }

  // ======================================================
  // 시공 사례
  // ======================================================
  function loadCases() {
    if (S.cases.loading) return;
    if (!API.ready) { if (!S.cases.list) S.cases.list = []; return; }
    S.cases.loading = true;
    API.get('cases').then(function (j) {
      S.cases.list = j.cases || []; S.cases.error = '';
      save('hanjul-cases-cache', S.cases.list);
    }).catch(function () {
      S.cases.list = load('hanjul-cases-cache', []);
      S.cases.error = '사례를 불러오지 못했어요. 잠시 후 다시 열어주세요.';
    }).then(function () { S.cases.loading = false; if (S.route === 'cases' || S.route === 'home') render(); });
  }
  function caseCard(c, i) {
    var col = HJ.GROUTS.find(function (g) { return g[1] === c.color; });
    var pos = S.cases.pos[c.id] != null ? S.cases.pos[c.id] : 50;
    var media = c.before && c.after
      ? '<div class="compare" data-cmp="' + esc(c.id) + '"><img src="' + esc(c.after) + '" alt="' + esc(c.apt) + ' 시공 후" loading="lazy"><img class="bf" src="' + esc(c.before) + '" alt="' + esc(c.apt) + ' 시공 전" loading="lazy" style="clip-path:inset(0 ' + (100 - pos) + '% 0 0)"><div class="line" style="left:' + pos + '%"><span class="knob">' + I.arrows + '</span></div><span class="lab b">시공 전</span><span class="lab a">시공 후</span><input type="range" min="0" max="100" value="' + pos + '" aria-label="시공 전후 비교, 좌우로 밀어서 보기" data-range="' + esc(c.id) + '"></div>'
      : '<img class="single" src="' + esc(c.after) + '" alt="' + esc(c.apt) + ' 시공 사진" loading="lazy">';
    return '<article class="case">' + media + '<div class="body"><div class="title"><b>' + esc(c.apt) + '</b><small>' + esc(c.date) + '</small></div><div class="wrap" style="gap:6px">' +
      (c.svcs || []).map(function (s) { return '<span class="tag">' + esc(s) + '</span>'; }).join('') +
      (c.color ? '<span class="tag gold"><span class="dot" style="background:' + (col ? col[2] : '#878D8E') + '"></span>줄눈 ' + esc(c.color) + '</span>' : '') +
      '</div>' + (c.memo ? '<p>' + esc(c.memo) + '</p>' : '') + '</div></article>';
  }
  function viewCases() {
    var cs = S.cases;
    var list = cs.list && cs.list.length ? cs.list : (cs.list ? HJ.SAMPLE_CASES : []);
    var apts = [];
    list.forEach(function (x) { if (apts.indexOf(x.apt) < 0) apts.push(x.apt); });
    if (cs.filter === null && cs.list) cs.filter = apts.indexOf(S.home.apt) >= 0 ? S.home.apt : 'all';
    var filter = cs.filter || 'all';
    var shown = list.filter(function (x) { return filter === 'all' || x.apt === filter; });
    var body;
    if (cs.loading && !cs.list) body = '<div class="skeleton"></div><div class="skeleton"></div>';
    else if (!shown.length) body = '<div class="empty"><b>아직 이 단지 사례가 없어요</b><span>곧 시공 사진을 올려드릴게요</span></div>';
    else body = shown.map(caseCard).join('');
    return '<div class="screen with-tabbar">' + topbar('시공 사례') + '<main class="content">' +
      '<div class="chip-row" role="group" aria-label="아파트 단지">' + chip('전체', filter === 'all', 'caseFilter', ' data-v="all"') + apts.map(function (a) { return chip(a, filter === a, 'caseFilter', ' data-v="' + esc(a) + '"'); }).join('') + '</div>' +
      '<p class="hint" style="font-size:13px">' + esc(filter === 'all' ? '전체 단지' : filter) + ' · 사례 ' + shown.length + '건</p>' +
      (cs.error ? '<p class="note-err">' + esc(cs.error) + '</p>' : '') + body +
      '</main>' + tabbar('') + '</div>';
  }

  // ======================================================
  // 계약서
  // ======================================================
  function newContract() {
    var q = load('hanjul-quote', null), h = S.home;
    var sel = {};
    if (q && q.spots) {
      var two = q.baths >= 2;
      if (q.spots.indexOf('현관') >= 0) sel.entry = true;
      if (q.spots.indexOf('욕실 바닥') >= 0) { sel.bathFloorC = true; if (two) sel.bathFloorM = true; }
      if (q.spots.indexOf('욕실 벽') >= 0) { sel.wallC = true; if (two) sel.wallM = true; }
      if (q.spots.indexOf('샤워부스 벽') >= 0) sel.booth = true;
      if (q.spots.indexOf('주방 벽') >= 0) sel.kitchenWall = true;
      if (q.spots.indexOf('베란다') >= 0) sel.veranda = true;
    }
    sigStrokes = [];
    return {
      fromQuote: !!(q && q.spots && q.spots.length), sel: sel, pack: '',
      mat: q && q.material === '스타라이크' ? 'star' : 'poly', accel: false,
      build: q && q.build === '구축' ? 'old' : 'new',
      clean: !!(q && q.services && q.services.indexOf('입주청소') >= 0), cleanAmt: '', discount: '', deposit: '',
      name: '', phone: q && q.phone ? q.phone : '', addr: h.apt ? homeLabel() : '', type: '', service: '', staff: '',
      agreeTerms: false, agreePriv: false, err: '', sending: false, done: null
    };
  }
  function contractCalc() {
    var k = S.contract, pack = HJ.pack(k.pack), inPack = pack ? pack[3] : [];
    var eff = Object.assign({}, k.sel); inPack.forEach(function (id) { eff[id] = true; });
    var cleanAmt = k.clean ? HJ.num(k.cleanAmt) : 0;
    var price = HJ.price(eff, k.mat, k.pack, k.accel, cleanAmt);
    var discount = HJ.num(k.discount), deposit = HJ.num(k.deposit);
    var groups = HJ.GROUPS.map(function (g) { return [g[1], HJ.ITEMS.filter(function (it) { return it[1] === g[0] && eff[it[0]]; }).map(function (it) { return it[2]; })]; });
    var count = HJ.ITEMS.filter(function (it) { return eff[it[0]]; }).length;
    return { pack: pack, inPack: inPack, eff: eff, cleanAmt: cleanAmt, price: price, discount: discount, deposit: deposit, balance: Math.max(0, price.total - discount - deposit), groups: groups, count: count };
  }
  function viewContract() {
    var k = S.contract;
    if (k.done) return viewContractDone();
    var c = contractCalc(), col = k.mat === 'star' ? 5 : 4;
    var input = function (id, label, key, ph, extra) {
      return '<label class="field" for="' + id + '">' + label + '<input class="input" id="' + id + '" type="text" placeholder="' + ph + '" value="' + esc(k[key]) + '" data-bind="contract.' + key + '"' + (extra || '') + '></label>';
    };
    var money = c.price.lines.map(function (l) { return '<div class="r"><span class="k">' + esc(l[0]) + '</span><span class="v">' + HJ.won(l[1]) + '</span></div>'; }).join('');
    if (k.clean && !c.cleanAmt) money += '<div class="r"><span class="k">입주청소</span><span class="v" style="color:var(--err)">금액 입력 필요</span></div>';
    money += '<div class="r"><span class="k">총 계약 금액</span><span class="v" style="font-weight:800">' + HJ.won(c.price.total) + '</span></div>';
    if (c.discount) money += '<div class="r"><span class="k">할인쿠폰 (주관사 제공)</span><span class="v">- ' + HJ.won(c.discount) + '</span></div>';
    money += '<div class="r"><span class="k">계약금</span><span class="v">' + HJ.won(c.deposit) + '</span></div><div class="r strong"><span class="k">잔금</span><span class="v">' + HJ.won(c.balance) + '</span></div>';
    var moneyInput = function (id, label, key) {
      return '<label class="money-row" for="' + id + '"><span>' + label + '</span><span class="row" style="gap:6px"><input class="input money" id="' + id + '" type="text" inputmode="numeric" placeholder="0" value="' + (k[key] ? HJ.num(k[key]).toLocaleString('ko-KR') : '') + '" data-bind="contract.' + key + '" data-fmt="money"><span>원</span></span></label>';
    };
    return '<div class="screen with-footer">' + topbar('시공 계약서') + '<main class="content">' +
      (k.fromQuote ? '<div class="callout">상담 신청 내용으로 시공 항목을 미리 체크해 뒀어요. 상담 내용과 다르면 고쳐주세요.</div>' : '') +
      '<section class="card"><h2>1. 고객 정보</h2>' +
      input('k-name', '고객명', 'name', '홍길동', ' autocomplete="name"') +
      '<label class="field" for="k-phone">연락처<input class="input" id="k-phone" type="tel" inputmode="numeric" autocomplete="tel" placeholder="010-0000-0000" value="' + esc(k.phone) + '" data-bind="contract.phone" data-fmt="phone"></label>' +
      input('k-addr', '시공장소', 'addr', '단지명 · 동 · 호') +
      '<div class="row" style="align-items:flex-end;gap:12px"><label class="field" for="k-type">타입<span class="row" style="gap:6px"><input class="input small" id="k-type" type="text" inputmode="numeric" maxlength="4" placeholder="84" value="' + esc(k.type) + '" data-bind="contract.type" data-fmt="digits"><span>타입</span></span></label>' +
      '<div class="row" style="margin-left:auto">' + [['new', '신축'], ['old', '구축']].map(function (b) { return '<button type="button" class="tile center" style="min-height:50px;min-width:64px;font-size:14px;font-weight:600" aria-pressed="' + (k.build === b[0]) + '" data-act="kBuild" data-v="' + b[0] + '">' + b[1] + '</button>'; }).join('') + '</div></div>' +
      (k.build === 'old' ? '<p class="note-err">구축은 추가요금이 발생해요. 현장 확인 후 안내드려요.</p>' : '') + '</section>' +

      '<section class="card"><h2>2. 줄눈 재료 · 패키지</h2><div class="grid2">' +
      HJ.MATS.map(function (m) { return '<button type="button" class="tile center" style="min-height:60px" aria-pressed="' + (k.mat === m[0]) + '" data-act="kMat" data-v="' + m[0] + '"><span class="t" style="font-size:15px">' + m[1] + '</span><span class="s">' + m[2] + '</span></button>'; }).join('') + '</div>' +
      (k.mat === 'star' ? '<label class="check" style="font-size:14px;font-weight:600"><input type="checkbox" data-check="contract.accel"' + (k.accel ? ' checked' : '') + '>스타라이크 속경제 사용 (+100,000원)</label>' : '') +
      '<div style="display:flex;flex-direction:column;gap:8px">' + HJ.PACKS.map(function (p) {
        return '<button type="button" class="tile pack" aria-pressed="' + (k.pack === p[0]) + '" data-act="kPack" data-v="' + p[0] + '"><span style="display:flex;flex-direction:column;gap:2px"><span class="t">' + p[1] + '</span><span class="s">' + p[2] + '</span></span><span class="price">' + HJ.won(p[col]) + '</span></button>';
      }).join('') + '</div></section>' +

      '<section class="card" style="gap:16px"><div class="section-head"><h2 style="font-size:15px">3. 시공 항목</h2><span class="hint">패키지 외 항목은 단가로 추가돼요</span></div>' +
      HJ.GROUPS.map(function (g) {
        return '<div style="display:flex;flex-direction:column;gap:8px"><span style="font-size:13px;font-weight:700;color:var(--green)">' + g[1] + '</span><div class="grid2">' +
          HJ.ITEMS.filter(function (it) { return it[1] === g[0]; }).map(function (it) {
            var locked = c.inPack.indexOf(it[0]) >= 0, on = locked || !!k.sel[it[0]];
            return '<button type="button" class="tile" aria-pressed="' + on + '"' + (locked ? ' aria-disabled="true"' : '') + ' data-act="kItem" data-v="' + it[0] + '"><span class="t" style="font-size:13px">' + esc(it[2]) + '</span><span class="s">' + (locked ? '패키지 포함' : HJ.won(it[col]) + (it[3] ? ' · ' + it[3] : '')) + '</span></button>';
          }).join('') + '</div></div>';
      }).join('') + '</section>' +

      '<section class="card"><h2>4. 금액</h2>' +
      '<label class="check" style="font-size:14px;font-weight:600"><input type="checkbox" data-check="contract.clean"' + (k.clean ? ' checked' : '') + '>입주청소 함께 진행</label>' +
      (k.clean ? moneyInput('k-clean', '입주청소 금액', 'cleanAmt') : '') + moneyInput('k-disc', '할인쿠폰 (주관사 제공)', 'discount') + moneyInput('k-dep', '계약금', 'deposit') +
      '<div class="kv" style="border-top:1px solid var(--line-2)">' + money + '</div>' +
      '<label class="field" for="k-svc" style="font-size:13px">서비스 항목 (무상)<input class="input" id="k-svc" type="text" placeholder="상담 때 약속한 무상 서비스" value="' + esc(k.service) + '" data-bind="contract.service"><span class="note-gold" style="font-weight:500">무상 서비스로 시공된 싱크대 · 욕조테두리 · 세면대는 A/S가 불가해요</span></label>' +
      '<label class="money-row" for="k-staff"><span>상담자</span><input class="input" id="k-staff" type="text" placeholder="담당자 이름" value="' + esc(k.staff) + '" data-bind="contract.staff" style="width:150px;min-height:44px"></label>' +
      '<p class="note-err" style="font-weight:500">줄눈 · 입주청소 시공 시 다른 시공 작업과 겹치면 안 되며, 겹치면 작업이 중단될 수 있어요.</p></section>' +

      '<section class="card"><h2>5. 안내사항</h2>' + HJ.NOTICES.map(function (n) {
        return '<div class="notice"><b>' + esc(n.title) + '</b>' + n.lines.map(function (l) { return '<span>· ' + esc(l) + '</span>'; }).join('') + '</div>';
      }).join('') + '<div class="banner">토 · 일요일 · 공휴일은 시공이 불가해요</div>' +
      '<label class="check"><input type="checkbox" data-check="contract.agreeTerms"' + (k.agreeTerms ? ' checked' : '') + '>위 안내사항을 모두 확인했고 동의해요 (필수)</label>' +
      '<label class="check"><input type="checkbox" data-check="contract.agreePriv"' + (k.agreePriv ? ' checked' : '') + '>계약 이행을 위한 개인정보 수집·이용에 동의해요 (필수) <a href="privacy.html" target="_blank" style="font-size:12px;margin-left:auto">보기</a></label></section>' +

      '<section class="card" style="gap:10px"><div class="section-head"><h2 style="font-size:15px">6. 서명</h2><button type="button" class="btn btn-ghost" style="min-height:36px;padding:0" data-act="clearSig">다시 쓰기</button></div>' +
      '<div class="sigpad"><span class="ph" id="sig-ph"' + (sigStrokes.length ? ' hidden' : '') + '>여기에 손가락으로 서명해 주세요</span><canvas id="sig" aria-label="서명 입력 칸"></canvas></div>' +
      '<span class="hint">계약일 ' + todayKo() + '</span></section>' +
      (k.err ? '<p class="note-err" role="alert" style="font-size:13px">' + esc(k.err) + '</p>' : '') +
      '</main><div class="footer-bar"><div class="sum-line"><span class="l" style="font-size:13px">총 계약 금액</span><span class="r" style="font-size:20px;color:var(--green)">' + HJ.won(c.price.total) + '</span></div>' +
      '<button type="button" class="btn btn-primary" data-act="signContract"' + (k.sending ? ' disabled' : '') + '>' + (k.sending ? '계약서 만드는 중…' : '서명하고 계약하기') + '</button></div></div>';
  }
  function viewContractDone() {
    var d = S.contract.done;
    return '<div class="screen with-tabbar">' + topbar('시공 계약서') + '<main class="content">' +
      '<div class="done-box"><div class="mark">' + I.ok + '</div><h2>계약이 완료됐어요</h2><p>' + esc(d.name) + '님, 시공일에 맞춰<br>담당자가 다시 연락드릴게요.</p></div>' +
      '<div class="pdf-card"><div class="ic" style="color:var(--gold-t)">' + I.doc.replace('width="22" height="22"', 'width="26" height="26"') + '</div><div class="tx"><b>계약서 PDF</b><small>' + esc(d.fileName) + '</small></div></div>' +
      '<button type="button" class="btn btn-gold" data-act="pdfSave">' + I.down + '계약서 PDF 받기</button>' +
      (navigator.canShare ? '<button type="button" class="btn btn-ghost" data-act="pdfShare">' + I.share + ' 카카오톡 등으로 보내기</button>' : '') +
      (d.sendErr ? '<div class="callout" role="alert" style="color:var(--err)">' + esc(d.sendErr) + ' <button type="button" class="btn btn-ghost" style="min-height:32px;padding:0 4px" data-act="retrySend">다시 보내기</button></div>' : '') +
      '<section class="card" style="gap:4px"><div class="kv">' + d.rows.map(function (r) { return '<div class="r"><span class="k">' + esc(r[0]) + '</span><span class="v">' + esc(r[1]) + '</span></div>'; }).join('') + '</div>' +
      '<span class="hint" style="margin-top:8px">고객 서명</span><img class="sig-img" src="' + d.sig + '" alt="고객 서명"></section>' +
      '<a class="btn btn-primary" href="#/home">홈으로</a>' +
      '<button type="button" class="btn btn-ghost" data-act="newContract">새 계약서 작성</button>' +
      '</main>' + tabbar('contract') + '</div>';
  }

  // signature pad (strokes survive re-render)
  function setupSig() {
    var cv = document.getElementById('sig');
    if (!cv) return;
    var dpr = window.devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    var cx = cv.getContext('2d');
    cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.lineWidth = 2.6; cx.lineCap = 'round'; cx.lineJoin = 'round'; cx.strokeStyle = '#15201D';
    var redraw = function () {
      cx.clearRect(0, 0, w, h);
      sigStrokes.forEach(function (st) {
        cx.beginPath(); cx.moveTo(st[0][0] * w, st[0][1] * h);
        if (st.length === 1) cx.lineTo(st[0][0] * w + 0.1, st[0][1] * h);
        for (var i = 1; i < st.length; i++) cx.lineTo(st[i][0] * w, st[i][1] * h);
        cx.stroke();
      });
    };
    redraw();
    var cur = null;
    var pt = function (e) { var r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; };
    cv.addEventListener('pointerdown', function (e) {
      e.preventDefault(); cur = [pt(e)]; sigStrokes.push(cur);
      try { cv.setPointerCapture(e.pointerId); } catch (er) {}
      var ph = document.getElementById('sig-ph'); if (ph) ph.hidden = true;
      redraw();
    });
    cv.addEventListener('pointermove', function (e) {
      if (!cur) return;
      var p = pt(e), last = cur[cur.length - 1];
      cur.push(p);
      cx.beginPath(); cx.moveTo(last[0] * w, last[1] * h); cx.lineTo(p[0] * w, p[1] * h); cx.stroke();
    });
    var end = function () { cur = null; };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end); cv.addEventListener('pointerleave', end);
  }
  function sigDataUrl() {
    var w = 620, h = 300, cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    var cx = cv.getContext('2d'); cx.lineWidth = 5; cx.lineCap = 'round'; cx.lineJoin = 'round'; cx.strokeStyle = '#15201D';
    sigStrokes.forEach(function (st) {
      cx.beginPath(); cx.moveTo(st[0][0] * w, st[0][1] * h);
      if (st.length === 1) cx.lineTo(st[0][0] * w + 0.5, st[0][1] * h);
      for (var i = 1; i < st.length; i++) cx.lineTo(st[i][0] * w, st[i][1] * h);
      cx.stroke();
    });
    return cv.toDataURL('image/png');
  }

  function signContract() {
    var k = S.contract, c = contractCalc();
    var fail = function (m) { k.err = m; render(); };
    if (!k.name.trim()) return fail('고객명을 적어주세요.');
    if (k.phone.replace(/\D/g, '').length < 10) return fail('연락처를 정확히 적어주세요.');
    if (!k.addr.trim()) return fail('시공장소를 적어주세요.');
    if (!c.count) return fail('패키지나 시공 항목을 하나 이상 골라주세요.');
    if (k.clean && !c.cleanAmt) return fail('입주청소 금액을 적어주세요.');
    if (!k.agreeTerms || !k.agreePriv) return fail('필수 동의 항목을 모두 체크해 주세요.');
    if (!sigStrokes.length) return fail('서명 칸에 서명해 주세요.');
    k.err = ''; k.sending = true; render();

    var d = new Date(), ymd = d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate());
    var no = 'HJ-' + ymd + '-' + String(Math.floor(1000 + Math.random() * 9000));
    var mat = HJ.MATS.find(function (m) { return m[0] === k.mat; });
    var sig = sigDataUrl();
    var doc = {
      no: no, today: todayKo(), name: k.name.trim(), isOld: k.build === 'old', biz: BIZ,
      customer: [['고객명', k.name.trim()], ['연락처', k.phone], ['시공장소', k.addr.trim()], ['타입', k.type ? k.type + '타입' : '-'], ['건물', k.build === 'old' ? '구축' : '신축']],
      mat: mat[1] + ' (' + mat[2] + ')' + (k.mat === 'star' && k.accel ? ' · 속경제 사용' : ''),
      pack: c.pack ? c.pack[1] : '', groups: c.groups, lines: c.price.lines, total: c.price.total,
      discount: c.discount, deposit: c.deposit, balance: c.balance, service: k.service.trim(), staff: k.staff.trim()
    };
    var fileName = '한줄_시공계약서_' + doc.name.replace(/[\\/:*?"<>|]/g, '') + '_' + ymd + '.pdf';
    HJPDF.make(doc, sig).then(function (bytes) {
      var record = {
        no: no, name: doc.name, phone: k.phone, addr: doc.customer[2][1], type: k.type, build: doc.customer[4][1],
        material: doc.mat, pack: doc.pack || '개별 선택', items: c.groups.map(function (g) { return g[0] + ': ' + (g[1].join(', ') || '-'); }).join(' / '),
        cleanAmt: c.cleanAmt, total: c.price.total, discount: c.discount, deposit: c.deposit, balance: c.balance, service: doc.service, staff: doc.staff
      };
      k.sending = false;
      k.done = {
        no: no, name: doc.name, fileName: fileName, bytes: bytes, sig: sig, record: record, sendErr: '',
        rows: [['계약번호', no], ['고객명', doc.name], ['연락처', k.phone], ['시공장소', doc.customer[2][1]], ['패키지', (doc.pack || '개별 선택') + (c.cleanAmt ? ' + 입주청소' : '')], ['줄눈 재료', mat[1]], ['시공 항목', c.count + '곳'], ['총 계약 금액', HJ.won(c.price.total)], ['잔금', HJ.won(c.balance)], ['계약일', doc.today]]
      };
      render(true);
      sendContract();
    }).catch(function () { k.sending = false; fail('계약서를 만들지 못했어요. 다시 시도해 주세요.'); });
  }
  function bytesToB64(bytes) {
    var s = '', chunk = 0x8000;
    for (var i = 0; i < bytes.length; i += chunk) s += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    return btoa(s);
  }
  function sendContract() {
    var d = S.contract.done;
    if (!API.ready) { d.sendErr = '아직 서버(구글 시트) 연결 전이라 계약서가 한줄에 전송되지 않았어요.'; render(); return; }
    d.sendErr = '';
    API.post({ action: 'contract', data: d.record, pdf: bytesToB64(d.bytes), fileName: d.fileName })
      .then(function () { toast('계약서가 한줄에 전달됐어요'); })
      .catch(function () { d.sendErr = '계약서를 한줄에 보내지 못했어요. 인터넷 연결을 확인하고 다시 보내주세요.'; render(); });
  }
  function pdfBlob() { return new Blob([S.contract.done.bytes], { type: 'application/pdf' }); }

  // ======================================================
  // 관리자 (시공 사례 등록)
  // ======================================================
  function adminLoad() {
    S.admin.busy = true;
    API.get('cases').then(function (j) { S.admin.list = j.cases || []; }).catch(function () { S.admin.err = '사례 목록을 불러오지 못했어요.'; })
      .then(function () { S.admin.busy = false; render(); });
  }
  function viewAdmin() {
    var a = S.admin;
    if (!API.ready) {
      return '<div class="screen">' + topbar('관리자') + '<main class="content"><div class="callout">config.js에 구글 Apps Script 주소(API_URL)를 먼저 넣어야 관리자 화면을 쓸 수 있어요. 설치 안내서의 2단계를 확인해 주세요.</div></main></div>';
    }
    if (!a.authed) {
      return '<div class="screen">' + topbar('관리자') + '<main class="content"><section class="card"><h2>한줄 관리자 로그인</h2>' +
        '<label class="field" for="a-pw">비밀번호<input class="input" id="a-pw" type="password" autocomplete="current-password" value="' + esc(a.pw) + '" data-bind="admin.pw"></label>' +
        (a.loginErr ? '<p class="note-err" role="alert">' + esc(a.loginErr) + '</p>' : '') +
        '<button type="button" class="btn btn-primary" data-act="adminLogin"' + (a.busy ? ' disabled' : '') + '>' + (a.busy ? '확인 중…' : '들어가기') + '</button></section></main></div>';
    }
    var list = a.list;
    var html = '<div class="screen">' + topbar('관리자 · 시공 사례', '<button type="button" class="chip" aria-pressed="true" data-act="adminNew" style="margin-right:8px">' + I.plus + ' 사례 등록</button>') + '<main class="content">' +
      '<div class="callout">상담 신청과 계약서는 연결한 구글 시트의 <b>상담신청</b> · <b>계약</b> 탭에 쌓여요. 계약서 PDF는 구글 드라이브 "한줄 계약서" 폴더에 저장돼요.</div>' +
      (a.err ? '<p class="note-err" role="alert">' + esc(a.err) + '</p>' : '');
    if (!list) html += '<div class="skeleton" style="height:90px"></div>';
    else if (!list.length) html += '<div class="empty"><b>등록된 사례가 없어요</b><span>오른쪽 위 "사례 등록"으로 첫 사진을 올려주세요. 그 전까지 고객 화면에는 예시 사례가 보여요.</span></div>';
    else html += list.map(function (c) {
      return '<div class="admin-item"><img src="' + esc(c.after) + '" alt=""><div class="tx"><b>' + esc(c.apt) + '</b><span>' + esc((c.svcs || []).join(', ')) + (c.color ? ' · ' + esc(c.color) : '') + '</span><span class="hint">' + esc(c.date) + (c.before ? ' · 전후 비교' : '') + '</span></div><button type="button" class="chip" aria-pressed="false" data-act="adminDelete" data-v="' + esc(c.id) + '">삭제</button></div>';
    }).join('');
    html += '<button type="button" class="btn btn-ghost" data-act="adminLogout">로그아웃</button></main>' + (a.form ? sheetAdminForm() : '') + '</div>';
    return html;
  }
  function sheetAdminForm() {
    var f = S.admin.form, apts = [];
    (S.admin.list || []).forEach(function (x) { if (apts.indexOf(x.apt) < 0) apts.push(x.apt); });
    var slot = function (key, title, hint) {
      return '<div style="display:flex;flex-direction:column;gap:6px"><span style="font-size:13px;font-weight:700">' + title + '</span><label class="photo-slot">' +
        (f[key] ? '<img src="' + f[key] + '" alt="' + title + ' 미리보기">' : I.photo + '<span>' + hint + '</span>') +
        '<input type="file" accept="image/*" aria-label="' + title + '" data-file="admin-' + key + '"></label></div>';
    };
    return '<div class="sheet-wrap"><button type="button" class="scrim" aria-label="닫기" data-act="adminClose"></button><div class="sheet" role="dialog" aria-modal="true" aria-label="시공 사례 등록"><div class="grabber"></div>' +
      '<div class="sheet-head"><h2>시공 사례 등록</h2><button type="button" class="icon-btn" aria-label="닫기" data-act="adminClose">' + I.close + '</button></div>' +
      '<div class="grid2" style="gap:10px">' + slot('before', '시공 전', '전 사진 (선택)') + slot('after', '시공 후', '후 사진 (필수)') + '</div>' +
      '<label class="field" for="f-apt">아파트 단지명<input class="input" id="f-apt" type="text" list="apt-list" placeholder="예) 한줄센트럴파크" value="' + esc(f.apt) + '" data-bind="admin.form.apt"></label>' +
      '<datalist id="apt-list">' + apts.map(function (a) { return '<option value="' + esc(a) + '">'; }).join('') + '</datalist>' +
      '<div class="field"><span>시공 내용</span><div class="wrap">' + ['줄눈', '탄성코트', '입주청소', '나노코팅', '새집증후군'].map(function (s) { return chip(s, f.svcs.indexOf(s) >= 0, 'adminSvc', ' data-v="' + s + '"'); }).join('') + '</div></div>' +
      '<div class="field"><span>줄눈 색</span><div class="wrap">' + HJ.GROUTS.map(function (g) { return '<button type="button" class="chip" aria-pressed="' + (f.color === g[1]) + '" data-act="adminColor" data-v="' + g[1] + '" style="display:inline-flex;align-items:center;gap:6px"><span style="width:12px;height:12px;border-radius:50%;background:' + g[2] + ';box-shadow:inset 0 0 0 1px rgba(0,0,0,.15)"></span>' + g[1] + '</button>'; }).join('') + '</div></div>' +
      '<label class="field" for="f-memo">한 줄 설명<textarea class="textarea" id="f-memo" rows="2" placeholder="예) 34평 욕실 2곳 + 현관, 그레이 줄눈으로 깔끔하게" data-bind="admin.form.memo">' + esc(f.memo) + '</textarea></label>' +
      (f.err ? '<p class="note-err" role="alert">' + esc(f.err) + '</p>' : '') +
      '<button type="button" class="btn btn-primary" data-act="adminSubmit"' + (f.busy ? ' disabled' : '') + '>' + (f.busy ? '올리는 중…' : '등록하기') + '</button></div></div>';
  }

  // ======================================================
  // events
  // ======================================================
  function setPath(path, val) {
    var parts = path.split('.'), o = S;
    for (var i = 0; i < parts.length - 1; i++) o = o[parts[i]];
    o[parts[parts.length - 1]] = val;
  }

  var ACT = {
    introDone: function () { save('hanjul-intro-seen', true); },
    install: function () {
      if (!S.install) return;
      S.install.prompt(); S.install.userChoice.finally(function () { S.install = null; render(); });
    },
    openHome: function () { S.homeDraft = Object.assign({}, S.home); render(); },
    closeHome: function () { S.homeDraft = null; render(); },
    saveHome: function () { S.home = S.homeDraft; S.homeDraft = null; save('hanjul-home', S.home); render(); toast('입주 정보를 저장했어요'); },

    colorRoom: function (el) { S.color.room = el.dataset.v; render(); },
    colorGrout: function (el) { S.color.grout = el.dataset.v; render(); },
    colorTile: function (el) { S.color.tile = el.dataset.v; render(); },
    colorReset: function () { S.color.user = null; S.color.mineHex = '#C9C7C2'; S.color.err = ''; render(); },

    svc: function (el) { var k = el.dataset.v; S.quote.svc[k] = !S.quote.svc[k]; render(); },
    build: function (el) { S.quote.build = el.dataset.v; render(); },
    step: function (el) {
      var k = el.dataset.k, d = +el.dataset.d, q = S.quote;
      if (k === 'size') q.size = Math.max(10, Math.min(80, q.size + d));
      if (k === 'baths') q.baths = Math.max(1, Math.min(4, q.baths + d));
      render();
    },
    material: function (el) { S.quote.material = el.dataset.v; render(); },
    spot: function (el) { var k = el.dataset.v; S.quote.spots[k] = !S.quote.spots[k]; render(); },
    calPrev: function () { var v = S.quote.view; S.quote.view = v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }; render(); },
    calNext: function () { var v = S.quote.view; S.quote.view = v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }; render(); },
    pickDay: function (el) { S.quote.day = el.dataset.v; render(); },
    openConsult: function () { S.quote.sheet = 'form'; S.quote.formErr = ''; render(); },
    closeConsult: function () { S.quote.sheet = null; render(); },
    sendConsult: function () {
      var q = S.quote, c = quoteCalc();
      if (q.phone.replace(/\D/g, '').length < 10) { q.formErr = '연락처를 정확히 적어주세요.'; return render(); }
      if (!q.agree) { q.formErr = '개인정보 수집·이용에 동의해 주세요.'; return render(); }
      var spots = q.svc.grout ? SPOTS.filter(function (sp) { return q.spots[sp[0]]; }).map(function (sp) { return sp[1]; }) : [];
      var rec = {
        services: c.chosen, material: q.svc.grout ? c.mat[1] : '', build: q.build === 'new' ? '신축' : '구축',
        size: q.size, baths: q.baths, spots: spots, date: c.dateLabel, phone: q.phone, memo: q.memo || '',
        estimate: c.estimate + (c.note ? ' (' + c.note + ')' : ''),
        home: S.home.apt ? homeLabel() : '', moveIn: S.home.date || ''
      };
      save('hanjul-quote', rec);
      var finish = function () { q.sending = false; q.sheet = 'done'; render(); };
      if (!API.ready) { finish(); toast('아직 서버 연결 전이라 신청이 저장되지 않았어요'); return; }
      q.sending = true; q.formErr = ''; render();
      API.post({ action: 'consult', data: rec }).then(finish).catch(function () {
        q.sending = false; q.formErr = '신청을 보내지 못했어요. 인터넷 연결을 확인하고 다시 눌러주세요.'; render();
      });
    },

    todo: function (el) { var k = el.dataset.v; S.guide[k] = !S.guide[k]; save('hanjul-guide', S.guide); render(); },
    caseFilter: function (el) { S.cases.filter = el.dataset.v; render(); },

    kBuild: function (el) { S.contract.build = el.dataset.v; render(); },
    kMat: function (el) { S.contract.mat = el.dataset.v; render(); },
    kPack: function (el) { var v = el.dataset.v; S.contract.pack = S.contract.pack === v ? '' : v; S.contract.err = ''; render(); },
    kItem: function (el) {
      var k = S.contract, id = el.dataset.v, p = HJ.pack(k.pack);
      if (p && p[3].indexOf(id) >= 0) return;
      k.sel[id] = !k.sel[id];
      if (k.sel[id] && HJ.EXCLUSIVE[id]) k.sel[HJ.EXCLUSIVE[id]] = false;
      k.err = ''; render();
    },
    clearSig: function () { sigStrokes = []; render(); },
    signContract: signContract,
    retrySend: sendContract,
    newContract: function () { S.contract = newContract(); render(true); },
    pdfSave: function () {
      var url = URL.createObjectURL(pdfBlob()), a = document.createElement('a');
      a.href = url; a.download = S.contract.done.fileName; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
    },
    pdfShare: function () {
      var file = new File([pdfBlob()], S.contract.done.fileName, { type: 'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) navigator.share({ files: [file], title: '한줄 시공 계약서' }).catch(function () {});
      else ACT.pdfSave();
    },

    adminLogin: function () {
      var a = S.admin; a.busy = true; a.loginErr = ''; render();
      API.post({ action: 'checkPassword', password: a.pw }).then(function () {
        a.authed = true; sessionStorage.setItem('hanjul-admin', a.pw); a.busy = false; adminLoad();
      }).catch(function () { a.busy = false; a.loginErr = '비밀번호가 맞지 않아요.'; render(); });
    },
    adminLogout: function () { sessionStorage.removeItem('hanjul-admin'); S.admin = { pw: '', authed: false, list: null, form: null, err: '', busy: false, loginErr: '' }; render(); },
    adminNew: function () { S.admin.form = { apt: '', svcs: ['줄눈'], color: '그레이', memo: '', before: '', after: '', err: '', busy: false }; render(); },
    adminClose: function () { S.admin.form = null; render(); },
    adminSvc: function (el) { var f = S.admin.form, v = el.dataset.v, i = f.svcs.indexOf(v); if (i >= 0) f.svcs.splice(i, 1); else f.svcs.push(v); render(); },
    adminColor: function (el) { var f = S.admin.form; f.color = f.color === el.dataset.v ? '' : el.dataset.v; render(); },
    adminSubmit: function () {
      var f = S.admin.form;
      if (!f.apt.trim()) { f.err = '아파트 단지명을 적어주세요.'; return render(); }
      if (!f.after) { f.err = '시공 후 사진을 올려주세요.'; return render(); }
      if (!f.svcs.length) { f.err = '시공 내용을 하나 이상 골라주세요.'; return render(); }
      f.busy = true; f.err = ''; render();
      API.post({ action: 'addCase', password: S.admin.pw, data: { apt: f.apt.trim(), svcs: f.svcs, color: f.svcs.indexOf('줄눈') >= 0 ? f.color : '', memo: f.memo.trim(), before: f.before, after: f.after } })
        .then(function () { S.admin.form = null; S.cases.list = null; toast('사례를 등록했어요'); adminLoad(); })
        .catch(function (e) { f.busy = false; f.err = e.message === 'auth' ? '비밀번호가 바뀌었어요. 다시 로그인해 주세요.' : '등록하지 못했어요. 사진 용량이나 인터넷 연결을 확인해 주세요.'; render(); });
    },
    adminDelete: function (el) {
      if (!confirm('이 사례를 삭제할까요? 사진도 함께 지워져요.')) return;
      API.post({ action: 'deleteCase', password: S.admin.pw, id: el.dataset.v })
        .then(function () { S.cases.list = null; toast('삭제했어요'); adminLoad(); })
        .catch(function () { toast('삭제하지 못했어요'); });
    }
  };

  app.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]');
    if (!el || !app.contains(el)) return;
    var fn = ACT[el.dataset.act];
    if (fn) { if (el.tagName === 'BUTTON') e.preventDefault(); fn(el, e); }
  });

  app.addEventListener('input', function (e) {
    var el = e.target, path = el.dataset.bind;
    if (path) {
      var v = el.value, fmt = el.dataset.fmt;
      if (fmt === 'phone') v = fmtPhone(v);
      if (fmt === 'digits') v = v.replace(/\D/g, '');
      if (fmt === 'money') v = v.replace(/\D/g, '');
      setPath(path, v);
      if (S.route === 'quote') S.quote.formErr = '';
      if (S.route === 'contract') S.contract.err = '';
      // 금액·형식이 바뀌는 칸만 다시 그림 (나머지는 그대로 두어 입력이 끊기지 않게)
      if (fmt === 'phone' || fmt === 'money') {
        render();
        var el2 = el.id && document.getElementById(el.id);
        if (el2) { var L = el2.value.length; try { el2.setSelectionRange(L, L); } catch (er) {} }
      }
      return;
    }
    var rid = el.dataset.range;
    if (rid) {
      var box = el.closest('.compare'), p = +el.value;
      S.cases.pos[rid] = p;
      box.querySelector('.bf').style.clipPath = 'inset(0 ' + (100 - p) + '% 0 0)';
      box.querySelector('.line').style.left = p + '%';
    }
  });

  app.addEventListener('change', function (e) {
    var el = e.target;
    if (el.dataset.check) { setPath(el.dataset.check, el.checked); if (S.contract) S.contract.err = ''; S.quote.formErr = ''; render(); return; }
    var fk = el.dataset.file;
    if (!fk) return;
    var file = el.files && el.files[0];
    el.value = '';
    if (!file) return;
    if (fk === 'colorPhoto') {
      S.color.busy = true; S.color.err = ''; S.color.tile = 'mine'; render();
      HJGrout.analyze(file, HJ.GROUTS).then(function (r) {
        S.color.user = r.urls; S.color.mineHex = r.tileHex; S.color.busy = false; render();
      }).catch(function (er) {
        S.color.busy = false;
        S.color.err = er && er.message === 'nolines' ? '사진에서 줄눈 선을 찾지 못했어요. 줄눈이 잘 보이게 가까이 찍어주세요.' : '사진을 처리하지 못했어요. 다른 사진으로 해볼까요?';
        render();
      });
    }
    if (fk.indexOf('admin-') === 0) {
      var key = fk.slice(6);
      HJGrout.shrink(file, 1600).then(function (url) { S.admin.form[key] = url; S.admin.form.err = ''; render(); })
        .catch(function () { S.admin.form.err = '사진을 열 수 없어요.'; render(); });
    }
  });

  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); S.install = e; if (S.route === 'home') render(); });

  // ---------- start ----------
  S.route = currentRoute();
  onEnter();
  if (S.route === 'home' && API.ready) loadCases();
  render(true);
})();
