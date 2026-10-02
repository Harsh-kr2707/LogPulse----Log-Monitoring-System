process.env.KAFKAJS_NO_PARTITIONER_WARNING = "1";
const { Kafka } = require("kafkajs");

// --- 1. Create a Kafka client ---
const kafka = new Kafka({
  clientId: "logpulse-producer",
  brokers: ["localhost:29092"], 
});

// --- 2. Create a producer instance ---
const producer = kafka.producer();

// --- 3. Define our log sources and levels ---
const SERVICES = ["auth-service", "api-service", "worker-service"];
const LOG_LEVELS = ["INFO", "WARN", "ERROR"];
const LOG_MESSAGES = {
  INFO: [
    "User login successful",
    "Request processed",
    "Cache hit",
    "Health check passed",
  ],
  WARN: [
    "Response time above threshold",
    "Retry attempt 1 of 3",
    "Memory usage at 75%",
    "Slow query detected",
  ],
  ERROR: [
    "Database connection failed",
    "Unhandled exception in worker",
    "Request timeout after 5000ms",
    "Auth token validation failed",
  ],
};

// --- 4. Generate a single fake log entry ---
function generateLog() {
  const service = SERVICES[Math.floor(Math.random() * SERVICES.length)];
  const level = LOG_LEVELS[Math.floor(Math.random() * LOG_LEVELS.length)];
  const messages = LOG_MESSAGES[level];
  const message = messages[Math.floor(Math.random() * messages.length)];

  return {
    service,
    level,
    message,
    timestamp: new Date().toISOString(),
  };
}

// --- 5. Connect and start sending logs ---
async function run() {
  await producer.connect();
  console.log("Producer connected to Kafka");

  setInterval(async () => {
    const log = generateLog();

    await producer.send({
      topic: "logs",
      messages: [
        {
          key: log.service,
          value: JSON.stringify(log),
        },
      ],
    });

    console.log(`Sent [${log.level}] from ${log.service}: ${log.message}`);
  }, 1000);
}

// --- 6. Graceful shutdown ---
process.on("SIGINT", async () => {
  console.log("\nShutting down producer...");
  await producer.disconnect();
  process.exit(0);
});

run().catch(console.error);