import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(root, 'bookmarklet.js'), 'utf8').trim();

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Install Garmin Nutrition Exporter</title>
  <style>
    :root { color-scheme: light dark; }
    body {
      font-family: system-ui, sans-serif;
      line-height: 1.5;
      max-width: 42rem;
      margin: 3rem auto;
      padding: 0 1.25rem;
    }
    h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
    p { color: #555; }
    @media (prefers-color-scheme: dark) {
      p { color: #aaa; }
    }
    .bookmarklet {
      display: inline-block;
      margin: 1.25rem 0;
      padding: 0.85rem 1.25rem;
      border-radius: 8px;
      background: #007cc3;
      color: #fff;
      font-weight: 600;
      text-decoration: none;
      cursor: grab;
      box-shadow: 0 4px 14px rgba(0, 124, 195, 0.35);
    }
    .bookmarklet:active { cursor: grabbing; }
    ol { padding-left: 1.25rem; }
    code { font-size: 0.92em; }
  </style>
</head>
<body>
  <h1>Garmin Nutrition Exporter</h1>
  <p>Drag the button below onto your bookmarks bar, then run it on Garmin Connect's nutrition page.</p>

  <a class="bookmarklet" id="bookmarklet" href="#">Export Garmin Nutrition</a>

  <h2>Install</h2>
  <ol>
    <li>Show your bookmarks bar (<code>Cmd+Shift+B</code> on Mac, <code>Ctrl+Shift+B</code> on Windows).</li>
    <li>Drag the blue button above onto the bar.</li>
  </ol>

  <h2>Use</h2>
  <ol>
    <li>Open <a href="https://connect.garmin.com/app/nutrition/">Garmin Connect Nutrition</a>.</li>
    <li>Wait for the page to finish loading.</li>
    <li>Click the bookmark.</li>
  </ol>

  <script type="text/plain" id="bookmarklet-source">${source.replace(/<\/script/gi, '<\\/script')}</script>
  <script>
    (function () {
      var code = document.getElementById('bookmarklet-source').textContent.trim();
      document.getElementById('bookmarklet').href = 'javascript:' + encodeURIComponent(code);
    })();
  </script>
</body>
</html>
`;

writeFileSync(join(root, 'installer.html'), html);
console.log('Wrote installer.html');
