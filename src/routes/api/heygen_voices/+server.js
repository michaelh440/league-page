// src/routes/api/heygen_voices/+server.js
import { json } from '@sveltejs/kit';
import { listHeyGenVoices } from '$lib/heygen';

export async function GET() {
    try {
        const result = await listHeyGenVoices();
        
        if (!result.success) {
            return json({ 
                success: false, 
                error: result.error,
                voices: [] 
            }, { status: 500 });
        }
        
        return json({
            success: true,
            voices: result.voices || []
        });
    } catch (error) {
        console.error('Error in heygen_voices endpoint:', error);
        return json({ 
            success: false, 
            error: error.message,
            voices: [] 
        }, { status: 500 });
    }
}