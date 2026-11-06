/* ==========================================================================
   发展力 · 角色地图 · 渲染层
   依赖：data.js（DIMENSIONS / MODELS）、roles-data.js（ROLES / CAPS）
   ========================================================================== */
(function () {
  'use strict';

  const $ = (s, r) => (r || document).querySelector(s);
  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const DIM = Object.fromEntries(DIMENSIONS.map(d => [d.id, d]));
  const ORDER = DIMENSIONS.map(d => d.id);
  const M = Object.fromEntries(MODELS.map(m => [m.id, m]));
  const STORE = 'fzl.v1';

  /* ---------- 主题 ---------- */
  function currentTheme() {
    try {
      const s = JSON.parse(localStorage.getItem(STORE) || '{}');
      if (s.theme === 'dark' || s.theme === 'light') return s.theme;
    } catch (e) { /* ignore */ }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#0D0F12' : '#FBFAF7');
    try {
      const s = JSON.parse(localStorage.getItem(STORE) || '{}');
      s.theme = t;
      localStorage.setItem(STORE, JSON.stringify(s));
    } catch (e) { /* ignore */ }
  }
  const sunIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4"/></svg>';
  const moonIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/></svg>';

  /* ---------- 工具 ---------- */
  const NAV_BACK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
  const NAV_GO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';
  const CARET = '<svg class="caret" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';

  function head(crumbName, isIndex) {
    return `<header class="rp-head">
      <div class="rp-head-inner">
        <a class="rp-brand" href="${isIndex ? '../index.html' : '../index.html'}">
          <span class="mark">发</span>
          <span class="txt">发展力<em>Role Map</em></span>
        </a>
        <span class="div"></span>
        <nav class="rp-crumb" aria-label="面包屑">
          <a href="index.html">角色地图</a>
          ${crumbName ? `<i>/</i><b>${esc(crumbName)}</b>` : ''}
        </nav>
        <div class="rp-tools">
          <a class="rp-btn" href="../index.html#library" aria-label="模型库">
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.6"/></svg>
            <span>模型库</span>
          </a>
          <button class="rp-btn" id="themeBtn" type="button" aria-label="切换明暗主题">${moonIcon}<span>主题</span></button>
        </div>
      </div>
    </header>`;
  }

  function foot() {
    return `<footer class="rp-foot">
      <p>发展力 · 角色地图　内容基于《发展力》原稿重写与补充</p>
      <div class="links">
        <a href="../index.html">模型库</a>
        <a href="index.html">角色地图</a>
        <a href="../index.html#about">关于</a>
      </div>
    </footer>`;
  }

  /* ---------- 雷达 ---------- */
  function radar(dims) {
    const CX = 160, CY = 157, R = 122;
    const n = ORDER.length;
    const ang = i => (Math.PI * 2 * i / n) - Math.PI / 2;
    const pt = (i, r) => [CX + Math.cos(ang(i)) * r, CY + Math.sin(ang(i)) * r];

    let grid = '';
    [0.2, 0.4, 0.6, 0.8, 1].forEach(f => {
      const p = ORDER.map((_, i) => pt(i, R * f).map(v => v.toFixed(1)).join(',')).join(' ');
      grid += `<polygon points="${p}" fill="none" stroke="var(--line)" ${f === 1 ? 'stroke-width="1"' : ''}/>`;
    });
    ORDER.forEach((_, i) => {
      const [x, y] = pt(i, R);
      grid += `<line x1="${CX}" y1="${CY}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="var(--line)"/>`;
    });

    const shape = ORDER.map((id, i) => {
      const v = Math.max(0, Math.min(5, dims[id] || 0)) / 5;
      return pt(i, R * v).map(x => x.toFixed(1)).join(',');
    }).join(' ');

    let dots = '', labels = '';
    ORDER.forEach((id, i) => {
      const v = Math.max(0, Math.min(5, dims[id] || 0)) / 5;
      const [dx, dy] = pt(i, R * v);
      const d = DIM[id];
      if (v > 0) dots += `<circle cx="${dx.toFixed(1)}" cy="${dy.toFixed(1)}" r="3" fill="${d.color}" stroke="var(--card)" stroke-width="1.5"/>`;
      const [lx, ly] = pt(i, R + 19);
      const c = Math.cos(ang(i));
      const anchor = c > 0.25 ? 'start' : (c < -0.25 ? 'end' : 'middle');
      labels += `<text x="${lx.toFixed(1)}" y="${(ly + 3.5).toFixed(1)}" text-anchor="${anchor}"
        font-size="10.5" fill="var(--ink-3)" letter-spacing=".4">${esc(d.name)}</text>`;
    });

    return `<svg viewBox="0 0 320 320" role="img" aria-label="能力重心雷达图">
      ${grid}
      <polygon points="${shape}" fill="var(--accent)" fill-opacity=".14"
        stroke="var(--accent)" stroke-width="1.8" stroke-linejoin="round"/>
      ${dots}${labels}
    </svg>`;
  }

  /* ---------- 角色页 ---------- */
  function renderRole(root, role) {
    const idx = ROLES.indexOf(role);
    const prev = role.prev ? ROLES.find(r => r.id === role.prev) : null;
    const next = role.next ? ROLES.find(r => r.id === role.next) : null;

    const dimRows = ORDER
      .map(id => ({ id, d: DIM[id], v: role.dims[id] || 0 }))
      .sort((a, b) => b.v - a.v);

    const html = `
    ${head(role.name)}
    <main>
      <div class="wrap">
        <section class="rp-hero">
          <p class="rp-kicker rise">
            <span class="no">${esc(role.no)}</span>
            <span class="bar"></span>
            <span>角色 ${esc(role.no)} / 05</span>
          </p>
          <h1 class="rise">${esc(role.name)}</h1>
          <p class="en rise">${esc(role.en)}</p>
          <p class="rp-q rise">${esc(role.question)}</p>
          <p class="rp-lead rise">${esc(role.lead)}</p>
          <dl class="rp-meta rise">
            <div><dt>层级</dt><dd>${esc(role.level)}</dd></div>
            <div><dt>常见年限</dt><dd>${esc(role.years)}</dd></div>
            <div><dt>上一级</dt><dd>${prev ? `<a href="${prev.id}.html">${esc(prev.name)}</a>` : '—'}</dd></div>
            <div><dt>下一级</dt><dd>${next ? `<a href="${next.id}.html">${esc(next.name)}</a>` : '—'}</dd></div>
          </dl>
        </section>

        <section class="sec" id="paid">
          <div class="sec-head rise">
            <span class="n">01</span>
            <h2>这个角色，真正被付费的是什么</h2>
            <p>不是职级描述里的职责清单，是三件别人愿意为此付钱的结果。做不好这三件事，其他再忙都不算数。</p>
          </div>
          <div class="deliver-grid rise">
            ${role.deliver.map((d, i) => `<article class="deliver">
              <span class="i">0${i + 1}</span>
              <h4>${esc(d.t)}</h4>
              <p>${esc(d.d)}</p>
            </article>`).join('')}
          </div>
        </section>

        <section class="sec" id="dims">
          <div class="sec-head rise">
            <span class="n">02</span>
            <h2>能力重心：九个维度的配比</h2>
            <p>同一个模型在不同角色手上的权重完全不同。这张图不是评分，是这个角色把时间花在哪儿的比例参考。</p>
          </div>
          <div class="dim-panel rise">
            <div class="dim-radar">${radar(role.dims)}<p class="dim-cap">九维配比 · 5 分为最高<br>横向对比见 <a href="index.html#matrix">能力矩阵</a></p></div>
            <div class="dim-bars">
              ${dimRows.map(r => `<div class="dim-row">
                <span class="nm">${esc(r.d.name)}<i>${esc(r.d.claim)}</i></span>
                <span class="dim-track"><span class="dim-fill" style="--c:${r.d.color};background:linear-gradient(90deg, ${r.d.color}66, ${r.d.color})" data-h="${r.v * 20}"></span></span>
                <span class="v">${r.v}/5</span>
              </div>`).join('')}
            </div>
          </div>
        </section>

        <section class="sec" id="shifts">
          <div class="sec-head rise">
            <span class="n">03</span>
            <h2>三次转变</h2>
            <p>角色升级失败，多数不是能力不够，是该放手的东西没放下。这三条是岗位上真正会卡住人的地方。</p>
          </div>
          <div class="shift-list rise">
            ${role.shifts.map((s, i) => `<div class="shift">
              <span class="idx">0${i + 1}</span>
              <div>
                <p class="move"><span class="from">${esc(s.from)}</span><span class="arw">→</span><span class="to">${esc(s.to)}</span></p>
                <p>${esc(s.note)}</p>
              </div>
            </div>`).join('')}
          </div>
        </section>

        <section class="sec" id="models">
          <div class="sec-head rise">
            <span class="n">04</span>
            <h2>必会的六个模型</h2>
            <p>从 42 个模型里挑出的六个，覆盖这个角色最常遇到的判断场景。点击可以直接打开完整说明。</p>
          </div>
          <div class="model-grid rise">
            ${role.models.map(r => {
              const m = M[r.id];
              if (!m) return '';
              const d = DIM[m.dim];
              return `<a class="mcard" href="../index.html#m=${encodeURIComponent(m.id)}" style="--c:${d.color}">
                <div class="top"><h4>${esc(m.name)}</h4><span class="dim">${esc(d.name)}</span></div>
                <p class="why">${esc(r.why)}</p>
                <span class="go">打开模型 ${NAV_GO.replace('viewBox', 'width="13" height="13" viewBox')}</span>
              </a>`;
            }).join('')}
          </div>
        </section>

        <section class="sec" id="scenes">
          <div class="sec-head rise">
            <span class="n">05</span>
            <h2>四个高频道场</h2>
            <p>每个角色都有反复出现的难题。这里给出处理顺序，以及最容易踩的那一脚。</p>
          </div>
          <div class="scene-list rise">
            ${role.scenes.map((s, i) => `<details class="scene"${i === 0 ? ' open' : ''}>
              <summary>
                <span class="q">${esc(s.q)}</span>
                ${CARET}
              </summary>
              <div class="body">
                <div class="row"><span class="lb">怎么做</span><span class="tx">${esc(s.do)}</span></div>
                <div class="row trap"><span class="lb">容易踩的坑</span><span class="tx">${esc(s.trap)}</span></div>
              </div>
            </details>`).join('')}
          </div>
        </section>

        <section class="sec" id="fails">
          <div class="sec-head rise">
            <span class="n">06</span>
            <h2>卡在这个层级的四种原因</h2>
            <p>下面每一条，都是同层级的人反复出现、并且自己很难察觉的模式。</p>
          </div>
          <div class="fail-grid rise">
            ${role.fails.map(f => `<div class="fail">
              <h4>${esc(f.t)}</h4>
              <p>${esc(f.d)}</p>
            </div>`).join('')}
          </div>
        </section>

        <section class="sec" id="plan">
          <div class="sec-head rise">
            <span class="n">07</span>
            <h2>90 天：从理解到做到</h2>
            <p>不需要一次全做。三个月能真正完成其中六七件，这个角色就立住了。</p>
          </div>
          <div class="plan rise">
            ${role.plan.map((p, i) => `<div class="plan-stage">
              <div class="dot"></div>
              <h4>${esc(p.label)}<span>${esc(p.d)}</span></h4>
              <ul>${p.items.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
            </div>`).join('')}
          </div>
        </section>

        <section class="sec" id="next">
          <div class="sec-head rise">
            <span class="n">08</span>
            <h2>什么时候算准备好了</h2>
            <p>晋升不是熬够年限，是行为先变了。下面这些信号出现三条以上，说明你已经在做下一级的事。</p>
          </div>
          <div class="next-box rise">
            <div>
              <h4>准备好向上走的信号</h4>
              <ul class="sig">${role.signals.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
            </div>
            <div>
              <h4>下一步</h4>
              ${next ? `<a class="next-role-link" href="${next.id}.html">
                <span><span class="nm">${esc(next.name)}</span><span class="en">${esc(next.en)}</span></span>
                ${NAV_GO}
              </a>` : `<div class="next-role-link">
                <span><span class="nm">没有标准答案</span><span class="en">Beyond CTO</span></span>
              </div>`}
              <p>${esc(role.nextNote)}</p>
            </div>
          </div>
        </section>

        <blockquote class="rp-quote rise"><p>${esc(role.quote)}</p></blockquote>

        <nav class="rp-nav" aria-label="角色导航">
          ${prev ? `<a href="${prev.id}.html">
            <span class="lb">${NAV_BACK.replace('viewBox', 'width="13" height="13" viewBox')} 上一级</span>
            <span class="nm">${esc(prev.name)}</span>
          </a>` : `<div class="placeholder"></div>`}
          ${next ? `<a class="end" href="${next.id}.html">
            <span class="lb">下一级 ${NAV_GO.replace('viewBox', 'width="13" height="13" viewBox')}</span>
            <span class="nm">${esc(next.name)}</span>
          </a>` : `<a class="end" href="index.html">
            <span class="lb">回到总览 ${NAV_GO.replace('viewBox', 'width="13" height="13" viewBox')}</span>
            <span class="nm">角色地图</span>
          </a>`}
        </nav>
        ${foot()}
      </div>
    </main>`;

    root.innerHTML = html;
    document.title = `${role.name} · 角色地图 · 发展力`;
    const desc = $('meta[name="description"]');
    if (desc) desc.setAttribute('content', `${role.name}（${role.en}）：${role.question}`);
  }

  /* ---------- 总览页 ---------- */
  function renderIndex(root) {
    const lvName = v => ['—', '了解', '会用', '熟练', '主力', '核心'][v] || '—';

    const html = `
    ${head('')}
    <main>
      <div class="wrap">
        <section class="ov-hero">
          <p class="rp-kicker rise"><span class="bar"></span><span>角色地图 · Role Map</span></p>
          <h1 class="rise">能力域是坐标，<br>角色才是你的位置。</h1>
          <p class="sub rise">
            同样一个模型，程序员用它写方案，CTO 用它换预算——内核一样，用法完全不同。
            这里把原稿的角色章节展开成五条路径，每一页回答同一个问题：<b>这个位置上，什么才算把事做成。</b>
          </p>
        </section>

        <section class="sec" id="ladder">
          <div class="sec-head rise">
            <span class="n">01</span>
            <h2>五级阶梯</h2>
            <p>从写代码到定方向，每一级都要放弃上一级最擅长的那件事。这五页是可以按顺序读的。</p>
          </div>
          <div class="ladder rise">
            ${ROLES.map(r => `<a class="rung" href="${r.id}.html">
              <span class="num"><i>${esc(r.no)}</i></span>
              <span class="body">
                <h3>${esc(r.name)}<em>${esc(r.en)}</em></h3>
                <p class="q">${esc(r.question)}</p>
                <span class="chips">${r.dims ? ORDER.slice().sort((a, b) => (r.dims[b] || 0) - (r.dims[a] || 0)).slice(0, 3).map(id => `<span>${esc(DIM[id].name)}</span>`).join('') : ''}<span>${esc(r.years)}</span></span>
              </span>
              <span class="go">打开 ${NAV_GO.replace('viewBox', 'width="13" height="13" viewBox')}</span>
            </a>`).join('')}
          </div>
        </section>

        <section class="sec" id="matrix">
          <div class="sec-head rise">
            <span class="n">02</span>
            <h2>能力矩阵</h2>
            <p>五个角色在九个能力维度上的配比。越深代表这个维度越决定成败，不代表其他维度不重要。</p>
          </div>
          <div class="matrix-wrap rise">
            <table class="matrix">
              <thead>
                <tr>
                  <th>能力维度</th>
                  ${ROLES.map(r => `<th><a href="${r.id}.html#dims">${esc(r.name)}</a></th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${ORDER.map(id => `<tr>
                  <th>${esc(DIM[id].name)}<i>${esc(DIM[id].en)}</i></th>
                  ${ROLES.map(r => {
                    const v = r.dims[id] || 0;
                    return `<td><div class="cell lv${v}" title="${esc(r.name)} · ${esc(DIM[id].name)}：${lvName(v)}">${v || '·'}</div></td>`;
                  }).join('')}
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
          <p class="matrix-hint">左右滑动查看全部角色 →</p>
          <div class="matrix-legend rise">
            <span>权重</span>
            <span class="scale">
              <i style="background:color-mix(in srgb, var(--ink) 5%, transparent)"></i>
              <i style="background:color-mix(in srgb, var(--ink) 10%, transparent)"></i>
              <i style="background:color-mix(in srgb, var(--accent) 26%, transparent)"></i>
              <i style="background:color-mix(in srgb, var(--accent) 52%, transparent)"></i>
              <i style="background:color-mix(in srgb, var(--accent) 82%, transparent)"></i>
            </span>
            <span>低 → 高</span>
          </div>
        </section>

        <section class="sec" id="caps">
          <div class="sec-head rise">
            <span class="n">03</span>
            <h2>另一条组织方式：按能力</h2>
            <p>角色是横切面，能力是纵切面。原稿后半段把同样的模型按能力重新分了一次组，这里补齐为五组常用工具。</p>
          </div>
          <div class="cap-grid rise">
            ${CAPS.map(c => `<article class="cap">
              <h4>${esc(c.name)}<em>${esc(c.en)}</em></h4>
              <p>${esc(c.desc)}</p>
              <div class="chips">
                ${c.models.map(id => {
                  const m = M[id];
                  return m ? `<a href="../index.html#m=${encodeURIComponent(id)}">${esc(m.name)}</a>` : '';
                }).join('')}
              </div>
            </article>`).join('')}
          </div>
        </section>

        <section class="sec" id="about">
          <div class="note-block rise">
            <div>
              <h3>关于这部分内容</h3>
              <span class="tag">原稿标注「待补充」</span>
            </div>
            <div class="tx">
              <p>原稿第 35 页之后的角色章节，只留下了骨架：五个角色、每组五个模型位。但每个模型位下面的正文，是其他章节内容的复制粘贴——例如「程序员 · 技术规划」下写的是五大圈层模型，「杠杆思维」下写的是 SOFEN 倾听技巧。</p>
              <p><b>这里保留了原稿的骨架和顺序，把正文重写了一遍。</b>每个角色的结构统一为：被付费的交付物 → 能力配比 → 三次转变 → 必会模型 → 高频场景 → 失败模式 → 90 天动作 → 跃迁信号。角色下方的模型，是从前 34 页的 42 个模型里按场景相关性重新挑的，不是照抄原稿的模型位。</p>
              <p>判断标准只有一条：读完之后，你能不能说清<b>自己现在这一级该放下什么</b>。如果说不清，这一页对你还没生效。</p>
            </div>
          </div>
        </section>

        ${foot()}
      </div>
    </main>`;

    root.innerHTML = html;
    document.title = '角色地图 · 发展力';
  }

  /* ---------- 动效 ---------- */
  function reveal() {
    const els = Array.from(document.querySelectorAll('.rise'));
    if (!('IntersectionObserver' in window)) {
      els.forEach(e => e.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .05 });
    els.forEach(e => io.observe(e));
    // 首屏立即显示
    requestAnimationFrame(() => {
      els.slice(0, 5).forEach(e => e.classList.add('in'));
    });
  }

  function animateBars() {
    const bars = Array.from(document.querySelectorAll('.dim-fill'));
    if (!bars.length) return;
    const run = b => { b.style.width = (b.dataset.h || 0) + '%'; };
    if (!('IntersectionObserver' in window)) { bars.forEach(run); return; }
    const io = new IntersectionObserver((es) => {
      es.forEach(e => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
    }, { threshold: .2 });
    bars.forEach(b => io.observe(b));
  }

  /* ---------- 启动 ---------- */
  function boot() {
    applyTheme(currentTheme());
    const root = $('#app');
    const page = document.body.dataset.page;

    if (page === 'role') {
      const role = ROLES.find(r => r.id === document.body.dataset.role);
      if (!role) { root.innerHTML = '<p style="padding:120px 28px">未找到该角色。</p>'; return; }
      renderRole(root, role);
    } else {
      renderIndex(root);
    }

    const btn = $('#themeBtn');
    if (btn) {
      btn.addEventListener('click', () => {
        const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        btn.innerHTML = (next === 'dark' ? sunIcon : moonIcon) + '<span>主题</span>';
      });
      btn.innerHTML = (document.documentElement.getAttribute('data-theme') === 'dark' ? sunIcon : moonIcon) + '<span>主题</span>';
    }

    reveal();
    animateBars();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
