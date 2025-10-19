// src/lib/heygen.js
import { HEYGEN_API_KEY } from '$env/static/private';

const HEYGEN_API_BASE = 'https://api.heygen.com';

/**
 * Create a video generation request with HeyGen
 * @param {string} script - The text to be spoken in the video
 * @param {Object} options - Additional options for video generation
 * @returns {Promise<Object>} - Video generation result with video_id
 */
export async function createHeyGenVideo(script, options = {}) {
    const {
        avatarId = 'josh_lite3_20230714', // Using a common public avatar as fallback
        voiceId = 'en-US-JennyNeural',
        backgroundColor = '#FFFFFF',
        title = 'Fantasy Football Weekly Summary'
    } = options;

    // Try the simpler v1 API format first
    const payload = {
        video_inputs: [
            {
                character: {
                    type: 'avatar',
                    avatar_id: avatarId
                },
                voice: {
                    type: 'text',
                    input_text: script,
                    voice_id: voiceId
                }
            }
        ],
        test: false,
        caption: false
    };

    console.log('Calling HeyGen API...');
    console.log('API Key present:', !!HEYGEN_API_KEY);
    console.log('Payload:', JSON.stringify(payload, null, 2));

    try {
        // Try v1 endpoint
        const response = await fetch(`${HEYGEN_API_BASE}/v1/video.generate`, {
            method: 'POST',
            headers: {
                'X-Api-Key': HEYGEN_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const responseText = await response.text();
        console.log('HeyGen response status:', response.status);
        console.log('HeyGen response:', responseText);

        if (!response.ok) {
            // Try to parse error
            let errorMessage;
            try {
                const errorData = JSON.parse(responseText);
                errorMessage = `HeyGen API error (${response.status}): ${errorData.message || errorData.error || JSON.stringify(errorData)}`;
            } catch (e) {
                errorMessage = `HeyGen API error (${response.status}): ${responseText}`;
            }
            throw new Error(errorMessage);
        }

        const data = JSON.parse(responseText);
        console.log('HeyGen success response:', data);
        
        if (!data.data || !data.data.video_id) {
            console.error('Invalid HeyGen response structure:', data);
            throw new Error('Invalid response from HeyGen API - no video_id returned');
        }

        return {
            success: true,
            videoId: data.data.video_id,
            message: 'Video generation started'
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
 * Check the status of a HeyGen video generation
 * @param {string} videoId - The HeyGen video ID
 * @returns {Promise<Object>} - Video status and URL if ready
 */
export async function checkHeyGenVideoStatus(videoId) {
    try {
        const response = await fetch(`${HEYGEN_API_BASE}/video_status.get?video_id=${videoId}`, {
            method: 'GET',
            headers: {
                'X-Api-Key': HEYGEN_API_KEY
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`HeyGen API error: ${errorData.message || response.statusText}`);
        }

        const data = await response.json();
        
        // Status can be: pending, processing, completed, failed
        const status = data.data.status;
        
        return {
            success: true,
            status: status,
            videoUrl: status === 'completed' ? data.data.video_url : null,
            thumbnailUrl: status === 'completed' ? data.data.thumbnail_url : null,
            duration: data.data.duration || null,
            error: status === 'failed' ? data.data.error : null
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
 * @returns {Promise<Array>} - List of available avatars
 */
export async function listHeyGenAvatars() {
    try {
        console.log('Fetching HeyGen avatars...');
        console.log('API Key present:', !!HEYGEN_API_KEY);
        console.log('API Key first 10 chars:', HEYGEN_API_KEY ? HEYGEN_API_KEY.substring(0, 10) + '...' : 'MISSING');
        
        const response = await fetch(`${HEYGEN_API_BASE}/v1/avatar.list`, {
            method: 'GET',
            headers: {
                'X-Api-Key': HEYGEN_API_KEY
            }
        });

        const responseText = await response.text();
        console.log('Avatars response status:', response.status);
        console.log('Avatars response:', responseText);

        if (!response.ok) {
            throw new Error(`Failed to fetch avatars (${response.status}): ${responseText}`);
        }

        const data = JSON.parse(responseText);
        console.log('Avatars data structure:', Object.keys(data));
        
        return {
            success: true,
            avatars: data.data?.avatars || data.avatars || []
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
 * @returns {Promise<Array>} - List of available voices
 */
export async function listHeyGenVoices() {
    try {
        const response = await fetch(`${HEYGEN_API_BASE}/v1/voice.list`, {
            method: 'GET',
            headers: {
                'X-Api-Key': HEYGEN_API_KEY
            }
        });

        const responseText = await response.text();
        console.log('Voices response status:', response.status);
        console.log('Voices response:', responseText);

        if (!response.ok) {
            throw new Error(`Failed to fetch voices (${response.status}): ${responseText}`);
        }

        const data = JSON.parse(responseText);
        return {
            success: true,
            voices: data.data?.voices || data.voices || []
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