// src/routes/api/heygen_avatars/+server.js
import { json } from '@sveltejs/kit';
import { listHeyGenAvatars } from '$lib/heygen';

export async function GET() {
    try {
        const result = await listHeyGenAvatars();
        
        if (!result.success) {
            console.error('Failed to fetch avatars:', result.error);
            return json({ 
                success: false, 
                error: result.error,
                avatars: [] 
            }, { status: 500 });
        }
        
        return json({
            success: true,
            avatars: result.avatars || []
        });
    } catch (error) {
        console.error('Error in heygen_avatars endpoint:', error);
        return json({ 
            success: false, 
            error: error.message,
            avatars: [] 
        }, { status: 500 });
    }
}