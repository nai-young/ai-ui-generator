"use client";

import { useEffect, useState } from "react";

function sanitizeCode(code: string): string {
  let s = code.trim();

  s = s.replace(/^["']use client["'];?\s*/gm, "");
  s = s
    .split("\n")
    .filter((line) => !line.trim().startsWith("import "))
    .join("\n");
  s = s.replace(/\bexport\s+default\s+/g, "");
  s = s.replace(/\bexport\s+/g, "");
  s = s.replace(/stroke-linecap=/g, "strokeLinecap=");
  s = s.replace(/stroke-linejoin=/g, "strokeLinejoin=");
  s = s.replace(/stroke-width=/g, "strokeWidth=");
  s = s.replace(/fill-rule=/g, "fillRule=");
  s = s.replace(/clip-rule=/g, "clipRule=");
  s = s.replace(/class=/g, "className=");

  return s;
}

function makeBlobUrl(code: string): string {
  const cleanedCode = sanitizeCode(code);

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<script src="https://cdn.tailwindcss.com"></script>
<script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<style>
  body {
    margin: 0;
    padding: 24px;
    min-height: 100vh;
    width: 100vw;
    font-family: ui-sans-serif, system-ui, sans-serif;
    background: white;
  }
  * { box-sizing: border-box; }
</style>
</head>
<body>
<div id="root">
  <div style="padding:16px;color:#78716c;font-size:13px;">Loading preview...</div>
</div>

<script type="application/json" id="component-code">
${JSON.stringify(cleanedCode)}
</script>

<script>
(function () {
  function showError(msg) {
    var root = document.getElementById("root");
    root.innerHTML =
      '<div style="color:#dc2626;padding:16px;font-family:monospace;font-size:13px;white-space:pre-wrap;">' +
      '<strong>Preview Error</strong><br><br>' +
      String(msg).replace(/</g, "&lt;").replace(/>/g, "&gt;") +
      '</div>';
  }

  function normalizeJsx(s) {
    return s
      .replace(/stroke-linecap=/g, "strokeLinecap=")
      .replace(/stroke-linejoin=/g, "strokeLinejoin=")
      .replace(/stroke-width=/g, "strokeWidth=")
      .replace(/fill-rule=/g, "fillRule=")
      .replace(/clip-rule=/g, "clipRule=")
      .replace(/class=/g, "className=");
  }

  function run() {
    try {
      var raw = JSON.parse(document.getElementById("component-code").textContent || '""');
      raw = normalizeJsx(raw);

      var wrapped =
        "(function(React){\\n" +
        "return function PreviewComponent(){\\n" +
        "return (\\n" +
        raw +
        "\\n);\\n" +
        "}\\n" +
        "})(window.React)";

      var transformed = Babel.transform(wrapped, {
        presets: [["react", { runtime: "classic" }]],
        filename: "component.jsx"
      });

      var Component = eval(transformed.code);

      var rootEl = document.getElementById("root");
      rootEl.innerHTML = "";

      ReactDOM.createRoot(rootEl).render(
        React.createElement(Component)
      );
    } catch (err) {
      showError(err.stack || err.message || String(err));
      console.error(err);
    }
  }

  function wait() {
    if (window.React && window.ReactDOM && window.Babel) {
      run();
    } else {
      setTimeout(wait, 50);
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

  console.log("Sanitized code for preview:", sanitizeCode(code));

  useEffect(() => {
    const newUrl = makeBlobUrl(code);
    setUrl(newUrl);
    return () => URL.revokeObjectURL(newUrl);
  }, [code]);

  if (!url) {
    return (
      <div className="w-full min-h-[320px] rounded-md bg-white dark:bg-[#0c0a09] flex items-center justify-center">
        <span className="text-muted-foreground text-sm">
          Preparing preview...
        </span>
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
