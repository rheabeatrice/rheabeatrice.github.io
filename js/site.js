function parseDescription(description) {
    return description.split('\n').map(paragraph => `<p>${escapeHtml(paragraph)}</p>`).join('');
}
// Basic site script to inject header/footer, render episodes from data/episodes.json,
// and handle mobile nav. Minimal dependency: none.
const site = (function () {
  const dataUrl = 'data/episodes.json';

  async function fetchJSON(url){
    const r = await fetch(url);
    if(!r.ok) throw new Error('Failed to load '+url);
    return r.json();
  }

  // inject header and footer (components)
  async function injectComponents(){
    const headerTarget = document.getElementById('site-header');
    const footerTarget = document.getElementById('site-footer');

    try {
      const [headerHtml, footerHtml] = await Promise.all([
        fetch('components/header.html').then(r => r.text()),
        fetch('components/footer.html').then(r => r.text())
      ]);
      headerTarget.innerHTML = headerHtml;
      footerTarget.innerHTML = footerHtml;
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

  // create an episode card element (for index grid and list)
  function createEpisodeCard(ep, asGrid = false){
    const card = document.createElement('article');
    card.className = asGrid ? 'episode-card' : 'episode-row';
    card.innerHTML = `
      <a class="episode-link" href="episode.html?id=${encodeURIComponent(ep.id)}" aria-label="Open episode ${escapeHtml(ep.title)}">
        <img src="${escapeAttr(ep.image)}" alt="${escapeAttr(ep.title)}">
      </a>
      <div class="${asGrid ? 'meta' : 'row-right'}">
        <h3><a href="episode.html?id=${encodeURIComponent(ep.id)}">${escapeHtml(ep.title)}</a></h3>
        <p>${escapeHtml(ep.shortDescription)}</p>
        <div class="audio"><audio controls preload="none" src="${escapeAttr(ep.audio)}"></audio></div>
      </div>
    `;
    return card;
  }

  function escapeHtml(s){
    return (s||'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function escapeAttr(s){ return escapeHtml(s); }

  // render top N episodes into a selector
  async function renderLatestEpisodes(selector, n=3){
    try{
      const data = await fetchJSON(dataUrl);
      const list = document.querySelector(selector);
      if(!list) return;
      const top = data.slice(0, n);
      list.innerHTML = '';
      top.forEach(ep => list.appendChild(createEpisodeCard(ep, true)));
    }catch(err){ console.error(err); }
  }

  // render full episodes listing
  async function renderAllEpisodes(selector){
    try{
      const data = await fetchJSON(dataUrl);
      const list = document.querySelector(selector);
      if(!list) return;
      list.innerHTML = '';
      data.forEach(ep => {
        const row = createEpisodeCard(ep, false);
        list.appendChild(row);
      });
    }catch(err){ console.error(err); list.innerHTML = '<p>Could not load episodes.</p>'; }
  }

  // render episode detail by reading ?id=...
  async function renderEpisodeDetail(selector){
    try{
      const params = new URLSearchParams(location.search);
      const id = params.get('id');
      if(!id){
        document.querySelector(selector).innerHTML = '<p>No episode selected.</p>';
        return;
      }
      const data = await fetchJSON(dataUrl);
      const ep = data.find(e => String(e.id) === String(id));
      if(!ep){
        document.querySelector(selector).innerHTML = '<p>Episode not found.</p>';
        return;
      }
      const target = document.querySelector(selector);
      target.innerHTML = `
        <h1>${escapeHtml(ep.title)}</h1>
        <p class="guests">${escapeHtml(ep.guests.join(', '))}</p>
        <img src="${escapeAttr(ep.image)}" alt="${escapeAttr(ep.title)}">
        <p>${escapeHtml(ep.longDescription)}</p>
        <div class="audio"><audio controls preload="none" src="${escapeAttr(ep.audio)}"></audio></div>
      `;
        const longDescription = parseDescription(episode.longDescription);
    }catch(err){ console.error(err); document.querySelector(selector).innerHTML = '<p>Could not load episode.</p>'; }
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
