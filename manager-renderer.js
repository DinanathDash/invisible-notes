const COLOR_TINTS = {
  yellow: '#f0e27f',
  green: '#bbf7d0',
  blue: '#bfdbfe',
  pink: '#fbcfe8',
  purple: '#ddd6fe',
  dark: '#28292e'
};

const ICONS = {
  eye: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
  eyeOff: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/></svg>',
  trash: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0-1 14a2 2 0 01-2 2H7a2 2 0 01-2-2L4 6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>',
  notes: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h12l4 4v12H4z"/><path d="M16 4v4h4"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="13" y2="16"/></svg>'
};

const listEl = document.getElementById('list');
const searchEl = document.getElementById('search');

let notes = [];
let query = '';

function label(note) {
  return (note.title || '').trim();
}

function snippet(note) {
  let text = (note.text || '')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/(div|p|h1|h2|h3|li|pre|blockquote|ul|ol)>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
  return text.split('\n')[0].substring(0, 100);
}

function relativeTime(ts) {
  if (!ts) return '';
  const diffSec = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (diffSec < 60) return 'just now';
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return new Date(ts).toLocaleDateString();
}

function matches(note, q) {
  if (!q) return true;
  const hay = (label(note) + ' ' + snippet(note)).toLowerCase();
  return hay.includes(q.toLowerCase());
}

function render() {
  const filtered = notes
    .slice()
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .filter((n) => matches(n, query));

  listEl.innerHTML = '';

  if (notes.length === 0) {
    listEl.innerHTML = `<div class="empty">${ICONS.notes}<div>No notes yet.<br/>Click "New" or press &#8984;&#8679;N (Ctrl+Shift+N) to create one.</div></div>`;
    return;
  }
  if (filtered.length === 0) {
    listEl.innerHTML = `<div class="empty">${ICONS.notes}<div>No notes match your search.</div></div>`;
    return;
  }

  for (const note of filtered) {
    const card = document.createElement('div');
    card.className = 'card';

    const swatch = document.createElement('div');
    swatch.className = 'swatch';
    swatch.style.background = COLOR_TINTS[note.color] || COLOR_TINTS.yellow;

    const info = document.createElement('div');
    info.className = 'info';

    const titleInput = document.createElement('input');
    titleInput.className = 'title';
    titleInput.value = label(note);
    titleInput.placeholder = snippet(note).slice(0, 40) || 'Untitled note';
    titleInput.addEventListener('change', () => {
      window.manager.rename(note.id, titleInput.value);
    });
    titleInput.addEventListener('click', (e) => e.stopPropagation());

    const snippetEl = document.createElement('div');
    snippetEl.className = 'snippet';
    snippetEl.textContent = snippet(note) || 'Empty note';

    const metaEl = document.createElement('div');
    metaEl.className = 'meta';
    metaEl.textContent = 'Edited ' + relativeTime(note.updatedAt);

    info.appendChild(titleInput);
    info.appendChild(snippetEl);
    info.appendChild(metaEl);

    const actions = document.createElement('div');
    actions.className = 'actions';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'icon-btn danger';
    deleteBtn.title = 'Delete permanently';
    deleteBtn.innerHTML = ICONS.trash;
    deleteBtn.addEventListener('click', () => {
      noteToDelete = note.id;
      document.getElementById('deleteModal').classList.add('open');
    });

    actions.appendChild(deleteBtn);

    card.appendChild(swatch);
    card.appendChild(info);
    card.appendChild(actions);

    // Double-click to open/show the note
    card.addEventListener('dblclick', () => {
      window.manager.open(note.id);
    });

    listEl.appendChild(card);
  }
}

searchEl.addEventListener('input', () => {
  query = searchEl.value;
  render();
});

document.getElementById('newNote').addEventListener('click', () => window.manager.newNote());

window.manager.onChanged((updated) => {
  notes = updated;
  render();
});

window.manager.list().then((initial) => {
  notes = initial;
  render();
});

window.manager.version().then((v) => {
  document.getElementById('version').textContent = 'Ghost Notes v' + v;
});

let noteToDelete = null;
const modal = document.getElementById('deleteModal');

document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
  modal.classList.remove('open');
  noteToDelete = null;
});

document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
  if (noteToDelete) {
    window.manager.delete(noteToDelete);
    noteToDelete = null;
  }
  modal.classList.remove('open');
});
