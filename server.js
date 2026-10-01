/**
 * AR Cultural Heritage Guide — Full-Stack REST API & Web Server
 * Zero-dependency Node.js HTTP & REST API Engine
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// Data File Paths
const LANDMARKS_FILE = path.join(__dirname, 'data', 'landmarks.json');
const FEEDBACK_FILE = path.join(__dirname, 'data', 'feedback.json');

// MIME types dictionary
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.patt': 'text/plain'
};

// Helper: Read JSON file safely
function readJson(filePath, fallback = {}) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return fallback;
  }
}

// Helper: Write JSON file safely
function writeJson(filePath, data) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    return false;
  }
}

// Helper: Send JSON response
function sendJsonResponse(res, statusCode, body) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(body));
}

// Helper: Parse POST JSON body
function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 1e6) { // 1MB limit
        req.destroy();
        reject(new Error('Body too large'));
      }
    });
    req.on('end', () => {
      try {
        const parsed = body ? JSON.parse(body) : {};
        resolve(parsed);
      } catch (err) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

// Main HTTP Request Handler
const requestHandler = async (req, res) => {
  // Enable CORS Preflight OPTIONS
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  const urlParts = req.url.split('?')[0];
  const reqPath = decodeURI(urlParts);

  // =========================================================================
  // 1. REST API ENDPOINTS
  // =========================================================================

  // GET /api/landmarks - Get all heritage landmarks
  if (req.method === 'GET' && reqPath === '/api/landmarks') {
    const landmarks = readJson(LANDMARKS_FILE, {});
    return sendJsonResponse(res, 200, { success: true, count: Object.keys(landmarks).length, data: landmarks });
  }

  // GET /api/landmarks/:id - Get specific monument details
  if (req.method === 'GET' && reqPath.startsWith('/api/landmarks/')) {
    const monumentId = reqPath.replace('/api/landmarks/', '');
    const landmarks = readJson(LANDMARKS_FILE, {});
    if (landmarks[monumentId]) {
      return sendJsonResponse(res, 200, { success: true, data: landmarks[monumentId] });
    } else {
      return sendJsonResponse(res, 404, { success: false, error: 'Monument not found' });
    }
  }

  // POST /api/landmarks/:id/like - Upvote / Like a monument
  if (req.method === 'POST' && reqPath.includes('/like')) {
    const parts = reqPath.split('/'); // ['','api','landmarks', ':id', 'like']
    const monumentId = parts[3];
    const landmarks = readJson(LANDMARKS_FILE, {});
    
    if (landmarks[monumentId]) {
      landmarks[monumentId].likes = (landmarks[monumentId].likes || 0) + 1;
      writeJson(LANDMARKS_FILE, landmarks);
      return sendJsonResponse(res, 200, {
        success: true,
        monumentId,
        likes: landmarks[monumentId].likes
      });
    } else {
      return sendJsonResponse(res, 404, { success: false, error: 'Monument not found' });
    }
  }

  // POST /api/landmarks/:id/scan - Increment scan counter on marker detect
  if (req.method === 'POST' && reqPath.includes('/scan')) {
    const parts = reqPath.split('/'); // ['','api','landmarks', ':id', 'scan']
    const monumentId = parts[3];
    const landmarks = readJson(LANDMARKS_FILE, {});

    if (landmarks[monumentId]) {
      landmarks[monumentId].scans = (landmarks[monumentId].scans || 0) + 1;
      writeJson(LANDMARKS_FILE, landmarks);
      return sendJsonResponse(res, 200, {
        success: true,
        monumentId,
        scans: landmarks[monumentId].scans
      });
    } else {
      return sendJsonResponse(res, 404, { success: false, error: 'Monument not found' });
    }
  }

  // POST /api/feedback - Submit visitor feedback
  if (req.method === 'POST' && reqPath === '/api/feedback') {
    try {
      const payload = await parseRequestBody(req);
      const feedbackList = readJson(FEEDBACK_FILE, []);
      
      const newFeedback = {
        id: 'fb_' + Date.now(),
        monumentId: payload.monumentId || 'general',
        rating: payload.rating || 5,
        comment: payload.comment || '',
        name: payload.name || 'Anonymous Cultural Enthusiast',
        createdAt: new Date().toISOString()
      };

      feedbackList.unshift(newFeedback);
      writeJson(FEEDBACK_FILE, feedbackList);

      return sendJsonResponse(res, 201, { success: true, feedback: newFeedback });
    } catch (err) {
      return sendJsonResponse(res, 500, { success: false, error: 'Failed to process feedback' });
    }
  }

  // GET /api/feedback - Retrieve all user feedback
  if (req.method === 'GET' && reqPath === '/api/feedback') {
    const feedbackList = readJson(FEEDBACK_FILE, []);
    return sendJsonResponse(res, 200, { success: true, count: feedbackList.length, data: feedbackList });
  }

  // GET /api/stats - Aggregated Hackathon AR Analytics
  if (req.method === 'GET' && reqPath === '/api/stats') {
    const landmarks = readJson(LANDMARKS_FILE, {});
    const feedbackList = readJson(FEEDBACK_FILE, []);
    
    let totalScans = 0;
    let totalLikes = 0;
    Object.values(landmarks).forEach(l => {
      totalScans += l.scans || 0;
      totalLikes += l.likes || 0;
    });

    return sendJsonResponse(res, 200, {
      success: true,
      stats: {
        totalLandmarks: Object.keys(landmarks).length,
        totalScans,
        totalLikes,
        totalFeedback: feedbackList.length,
        serverTime: new Date().toISOString()
      }
    });
  }

  // =========================================================================
  // 2. STATIC FILE SERVER
  // =========================================================================
  let targetPath = reqPath === '/' ? '/index.html' : reqPath;
  const filePath = path.join(__dirname, targetPath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
};

// If run directly (local development)
if (require.main === module) {
  const server = http.createServer(requestHandler);
  server.listen(PORT, () => {
    console.log(`DHAROHAR AR Heritage REST API & Server running at http://localhost:${PORT}`);
  });
} else {
  // If imported as a module (Vercel Serverless)
  module.exports = requestHandler;
}
