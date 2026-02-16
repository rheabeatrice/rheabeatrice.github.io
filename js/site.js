// Basic site script to inject header/footer, render episodes from data/episodes.json,
// support HTML in long descriptions (sanitized), render references, and handle mobile nav.
// Minimal dependency: none.
const site = (function () {
  const dataUrl = 'data/episodes.json';

  async function fetchJSON(url){
    const r = await fetch(url);
    if(!r.ok) throw new Error('Failed to load '+url);
    return r.json();
  }

  // ----------------------------
  // Escaping + Sanitization
  // ----------------------------
  function escapeHtml(s){
    return (s||'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function escapeAttr(s){ return escapeHtml(s); }

  // Allowlist sanitizer: permits basic formatting + links.
  // If you fully control episodes.json, this is usually enough for a static site.
  function sanitizeHtml(html){
    const allowedTags = new Set([
      'P','BR','EM','I','STRONG','B','A',
      'UL','OL','LI','CODE','PRE','BLOCKQUOTE','SPAN'
    ]);

    const allowedAttrs = {
      'A': new Set(['href','title','target','rel']),
      'SPAN': new Set(['class'])
    };

    const tpl = document.createElement('template');
    tpl.innerHTML = html || '';

    // Walk elements; strip unknown tags/attrs and dangerous handlers.
    const walker = document.createTreeWalker(tpl.content, NodeFilter.SHOW_ELEMENT, null);

    while (walker.nextNode()){
      const el = walker.currentNode;

      // Remove disallowed elements by replacing them with their children
      if (!allowedTags.has(el.tagName)){
        const frag = document.createDocumentFragment();
        while (el.firstChild) frag.appendChild(el.firstChild);
        el.replaceWith(frag);
        continue;
      }

      // Remove event handler attributes, and disallow arbitrary attributes
      [...el.attributes].forEach(attr => {
        const name = attr.name.toLowerCase();
        if (name.startsWith('on')) {
          el.removeAttribute(attr.name);
          return;
        }

        const allowed = allowedAttrs[el.tagName];
        if (allowed) {
          if (!allowed.has(attr.name)) el.removeAttribute(attr.name);
        } else {
          // for all other allowed tags, strip all attributes
          el.removeAttribute(attr.name);
        }
      });

      // Lock down links
      if (el.tagName === 'A'){
        const href = el.getAttribute('href') || '';
        // only allow http(s) and mailto
        if (!/^(https?:|mailto:)/i.test(href)) {
          el.removeAttribute('href');
        }
        el.setAttribute('rel','noopener noreferrer');
        el.setAttribute('target','_blank');
      }
    }

    return tpl.innerHTML;
  }

  function formatDateISO(dateStr){
    if(!dateStr) return '';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString(undefined, { year:'numeric', month:'long', day:'numeric' });
  }

  function renderTags(tags){
    if(!tags || !tags.length) return '';
    return tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join(' ');
  }

  // References: [{label, url?}, ...] -> [1] label, etc.
  function renderReferences(refs){
    if(!refs || !refs.length) return '';
    const items = refs.map((r, i) => {
      const label = escapeHtml(r.label || '');
      if (r.url) {
        const url = escapeAttr(r.url);
        return `<li><span class="ref-num">[${i+1}]</span> <a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a></li>`;
      }
      return `<li><span class="ref-num">[${i+1}]</span> ${label}</li>`;
    }).join('');

    return `
      <section class="episode-refs" aria-label="References">
        <h2>References</h2>
        <ol class="refs-list">${items}</ol>
      </section>
    `;
  }

  // ----------------------------
  // Components (header/footer)
  // ----------------------------
  async function injectComponents(){
    const headerTarget = document.getElementById('site-header');
    const footerTarget = document.getElementById('site-footer');

    try {
      const [headerHtml, footerHtml] = await Promise.all([
        fetch('components/header.html').then(r => r.text()),
        fetch('components/footer.html').then(r => r.text())
      ]);
      if (headerTarget) headerTarget.innerHTML = headerHtml;
      if (footerTarget) footerTarget.innerHTML = footerHtml;

      // set footer year
      const yearEl = document.getElementById('year');
      if(yearEl) yearEl.textContent = new Date().getFullYear();

      // wire nav toggle
      const toggle = document.getElementById('nav-toggle');
      const nav = document.getElementById('site-nav');
      if(toggle && nav){
        toggle.addEventListener('click', () => {
          const expanded = toggle.getAttribute('aria-expanded') === 'true';
          toggle.setAttribute('aria-expanded', String(!expanded));
          nav.setAttribute('aria-hidden', String(expanded));
        });
        // ensure initial state
        nav.setAttribute('aria-hidden', 'true');
      }
    } catch(err){
      console.error('Error injecting components', err);
    }
  }

  // ----------------------------
  // Episode cards (index grid + list)
  // ----------------------------
  function createEpisodeCard(ep, asGrid = false){
    const card = document.createElement('article');
    card.className = asGrid ? 'episode-card' : 'episode-row';

    const date = ep.date ? formatDateISO(ep.date) : '';

    card.innerHTML = `
      <a class="episode-link" href="episode.html?id=${encodeURIComponent(ep.id)}" aria-label="Open episode ${escapeHtml(ep.title)}">
        <img src="${escapeAttr(ep.image)}" alt="${escapeAttr(ep.title)}">
      </a>
      <div class="${asGrid ? 'meta' : 'row-right'}">
        <h3><a href="episode.html?id=${encodeURIComponent(ep.id)}">${escapeHtml(ep.title)}</a></h3>
        ${date ? `<div class="ep-date">${escapeHtml(date)}</div>` : ''}
        <p>${escapeHtml(ep.shortDescription || '')}</p>
        <div class="audio"><audio controls preload="none" src="${escapeAttr(ep.audio)}"></audio></div>
      </div>
    `;
    return card;
  }

  // Sort newest first (by ISO date) if present, otherwise keep original order.
  function sortEpisodes(data){
    if(!Array.isArray(data)) return [];
    const hasDates = data.some(e => e && e.date);
    if(!hasDates) return data;
    return [...data].sort((a,b)=> (String(b.date||'')).localeCompare(String(a.date||'')));
  }

  async function renderLatestEpisodes(selector, n=3){
    try{
      const dataRaw = await fetchJSON(dataUrl);
      const data = sortEpisodes(dataRaw);
      const list = document.querySelector(selector);
      if(!list) return;

      const top = data.slice(0, n);
      list.innerHTML = '';
      top.forEach(ep => list.appendChild(createEpisodeCard(ep, true)));
    }catch(err){
      console.error(err);
    }
  }

  async function renderAllEpisodes(selector){
    const list = document.querySelector(selector);
    try{
      const dataRaw = await fetchJSON(dataUrl);
      const data = sortEpisodes(dataRaw);
      if(!list) return;

      list.innerHTML = '';
      data.forEach(ep => list.appendChild(createEpisodeCard(ep, false)));
    }catch(err){
      console.error(err);
      if(list) list.innerHTML = '<p>Could not load episodes.</p>';
    }
  }

  // ----------------------------
  // Episode detail (HTML description + refs + media layout)
  // ----------------------------
  async function renderEpisodeDetail(selector){
    const target = document.querySelector(selector);
    try{
      const params = new URLSearchParams(location.search);
      const id = params.get('id');

      if(!target) return;

      if(!id){
        target.innerHTML = '<p>No episode selected.</p>';
        return;
      }

      const dataRaw = await fetchJSON(dataUrl);
      const data = Array.isArray(dataRaw) ? dataRaw : [];
      const ep = data.find(e => String(e.id) === String(id));

      if(!ep){
        target.innerHTML = '<p>Episode not found.</p>';
        return;
      }

      const date = ep.date ? formatDateISO(ep.date) : '';
      const guests = (ep.guests || []).length ? escapeHtml(ep.guests.join(', ')) : '';
      const tagsHtml = renderTags(ep.tags);

      // Prefer longDescriptionHtml (sanitized). Fall back to longDescription as plain text.
      const longHtml = ep.longDescriptionHtml
        ? sanitizeHtml(ep.longDescriptionHtml)
        : (ep.longDescription ? `<p>${escapeHtml(ep.longDescription)}</p>` : '');

      const refsHtml = renderReferences(ep.references);

      target.innerHTML = `
        <div class="episode-detail">
          <header class="episode-head">
            <h1>${escapeHtml(ep.title)}</h1>
            <div class="episode-sub">
              ${date ? `<span class="ep-date">${escapeHtml(date)}</span>` : ''}
              ${guests ? `<span class="ep-guests">${guests}</span>` : ''}
            </div>
            ${tagsHtml ? `<div class="episode-tags">${tagsHtml}</div>` : ''}
          </header>

          <div class="episode-layout">
            <aside class="episode-media">
              <img src="${escapeAttr(ep.image)}" alt="${escapeAttr(ep.title)}">
              <audio class="episode-audio" controls preload="none" src="${escapeAttr(ep.audio)}"></audio>
            </aside>

            <article class="episode-body">
              ${longHtml}
              ${refsHtml}
            </article>
          </div>
        </div>
      `;
    } catch(err){
      console.error('renderEpisodeDetail failed:', err);
      const target = document.querySelector(selector);
      if(target) target.innerHTML = '<p>Could not load episode.</p>';
    }
  }

  // public init
  async function init(){
    await injectComponents();
  }

  return {
    init,
    renderLatestEpisodes,
    renderAllEpisodes,
    renderEpisodeDetail
  };
})();
