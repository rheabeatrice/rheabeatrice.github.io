---
layout: default
title: "Podcast Episodes"
permalink: /podcast/
---

<!--
Episode listing page for the "Mind In Society" podcast.
Expected: each episode in the collection `_podcast/` has front matter fields:
  - title: "Episode 27: ..."
  - date: 2025-12-05
  - image: /assets/images/episode-27-art.jpg    (square artwork)
  - excerpt: "Short teaser text..."            (optional)
This template renders a large square image on the left and the episode text on the right,
matching the screenshot layout. On small screens it stacks vertically.
-->

<style>
  :root{
    --max-width:1200px;
    --accent:#f08a5d;     /* read-more color (change to suit your brand) */
    --muted:#6b7280;
    --title-color:#0b1220;
  }

  .episodes-wrap {
    max-width: var(--max-width);
    margin: 4rem auto;
    padding: 0 2rem;
  }

  /* Each episode row */
  .episode-row {
    display: grid;
    grid-template-columns: 1fr 1fr; /* left: image (square), right: content */
    gap: 4rem;
    align-items: start;
    margin-bottom: 5rem;
    align-items: center;
  }

  /* Left: square artwork */
  .episode-art {
    width: 100%;
    max-width: 680px;      /* control how large the left artwork can grow */
    aspect-ratio: 1 / 1;   /* keep artwork square */
    display: block;
    overflow: hidden;
    border-radius: 6px;
    box-shadow: 0 12px 30px rgba(10,20,30,0.06);
  }
  .episode-art img{
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  /* Right: text column */
  .episode-body { padding-right: 1rem; }

  .ep-date {
    display:block;
    color: var(--muted);
    margin-bottom: 0.75rem;
    font-weight: 500;
  }

  .ep-title {
    margin: 0 0 1.25rem 0;
    color: var(--title-color);
    font-size: clamp(1.6rem, 3.6vw, 3.0rem); /* large heading like screenshot */
    line-height: 1.02;
    font-weight: 800;
    letter-spacing: -0.02em;
  }

  .ep-title a {
    color: inherit;
    text-decoration: none;
  }
  .ep-title a:hover { text-decoration: underline; }

  .ep-excerpt {
    color: #111827;
    margin: 0 0 1.25rem 0;
    font-size: 1.05rem;
    line-height: 1.7;
    max-width: 52ch; /* keep the line lengths comfortable */
  }

  /* allow short teaser lines to appear like the screenshot */
  .ep-excerpt p { margin: 0 0 0.75rem 0; }

  .read-more {
    color: var(--accent);
    display: inline-block;
    font-weight: 600;
    text-decoration: none;
    border-bottom: 2px solid rgba(240,138,93,0.18);
    padding-bottom: 2px;
    margin-top: 0.25rem;
  }
  .read-more:hover {
    border-bottom-color: var(--accent);
  }

  /* If you want more visual breathing room on very wide screens */
  @media (min-width: 1500px) {
    .episodes-wrap { padding-left: 3rem; padding-right: 3rem; }
    .episode-row { gap: 6rem; }
  }

  /* Responsive: stack image above on narrow screens */
  @media (max-width: 900px) {
    .episode-row {
      grid-template-columns: 1fr;
      gap: 1.25rem;
      margin-bottom: 2.25rem;
    }
    .episode-art { max-width: 100%; aspect-ratio: 16 / 9; } /* less tall on mobile */
    .ep-excerpt { max-width: 100%; }
  }

  /* Small screens: compact spacing */
  @media (max-width: 420px) {
    .ep-title { font-size: 1.25rem; }
    .ep-excerpt { font-size: 1rem; }
  }
</style>

<main class="episodes-wrap" role="main" aria-labelledby="episodes-heading">
  <h1 id="episodes-heading" style="margin:0 0 2rem 0;">Episodes</h1>

  {% comment %}
  Loop through podcast collection. Adjust the sort order if needed.
  {% endcomment %}
  {% assign episodes = site.podcast | sort: "date" | reverse %}
  {% for ep in episodes %}
    <article class="episode-row" aria-labelledby="ep-{{ forloop.index }}-title">
      <!-- LEFT: artwork -->
      <figure class="episode-art" aria-hidden="false">
        <a href="{{ ep.url | relative_url }}">
          <img
            src="{{ ep.image | default: '/assets/images/episode-placeholder.jpg' }}"
            alt="{{ ep.title | xml_escape }}"
            loading="lazy"
            decoding="async"
          >
        </a>
      </figure>

      <!-- RIGHT: date, title, excerpt, link -->
      <div class="episode-body">
        <time class="ep-date" datetime="{{ ep.date | date_to_xmlschema }}">{{ ep.date | date: "%-m/%-d/%y" }}</time>

        <h2 id="ep-{{ forloop.index }}-title" class="ep-title">
          <a href="{{ ep.url | relative_url }}">{{ ep.title }}</a>
        </h2>

        <div class="ep-excerpt">
          {% if ep.excerpt %}
            {{ ep.excerpt | markdownify }}
          {% else %}
            {{ ep.content | strip_html | truncatewords: 40 }}
          {% endif %}
        </div>

        <a class="read-more" href="{{ ep.url | relative_url }}">Read More</a>
      </div>
    </article>
  {% endfor %}
</main>
