<script>
	export let data;

	// Regular-season weeks handled by this pipeline. Playoffs (15+) live on the
	// existing Weekly Summary / Bulk Archive pages, which target the playoff tables.
	const REG_WEEKS = Array.from({ length: 14 }, (_, i) => i + 1);

	let selectedSeasonId = '';
	let selectedWeek = 1;

	let status = null; // overview counts (/api/sleeper-status)
	let preview = null; // actual staged items (/api/staging_preview)
	let production = null; // actual real-table rows (/api/production_week)

	let loadingStatus = false;
	let loadingPreview = false;
	let loadingProduction = false;
	let fetching = false;
	let pushing = false;
	let message = null; // { type, text }
	let pushSteps = null;

	// Draft (season-level)
	let draft = null; // /api/draft_status
	let loadingDraft = false;
	let fetchingDraft = false;
	let pushingDraft = false;
	let draftPushSteps = null;

	// Playoffs
	let playoffWeek = null;
	let playoff = null; // /api/playoff_status
	let loadingPlayoff = false;
	let fetchingPlayoff = false;
	let pushingPlayoff = false;
	let playoffPushSteps = null;

	// Playoff weeks derived from the league's regular-season length (2 weeks by default)
	$: playoffWeeks = selectedSeason
		? [selectedSeason.reg_season_length + 1, selectedSeason.reg_season_length + 2]
		: [];
	$: if (playoffWeeks.length && (playoffWeek === null || !playoffWeeks.includes(playoffWeek))) {
		playoffWeek = playoffWeeks[0];
	}

	// Playoff overview grid — staging vs production per playoff week (from the status object)
	$: playoffWeekRows = playoffWeeks.map((w) => {
		const s = {
			matchups: status?.stagingByWeek?.playoffs?.[w] || 0,
			rosters: status?.stagingByWeek?.rosters?.[w] || 0,
			stats: status?.stagingByWeek?.stats?.[w] || 0
		};
		const p = {
			matchups: status?.playoffs?.[w] || 0,
			rosters: status?.playoffRosters?.[w] || 0,
			stats: status?.playoffStats?.[w] || 0
		};
		const st =
			s.matchups + s.rosters + s.stats > 0
				? 'staged'
				: p.matchups + p.rosters + p.stats > 0
					? 'processed'
					: 'empty';
		return { w, s, p, st };
	});

	$: selectedSeason = selectedSeasonId
		? data.seasons.find((s) => s.season_id === parseInt(selectedSeasonId))
		: null;

	$: if (selectedSeason) loadStatus();
	$: if (selectedSeason) loadDraftStatus();

	function setMessage(type, text) {
		message = { type, text };
	}

	// Fetch just the overview/status counts (no side effects on preview/production),
	// so it can be refreshed alongside the preview to keep "Staged now" in sync.
	async function fetchStatus() {
		if (!selectedSeason) return;
		try {
			const res = await fetch(
				`/api/sleeper-status?season_id=${selectedSeason.season_id}&season_year=${selectedSeason.season_year}`
			);
			if (res.ok) status = await res.json();
		} catch (err) {
			setMessage('error', `Failed to load status: ${err.message}`);
		}
	}

	async function loadStatus() {
		if (!selectedSeason) return;
		loadingStatus = true;
		preview = null;
		production = null;
		pushSteps = null;
		await fetchStatus();
		loadingStatus = false;
	}

	async function loadPreview() {
		if (!selectedSeason) return;
		loadingPreview = true;
		preview = null;
		try {
			const res = await fetch(
				`/api/staging_preview?season_id=${selectedSeason.season_id}&season_year=${selectedSeason.season_year}&week=${selectedWeek}`
			);
			const result = await res.json();
			if (result.success) preview = result;
			else setMessage('error', result.error || 'Failed to load staging items');
		} catch (err) {
			setMessage('error', `Preview failed: ${err.message}`);
		}
		// Keep the overview grid + "Staged now" counts in sync with what was just previewed
		await fetchStatus();
		loadingPreview = false;
	}

	async function loadProduction() {
		if (!selectedSeason) return;
		loadingProduction = true;
		production = null;
		try {
			const res = await fetch(
				`/api/production_week?season_id=${selectedSeason.season_id}&week=${selectedWeek}`
			);
			const result = await res.json();
			if (result.success) production = result;
			else setMessage('error', result.error || 'Failed to load production data');
		} catch (err) {
			setMessage('error', `Production load failed: ${err.message}`);
		}
		loadingProduction = false;
	}

	// Step 1: fetch from Sleeper into staging (no writes to production)
	async function fetchWeek() {
		if (fetching || !selectedSeason) return;
		fetching = true;
		message = null;
		pushSteps = null;
		production = null;
		try {
			const importRes = await fetch('/api/import_sleeper_week', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					season: parseInt(selectedSeason.season_year),
					week: parseInt(selectedWeek),
					processImmediately: false
				})
			});
			const importResult = await importRes.json();
			if (!importResult.success) throw new Error(importResult.error || 'Matchup staging failed');

			const archiveRes = await fetch(
				`/api/archive_rosters_stats?league_id=${selectedSeason.sleeper_league_id}` +
					`&season=${selectedSeason.season_year}&week=${selectedWeek}&stageOnly=true`
			);
			const archiveResult = await archiveRes.json();
			if (!archiveResult.success) throw new Error(archiveResult.error || 'Roster/stats staging failed');

			setMessage(
				'success',
				`Week ${selectedWeek} loaded to staging: ${archiveResult.staged.rosters} roster rows, ` +
					`${archiveResult.staged.stats} player stats. Review below, then push.`
			);
			await loadStatus();
			await loadPreview();
		} catch (err) {
			setMessage('error', `Fetch failed: ${err.message}`);
		}
		fetching = false;
	}

	// Step 3: push staged data into the real tables
	async function pushWeek() {
		if (pushing || !selectedSeason) return;
		pushing = true;
		message = null;
		try {
			const res = await fetch('/api/process_staging_week', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					season: parseInt(selectedSeason.season_year),
					week: parseInt(selectedWeek)
				})
			});
			const result = await res.json();
			if (!result.success) throw new Error(result.error || 'Push failed');
			pushSteps = result.steps;
			setMessage('success', `Week ${selectedWeek} pushed to production.`);
			await loadStatus();
			await loadPreview();
			await loadProduction();
		} catch (err) {
			setMessage('error', `Push failed: ${err.message}`);
		}
		pushing = false;
	}

	// --- Draft actions ---
	async function loadDraftStatus() {
		if (!selectedSeason) return;
		loadingDraft = true;
		try {
			const res = await fetch(
				`/api/draft_status?season_id=${selectedSeason.season_id}&season_year=${selectedSeason.season_year}`
			);
			const r = await res.json();
			draft = r.success ? r : null;
		} catch (err) {
			setMessage('error', `Draft status failed: ${err.message}`);
		}
		loadingDraft = false;
	}

	async function fetchDraft() {
		if (fetchingDraft || !selectedSeason) return;
		fetchingDraft = true;
		message = null;
		draftPushSteps = null;
		try {
			const res = await fetch('/api/stage_draft', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					season: parseInt(selectedSeason.season_year),
					sleeperLeagueId: selectedSeason.sleeper_league_id
				})
			});
			const r = await res.json();
			if (!r.success) throw new Error(r.error || 'Draft staging failed');
			setMessage('success', `Draft staged: ${r.draftsStaged} draft, ${r.picksStaged} picks. Review below, then push.`);
			await loadDraftStatus();
		} catch (err) {
			setMessage('error', `Draft fetch failed: ${err.message}`);
		}
		fetchingDraft = false;
	}

	async function pushDraft() {
		if (pushingDraft || !selectedSeason) return;
		pushingDraft = true;
		message = null;
		try {
			const res = await fetch('/api/process_staging_draft', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ season: parseInt(selectedSeason.season_year) })
			});
			const r = await res.json();
			if (!r.success) throw new Error(r.error || 'Draft push failed');
			draftPushSteps = r.steps;
			setMessage('success', 'Draft pushed to production.');
			await loadDraftStatus();
		} catch (err) {
			setMessage('error', `Draft push failed: ${err.message}`);
		}
		pushingDraft = false;
	}

	$: hasStagedDraft = draft?.staging?.picks?.count > 0 || (draft?.staging?.drafts?.length ?? 0) > 0;

	// --- Playoff actions ---
	async function loadPlayoffStatus() {
		if (!selectedSeason || !playoffWeek) return;
		loadingPlayoff = true;
		try {
			const res = await fetch(
				`/api/playoff_status?season_id=${selectedSeason.season_id}&season_year=${selectedSeason.season_year}&week=${playoffWeek}`
			);
			const r = await res.json();
			playoff = r.success ? r : null;
		} catch (err) {
			setMessage('error', `Playoff status failed: ${err.message}`);
		}
		loadingPlayoff = false;
	}

	async function fetchPlayoffWeek() {
		if (fetchingPlayoff || !selectedSeason) return;
		fetchingPlayoff = true;
		message = null;
		playoffPushSteps = null;
		try {
			const res = await fetch(
				`/api/archive_playoff?league_id=${selectedSeason.sleeper_league_id}` +
					`&season=${selectedSeason.season_year}&week=${playoffWeek}&stageOnly=true`
			);
			const r = await res.json();
			if (!r.success) throw new Error(r.error || 'Playoff staging failed');

			// Stage the bracket matchups too (into staging_sleeper_playoffs)
			const mRes = await fetch('/api/stage_playoff_matchups', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ season: parseInt(selectedSeason.season_year), week: parseInt(playoffWeek) })
			});
			const mResult = await mRes.json();
			if (!mResult.success) throw new Error(mResult.error || 'Playoff matchup staging failed');

			setMessage('success', `Playoff week ${playoffWeek} staged: ${mResult.staged} matchups, ${r.staged.teams} teams, ${r.staged.stats} stats. Review, then push.`);
			await loadPlayoffStatus();
			await fetchStatus();
		} catch (err) {
			setMessage('error', `Playoff fetch failed: ${err.message}`);
		}
		fetchingPlayoff = false;
	}

	async function pushPlayoffWeek() {
		if (pushingPlayoff || !selectedSeason) return;
		pushingPlayoff = true;
		message = null;
		try {
			const res = await fetch('/api/process_playoff_week', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ season: parseInt(selectedSeason.season_year), week: parseInt(playoffWeek) })
			});
			const r = await res.json();
			if (!r.success) throw new Error(r.error || 'Playoff push failed');
			playoffPushSteps = r.steps;
			setMessage('success', `Playoff week ${playoffWeek} pushed to production.`);
			await loadPlayoffStatus();
			await fetchStatus();
		} catch (err) {
			setMessage('error', `Playoff push failed: ${err.message}`);
		}
		pushingPlayoff = false;
	}

	function selectPlayoffWeek(w) {
		playoffWeek = w;
		playoff = null;
		playoffPushSteps = null;
	}

	function selectWeek(w) {
		selectedWeek = w;
		preview = null;
		production = null;
		pushSteps = null;
	}

	// Reference `status` + `selectedWeek` DIRECTLY here so Svelte re-runs these when the
	// status refreshes. (Calling stagingFor()/prodFor() wouldn't register status as a dep,
	// because their bodies are defined outside the reactive statement.)
	$: currentStaging = {
		matchups: status?.stagingByWeek?.matchups?.[selectedWeek] || 0,
		rosters: status?.stagingByWeek?.rosters?.[selectedWeek] || 0,
		stats: status?.stagingByWeek?.stats?.[selectedWeek] || 0
	};
	$: currentProd = {
		matchups: status?.matchups?.[selectedWeek] || 0,
		rosters: status?.weeklyRosters?.[selectedWeek] || 0,
		stats: status?.playerStats?.[selectedWeek] || 0
	};
	$: hasStagedForWeek = currentStaging.matchups + currentStaging.rosters + currentStaging.stats > 0;

	// Overview grid rows — also reference `status` directly so the grid reacts to refreshes.
	$: weekRows = REG_WEEKS.map((w) => {
		const s = {
			matchups: status?.stagingByWeek?.matchups?.[w] || 0,
			rosters: status?.stagingByWeek?.rosters?.[w] || 0,
			stats: status?.stagingByWeek?.stats?.[w] || 0
		};
		const p = {
			matchups: status?.matchups?.[w] || 0,
			rosters: status?.weeklyRosters?.[w] || 0,
			stats: status?.playerStats?.[w] || 0
		};
		const st =
			s.matchups + s.rosters + s.stats > 0
				? 'staged'
				: p.matchups + p.rosters + p.stats > 0
					? 'processed'
					: 'empty';
		return { w, s, p, st };
	});
