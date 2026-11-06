/* ==========================================================================
   发展力 · 交互
   ========================================================================== */
(function () {
  'use strict';

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const DIM = Object.fromEntries(DIMENSIONS.map(d => [d.id, d]));
  const ORDER = DIMENSIONS.map(d => d.id);
  const STORE = 'fzl.v1';

  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /* ---------- state ---------- */
  const defaults = { theme: null, ratings: {}, favs: [], done: [] };
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(STORE) || '{}'); } catch (e) { saved = {}; }

  const state = {
    theme: saved.theme || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
    ratings: saved.ratings || {},
    favs: new Set(saved.favs || []),
    done: new Set(saved.done || []),
    filter: { dim: 'all', q: '', fav: false, done: false },
    current: null,
    paletteIdx: 0,
    paletteResults: []
  };

  function persist() {
    try {
      localStorage.setItem(STORE, JSON.stringify({
        theme: state.theme,
        ratings: state.ratings,
        favs: Array.from(state.favs),
        done: Array.from(state.done)
      }));
    } catch (e) { /* 忽略隐私模式下的写入失败 */ }
  }

  /* ---------- 搜索索引 ---------- */
  const HAY = MODELS.map(m => [
    m.name, m.en, m.tagline, m.def, m.origin,
    (m.tags || []).join(' '),
    DIM[m.dim].name + ' ' + DIM[m.dim].en,
    (m.points || []).map(p => p[0] + ' ' + p[1]).join(' '),
    m.when, (m.example || []).join(' '), (m.pitfalls || []).join(' ')
  ].join(' ').toLowerCase());

  function scoreOf(m, i, q) {
    if (!q) return 1;
    const name = m.name.toLowerCase();
    if (name === q) return 100;
    if (name.indexOf(q) === 0) return 80;
    if (name.indexOf(q) > -1) return 60;
    if (m.en.toLowerCase().indexOf(q) > -1) return 50;
    if (m.tagline.toLowerCase().indexOf(q) > -1) return 40;
    if (HAY[i].indexOf(q) > -1) return 20;
    return 0;
  }

  function searchModels(q) {
    const key = q.trim().toLowerCase();
    return MODELS
      .map((m, i) => ({ m, s: scoreOf(m, i, key) }))
      .filter(x => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .map(x => x.m);
  }

  /* ---------- 主题 ---------- */
  function applyTheme(t) {
    state.theme = t;
    document.documentElement.setAttribute('data-theme', t);
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#0D0F12' : '#FBFAF7');
    persist();
  }
  applyTheme(state.theme);

  /* ---------- 提示 ---------- */
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  /* ---------- 头图轨道 ---------- */
  function buildOrbit() {
    const wrap = $('#orbitDots');
    const R = 46;
    wrap.innerHTML = DIMENSIONS.map((d, i) => {
      const a = (-90 + i * (360 / DIMENSIONS.length)) * Math.PI / 180;
      const x = 50 + R * Math.cos(a);
      const y = 50 + R * Math.sin(a);
      return `<div class="orbit-dot" style="left:${x.toFixed(2)}%;top:${y.toFixed(2)}%">
        <button style="--c:${d.color}" data-dim="${d.id}" title="查看${d.name}的模型">
          <i></i>${d.name}
        </button>
      </div>`;
    }).join('');

    wrap.addEventListener('click', e => {
      const b = e.target.closest('button[data-dim]');
      if (!b) return;
      setFilterDim(b.dataset.dim);
      $('#library').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  /* ---------- 能力雷达 ---------- */
  const CX = 210, CY = 210, RAD = 138, MAX = 5;

  function radarPoints(getVal) {
    return DIMENSIONS.map((d, i) => {
      const a = (-90 + i * (360 / DIMENSIONS.length)) * Math.PI / 180;
      const v = Math.max(getVal(d.id), 0);
      const r = (v / MAX) * RAD;
      return [CX + r * Math.cos(a), CY + r * Math.sin(a), a];
    });
  }

  function buildRadar() {
    const svg = $('#radarSvg');
    const grid = [];
    for (let lv = 1; lv <= MAX; lv++) {
      const pts = radarPoints(() => lv).map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
      grid.push(`<polygon class="grid-line" points="${pts}"/>`);
    }
    const axes = radarPoints(() => MAX).map(p =>
      `<line class="axis-line" x1="${CX}" y1="${CY}" x2="${p[0].toFixed(1)}" y2="${p[1].toFixed(1)}"/>`
    ).join('');

    const labels = radarPoints(() => MAX).map((p, i) => {
      const d = DIMENSIONS[i];
      const a = p[2];
      const lx = CX + (RAD + 28) * Math.cos(a);
      const ly = CY + (RAD + 28) * Math.sin(a);
      const cos = Math.cos(a);
      let anchor = 'middle';
      if (cos > 0.25) anchor = 'start';
      else if (cos < -0.25) anchor = 'end';
      const dy = Math.sin(a) > 0.5 ? 10 : (Math.sin(a) < -0.5 ? -2 : 4);
      return `<text class="axis-label" x="${lx.toFixed(1)}" y="${(ly + dy).toFixed(1)}"
        text-anchor="${anchor}" data-dim="${d.id}">${d.name}</text>`;
    }).join('');

    // 可点击节点（每根轴 5 个点）
    let nodes = '';
    DIMENSIONS.forEach((d, i) => {
      const a = (-90 + i * (360 / DIMENSIONS.length)) * Math.PI / 180;
      for (let lv = 1; lv <= MAX; lv++) {
        const r = (lv / MAX) * RAD;
        const x = CX + r * Math.cos(a), y = CY + r * Math.sin(a);
        nodes += `<circle class="node-hit" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9"
          data-dim="${d.id}" data-lv="${lv}" style="stroke:none"/>`;
      }
      const tr = RAD + 0.1;
      nodes += `<circle class="node" cx="${(CX + tr * Math.cos(a)).toFixed(1)}" cy="${(CY + tr * Math.sin(a)).toFixed(1)}" r="4.5" data-dim="${d.id}" data-lv="cycle"/>`;
    });

    svg.innerHTML = `
      <defs>
        <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="var(--accent)" stop-opacity=".12"/>
          <stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="${CX}" cy="${CY}" r="${RAD + 8}" fill="url(#radarGlow)" stroke="none"/>
      <g>${grid}</g>
      <g>${axes}</g>
      <polygon class="poly-target" id="radarTarget"/>
      <polygon class="poly-current" id="radarCurrent"/>
      <g>${labels}</g>
      <g id="radarNodes">${nodes}</g>
      <circle cx="${CX}" cy="${CY}" r="2.5" fill="var(--ink-3)" opacity=".5"/>
    `;

    svg.addEventListener('click', e => {
      const t = e.target.closest('[data-dim]');
      if (!t || !t.dataset.lv) return;
      const id = t.dataset.dim;
      const lv = t.dataset.lv;
      const cur = state.ratings[id] || 0;
      state.ratings[id] = lv === 'cycle' ? (cur >= MAX ? 0 : cur + 1) : Number(lv);
      persist();
      updateRadar();
    });
    svg.addEventListener('mouseover', e => {
      const t = e.target.closest('[data-dim]');
      highlightRow(t ? t.dataset.dim : null);
      $$('.axis-label', svg).forEach(l => l.classList.toggle('active', !!t && l.dataset.dim === t.dataset.dim));
    });
  }

  function updateRadar() {
    const cur = radarPoints(id => state.ratings[id] || 0)
      .map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    const tgt = radarPoints(() => 4).map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    const a = $('#radarCurrent'), b = $('#radarTarget');
    if (a) a.setAttribute('points', cur);
    if (b) b.setAttribute('points', tgt);

    $$('.score-dot').forEach(dot => {
      const dim = dot.dataset.dim, lv = Number(dot.dataset.lv);
      dot.classList.toggle('on', (state.ratings[dim] || 0) >= lv);
    });

    const rated = DIMENSIONS.filter(d => state.ratings[d.id] != null);
    const total = rated.reduce((s, d) => s + state.ratings[d.id], 0);
    $('#radarTotal').textContent = rated.length ? (total / rated.length).toFixed(1) : '0.0';

    const btn = $('#radarFocus');
    if (!rated.length) {
      btn.disabled = true;
      $('#insightTitle').textContent = '尚未自评';
      $('#insightText').textContent = '点击雷达上的顶点，或下方的圆点，开始自评。全部不填也能用——但填了才知道从哪开始。';
      return;
    }

    // 找"缺口最大"的维度；同分时优先掌握数最少的
    const weakest = DIMENSIONS
      .map(d => ({ d, gap: 5 - (state.ratings[d.id] || 0), r: state.ratings[d.id] || 0 }))
      .filter(x => x.r > 0)
      .sort((x, y) => y.gap - x.gap || countDone(x.d.id) - countDone(y.d.id))[0];

    const m1 = MODELS.filter(m => m.dim === weakest.d.id)[0];
    const m2 = MODELS.filter(m => m.dim === weakest.d.id)[1];
    btn.disabled = false;
    btn.dataset.model = m1.id;
    $('#insightTitle').textContent = `优先补「${weakest.d.name}」`;
    $('#insightText').innerHTML =
      `你在这一项自评 <b>${weakest.r}/5</b>，是当前缺口最大的一个。<br>建议先读 <b>${esc(m1.name)}</b>` +
      (m2 ? ` 与 <b>${esc(m2.name)}</b>` : '') + `，它们是这个能力域的地基。`;
  }

  function countDone(dimId) {
    return MODELS.filter(m => m.dim === dimId && state.done.has(m.id)).length;
  }

  function highlightRow(dimId) {
    $$('.score-row').forEach(r => r.classList.toggle('active', r.dataset.dim === dimId));
  }

  function buildScoreRows() {
    const wrap = $('#scoreRows');
    wrap.innerHTML = DIMENSIONS.map(d => `
      <div class="score-row" data-dim="${d.id}" style="--c:${d.color}">
        <span class="score-name"><i style="background:${d.color}"></i>${d.name}<em>${d.en}</em></span>
        <span class="score-dots">
          ${[1, 2, 3, 4, 5].map(lv =>
            `<button class="score-dot" data-dim="${d.id}" data-lv="${lv}"
              style="--c:${d.color}" aria-label="${d.name} ${lv} 分"></button>`
          ).join('')}
        </span>
      </div>
    `).join('');

    wrap.addEventListener('click', e => {
      const b = e.target.closest('.score-dot');
      if (!b) return;
      const dim = b.dataset.dim, lv = Number(b.dataset.lv);
      state.ratings[dim] = state.ratings[dim] === lv ? 0 : lv;
      persist();
      updateRadar();
    });
    wrap.addEventListener('mouseover', e => {
      const row = e.target.closest('.score-row');
      highlightRow(row ? row.dataset.dim : null);
    });
  }

  /* ---------- 模型库 ---------- */
  function buildDimFilter() {
    const wrap = $('#dimFilter');
    const counts = {};
    MODELS.forEach(m => { counts[m.dim] = (counts[m.dim] || 0) + 1; });
    wrap.innerHTML =
      `<button class="dim-pill" data-dim="all" aria-pressed="true" style="--c:var(--ink)">
        <i style="background:var(--ink)"></i>全部<small>${MODELS.length}</small></button>` +
      DIMENSIONS.map(d => `
        <button class="dim-pill" data-dim="${d.id}" aria-pressed="false" style="--c:${d.color}">
          <i></i>${d.name}<small>${counts[d.id] || 0}</small>
        </button>`).join('');

    wrap.addEventListener('click', e => {
      const b = e.target.closest('.dim-pill');
      if (!b) return;
      setFilterDim(b.dataset.dim);
    });
  }

  function setFilterDim(id) {
    state.filter.dim = id;
    $$('.dim-pill').forEach(p => p.setAttribute('aria-pressed', String(p.dataset.dim === id)));
    renderGrid();
  }

  function filteredModels() {
    let list = state.filter.dim === 'all'
      ? MODELS.slice()
      : MODELS.filter(m => m.dim === state.filter.dim);
    if (state.filter.fav) list = list.filter(m => state.favs.has(m.id));
    if (state.filter.done) list = list.filter(m => state.done.has(m.id));
    if (state.filter.q.trim()) {
      const q = state.filter.q.trim().toLowerCase();
      list = list
        .map((m) => ({ m, s: scoreOf(m, MODELS.indexOf(m), q) }))
        .filter(x => x.s > 0)
        .sort((a, b) => b.s - a.s)
        .map(x => x.m);
    }
    return list;
  }

  function renderGrid() {
    const list = filteredModels();
    const grid = $('#modelGrid');
    const empty = $('#emptyState');
    $('#libCount').textContent = list.length;
    $('#favCount').textContent = state.favs.size;
    $('#doneCount').textContent = state.done.size;

    if (!list.length) {
      grid.innerHTML = '';
      empty.hidden = false;
      return;
    }
    empty.hidden = true;

    grid.innerHTML = list.map(m => {
      const d = DIM[m.dim];
      const no = String(MODELS.indexOf(m) + 1).padStart(2, '0');
      return `<article class="model-card" data-id="${m.id}" style="--c:${d.color}" tabindex="0" role="button" aria-label="打开 ${esc(m.name)}">
        ${state.done.has(m.id) ? '<span class="mc-done">已掌握</span>' : ''}
        <div class="mc-top">
          <span class="mc-no">${no}</span>
          <button class="mc-fav ${state.favs.has(m.id) ? 'on' : ''}" data-fav="${m.id}" aria-label="收藏 ${esc(m.name)}">
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2.6l2.3 4.7 5.2.8-3.8 3.7.9 5.2-4.6-2.4-4.6 2.4.9-5.2L2.5 8.1l5.2-.8z"/></svg>
          </button>
        </div>
        <h3 class="mc-name">${esc(m.name)}</h3>
        <p class="mc-en">${esc(m.en)}</p>
        <p class="mc-tagline">${esc(m.tagline)}</p>
        <div class="mc-foot">
          <span class="mc-dim"><i></i>${d.name}</span>
          <span class="mc-go">看拆解
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h12M11 5l5 5-5 5"/></svg>
          </span>
        </div>
      </article>`;
    }).join('');
  }

  /* ---------- 图示 ---------- */
  function vizOf(m) {
    const v = m.viz || {};
    const c = DIM[m.dim].color;
    const W = (html, cap) => `<div class="viz" style="--c:${c}">${cap ? `<p class="viz-cap">${cap}</p>` : ''}${html}</div>`;

    switch (v.type) {
      case 'bars': {
        const rows = v.data.map(x => `
          <div class="vbar-row">
            <span class="vbar-label">${esc(x.label)}</span>
            <span class="vbar-track"><span class="vbar-fill" data-w="${x.value}"></span></span>
            <span class="vbar-val">${x.value}${v.unit || ''}</span>
          </div>`).join('');
        return W(`<div class="vbars">${rows}</div>`, '平均记忆保持率 · 两周后');
      }
      case 'pareto': {
        return W(`<div class="vbars">
          <div class="vbar-row">
            <span class="vbar-label">投入占比</span>
            <span class="vbar-track"><span class="vbar-fill" data-w="20"></span></span>
            <span class="vbar-val">20%</span>
          </div>
          <div class="vbar-row">
            <span class="vbar-label">产出占比</span>
            <span class="vbar-track"><span class="vbar-fill" data-w="80"></span></span>
            <span class="vbar-val">80%</span>
          </div>
          <div class="vbar-row" style="margin-top:6px">
            <span class="vbar-label">其余投入</span>
            <span class="vbar-track"><span class="vbar-fill" data-w="80" style="opacity:.35"></span></span>
            <span class="vbar-val">80%</span>
          </div>
          <div class="vbar-row">
            <span class="vbar-label">其余产出</span>
            <span class="vbar-track"><span class="vbar-fill" data-w="20" style="opacity:.35"></span></span>
            <span class="vbar-val">20%</span>
          </div>
        </div>`, '关键少数 · 次要多数');
      }
      case 'cycle': {
        const rows = v.data.map((x, i) => `
          <div class="vstep">
            <span class="vstep-n">${esc(x.k || String(i + 1).padStart(2, '0'))}</span>
            <b>${esc(x.t)}</b><span>${esc(x.d)}</span>
          </div>`).join('');
        return W(`<div class="vcycle">${rows}</div>`, '循环 · 每一圈都在加固上一圈');
      }
      case 'steps': {
        const rows = v.data.map((x, i) => `
          <div class="vstep">
            <span class="vstep-n">${String(i + 1).padStart(2, '0')}</span>
            <b>${esc(x.t)}</b><span>${esc(x.d)}</span>
          </div>`).join('');
        return W(`<div class="vsteps">${rows}</div>`, v.loop ? '五步 · 可循环迭代' : '步骤');
      }
      case 'chips': {
        const rows = v.data.map(x => `
          <div class="vchip"><k>${esc(x.k)}</k><b>${esc(x.t)}</b><span>${esc(x.d)}</span></div>`).join('');
        return W(`<div class="vchips">${rows}</div>`);
      }
      case 'concentric': {
        const n = v.data.length;
        let s = '';
        v.data.forEach((x, i) => {
          const r = 118 - i * (100 / n);
          const op = 0.06 + i * 0.05;
          s += `<circle cx="180" cy="150" r="${r}" fill="${c}" opacity="${op.toFixed(2)}" stroke="${c}" stroke-opacity=".28"/>`;
          s += `<text x="180" y="${150 - r + 20}" text-anchor="middle" class="t-strong" style="font-size:12px">${esc(x.k)}</text>`;
          s += `<text x="180" y="${150 - r + 34}" text-anchor="middle" class="t-muted">${esc(x.d)}</text>`;
        });
        return W(`<svg viewBox="0 0 360 300">${s}</svg>`, '由外而内 / 由内而外');
      }
      case 'timeline': {
        let s = `<line x1="30" y1="70" x2="330" y2="70" stroke="var(--line-strong)" stroke-width="1.5"/>`;
        v.data.forEach((x, i) => {
          const px = 48 + i * 132;
          s += `<circle cx="${px}" cy="70" r="6" fill="${c}" opacity="${0.4 + i * 0.25}"/>`;
          s += `<text x="${px}" y="46" text-anchor="middle" class="t-strong">${esc(x.t)}</text>`;
          s += `<text x="${px}" y="98" text-anchor="middle" class="t-muted">${esc(x.d)}</text>`;
          if (i < 2) s += `<path d="M${px + 14} 70 l${94} 0" stroke="${c}" stroke-opacity=".3" stroke-dasharray="3 4"/>`;
        });
        return W(`<svg viewBox="0 0 360 120">${s}</svg>`, '三个时间尺度');
      }
      case 'hats': {
        const rows = v.data.map(x => `
          <button class="vhat" style="--hc:${x.c}" data-hat="${esc(x.t)}">
            <k>${esc(x.k)}</k><b>${esc(x.t)}</b><span>${esc(x.d)}</span>
          </button>`).join('');
        return W(`<div class="vhats">${rows}</div>`, '点击任意一顶，单独展开它的视角');
      }
      case 'funnel': {
        const rows = v.data.map((x, i) => {
          const w = 100 - i * 16;
          return `<div class="vfunnel-row" style="width:${w}%">
            <b>${esc(x.t)}</b><span>${x.v}</span>
          </div>`;
        }).join('');
        return W(`<div class="vfunnel">${rows}</div>`, '示例转化 · 每层都在漏');
      }
      case 'curve': {
        const pts = v.data;
        const px = p => p.x / 100 * 300 + 30;
        const py = p => 104 - p.y / 100 * 74;
        const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${px(p).toFixed(1)},${py(p).toFixed(1)}`).join(' ');
        const area = path + ` L330,104 L30,104 Z`;
        let marks = pts.map((p, i) => {
          const x = px(p), y = py(p);
          const anchor = i === 0 ? 'start' : (i === pts.length - 1 ? 'end' : 'middle');
          return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="${c}" stroke="none"/>
            ${p.t ? `<text x="${x.toFixed(1)}" y="${(y - 13).toFixed(1)}" text-anchor="${anchor}" class="t-strong">${esc(p.t)}</text>` : ''}`;
        }).join('');
        return W(`<svg viewBox="0 0 360 140">
          <path d="${area}" fill="${c}" opacity=".10" stroke="none"/>
          <path d="${path}" stroke="${c}" stroke-width="2" fill="none"/>
          ${marks}
          <line x1="30" y1="104" x2="330" y2="104" stroke="var(--line-strong)"/>
          <text x="30" y="128" class="t-muted">体验过程 →</text>
        </svg>`, '被记住的只有峰与终');
      }
      case 'radial': {
        let s = `<circle cx="180" cy="145" r="34" fill="${c}" opacity=".14" stroke="${c}" stroke-opacity=".35"/>`;
        s += `<text x="180" y="149" text-anchor="middle" class="t-strong" style="font-size:12px">中心主题</text>`;
        v.data.forEach((x, i) => {
          const a = (-90 + i * (360 / v.data.length)) * Math.PI / 180;
          const bx = 180 + 34 * Math.cos(a), by = 145 + 34 * Math.sin(a);
          const ex = 180 + 96 * Math.cos(a), ey = 145 + 96 * Math.sin(a);
          const anchor = Math.cos(a) > 0.2 ? 'start' : (Math.cos(a) < -0.2 ? 'end' : 'middle');
          s += `<line x1="${bx.toFixed(1)}" y1="${by.toFixed(1)}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}" stroke="${c}" stroke-opacity=".35"/>`;
          s += `<circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="4" fill="${c}"/>`;
          s += `<text x="${(ex + (anchor === 'start' ? 8 : anchor === 'end' ? -8 : 0)).toFixed(1)}" y="${(ey + 4).toFixed(1)}" text-anchor="${anchor}" class="t-strong">${esc(x.t)}</text>`;
        });
        return W(`<svg viewBox="0 0 360 290">${s}</svg>`, '一个中心，多级分支');
      }
      case 'johari': {
        const cells = [
          ['公开区', '自己知道 · 别人知道', '沟通与协作的基础', c],
          ['盲区', '自己不知道 · 别人知道', '只能靠主动索取反馈', '#8C8F96'],
          ['隐藏区', '自己知道 · 别人不知道', '保护还是防御，要分清', '#B8912B'],
          ['未知区', '自己不知道 · 别人也不知道', '靠新任务与新环境探索', '#5A5F66']
        ].map(x => `<div class="jcell" style="--c:${x[3]}">
            <div class="jt"><i></i>${x[0]}</div>
            <p>${x[1]}</p>
            <p class="ja" style="margin-top:6px">${x[2]}</p>
          </div>`).join('');
        return W(`<div class="johari">${cells}</div>`, '自己是否知道 × 别人是否知道');
      }
      case 'iceberg': {
        return W(`<div class="iceberg-wrap">
          <div class="ilayer above"><b>知识 · 技能</b><span>冰山以上 · 可培训、可考核</span></div>
          <div class="iceberg-line"><span>水 面</span></div>
          <div class="ilayer mid"><b>能力</b><span>能否迁移到陌生场景</span></div>
          <div class="ilayer below"><b>社会角色 · 自我形象</b><span>没人监督时怎么选</span></div>
          <div class="ilayer below"><b>特质 · 动机</b><span>决定长期表现</span></div>
        </div>`, '水面之上 20% / 水面之下 80%');
      }
      case 'abc': {
        const n = v.data.map(x => `<div class="vabc-node"><k>${esc(x.k)}</k><b>${esc(x.t)}</b><span>${esc(x.d)}</span></div>`).join(
          `<div class="vabc-arrow"><svg viewBox="0 0 20 20"><path d="M3 10h13M12 5l5 5-5 5"/></svg></div>`);
        return W(`${n}
          <div class="vabc-branch">
            <div class="vabc-b bad"><b>B1 · 他否定我这个人</b>→ C1 愤怒、消极</div>
            <div class="vabc-b good"><b>B2 · 他否定的是信息量</b>→ C2 追问标准、补数据</div>
          </div>`, '同一个 A，两种 B，两种 C');
      }
      case 'story5': {
        const blocks = v.data.map((x, i) => `
          <div class="vact" style="--i:${i}">
            <k>${x.d}</k><b>${esc(x.t)}</b><span>${i < 3 ? '基本要素' : '附加要素'}</span>
          </div>`).join('');
        return W(`<div class="vacts">${blocks}</div>`, '三根骨架 + 两层血肉');
      }
      case 'ladder': {
        const rows = v.data.map((x, i) => `
          <div class="vladder-row"><k>${i + 1}</k><b>${esc(x.t)}</b><span>${esc(x.d)}</span></div>`).join('');
        return W(`<div class="vladder">${rows}</div>`, '从下往上读');
      }
      case 'staircase': {
        const rows = v.data.map((x, i) => `
          <div class="vstair-row" style="--i:${i}"><k>${String(i + 1).padStart(2, '0')}</k><b>${esc(x.t)}</b><span>${esc(x.d)}</span></div>`).join('');
        return W(`<div class="vstair">${rows}</div>`, '六个阶段 · 每次晋升都是一次转型');
      }
      case 'acts': {
        const rows = v.data.map((x, i) => `
          <div class="vact" style="--i:${i}">
            <k>${esc(x.n || '')}</k><b>${esc(x.t)}</b><span>${esc(x.d)}</span>
          </div>`).join('');
        return W(`<div class="vacts">${rows}</div>`, '三幕结构');
      }
      case 'situational': {
        const cells = [
          ['S1 指令型', '高任务 · 低关系', 'M1 不会也不愿', '多说怎么做'],
          ['S2 教练型', '高任务 · 高关系', 'M2 不会但愿意', '边教边鼓励'],
          ['S3 支持型', '低任务 · 高关系', 'M3 会但不愿', '多支持少指挥'],
          ['S4 授权型', '低任务 · 低关系', 'M4 会也愿意', '充分放权']
        ].map(x => `<div class="vsit-cell">
            <k>${x[0]}</k><b>${x[2]}</b><span>${x[1]} · ${x[3]}</span>
          </div>`).join('');
        return W(`<div class="vsit">
          <div class="vsit-axis">关系行为 →</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">${cells}</div>
        </div>`, '任务行为 × 关系行为');
      }
      case 'lever': {
        return W(`<div class="vlever">
          <div class="vlever-item"><b>支点 · 关键</b><span>你真正擅长并能建立优势的核心能力或资源</span></div>
          <div class="vlever-item"><b>杠杆 · 工具</b><span>资金、团队、代码、平台、媒体、人脉</span></div>
          <div class="vlever-item"><b>作用力 · 投入</b><span>你实际付出的时间、金钱、精力</span></div>
          <div class="vlever-item" style="border-style:dashed"><b>杠杆率 = 成果 / 投入</b><span>先加固支点，再谈放大</span></div>
        </div>`, '支点 × 杠杆 × 作用力');
      }
      case 'poa': {
        return W(`<div class="vpoa">
          <div class="vpoa-formula">
            <span>行动力 =</span>
            <span class="vpoa-frac">
              <span class="num"><em>P</em> 伙伴 × <em>A</em> 方法</span>
              <span class="den"><em>O</em> 目标</span>
            </span>
          </div>
          <div class="vpoa-nodes">
            <div class="vpoa-node"><b>O 目标</b><span>越聚焦，分母越小</span></div>
            <div class="vpoa-node"><b>P 伙伴</b><span>越多，分子越大</span></div>
            <div class="vpoa-node"><b>A 方法</b><span>越可行，分子越大</span></div>
          </div>
        </div>`, 'POA 飞轮 · 目标凝聚伙伴，伙伴共创方法');
      }
      case 'nodes': {
        const rows = [['需求准入', '无准入 → 人人加需求'], ['并行任务', 'WIP 过多 → 切换成本'],
          ['验收标准', '后置 → 返工'], ['交付节奏', '无小步交付 → 风险堆积']]
          .map(x => `<div class="vnode"><b>${x[0]}</b><span>${x[1]}</span></div>`).join('');
        return W(`<div class="vnodes">${rows}
          <div class="vnode" style="grid-column:1/-1;border-style:dashed">
            <b>杠杆点：限制并行 × 需求准入</b><span>改结构，比催人有效</span></div>
        </div>`, '要素之间互相放大');
      }
      case 'merge': {
        return W(`<div class="vmerge">
          <div class="vmerge-box">快速上线</div>
          <div style="color:var(--ink-3)">+</div>
          <div class="vmerge-box">系统稳定</div>
        </div>
        <div class="vmerge-out">重构问题：哪些必须稳、哪些可以先粗<br>→ 核心链路做稳 + 后台手工补齐</div>`,
          '不是折中，是重新划分边界');
      }
      case 'pyramid3': {
        const widths = [46, 70, 94];
        const rows = v.data.map((x, i) => `
          <div class="vpyr-row" style="width:${widths[i]}%;--i:${i}">
            <b>${esc(x.t)}</b><span>${esc(x.n)}</span>
          </div>`).join('');
        return W(`<div class="vpyramid">${rows}</div>`, '结论在上，论据在下');
      }
      case 'mece': {
        const rows = ['获取', '激活', '留存', '变现', '传播']
          .map((x, i) => `<div class="vstep" style="flex:1;min-width:56px;text-align:center;padding:10px 6px">
            <span class="vstep-n">${i + 1}</span><b style="font-size:11.5px">${x}</b></div>`).join('');
        return W(`<div class="vsteps">${rows}</div>
          <p class="viz-cap" style="margin:12px 0 0">ME 不重叠 · CE 全覆盖 · 一次只用一个维度</p>`, '按用户旅程拆分');
      }
      case 'compare': {
        return W(`<div class="vmap">
          <div class="vmap-side"><h5>${esc(v.left.t)}</h5><p>${esc(v.left.d)}</p></div>
          <div class="vmap-arrow"><svg viewBox="0 0 20 20"><path d="M3 10h13M12 5l5 5-5 5"/></svg></div>
          <div class="vmap-side"><h5>${esc(v.right.t)}</h5><p>${esc(v.right.d)}</p></div>
        </div>`, '结构映射');
      }
      default:
        return '';
    }
  }

  /* ---------- 抽屉 ---------- */
  let lastFocus = null;

  function openModel(id, push) {
    const m = MODELS.find(x => x.id === id);
    if (!m) return;
    const d = DIM[m.dim];
    const idx = MODELS.indexOf(m);
    const prev = MODELS[idx - 1], next = MODELS[idx + 1];
    state.current = id;
    lastFocus = document.activeElement;

    const sec = (title, body) => body ? `<section class="dw-section"><h4>${title}</h4>${body}</section>` : '';

    const points = (m.points || []).map((p, i) => `
      <li><span class="pnum">${String(i + 1).padStart(2, '0')}</span>
        <div><b>${esc(p[0])}</b><span>${esc(p[1])}</span></div></li>`).join('');

    const steps = (m.steps || []).length
      ? `<ol class="dw-steps">${m.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>` : '';

    const html = `
      <div class="dw-head" style="--c:${d.color}">
        <span class="dw-dim"><i></i>${d.no} · ${d.name}</span>
        <button class="dw-icon-btn ${state.favs.has(m.id) ? 'on' : ''}" id="dwFav" aria-label="收藏">
          <svg viewBox="0 0 20 20"><path d="M10 2.6l2.3 4.7 5.2.8-3.8 3.7.9 5.2-4.6-2.4-4.6 2.4.9-5.2L2.5 8.1l5.2-.8z"/></svg>
        </button>
        <button class="dw-icon-btn" id="dwCopy" aria-label="复制为 Markdown" title="复制为 Markdown">
          <svg viewBox="0 0 20 20"><rect x="7" y="7" width="9" height="9" rx="1.6"/><path d="M13 7V4.6A1.6 1.6 0 0011.4 3H4.6A1.6 1.6 0 003 4.6v6.8A1.6 1.6 0 004.6 13H7"/></svg>
        </button>
        <button class="dw-icon-btn" id="dwClose" aria-label="关闭">
          <svg viewBox="0 0 20 20"><path d="M5 5l10 10M15 5L5 15"/></svg>
        </button>
      </div>

      <div class="dw-body" style="--c:${d.color}">
        <p class="dw-eyebrow">${d.name} / ${String(idx + 1).padStart(2, '0')} of ${MODELS.length}</p>
        <h2 class="dw-title" id="drawerTitle">${esc(m.name)}</h2>
        <p class="dw-en">${esc(m.en)}</p>
        <p class="dw-origin" style="--c:${d.color}">出处 · ${esc(m.origin)}</p>
        <blockquote class="dw-quote" style="--c:${d.color}">${esc(m.tagline)}</blockquote>

        ${vizOf(m)}

        ${sec('是什么', `<p class="dw-def">${esc(m.def)}</p>`)}
        ${sec('核心要点', `<ul class="dw-points">${points}</ul>`)}
        ${sec('怎么用', steps)}
        ${sec('何时用', `<div class="dw-when">${esc(m.when)}</div>`)}
        ${sec('一个例子', `<div class="dw-example">
            <div class="dw-example-head"><b>${esc(m.example[0])}</b></div>
            <p>${esc(m.example[1])}</p>
          </div>`)}
        ${sec('常见误区', `<ul class="dw-pitfalls">${(m.pitfalls || []).map(p => `<li>${esc(p)}</li>`).join('')}</ul>`)}
        ${sec('标签', `<div class="dw-tags">${(m.tags || []).map(t => `<span>${esc(t)}</span>`).join('')}</div>`)}
      </div>

      <div class="dw-foot" style="--c:${d.color}">
        <button class="dw-nav" id="dwPrev" ${prev ? '' : 'disabled'} aria-label="上一个">
          <svg viewBox="0 0 20 20"><path d="M16 10H4M9 5L4 10l5 5"/></svg>
        </button>
        <button class="dw-nav" id="dwNext" ${next ? '' : 'disabled'} aria-label="下一个">
          <svg viewBox="0 0 20 20"><path d="M4 10h12M11 5l5 5-5 5"/></svg>
        </button>
        <span class="spacer"></span>
        <button class="btn btn-sm btn-ghost done-btn ${state.done.has(m.id) ? 'on' : ''}" id="dwDone">
          ${state.done.has(m.id) ? '已掌握 ✓' : '标记为已掌握'}
        </button>
      </div>`;

    const drawer = $('#drawer');
    $('#drawerInner').innerHTML = html;
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    const scrim = $('#drawerScrim');
    scrim.hidden = false;
    requestAnimationFrame(() => scrim.classList.add('show'));
    document.body.classList.add('no-scroll');
    $('#drawerInner').scrollTop = 0;

    // 动画条形
    requestAnimationFrame(() => {
      $$('.vbar-fill', drawer).forEach(el => { el.style.width = el.dataset.w + '%'; });
    });

    $('#dwClose').onclick = () => closeDrawer(true);
    $('#dwFav').onclick = () => {
      toggleFav(m.id);
      $('#dwFav').classList.toggle('on', state.favs.has(m.id));
      renderGrid();
    };
    $('#dwCopy').onclick = () => copyModel(m);
    $('#dwDone').onclick = () => {
      toggleDone(m.id);
      const b = $('#dwDone');
      b.classList.toggle('on', state.done.has(m.id));
      b.textContent = state.done.has(m.id) ? '已掌握 ✓' : '标记为已掌握';
      renderGrid();
    };
    if (prev) $('#dwPrev').onclick = () => openModel(prev.id, true);
    if (next) $('#dwNext').onclick = () => openModel(next.id, true);

    $$('.vhat', drawer).forEach(h => {
      h.onclick = () => {
        const on = h.classList.contains('on');
        $$('.vhat', drawer).forEach(x => x.classList.remove('on'));
        if (!on) h.classList.add('on');
      };
    });

    if (push !== false) {
      history.pushState({ model: m.id }, '', '#m=' + m.id);
    }
    setTimeout(() => { const d = $('#drawer'); if (d) d.focus({ preventScroll: true }); }, 60);
  }

  function closeDrawer(updateHistory) {
    const drawer = $('#drawer');
    if (!drawer.classList.contains('open')) return;
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    const scrim = $('#drawerScrim');
    scrim.classList.remove('show');
    setTimeout(() => { if (!drawer.classList.contains('open')) scrim.hidden = true; }, 320);
    document.body.classList.remove('no-scroll');
    state.current = null;
    if (updateHistory !== false) {
      history.pushState({}, '', location.pathname + location.search);
    }
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function copyModel(m) {
    const lines = [
      `# ${m.name}（${m.en}）`,
      `> ${m.tagline}`,
      '',
      `**出处**：${m.origin}`,
      '',
      `## 是什么`,
      m.def,
      '',
      `## 核心要点`,
      ...(m.points || []).map((p, i) => `${i + 1}. **${p[0]}**：${p[1]}`),
      '',
      ...(m.steps || []).length ? ['## 怎么用', ...m.steps.map((s, i) => `${i + 1}. ${s}`), ''] : [],
      `## 何时用`,
      m.when,
      '',
      `## 一个例子：${m.example[0]}`,
      m.example[1],
      '',
      `## 常见误区`,
      ...(m.pitfalls || []).map(p => `- ${p}`),
      '',
      `标签：${(m.tags || []).join(' / ')}`,
      '',
      '—— 来自《发展力》交互手册'
    ];
    const text = lines.join('\n');
    const done = () => toast('已复制 Markdown，可直接粘贴到文档');
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else {
      fallbackCopy(text, done);
    }
  }

  function fallbackCopy(text, cb) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;left:-9999px;top:0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); cb(); } catch (e) { toast('复制失败，请手动选择文本'); }
    document.body.removeChild(ta);
  }

  function toggleFav(id) {
    if (state.favs.has(id)) { state.favs.delete(id); toast('已取消收藏'); }
    else { state.favs.add(id); toast('已收藏'); }
    persist();
    $('#favCount').textContent = state.favs.size;
  }

  function toggleDone(id) {
    if (state.done.has(id)) { state.done.delete(id); toast('已取消「已掌握」'); }
    else { state.done.add(id); toast('已标记为掌握，进度 +1'); }
    persist();
    $('#doneCount').textContent = state.done.size;
  }

  /* ---------- 全局搜索 ---------- */
  function openPalette() {
    const p = $('#palette'), s = $('#paletteScrim');
    if (p.classList.contains('open')) return;
    s.hidden = false;
    p.classList.add('open');
    p.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => s.classList.add('show'));
    const input = $('#paletteInput');
    input.value = '';
    state.paletteIdx = 0;
    renderPalette('');
    setTimeout(() => input.focus(), 40);
  }

  function closePalette() {
    const p = $('#palette'), s = $('#paletteScrim');
    p.classList.remove('open');
    p.setAttribute('aria-hidden', 'true');
    s.classList.remove('show');
    setTimeout(() => { if (!p.classList.contains('open')) s.hidden = true; }, 240);
  }

  function renderPalette(q) {
    const list = q.trim() ? searchModels(q) : MODELS.slice(0, 8);
    state.paletteResults = list;
    if (state.paletteIdx >= list.length) state.paletteIdx = 0;
    const wrap = $('#paletteList');
    if (!list.length) {
      wrap.innerHTML = `<p class="pal-empty">没有匹配的模型。试试「留存」「汇报」「冲突」。</p>`;
      return;
    }
    wrap.innerHTML = list.map((m, i) => {
      const d = DIM[m.dim];
      return `<button class="pal-row ${i === state.paletteIdx ? 'active' : ''}" data-id="${m.id}" style="--c:${d.color}">
        <span class="pal-dot"></span>
        <span class="pal-name">${esc(m.name)}</span>
        <span class="pal-tag">${esc(m.tagline)}</span>
        <span class="pal-dim">${d.name}</span>
      </button>`;
    }).join('');
    const active = $('.pal-row.active', wrap);
    if (active) active.scrollIntoView({ block: 'nearest' });
  }

  function bindPalette() {
    const input = $('#paletteInput');
    input.addEventListener('input', () => { state.paletteIdx = 0; renderPalette(input.value); });
    input.addEventListener('keydown', e => {
      const n = state.paletteResults.length;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        state.paletteIdx = (state.paletteIdx + 1) % n;
        renderPalette(input.value);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        state.paletteIdx = (state.paletteIdx - 1 + n) % n;
        renderPalette(input.value);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const m = state.paletteResults[state.paletteIdx];
        if (m) { closePalette(); openModel(m.id); }
      }
    });
    $('#paletteList').addEventListener('click', e => {
      const row = e.target.closest('.pal-row');
      if (row) { closePalette(); openModel(row.dataset.id); }
    });
    $('#paletteScrim').addEventListener('click', closePalette);
  }

  /* ---------- 路径 / 路线图 ---------- */
  function buildPaths() {
    $('#pathGrid').innerHTML = PATHS.map(p => `
      <article class="path-card" data-k="${p.k}" style="--c:${p.color}">
        <span class="path-k">${p.k}</span>
        <h3>${esc(p.title)}</h3>
        <p class="path-sub">${esc(p.sub)}</p>
        <p class="path-desc">${esc(p.desc)}</p>
        <ul class="path-steps">
          ${p.steps.map(s => {
            const i = s.indexOf('：');
            if (i < 0) return `<li>${esc(s)}</li>`;
            return `<li><b>${esc(s.slice(0, i))}</b>：${esc(s.slice(i + 1))}</li>`;
          }).join('')}
        </ul>
      </article>`).join('');
  }

  function buildRoadmap() {
    $('#roadmapList').innerHTML = ROADMAP.map(r => {
      const inner = `
        <span class="rm-dot"></span>
        <div class="rm-body">
          <h4>${esc(r.role)}</h4>
          <div class="rm-models">${r.models.map(m => `<span>${esc(m)}</span>`).join('')}</div>
        </div>
        <span class="rm-status ${r.href ? 'ready' : ''}">${esc(r.status)}</span>`;
      return r.href
        ? `<a class="rm-item" href="${esc(r.href)}">${inner}</a>`
        : `<div class="rm-item">${inner}</div>`;
    }).join('');
  }

  /* ---------- 事件绑定 ---------- */
  function bindEvents() {
    // 主题
    $('#themeToggle').addEventListener('click', () => {
      applyTheme(state.theme === 'dark' ? 'light' : 'dark');
    });

    // 移动端菜单
    const menuBtn = $('#menuBtn'), mnav = $('#mobileNav');
    menuBtn.addEventListener('click', () => {
      const open = mnav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
    });
    mnav.addEventListener('click', e => {
      if (e.target.tagName === 'A') {
        mnav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });

    // 搜索
    $('#searchTrigger').addEventListener('click', openPalette);
    $('#libSearch').addEventListener('input', e => {
      state.filter.q = e.target.value;
      $('#clearSearch').hidden = !e.target.value;
      renderGrid();
    });
    $('#clearSearch').addEventListener('click', () => {
      $('#libSearch').value = '';
      state.filter.q = '';
      $('#clearSearch').hidden = true;
      renderGrid();
      $('#libSearch').focus();
    });
    $('#favFilter').addEventListener('click', e => {
      state.filter.fav = !state.filter.fav;
      e.currentTarget.setAttribute('aria-pressed', String(state.filter.fav));
      renderGrid();
    });
    $('#doneFilter').addEventListener('click', e => {
      state.filter.done = !state.filter.done;
      e.currentTarget.setAttribute('aria-pressed', String(state.filter.done));
      renderGrid();
    });
    $('#emptyReset').addEventListener('click', () => {
      state.filter = { dim: 'all', q: '', fav: false, done: false };
      $('#libSearch').value = '';
      $('#clearSearch').hidden = true;
      $('#favFilter').setAttribute('aria-pressed', 'false');
      $('#doneFilter').setAttribute('aria-pressed', 'false');
      $$('.dim-pill').forEach(p => p.setAttribute('aria-pressed', String(p.dataset.dim === 'all')));
      renderGrid();
    });

    // 卡片
    $('#modelGrid').addEventListener('click', e => {
      const fav = e.target.closest('[data-fav]');
      if (fav) {
        e.stopPropagation();
        toggleFav(fav.dataset.fav);
        fav.classList.toggle('on', state.favs.has(fav.dataset.fav));
        if (state.filter.fav) renderGrid();
        return;
      }
      const card = e.target.closest('.model-card');
      if (card) openModel(card.dataset.id);
    });
    $('#modelGrid').addEventListener('keydown', e => {
      const card = e.target.closest('.model-card');
      if (card && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        openModel(card.dataset.id);
      }
    });

    // 抽屉
    $('#drawerScrim').addEventListener('click', () => closeDrawer(true));

    // 雷达
    $('#radarReset').addEventListener('click', () => {
      state.ratings = {};
      persist();
      updateRadar();
      toast('已清空自评');
    });
    $('#radarFocus').addEventListener('click', e => {
      const id = e.currentTarget.dataset.model;
      if (id) openModel(id);
    });

    // 随机
    $('#randomBtn').addEventListener('click', () => {
      const m = MODELS[Math.floor(Math.random() * MODELS.length)];
      openModel(m.id);
    });

    // 键盘
    document.addEventListener('keydown', e => {
      const tag = (e.target.tagName || '').toLowerCase();
      const typing = tag === 'input' || tag === 'textarea';

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openPalette();
        return;
      }
      if (e.key === 'Escape') {
        if ($('#palette').classList.contains('open')) closePalette();
        else if ($('#drawer').classList.contains('open')) closeDrawer(true);
        return;
      }
      if (typing) return;
      if (e.key === '/') { e.preventDefault(); openPalette(); return; }
      if ($('#drawer').classList.contains('open')) {
        const idx = MODELS.findIndex(m => m.id === state.current);
        if (e.key === 'ArrowRight' && MODELS[idx + 1]) openModel(MODELS[idx + 1].id, true);
        if (e.key === 'ArrowLeft' && MODELS[idx - 1]) openModel(MODELS[idx - 1].id, true);
      }
    });

    // 路由
    window.addEventListener('popstate', () => {
      const m = location.hash.match(/^#m=(.+)$/);
      if (m) openModel(m[1], false);
      else closeDrawer(false);
    });

    // 滚动
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const st = window.scrollY;
        const h = document.documentElement.scrollHeight - window.innerHeight;
        $('#progress').style.width = (h > 0 ? (st / h) * 100 : 0) + '%';
        $('#siteHead').classList.toggle('scrolled', st > 12);
        $('#toTop').hidden = st < 600;

        // 导航高亮
        const secs = ['radar', 'library', 'paths', 'roadmap'];
        let active = '';
        secs.forEach(id => {
          const el = document.getElementById(id);
          if (el && el.getBoundingClientRect().top <= 140) active = id;
        });
        $$('.head-nav a, .mobile-nav a').forEach(a => {
          a.classList.toggle('active', a.dataset.nav === active);
        });
        ticking = false;
      });
    }, { passive: true });

    $('#toTop').addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- 滚动进场 ---------- */
  function bindReveal() {
    const items = $$('.reveal');
    if (!('IntersectionObserver' in window)) {
      items.forEach(i => i.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    items.forEach(i => io.observe(i));
  }

  /* ---------- 启动 ---------- */
  function init() {
    buildOrbit();
    buildRadar();
    buildScoreRows();
    buildDimFilter();
    buildPaths();
    buildRoadmap();
    renderGrid();
    bindEvents();
    bindPalette();
    bindReveal();
    updateRadar();

    // 分享链接
    const m = location.hash.match(/^#m=(.+)$/);
    if (m && MODELS.some(x => x.id === m[1])) {
      setTimeout(() => openModel(m[1], false), 220);
    }

    // 页脚仓库链接（若在 github.io 上，自动指向当前仓库）
    const host = location.hostname;
    if (host.endsWith('github.io')) {
      const user = host.split('.')[0];
      const repo = location.pathname.split('/')[1];
      if (repo) $('#repoLink').href = `https://github.com/${user}/${repo}`;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
