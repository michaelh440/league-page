// src/lib/heygen.js
import { HEYGEN_API_KEY } from '$env/static/private';

const HEYGEN_API_BASE = 'https://api.heygen.com';

// Default avatar and voice IDs
const DEFAULT_AVATAR_ID = 'Annelise-incasualsuit-20220818';
const DEFAULT_VOICE_ID = 'af5ad3316bbe4b8e878b2d1e5989105a'; // Jenny Neural voice

/**
 * Create a video generation request with HeyGen
 * @param {string} script - The text to be spoken in the video
 * @param {Object} options - Additional options for video generation
 * @returns {Promise<{success: boolean, videoId?: string, error?: string}>}
 */
export async function createHeyGenVideo(script, options = {}) {
	try {
		console.log('=== CREATE HEYGEN VIDEO ===');
		console.log('Script length:', script?.length);
		console.log('Options:', options);
		
		// Handle avatarId - might be object or string
		let avatarId = options.avatarId;
		if (typeof avatarId === 'object' && avatarId?.avatar_id) {
			avatarId = avatarId.avatar_id;
		}
		
		// Handle voiceId - might be object or string
		let voiceId = options.voiceId;
		if (typeof voiceId === 'object' && voiceId?.voice_id) {
			voiceId = voiceId.voice_id;
		}
		
		console.log('Using avatar:', avatarId || DEFAULT_AVATAR_ID);
		console.log('Using voice:', voiceId || DEFAULT_VOICE_ID);

		if (!HEYGEN_API_KEY) {
			throw new Error('HEYGEN_API_KEY is not configured');
		}

		if (!script || script.trim().length === 0) {
			throw new Error('Script text is required');
		}

		const payload = {
			video_inputs: [
				{
					character: {
						type: 'avatar',
						avatar_id: avatarId || DEFAULT_AVATAR_ID,
						avatar_style: 'normal'
					},
					voice: {
						type: 'text',
						input_text: script,
						voice_id: voiceId || DEFAULT_VOICE_ID
					}
				}
			],
			dimension: {
				width: 1280,
				height: 720
			},
			test: false,
			caption: false
		};

		console.log('Sending payload to HeyGen:', JSON.stringify(payload, null, 2));

		const response = await fetch(`${HEYGEN_API_BASE}/v2/video/generate`, {
			method: 'POST',
			headers: {
				'accept': 'application/json',
				'content-type': 'application/json',
				'x-api-key': HEYGEN_API_KEY
			},
			body: JSON.stringify(payload)
		});

		console.log('HeyGen response status:', response.status);

		const data = await response.json();
		console.log('HeyGen response data:', data);

		if (!response.ok) {
			throw new Error(`HeyGen API error: ${JSON.stringify(data)}`);
		}

		if (data.error) {
			throw new Error(`HeyGen error: ${data.error.message || JSON.stringify(data.error)}`);
		}

		return {
			success: true,
			videoId: data.data?.video_id
		};
	} catch (error) {
		console.error('Error creating HeyGen video:', error);
		return {
			success: false,
			error: error.message
		};
	}
}

/**
 * Check the status of a HeyGen video
 * @param {string} videoId - The HeyGen video ID
 * @returns {Promise<{success: boolean, status?: string, videoUrl?: string, error?: string}>}
 */
export async function getHeyGenVideoStatus(videoId) {
	try {
		if (!HEYGEN_API_KEY) {
			throw new Error('HEYGEN_API_KEY is not configured');
		}

		if (!videoId) {
			throw new Error('Video ID is required');
		}

		const response = await fetch(`${HEYGEN_API_BASE}/v1/video_status.get?video_id=${videoId}`, {
			method: 'GET',
			headers: {
				'accept': 'application/json',
				'x-api-key': HEYGEN_API_KEY
			}
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(`HeyGen API error: ${JSON.stringify(data)}`);
		}

		if (data.error) {
			throw new Error(`HeyGen error: ${data.error.message || JSON.stringify(data.error)}`);
		}

		const videoData = data.data;

		return {
			success: true,
			status: videoData.status,
			videoUrl: videoData.video_url,
			thumbnailUrl: videoData.thumbnail_url,
			duration: videoData.duration,
			error: videoData.error
		};
	} catch (error) {
		console.error('Error checking HeyGen video status:', error);
		return {
			success: false,
			error: error.message
		};
	}
}

/**
 * List available HeyGen avatars
 * @returns {Promise<{success: boolean, avatars?: Array, error?: string}>}
 */
export async function listHeyGenAvatars() {
	try {
		console.log('=== LIST HEYGEN AVATARS ===');
		console.log('API Key exists:', !!HEYGEN_API_KEY);
		console.log('API Key length:', HEYGEN_API_KEY ? HEYGEN_API_KEY.length : 0);
		console.log('API Key first 20 chars:', HEYGEN_API_KEY ? HEYGEN_API_KEY.substring(0, 20) : 'NONE');

		if (!HEYGEN_API_KEY) {
			throw new Error('HEYGEN_API_KEY is not configured');
		}

		console.log('Fetching HeyGen avatars...');

		const response = await fetch(`${HEYGEN_API_BASE}/v2/avatars`, {
			method: 'GET',
			headers: {
				'accept': 'application/json',
				'x-api-key': HEYGEN_API_KEY
			}
		});

		console.log('Avatars response status:', response.status);

		const data = await response.json();
		console.log('Avatars response:', data);

		if (!response.ok) {
			throw new Error(`Failed to fetch avatars (${response.status}): ${JSON.stringify(data)}`);
		}

		if (data.error) {
			throw new Error(`HeyGen error: ${data.error.message || JSON.stringify(data.error)}`);
		}

		return {
			success: true,
			avatars: data.data?.avatars || []
		};
	} catch (error) {
		console.error('Error listing HeyGen avatars:', error);
		return {
			success: false,
			error: error.message,
			avatars: []
		};
	}
}

/**
 * List available HeyGen voices
 * @returns {Promise<{success: boolean, voices?: Array, error?: string}>}
 */
export async function listHeyGenVoices() {
	try {
		console.log('=== LIST HEYGEN VOICES ===');

		if (!HEYGEN_API_KEY) {
			throw new Error('HEYGEN_API_KEY is not configured');
		}

		console.log('Fetching HeyGen voices...');

		const response = await fetch(`${HEYGEN_API_BASE}/v2/voices`, {
			method: 'GET',
			headers: {
				'accept': 'application/json',
				'x-api-key': HEYGEN_API_KEY
			}
		});

		console.log('Voices response status:', response.status);

		const data = await response.json();
		console.log('Voices response:', data);

		if (!response.ok) {
			throw new Error(`Failed to fetch voices (${response.status}): ${JSON.stringify(data)}`);
		}

		if (data.error) {
			throw new Error(`HeyGen error: ${data.error.message || JSON.stringify(data.error)}`);
		}

		return {
			success: true,
			voices: data.data?.voices || []
		};
	} catch (error) {
		console.error('Error listing HeyGen voices:', error);
		return {
			success: false,
			error: error.message,
			voices: []
		};
	}
}