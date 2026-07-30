// Cloudflare Worker — YouTube API Proxy
// Stores the API key securely in env.YOUTUBE_API_KEY
// version - 0.1

// Allowed origins for CORS (update with your domain)
const ALLOWED_ORIGINS = [
	'https://your-frontend-domain.com',
	'http://localhost:3000' // for local testing
];

export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		const path = url.pathname;

		// Only handle /api/youtube/search
		if (path === '/api/youtube/search') {
			const query = url.searchParams.get('q');
			if (!query) {
				return new Response(
					JSON.stringify({
						error: 'Missing "q" query parameter'
					}), {
						status: 400,
						headers: {
							'Content-Type': 'application/json'
						}
					}
				);
			}

			// Get the API key from environment
			const apiKey = env.YOUTUBE_API_KEY;
			if (!apiKey) {
				return new Response(
					JSON.stringify({
						error: 'YOUTUBE_API_KEY not set'
					}), {
						status: 500,
						headers: {
							'Content-Type': 'application/json'
						}
					}
				);
			}

			// Build the YouTube API request
			const ytUrl = new URL('https://www.googleapis.com/youtube/v3/search');
			ytUrl.searchParams.set('part', 'snippet');
			ytUrl.searchParams.set('type', 'video');
			ytUrl.searchParams.set('videoCategoryId', '10'); // Music
			ytUrl.searchParams.set('maxResults', '5');
			ytUrl.searchParams.set('q', query);
			ytUrl.searchParams.set('key', apiKey);

			try {
				const response = await fetch(ytUrl.toString());
				const data = await response.json();

				// Check for YouTube API errors
				if (data.error) {
					return new Response(
						JSON.stringify({
							error: data.error.message
						}), {
							status: response.status,
							headers: {
								'Content-Type': 'application/json'
							}
						}
					);
				}

				// Return the results to the frontend
				const results = (data.items || []).map(item => ({
					id: item.id.videoId,
					title: item.snippet.title,
					channel: item.snippet.channelTitle,
					thumb: item.snippet.thumbnails?.default?.url || null
				}));

				return new Response(
					JSON.stringify({
						success: true,
						items: results
					}), {
						status: 200,
						headers: {
							'Content-Type': 'application/json',
							'Access-Control-Allow-Origin': '*', // Adjust for production
						}
					}
				);
			} catch (error) {
				return new Response(
					JSON.stringify({
						error: 'Proxy error: ' + error.message
					}), {
						status: 500,
						headers: {
							'Content-Type': 'application/json'
						}
					}
				);
			}
		}

		// For any other path, return 404
		return new Response('Not Found', {
			status: 404
		});
	}
};
