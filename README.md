<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1B8-UTHD1wpwWXWe8OKLkppRfilogEEGC

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`


## Deploy

### GitHub Pages Deployment

This project is configured for automatic deployment to GitHub Pages using GitHub Actions.

**Automatic Deployment:**
- Every push to the `main` branch triggers the deployment workflow
- The workflow builds the project and deploys it to GitHub Pages
- Your app will be available at: `https://momontea.github.io/MoMonTEARush/`

**Prerequisites:**
1. Ensure GitHub Pages is enabled in repository settings
2. Set the publishing source to "GitHub Actions"

**To Deploy Manually:**
1. Go to the "Actions" tab
2. Select "Deploy to GitHub Pages" workflow
3. Click "Run workflow" on the main branch

### Environment Variables

Before deploying, create a `.env.local` file:

```bash
cp .env.example .env.local
```

Then fill in your actual values:
- `GEMINI_API_KEY`: Your Google Gemini API key from [ai.studio.google.com](https://ai.studio.google.com)

### Build Configuration

- **Build tool:** Vite
- **Output directory:** `dist`
- **Node version:** 18+
- **Package manager:** npm

**To build locally:**
```bash
npm install
npm run build
```

**To preview the build:**
```bash
npm run preview
```
