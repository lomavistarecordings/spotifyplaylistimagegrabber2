'use client';

import { FormEvent, useState } from 'react';

type PlaylistData = {
  name: string;
  id: string;
  images: { url: string; height: number | null; width: number | null }[];
};

export default function HomePage() {
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [data, setData] = useState<PlaylistData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setData(null);
    setLoading(true);

    try {
      const response = await fetch('/api/playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playlistUrl })
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? 'Unable to load playlist at the moment.');
        return;
      }

      setData(payload as PlaylistData);
    } catch (fetchError) {
      console.error(fetchError);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <section className="card">
        <h1>Spotify Playlist Image Grabber</h1>
        <p>Paste any Spotify playlist link or ID and pull the official cover artwork in seconds.</p>

        <form className="form" onSubmit={handleSubmit}>
          <label htmlFor="playlist-url">Playlist URL or ID</label>
          <input
            id="playlist-url"
            name="playlist-url"
            placeholder="https://open.spotify.com/playlist/..."
            value={playlistUrl}
            onChange={(event) => setPlaylistUrl(event.target.value)}
          />
          <button type="submit" disabled={loading || !playlistUrl.trim()}>
            {loading ? 'Fetching images…' : 'Fetch images'}
          </button>
        </form>

        {error && <div className="status error">{error}</div>}

        {data && (
          <div className="results">
            <div className="status success">
              <strong>{data.name}</strong>
              <div>Found {data.images.length} image{data.images.length === 1 ? '' : 's'}.</div>
            </div>

            <div className="images-grid">
              {data.images.map((image) => (
                <div className="image-tile" key={image.url}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.url} alt={`${data.name} artwork`} loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        )}

        <footer>
          Need to deploy on Vercel? Just set <code>SPOTIFY_CLIENT_ID</code> and <code>SPOTIFY_CLIENT_SECRET</code> in
          your project settings.
        </footer>
      </section>
    </main>
  );
}
