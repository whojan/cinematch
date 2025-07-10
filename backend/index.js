const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// İlerleme takibi için eventId -> response map'i
const progressClients = {};
let eventCounter = 1;

// SSE endpoint'i: /api/bfi-progress/:eventId
app.get('/api/bfi-progress/:eventId', (req, res) => {
  const { eventId } = req.params;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  progressClients[eventId] = res;
  req.on('close', () => {
    delete progressClients[eventId];
  });
});

// BFI listesini güncelleyen endpoint
app.post('/api/update-bfi-list', (req, res) => {
  const eventId = (eventCounter++).toString();
  const scriptPath = path.join(__dirname, '../src/features/content/components/scrape-bfi.ts');
  const cmd = 'npx';
  const args = ['ts-node', scriptPath];
  const child = spawn(cmd, args, { cwd: path.join(__dirname, '../') });

  child.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      const match = line.match(/(\\d{1,3})%/);
      if (match && progressClients[eventId]) {
        progressClients[eventId].write(`data: {\"progress\":${match[1]}}\n\n`);
      }
    }
  });

  child.on('close', (code) => {
    if (progressClients[eventId]) {
      progressClients[eventId].write(`data: {\"done\":true}\n\n`);
      progressClients[eventId].end();
      delete progressClients[eventId];
    }
  });

  child.on('error', (error) => {
    if (progressClients[eventId]) {
      progressClients[eventId].write(`data: {\"error\":\"${error.message}\"}\n\n`);
      progressClients[eventId].end();
      delete progressClients[eventId];
    }
  });

  res.json({ success: true, eventId });
});

// BFI Directors listesini güncelleyen endpoint
app.post('/api/update-bfi-directors-list', (req, res) => {
  const eventId = (eventCounter++).toString();
  const scriptPath = path.join(__dirname, '../src/features/content/components/scrape-bfi-directors.ts');
  const cmd = 'npx';
  const args = ['ts-node', scriptPath];
  const child = spawn(cmd, args, { cwd: path.join(__dirname, '../') });

  child.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      const match = line.match(/(\d{1,3})%/);
      if (match && progressClients[eventId]) {
        progressClients[eventId].write(`data: {\"progress\":${match[1]}}\n\n`);
      }
    }
  });

  child.on('close', (code) => {
    if (progressClients[eventId]) {
      progressClients[eventId].write(`data: {\"done\":true}\n\n`);
      progressClients[eventId].end();
      delete progressClients[eventId];
    }
  });

  child.on('error', (error) => {
    if (progressClients[eventId]) {
      progressClients[eventId].write(`data: {\"error\":\"${error.message}\"}\n\n`);
      progressClients[eventId].end();
      delete progressClients[eventId];
    }
  });

  res.json({ success: true, eventId });
});

// SSE endpoint'i: /api/bfi-directors-progress/:eventId
app.get('/api/bfi-directors-progress/:eventId', (req, res) => {
  const { eventId } = req.params;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  progressClients[eventId] = res;
  req.on('close', () => {
    delete progressClients[eventId];
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend API listening on port ${PORT}`);
});
