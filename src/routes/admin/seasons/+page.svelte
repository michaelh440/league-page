<script>
	import { onMount } from 'svelte';

	let seasons = [];
	let loading = true;
	let error = '';

	onMount(async () => {
		await loadSeasons();
	});

	async function loadSeasons() {
		try {
			const response = await fetch('/api/admin/seasons');
			if (!response.ok) throw new Error('Failed to fetch seasons');
			seasons = await response.json();
		} catch (err) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	async function toggleActive(seasonId, currentStatus) {
		try {
			const response = await fetch(`/api/admin/seasons/${seasonId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ is_active: !currentStatus })
			});

			if (!response.ok) throw new Error('Failed to update season');
			await loadSeasons();
		} catch (err) {
			alert('Error updating season: ' + err.message);
		}
	}
</script>

<div class="container mx-auto px-4 py-8 max-w-6xl">
	<div class="flex justify-between items-center mb-6">
		<div>
			<h1 class="text-3xl font-bold text-gray-900 mb-2">Manage Seasons</h1>
			<p class="text-gray-600">View and manage all fantasy football seasons</p>
		</div>
		<a
			href="/admin/seasons/new"
			class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
		>
			Create New Season
		</a>
	</div>

	{#if error}
		<div class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
			<strong class="font-semibold">Error:</strong> {error}
		</div>
	{/if}

	{#if loading}
		<div class="text-center py-12">
			<div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
			<p class="mt-4 text-gray-600">Loading seasons...</p>
		</div>
	{:else if seasons.length === 0}
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
			<svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
			</svg>
			<h3 class="text-lg font-medium text-gray-900 mb-2">No seasons yet</h3>
			<p class="text-gray-600 mb-4">Get started by creating your first season</p>
			<a
				href="/admin/seasons/new"
				class="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
			>
				Create Season
			</a>
		</div>
	{:else}
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Season
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							League
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Platform
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Teams
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Status
						</th>
						<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
							Actions
						</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					{#each seasons as season}
						<tr class="hover:bg-gray-50">
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-sm font-medium text-gray-900">{season.season_year}</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-sm text-gray-900">{season.league_name}</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<span class="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
									{season.platform}
								</span>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-sm text-gray-900">{season.team_count} teams</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								{#if season.is_active}
									<span class="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
										Active
									</span>
								{:else}
									<span class="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
										Inactive
									</span>
								{/if}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
								<div class="flex justify-end gap-2">
									<a
										href="/admin/seasons/{season.season_id}"
										class="text-blue-600 hover:text-blue-900"
									>
										View
									</a>
									<button
										on:click={() => toggleActive(season.season_id, season.is_active)}
										class="text-gray-600 hover:text-gray-900"
									>
										{season.is_active ? 'Deactivate' : 'Activate'}
									</button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<style>
	:global(body) {
		background-color: #f9fafb;
	}
</style>