const express = require("express");
const http = require("http");
const { WebSocketServer } = require("ws");
const cors = require("cors");
const { MongoClient } = require("mongodb");

// ─── Config ───────────────────────────────────────────────
const PORT = 4000;
const MONGO_URI = "mongodb://localhost:27017";
const DB_NAME = "logpulse";

// ─── Express setup ────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());

// ─── HTTP server (Express + WebSocket share this) ─────────
const server = http.createServer(app);

// ─── WebSocket server ─────────────────────────────────────
const wss = new WebSocketServer({ server });

// Keep track of all connected dashboard clients
const clients = new Set();

wss.on("connection", (ws) => {
  console.log("[WS] Dashboard client connected");
  clients.add(ws);

  ws.on("close", () => {
    console.log("[WS] Dashboard client disconnected");
    clients.delete(ws);
  });
});

// Broadcast a message to every connected dashboard
function broadcast(data) {
  const message = JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === 1) { // 1 = OPEN
      client.send(message);
    }
  }
}

// ─── MongoDB ──────────────────────────────────────────────
let db;

async function connectMongo() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  db = client.db(DB_NAME);
  console.log("[MongoDB] Connected to logpulse database");
}

// ─── REST API Routes ──────────────────────────────────────

app.get("/api/logs", async (req, res) => {
  try {
    const logs = await db
      .collection("logs")
      .find({}, { projection: { _id: 0, __v: 0 } })
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray();
    res.json(logs);
  } catch (err) {
    console.error("[API] Error fetching logs:", err.message);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

// Internal endpoint — consumer calls this when an alert fires
app.post("/internal/alert", (req, res) => {
  const alert = req.body;
  console.log("[ALERT]", alert);

  // Immediately push to all connected dashboards
  broadcast({ type: "alert", ...alert });

  res.json({ ok: true });
});

app.post('/internal/log', (req, res) => {
  const log = req.body
  broadcast(log)
  res.sendStatus(200)
})

// ─── Start ────────────────────────────────────────────────
async function start() {
  await connectMongo();
  server.listen(PORT, () => {
    console.log(`[Server] Running on http://localhost:${PORT}`);
    console.log(`[WS] WebSocket ready on ws://localhost:${PORT}`);
  });
}

start();