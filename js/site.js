function parseDescription(description) {
    return description.split('\n').map(paragraph => `<p>${escapeHtml(paragraph)}</p>`).join('');
}

function renderEpisodeDetail(episode) {
    // ... existing code ...
    const longDescription = parseDescription(episode.longDescription);
    // ... use longDescription in rendering ...
}