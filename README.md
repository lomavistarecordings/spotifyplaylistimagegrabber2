# Spotify Playlist Image Grabber

This is a minimal Next.js web application that fetches playlist artwork via the Spotify Web API. Paste a Spotify playlist URL (or ID) and the app will return the cover images so you can download or reuse them elsewhere.

## Getting started

1. Install dependencies (Node.js 18+):

   ```bash
   npm install
   ```

2. Create an `.env.local` file from the provided example and include your Spotify API credentials:

   ```ini
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

   The app will be available at http://localhost:3000.

## Deploying to Vercel

This project is ready for Vercel. After importing it, set the same `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` values in your Vercel Project Settings → Environment Variables. Redeploy and the API route will continue to work server-side.

## How it works

- The `/api/playlist` route exchanges your client credentials for a Spotify access token, caches it briefly, and queries the Spotify Playlist endpoint.
- The front-end form posts playlist URLs to that API route and renders all of the returned image sizes in a responsive grid.

## Notes

- Only public playlists are accessible through the client-credentials flow.
- Spotify limits requests, so repeated rapid lookups of the same playlist might be temporarily throttled.
