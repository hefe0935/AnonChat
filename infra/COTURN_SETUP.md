# Coturn TURN Server Configuration

This directory contains example configuration and instructions for setting up your own TURN server using Coturn.

## Why TURN?

WebRTC connections normally use STUN to get your public IP. However, if you're behind a restrictive firewall or symmetric NAT, you need a TURN server to relay media traffic.

## Installation (Ubuntu/Debian)

```bash
sudo apt-get update
sudo apt-get install coturn
```

## Configuration

Create/edit `/etc/coturn/turnserver.conf`:

```bash
# Basic settings
listening-ip=0.0.0.0
listening-port=3478
alt-listening-port=3479
listening-ip=::
external-ip=YOUR.PUBLIC.IP.HERE

# Relay settings
relay-ip=YOUR.PUBLIC.IP.HERE
relay-ip=::

# User authentication (static)
user=user1:password123
user=user2:password456

# Performance
bps-capacity=0
max-bps-capacity=0
total-quota=100000
user-quota=10000
stale-nonce=600

# Logging
log-file=/var/log/coturn/turnserver.log
verbosity=1
```

## Ephemeral Credentials

For production, use ephemeral credentials instead of static passwords:

### Using coturn with REST API (recommended)

```bash
# Enable REST API in turnserver.conf:
rest-api-separator=:
realm=your-domain.com

# Credentials last only 24 hours
# Format: username:realm:hmac-sha1(user:realm:password)
```

### Generate ephemeral credentials (Node.js example)

```javascript
import crypto from 'crypto';

function generateEphemeralCredentials(username, sharedSecret) {
  // Valid for 24 hours
  const timestamp = Math.floor(Date.now() / 1000) + 24 * 3600;
  const userRealm = `${username}:${timestamp}`;
  
  const hmac = crypto
    .createHmac('sha1', sharedSecret)
    .update(userRealm)
    .digest('base64');

  return {
    username: userRealm,
    credential: hmac,
    expiresAt: new Date(timestamp * 1000).toISOString(),
  };
}

// Usage
const creds = generateEphemeralCredentials('user123', 'your-shared-secret');
console.log(creds);
// Output:
// {
//   username: 'user123:1700000000',
//   credential: 'xxx==',
//   expiresAt: '2024-11-15T12:00:00.000Z'
// }
```

## Start Coturn

```bash
# Enable and start
sudo systemctl enable coturn
sudo systemctl start coturn

# Check status
sudo systemctl status coturn

# View logs
sudo tail -f /var/log/coturn/turnserver.log
```

## Test TURN Server

```bash
# Using turnutils_uclient
turnutils_uclient -v -n 2 -u user1 -w password123 -p 3478 YOUR.PUBLIC.IP.HERE
```

## Production Setup

1. **Firewall**: Open ports 3478 (TCP/UDP), 3479 (TCP/UDP), and 5349 (TURNS)
2. **TLS**: Generate certificates for TURNS (secure TURN over TLS)
   ```bash
   sudo certbot certonly --standalone -d your-domain.com
   # Add to turnserver.conf:
   cert=/etc/letsencrypt/live/your-domain.com/fullchain.pem
   pkey=/etc/letsencrypt/live/your-domain.com/privkey.pem
   ```

3. **Limits**: Configure bandwidth quotas to prevent abuse
4. **Monitoring**: Use `/var/log/coturn/turnserver.log` and setup alerts

## Client Configuration

Update client config in `client/src/utils/RTCManager.js`:

```javascript
this.iceServers = [
  { urls: ['stun:stun.l.google.com:19302'] },
  {
    urls: ['turn:your-domain.com:3478', 'turn:your-domain.com:3479'],
    username: 'ephemeral-username-with-timestamp',
    credential: 'ephemeral-hmac-credential',
  },
  {
    urls: ['turns:your-domain.com:5349'],
    username: 'ephemeral-username',
    credential: 'ephemeral-credential',
  },
];
```

## References

- Coturn docs: https://github.com/coturn/coturn/wiki
- WebRTC connection: https://webrtc.org/getting-started/media-devices
- NAT traversal: https://en.wikipedia.org/wiki/NAT_traversal
