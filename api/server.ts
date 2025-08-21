import { renderToWebComponent } from "modern-monaco/ssr";
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from "node:url";

// Demo displays its own server code inside the editor
// Powered by https://github.com/esm-dev/modern-monaco
// Demo source: https://github.com/pi0/modern-monaco-demo

export default {
  async fetch(req: Request): Promise<Response> {
    const code = await readFile(fileURLToPath(import.meta.url), 'utf8')

    const editor = await renderToWebComponent(
      { code, filename: "/api/server.js" },
      {
        userAgent: req.headers.get("user-agent"), // use system font
      },
    );
    return new Response(
      /* html */ `
      <html>
      <head>
        <title>Modern Monaco Demo</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style> body { background-color: #121212 } </style>
      </head>
      <body>
      ${editor}
      <script type="module">
        import { hydrate } from "https://esm.sh/modern-monaco";
        hydrate(); // hydrate the editor
      </script>
    `,
      { headers: { "Content-Type": "text/html" } },
    );
  },
};
