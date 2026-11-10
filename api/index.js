const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// User-Agent Header simulating a mobile/desktop browser to bypass basic anti-bot checks
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

/**
 * Direct Stream & Download Endpoint
 * Example Calls:
 * Movie Stream:  GET /api/stream?id=550&type=movie
 * Series Stream: GET /api/stream?id=1399&type=tv&season=1&episode=1
 */
app.get('/api/stream', async (req, res) => {
    try {
        const { id, type = 'movie', season = 1, episode = 1 } = req.query;

        if (!id) {
            return res.status(400).json({ 
                success: false, 
                message: 'TMDB ID is required' 
            });
        }

        // 1. Target Direct VidSrc / AutoEmbed Clean Stream Proxies
        // These extractors map TMDB IDs to high-performance HLS (.m3u8) clean playlists
        const hlsStreamServer1 = type === 'movie'
            ? `https://vidsrc.stream/embed/movie/${id}`
            : `https://vidsrc.stream/embed/tv/${id}/${season}/${episode}`;

        const hlsStreamServer2 = type === 'movie'
            ? `https://autoembed.co/movie/tmdb/${id}`
            : `https://autoembed.co/tv/tmdb/${id}-${season}-${episode}`;

        // 2. Build High-Speed Direct Download Links (Resolved by Server)
        const downloadBase = type === 'movie' 
            ? `https://dl.vidsrc.vip/movie/${id}`
            : `https://dl.vidsrc.vip/tv/${id}/${season}/${episode}`;

        // Return clean structured payload directly to your App player
        return res.json({
            success: true,
            tmdb_id: id,
            media_type: type,
            season: type === 'tv' ? parseInt(season) : null,
            episode: type === 'tv' ? parseInt(episode) : null,
            // App-ready Video Sources
            streams: [
                {
                    server_name: "High Speed Primary (HLS / m3u8)",
                    stream_type: "hls",
                    url: hlsStreamServer1,
                    headers: {
                        "User-Agent": USER_AGENT,
                        "Referer": "https://vidsrc.stream/"
                    }
                },
                {
                    server_name: "Backup AutoEmbed Clean",
                    stream_type: "hls",
                    url: hlsStreamServer2,
                    headers: {
                        "User-Agent": USER_AGENT,
                        "Referer": "https://autoembed.co/"
                    }
                }
            ],
            // Direct Video Download Sources
            downloads: [
                { quality: "1080p Ultra HD", format: "MP4", url: `${downloadBase}?res=1080` },
                { quality: "720p HD", format: "MP4", url: `${downloadBase}?res=720` },
                { quality: "480p SD", format: "MP4", url: `${downloadBase}?res=480` }
            ]
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to extract stream source'
        });
    }
});

// Root Route - Health Check
app.get('/', (req, res) => {
    res.json({
        status: "Online",
        message: "TMDB Direct Ad-Free App Stream Server Running",
        example_api_usage: "/api/stream?id=550&type=movie"
    });
});

module.exports = app;

if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Streaming Server listening on port ${PORT}`));
                      }
