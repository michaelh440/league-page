// src/lib/sleeper_players_cache.js
// This caches Sleeper player data to avoid repeated API calls

let playersCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function getSleeperPlayerInfo(playerId) {
	// Load all players if not cached or cache expired
	if (!playersCache || !cacheTimestamp || Date.now() - cacheTimestamp > CACHE_DURATION) {
		await refreshPlayersCache();
	}
	
	return playersCache?.[playerId] || null;
}

export async function refreshPlayersCache() {
	try {
		const response = await fetch('https://api.sleeper.app/v1/players/nfl');
		const players = await response.json();
		
		playersCache = players;
		cacheTimestamp = Date.now();
		
		console.log('Sleeper players cache refreshed:', Object.keys(players).length, 'players');
		return players;
	} catch (error) {
		console.error('Error refreshing Sleeper players cache:', error);
		return null;
	}
}

// Get multiple players at once
export async function getSleeperPlayers(playerIds) {
	if (!playersCache || !cacheTimestamp || Date.now() - cacheTimestamp > CACHE_DURATION) {
		await refreshPlayersCache();
	}
	
	const result = {};
	for (const playerId of playerIds) {
		if (playersCache?.[playerId]) {
			result[playerId] = {
				player_name: `${playersCache[playerId].first_name} ${playersCache[playerId].last_name}`.trim(),
				position: playersCache[playerId].position || 'FLEX',
				team: playersCache[playerId].team || null
			};
		}
	}
	
	return result;
}