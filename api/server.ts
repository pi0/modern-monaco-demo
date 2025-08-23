import { renderToWebComponent } from "modern-monaco/ssr";

/**
 * This demo displays its own server code inside the editor
 * Demo source: https://github.com/pi0/modern-monaco-demo
 * Powered by   https://github.com/esm-dev/modern-monaco
 */

const RAW_SOURCE =
  "https://raw.githubusercontent.com/pi0/modern-monaco-demo/refs/heads/main/api/server.ts";

// prettier-ignore
const THEMES = ["andromeeda","aurora-x","ayu-dark","catppuccin-mocha","dark-plus","dracula","everforest-dark","github-dark","gruvbox-dark-soft","material-theme-darker","min-dark","night-owl","one-dark-pro","rose-pine-moon","slack-dark","solarized-dark","tokyo-night","vesper","vitesse-dark"] as const;

export default {
  async fetch(req: Request): Promise<Response> {
    const code = await fetch(RAW_SOURCE).then((r) => r.text());
    const theme = THEMES[Math.floor(Math.random() * THEMES.length)];
    const userAgent = req.headers.get("user-agent");

    if (req.url.endsWith("og")) {
      const { codeToImage } = await import("shiki-image");
      let subCode = code.split("\n").slice(13, 55).join("\n");
      const buffer = await codeToImage(subCode, { lang: "typescript", theme });
      return new Response(new Uint8Array(buffer), {
        headers: { "Content-Type": "image/png" },
      });
    }

    if (userAgent.startsWith("curl/")) {
      delete globalThis.process.env.NO_COLOR;
      globalThis.process.env.FORCE_COLOR = "2"; // 256 colors
      const { codeToANSI } = await import("@shikijs/cli");
      return new Response(await codeToANSI(code, "typescript", theme));
    }

    const editor = await renderToWebComponent(
      { code, filename: "server.ts" },
      {
        theme,
        padding: { top: 10, bottom: 10 },
        userAgent /* use system font */,
      }
    );

    return new Response(
      /* html */ `
      <html>
      <head>
        <title>Modern Monaco Demo</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style> body { padding: 0; margin: 0 } </style>
        <meta property="og:image" content="${new URL("/og", req.url)}" />
        <meta name="twitter:card" content="summary_large_image" />
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
                  "@shikijs/": "https://esm.sh/@shikijs/",
                  "shiki-image": "https://esm.sh/shiki-image"
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
