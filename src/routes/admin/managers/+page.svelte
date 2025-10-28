<script>
	import { onMount } from 'svelte';

	let managers = [];
	let loading = true;
	let error = '';
	let searchTerm = '';

	onMount(async () => {
		await loadManagers();
	});

	async function loadManagers() {
		try {
			const response = await fetch('/api/admin/managers');
			if (!response.ok) throw new Error('Failed to load managers');
			managers = await response.json();
		} catch (err) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	// Filter managers based on search
	$: filteredManagers = managers.filter(m => 
		m.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
		(m.real_name && m.real_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
		(m.email && m.email.toLowerCase().includes(searchTerm.toLowerCase()))
	);
</script>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="flex justify-between items-center mb-8">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">Managers</h1>
			<p class="mt-2 text-gray-600">View and manage league members</p>
		</div>
		<button
			class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
		>
			Add Manager
		</button>
	</div>

	{#if error}
		<div class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
			<strong class="font-semibold">Error:</strong> {error}
		</div>
	{/if}

	<!-- Search and Filters -->
	<div class="bg-white shadow rounded-lg p-4">
		<div class="flex flex-col sm:flex-row gap-4">
			<div class="flex-1">
				<input
					type="text"
					bind:value={searchTerm}
					placeholder="Search managers by name, username, or email..."
					class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
				/>
			</div>
			<div class="flex gap-2">
				<select class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
					<option>All Status</option>
					<option>Active</option>
					<option>Inactive</option>
				</select>
			</div>
		</div>
	</div>

	{#if loading}
		<div class="text-center py-12">
			<div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
			<p class="mt-4 text-gray-600">Loading managers...</p>
		</div>
	{:else if filteredManagers.length === 0}
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
			<svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
			</svg>
			<h3 class="text-lg font-medium text-gray-900 mb-2">
				{searchTerm ? 'No managers found' : 'No managers yet'}
			</h3>
			<p class="text-gray-600 mb-4">
				{searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first manager'}
			</p>
		</div>
	{:else}
		<!-- Managers Grid -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each filteredManagers as manager}
				<div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
					<!-- Manager Avatar/Header -->
					<div class="bg-gradient-to-br from-blue-500 to-purple-600 h-24 relative">
						<div class="absolute -bottom-10 left-6">
							{#if manager.logo_url}
								<img
									src={manager.logo_url}
									alt={manager.username}
									class="w-20 h-20 rounded-full border-4 border-white object-cover"
								/>
							{:else}
								<div class="w-20 h-20 rounded-full border-4 border-white bg-gray-300 flex items-center justify-center text-2xl font-bold text-gray-600">
									{manager.username.charAt(0).toUpperCase()}
								</div>
							{/if}
						</div>
					</div>

					<!-- Manager Info -->
					<div class="pt-12 px-6 pb-6">
						<div class="mb-4">
							<h3 class="text-lg font-semibold text-gray-900">
								{manager.real_name || manager.username}
							</h3>
							{#if manager.real_name}
								<p class="text-sm text-gray-600">@{manager.username}</p>
							{/if}
							{#if manager.team_alias}
								<p class="text-sm text-blue-600 font-medium mt-1">{manager.team_alias}</p>
							{/if}
						</div>

						<div class="space-y-2 text-sm">
							<div class="flex items-center text-gray-600">
								<svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
								</svg>
								{manager.email}
							</div>
							{#if manager.year_joined}
								<div class="flex items-center text-gray-600">
									<svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
									</svg>
									Joined {manager.year_joined}
								</div>
							{/if}
						</div>

						<!-- Actions -->
						<div class="mt-4 flex gap-2">
							<a
								href="/admin/managers/{manager.manager_id}"
								class="flex-1 px-3 py-2 text-sm text-center bg-blue-50 text-blue-700 rounded hover:bg-blue-100 font-medium"
							>
								View Details
							</a>
							<button
								class="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
							>
								Edit
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>

		<!-- Results Summary -->
		<div class="text-center text-sm text-gray-600 mt-6">
			Showing {filteredManagers.length} of {managers.length} managers
		</div>
	{/if}
</div>