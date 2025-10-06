<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	export let data;

	let leagues = [];
	let managers = [];
	let selectedLeague = '';
	let seasonYear = new Date().getFullYear();
	let platform = 'sleeper';
	let platformLeagueId = '';
	let isActive = true;
	let scoringType = 'Half-PPR';
	let regSeasonLength = 14;
	let maxTeams = 10;
	
	// Team assignments
	let teamAssignments = [];
	
	let loading = false;
	let error = '';
	let success = false;

	onMount(async () => {
		await loadInitialData();
	});

	async function loadInitialData() {
		try {
			const [leaguesRes, managersRes] = await Promise.all([
				fetch('/api/admin/leagues'),
				fetch('/api/admin/managers')
			]);

			if (!leaguesRes.ok || !managersRes.ok) {
				throw new Error('Failed to load data');
			}

			leagues = await leaguesRes.json();
			managers = await managersRes.json();
		} catch (err) {
			error = 'Failed to load initial data: ' + err.message;
		}
	}

	function onLeagueChange() {
		const league = leagues.find(l => l.league_id === parseInt(selectedLeague));
		if (league) {
			platform = league.platform;
			scoringType = league.scoring_type || 'Half-PPR';
			regSeasonLength = league.reg_season_length || 14;
			maxTeams = league.max_teams || 10;
			
			// Initialize team assignments
			teamAssignments = managers.slice(0, maxTeams).map(manager => ({
				manager_id: manager.manager_id,
				manager_name: manager.username,
				team_name: '',
				logo_url: manager.logo_url || ''
			}));
		}
	}

	function addTeamSlot() {
		if (teamAssignments.length < 20) {
			teamAssignments = [...teamAssignments, {
				manager_id: '',
				manager_name: '',
				team_name: '',
				logo_url: ''
			}];
		}
	}

	function removeTeamSlot(index) {
		teamAssignments = teamAssignments.filter((_, i) => i !== index);
	}

	function onManagerSelect(index) {
		const manager = managers.find(m => m.manager_id === parseInt(teamAssignments[index].manager_id));
		if (manager) {
			teamAssignments[index].manager_name = manager.username;
			teamAssignments[index].logo_url = manager.logo_url || '';
		}
	}

	async function handleSubmit() {
		error = '';
		success = false;
		loading = true;

		// Validate
		if (!selectedLeague) {
			error = 'Please select a league';
			loading = false;
			return;
		}

		if (!seasonYear || seasonYear < 2000 || seasonYear > 2100) {
			error = 'Please enter a valid season year';
			loading = false;
			return;
		}

		const validTeams = teamAssignments.filter(t => t.manager_id && t.team_name);
		if (validTeams.length === 0) {
			error = 'Please assign at least one team';
			loading = false;
			return;
		}

		// Check for duplicate managers
		const managerIds = validTeams.map(t => t.manager_id);
		if (new Set(managerIds).size !== managerIds.length) {
			error = 'Each manager can only have one team per season';
			loading = false;
			return;
		}

		try {
			const response = await fetch('/api/admin/seasons', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					league_id: parseInt(selectedLeague),
					season_year: parseInt(seasonYear),
					platform,
					platform_league_id: platformLeagueId || null,
					is_active: isActive,
					teams: validTeams
				})
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to create season');
			}

			success = true;
			setTimeout(() => {
				goto(`/admin/seasons/${result.season_id}`);
			}, 2000);
		} catch (err) {
			error = err.message;
		} finally {
			loading = false;
		}
	}
</script>

