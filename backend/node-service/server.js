const express = require('express');
const mongoose = require('mongoose');
const { createClient } = require('redis');
const path = require("path");
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
const seedPrograms = require("./seedData.json");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/vigyaan';
const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';

// MongoDB Schemas
const programSchema = new mongoose.Schema({
  title: String,
  category: String,
  duration: String,
  description: String
});

const inquirySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  programInterest: String,
  message: String,
  aiRecommendation: { type: String, default: 'Pending AI processing...' },
  createdAt: { type: Date, default: Date.now }
});

const Program = mongoose.model('Program', programSchema);
const Inquiry = mongoose.model('Inquiry', inquirySchema);

// Redis Client (used for both Caching & Message Queue publishing)
const redisClient = createClient({ url: REDIS_URL });
redisClient.on('error', (err) => console.error('Redis Error:', err));

async function seedIfEmpty(ProgramModel, redisClient) {
  const count = await ProgramModel.countDocuments();
  if (count === 0) {
    await ProgramModel.insertMany(seedPrograms);
    if (redisClient?.isOpen) {
      await redisClient.del("vigyaan:programs");
    }
    console.log(`Seeded ${seedPrograms.length} ViGYAAN programs into MongoDB.`);
  }
}

async function init() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  await redisClient.connect();
  console.log('Connected to Redis');

  // Seed default academy programs if empty
  const count = await Program.countDocuments();
  if (count === 0) {
    await seedIfEmpty(Program, redisClient);
    console.log('Seeded initial Vigyaan Academy programs');
  }

  app.listen(PORT, () => console.log(`Node Program Service listening on port ${PORT}`));
}

// Health Check
app.get('/api/programs/health', (req, res) => {
  res.json({ status: 'healthy', service: 'node-service' });
});

// GET Programs (with Redis Caching)
app.get('/api/programs', async (req, res) => {
  try {
    const cached = await redisClient.get('vigyaan:programs');
    if (cached) {
      return res.json({ source: 'redis-cache', data: JSON.parse(cached) });
    }

    const programs = await Program.find();
    await redisClient.setEx('vigyaan:programs', 300, JSON.stringify(programs));
    res.json({ source: 'mongodb', data: programs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Student Inquiry (Saves to MongoDB + Pushes Event to Redis Message Queue)
app.post('/api/inquiries', async (req, res) => {
  try {
    const { name, email, programInterest, message } = req.body;
    const inquiry = await Inquiry.create({ name, email, programInterest, message });

    // Publish event to Redis Message Queue for Python AI Worker to consume asynchronously
    const eventPayload = JSON.stringify({
      inquiryId: inquiry._id.toString(),
      name,
      programInterest,
      message
    });
    await redisClient.lPush('vigyaan:inquiry_queue', eventPayload);

    res.status(201).json({
      message: 'Inquiry received! Our team will get back to you within 24 hours.',
      inquiryId: inquiry._id
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

init();