let bgAudio = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "PLAY_TTS_BACKGROUND" && message.audioUrl) {
    const { audioUrl } = message;
    (async () => {
      try {
        if (bgAudio) {
          bgAudio.pause();
        }
        bgAudio = new Audio(audioUrl);
        bgAudio.onended = () => {
          chrome.runtime.sendMessage({ type: "PLAY_TTS_DONE" });
        };
        await bgAudio.play();
        sendResponse({ success: true });
      } catch (error) {
        console.error("Offscreen: error playing audio", error);
        sendResponse({ success: false, error: String(error) });
      }
    })();
    return true;
  }

  if (!bgAudio) return; // No audio initialized yet

  if (message.type === "BG_AUDIO_TOGGLE") {
    if (bgAudio.paused) {
      bgAudio.play().catch(err => console.error("Offscreen: play failed", err));
    } else {
      bgAudio.pause();
    }
  } else if (message.type === "BG_AUDIO_SEEK_REL") {
    const delta = message.seconds;
    bgAudio.currentTime = Math.max(0, bgAudio.currentTime + delta);
  }
});