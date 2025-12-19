# MS Edge TTS Proxy - Cloudflare Worker

Microsoft recently tightened their API security, requiring a specific Origin header that browsers cannot set due to security restrictions. This Cloudflare Worker acts as a proxy to bypass this limitation.

## Quick Deploy

```bash
# Install wrangler CLI
npm install -g wrangler

# Login to Cloudflare (free account)
wrangler login

# Deploy
cd cloudflare-worker
wrangler deploy
```

After deployment, you'll get a URL like `https://msedge-tts-proxy.YOUR_USERNAME.workers.dev`

## Configure the Extension

Update `PROXY_URL` in `assets/custom hooks/useTTS.tsx`:

```typescript
const PROXY_URL = 'https://msedge-tts-proxy.YOUR_USERNAME.workers.dev';
```

Then rebuild:

```bash
npm run build
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/tts` | POST | Generate TTS audio |

### POST /tts

```json
{
  "text": "Text to convert",
  "voice": "en-US-AriaNeural",
  "rate": "+0%",
  "pitch": "+0Hz",
  "volume": "+0%"
}
```

Returns: `audio/mpeg`

## Free Tier

Cloudflare Workers free plan includes 100,000 requests/day - more than enough for personal use.

## How It Works

Browser WebSocket API cannot set custom headers, but Microsoft's API validates the Origin header. Cloudflare Workers' fetch API supports WebSocket connections via HTTP Upgrade with custom headers, bypassing this limitation.

```javascript
const resp = await fetch(wsUrl, {
  headers: {
    'Upgrade': 'websocket',
    'Origin': 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold'
  }
});
const ws = resp.webSocket;
```