<div class="container mx-auto px-4 py-8 max-w-4xl">
	<div class="mb-6">
		<h1 class="text-3xl font-bold text-gray-900 mb-2">Create New Season</h1>
		<p class="text-gray-600">Set up a new fantasy football season for your league</p>
	</div>

	{#if error}
		<div class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
			<strong class="font-semibold">Error:</strong> {error}
		</div>
	{/if}

	{#if success}
		<div class="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6">
			<strong class="font-semibold">Success!</strong> Season created. Redirecting...
		</div>
	{/if}

	<form on:submit|preventDefault={handleSubmit} class="space-y-6">
		<!-- League Selection -->
		<div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
			<h2 class="text-xl font-semibold mb-4">League Information</h2>
			
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label for="league" class="block text-sm font-medium text-gray-700 mb-2">
						League <span class="text-red-500">*</span>
					</label>
					<select
						id="league"
						bind:value={selectedLeague}
						on:change={onLeagueChange}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
						required
					>
						<option value="">Select a league</option>
						{#each leagues as league}
							<option value={league.league_id}>
								{league.league_name} ({league.platform})
							</option>
						{/each}
					</select>
				</div>

				<div>
					<label for="year" class="block text-sm font-medium text-gray-700 mb-2">
						Season Year <span class="text-red-500">*</span>
					</label>
					<input
						id="year"
						type="number"
						bind:value={seasonYear}
						min="2000"
						max="2100"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
						required
					/>
				</div>

				<div>
					<label for="platform" class="block text-sm font-medium text-gray-700 mb-2">
						Platform
					</label>
					<input
						id="platform"
						type="text"
						bind:value={platform}
						disabled
						class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
					/>
				</div>

				<div>
					<label for="platformLeagueId" class="block text-sm font-medium text-gray-700 mb-2">
						Platform League ID
					</label>
					<input
						id="platformLeagueId"
						type="text"
						bind:value={platformLeagueId}
						placeholder="Optional"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
					/>
				</div>
			</div>

			<div class="mt-4">
				<label class="flex items-center">
					<input
						type="checkbox"
						bind:checked={isActive}
						class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
					/>
					<span class="ml-2 text-sm text-gray-700">Set as active season</span>
				</label>
			</div>
		</div>

		<!-- Team Assignments -->
		<div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
			<div class="flex justify-between items-center mb-4">
				<h2 class="text-xl font-semibold">Team Assignments</h2>
				<button
					type="button"
					on:click={addTeamSlot}
					class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
					disabled={!selectedLeague}
				>
					Add Team
				</button>
			</div>

			{#if !selectedLeague}
				<p class="text-gray-500 text-sm">Select a league first to assign teams</p>
			{:else if teamAssignments.length === 0}
				<p class="text-gray-500 text-sm">No teams assigned yet. Click "Add Team" to get started.</p>
			{:else}
				<div class="space-y-4">
					{#each teamAssignments as team, index}
						<div class="flex gap-4 items-start p-4 bg-gray-50 rounded-lg">
							<div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label for="manager-{index}" class="block text-sm font-medium text-gray-700 mb-1">
										Manager <span class="text-red-500">*</span>
									</label>
									<select
										id="manager-{index}"
										bind:value={team.manager_id}
										on:change={() => onManagerSelect(index)}
										class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
										required
									>
										<option value="">Select manager</option>
										{#each managers as manager}
											<option value={manager.manager_id}>
												{manager.username} - {manager.real_name || 'No name'}
											</option>
										{/each}
									</select>
								</div>

								<div>
									<label for="teamname-{index}" class="block text-sm font-medium text-gray-700 mb-1">
										Team Name <span class="text-red-500">*</span>
									</label>
									<input
										id="teamname-{index}"
										type="text"
										bind:value={team.team_name}
										placeholder="Enter team name"
										class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
										required
									/>
								</div>

								<div class="md:col-span-2">
									<label for="logo-{index}" class="block text-sm font-medium text-gray-700 mb-1">
										Logo URL (Optional)
									</label>
									<input
										id="logo-{index}"
										type="text"
										bind:value={team.logo_url}
										placeholder="https://..."
										class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
									/>
								</div>
							</div>

							<button
								type="button"
								on:click={() => removeTeamSlot(index)}
								class="mt-6 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
								title="Remove team"
							>
								Remove
							</button>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Submit -->
		<div class="flex gap-4">
			<button
				type="submit"
				disabled={loading}
				class="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
			>
				{loading ? 'Creating Season...' : 'Create Season'}
			</button>
			<a
				href="/admin/seasons"
				class="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
			>
				Cancel
			</a>
		</div>
	</form>
</div>

<style>
	:global(body) {
		background-color: #f9fafb;
	}
</style>