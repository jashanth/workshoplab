# Kali Web VM - Backend Server Example

This is a reference implementation for the backend server that the Kali Web VM frontend can connect to.

## Architecture

The backend should provide:
- Session management API (create, list, delete sessions)
- WebSocket terminal connections
- Isolated Linux/Kali container execution

## API Endpoints

### POST /api/sessions
Create a new Kali Linux session.

**Request:**
```json
{
  "image": "kalilinux/kali-rolling:latest",
  "resourceLimits": {
    "cpuLimit": 2,
    "memoryLimit": 2048
  }
}
```

**Response:**
```json
{
  "sessionId": "uuid-here",
  "status": "starting",
  "websocketUrl": "ws://localhost:3001/api/sessions/uuid-here/terminal"
}
```

### GET /api/sessions/:id
Get session information.

**Response:**
```json
{
  "id": "uuid-here",
  "status": "running",
  "containerId": "docker-container-id",
  "createdAt": 1234567890,
  "lastActivity": 1234567890,
  "ipAddress": "172.17.0.2"
}
```

### DELETE /api/sessions/:id
Terminate and delete a session.

**Response:**
```json
{
  "success": true
}
```

### WebSocket /api/sessions/:id/terminal
Bidirectional terminal communication.

**Client → Server:**
```json
{
  "type": "data",
  "payload": { "data": "ls -la\n" }
}
```

```json
{
  "type": "resize",
  "payload": { "cols": 80, "rows": 24 }
}
```

**Server → Client:**
```json
{
  "type": "data",
  "payload": { "data": "terminal output here" }
}
```

## Security Considerations

### Container Isolation
- Run each session in an isolated Docker container
- Use resource limits (CPU, memory, network)
- No host filesystem access
- No privileged mode
- No host Docker socket exposure

### Authentication
- Implement proper authentication (JWT, session tokens)
- Validate all WebSocket connections
- Rate limiting on session creation

### Session Management
- Implement session timeouts (e.g., 30 minutes of inactivity)
- Automatic cleanup of stopped containers
- Maximum sessions per user

### Network Isolation
- Containers should be on isolated networks
- No direct host network access
- Firewall rules for outbound connections

## Example Implementation (Node.js + Docker)

```javascript
const express = require('express');
const { WebSocketServer } = require('ws');
const Docker = require('dockerode');
const { v4: uuidv4 } = require('uuid');

const app = express();
const docker = new Docker();
const sessions = new Map();

app.post('/api/sessions', async (req, res) => {
  const sessionId = uuidv4();
  
  // Create isolated container
  const container = await docker.createContainer({
    Image: 'kalilinux/kali-rolling:latest',
    AttachStdin: true,
    AttachStdout: true,
    AttachStderr: true,
    Tty: true,
    OpenStdin: true,
    Cmd: ['/bin/bash'],
    HostConfig: {
      Memory: 2048 * 1024 * 1024,
      NanoCpus: 2000000000,
      NetworkMode: 'none', // Isolated network
    },
  });

  await container.start();

  sessions.set(sessionId, {
    container,
    createdAt: Date.now(),
    lastActivity: Date.now(),
  });

  res.json({
    sessionId,
    status: 'running',
    websocketUrl: `ws://localhost:3001/api/sessions/${sessionId}/terminal`,
  });
});

// WebSocket terminal handler
wss.on('connection', (ws, req) => {
  const sessionId = extractSessionId(req.url);
  const session = sessions.get(sessionId);
  
  if (!session) {
    ws.close(1008, 'Session not found');
    return;
  }

  const stream = await session.container.attach({
    stream: true,
    stdin: true,
    stdout: true,
    stderr: true,
  });

  // Pipe container output to WebSocket
  stream.on('data', (data) => {
    ws.send(JSON.stringify({
      type: 'data',
      payload: { data: data.toString() }
    }));
  });

  // Pipe WebSocket input to container
  ws.on('message', (message) => {
    const msg = JSON.parse(message);
    if (msg.type === 'data') {
      stream.write(msg.payload.data);
    }
  });
});

app.listen(3001);
```

## Running Without Backend

The frontend is designed to work in **offline mode** when no backend is available:
- Virtual filesystem with persistence
- Simulated command execution
- All UI features remain functional
- Clear indication of offline status

## Environment Variables

Create a `.env` file:
```
VITE_API_URL=http://localhost:3001/api
VITE_WS_HOST=localhost:3001
```

Leave these empty or commented out to run in offline mode.
