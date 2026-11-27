// Run: ODDS_KEY=... FD_KEY=... node index.js   (Node 18+), then open http://localhost:3000
// Keep this file and epl-sim.html in the same folder.
const config = require("./config.json")
const http = require("http"), fs = require("fs");
const { ODDS_KEY, FD_KEY } = config;
if (!ODDS_KEY || !FD_KEY) { console.error("Set ODDS_KEY and FD_KEY first."); process.exit(1); }

const SRC = {
  "/api/standings": { url: "https://api.football-data.org/v4/competitions/PL/standings", headers: { "X-Auth-Token": FD_KEY }, ttl: 5 * 60e3 },
  "/api/odds": { url: `https://api.the-odds-api.com/v4/sports/soccer_epl/odds/?apiKey=${ODDS_KEY}&regions=uk&markets=h2h&oddsFormat=decimal`, headers: {}, ttl: 60 * 60e3 },
};
const cache = {};

http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://localhost"), s = SRC[u.pathname];
  const send = (code, type, body) => { res.writeHead(code, { "Content-Type": type }); res.end(body); };
  if (u.pathname == "/") return send(200, "text/html", fs.readFileSync(__dirname + "/epl-sim.html"));
  if (!s) return send(u.pathname == "/favicon.ico" ? 204 : 404, "text/plain", "");
  const c = cache[u.pathname];
  if (c && Date.now() - c.t < s.ttl && !u.searchParams.has("fresh")) return send(200, "application/json", c.body);
  try {
    const r = await fetch(s.url, { headers: s.headers }), body = await r.text();
    if (u.pathname == "/api/odds") console.log("odds credits left:", r.headers.get("x-requests-remaining"));
    if (r.ok) cache[u.pathname] = { t: Date.now(), body };
    send(r.status, "application/json", body);
  } catch (e) { send(502, "text/plain", String(e)); }
}).listen(3000, () => console.log("http://localhost:3000"));