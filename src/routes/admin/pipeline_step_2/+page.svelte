<script>
	export let data;

	let selectedSeasonId = '';
	let preview = null; // { rows, current, warning, ... }
	let loadingPreview = false;
	let pushing = false;
	let message = null; // { type, text }

	$: selectedSeason = selectedSeasonId
		? data.seasons.find((s) => s.season_id === parseInt(selectedSeasonId))
		: null;

	// Auto-preview whenever a season is picked
	$: if (selectedSeason) loadPreview();

	function setMessage(type, text) {
		message = { type, text };
	}

	async function loadPreview() {
		if (!selectedSeason) return;
		loadingPreview = true;
		preview = null;
		try {
			const res = await fetch(`/api/populate_historical_rankings?season=${selectedSeason.season_year}`);
			const r = await res.json();
			if (!r.success) throw new Error(r.error || 'Failed to build preview');
			preview = r;
			if (r.warning) setMessage('warning', r.warning);
		} catch (err) {
			setMessage('error', `Preview failed: ${err.message}`);
		}
		loadingPreview = false;
	}

	async function pushRankings() {
		if (pushing || !selectedSeason || !preview) return;
		pushing = true;
		message = null;
		try {
			const res = await fetch('/api/populate_historical_rankings', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ season: parseInt(selectedSeason.season_year) })
			});
			const r = await res.json();
			if (!r.success) throw new Error(r.error || 'Failed to populate historical rankings');
			setMessage('success', `historical_rankings written for ${r.seasonYear} — ${r.managers} managers.`);
			await loadPreview(); // refresh "currently stored"
		} catch (err) {
			setMessage('error', `Push failed: ${err.message}`);
		}
		pushing = false;
	}

	const statusTag = (s) => (s === 'championship' ? 'green' : s === 'consolation' ? 'amber' : 'grey');

	// --- Career streaks (league-wide, not season-scoped) ---
	let streaks = null; // { preview, current, lastUpdated }
	let loadingStreaks = false;
	let rebuildingStreaks = false;

	$: streakDelta = streaks ? streaks.preview.length - streaks.current.length : 0;

	async function loadStreaksPreview() {
		loadingStreaks = true;
		streaks = null;
		try {
			const res = await fetch('/api/rebuild_streaks');
			const r = await res.json();
			if (!r.success) throw new Error(r.error || 'Failed to preview streak rebuild');
			streaks = r;
		} catch (err) {
			setMessage('error', `Streak preview failed: ${err.message}`);
		}
		loadingStreaks = false;
	}

	async function rebuildStreaks() {
		if (rebuildingStreaks) return;
		rebuildingStreaks = true;
		message = null;
		try {
			const res = await fetch('/api/rebuild_streaks', { method: 'POST' });
			const r = await res.json();
			if (!r.success) throw new Error(r.error || 'Failed to rebuild streaks');
			setMessage('success', `Career streaks rebuilt — ${r.managers} managers.`);
			await loadStreaksPreview();
		} catch (err) {
			setMessage('error', `Rebuild failed: ${err.message}`);
		}
		rebuildingStreaks = false;
	}
</script>

<svelte:head><title>Admin - Pipeline Step 2</title></svelte:head>

