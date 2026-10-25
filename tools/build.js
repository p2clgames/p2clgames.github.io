// Builds privacy.html and terms.html from src/<page>/<lang>.md.
//   node tools/build.js
// Edit the Markdown, run this, commit both the .md and the .html.
// Markdown kept small on purpose: # ## ### headings, - and 1. lists, ---, **bold**, [text](url),
// bare URLs and emails. Every other line is its own paragraph.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'ko', label: '한국어' },
  { code: 'ja', label: '日本語' },
];
const PAGES = ['privacy', 'terms'];
const UI = {
  en: { privacy: 'Privacy Policy', terms: 'Terms of Service', language: 'Language' },
  ko: { privacy: '개인정보 처리 방침', terms: '이용약관', language: '언어' },
  ja: { privacy: 'プライバシーポリシー', terms: '利用規約', language: '言語' },
};

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function inline(s) {
  const links = [];
  const keep = (html) => `\u0000${links.push(html) - 1}\u0000`;
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (_, t, u) => keep(`<a href="${esc(u)}" rel="noopener">${esc(t)}</a>`));
  s = s.replace(/https?:\/\/[^\s<>()]+[^\s<>().,]/g, (u) => keep(`<a href="${esc(u)}" rel="noopener">${esc(u)}</a>`));
  s = s.replace(/[\w.+-]+@[\w-]+\.[\w.]*\w/g, (m) => keep(`<a href="mailto:${m}">${m}</a>`));
  s = esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => links[i]);
}

function render(md) {
  const lines = md.replace(/\r/g, '').split('\n');
  const out = [];
  let title = '';
  for (let i = 0; i < lines.length; ) {
    const line = lines[i].trim();
    let m;
    if (!line) { i++; continue; }
    if ((m = line.match(/^(#{1,3}) (.*)$/))) {
      if (m[1] === '#') title = m[2];
      else out.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`);
      i++;
    } else if (line === '---') {
      out.push('<hr>');
      i++;
    } else if (/^(- |\d+\. )/.test(line)) {
      const ordered = /^\d/.test(line);
      const re = ordered ? /^\d+\. (.*)$/ : /^- (.*)$/;
      const items = [];
      while (i < lines.length && (m = lines[i].trim().match(re))) { items.push(`<li>${inline(m[1])}</li>`); i++; }
      const tag = ordered ? 'ol' : 'ul';
      out.push(`<${tag}>${items.join('')}</${tag}>`);
    } else if (/^\*\*[^*]+\*\*$/.test(line)) {
      out.push(`<p class="label">${inline(line)}</p>`);
      i++;
    } else {
      out.push(`<p>${inline(line)}</p>`);
      i++;
    }
  }
  return { title, body: out.join('\n') };
}

function build(page) {
  const docs = LANGS.map(({ code }) => ({ code, ...render(fs.readFileSync(path.join(ROOT, 'src', page, `${code}.md`), 'utf8')) }));
  const titles = Object.fromEntries(docs.map((d) => [d.code, d.title]));
  const options = LANGS.map(({ code, label }) => `<option value="${code}">${label}</option>`).join('');
  const articles = docs.map((d) => `<article lang="${d.code}"${d.code === 'en' ? '' : ' hidden'}>
<h1>${inline(d.title)}</h1>
${d.body}
<nav class="links">${PAGES.map((p) => `<a href="${p}.html?lang=${d.code}"${p === page ? ' aria-current="page"' : ''}>${UI[d.code][p]}</a>`).join('')}</nav>
</article>`).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titles.en)}</title>
<link rel="stylesheet" href="legal.css">
</head>
<body>
<header>
<span class="brand">P2CLGames</span>
<label class="lang"><span class="sr">${UI.en.language}</span>
<select id="lang" aria-label="Language / 언어 / 言語">${options}</select>
</label>
</header>
<main>
${articles}
</main>
<footer>© P2CLGames · <a href="mailto:p2clgames@gmail.com">p2clgames@gmail.com</a></footer>
<script>
(function () {
  var titles = ${JSON.stringify(titles)};
  var select = document.getElementById('lang');
  function show(code) {
    if (!titles[code]) code = 'en';
    document.querySelectorAll('article').forEach(function (a) { a.hidden = a.lang !== code; });
    document.documentElement.lang = code;
    document.title = titles[code];
    select.value = code;
    return code;
  }
  var saved = null;
  try { saved = localStorage.getItem('p2cl-legal-lang'); } catch (e) {}
  show(new URLSearchParams(location.search).get('lang') || saved || 'en');
  select.addEventListener('change', function () {
    var code = show(select.value);
    try { localStorage.setItem('p2cl-legal-lang', code); } catch (e) {}
    var url = new URL(location.href);
    url.searchParams.set('lang', code);
    history.replaceState(null, '', url);
  });
})();
</script>
</body>
</html>
`;
}

for (const page of PAGES) {
  fs.writeFileSync(path.join(ROOT, `${page}.html`), build(page));
  console.log(`${page}.html`);
}
