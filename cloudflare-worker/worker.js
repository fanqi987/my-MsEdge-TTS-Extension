/**
 * Cloudflare Worker - MS Edge TTS Proxy
 * Uses fetch-based WebSocket API to set custom Origin header
 */

const TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
// Cloudflare fetch requires https:// instead of wss://
const WSS_URL = "https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1";
const SEC_MS_GEC_VERSION = "1-143.0.3650.75";

function generateUUID() {
  return 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/x/g, () =>
    Math.floor(Math.random() * 16).toString(16)
  );
}

async function generateSecMsGec() {
  const ticks = BigInt(Math.floor((Date.now() / 1000) + 11644473600) * 10000000);
  const roundedTicks = ticks - (ticks % BigInt(3000000000));
  const strToHash = roundedTicks.toString() + TRUSTED_CLIENT_TOKEN;

  const data = new TextEncoder().encode(strToHash);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildSSML(text, voice, rate, pitch, volume) {
  return `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>
    <voice name='${voice}'>
      <prosody rate='${rate}' pitch='${pitch}' volume='${volume}'>
        ${escapeXml(text)}
      </prosody>
    </voice>
  </speak>`;
}

async function synthesize(text, voice, rate, pitch, volume) {
  const reqId = generateUUID();
  const secMsGEC = await generateSecMsGec();

  const wsUrl = `${WSS_URL}?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}&Sec-MS-GEC=${secMsGEC}&Sec-MS-GEC-Version=${SEC_MS_GEC_VERSION}&ConnectionId=${reqId}`;

  // 使用 Cloudflare 的 fetch-based WebSocket API
  const resp = await fetch(wsUrl, {
    headers: {
      'Upgrade': 'websocket',
      'Origin': 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0'
    }
  });

  const ws = resp.webSocket;
  if (!ws) {
    throw new Error('WebSocket upgrade failed');
  }

  ws.accept();

  const audioChunks = [];

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error('Timeout'));
    }, 30000);

    // 发送配置
    const configMsg = `X-Timestamp:${new Date().toISOString()}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"false"},"outputFormat":"audio-24khz-96kbitrate-mono-mp3"}}}}`;
    ws.send(configMsg);

    // 发送 SSML
    const ssml = buildSSML(text, voice, rate, pitch, volume);
    const ssmlMsg = `X-RequestId:${reqId}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${new Date().toISOString()}\r\nPath:ssml\r\n\r\n${ssml}`;
    ws.send(ssmlMsg);

    ws.addEventListener('message', async (event) => {
      const data = event.data;

      if (typeof data === 'string') {
        if (data.includes('Path:turn.end')) {
          clearTimeout(timeout);
          ws.close();

          // 合并音频
          const totalLen = audioChunks.reduce((a, c) => a + c.byteLength, 0);
          const result = new Uint8Array(totalLen);
          let offset = 0;
          for (const chunk of audioChunks) {
            result.set(new Uint8Array(chunk), offset);
            offset += chunk.byteLength;
          }
          resolve(result);
        }
      } else {
        // 二进制音频数据
        const arrayBuffer = data instanceof ArrayBuffer ? data : await data.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);

        // 查找 "Path:audio\r\n" 分隔符
        const separator = new TextEncoder().encode("Path:audio\r\n");
        let audioStart = -1;

        for (let i = 0; i <= bytes.length - separator.length; i++) {
          let found = true;
          for (let j = 0; j < separator.length; j++) {
            if (bytes[i + j] !== separator[j]) {
              found = false;
              break;
            }
          }
          if (found) {
            audioStart = i + separator.length;
            break;
          }
        }

        if (audioStart > 0) {
          audioChunks.push(bytes.slice(audioStart).buffer);
        }
      }
    });

    ws.addEventListener('error', (e) => {
      clearTimeout(timeout);
      reject(new Error('WebSocket error'));
    });

    ws.addEventListener('close', () => {
      clearTimeout(timeout);
    });
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    const url = new URL(request.url);

    // 健康检查
    if (url.pathname === '/' || url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
      });
    }

    // TTS 端点
    if (url.pathname === '/tts' && request.method === 'POST') {
      try {
        const { text, voice, rate, pitch, volume } = await request.json();

        if (!text?.trim()) {
          return new Response(JSON.stringify({ error: 'Text required' }), {
            status: 400,
            headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
          });
        }

        const audio = await synthesize(
          text,
          voice || 'en-US-AndrewNeural',
          rate || '+0%',
          pitch || '+0Hz',
          volume || '+0%'
        );

        return new Response(audio, {
          headers: { ...corsHeaders(), 'Content-Type': 'audio/mpeg' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders() });
  }
};
