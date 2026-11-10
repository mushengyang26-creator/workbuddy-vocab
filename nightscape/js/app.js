/* ============================================================
   夜景模拟器 · NIGHTSCAPE  — 交互逻辑
   ============================================================ */
(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const root = document.documentElement;

  /* ---------------- 数据 ---------------- */
  const CITIES = {
    shanghai: { cn: '上海', en: 'Shanghai, China', temp: '18°C', hum: '87%', aqi: 42, lv: '良', hue: 0, sat: 1.00, bri: 1.00, credit: '夜景模拟器 · NIGHTSCAPE' },
    tokyo:    { cn: '东京', en: 'Tokyo, Japan',    temp: '14°C', hum: '72%', aqi: 28, lv: '优', hue: 0, sat: 1.00, bri: 1.00, credit: '照片 Wikimedia Commons' },
    hongkong: { cn: '香港', en: 'Hong Kong, China', temp: '22°C', hum: '81%', aqi: 55, lv: '良', hue: 0, sat: 1.00, bri: 1.00, credit: '照片 Wikimedia Commons' }
  };

  const state = {
    city: 'shanghai',
    time: 70,
    fog: 62,
    neon: 88,
    traffic: 74,
    grain: 35
  };

  /* ---------------- 元素 ---------------- */
  const el = {
    scene: $('#scene'),
    bgs: [$('#bgDusk'), $('#bgEvening'), $('#bgLatenight')],
    fog: $('#fog'),
    grain: $('#grain'),
    traffic: $('#traffic'),
    sTime: $('#sTime'), sFog: $('#sFog'), sNeon: $('#sNeon'),
    sTraffic: $('#sTraffic'), sGrain: $('#sGrain'),
    vTime: $('#vTime'), vFog: $('#vFog'), vNeon: $('#vNeon'),
    vTraffic: $('#vTraffic'), vGrain: $('#vGrain'),
    city: $('#city'),
    cName: $('#cName'), cEn: $('#cEn'), cTemp: $('#cTemp'), cHum: $('#cHum'),
    cAir: $('#cAir'), cAirLv: $('#cAirLv'), cAirTag: $('#cAirTag'),
    thumbs: [...document.querySelectorAll('.thumb')],
    track: $('#track'), trackFill: $('#trackFill'), trackKnob: $('#trackKnob'),
    panel: $('#panel'), panelToggle: $('#panelToggle'), credit: $('#credit')
  };

  /* ---------------- 工具 ---------------- */
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------------- 时间 → 三层背景权重 ---------------- */
  function layerWeights(t) {
    const wDusk = clamp(1 - t / 50);
    const wLate = clamp((t - 50) / 50);
    const wEve  = 1 - Math.abs(t - 50) / 50;
    return [wDusk, wEve, wLate];
  }

  /* ---------------- 渲染 ---------------- */
  function renderBackground() {
    const w = layerWeights(state.time);
    el.bgs.forEach((b, i) => {
      const o = w[i];
      b.style.opacity = o.toFixed(3);
      b.style.visibility = o < 0.012 ? 'hidden' : 'visible';
    });

    const c = CITIES[state.city];
    const n = state.neon / 100;
    const t = state.time / 100;

    // 霓虹强度驱动饱和/对比；时间做极轻微的明暗与色温微调；城市再叠一层
    const sat  = (0.88 + n * 0.42) * c.sat;
    const con  = (1.00 + n * 0.16);
    const bri  = (1.03 - t * 0.08) * c.bri;

    root.style.setProperty('--sat', sat.toFixed(3));
    root.style.setProperty('--con', con.toFixed(3));
    root.style.setProperty('--bri', bri.toFixed(3));
    root.style.setProperty('--neon', n.toFixed(3));
  }

  function renderFog() {
    root.style.setProperty('--fog', (state.fog / 100 * 0.40).toFixed(3));
  }
  function renderGrain() {
    root.style.setProperty('--grain', (state.grain / 100 * 0.30).toFixed(3));
  }

  function renderUI() {
    el.vTime.textContent = state.time + '%';
    el.vFog.textContent = state.fog + '%';
    el.vNeon.textContent = state.neon + '%';
    el.vTraffic.textContent = state.traffic + '%';
    el.vGrain.textContent = state.grain + '%';

    [
      [el.sTime, state.time], [el.sFog, state.fog], [el.sNeon, state.neon],
      [el.sTraffic, state.traffic], [el.sGrain, state.grain]
    ].forEach(([input, v]) => {
      const n = Math.round(v);
      if (input.value !== String(n)) input.value = n;
      input.style.setProperty('--p', n + '%');
    });

    // 时间轴
    const pct = state.time;
    el.trackFill.style.width = pct + '%';
    el.trackKnob.style.left = pct + '%';
    el.track.setAttribute('aria-valuenow', Math.round(pct));

    // 缩图高亮：离得最近的那一档
    const stops = [0, 50, 100];
    let nearest = 0, best = Infinity;
    stops.forEach((s, i) => {
      const d = Math.abs(state.time - s);
      if (d < best) { best = d; nearest = i; }
    });
    el.thumbs.forEach((b, i) => b.classList.toggle('is-on', i === nearest));
  }

  function renderAll() {
    renderBackground();
    renderFog();
    renderGrain();
    renderUI();
  }

  /* ---------------- 信息卡 ---------------- */
  function applyCityImages() {
    const k = state.city;
    const files = [k + '-dusk.jpg', k + '-evening.jpg', k + '-latenight.jpg'];
    el.bgs.forEach((b, i) => {
      b.style.backgroundImage = 'url("assets/' + files[i] + '")';
    });
    const thumbs = [
      'assets/thumb-' + k + '-dusk.jpg',
      'assets/thumb-' + k + '-evening.jpg',
      'assets/thumb-' + k + '-latenight.jpg'
    ];
    el.thumbs.forEach((btn, i) => {
      const img = btn.querySelector('img');
      if (img) img.src = thumbs[i];
    });
  }

  function renderCity() {
    const c = CITIES[state.city];
    el.cName.textContent = c.cn;
    el.cEn.textContent = c.en;
    el.cTemp.textContent = c.temp;
    el.cHum.textContent = c.hum;
    el.cAir.textContent = 'AQI ' + c.aqi;
    el.cAirLv.textContent = c.lv;
    el.cAirTag.dataset.lv = c.lv;
    if (el.credit) el.credit.textContent = c.credit;
    applyCityImages();
  }

  /* ---------------- 车流 ---------------- */
  const tc = el.traffic;
  const ctx = tc.getContext('2d');
  let trails = [];
  let dpr = 1;
  let raf = 0;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 几条"路"：起点画面外，沿右下 45° 走向
  const ROADS = [
    { y: 0.80, a: 0.30, w: 4.0, c: '#ff8f9f', spd: 1.00 },
    { y: 0.845, a: 0.26, w: 3.4, c: '#ffd9b4', spd: 0.86 },
    { y: 0.885, a: 0.32, w: 4.4, c: '#ff6b81', spd: 1.12 },
    { y: 0.92, a: 0.24, w: 3.2, c: '#b6ecff', spd: 0.94 },
    { y: 0.955, a: 0.30, w: 4.6, c: '#ffbe80', spd: 1.22 },
    { y: 0.985, a: 0.34, w: 3.8, c: '#ff5f78', spd: 1.05 }
  ];

  function resizeCanvas() {
    dpr = 1;
    const w = innerWidth, h = innerHeight;
    tc.width = Math.floor(w * dpr);
    tc.height = Math.floor(h * dpr);
    tc.style.width = w + 'px';
    tc.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildGrain();
  }

  function spawn(road, spread) {
    const W = innerWidth;
    return {
      road,
      x: spread ? Math.random() * W * 1.1 : -Math.random() * W * 0.5 - 80,
      len: (26 + Math.random() * 54) * (1 + (state.time / 100) * 0.3),
      v: (180 + Math.random() * 320) * road.spd,
      y: (road.y + (Math.random() - 0.5) * 0.014) * innerHeight,
      w: road.w * (0.7 + Math.random() * 0.8),
      c: road.c,
      a: road.a * (0.75 + Math.random() * 0.55)
    };
  }

  let seeded = false;

  function ensureTrails() {
    const target = Math.round(2 + (state.traffic / 100) * 16);
    if (trails.length > target) {
      trails.length = target;
    } else {
      while (trails.length < target) {
        trails.push(spawn(ROADS[Math.floor(Math.random() * ROADS.length)], !seeded));
      }
    }
    seeded = true;
  }

  let last = 0;
  function frame(ts) {
    raf = requestAnimationFrame(frame);
    const dt = last ? Math.min((ts - last) / 1000, 0.05) : 0.033;
    if (last && ts - last < 33) return; // 约 30fps，减轻电脑负担
    last = ts;
    if (state.traffic < 2) {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      return;
    }

    const W = innerWidth, H = innerHeight;
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.translate(W * 0.5, H * 0.85);
    ctx.rotate(-0.22);
    ctx.translate(-W * 0.5, -H * 0.85);

    ensureTrails();

    for (const t of trails) {
      t.x += t.v * dt * (0.45 + state.traffic / 100 * 0.9);
      const x2 = t.x - t.len;
      if (x2 > W + 40) { Object.assign(t, spawn(t.road)); continue; }

      const g = ctx.createLinearGradient(t.x, t.y, x2, t.y);
      g.addColorStop(0, hexA(t.c, Math.min(0.46, t.a * 1.15)));
      g.addColorStop(0.45, hexA(t.c, Math.min(0.22, t.a * 0.55)));
      g.addColorStop(1, hexA(t.c, 0));

      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(t.x, t.y);
      ctx.lineTo(x2, t.y);
      ctx.strokeStyle = hexA(t.c, Math.min(0.18, t.a * 0.45));
      ctx.lineWidth = t.w * 2.4;
      ctx.stroke();
      ctx.strokeStyle = g;
      ctx.lineWidth = t.w;
      ctx.stroke();

      ctx.fillStyle = hexA(t.c, Math.min(0.36, t.a * 0.95));
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.w * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return `rgba(${r},${g},${b},${a.toFixed(3)})`;
  }

  /* ---------------- 颗粒 ---------------- */
  function buildGrain() {
    const size = 140;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    const img = g.createImageData(size, size);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = 118 + (Math.random() - 0.5) * 190;
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    el.grain.style.backgroundImage = `url(${c.toDataURL('image/png')})`;
    el.grain.style.backgroundSize = '140px 140px';
  }

  /* ---------------- 时间缓动 ---------------- */
  let tween = null;
  function animateTime(to, dur = 620) {
    if (reduceMotion) { state.time = to; renderAll(); return; }
    if (tween) cancelAnimationFrame(tween.raf);
    const from = state.time, t0 = performance.now();
    const step = (now) => {
      const k = clamp((now - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      state.time = from + (to - from) * e;
      renderAll();
      if (k < 1) tween.raf = requestAnimationFrame(step);
      else { state.time = to; renderAll(); tween = null; }
    };
    tween = { raf: requestAnimationFrame(step) };
  }

  /* ---------------- 事件 ---------------- */
  el.sTime.addEventListener('input', (e) => {
    state.time = +e.target.value;
    if (tween) { cancelAnimationFrame(tween.raf); tween = null; }
    renderAll();
  });
  el.sFog.addEventListener('input', (e) => {
    state.fog = +e.target.value; renderFog(); renderUI();
  });
  el.sNeon.addEventListener('input', (e) => {
    state.neon = +e.target.value; renderBackground(); renderUI();
  });
  el.sTraffic.addEventListener('input', (e) => {
    state.traffic = +e.target.value; renderUI();
  });
  el.sGrain.addEventListener('input', (e) => {
    state.grain = +e.target.value; renderGrain(); renderUI();
  });

  el.city.addEventListener('change', (e) => {
    state.city = e.target.value;
    renderCity();
    renderBackground();
  });

  if (el.panelToggle) {
    el.panelToggle.addEventListener('click', () => {
      const collapsed = el.panel.classList.toggle('is-collapsed');
      el.panelToggle.setAttribute('aria-expanded', String(!collapsed));
      el.panelToggle.setAttribute('aria-label', collapsed ? '展开控制台' : '收起控制台');
    });
  }

  el.thumbs.forEach((b) => {
    b.addEventListener('click', () => animateTime(+b.dataset.t));
  });

  // 时间轴拖曳
  let dragging = false;
  function seek(clientX) {
    const r = el.track.getBoundingClientRect();
    const v = clamp((clientX - r.left) / r.width);
    state.time = Math.round(v * 100);
    if (tween) { cancelAnimationFrame(tween.raf); tween = null; }
    renderAll();
  }
  el.track.addEventListener('pointerdown', (e) => {
    dragging = true;
    el.track.setPointerCapture(e.pointerId);
    seek(e.clientX);
  });
  el.track.addEventListener('pointermove', (e) => { if (dragging) seek(e.clientX); });
  el.track.addEventListener('pointerup', () => { dragging = false; });
  el.track.addEventListener('pointercancel', () => { dragging = false; });
  el.track.addEventListener('keydown', (e) => {
    const step = e.shiftKey ? 10 : 2;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      animateTime(clamp(state.time + step, 0, 100), 220);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      animateTime(clamp(state.time - step, 0, 100), 220);
    } else if (e.key === 'Home') {
      e.preventDefault(); animateTime(0, 420);
    } else if (e.key === 'End') {
      e.preventDefault(); animateTime(100, 420);
    }
  });

  addEventListener('resize', () => {
    resizeCanvas();
    trails = [];
    seeded = false;
  });

  // 页面不可见时暂停动画
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
    else if (!raf && !reduceMotion) { last = 0; raf = requestAnimationFrame(frame); }
  });

  /* ---------------- 启动 ---------------- */
  resizeCanvas();
  renderCity();
  renderAll();

  // 入场：从黄昏淡到当前时间，避免一上来就硬切
  const startTime = state.time;
  state.time = 0;
  renderAll();
  requestAnimationFrame(() => animateTime(startTime, 1100));

  if (!reduceMotion) raf = requestAnimationFrame(frame);
  else tc.style.display = 'none';
})();
