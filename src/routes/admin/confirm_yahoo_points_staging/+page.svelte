<script>
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  
  export let data;
  export let form;
  
  let searchTerm = '';
  let filterType = 'all'; // all, null, wrt, bn
  let selectedPlayer = null;
  let selectedPosition = '';
  let saving = false;
  
  $: filteredPlayers = filterPlayers(data.players, searchTerm, filterType);
  $: playersByName = groupPlayersByName(filteredPlayers);
  
  function filterPlayers(players, search, filter) {
    let filtered = [...players];
    
    // Apply search filter
    if (search) {
      filtered = filtered.filter(p => 
        p.player_name.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Apply type filter
    if (filter === 'null') {
      filtered = filtered.filter(p => !p.position);
    } else if (filter === 'wrt') {
      filtered = filtered.filter(p => p.lineup_slot === 'W/R/T');
    } else if (filter === 'bn') {
      filtered = filtered.filter(p => p.lineup_slot === 'BN');
    }
    
    return filtered;
  }
  
  function groupPlayersByName(players) {
    const grouped = {};
    players.forEach(p => {
      if (!grouped[p.player_name]) {
        grouped[p.player_name] = {
          player_id: p.player_id,
          player_name: p.player_name,
          position: p.position,
          total_rows: 0,
          slots: [],
          weeks: { min: p.first_week, max: p.last_week }
        };
      }
      grouped[p.player_name].total_rows += p.row_count;
      if (!grouped[p.player_name].slots.includes(p.lineup_slot)) {
        grouped[p.player_name].slots.push(p.lineup_slot);
      }
    });
    return Object.values(grouped);
  }
  
  function selectPlayer(player) {
    selectedPlayer = player;
    selectedPosition = player.position || '';
  }
  
  function getStatusClass(player) {
    if (player.position) return 'bg-green-50 border-green-200';
    return 'bg-yellow-50 border-yellow-200';
  }
  
  function getStatusBadge(player) {
    if (player.position) return { text: 'Set', class: 'bg-green-100 text-green-800' };
    return { text: 'Missing', class: 'bg-yellow-100 text-yellow-800' };
  }
  
  async function handleSubmit() {
    saving = true;
    return async ({ result, update }) => {
      saving = false;
      if (result.type === 'success') {
        await invalidateAll();
        selectedPlayer = null;
        selectedPosition = '';
      }
      await update();
    };
  }
</script>

<div class="min-h-screen bg-gray-50 p-6">
  <div class="max-w-7xl mx-auto">
    
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">
        Confirm Yahoo Points Staging - Position Editor
      </h1>
      <p class="text-gray-600">
        Update player positions for staging table entries. Changes apply to all rows for each player.
      </p>
    </div>

    <!-- Stats Summary -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      <div class="bg-white p-4 rounded-lg shadow border border-gray-200">
        <div class="text-sm text-gray-600">Total Players</div>
        <div class="text-2xl font-bold text-gray-900">{data.stats.total_unique_players}</div>
      </div>
      <div class="bg-white p-4 rounded-lg shadow border border-gray-200">
        <div class="text-sm text-gray-600">Total Rows</div>
        <div class="text-2xl font-bold text-gray-900">{data.stats.total_rows}</div>
      </div>
      <div class="bg-white p-4 rounded-lg shadow border border-gray-200">
        <div class="text-sm text-gray-600">Needs Position</div>
        <div class="text-2xl font-bold text-yellow-600">{data.stats.players_needing_position}</div>
      </div>
      <div class="bg-white p-4 rounded-lg shadow border border-gray-200">
        <div class="text-sm text-gray-600">NULL Positions</div>
        <div class="text-2xl font-bold text-red-600">{data.stats.null_position_rows}</div>
      </div>
      <div class="bg-white p-4 rounded-lg shadow border border-gray-200">
        <div class="text-sm text-gray-600">W/R/T Slots</div>
        <div class="text-2xl font-bold text-blue-600">{data.stats.wrt_slot_rows}</div>
      </div>
      <div class="bg-white p-4 rounded-lg shadow border border-gray-200">
        <div class="text-sm text-gray-600">BN Slots</div>
        <div class="text-2xl font-bold text-gray-600">{data.stats.bn_slot_rows}</div>
      </div>
    </div>

    <!-- Success/Error Messages -->
    {#if form?.success}
      <div class="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
        <svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
        </svg>
        <span class="text-green-800">{form.message}</span>
      </div>
    {/if}
    
    {#if form?.error}
      <div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
        <svg class="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
        </svg>
        <span class="text-red-800">{form.error}</span>
      </div>
    {/if}

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Player List -->
      <div class="lg:col-span-2">
        <div class="bg-white rounded-lg shadow">
          
          <!-- Filters -->
          <div class="p-4 border-b border-gray-200">
            <div class="flex flex-col sm:flex-row gap-3">
              
              <!-- Search -->
              <div class="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search players..."
                  bind:value={searchTerm}
                  class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <svg class="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>
              
              <!-- Filter Dropdown -->
              <select
                bind:value={filterType}
                class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Players</option>
                <option value="null">Missing Position</option>
                <option value="wrt">W/R/T Slots</option>
                <option value="bn">Bench Slots</option>
              </select>
            </div>
          </div>

          <!-- Player List -->
          <div class="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
            {#each playersByName as player}
              <button
                on:click={() => selectPlayer(player)}
                class="w-full p-4 hover:bg-gray-50 transition-colors text-left {selectedPlayer?.player_id === player.player_id ? 'bg-blue-50' : ''}"
              >
                <div class="flex items-start justify-between gap-4">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <h3 class="font-semibold text-gray-900">{player.player_name}</h3>
                      {#if player.position}
                        <span class="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded">
                          {player.position}
                        </span>
                      {:else}
                        <span class="px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-800 rounded">
                          No Position
                        </span>
                      {/if}
                    </div>
                    
                    <div class="text-sm text-gray-600">
                      <span class="font-medium">{player.total_rows} rows</span>
                      <span class="mx-2">•</span>
                      <span>Weeks {player.weeks.min}-{player.weeks.max}</span>
                      <span class="mx-2">•</span>
                      <span>Slots: {player.slots.join(', ')}</span>
                    </div>
                  </div>
                  
                  <div class="flex-shrink-0">
                    {#if selectedPlayer?.player_id === player.player_id}
                      <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
                      </svg>
                    {/if}
                  </div>
                </div>
              </button>
            {:else}
              <div class="p-8 text-center text-gray-500">
                No players found matching your filters
              </div>
            {/each}
          </div>
        </div>
      </div>

      <!-- Update Form -->
      <div class="lg:col-span-1">
        <div class="bg-white rounded-lg shadow p-6 sticky top-6">
          
          {#if selectedPlayer}
            <h2 class="text-xl font-bold text-gray-900 mb-4">Update Position</h2>
            
            <div class="mb-4">
              <div class="text-sm font-medium text-gray-700 mb-2">Selected Player</div>
              <div class="p-3 bg-gray-50 rounded-lg">
                <div class="font-semibold text-gray-900">{selectedPlayer.player_name}</div>
                <div class="text-sm text-gray-600 mt-1">
                  Will update {selectedPlayer.total_rows} rows
                </div>
              </div>
            </div>

            <form method="POST" action="?/updatePosition" use:enhance={handleSubmit}>
              <input type="hidden" name="player_id" value={selectedPlayer.player_id} />
              <input type="hidden" name="player_name" value={selectedPlayer.player_name} />
              
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Position
                </label>
                <select
                  name="position"
                  bind:value={selectedPosition}
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select position...</option>
                  <option value="QB">QB - Quarterback</option>
                  <option value="RB">RB - Running Back</option>
                  <option value="WR">WR - Wide Receiver</option>
                  <option value="TE">TE - Tight End</option>
                  <option value="K">K - Kicker</option>
                  <option value="DEF">DEF - Defense</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={!selectedPosition || saving}
                class="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {#if saving}
                  Updating...
                {:else}
                  Update Position
                {/if}
              </button>
            </form>
            
          {:else}
            <div class="text-center text-gray-500 py-12">
              <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
              <p class="text-lg font-medium mb-2">No Player Selected</p>
              <p class="text-sm">Select a player from the list to update their position</p>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>