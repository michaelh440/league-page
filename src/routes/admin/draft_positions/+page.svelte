<script>
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	export let data;

	$: positions = data.positions ?? [];

	// Group the unpositioned picks by season for display.
	$: bySeason = (() => {
		const map = new Map();
		for (const p of data.picks ?? []) {
			if (!map.has(p.season_year)) map.set(p.season_year, { platform: p.platform, picks: [] });
			map.get(p.season_year).picks.push(p);
		}
		return [...map.entries()].sort((a, b) => b[0] - a[0]);
	})();

	$: total = data.picks?.length ?? 0;

	let saving = null; // pick_id currently saving
	let message = null;
</script>

<svelte:head><title>Admin - Draft Positions</title></svelte:head>

<div class="wrap">
	<div class="nav"><a href="/admin" class="back">← Back to Dashboard</a></div>

	<header>
		<h1>🎨 Draft Positions</h1>
		<p>
			Draft picks whose position couldn't be resolved automatically (name mismatch, or a
			player not in the NFL players table) show up colorless on the drafts page. Assign a
			position here and it'll be used for that pick's season.
		</p>
	</header>

	{#if data.error}
		<div class="alert error">❌ {data.error}</div>
	{/if}
	{#if message}
		<div class="alert success">✅ {message}</div>
	{/if}

	{#if total === 0}
		<div class="done">🎉 Every draft pick has a position. Nothing to fix.</div>
	{:else}
		<p class="count">{total} pick{total === 1 ? '' : 's'} still need a position.</p>

		{#each bySeason as [year, group]}
			<section class="season">
				<h2>{year} <span class="platform">{group.platform}</span> <span class="n">({group.picks.length})</span></h2>
				<table>
					<thead>
						<tr><th>Pick</th><th>Player</th><th>NFL</th><th>Manager</th><th>Position</th></tr>
					</thead>
					<tbody>
						{#each group.picks as pick (pick.pick_id)}
							<tr>
								<td class="mono">R{pick.round_number}.{pick.pick_in_round} <span class="muted">#{pick.pick_number}</span></td>
								<td class="player">{pick.player_name}</td>
								<td class="mono muted">{pick.player_nfl_team || '—'}</td>
								<td class="muted">{pick.manager_name}</td>
								<td>
									<form
										method="POST"
										action="?/assign"
										use:enhance={() => {
											saving = pick.pick_id;
											message = null;
											return async ({ result, update }) => {
												await update({ reset: false });
												saving = null;
												if (result.type === 'success') {
													message = `${pick.player_name} → ${result.data?.position}`;
													await invalidateAll();
												}
											};
										}}
									>
										<input type="hidden" name="pick_id" value={pick.pick_id} />
										<select
											name="position"
											disabled={saving === pick.pick_id}
											on:change={(e) => e.target.form.requestSubmit()}
										>
											<option value="">— set —</option>
											{#each positions as pos}
												<option value={pos}>{pos}</option>
											{/each}
										</select>
									</form>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</section>
		{/each}
	{/if}
</div>

<style>
	.wrap { max-width: 900px; margin: 0 auto; padding: 1.5rem; }
	.nav { margin-bottom: 1rem; }
	.back { color: #0056b3; text-decoration: none; }
	header h1 { margin: 0 0 0.5rem; }
	header p { color: #555; max-width: 65ch; }
	.alert { padding: 0.6rem 1rem; border-radius: 6px; margin: 1rem 0; }
	.alert.error { background: #f8d7da; color: #842029; }
	.alert.success { background: #d1e7dd; color: #0f5132; }
	.done { padding: 2rem; text-align: center; background: #d1e7dd; color: #0f5132; border-radius: 8px; font-size: 1.1rem; }
	.count { font-weight: 600; color: #8a5300; }
	.season { margin: 1.5rem 0; }
	.season h2 { font-size: 1.15rem; margin: 0 0 0.5rem; }
	.platform { font-size: 0.8rem; background: #eef; color: #335; padding: 0.1rem 0.5rem; border-radius: 4px; text-transform: uppercase; }
	.n { color: #888; font-weight: 400; font-size: 0.9rem; }
	table { width: 100%; border-collapse: collapse; }
	th, td { padding: 0.45rem 0.6rem; text-align: left; border-bottom: 1px solid #eee; font-size: 0.9rem; }
	thead th { background: #f7f7f9; font-size: 0.75rem; text-transform: uppercase; color: #666; }
	.player { font-weight: 600; }
	.mono { font-variant-numeric: tabular-nums; font-family: ui-monospace, monospace; }
	.muted { color: #888; }
	select { padding: 0.3rem 0.5rem; border-radius: 6px; border: 1px solid #ccc; }
</style>
