import { json } from '@sveltejs/kit';
import { neon } from '@neondatabase/serverless';
import { DATABASE_URL } from '$env/static/private';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const sql = neon(DATABASE_URL);

// Handle GET requests (returns error message)
export async function GET() {
	return json({ 
		error: 'GET method not allowed. Use POST to login.',
		endpoint: '/api/admin/auth/login',
		method: 'POST'
	}, { status: 405 });
}

// Handle POST requests (actual login)
export async function POST({ request, cookies }) {
	console.log('\n' + '='.repeat(80));
	console.log('LOGIN ATTEMPT STARTED');
	console.log('='.repeat(80));
	
	try {
		const body = await request.json();
		const { username, password } = body;

		console.log('1. Request received');
		console.log('   Username:', username);
		console.log('   Password length:', password?.length);
		console.log('   Body keys:', Object.keys(body));

		// Validate input
		if (!username || !password) {
			console.log('❌ FAIL: Missing username or password');
			return json({ error: 'Username and password are required' }, { status: 400 });
		}

		console.log('\n2. Querying database...');
		console.log('   Looking for username:', username);
		
		// Find user by username
		const users = await sql`
			SELECT 
				user_id,
				username,
				password_hash,
				email,
				role,
				is_admin,
				can_edit_profile,
				can_view_stats,
				can_manage_seasons,
				can_manage_managers,
				is_active
			FROM users
			WHERE username = ${username}
			LIMIT 1
		`;

		console.log('   Query returned:', users.length, 'users');

		if (users.length === 0) {
			console.log('❌ FAIL: No user found with username:', username);
			console.log('\n' + '='.repeat(80));
			return json({ error: 'Invalid credentials' }, { status: 401 });
		}

		const user = users[0];
		console.log('✅ User found!');
		console.log('   user_id:', user.user_id);
		console.log('   username:', user.username);
		console.log('   email:', user.email);
		console.log('   role:', user.role);
		console.log('   is_admin:', user.is_admin);
		console.log('   is_active:', user.is_active);
		console.log('   password_hash:', user.password_hash?.substring(0, 30) + '...');

		// Check if user is active
		if (!user.is_active) {
			console.log('❌ FAIL: User is inactive');
			console.log('\n' + '='.repeat(80));
			return json({ error: 'Account is inactive. Contact administrator.' }, { status: 403 });
		}

		console.log('\n3. Verifying password...');
		console.log('   Password provided:', password);
		console.log('   Hash from DB:', user.password_hash);
		console.log('   Hash length:', user.password_hash?.length);
		console.log('   Hash starts with:', user.password_hash?.substring(0, 7));
		
		// Verify password
		const passwordMatch = await bcrypt.compare(password, user.password_hash);
		
		console.log('   bcrypt.compare result:', passwordMatch);

		if (!passwordMatch) {
			console.log('❌ FAIL: Password does not match');
			console.log('   Expected password to match hash but it did not');
			console.log('\n' + '='.repeat(80));
			
			// Try to help debug - generate what the hash SHOULD be
			const testHash = await bcrypt.hash(password, 10);
			console.log('   Test: Generated hash for provided password:', testHash);
			console.log('   Does test hash match stored hash?', testHash === user.password_hash);
			
			return json({ error: 'Invalid credentials' }, { status: 401 });
		}

		console.log('✅ Password verified!');

		// Check if user has admin access
		console.log('\n4. Checking admin access...');
		console.log('   is_admin value:', user.is_admin);
		console.log('   is_admin type:', typeof user.is_admin);
		
		if (!user.is_admin) {
			console.log('❌ FAIL: User does not have admin access');
			console.log('\n' + '='.repeat(80));
			return json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
		}

		console.log('✅ User has admin access');

		// Generate session
		console.log('\n5. Creating session...');
		const sessionId = crypto.randomBytes(32).toString('hex');
		const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

		console.log('   Session ID:', sessionId);
		console.log('   Expires at:', expiresAt.toISOString());

		const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
		const userAgent = request.headers.get('user-agent') || 'unknown';

		await sql`
			INSERT INTO sessions (
				session_id,
				user_id,
				expires_at,
				ip_address,
				user_agent
			) VALUES (
				${sessionId},
				${user.user_id},
				${expiresAt.toISOString()},
				${ipAddress},
				${userAgent}
			)
		`;

		console.log('✅ Session created in database');

		// Set cookie
		console.log('\n6. Setting session cookie...');
		cookies.set('session', sessionId, {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7
		});

		console.log('✅ Cookie set');
		console.log('\n' + '='.repeat(80));
		console.log('LOGIN SUCCESS!');
		console.log('='.repeat(80) + '\n');

		return json({
			success: true,
			user: {
				user_id: user.user_id,
				username: user.username,
				email: user.email,
				role: user.role,
				is_admin: user.is_admin,
				can_edit_profile: user.can_edit_profile,
				can_view_stats: user.can_view_stats,
				can_manage_seasons: user.can_manage_seasons,
				can_manage_managers: user.can_manage_managers
			}
		});
	} catch (error) {
		console.error('\n' + '='.repeat(80));
		console.error('CRITICAL ERROR DURING LOGIN');
		console.error('='.repeat(80));
		console.error('Error name:', error.name);
		console.error('Error message:', error.message);
		console.error('Error stack:', error.stack);
		console.error('='.repeat(80) + '\n');
		
		return json({ 
			error: 'Server error during login',
			details: error.message 
		}, { status: 500 });
	}
}