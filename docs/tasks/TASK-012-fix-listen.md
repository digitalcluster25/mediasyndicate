# TASK-012: Fix Next.js Listen Address

## ПРОБЛЕМА
Next.js слушает только на localhost внутри контейнера
Traefik не может достучаться

## ДЛЯ CURSOR

Создай файл: server.js

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const dev = false;
const hostname = "0.0.0.0";
const port = 3000;
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    const parsedUrl = parse(req.url, true);
    await handle(req, res, parsedUrl);
  }).listen(port, hostname, () => {
    console.log(`Ready on http://${hostname}:${port}`);
  });
});

Обнови package.json:
"start": "node server.js"

## КОММИТ
git add server.js package.json
git commit -m "fix: listen on 0.0.0.0 for Docker"
git push

## КРИТЕРИИ
- server.js создан
- package.json обновлен
- Push OK
