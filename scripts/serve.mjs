import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { resolve, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("../out/", import.meta.url)));
if (!existsSync(root)) { console.error("Run npm run build first."); process.exit(1); }
const mime = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".avif": "image/avif", ".svg": "image/svg+xml", ".wav": "audio/wav", ".mp3": "audio/mpeg", ".m4a": "audio/mp4", ".aac": "audio/aac", ".ogg": "audio/ogg", ".flac": "audio/flac", ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8" };
const port = Number(process.env.PORT || 3000);
const hostname = process.env.NOV17_HOSTNAME || "127.0.0.1";
createServer((request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url || "/", "http://localhost").pathname);
    let filename = resolve(root, `.${pathname}`);
    if (filename !== root && !filename.startsWith(`${root}${sep}`)) { response.writeHead(403).end(); return; }
    if (existsSync(filename) && statSync(filename).isDirectory()) {
      const index = resolve(filename, "index.html");
      filename = existsSync(index) || filename === root ? index : `${filename}.html`;
    }
    if (!existsSync(filename) && !extname(filename) && existsSync(`${filename}.html`)) filename = `${filename}.html`;
    if (!existsSync(filename)) { response.writeHead(404, { "Content-Type": "text/plain" }).end("Not found"); return; }
    const size = statSync(filename).size;
    const headers = { "Content-Type": mime[extname(filename)] || "application/octet-stream", "Accept-Ranges": "bytes" };
    const match = /^bytes=(\d+)-(\d*)$/.exec(request.headers.range || "");
    if (match) {
      const start = Number(match[1]);
      const end = Math.min(match[2] ? Number(match[2]) : size - 1, size - 1);
      if (start >= size || start > end) { response.writeHead(416, { "Content-Range": `bytes */${size}` }).end(); return; }
      response.writeHead(206, { ...headers, "Content-Length": end - start + 1, "Content-Range": `bytes ${start}-${end}/${size}` });
      if (request.method === "HEAD") response.end(); else createReadStream(filename, { start, end }).pipe(response);
    } else {
      response.writeHead(200, { ...headers, "Content-Length": size });
      if (request.method === "HEAD") response.end(); else createReadStream(filename).pipe(response);
    }
  } catch { response.writeHead(400).end("Bad request"); }
}).listen(port, hostname, () => console.log(`NOV.17 ready at http://${hostname}:${port}`));
