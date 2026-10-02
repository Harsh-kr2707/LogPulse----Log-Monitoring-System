const { Kafka } = require("kafkajs");
const axios = require("axios");
const mongoose = require("mongoose");
const Redis = require('ioredis')

const redis = new Redis({
  host: 'localhost',
  port: 6379,
})

redis.on('connect', () => {
  console.log('Connected to Redis')
})

redis.on('error', (err) => {
  console.error('Redis error:', err.message)
})

const WINDOW_SIZE_MS = 60 * 1000
const ERROR_THRESHOLD = 5

async function checkErrorRate(service) {
  const key = `errors:${service}`
  const now = Date.now()
  const windowStart = now - WINDOW_SIZE_MS

  await redis.zadd(key, now, `${now}-${Math.random()}`)
  await redis.zremrangebyscore(key, 0, windowStart)

  const errorCount = await redis.zcard(key)

  console.log(`[${service}] Errors in last 60s: ${errorCount}`)

  if (errorCount > ERROR_THRESHOLD) {
    const cooldownKey = `alerted:${service}`
    const alreadyAlerted = await redis.get(cooldownKey)

    if (!alreadyAlerted) {
      await redis.set(cooldownKey, '1', 'EX', 60)

      console.log(`🚨 ALERT: ${service} has ${errorCount} errors in the last 60 seconds!`)

      try {
        await axios.post("http://localhost:4000/internal/alert", {
          type: 'alert',
          service,
          message: `High error rate — ${errorCount} errors in 60 seconds`,
          errorCount,
          timestamp: new Date().toISOString(),
        })
      } catch (err) {
        console.error("[Alert] Failed to notify server:", err.message)
      }
    }
  }
}

// ─── Kafka Setup ────────────────────────────────────────────
const kafka = new Kafka({
  clientId: "log-consumer",
  brokers: ["localhost:29092"],
})

const consumer = kafka.consumer({ groupId: "log-consumer-group" })

// ─── MongoDB Schema ──────────────────────────────────────────
const logSchema = new mongoose.Schema({
  service:   { type: String, required: true },
  level:     { type: String, required: true },
  message:   { type: String, required: true },
  timestamp: { type: Date,   required: true },
})

const Log = mongoose.model("Log", logSchema)

// ─── Main Function ───────────────────────────────────────────
async function main() {
  // 1. Connect to MongoDB
  await mongoose.connect("mongodb://localhost:27017/logpulse")
  console.log("Connected to MongoDB")

  // 2. Connect consumer to Kafka
  await consumer.connect()
  console.log("Consumer connected to Kafka")

  // 3. Subscribe to the logs topic
  await consumer.subscribe({ topic: "logs", fromBeginning: true })

  // 4. Start listening — this runs forever
  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const logData = JSON.parse(message.value.toString())

        // Save to MongoDB
        const log = new Log(logData)
        await log.save()
        console.log(`Saved [${logData.level}] from ${logData.service}: ${logData.message}`)

        // Broadcast log to dashboard in real time
        try {
          await axios.post('http://localhost:4000/internal/log', {
            type: 'log',
            service: logData.service,
            level: logData.level,
            message: logData.message,
            timestamp: logData.timestamp,
          })
        } catch (err) {
          console.error('Failed to forward log to server:', err.message)
        }

        // Check error rate if this log is an ERROR
        if (logData.level === 'ERROR') {
          await checkErrorRate(logData.service)
        }

      } catch (err) {
        console.error("Failed to process message:", err.message)
      }
    },
  })
}

// ─── Graceful Shutdown ───────────────────────────────────────
process.on("SIGINT", async () => {
  console.log("\n Shutting down consumer...")
  await consumer.disconnect()
  await mongoose.disconnect()
  process.exit(0)
})

main().catch(console.error)