<script>
	export let data;
	const { draftData, performanceData, leagueTeamManagersData, playersData } = data;

	// Process draft picks with performance data
	$: enrichedPicks = draftData?.draft_picks?.map(pick => {
		const manager = leagueTeamManagersData.find(m => m.manager_id === pick.manager_id);
		const player = playersData.find(p => p.player_id === pick.player_id);
		const performance = performanceData?.[pick.player_id] || { total_points: 0, games_played: 0 };
		
		return {
			...pick,
			manager,
			player,
			performance
		};
	}) || [];

	// Get top scorer from a specific round
	function getTopScorerFromRound(picks, roundNumber) {
		const roundPicks = picks.filter(p => p.round_number === roundNumber);
		if (roundPicks.length === 0) return null;
		
		return roundPicks.reduce((top, current) => {
			const currentPoints = current.performance?.total_points || 0;
			const topPoints = top.performance?.total_points || 0;
			return currentPoints > topPoints ? current : top;
		});
	}

	// Get top scorer from rounds 1-3
	function getTopScorerFromRounds(picks, startRound, endRound) {
		const roundPicks = picks.filter(p => 
			p.round_number >= startRound && p.round_number <= endRound
		);
		if (roundPicks.length === 0) return null;
		
		return roundPicks.reduce((top, current) => {
			const currentPoints = current.performance?.total_points || 0;
			const topPoints = top.performance?.total_points || 0;
			return currentPoints > topPoints ? current : top;
		});
	}

	// Get all picks from a round with their rankings
	function getRoundRankings(picks, roundNumber) {
		const roundPicks = picks.filter(p => p.round_number === roundNumber);
		return roundPicks
			.sort((a, b) => (b.performance?.total_points || 0) - (a.performance?.total_points || 0))
			.map((pick, index) => ({
				...pick,
				rank: index + 1
			}));
	}

	// Calculate statistics
	$: round1TopScorer = getTopScorerFromRound(enrichedPicks, 1);
	$: round2TopScorer = getTopScorerFromRound(enrichedPicks, 2);
	$: round3TopScorer = getTopScorerFromRound(enrichedPicks, 3);
	$: rounds13TopScorer = getTopScorerFromRounds(enrichedPicks, 1, 3);

	$: round1Rankings = getRoundRankings(enrichedPicks, 1);
	$: round2Rankings = getRoundRankings(enrichedPicks, 2);
	$: round3Rankings = getRoundRankings(enrichedPicks, 3);
	$: rounds13Rankings = enrichedPicks
		.filter(p => p.round_number >= 1 && p.round_number <= 3)
		.sort((a, b) => (b.performance?.total_points || 0) - (a.performance?.total_points || 0))
		.map((pick, index) => ({
			...pick,
			rank: index + 1
		}));

	// Helper function to get position color
	function getPositionColor(position) {
		const colors = {
			'QB': { bg: '#dc2626', text: '#ffffff' },
			'RB': { bg: '#16a34a', text: '#ffffff' },
			'WR': { bg: '#2563eb', text: '#ffffff' },
			'TE': { bg: '#ea580c', text: '#ffffff' },
			'K': { bg: '#fbbf24', text: '#000000' },
			'DEF': { bg: '#7c2d12', text: '#ffffff' }
		};
		return colors[position] || { bg: '#6b7280', text: '#ffffff' };
	}

	// Format points
	function formatPoints(points) {
		return points?.toFixed(1) || '0.0';
	}
</script>

<svelte:head>
	<title>Draft Performance Tracking - Current Season</title>
</svelte:head>

