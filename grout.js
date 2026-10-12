/* 타일 사진에서 줄눈 선을 찾아 색을 입힙니다 (기기 안에서만 처리, 서버로 보내지 않음). */
window.HJGrout = (function () {
  function hexRgb(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }

  function boxBlur(src, W, H, r) {
    var S = new Float64Array((W + 1) * (H + 1));
    for (var y = 0; y < H; y++) {
      var row = 0;
      for (var x = 0; x < W; x++) { row += src[y * W + x]; S[(y + 1) * (W + 1) + x + 1] = S[y * (W + 1) + x + 1] + row; }
    }
    var out = new Float32Array(W * H);
    for (var y2 = 0; y2 < H; y2++) {
      var y0 = Math.max(0, y2 - r), y1 = Math.min(H, y2 + r + 1);
      for (var x2 = 0; x2 < W; x2++) {
        var x0 = Math.max(0, x2 - r), x1 = Math.min(W, x2 + r + 1);
        out[y2 * W + x2] = (S[y1 * (W + 1) + x1] - S[y0 * (W + 1) + x1] - S[y1 * (W + 1) + x0] + S[y0 * (W + 1) + x0]) / ((y1 - y0) * (x1 - x0));
      }
    }
    return out;
  }

  // 주변보다 어둡거나(밝거나) 길고 가는 모양으로 이어진 픽셀만 줄눈으로 봅니다
  function findLines(L, bg, W, H, sign) {
    var N = W * H, bin = new Uint8Array(N);
    for (var i = 0; i < N; i++) bin[i] = sign * (bg[i] - L[i]) > 12 ? 1 : 0;
    var lab = new Int32Array(N), keep = new Uint8Array(N), stack = new Int32Array(N), kept = 0, id = 0;
    var minSpan = 0.15 * Math.min(W, H);
    for (var s = 0; s < N; s++) {
      if (!bin[s] || lab[s]) continue;
      id++;
      var sp = 0, cnt = 0, mnx = W, mxx = 0, mny = H, mxy = 0, members = [];
      stack[sp++] = s; lab[s] = id;
      while (sp > 0) {
        var p = stack[--sp]; members.push(p); cnt++;
        var px = p % W, py = (p - px) / W;
        if (px < mnx) mnx = px; if (px > mxx) mxx = px; if (py < mny) mny = py; if (py > mxy) mxy = py;
        if (px > 0 && bin[p - 1] && !lab[p - 1]) { lab[p - 1] = id; stack[sp++] = p - 1; }
        if (px < W - 1 && bin[p + 1] && !lab[p + 1]) { lab[p + 1] = id; stack[sp++] = p + 1; }
        if (py > 0 && bin[p - W] && !lab[p - W]) { lab[p - W] = id; stack[sp++] = p - W; }
        if (py < H - 1 && bin[p + W] && !lab[p + W]) { lab[p + W] = id; stack[sp++] = p + W; }
      }
      var bw = mxx - mnx + 1, bh = mxy - mny + 1;
      if (Math.max(bw, bh) > minSpan && cnt / (bw * bh) < 0.3 && cnt < N * 0.15) {
        for (var k = 0; k < members.length; k++) keep[members[k]] = 1;
        kept += cnt;
      }
    }
    return { keep: keep, count: kept };
  }

  function dilate(m, W, H, r) {
    var tmp = new Uint8Array(W * H), out = new Uint8Array(W * H);
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      var v = 0;
      for (var d = -r; d <= r && !v; d++) { var xx = x + d; if (xx >= 0 && xx < W && m[y * W + xx]) v = 1; }
      tmp[y * W + x] = v;
    }
    for (var y2 = 0; y2 < H; y2++) for (var x2 = 0; x2 < W; x2++) {
      var v2 = 0;
      for (var d2 = -r; d2 <= r && !v2; d2++) { var yy = y2 + d2; if (yy >= 0 && yy < H && tmp[yy * W + x2]) v2 = 1; }
      out[y2 * W + x2] = v2;
    }
    return out;
  }

  function analyzeImage(img, grouts) {
    var sc = Math.min(1, 900 / Math.max(img.naturalWidth, img.naturalHeight));
    var W = Math.round(img.naturalWidth * sc), H = Math.round(img.naturalHeight * sc), N = W * H;
    var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var cx = cv.getContext('2d'); cx.drawImage(img, 0, 0, W, H);
    var px = cx.getImageData(0, 0, W, H).data;
    var L = new Float32Array(N);
    for (var i = 0; i < N; i++) L[i] = (px[4 * i] + px[4 * i + 1] + px[4 * i + 2]) / 3;
    var bg = boxBlur(L, W, H, Math.max(6, Math.round(Math.max(W, H) / 70)));
    var res = findLines(L, bg, W, H, 1);
    if (res.count < N * 0.004) { var alt = findLines(L, bg, W, H, -1); if (alt.count > res.count) res = alt; }
    if (res.count < N * 0.002) throw new Error('nolines');
    var hard = dilate(res.keep, W, H, 2);
    var hf = new Float32Array(N);
    for (var j = 0; j < N; j++) hf[j] = hard[j];
    var mask = boxBlur(hf, W, H, 1);
    var sr = 0, sg = 0, sb = 0, sn = 0, bsum = 0;
    for (var k = 0; k < N; k++) {
      bsum += bg[k];
      if (!hard[k]) { sr += px[4 * k]; sg += px[4 * k + 1]; sb += px[4 * k + 2]; sn++; }
    }
    var tile = [sr / sn, sg / sn, sb / sn], bmean = bsum / N;
    var amb = Math.min(1.05, Math.max(0.7, (tile[0] + tile[1] + tile[2]) / 3 / 200));
    var out = cx.createImageData(W, H), od = out.data, urls = {};
    grouts.forEach(function (g) {
      var c = hexRgb(g[2]);
      for (var q = 0; q < N; q++) {
        var m = mask[q], sh = Math.min(1.08, Math.max(0.88, bg[q] / bmean)) * amb;
        od[4 * q] = px[4 * q] * (1 - m) + c[0] * sh * m;
        od[4 * q + 1] = px[4 * q + 1] * (1 - m) + c[1] * sh * m;
        od[4 * q + 2] = px[4 * q + 2] * (1 - m) + c[2] * sh * m;
        od[4 * q + 3] = 255;
      }
      cx.putImageData(out, 0, 0);
      urls[g[0]] = cv.toDataURL('image/jpeg', 0.86);
    });
    var hx = function (v) { var n = Math.round(Math.min(255, v / amb)).toString(16); return n.length < 2 ? '0' + n : n; };
    return { urls: urls, tileHex: '#' + hx(tile[0]) + hx(tile[1]) + hx(tile[2]) };
  }

  function analyze(file, grouts) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        setTimeout(function () {
          try { resolve(analyzeImage(img, grouts)); } catch (e) { reject(e); }
          URL.revokeObjectURL(url);
        }, 30);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('open')); };
      img.src = url;
    });
  }

  // 업로드용: 긴 변 기준으로 줄인 JPEG dataURL
  function shrink(file, maxSide) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        var sc = Math.min(1, (maxSide || 1280) / Math.max(img.naturalWidth, img.naturalHeight));
        var cv = document.createElement('canvas');
        cv.width = Math.round(img.naturalWidth * sc); cv.height = Math.round(img.naturalHeight * sc);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        URL.revokeObjectURL(url);
        resolve(cv.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('open')); };
      img.src = url;
    });
  }

  return { analyze: analyze, shrink: shrink };
})();