</script>

<div class="container">
	<div class="header">
		<h1>🔄 Sleeper Data Pipeline</h1>
		<p class="subtitle">Load a week to staging, review the items, push, then view what landed in the real tables.</p>
	</div>

	{#if data.error}<div class="alert alert-error">❌ {data.error}</div>{/if}
	{#if message}<div class="alert alert-{message.type}">{message.text}</div>{/if}

	<!-- Season / week selection -->
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
				<div class="form-group">
					<label for="week-select">Week</label>
					<select id="week-select" value={selectedWeek} on:change={(e) => selectWeek(parseInt(e.target.value))}>
						{#each REG_WEEKS as w}<option value={w}>Week {w}</option>{/each}
					</select>
				</div>
				<button class="btn btn-ghost" on:click={loadStatus} disabled={loadingStatus}>
					{loadingStatus ? '⏳ Refreshing…' : '↻ Refresh'}
				</button>
			{/if}
		</div>
		{#if selectedSeason}
			<p class="hint">
				Sleeper League ID: <code>{selectedSeason.sleeper_league_id}</code> · Playoffs (week 15+)
				are handled on the <a href="/admin/weekly_summary">Weekly Summary</a> and
				<a href="/admin/archive">Bulk Archive</a> pages.
			</p>
		{/if}
	</div>

	{#if selectedSeason}
		<!-- Draft (season-level) -->
		<div class="section">
			<h2>Draft <span class="tag tag-blue">season-level</span></h2>
			<p class="muted">Load this season's draft from Sleeper into staging, review the picks, then push to the
				<code>drafts</code> / <code>draft_picks</code> tables.</p>
			<div class="row-actions">
				<button class="btn btn-primary" on:click={fetchDraft} disabled={fetchingDraft}>
					{fetchingDraft ? '⏳ Loading…' : '⬇ Fetch draft to staging'}
				</button>
				<button class="btn btn-ghost" on:click={loadDraftStatus} disabled={loadingDraft}>
					{loadingDraft ? '⏳…' : '↻ Refresh draft'}
				</button>
			</div>

			{#if draft}
				<!-- Staged draft -->
				<h3>Staged <span class="tag tag-amber">to be pushed</span></h3>
				{#if draft.staging.drafts.length}
					{#each draft.staging.drafts as d}
						<div class="draft-meta">
							<strong>{d.draft_name || 'Draft'}</strong> · {d.draft_type} · {d.total_rounds} rounds ·
							{draft.staging.picks.count} picks staged
						</div>
					{/each}
					{#if draft.staging.picks.list.length}
						<div class="table-scroll">
							<table class="data-table">
								<thead><tr><th>Rd</th><th>Pick</th><th>Player</th><th>Pos</th><th>NFL</th><th>Drafted by</th></tr></thead>
								<tbody>
									{#each draft.staging.picks.list as p}
										<tr>
											<td>{p.round_number}</td><td>{p.pick_number}</td><td>{p.player_name}</td>
											<td>{p.position}</td><td>{p.nfl_team}</td><td>{p.team}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
					<div class="push-bar">
						<button class="btn btn-push" on:click={pushDraft} disabled={pushingDraft || !hasStagedDraft}>
							{pushingDraft ? '⏳ Pushing…' : '⬆ Push draft to production'}
						</button>
					</div>
				{:else}
					<p class="hint">No staged draft. Click “Fetch draft to staging”.</p>
				{/if}

				{#if draftPushSteps}
					<table class="data-table push-results">
						<thead><tr><th>Step</th><th>Records</th><th>Status</th><th>Message</th></tr></thead>
						<tbody>
							{#each draftPushSteps as step}
								<tr><td><code>{step.step}</code></td><td>{step.records}</td><td>{step.success ? '✓' : '✗'}</td><td class="muted">{step.message}</td></tr>
							{/each}
						</tbody>
					</table>
				{/if}

				<!-- Production draft -->
				<h3>Production <span class="tag tag-green">real tables</span></h3>
				{#if draft.production.drafts.length}
					{#each draft.production.drafts as d}
						<div class="draft-meta">
							<strong>{d.draft_name}</strong> · {d.draft_type} · {d.total_rounds} rounds ·
							{draft.production.picks.count} picks in production
						</div>
					{/each}
					{#if draft.production.picks.list.length}
						<div class="table-scroll">
							<table class="data-table">
								<thead><tr><th>Rd</th><th>Pick</th><th>Player</th><th>NFL</th><th>Drafted by</th></tr></thead>
								<tbody>
									{#each draft.production.picks.list as p}
										<tr>
											<td>{p.round_number}</td><td>{p.pick_number}</td><td>{p.player_name}</td>
											<td>{p.nfl_team}</td><td>{p.team}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{:else}
						<p class="hint">Draft record exists but no picks in production yet.</p>
					{/if}
				{:else}
					<p class="hint">No draft in production for this season.</p>
				{/if}
			{:else if loadingDraft}
				<p class="hint">Loading draft…</p>
			{/if}
		</div>

		<!-- Overview grid -->
		<div class="section">
			<h2>Season Overview</h2>
			{#if loadingStatus}
				<p class="hint">Loading…</p>
			{:else}
				<div class="overview-grid">
					<div class="grid-header">Week</div>
					<div class="grid-header">Staging</div>
					<div class="grid-header">Production</div>
					<div class="grid-header">State</div>
					{#each weekRows as row (row.w)}
						<button class="grid-cell week-cell" class:selected={row.w === selectedWeek} on:click={() => selectWeek(row.w)}>W{row.w}</button>
						<div class="grid-cell">{row.s.matchups} matchups · {row.s.rosters} rosters · {row.s.stats} stats</div>
						<div class="grid-cell">{row.p.matchups} matchups · {row.p.rosters} rosters · {row.p.stats} stats</div>
						<div class="grid-cell">
							<span class="pill pill-{row.st}">{row.st === 'staged' ? '● Staged' : row.st === 'processed' ? '✓ In prod' : '– Empty'}</span>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Step 1: Load to staging -->
		<div class="section">
			<h2>1 · Load Week {selectedWeek} to Staging</h2>
			<p class="muted">Pulls Week {selectedWeek} from the Sleeper API into the staging tables. Nothing is written to production.</p>
			<div class="row-actions">
				<button class="btn btn-primary" on:click={fetchWeek} disabled={fetching}>
					{fetching ? '⏳ Loading…' : `⬇ Fetch Week ${selectedWeek} to staging`}
				</button>
				<button class="btn btn-secondary" on:click={loadPreview} disabled={loadingPreview}>
					{loadingPreview ? '⏳…' : '🔍 Show staged items'}
				</button>
				<span class="inline-counts">Staged now: <strong>{currentStaging.matchups} matchups · {currentStaging.rosters} rosters · {currentStaging.stats} stats</strong></span>
			</div>
		</div>

		<!-- Step 2: Staged items -->
		{#if preview}
			<div class="section">
				<h2>2 · Staged Items — Week {preview.week} <span class="tag tag-amber">to be pushed</span></h2>

				{#if preview.staging.seasonLevel.users.unmatched > 0}
					<div class="alert alert-warning">
						⚠️ {preview.staging.seasonLevel.users.unmatched} staged user(s) have no matching manager
						(by Sleeper user ID), so their teams won't resolve on push:
						<strong>{preview.staging.seasonLevel.users.unmatchedList.map((u) => u.username).join(', ')}</strong>.
						Set each one's Sleeper user ID on the <a href="/admin/managers">Managers</a> page, then re-fetch.
					</div>
				{:else}
					<div class="alert alert-success">
						✓ All {preview.staging.seasonLevel.users.total} staged users match a manager by Sleeper user ID —
						they'll be mapped automatically on push.
					</div>
				{/if}

				<!-- Matchups -->
				<h3>Matchups ({preview.staging.matchups.length})</h3>
				{#if preview.staging.matchups.length}
					<div class="matchup-list">
						{#each preview.staging.matchups as m}
							<div class="matchup-row">
								{#each m.teams as t, i}
									<span class="team">{t.team} <strong>{t.points}</strong></span>
									{#if i === 0 && m.teams.length > 1}<span class="vs">vs</span>{/if}
								{/each}
							</div>
						{/each}
					</div>
				{:else}
					<p class="hint">No staged matchups.</p>
				{/if}

				<!-- Lineups -->
				<h3>Rosters ({preview.staging.rosters.length} teams)</h3>
				{#if preview.staging.rosters.length}
					<div class="roster-grid">
						{#each preview.staging.rosters as r}
							<div class="roster-card">
								<h4>{r.team}</h4>
								<div class="lineup">
									<div class="lineup-col">
										<div class="lineup-label">Starters ({r.starters.length})</div>
										{#each r.starters as p}
											<div class="player"><span class="slot">{p.slot}</span> {p.name} <span class="pos">{p.pos}</span></div>
										{/each}
									</div>
									<div class="lineup-col">
										<div class="lineup-label">Bench ({r.bench.length})</div>
										{#each r.bench as p}
											<div class="player bench"><span class="slot">BN</span> {p.name} <span class="pos">{p.pos}</span></div>
										{/each}
									</div>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<p class="hint">No staged rosters.</p>
				{/if}

				<!-- Player stats -->
				<h3>Player Stats ({preview.staging.playerStats.count} staged — top 20)</h3>
				{#if preview.staging.playerStats.top.length}
					<table class="data-table">
						<thead><tr><th>Player</th><th>Pos</th><th>Team</th><th>½-PPR</th></tr></thead>
						<tbody>
							{#each preview.staging.playerStats.top as ps}
								<tr><td>{ps.player_name}</td><td>{ps.position}</td><td>{ps.team}</td><td>{ps.fantasy_points_half_ppr}</td></tr>
							{/each}
						</tbody>
					</table>
				{:else}
					<p class="hint">No staged player stats.</p>
				{/if}

				<!-- Push -->
				<div class="push-bar">
					<button class="btn btn-push" on:click={pushWeek} disabled={pushing || !hasStagedForWeek} title={hasStagedForWeek ? '' : 'Nothing staged for this week'}>
						{pushing ? '⏳ Pushing…' : `⬆ Push Week ${selectedWeek} to production`}
					</button>
					{#if !hasStagedForWeek}<span class="hint">Nothing staged for this week yet.</span>{/if}
				</div>

				{#if pushSteps}
					<table class="data-table push-results">
						<thead><tr><th>Step</th><th>Records</th><th>Status</th><th>Message</th></tr></thead>
						<tbody>
							{#each pushSteps as step}
								<tr><td><code>{step.step}</code></td><td>{step.records}</td><td>{step.success ? '✓' : '✗'}</td><td class="muted">{step.message}</td></tr>
							{/each}
						</tbody>
					</table>
				{/if}
			</div>
		{/if}

		<!-- Step 3: Production data -->
		<div class="section">
			<div class="section-head">
				<h2>3 · Production Data — Week {selectedWeek} <span class="tag tag-green">real tables</span></h2>
				<button class="btn btn-secondary" on:click={loadProduction} disabled={loadingProduction}>
					{loadingProduction ? '⏳…' : '👁 View production data'}
				</button>
			</div>

			{#if production}
				<div class="prod-counts">
					<span>Matchups: <strong>{production.counts.matchups}</strong></span>
					<span>Weekly scoring: <strong>{production.counts.weeklyScoring}</strong></span>
					<span>Roster teams: <strong>{production.counts.rosterTeams}</strong> ({production.counts.rosterRows} rows)</span>
					<span>Player stats: <strong>{production.counts.playerStats}</strong></span>
				</div>

				<h3>Matchups &amp; Scores</h3>
				{#if production.matchups.length}
					<div class="matchup-list">
						{#each production.matchups as m}
							<div class="matchup-row">
								<span class="team">{m.team1} <strong>{m.team1_score}</strong></span>
								<span class="vs">vs</span>
								<span class="team">{m.team2} <strong>{m.team2_score}</strong></span>
							</div>
						{/each}
					</div>
				{:else}
					<p class="hint">No matchups in production for this week.</p>
				{/if}

				<h3>Rosters ({production.roster.length} teams)</h3>
				{#if production.roster.length}
					<div class="roster-grid">
						{#each production.roster as r}
							<div class="roster-card">
								<h4>{r.team}</h4>
								<div class="lineup">
									<div class="lineup-col">
										<div class="lineup-label">Starters ({r.starters.length})</div>
										{#each r.starters as p}
											<div class="player"><span class="slot">{p.lineup_slot}</span> {p.player_name} <span class="pos">{p.position}</span></div>
										{/each}
									</div>
									<div class="lineup-col">
										<div class="lineup-label">Bench ({r.bench.length})</div>
										{#each r.bench as p}
											<div class="player bench"><span class="slot">BN</span> {p.player_name} <span class="pos">{p.position}</span></div>
										{/each}
									</div>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<p class="hint">No roster rows in production for this week.</p>
				{/if}

				<h3>Top Player Stats (top 30 of {production.playerStats.count})</h3>
				{#if production.playerStats.top.length}
					<table class="data-table">
						<thead><tr><th>Player</th><th>Pos</th><th>NFL Team</th><th>Points</th></tr></thead>
						<tbody>
							{#each production.playerStats.top as ps}
								<tr><td>{ps.player_name}</td><td>{ps.position}</td><td>{ps.nfl_team}</td><td>{ps.total_fantasy_points}</td></tr>
							{/each}
						</tbody>
					</table>
				{:else}
					<p class="hint">No player stats in production for this week.</p>
				{/if}
			{:else}
				<p class="hint">Click “View production data” to see what’s currently in the real tables for Week {selectedWeek}.</p>
			{/if}
		</div>

		<!-- Playoffs & Consolation -->
		<div class="section">
			<h2>Playoffs &amp; Consolation <span class="tag tag-blue">weeks {playoffWeeks.join('–')}</span></h2>
			<p class="muted">Fetch playoff weeks from Sleeper, review, then push. Matchups go to the
				<code>playoffs</code> table (Championship / Consolation + round), rosters to
				<code>playoff_roster</code>, and stats to <code>playoff_fantasy_stats</code>.</p>

			<div class="form-row">
				<div class="form-group">
					<label for="po-week">Playoff week</label>
					<select id="po-week" value={playoffWeek} on:change={(e) => selectPlayoffWeek(parseInt(e.target.value))}>
						{#each playoffWeeks as w}<option value={w}>Week {w}</option>{/each}
					</select>
				</div>
				<button class="btn btn-primary" on:click={fetchPlayoffWeek} disabled={fetchingPlayoff}>
					{fetchingPlayoff ? '⏳ Loading…' : `⬇ Fetch week ${playoffWeek} to staging`}
				</button>
				<button class="btn btn-secondary" on:click={loadPlayoffStatus} disabled={loadingPlayoff}>
					{loadingPlayoff ? '⏳…' : '🔍 Show staged / production'}
				</button>
			</div>

			<!-- Playoff week overview (staging vs production) -->
			<div class="overview-grid" style="margin-top: 1rem;">
				<div class="grid-header">Week</div>
				<div class="grid-header">Staging</div>
				<div class="grid-header">Production</div>
				<div class="grid-header">State</div>
				{#each playoffWeekRows as row (row.w)}
					<button class="grid-cell week-cell" class:selected={row.w === playoffWeek} on:click={() => selectPlayoffWeek(row.w)}>W{row.w}</button>
					<div class="grid-cell">{row.s.matchups} matchups · {row.s.rosters} rosters · {row.s.stats} stats</div>
					<div class="grid-cell">{row.p.matchups} matchups · {row.p.rosters} rosters · {row.p.stats} stats</div>
					<div class="grid-cell">
						<span class="pill pill-{row.st}">{row.st === 'staged' ? '● Staged' : row.st === 'processed' ? '✓ In prod' : '– Empty'}</span>
					</div>
				{/each}
			</div>
			<p class="legend">Playoff matchups are derived from the Sleeper bracket into <code>staging_sleeper_playoffs</code> on fetch, then pushed to the <code>playoffs</code> table.</p>

			{#if playoff}
				<h3>Staged <span class="tag tag-amber">to be pushed</span></h3>

				<h4>Matchups → playoffs ({playoff.staging.matchups?.length ?? 0})</h4>
				{#if playoff.staging.matchups?.length}
					<div class="matchup-list">
						{#each playoff.staging.matchups as m}
							<div class="matchup-row">
								<div><span class="tag tag-{m.bracket === 'Championship' ? 'green' : 'amber'}">{m.bracket}</span> <strong>{m.round_name}</strong></div>
								<span class="team">{m.team1_name} <strong>{m.team1_score}</strong></span> <span class="vs">vs</span> <span class="team">{m.team2_name} <strong>{m.team2_score}</strong></span>
							</div>
						{/each}
					</div>
				{:else}
					<p class="hint">No playoff matchups found for this week from Sleeper's brackets.</p>
				{/if}

				<h4>Rosters (staged)</h4>
				{#if playoff.staging.rosters.length}
					<div class="roster-grid">
						{#each playoff.staging.rosters as r}
							<div class="roster-card">
								<h4>{r.team}</h4>
								<div class="lineup">
									<div class="lineup-col">
										<div class="lineup-label">Starters ({r.starters.length})</div>
										{#each r.starters as p}<div class="player"><span class="slot">{p.slot}</span> {p.name} <span class="pos">{p.pos}</span></div>{/each}
									</div>
									<div class="lineup-col">
										<div class="lineup-label">Bench ({r.bench.length})</div>
										{#each r.bench as p}<div class="player bench"><span class="slot">BN</span> {p.name} <span class="pos">{p.pos}</span></div>{/each}
									</div>
								</div>
							</div>
						{/each}
					</div>
					<h3>Staged Player Stats ({playoff.staging.playerStats.count} — top 20)</h3>
					<table class="data-table">
						<thead><tr><th>Player</th><th>Pos</th><th>Team</th><th>½-PPR</th></tr></thead>
						<tbody>{#each playoff.staging.playerStats.top as ps}<tr><td>{ps.player_name}</td><td>{ps.position}</td><td>{ps.team}</td><td>{ps.fantasy_points_half_ppr}</td></tr>{/each}</tbody>
					</table>
					<div class="push-bar">
						<button class="btn btn-push" on:click={pushPlayoffWeek} disabled={pushingPlayoff}>
							{pushingPlayoff ? '⏳ Pushing…' : `⬆ Push week ${playoffWeek} to production`}
						</button>
					</div>
				{:else}
					<p class="hint">No staged playoff rosters for week {playoffWeek}. Fetch it first.</p>
				{/if}

				{#if playoffPushSteps}
					<table class="data-table push-results">
						<thead><tr><th>Step</th><th>Records</th><th>Status</th><th>Message</th></tr></thead>
						<tbody>{#each playoffPushSteps as step}<tr><td><code>{step.step}</code></td><td>{step.records}</td><td>{step.success ? '✓' : '✗'}</td><td class="muted">{step.message}</td></tr>{/each}</tbody>
					</table>
				{/if}

				<h3>Production <span class="tag tag-green">real tables</span></h3>
				<h4>Matchups &rarr; playoffs ({playoff.production.playoffs.length})</h4>
				{#if playoff.production.playoffs.length}
					<div class="matchup-list">
						{#each playoff.production.playoffs as m}
							<div class="matchup-row">
								<div><span class="tag tag-{m.bracket === 'Championship' ? 'green' : 'amber'}">{m.bracket}</span> <strong>{m.round_name}</strong></div>
								<span class="team">{m.team1_name} <strong>{m.team1_score}</strong></span> <span class="vs">vs</span> <span class="team">{m.team2_name} <strong>{m.team2_score}</strong></span>
							</div>
						{/each}
					</div>
				{:else}
					<p class="hint">No playoff matchups in production for this week.</p>
				{/if}

				<h4>Rosters ({playoff.production.roster.length} teams)</h4>
				{#if playoff.production.roster.length}
					<div class="roster-grid">
						{#each playoff.production.roster as r}
							<div class="roster-card">
								<h4>{r.team}</h4>
								<div class="lineup">
									<div class="lineup-col">
										<div class="lineup-label">Starters ({r.starters.length})</div>
										{#each r.starters as p}<div class="player"><span class="slot">{p.lineup_slot}</span> {p.player_name} <span class="pos">{p.position}</span></div>{/each}
									</div>
									<div class="lineup-col">
										<div class="lineup-label">Bench ({r.bench.length})</div>
										{#each r.bench as p}<div class="player bench"><span class="slot">BN</span> {p.player_name} <span class="pos">{p.position}</span></div>{/each}
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}

				<h4>Top Player Stats (top 20 of {playoff.production.playerStats.count})</h4>
				{#if playoff.production.playerStats.top.length}
					<table class="data-table">
						<thead><tr><th>Player</th><th>Pos</th><th>NFL Team</th><th>Points</th></tr></thead>
						<tbody>{#each playoff.production.playerStats.top as ps}<tr><td>{ps.player_name}</td><td>{ps.position}</td><td>{ps.nfl_team}</td><td>{ps.total_fantasy_points}</td></tr>{/each}</tbody>
					</table>
				{/if}
			{:else if loadingPlayoff}
				<p class="hint">Loading…</p>
			{/if}
		</div>
	{/if}
</div>

<style>
	.container { max-width: 1200px; margin: 0 auto; }
	.header h1 { color: #00316b; margin: 0 0 0.25rem 0; font-size: 1.4rem; }
	.subtitle { color: #666; margin: 0 0 1.5rem 0; font-size: 0.9rem; }
	.section { background: #fff; border: 1px solid #e0e0e0; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
	.section h2 { color: #00316b; margin-top: 0; font-size: 1.1rem; }
	.section-head { display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; }
	h3 { color: #00316b; margin: 1.1rem 0 0.5rem; font-size: 0.95rem; }
	h4 { margin: 0 0 0.5rem; color: #00316b; font-size: 0.9rem; }
	.muted { color: #666; font-size: 0.9rem; }
	.alert { padding: 0.85rem 1rem; border-radius: 8px; margin-bottom: 1.25rem; }
	.alert-success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
	.alert-error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
	.alert-warning { background: #fff3cd; border: 1px solid #ffeeba; color: #856404; }
	.form-row { display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap; }
	.form-group label { display: block; font-weight: 600; margin-bottom: 0.35rem; color: #333; }
	.form-group select { padding: 0.6rem; border: 2px solid #ddd; border-radius: 6px; font-size: 1rem; min-width: 240px; }
	.hint { color: #666; font-size: 0.9rem; }
	code { font-family: monospace; background: #f0f0f0; padding: 0.1rem 0.35rem; border-radius: 3px; color: #00316b; }
	.overview-grid { display: grid; grid-template-columns: 70px 1fr 1fr 120px; gap: 0.4rem; }
	.grid-header { font-weight: 700; color: #00316b; background: #f2f4f8; padding: 0.5rem; border-radius: 4px; font-size: 0.85rem; }
	.grid-cell { padding: 0.5rem; border: 1px solid #eee; border-radius: 4px; font-size: 0.9rem; display: flex; align-items: center; }
	.week-cell { font-weight: 700; background: #f8f9fa; cursor: pointer; justify-content: center; border: 1px solid #ddd; }
	.week-cell:hover { background: #e9ecef; }
	.week-cell.selected { background: #00316b; color: #fff; }
	.pill { padding: 0.2rem 0.5rem; border-radius: 12px; font-size: 0.8rem; font-weight: 600; }
	.pill-staged { background: #fff3cd; color: #856404; }
	.pill-processed { background: #d4edda; color: #155724; }
	.pill-empty { background: #eee; color: #777; }
	.legend { color: #888; font-size: 0.8rem; margin-top: 0.75rem; }
	.row-actions { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; }
	.inline-counts { font-size: 0.85rem; color: #444; }
	.inline-counts strong, .prod-counts strong { color: #00316b; }
	.btn { padding: 0.6rem 1rem; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.95rem; }
	.btn:disabled { background: #ccc; cursor: not-allowed; }
	.btn-primary { background: #2196f3; color: #fff; }
	.btn-secondary { background: #6c757d; color: #fff; }
	.btn-push { background: #28a745; color: #fff; }
	.btn-ghost { background: #eef1f6; color: #00316b; }
	.tag { font-size: 0.7rem; padding: 0.15rem 0.5rem; border-radius: 10px; vertical-align: middle; }
	.tag-amber { background: #fff3cd; color: #856404; }
	.tag-green { background: #d4edda; color: #155724; }
	.tag-blue { background: #d1ecf1; color: #0c5460; }
	.draft-meta { font-size: 0.9rem; color: #333; margin: 0.35rem 0 0.75rem; }
	.table-scroll { max-height: 320px; overflow: auto; border: 1px solid #eee; border-radius: 6px; }
	.table-scroll .data-table th { position: sticky; top: 0; background: #f2f4f8; }
	.matchup-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 0.5rem; }
	.matchup-row { background: #f8f9fa; border: 1px solid #e8e8e8; border-radius: 6px; padding: 0.5rem 0.75rem; font-size: 0.9rem; }
	.vs { color: #999; margin: 0 0.5rem; }
	.roster-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; }
	.roster-card { background: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 8px; padding: 1rem; }
	.lineup { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
	.lineup-label { font-size: 0.75rem; text-transform: uppercase; color: #888; font-weight: 700; margin-bottom: 0.25rem; }
	.player { font-size: 0.85rem; padding: 0.15rem 0; }
	.player.bench { color: #777; }
	.slot { display: inline-block; min-width: 34px; font-weight: 700; color: #00316b; font-size: 0.72rem; }
	.pos { color: #999; font-size: 0.75rem; }
	.push-bar { display: flex; align-items: center; gap: 0.75rem; margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid #eee; }
	.data-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
	.data-table th, .data-table td { text-align: left; padding: 0.4rem 0.6rem; border-bottom: 1px solid #eee; }
	.data-table th { color: #00316b; }
	.push-results { margin-top: 1rem; }
	.prod-counts { display: flex; gap: 1.25rem; flex-wrap: wrap; font-size: 0.9rem; color: #444; margin-bottom: 0.5rem; }
</style>
