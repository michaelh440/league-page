// src/routes/api/heygen_avatars/+server.js
import { json } from '@sveltejs/kit';
import { listHeyGenAvatars } from '$lib/heygen';

export async function GET() {
    const result = await listHeyGenAvatars();
    return json(result);
}