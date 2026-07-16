<script>
	export let data;

	let selectedSeasonId = '';
	let populatingRankings = false;
	let rankingsResult = null;
	let message = null; // { type, text }

	$: selectedSeason = selectedSeasonId
		? data.seasons.find((s) => s.season_id === parseInt(selectedSeasonId))
		: null;

	function setMessage(type, text) {
		message = { type, text };
	}

	async function populateRankings() {
		if (populatingRankings || !selectedSeason) return;
		populatingRankings = true;
		message = null;
		rankingsResult = null;
		try {
			const res = await fetch('/api/populate_historical_rankings', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ season: parseInt(selectedSeason.season_year) })
			});
			const r = await res.json();
			if (!r.success) throw new Error(r.error || 'Failed to populate historical rankings');
			rankingsResult = r;
			setMessage(
				r.warning ? 'warning' : 'success',
				r.warning || `historical_rankings written for ${r.seasonYear} — ${r.managers} managers.`
			);
		} catch (err) {
			setMessage('error', `Populate failed: ${err.message}`);
		}
		populatingRankings = false;
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
		<p class="subtitle">Write the final end-of-season record once step 1 has loaded the regular season and playoffs.</p>
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
		</div>

		{#if selectedSeason}
			<h2>Historical Rankings</h2>
			<p class="muted">Writes the final <code>historical_rankings</code> record for
				{selectedSeason.season_year}: regular-season rank from <code>team_rankings</code> (last regular
				week), and final rank + status from the playoff bracket — Championship 1st/2nd, 3rd Place
				3rd/4th, Consolation 5th–8th; teams with no playoff game rank after that by regular-season
				rank. Safe to re-run — it replaces the season's rows.</p>

			<div class="row-actions">
				<button class="btn btn-push" on:click={populateRankings} disabled={populatingRankings}>
					{populatingRankings ? '⏳ Writing…' : `🏁 Populate historical_rankings for ${selectedSeason.season_year}`}
				</button>
			</div>

			{#if rankingsResult}
				<table class="data-table">
					<thead><tr><th>Season</th><th>Managers</th><th>Reg-season week used</th><th>Placement games</th></tr></thead>
					<tbody>
						<tr>
							<td>{rankingsResult.seasonYear}</td>
							<td>{rankingsResult.managers}</td>
							<td>W{rankingsResult.regularSeasonWeek}</td>
							<td>{rankingsResult.placementGames}</td>
						</tr>
					</tbody>
				</table>
			{/if}
		{:else}
			<p class="hint">Select a season to finalize.</p>
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
	.section { background: #fff; border: 1px solid #e0e0e0; border-radius: 12px; padding: 1.5rem; }
	.section h2 { color: #00316b; margin-top: 1rem; font-size: 1.1rem; }
	.muted { color: #666; font-size: 0.9rem; }
	.hint { color: #666; font-size: 0.9rem; }
	.alert { padding: 0.85rem 1rem; border-radius: 8px; margin-bottom: 1.25rem; }
	.alert-success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
	.alert-error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
	.alert-warning { background: #fff3cd; border: 1px solid #ffeeba; color: #856404; }
	.form-row { display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap; }
	.form-group label { display: block; font-weight: 600; margin-bottom: 0.35rem; color: #333; }
	.form-group select { padding: 0.6rem; border: 2px solid #ddd; border-radius: 6px; font-size: 1rem; min-width: 260px; }
	.row-actions { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; margin-top: 0.5rem; }
	.btn { padding: 0.6rem 1rem; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.95rem; }
	.btn:disabled { background: #ccc; cursor: not-allowed; }
	.btn-push { background: #28a745; color: #fff; }
	code { font-family: monospace; background: #f0f0f0; padding: 0.1rem 0.35rem; border-radius: 3px; color: #00316b; }
	.data-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; margin-top: 1rem; }
	.data-table th, .data-table td { text-align: left; padding: 0.45rem 0.6rem; border-bottom: 1px solid #eee; }
	.data-table th { color: #00316b; }
</style>
