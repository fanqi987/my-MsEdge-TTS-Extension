import { useState } from "react";

const DEFAULT_VOICE = 'en-US-AndrewNeural';

// Cloudflare Worker proxy URL
// See cloudflare-worker/README.md for deployment instructions
const PROXY_URL = 'https://msedge-tts-proxy.284811590.workers.dev';

export default function useTTS() {
    const [audioUrl, setAudioUrl] = useState<string>('');
    const [audioLoading, setAudioLoading] = useState<boolean>(false);
    const [audioError, setAudioError] = useState<boolean | null>(null);

    const generateAudio = async (text: string, voice: string, settings: Record<string, any>) => {
        setAudioLoading(true);
        setAudioError(null);

        try {
            const url = await getAudioUrl(text, voice, settings);
            setAudioUrl(url);
        } catch (e) {
            console.error('🔴 TTS Error:', e);
            setAudioError(true);
        } finally {
            setAudioLoading(false);
        }
    };

    return { audioUrl, audioLoading, audioError, generateAudio };
};

const getAudioUrl = async (text: string, voice: string, settings: Record<string, any>) => {
    console.log('🔵 TTS Proxy: Sending request to proxy');
    console.log('🔵 TTS Proxy: Voice:', voice || DEFAULT_VOICE);
    console.log('🔵 TTS Proxy: Text length:', text.length);

    // Convert rate/pitch from percentage (-50 to +50) to edge-tts format
    const rate = settings.rate >= 0 ? `+${settings.rate}%` : `${settings.rate}%`;
    const pitch = settings.pitch >= 0 ? `+${settings.pitch}Hz` : `${settings.pitch}Hz`;

    console.log('🔵 TTS Proxy: Rate:', rate, 'Pitch:', pitch);

    const response = await fetch(`${PROXY_URL}/tts`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            text,
            voice: voice || DEFAULT_VOICE,
            rate,
            pitch,
            volume: '+0%'
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    console.log('🔵 TTS Proxy: Response received, status:', response.status);

    const arrayBuffer = await response.arrayBuffer();
    console.log('🔵 TTS Proxy: ArrayBuffer size:', arrayBuffer.byteLength);

    if (arrayBuffer.byteLength === 0) {
        throw new Error('Empty audio response');
    }

    const audioBlob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
    console.log('🟢 TTS Proxy: Audio blob created, size:', audioBlob.size);

    return URL.createObjectURL(audioBlob);
};
