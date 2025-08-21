import { renderToWebComponent } from "modern-monaco/ssr";
import { codeToANSI } from "@shikijs/cli";

// Demo displays its own server code inside the editor
// Powered by https://github.com/esm-dev/modern-monaco
// Demo source: https://github.com/pi0/modern-monaco-demo

const RAW_SOURCE =
  "https://raw.githubusercontent.com/pi0/modern-monaco-demo/refs/heads/main/api/server.ts";

export default {
  async fetch(req: Request): Promise<Response> {
    const code = await fetch(RAW_SOURCE).then((r) => r.text());

    const userAgent = req.headers.get("user-agent");

    if (userAgent.startsWith("curl/")) {
      return new Response(await codeToANSI(code, "typescript", "min-dark"));
    }

    const editor = await renderToWebComponent(
      { code, filename: "server.ts" },
      { userAgent /* use system font */ }
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
        // hydrate the editor
        hydrate({
          lsp: {
            typescript: {
              importMap: {
                imports: {
                  "modern-monaco/": "https://esm.sh/modern-monaco/",
                  "@shikijs/": "https://esm.sh/@shikijs/"
                },
              },
            },
          },
        });
      </script>
    `,
      { headers: { "Content-Type": "text/html" } }
    );
  },
};
