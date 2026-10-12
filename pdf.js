/* 계약서 PDF 만들기 — 브라우저에서 A4 이미지로 그린 뒤 PDF로 묶습니다. */
window.HJPDF = (function () {
  var W = 1240, H = 1754, M = 96, FONT = "'Pretendard', sans-serif";

  function b64(dataUrl) {
    var b = atob(dataUrl.split(',')[1]), out = new Uint8Array(b.length);
    for (var i = 0; i < b.length; i++) out[i] = b.charCodeAt(i);
    return out;
  }

  function buildPdf(jpegs) {
    var enc = new TextEncoder(), chunks = [], len = 0, offs = [];
    var push = function (x) { var b = typeof x === 'string' ? enc.encode(x) : x; chunks.push(b); len += b.length; };
    push(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, 0x0A, 0x25, 0xE2, 0xE3, 0xCF, 0xD3, 0x0A]));
    var n = jpegs.length, kids = [];
    for (var k = 0; k < n; k++) kids.push((3 + 3 * k) + ' 0 R');
    offs[1] = len; push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
    offs[2] = len; push('2 0 obj\n<< /Type /Pages /Kids [' + kids.join(' ') + '] /Count ' + n + ' >>\nendobj\n');
    for (var i = 0; i < n; i++) {
      var p = 3 + 3 * i, im = p + 1, ct = p + 2;
      offs[p] = len; push(p + ' 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 ' + im + ' 0 R >> >> /Contents ' + ct + ' 0 R >>\nendobj\n');
      offs[im] = len; push(im + ' 0 obj\n<< /Type /XObject /Subtype /Image /Width ' + W + ' /Height ' + H + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + jpegs[i].length + ' >>\nstream\n');
      push(jpegs[i]); push('\nendstream\nendobj\n');
      var cs = 'q 595.28 0 0 841.89 0 0 cm /Im0 Do Q';
      offs[ct] = len; push(ct + ' 0 obj\n<< /Length ' + cs.length + ' >>\nstream\n' + cs + '\nendstream\nendobj\n');
    }
    var total = 3 + 3 * n, xref = len;
    var x = 'xref\n0 ' + total + '\n0000000000 65535 f \n';
    for (var j = 1; j < total; j++) x += ('0000000000' + offs[j]).slice(-10) + ' 00000 n \n';
    push(x + 'trailer\n<< /Size ' + total + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF\n');
    var out = new Uint8Array(len), o = 0;
    chunks.forEach(function (c) { out.set(c, o); o += c.length; });
    return out;
  }

  function render(doc, sigImg, logoImg) {
    var pages = [], cv, cx, y;
    var biz = doc.biz || {};
    var newPage = function () {
      cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      cx = cv.getContext('2d'); cx.fillStyle = '#FFFFFF'; cx.fillRect(0, 0, W, H);
      cx.fillStyle = '#21412F'; cx.fillRect(0, 0, W, 14);
      cx.font = '500 19px ' + FONT; cx.fillStyle = '#7A8581';
      var foot = [biz.name || '한줄', biz.ceo ? '대표 ' + biz.ceo : '', biz.bizNo ? '사업자등록번호 ' + biz.bizNo : '', biz.phone || ''].filter(Boolean).join('  ·  ');
      cx.fillText(foot, M, H - 74);
      cx.fillText('계약번호 ' + doc.no + '  ·  계약일 ' + doc.today, M, H - 46);
      cx.textAlign = 'right'; cx.fillText(String(pages.length + 1), W - M, H - 46); cx.textAlign = 'left';
      pages.push(cv); y = M;
    };
    var need = function (h) { if (y + h > H - 140) newPage(); };
    var wrap = function (text, maxW) {
      var out = [], line = '';
      text = String(text);
      for (var i = 0; i < text.length; i++) {
        var t = line + text[i];
        if (cx.measureText(t).width > maxW && line) { out.push(line); line = text[i] === ' ' ? '' : text[i]; } else line = t;
      }
      if (line) out.push(line);
      return out.length ? out : [''];
    };
    var para = function (text, size, weight, color, indent, gap) {
      cx.font = weight + ' ' + size + 'px ' + FONT;
      wrap(text, W - 2 * M - (indent || 0)).forEach(function (ln) {
        need(size * 1.55); cx.fillStyle = color; cx.fillText(ln, M + (indent || 0), y + size); y += size * 1.55;
      });
      y += gap || 0;
    };
    var heading = function (text) {
      need(96); y += 18;
      cx.fillStyle = '#21412F'; cx.font = '700 30px ' + FONT; cx.fillText(text, M, y + 30); y += 46;
      cx.fillStyle = '#B8915A'; cx.fillRect(M, y, W - 2 * M, 3); y += 18;
    };
    var row = function (k, v, bold) {
      cx.font = (bold ? '700 ' : '600 ') + '25px ' + FONT;
      var vl = wrap(v, 660);
      need(vl.length * 38 + 14);
      cx.fillStyle = '#55625E'; cx.font = '500 25px ' + FONT; cx.fillText(k, M, y + 26);
      cx.fillStyle = '#15201D'; cx.font = (bold ? '700 ' : '600 ') + '25px ' + FONT; cx.textAlign = 'right';
      vl.forEach(function (ln, i) { cx.fillText(ln, W - M, y + 26 + i * 38); });
      cx.textAlign = 'left'; y += vl.length * 38 + 6;
      cx.fillStyle = '#E6EAE8'; cx.fillRect(M, y, W - 2 * M, 2); y += 10;
    };

    newPage();
    cx.fillStyle = '#21412F'; cx.font = '800 54px ' + FONT; cx.fillText('시공 계약서', M, y + 54);
    if (logoImg) {
      var lh = 110, lw = logoImg.width * lh / logoImg.height;
      cx.drawImage(logoImg, W - M - lw, y - 18, lw, lh);
    }
    y += 104;

    heading('1. 고객 정보');
    doc.customer.forEach(function (r) { row(r[0], r[1]); });
    if (doc.isOld) para('※ 구축은 추가요금이 발생합니다. 현장 확인 후 안내드립니다.', 22, 600, '#A8321E', 0, 4);

    heading('2. 시공 내용');
    row('줄눈 재료', doc.mat);
    row('패키지', doc.pack || '선택 안 함');
    doc.groups.forEach(function (g) { row(g[0], g[1].length ? g[1].join(', ') : '-'); });

    heading('3. 금액');
    doc.lines.forEach(function (l) { row(l[0], HJ.won(l[1])); });
    row('총 계약 금액', HJ.won(doc.total), true);
    if (doc.discount) row('할인쿠폰 (주관사 제공)', '- ' + HJ.won(doc.discount));
    row('계약금', HJ.won(doc.deposit));
    row('잔금', HJ.won(doc.balance), true);
    row('서비스 항목 (무상)', doc.service || '-');
    row('상담자', doc.staff || '-');
    para('※ 줄눈·입주청소 시공 시 다른 시공 작업과 중복되면 안 되며, 중복 시 작업이 중단될 수 있습니다.', 21, 500, '#A8321E', 0, 4);

    heading('4. 안내사항');
    HJ.NOTICES.forEach(function (n) {
      para(n.title, 24, 700, '#15201D', 0, 2);
      n.lines.forEach(function (ln) { para('· ' + ln, 21, 500, '#3A4743', 14, 0); });
      y += 10;
    });
    para('고객은 위 안내사항을 모두 확인하고 동의하였으며, 계약 이행을 위한 개인정보 수집·이용에 동의하였습니다.', 21, 600, '#21412F', 0, 8);

    heading('5. 서명');
    need(240);
    cx.fillStyle = '#55625E'; cx.font = '500 25px ' + FONT;
    cx.fillText('계약일  ' + doc.today, M, y + 28);
    cx.fillText('계약자  ' + doc.name + '  (서명)', M, y + 72);
    cx.fillText('시공사  ' + (biz.name || '한줄'), M, y + 116);
    cx.strokeStyle = '#C9D1CE'; cx.lineWidth = 2; cx.strokeRect(W - M - 420, y, 420, 190);
    if (sigImg) {
      var r = Math.min(400 / sigImg.width, 170 / sigImg.height);
      var sw = sigImg.width * r, sh = sigImg.height * r;
      cx.drawImage(sigImg, W - M - 210 - sw / 2, y + 95 - sh / 2, sw, sh);
    }
    return pages;
  }

  function loadImg(src) {
    return new Promise(function (res) {
      if (!src) return res(null);
      var im = new Image();
      im.onload = function () { res(im); };
      im.onerror = function () { res(null); };
      im.src = src;
    });
  }

  // doc: 계약 내용, sigUrl: 서명 PNG dataURL → PDF 바이트(Uint8Array)
  function make(doc, sigUrl) {
    var fonts = (document.fonts && document.fonts.load)
      ? Promise.all([document.fonts.load("500 25px 'Pretendard'"), document.fonts.load("700 30px 'Pretendard'"), document.fonts.load("800 54px 'Pretendard'")]).catch(function () {})
      : Promise.resolve();
    return fonts.then(function () {
      return Promise.all([loadImg(sigUrl), loadImg('assets/logo.png')]);
    }).then(function (imgs) {
      var pages = render(doc, imgs[0], imgs[1]);
      return buildPdf(pages.map(function (c) { return b64(c.toDataURL('image/jpeg', 0.9)); }));
    });
  }

  return { make: make };
})();
