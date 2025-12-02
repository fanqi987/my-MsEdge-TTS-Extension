import { storage } from "#imports";

let bgAudio: HTMLAudioElement | null = null;

function isChromeWithOffscreen(): boolean {
  return typeof chrome !== 'undefined' &&
         !!chrome.offscreen &&
         typeof chrome.offscreen.createDocument === 'function';
}

async function ensureOffscreenDocument() {
  if (!isChromeWithOffscreen()) return; // no-op on Firefox

  const offscreenUrl = chrome.runtime.getURL('offscreen.html');

  const exists = await chrome.offscreen.hasDocument?.();
  if (exists) return;

  await chrome.offscreen.createDocument({
    url: offscreenUrl,
    reasons: ['AUDIO_PLAYBACK'],
    justification: 'Play TTS audio in background while popup is closed',
  });
}

export default defineBackground({
  type: 'module',
  main: () => {
    if (import.meta.env.CHROME) browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(e => console.log(e));

    const onInstalled = async () => {
      browser.contextMenus.removeAll(() => {
        browser.contextMenus.create({
          "id": "edgetts",
          "title": "Speak with MS-Edge TTS",
          "contexts": ["selection"]
        });
      });
    };

    browser.runtime.onInstalled.addListener(onInstalled);
    browser.runtime.onStartup.addListener(onInstalled);

    const handleTextToSpeech = async (text: string) => {
      if (!text || text.length === 0) return;

      const textStorage = storage.defineItem<string>("session:text");
      textStorage.setValue(text);
    };

    const openUI = async (tab: Browser.tabs.Tab, useSidePanel?: boolean) => {
      if (import.meta.env.CHROME) {
        if (useSidePanel) {
          browser.sidePanel.open({ tabId: tab.id! });
        }
        else {
          browser.action.openPopup();
        }
      }
      else if (import.meta.env.FIREFOX) {
        // @ts-ignore
        browser.browserAction.openPopup();
      }
    }

    // Handle context menu clicks
    browser.contextMenus.onClicked.addListener(async (clickData, tab) => {
      if (clickData.menuItemId != "edgetts" || !clickData.selectionText) return;
      // TODO: add user preference for side panel or popup
      openUI(tab!, true);
      await handleTextToSpeech(clickData.selectionText);
    });

    // Handle keyboard shortcut
    browser.commands.onCommand.addListener(async (command, tab) => {
      if (command === "speak-selection") {
        // TODO: add user preference for side panel or popup
        openUI(tab, false);
        const [{ result: text }] = await browser.scripting.executeScript({
          target: { tabId: tab.id! },
          func: () => window.getSelection()?.toString() || ""
        });
        if (text) {
          handleTextToSpeech(text);
        }
      }
    });

    browser.runtime.onMessage.addListener((message, sender) => {
      if (message.type === 'PLAY_TTS_REQUEST' && message.audioUrl) {
        // Chrome MV3: use offscreen document
        if (import.meta.env.CHROME && isChromeWithOffscreen()) {
          (async () => {
            try {
              await ensureOffscreenDocument();

              chrome.runtime.sendMessage(
                { type: 'PLAY_TTS_BACKGROUND', audioUrl: message.audioUrl },
                () => {
                  const err = chrome.runtime.lastError;
                  if (err && err.message?.includes('Could not establish connection')) {
                    console.warn('No offscreen receiver for PLAY_TTS_BACKGROUND:', err.message);
                  }
                },
              );
            } catch (error) {
              console.error('Background: failed to forward to offscreen', error);
            }
          })();
          return;
        }

        // Firefox MV2 (no offscreen): just play directly here
        if (import.meta.env.FIREFOX) {
          try {
            if (bgAudio) {
              bgAudio.pause();
            }
            bgAudio = new Audio(message.audioUrl);
            bgAudio.play().catch(err => {
              console.error('Firefox: error playing audio in background', err);
            });
          } catch (err) {
            console.error('Firefox: failed to start background audio', err);
          }
        }
      }

      // NEW: simple transport controls for Firefox background audio
       if (import.meta.env.FIREFOX && bgAudio) {
        if (message.type === 'BG_AUDIO_TOGGLE') {
          if (bgAudio.paused) {
            bgAudio.play().catch(err => console.error('Firefox: play failed', err));
          } else {
            bgAudio.pause();
          }
        } else if (message.type === 'BG_AUDIO_SEEK_REL') {
          const delta = message.seconds as number;
          bgAudio.currentTime = Math.max(0, bgAudio.currentTime + delta);
        }
      }
    });
  }
});
