# Mood Palette

Color inspiration powered by Gemini. Describe a mood, a scene, or a concept, and get a beautiful, matching color palette in return.

## Features

- Generate color palettes from text prompts using AI
- Extract colors from uploaded images
- Capture colors using your camera
- Save and manage your favorite palettes
- Export palettes as Adobe ASE files
- Share palettes via URL

## Getting Started

### Prerequisites

- Node.js 18+
- A Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### Installation

1. Clone the repository:
   \`\`\`bash
   git clone <your-repo-url>
   cd mood-palette
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Set up your API key:
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`
   
   Edit `.env.local` and add your Gemini API key:
   \`\`\`
   GEMINI_API_KEY=your_actual_api_key_here
   \`\`\`

4. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

\`\`\`bash
npm run build
npm start
\`\`\`

## Security & API Keys

**Important: This application uses the Gemini API to generate color palettes.**

### How API keys are handled

- All Gemini API calls are made from a **Next.js API route** (server-side only)
- Your API key is stored in `.env.local` and **never exposed to the browser**
- The key is read server-side via `process.env.GEMINI_API_KEY`
- `.env.local` is gitignored and should **never be committed** to version control

### Setting up your API key securely

When creating your Gemini API key, we strongly recommend:

1. **Use a dedicated key** for this application (not shared with other projects)
2. **Apply domain/referrer restrictions** in [Google AI Studio](https://makersuite.google.com/app/apikey):
   - Restrict to your deployment domain (e.g., `yourdomain.com`)
   - For localhost testing, add `localhost:3000` to allowed referrers
3. **Set reasonable quotas** to prevent unexpected usage costs
4. **Monitor usage** regularly in your Google Cloud Console
5. **Rotate keys periodically** as a security best practice

### What if the API key is missing or invalid?

- If `GEMINI_API_KEY` is not set, the API will return a clear error: `"GEMINI_API_KEY is not configured"`
- If the key is invalid, you'll see an error message indicating the API request failed
- Check the browser console and server logs for specific error details
- Never log or expose the actual API key in error messages

### Production deployment

When deploying to production (Vercel, Netlify, etc.):

1. Add `GEMINI_API_KEY` as an environment variable in your hosting platform
2. Ensure `.env.local` is **not** deployed (it should only exist locally)
3. Apply production domain restrictions to your API key
4. Set up monitoring and alerts for unusual API usage

### Disclaimer

**This project is provided as-is under the MIT License.**

- You are responsible for securing your own deployment and API keys
- You are responsible for any costs associated with Gemini API usage
- This repository ships with no keys, no backend secrets, and no guarantees
- Review Google's [Gemini API terms of service](https://ai.google.dev/terms) before deploying

For questions about API key security or to report a security issue, please open an issue on GitHub.

## Tech Stack

- **Next.js 16** (App Router) - React framework with server-side rendering
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Utility-first styling
- **Gemini API** - AI-powered palette generation
- **ColorThief** - Image color extraction

## Architecture

This is a Next.js application using the App Router:

- `app/page.tsx` - Main application entry point
- `app/api/generate-palette/route.ts` - Server-side API route for Gemini calls
- `components/` - Reusable React components
- `services/` - Client-side service utilities
- `types.ts` - TypeScript type definitions

## License

MIT License - see [LICENSE](LICENSE) file for details.

You are free to:
- Use this code commercially or personally
- Modify and distribute the code
- Use it in private or public projects

**As long as you:**
- Include the original license notice
- Do not hold the authors liable

## Credits

Created by [Carthay Studio](https://carthaystudio.com)

Design system based on the Carthay Studio Surface design language.
