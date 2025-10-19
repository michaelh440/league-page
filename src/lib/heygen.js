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
        avatarId = 'Annelise-incasualsuit-20220818', // Default: Annelise avatar
        voiceId = 'en-US-JennyNeural', // Default voice
        backgroundColor = '#FFFFFF',
        title = 'Fantasy Football Weekly Summary'
    } = options;

    const payload = {
        video_inputs: [
            {
                character: {
                    type: 'avatar',
                    avatar_id: avatarId,
                    avatar_style: 'normal'
                },
                voice: {
                    type: 'text',
                    input_text: script,
                    voice_id: voiceId
                },
                background: {
                    type: 'color',
                    value: backgroundColor
                }
            }
        ],
        title: title,
        test: false,
        caption: false
    };

    console.log('Calling HeyGen API with payload:', JSON.stringify(payload, null, 2));

    try {
        const response = await fetch(`${HEYGEN_API_BASE}/v2/video/generate`, {
            method: 'POST',
            headers: {
                'X-Api-Key': HEYGEN_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const responseText = await response.text();
        console.log('HeyGen API response status:', response.status);
        console.log('HeyGen API response body:', responseText);

        if (!response.ok) {
            let errorMessage = `HeyGen API error (${response.status}): ${response.statusText}`;
            try {
                const errorData = JSON.parse(responseText);
                errorMessage = `HeyGen API error: ${errorData.message || errorData.error || responseText}`;
            } catch (e) {
                errorMessage = `HeyGen API error: ${responseText}`;
            }
            throw new Error(errorMessage);
        }

        const data = JSON.parse(responseText);
        
        if (!data.data || !data.data.video_id) {
            console.error('Invalid HeyGen response:', data);
            throw new Error('Invalid response from HeyGen API - no video_id returned');
        }

        console.log('HeyGen video created successfully:', data.data.video_id);

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
        const response = await fetch(`${HEYGEN_API_BASE}/avatars`, {
            method: 'GET',
            headers: {
                'X-Api-Key': HEYGEN_API_KEY
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch avatars: ${response.statusText}`);
        }

        const data = await response.json();
        return {
            success: true,
            avatars: data.data.avatars || []
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
        const response = await fetch(`${HEYGEN_API_BASE}/voices`, {
            method: 'GET',
            headers: {
                'X-Api-Key': HEYGEN_API_KEY
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch voices: ${response.statusText}`);
        }

        const data = await response.json();
        return {
            success: true,
            voices: data.data.voices || []
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