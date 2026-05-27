"use client";

import { useMemo } from "react";

function buildIframeHtml(code: string): string {
  const escapedCode = JSON.stringify(code);

  return `<!DOCTYPE html>
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
<div id="root"></div>
<script>
(function(){
  try {
    var rootEl = document.getElementById('root');
    var code = ${escapedCode};

    var clean = code
      .replace(/export\\s+default\\s+(function\\s+)?/g, '')
      .replace(/export\\s+(const|let|var|function)\\s+/g, '$1 ')
      .replace(/:\\s*React\\.FC<[^>]*>/g, '')
      .replace(/:\\s*JSX\\.Element/g, '')
      .replace(/interface\\s+\\w+\\s*\\{[^}]*\\}/g, '');

    var nameMatch = clean.match(/(?:function|const|let|var)\\s+(\\w+)/);
    var componentName = nameMatch ? nameMatch[1] : 'Component';

    var wrapped = '(function(React){\\n' + clean + '\\n;return ' + componentName + ';\\n})(React)';

    var result = Babel.transform(wrapped, {
      presets: ['react'],
      filename: 'component.tsx',
    });

    var Component = eval(result.code);

    if (typeof Component !== 'function') {
      throw new Error('Could not find a valid React component');
    }

    var root = ReactDOM.createRoot(rootEl);
    root.render(React.createElement(Component));
  } catch (err) {
    document.getElementById('root').innerHTML =
      '<div style="color:#dc2626;padding:16px;font-family:monospace;font-size:13px;">' +
      '<strong>Preview error</strong><br>' + (err.message || err) + '</div>';
    console.error(err);
  }
})();
</script>
</body>
</html>`;
}

export function PreviewFrame({ code }: { code: string }) {
  const srcdoc = useMemo(() => buildIframeHtml(code), [code]);

  // Force remount when code changes so the iframe reloads completely
  const key = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < code.length; i++) {
      hash = ((hash << 5) - hash + code.charCodeAt(i)) | 0;
    }
    return String(hash);
  }, [code]);

  return (
    <iframe
      key={key}
      srcDoc={srcdoc}
      className="w-full min-h-[320px] border-0 rounded-md bg-white dark:bg-[#0c0a09]"
      sandbox="allow-scripts"
      title="Component preview"
    />
  );
}