<div class="container">
	<div class="page-nav">
		<a href="/admin" class="back-link">← Back to Dashboard</a>
		<a href="/admin/data_pipeline" class="back-link">← Pipeline step 1</a>
	</div>

	<div class="header">
		<h1>🏁 Pipeline Step 2 — Finalize Season</h1>
		<p class="subtitle">Review the final rankings, then write them to <code>historical_rankings</code>.</p>
	</div>

	{#if data.error}<div class="alert alert-error">❌ {data.error}</div>{/if}
	{#if message}<div class="alert alert-{message.type}">{message.text}</div>{/if}

	<div class="section">
		<div class="form-row">
			<div class="form-group">
				<label for="season-select">Season</label>
				<select id="season-select" bind:value={selectedSeasonId}>
					<option value="">-- Select a Sleeper season --</option>
					{#each data.seasons as season}
						<option value={season.season_id}>
							{season.league_name} — {season.season_year}{season.is_active ? ' (active)' : ''}
						</option>
					{/each}
				</select>
			</div>
			{#if selectedSeason}
				<button class="btn btn-ghost" on:click={loadPreview} disabled={loadingPreview}>
					{loadingPreview ? '⏳…' : '↻ Refresh preview'}
				</button>
			{/if}
		</div>

		{#if !selectedSeason}
			<p class="hint">Select a season to preview its final rankings.</p>
		{:else if loadingPreview}
			<p class="hint">Building preview…</p>
		{:else if preview}
			<p class="muted">
				Regular-season rank read from <code>team_rankings</code> (week {preview.regularSeasonWeek}) ·
				{preview.placementGames} playoff placement game{preview.placementGames === 1 ? '' : 's'} found.
			</p>

			<!-- Preview -->
			<h2>Preview <span class="tag tag-amber">to be written</span></h2>
			<table class="data-table">
				<thead>
					<tr><th>Final Rank</th><th>Manager</th><th>Reg. Rank</th><th>Status</th><th>W-L-T</th><th>Points For</th></tr>
				</thead>
				<tbody>
					{#each preview.rows as r}
						<tr>
							<td class="rank">{r.final_rank}</td>
							<td>{r.manager_name}</td>
							<td>{r.regular_season_rank}</td>
							<td><span class="tag tag-{statusTag(r.playoff_status)}">{r.playoff_status}</span></td>
							<td>{r.wins}-{r.losses}-{r.ties}</td>
							<td>{r.points_for}</td>
						</tr>
					{/each}
				</tbody>
			</table>

			<div class="push-bar">
				<button class="btn btn-push" on:click={pushRankings} disabled={pushing}>
					{pushing ? '⏳ Writing…' : `⬆ Push ${preview.rows.length} rankings to historical_rankings`}
				</button>
				<span class="hint">Replaces any existing rows for {preview.seasonYear}.</span>
			</div>

			<!-- Currently stored -->
			<h2>Currently stored <span class="tag tag-green">historical_rankings</span></h2>
			{#if preview.current.length}
				<table class="data-table">
					<thead><tr><th>Final Rank</th><th>Manager</th><th>Reg. Rank</th><th>Status</th></tr></thead>
					<tbody>
						{#each preview.current as r}
							<tr>
								<td class="rank">{r.final_rank}</td>
								<td>{r.manager_name}</td>
								<td>{r.regular_season_rank}</td>
								<td><span class="tag tag-{statusTag(r.playoff_status)}">{r.playoff_status}</span></td>
							</tr>
						{/each}
					</tbody>
				</table>
			{:else}
				<p class="hint">Nothing stored for {preview.seasonYear} yet — this season hasn't been finalized.</p>
			{/if}
		{/if}
	</div>

	<!-- Career streaks -->
	<div class="section">
		<h2 class="section-lead">Career Streaks <span class="tag tag-blue">league-wide</span></h2>
		<p class="muted"><code>manager_career_streaks</code> is a precomputed table (used by the Streaks page).
			Rebuild it from full game history after loading a season. The preview runs the rebuild inside a
			transaction and rolls it back, so nothing changes until you push.
			{#if streaks?.lastUpdated}<br />Last rebuilt: <strong>{streaks.lastUpdated}</strong>{/if}</p>

		<div class="row-actions">
			<button class="btn btn-ghost" on:click={loadStreaksPreview} disabled={loadingStreaks}>
				{loadingStreaks ? '⏳ Building preview…' : '🔍 Preview streak rebuild'}
			</button>
		</div>

		{#if streaks}
			{#if streakDelta !== 0}
				<div class="alert alert-warning" style="margin-top:1rem;">
					⚠️ A rebuild would change the number of managers from
					<strong>{streaks.current.length}</strong> to <strong>{streaks.preview.length}</strong>
					({streakDelta > 0 ? '+' : ''}{streakDelta}). Review the tables below before pushing.
				</div>
			{/if}

			<h2>Preview <span class="tag tag-amber">to be written</span> ({streaks.preview.length} managers)</h2>
			{#if streaks.preview.length}
				<table class="data-table">
					<thead>
						<tr><th>Manager</th><th>W-L-T</th><th>Longest Win</th><th>Longest Loss</th><th>Current</th></tr>
					</thead>
					<tbody>
						{#each streaks.preview as r}
							<tr>
								<td>{r.manager_name}</td>
								<td>{r.career_total_wins}-{r.career_total_losses}-{r.career_total_ties}</td>
								<td>{r.all_time_longest_win_streak}</td>
								<td>{r.all_time_longest_lose_streak}</td>
								<td>{r.all_time_current_streak_type ?? '—'} {r.all_time_current_streak_length ?? ''}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{:else}
				<p class="hint">The rebuild would produce no rows.</p>
			{/if}

			<div class="push-bar">
				<button class="btn btn-push" on:click={rebuildStreaks} disabled={rebuildingStreaks}>
					{rebuildingStreaks ? '⏳ Rebuilding…' : '⬆ Rebuild career streaks'}
				</button>
				<span class="hint">Replaces every row in <code>manager_career_streaks</code>.</span>
			</div>

			<h2>Currently stored <span class="tag tag-green">manager_career_streaks</span> ({streaks.current.length} managers)</h2>
			{#if streaks.current.length}
				<table class="data-table">
					<thead>
						<tr><th>Manager</th><th>W-L-T</th><th>Longest Win</th><th>Longest Loss</th><th>Current</th></tr>
					</thead>
					<tbody>
						{#each streaks.current as r}
							<tr>
								<td>{r.manager_name}</td>
								<td>{r.career_total_wins}-{r.career_total_losses}-{r.career_total_ties}</td>
								<td>{r.all_time_longest_win_streak}</td>
								<td>{r.all_time_longest_lose_streak}</td>
								<td>{r.all_time_current_streak_type ?? '—'} {r.all_time_current_streak_length ?? ''}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{:else}
				<p class="hint">Nothing stored yet.</p>
			{/if}
		{/if}
	</div>
</div>

<style>
	.container { max-width: 1200px; margin: 0 auto; }
	.page-nav { display: flex; gap: 1.25rem; margin-bottom: 1rem; }
	.back-link { color: #3b82f6; text-decoration: none; font-weight: 500; font-size: 0.95rem; }
	.back-link:hover { text-decoration: underline; }
	.header h1 { color: #00316b; margin: 0 0 0.25rem 0; font-size: 1.4rem; }
	.subtitle { color: #666; margin: 0 0 1.5rem 0; font-size: 0.9rem; }
	.section { background: #fff; border: 1px solid #e0e0e0; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
	.section h2 { color: #00316b; margin: 1.5rem 0 0.5rem; font-size: 1.1rem; }
	.section h2.section-lead { margin-top: 0; }
	.tag-blue { background: #d1ecf1; color: #0c5460; }
	.muted { color: #666; font-size: 0.9rem; }
	.hint { color: #666; font-size: 0.9rem; }
	.alert { padding: 0.85rem 1rem; border-radius: 8px; margin-bottom: 1.25rem; }
	.alert-success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
	.alert-error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
	.alert-warning { background: #fff3cd; border: 1px solid #ffeeba; color: #856404; }
	.form-row { display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap; }
	.form-group label { display: block; font-weight: 600; margin-bottom: 0.35rem; color: #333; }
	.form-group select { padding: 0.6rem; border: 2px solid #ddd; border-radius: 6px; font-size: 1rem; min-width: 260px; }
	.btn { padding: 0.6rem 1rem; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.95rem; }
	.btn:disabled { background: #ccc; cursor: not-allowed; }
	.btn-push { background: #28a745; color: #fff; }
	.btn-ghost { background: #eef1f6; color: #00316b; }
	.push-bar { display: flex; align-items: center; gap: 0.75rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #eee; }
	code { font-family: monospace; background: #f0f0f0; padding: 0.1rem 0.35rem; border-radius: 3px; color: #00316b; }
	.data-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
	.data-table th, .data-table td { text-align: left; padding: 0.45rem 0.6rem; border-bottom: 1px solid #eee; }
	.data-table th { color: #00316b; }
	.rank { font-weight: 700; color: #00316b; }
	.tag { font-size: 0.72rem; padding: 0.15rem 0.5rem; border-radius: 10px; }
	.tag-green { background: #d4edda; color: #155724; }
	.tag-amber { background: #fff3cd; color: #856404; }
	.tag-grey { background: #eee; color: #666; }
</style>
