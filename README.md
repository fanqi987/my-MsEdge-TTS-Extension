# MS Edge TTS Extension (Text to Speech)

## Description
This is a Text-to-Speech browser extension that uses MS Edge Online TTS service.

## Features
- ✨ Dark mode is finally here!
- Natural Sounding Voices
- Multiple Language Support
- Context Menu Item
- Download generated audio file
- Advanced controls: Rate, Pitch and Volume
- Generated audio is Free for Personal and Commercial Use
- User-friendly interface
- Language and country autocomplete for fast search

## ⚠️ Important: API Fix Required (December 2024)

Microsoft recently tightened their API security, requiring a specific Origin header that browsers cannot set. This fix uses a Cloudflare Worker as a proxy.

### Quick Setup

1. **Deploy the proxy** (free, takes 2 minutes):
   ```bash
   npm install -g wrangler
   wrangler login
   cd cloudflare-worker && wrangler deploy
   ```
   You'll get a URL like `https://msedge-tts-proxy.YOUR_USERNAME.workers.dev`

2. **Configure the extension**:
   Edit `assets/custom hooks/useTTS.tsx` and replace `YOUR_USERNAME` with your Cloudflare username.

3. **Build and install**:
   ```bash
   npm install
   npm run build
   ```

See [cloudflare-worker/README.md](cloudflare-worker/README.md) for details.

---

## Installation
### - Mozilla / Chrome Web Store
- [Chrome Web Store](https://chrome.google.com/webstore/detail/oajalfneblkfiejoadecnmodfpnaeblh) *(may be outdated)*
- [Mozilla Addons](https://addons.mozilla.org/en-US/firefox/addon/ms-edge-tts-text-to-speech/) *(may be outdated)*
### - Manual Installation
1. Clone this repository and run `npm i`.
2. **Deploy the Cloudflare Worker proxy** (see above).
3. Update `PROXY_URL` in `assets/custom hooks/useTTS.tsx`.
4. Run `npm run build` for Chrome, `npm run build:firefox` for Firefox.
5. Open your browser's extension settings.
6. Enable developer mode.
7. Click on "Load unpacked" and select the `.output/chrome-mv3` folder.
8. The extension should now be installed and ready to use.

## Screenshots
![MsEdge_TTS_Screenshot_1.png](/screenshots/MsEdge_TTS_Screenshot_1.png)
![MsEdge_TTS_Screenshot_2.png](/screenshots/MsEdge_TTS_Screenshot_2.png)
![MsEdge_TTS_Screenshot_3.png](/screenshots/MsEdge_TTS_Screenshot_3.png)
![MsEdge_TTS_Screenshot_4.png](/screenshots/MsEdge_TTS_Screenshot_4.png)
![MsEdge_TTS_Screenshot_5.png](/screenshots/MsEdge_TTS_Screenshot_5.png)
![MsEdge_TTS_Screenshot_6.png](/screenshots/MsEdge_TTS_Screenshot_6.png)

## Attribution
The extension icon is created by <a href="https://www.flaticon.com/free-icons/loud-speaker" title="loud speaker icons">Loud speaker icons created by Uniconlabs - Flaticon</a>

## Contact
If you have any questions or suggestions, feel free to contact the project maintainer at [yacine.web.ext@gmail.com](mailto:yacine.web.ext@gmail.com).

## Contributing
Contributions are welcome! If you have any ideas or improvements, please submit a pull request.