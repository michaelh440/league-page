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
        avatarId = 'Daisy-inskirt-20220818',
        voiceId = '2d5b0e6cf36f460aa7fc47e3eee4ba54',
        backgroundColor = '#008000',
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
        dimension: {
            width: 1280,
            height: 720
        },
        test: false,
        caption: false
    };

    console.log('=== HeyGen Video Generation ===');
    console.log('API Base:', HEYGEN_API_BASE);
    console.log('Endpoint: /v2/video/generate');
    console.log('API Key present:', !!HEYGEN_API_KEY);
    console.log('Payload:', JSON.stringify(payload, null, 2));

    try {
        const response = await fetch(`${HEYGEN_API_BASE}/v2/video/generate`, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json',
                'x-api-key': HEYGEN_API_KEY
            },
            body: JSON.stringify(payload)
        });

        const responseText = await response.text();
        console.log('Response status:', response.status);
        console.log('Response body:', responseText);

        if (!response.ok) {
            let errorMessage;
            try {
                const errorData = JSON.parse(responseText);
                errorMessage = `HeyGen API error (${response.status}): ${JSON.stringify(errorData)}`;
            } catch (e) {
                errorMessage = `HeyGen API error (${response.status}): ${responseText}`;
            }
            throw new Error(errorMessage);
        }

        const data = JSON.parse(responseText);
        
        if (!data.data || !data.data.video_id) {
            console.error('Invalid response structure:', data);
            throw new Error('No video_id in response');
        }

        console.log('✅ Video generation started:', data.data.video_id);
        return {
            success: true,
            videoId: data.data.video_id,
            message: 'Video generation started'
        };
    } catch (error) {
        console.error('❌ Error creating HeyGen video:', error);
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
    console.log('Checking video status for:', videoId);
    
    try {
        const response = await fetch(`${HEYGEN_API_BASE}/v2/video_status.get?video_id=${videoId}`, {
            method: 'GET',
            headers: {
                'x-api-key': HEYGEN_API_KEY
            }
        });

        const responseText = await response.text();
        console.log('Status check response:', response.status, responseText);

        if (!response.ok) {
            throw new Error(`Status check failed (${response.status}): ${responseText}`);
        }

        const data = JSON.parse(responseText);
        const status = data.data?.status;
        
        console.log('Video status:', status);
        
        return {
            success: true,
            status: status,
            videoUrl: status === 'completed' ? data.data?.video_url : null,
            thumbnailUrl: status === 'completed' ? data.data?.thumbnail_url : null,
            duration: data.data?.duration || null,
            error: status === 'failed' ? data.data?.error : null
        };
    } catch (error) {
        console.error('Error checking video status:', error);
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
    console.log('Fetching avatars from HeyGen v2 API...');
    
    try {
        const response = await fetch(`${HEYGEN_API_BASE}/v2/avatars`, {
            method: 'GET',
            headers: {
                'x-api-key': HEYGEN_API_KEY
            }
        });

        const responseText = await response.text();
        console.log('Avatars response:', response.status, responseText);

        if (!response.ok) {
            throw new Error(`Failed to fetch avatars (${response.status}): ${responseText}`);
        }

        const data = JSON.parse(responseText);
        
        return {
            success: true,
            avatars: data.data?.avatars || []
        };
    } catch (error) {
        console.error('Error listing avatars:', error);
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
    console.log('Fetching voices from HeyGen v2 API...');
    
    try {
        const response = await fetch(`${HEYGEN_API_BASE}/v2/voices`, {
            method: 'GET',
            headers: {
                'x-api-key': HEYGEN_API_KEY
            }
        });

        const responseText = await response.text();
        console.log('Voices response:', response.status, responseText);

        if (!response.ok) {
            throw new Error(`Failed to fetch voices (${response.status}): ${responseText}`);
        }

        const data = JSON.parse(responseText);
        return {
            success: true,
            voices: data.data?.voices || []
        };
    } catch (error) {
        console.error('Error listing voices:', error);
        return {
            success: false,
            error: error.message,
            voices: []
        };
    }
}