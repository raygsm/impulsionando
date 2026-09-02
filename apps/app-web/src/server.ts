import http from "node:http";

const port = Number(process.env.APP_WEB_PORT || 3320);
const gitSha = process.env.GIT_SHA || process.env.GITHUB_SHA || "unknown";

function sendJson(res: http.ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (url.pathname === "/health") {
    sendJson(res, 200, {
      ok: true,
      service: "impulsionando-app-web",
      phase: "4b",
      runtime: "app-web",
      gitSha,
    });
    return;
  }

  if (url.pathname === "/ready") {
    sendJson(res, 200, { ready: true, service: "impulsionando-app-web" });
    return;
  }

  sendJson(res, 200, {
    runtime: "app-web",
    mode: "strangler-stub",
    message: "Authenticated routes remain on legacy monolith until app-web slice migration.",
    gitSha,
  });
});

server.listen(port, () => {
  console.log(JSON.stringify({ ok: true, service: "impulsionando-app-web", listening: port }));
});
