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

