import { storage } from "#imports";

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

      const currentVersion = browser.runtime.getManifest().version;
      const lastShownVersionItem = storage.defineItem<string>("local:lastShownVersion");
      const lastShownVersion = await lastShownVersionItem.getValue();

      if (currentVersion !== lastShownVersion) {
        await browser.tabs.create({
          url: browser.runtime.getURL('/update.html'),
          active: true
        });
        await lastShownVersionItem.setValue(currentVersion);
      }
    };

    browser.runtime.onInstalled.addListener(onInstalled);
    browser.runtime.onStartup.addListener(onInstalled);

    const handleTextToSpeech = async (text: string) => {
      if (!text || text.length === 0) return;

      const textStorage = storage.defineItem<string>("session:text");
      textStorage.setValue(text);
    };

    // Find existing TTS reader tab by pinging it
    const findReaderTabId = async (): Promise<number | null> => {
      try {
        const response = await browser.runtime.sendMessage("PING_READER");
        return response?.tabId || null;
      } catch (e) {
        return null;
      }
    };

    // Open or reuse the TTS reader tab
    const openReaderTab = async () => {
      const existingTabId = await findReaderTabId();
      
      if (existingTabId) {
        // Tab exists, no need to create a new one - the text watcher in the app will handle it
        return;
      }

      // Create a new reader tab (active for autoplay to work)
      const readerUrl = browser.runtime.getURL('/reader.html');
      await browser.tabs.create({
        url: readerUrl,
        active: true
      });
    };

    // Handle context menu clicks
    browser.contextMenus.onClicked.addListener(async (clickData, tab) => {
      if (clickData.menuItemId != "edgetts" || !clickData.selectionText) return;
      
      await handleTextToSpeech(clickData.selectionText);
      await openReaderTab();
    });

    // Handle keyboard shortcut
    browser.commands.onCommand.addListener(async (command, tab) => {
      if (command === "speak-selection") {
        const [{ result: text }] = await browser.scripting.executeScript({
          target: { tabId: tab.id! },
          func: () => window.getSelection()?.toString() || ""
        });
        if (text) {
          await handleTextToSpeech(text);
          await openReaderTab();
        }
      }
    });
  }
});
