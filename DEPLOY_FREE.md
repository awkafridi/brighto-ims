# Free Deployment Guide — StockLedger IMS

## Everything is 100% free. No credit card. No server. No monthly fees.

---

## Option A: GitHub Pages (Recommended — completely free forever)

### Step 1 — Create a free GitHub account
1. Go to https://github.com
2. Click "Sign up" — it's free

### Step 2 — Create a new repository
1. Click the **+** button top-right → "New repository"
2. Name it exactly: `brighto-ims`
3. Set it to **Public**
4. Click "Create repository"

### Step 3 — Upload your code
**Easy way (no Git knowledge needed):**
1. On your new repo page, click **"uploading an existing file"**
2. Unzip the `brighto-ims-v3.zip` file on your computer
3. Open the `brighto-ims` folder
4. Select ALL files inside (Ctrl+A) and drag them into the GitHub upload box
5. Scroll down, click **"Commit changes"**

### Step 4 — Enable GitHub Pages
1. In your repo, go to **Settings** tab
2. Scroll to **Pages** in the left sidebar
3. Under "Source" → select **GitHub Actions**
4. That's it! The workflow file is already included.

### Step 5 — Wait 2 minutes
GitHub will automatically build and deploy your app.
Your live URL will be: `https://YOUR-USERNAME.github.io/brighto-ims/`

You'll see it under **Settings → Pages** once it's live.

---

## Option B: Cloudflare Pages (Also free, even faster)

1. Go to https://pages.cloudflare.com — sign up free
2. Click "Create a project" → "Upload assets"
3. Unzip `brighto-ims-v3.zip`, then run `npm install && npm run build` locally
4. Upload the `dist/` folder
5. Your app is live instantly at `https://brighto-ims.pages.dev`

**Or connect GitHub** (no manual uploads):
1. Connect your GitHub account
2. Select your `brighto-ims` repo
3. Build command: `npm run build`
4. Output directory: `dist`
5. Done — auto-deploys on every push

---

## Option C: Netlify Drop (Fastest — 30 seconds, no account needed)

1. Run `npm install && npm run build` locally
2. Go to https://app.netlify.com/drop
3. Drag the `dist/` folder into the browser
4. Get an instant live URL like `https://random-name.netlify.app`

To keep the URL and update later, create a free account.

---

## How data is stored (no server needed)

All your data — products, invoices, shopkeepers, ledger — is saved in your **browser's localStorage**.

- ✅ Survives page refreshes and browser restarts
- ✅ Works completely offline
- ✅ No server, no database, no monthly cost
- ⚠️ Data is per-device/per-browser (doesn't sync between phone and laptop)

**To back up your data:**
Open browser console (F12) → type:
```js
copy(localStorage.getItem('brighto_ims_data_v1'))
```
This copies all your data as text. Paste it somewhere safe.

**To restore a backup:**
```js
localStorage.setItem('brighto_ims_data_v1', 'PASTE-YOUR-BACKUP-HERE')
```
Then refresh the page.

---

## AI Features (OCR + Voice) — Free via Claude

The OCR invoice scanner and voice command features use the Claude API.
These work when you open the app through **claude.ai** as an artifact.

For standalone hosting, to keep AI features free:
1. Leave the app as-is — OCR and voice parsing will show a "demo mode" message
2. The voice-to-text (microphone) always works free via the browser's built-in speech recognition
3. Only the AI parsing step requires an API key

---

## Changing login credentials

Open `src/pages/Login.jsx` and edit the CREDENTIALS array at the top:

```js
const CREDENTIALS = [
  { username: 'admin', password: 'yourpassword', name: 'Your Name', role: 'Owner' },
];
```

Then rebuild and re-upload.

---

## Free forever summary

| What | Cost | Provider |
|------|------|----------|
| App hosting | Free | GitHub Pages / Cloudflare / Netlify |
| Data storage | Free | Browser localStorage |
| WhatsApp messages | Free | wa.me links (opens WhatsApp) |
| Voice-to-text | Free | Browser Web Speech API |
| SSL/HTTPS | Free | Included with all providers |
| Custom domain | Free | Cloudflare (bring your own domain) |

**Total monthly cost: ₨0**