<style>
	.container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 2rem;
	}

	.header {
		margin-bottom: 2rem;
	}

	h1 {
		font-size: 2rem;
		font-weight: bold;
		margin-bottom: 0.5rem;
		color: #1f2937;
	}

	.draft-info {
		color: #6b7280;
		font-size: 0.9rem;
	}

	.charts-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
		gap: 2rem;
		margin-bottom: 3rem;
	}

	.chart-card {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
	}

	.chart-title {
		font-size: 1.25rem;
		font-weight: bold;
		color: #1f2937;
		margin-bottom: 1rem;
		padding-bottom: 0.5rem;
		border-bottom: 2px solid #e5e7eb;
	}

	.winner-highlight {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.5rem;
		background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
		border: 2px solid #fbbf24;
		border-radius: 8px;
		margin-bottom: 1.5rem;
	}

	.winner-trophy {
		font-size: 3rem;
	}

	.winner-details {
		flex: 1;
	}

	.winner-player {
		font-size: 1.25rem;
		font-weight: bold;
		color: #1f2937;
		margin-bottom: 0.25rem;
	}

	.winner-meta {
		display: flex;
		gap: 1rem;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.position-badge {
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: bold;
	}

	.winner-manager {
		color: #6b7280;
		font-size: 0.9rem;
	}

	.winner-stats {
		display: flex;
		gap: 2rem;
		margin-top: 0.5rem;
	}

	.stat-item {
		display: flex;
		flex-direction: column;
	}

	.stat-label {
		font-size: 0.75rem;
		color: #6b7280;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: bold;
		color: #1f2937;
	}

	.rankings-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.ranking-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem;
		background: #f9fafb;
		border-radius: 6px;
		transition: all 0.2s;
	}

	.ranking-item:hover {
		background: #f3f4f6;
		transform: translateX(4px);
	}

	.ranking-item.top-3 {
		background: linear-gradient(135deg, #fef3c7 0%, #fde68a 50%);
		border: 1px solid #fbbf24;
	}

	.rank-badge {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		font-weight: bold;
		font-size: 0.9rem;
		flex-shrink: 0;
	}

	.rank-1 { background: #ffd700; color: #000; }
	.rank-2 { background: #c0c0c0; color: #000; }
	.rank-3 { background: #cd7f32; color: #fff; }
	.rank-other { background: #e5e7eb; color: #6b7280; }

	.player-info {
		flex: 1;
		min-width: 0;
	}

	.player-name {
		font-weight: 600;
		color: #1f2937;
		font-size: 0.95rem;
	}

	.player-meta {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		margin-top: 0.25rem;
		font-size: 0.8rem;
		color: #6b7280;
	}

	.points-display {
		font-weight: bold;
		color: #2563eb;
		font-size: 1.1rem;
		white-space: nowrap;
	}

	.no-data {
		text-align: center;
		padding: 3rem;
		color: #6b7280;
	}

	@media (max-width: 768px) {
		.container {
			padding: 1rem;
		}

		.charts-grid {
			grid-template-columns: 1fr;
		}

		.winner-highlight {
			flex-direction: column;
			text-align: center;
		}

		.winner-stats {
			justify-content: center;
		}
	}
</style>

<div class="container">
	<div class="header">
		<h1>Draft Performance Tracking</h1>
		{#if draftData}
			<div class="draft-info">
				{draftData.draft_name} - {new Date(draftData.draft_datetime).toLocaleDateString()}
			</div>
		{/if}
	</div>

	{#if !draftData || enrichedPicks.length === 0}
		<div class="no-data">
			<p>No draft data available for the current season.</p>
		</div>
	{:else}
		<div class="charts-grid">
			<!-- Round 1 Top Scorer -->
			<div class="chart-card">
				<h2 class="chart-title">Round 1 Top Scorer</h2>
				{#if round1TopScorer}
					<div class="winner-highlight">
						<div class="winner-trophy">🏆</div>
						<div class="winner-details">
							<div class="winner-player">{round1TopScorer.player?.player_name || 'Unknown'}</div>
							<div class="winner-meta">
								<span 
									class="position-badge"
									style="background-color: {getPositionColor(round1TopScorer.player?.position).bg}; color: {getPositionColor(round1TopScorer.player?.position).text};"
								>
									{round1TopScorer.player?.position || 'N/A'}
								</span>
								<span>{round1TopScorer.player?.nfl_team || 'N/A'}</span>
							</div>
							<div class="winner-manager">
								Drafted by {round1TopScorer.manager?.manager_name || 'Unknown'} (Pick #{round1TopScorer.pick_number})
							</div>
							<div class="winner-stats">
								<div class="stat-item">
									<span class="stat-label">Points</span>
									<span class="stat-value">{formatPoints(round1TopScorer.performance.total_points)}</span>
								</div>
								<div class="stat-item">
									<span class="stat-label">Games</span>
									<span class="stat-value">{round1TopScorer.performance.games_played || 0}</span>
								</div>
							</div>
						</div>
					</div>
					<div class="rankings-list">
						{#each round1Rankings.slice(0, 5) as pick}
							<div class="ranking-item" class:top-3={pick.rank <= 3}>
								<span class="rank-badge rank-{pick.rank <= 3 ? pick.rank : 'other'}">
									{pick.rank}
								</span>
								<div class="player-info">
									<div class="player-name">{pick.player?.player_name || 'Unknown'}</div>
									<div class="player-meta">
										<span>{pick.player?.position || 'N/A'}</span>
										<span>•</span>
										<span>{pick.manager?.manager_name || 'Unknown'}</span>
										<span>•</span>
										<span>Pick #{pick.pick_number}</span>
									</div>
								</div>
								<div class="points-display">{formatPoints(pick.performance.total_points)} pts</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="no-data">No Round 1 data available</div>
				{/if}
			</div>

			<!-- Round 2 Top Scorer -->
			<div class="chart-card">
				<h2 class="chart-title">Round 2 Top Scorer</h2>
				{#if round2TopScorer}
					<div class="winner-highlight">
						<div class="winner-trophy">🥈</div>
						<div class="winner-details">
							<div class="winner-player">{round2TopScorer.player?.player_name || 'Unknown'}</div>
							<div class="winner-meta">
								<span 
									class="position-badge"
									style="background-color: {getPositionColor(round2TopScorer.player?.position).bg}; color: {getPositionColor(round2TopScorer.player?.position).text};"
								>
									{round2TopScorer.player?.position || 'N/A'}
								</span>
								<span>{round2TopScorer.player?.nfl_team || 'N/A'}</span>
							</div>
							<div class="winner-manager">
								Drafted by {round2TopScorer.manager?.manager_name || 'Unknown'} (Pick #{round2TopScorer.pick_number})
							</div>
							<div class="winner-stats">
								<div class="stat-item">
									<span class="stat-label">Points</span>
									<span class="stat-value">{formatPoints(round2TopScorer.performance.total_points)}</span>
								</div>
								<div class="stat-item">
									<span class="stat-label">Games</span>
									<span class="stat-value">{round2TopScorer.performance.games_played || 0}</span>
								</div>
							</div>
						</div>
					</div>
					<div class="rankings-list">
						{#each round2Rankings.slice(0, 5) as pick}
							<div class="ranking-item" class:top-3={pick.rank <= 3}>
								<span class="rank-badge rank-{pick.rank <= 3 ? pick.rank : 'other'}">
									{pick.rank}
								</span>
								<div class="player-info">
									<div class="player-name">{pick.player?.player_name || 'Unknown'}</div>
									<div class="player-meta">
										<span>{pick.player?.position || 'N/A'}</span>
										<span>•</span>
										<span>{pick.manager?.manager_name || 'Unknown'}</span>
										<span>•</span>
										<span>Pick #{pick.pick_number}</span>
									</div>
								</div>
								<div class="points-display">{formatPoints(pick.performance.total_points)} pts</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="no-data">No Round 2 data available</div>
				{/if}
			</div>

			<!-- Round 3 Top Scorer -->
			<div class="chart-card">
				<h2 class="chart-title">Round 3 Top Scorer</h2>
				{#if round3TopScorer}
					<div class="winner-highlight">
						<div class="winner-trophy">🥉</div>
						<div class="winner-details">
							<div class="winner-player">{round3TopScorer.player?.player_name || 'Unknown'}</div>
							<div class="winner-meta">
								<span 
									class="position-badge"
									style="background-color: {getPositionColor(round3TopScorer.player?.position).bg}; color: {getPositionColor(round3TopScorer.player?.position).text};"
								>
									{round3TopScorer.player?.position || 'N/A'}
								</span>
								<span>{round3TopScorer.player?.nfl_team || 'N/A'}</span>
							</div>
							<div class="winner-manager">
								Drafted by {round3TopScorer.manager?.manager_name || 'Unknown'} (Pick #{round3TopScorer.pick_number})
							</div>
							<div class="winner-stats">
								<div class="stat-item">
									<span class="stat-label">Points</span>
									<span class="stat-value">{formatPoints(round3TopScorer.performance.total_points)}</span>
								</div>
								<div class="stat-item">
									<span class="stat-label">Games</span>
									<span class="stat-value">{round3TopScorer.performance.games_played || 0}</span>
								</div>
							</div>
						</div>
					</div>
					<div class="rankings-list">
						{#each round3Rankings.slice(0, 5) as pick}
							<div class="ranking-item" class:top-3={pick.rank <= 3}>
								<span class="rank-badge rank-{pick.rank <= 3 ? pick.rank : 'other'}">
									{pick.rank}
								</span>
								<div class="player-info">
									<div class="player-name">{pick.player?.player_name || 'Unknown'}</div>
									<div class="player-meta">
										<span>{pick.player?.position || 'N/A'}</span>
										<span>•</span>
										<span>{pick.manager?.manager_name || 'Unknown'}</span>
										<span>•</span>
										<span>Pick #{pick.pick_number}</span>
									</div>
								</div>
								<div class="points-display">{formatPoints(pick.performance.total_points)} pts</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="no-data">No Round 3 data available</div>
				{/if}
			</div>

			<!-- Rounds 1-3 Overall Top Scorer -->
			<div class="chart-card">
				<h2 class="chart-title">Rounds 1-3 Top Scorer</h2>
				{#if rounds13TopScorer}
					<div class="winner-highlight">
						<div class="winner-trophy">👑</div>
						<div class="winner-details">
							<div class="winner-player">{rounds13TopScorer.player?.player_name || 'Unknown'}</div>
							<div class="winner-meta">
								<span 
									class="position-badge"
									style="background-color: {getPositionColor(rounds13TopScorer.player?.position).bg}; color: {getPositionColor(rounds13TopScorer.player?.position).text};"
								>
									{rounds13TopScorer.player?.position || 'N/A'}
								</span>
								<span>{rounds13TopScorer.player?.nfl_team || 'N/A'}</span>
							</div>
							<div class="winner-manager">
								Drafted by {rounds13TopScorer.manager?.manager_name || 'Unknown'} in Round {rounds13TopScorer.round_number} (Pick #{rounds13TopScorer.pick_number})
							</div>
							<div class="winner-stats">
								<div class="stat-item">
									<span class="stat-label">Points</span>
									<span class="stat-value">{formatPoints(rounds13TopScorer.performance.total_points)}</span>
								</div>
								<div class="stat-item">
									<span class="stat-label">Games</span>
									<span class="stat-value">{rounds13TopScorer.performance.games_played || 0}</span>
								</div>
							</div>
						</div>
					</div>
					<div class="rankings-list">
						{#each rounds13Rankings.slice(0, 8) as pick}
							<div class="ranking-item" class:top-3={pick.rank <= 3}>
								<span class="rank-badge rank-{pick.rank <= 3 ? pick.rank : 'other'}">
									{pick.rank}
								</span>
								<div class="player-info">
									<div class="player-name">{pick.player?.player_name || 'Unknown'}</div>
									<div class="player-meta">
										<span>Round {pick.round_number}</span>
										<span>•</span>
										<span>{pick.player?.position || 'N/A'}</span>
										<span>•</span>
										<span>{pick.manager?.manager_name || 'Unknown'}</span>
									</div>
								</div>
								<div class="points-display">{formatPoints(pick.performance.total_points)} pts</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="no-data">No data available</div>
				{/if}
			</div>
		</div>
	{/if}
</div>