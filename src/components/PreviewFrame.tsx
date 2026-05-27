"use client";

import { useEffect, useState } from "react";

function makeBlobUrl(code: string): string {
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<script src="https://cdn.tailwindcss.com"></script>
<script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<style>
  body { margin: 0; padding: 24px; min-height: 100vh; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; }
  * { box-sizing: border-box; }
</style>
</head>
<body>
<div id="root"><div style="padding:16px;color:#78716c;font-size:13px;">Loading preview...</div></div>
<script>
(function() {
  function showError(msg) {
    document.getElementById('root').innerHTML =
      '<div style="color:#dc2626;padding:16px;font-family:monospace;font-size:13px;line-height:1.5;">' +
      '<strong style="font-size:14px;">Preview Error</strong><br><br>' +
      msg.replace(/</g, '&lt;').replace(/>/g, '&gt;') +
      '</div>';
  }

  function run() {
    try {
      var raw = ${JSON.stringify(code)};

      // --- Strip imports (very aggressive) ---
      // Remove any line that starts with import
      raw = raw.split('\\n').map(function(line) {
        var trimmed = line.trim();
        if (trimmed.indexOf('import ') === 0 || trimmed.indexOf('import{') === 0) return '';
        return line;
      }).join('\\n');

      // --- Strip exports (very aggressive) ---
      raw = raw.split('export default').join('');
      raw = raw.split('export ').join('');
      raw = raw.split('export').join('');

      // --- Strip TypeScript ---
      raw = raw.split(': React.FC').join('');
      raw = raw.split(': JSX.Element').join('');
      raw = raw.replace(/:\s*string\b/g, '');
      raw = raw.replace(/:\s*number\b/g, '');
      raw = raw.replace(/:\s*boolean\b/g, '');
      raw = raw.replace(/interface\s+\w+\s*\{[^}]*\}/g, '');

      // Clean up double newlines
      raw = raw.replace(/\\n\\n\\n+/g, '\\n\\n');

      // Extract component name
      var nameMatch = raw.match(/(?:function|const|let|var)\\s+(\\w+)/);
      var componentName = nameMatch ? nameMatch[1] : 'Component';

      // Wrap for Babel
      var wrapped = '(function(React){\\n' + raw + '\\n;return ' + componentName + ';\\n})(window.React)';

      var result = Babel.transform(wrapped, {
        presets: ['react'],
        filename: 'component.tsx',
      });

      var Component = eval(result.code);

      if (typeof Component !== 'function') {
        showError('Could not find a valid React component in the code.');
        return;
      }

      var rootEl = document.getElementById('root');
      rootEl.innerHTML = '';
      var root = ReactDOM.createRoot(rootEl);
      root.render(React.createElement(Component));
    } catch (err) {
      showError((err.message || String(err)));
      console.error(err);
    }
  }

  var attempts = 0;
  var maxAttempts = 200;
  function wait() {
    attempts++;
    if (window.Babel && window.React && window.ReactDOM) {
      run();
    } else if (attempts < maxAttempts) {
      setTimeout(wait, 50);
    } else {
      showError('Preview dependencies (React, Babel) failed to load. Check your internet connection.');
    }
  }
  wait();
})();
</script>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  return URL.createObjectURL(blob);
}

export function PreviewFrame({ code }: { code: string }) {
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    const newUrl = makeBlobUrl(code);
    setUrl(newUrl);
    return () => URL.revokeObjectURL(newUrl);
  }, [code]);

  if (!url) {
    return (
      <div className="w-full min-h-[320px] rounded-md bg-white dark:bg-[#0c0a09] flex items-center justify-center">
        <span className="text-muted-foreground text-sm">Preparing preview...</span>
      </div>
    );
  }

  return (
    <iframe
      src={url}
      className="w-full min-h-[320px] border-0 rounded-md bg-white dark:bg-[#0c0a09]"
      sandbox="allow-scripts"
      title="Component preview"
    />
  );
}
