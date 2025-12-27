```liquid
{% assign eps = site.data.episodes %}
{% if eps and eps != empty %}
  {% assign episodes = eps | sort: "date" %}
  {% for ep in episodes %}
  <article class="episode">
    <h3><a href="{{ ep.url | default: '#' }}">{{ ep.title }}</a></h3>
    <p class="meta">{{ ep.date }} — {{ ep.guests | join: ", " }}</p>
    <p>{{ ep.shortDescription }}</p>
  </article>
  {% endfor %}
{% else %}
  <p>No episodes found. Make sure a valid JSON file exists at <code>_data/episodes.json</code> with a top-level array of episodes, for example:</p>
  <pre>[
  {
    "id": "ep001",
    "title": "How Context Shapes Thought",
    "date": "2025-11-05",
    "shortDescription": "A short conversation...",
    "image": "/images/episode1.jpg",
    "audio": "/audio/episode1.mp3",
    "guests": ["Dr. A"]
  }
]</pre>
{% endif %}
```
