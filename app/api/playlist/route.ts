import { NextResponse } from 'next/server';

type SpotifyImage = {
  url: string;
  height: number | null;
  width: number | null;
};

type PlaylistResponse = {
  id: string;
  name: string;
  images: SpotifyImage[];
};

const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const PLAYLIST_ENDPOINT = 'https://api.spotify.com/v1/playlists/';
let cachedToken: { token: string; expiresAt: number } | null = null;

function extractPlaylistId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  if (/^[a-zA-Z0-9]{16,}/.test(trimmed)) {
    return trimmed;
  }

  const match = trimmed.match(/playlist\/([a-zA-Z0-9]+)/);
  if (match && match[1]) {
    return match[1];
  }

  const uriMatch = trimmed.match(/spotify:playlist:([a-zA-Z0-9]+)/);
  if (uriMatch && uriMatch[1]) {
    return uriMatch[1];
  }

  return null;
}

async function getAccessToken(): Promise<string> {
  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
    throw new Error('Spotify credentials are not configured.');
  }

  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  const credentials = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString('base64');

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' })
  });

  if (!response.ok) {
    throw new Error('Unable to authenticate with Spotify.');
  }

  const tokenJson = (await response.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: tokenJson.access_token,
    expiresAt: Date.now() + (tokenJson.expires_in - 60) * 1000
  };

  return cachedToken.token;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const playlistInput = typeof body.playlistUrl === 'string' ? body.playlistUrl : '';
    const playlistId = extractPlaylistId(playlistInput);

    if (!playlistId) {
      return NextResponse.json({ error: 'Please provide a valid Spotify playlist URL or ID.' }, { status: 400 });
    }

    const token = await getAccessToken();
    const playlistResponse = await fetch(`${PLAYLIST_ENDPOINT}${playlistId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      next: { revalidate: 60 }
    });

    if (playlistResponse.status === 404) {
      return NextResponse.json({ error: 'Playlist not found. Double-check the link.' }, { status: 404 });
    }

    if (!playlistResponse.ok) {
      console.error('Spotify API error', await playlistResponse.text());
      return NextResponse.json(
        { error: 'Spotify returned an unexpected response. Try again shortly.' },
        { status: 502 }
      );
    }

    const playlistJson = (await playlistResponse.json()) as PlaylistResponse;

    return NextResponse.json({
      id: playlistJson.id,
      name: playlistJson.name,
      images: playlistJson.images
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Something went wrong while requesting the playlist. Please try again.' },
      { status: 500 }
    );
  }
}
