<script>
  import { goto } from '$app/navigation';
  
  export let data;
  
  $: ({ year, standings, availableYears } = data);
  
  function changeYear(event) {
    const newYear = event.target.value;
    goto(`/standings/${newYear}`);
  }
  
  function getPlayoffBadgeClass(status) {
    if (status === 'championship') return 'bg-yellow-500';
    if (status === 'consolation') return 'bg-blue-500';
    return 'bg-slate-600';
  }
  
  function getPlayoffLabel(status) {
    if (status === 'championship') return '🏆 Champion';
    if (status === 'consolation') return 'Playoffs';
    return 'Missed';
  }
</script>

<svelte:head>
  <title>{year} Season Standings</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4">
  <!-- Header -->
  <div class="max-w-6xl mx-auto mb-8">
    <h1 class="text-4xl md:text-5xl font-bold text-center mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
      Season Standings
    </h1>
    
    <!-- Year Selector -->
    <div class="flex justify-center mb-8">
      <div class="relative">
        <select 
          value={year}
          on:change={changeYear}
          class="appearance-none bg-slate-800 border-2 border-slate-600 rounded-lg px-6 py-3 pr-12 text-xl font-semibold cursor-pointer hover:border-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          {#each availableYears as yr}
            <option value={yr}>{yr} Season</option>
          {/each}
        </select>
        <svg class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </div>
    </div>
  </div>

  <!-- Standings Table -->
  <div class="max-w-6xl mx-auto">
    {#if standings.length === 0}
      <div class="text-center py-12 text-slate-400">
        <p class="text-xl">No standings data available for {year}</p>
      </div>
    {:else}
      <!-- Desktop View -->
      <div class="hidden md:block bg-slate-800/50 backdrop-blur rounded-xl overflow-hidden border border-slate-700">
        <table class="w-full">
          <thead class="bg-slate-700/50">
            <tr>
              <th class="px-6 py-4 text-left font-semibold">Rank</th>
              <th class="px-6 py-4 text-left font-semibold">Manager</th>
              <th class="px-6 py-4 text-center font-semibold">Record</th>
              <th class="px-6 py-4 text-center font-semibold">Points For</th>
              <th class="px-6 py-4 text-center font-semibold">Points Against</th>
              <th class="px-6 py-4 text-center font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {#each standings as team}
              <tr class="border-t border-slate-700 hover:bg-slate-700/30 transition-colors">
                <td class="px-6 py-4">
                  <div class="text-2xl font-bold text-slate-400">#{team.rank}</div>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <img 
                      src={team.logo_url} 
                      alt={team.manager_name}
                      class="w-12 h-12 rounded-full object-cover border-2 border-slate-600"
                    />
                    <span class="font-semibold text-lg">{team.manager_name}</span>
                  </div>
                </td>
                <td class="px-6 py-4 text-center">
                  <span class="text-lg font-mono">
                    {team.wins}-{team.losses}{#if team.ties > 0}-{team.ties}{/if}
                  </span>
                </td>
                <td class="px-6 py-4 text-center font-mono text-green-400">
                  {team.points_for ? Number(team.points_for).toFixed(1) : '0.0'}
                </td>
                <td class="px-6 py-4 text-center font-mono text-red-400">
                  {team.points_against ? Number(team.points_against).toFixed(1) : '0.0'}
                </td>
                <td class="px-6 py-4 text-center">
                  <span class="text-xs {getPlayoffBadgeClass(team.playoff_status)} text-white px-2 py-1 rounded">
                    {getPlayoffLabel(team.playoff_status)}
                  </span>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Mobile View -->
      <div class="md:hidden space-y-4">
        {#each standings as team}
          <div class="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-slate-700">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-3">
                <div class="text-2xl font-bold text-slate-400">#{team.rank}</div>
                <img 
                  src={team.logo_url} 
                  alt={team.manager_name}
                  class="w-12 h-12 rounded-full object-cover border-2 border-slate-600"
                />
                <span class="font-semibold">{team.manager_name}</span>
              </div>
              <span class="text-xs {getPlayoffBadgeClass(team.playoff_status)} text-white px-2 py-1 rounded">
                {getPlayoffLabel(team.playoff_status)}
              </span>
            </div>
            
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div class="bg-slate-700/30 rounded-lg p-3">
                <div class="text-slate-400 text-xs mb-1">Record</div>
                <div class="font-mono font-semibold">
                  {team.wins}-{team.losses}{#if team.ties > 0}-{team.ties}{/if}
                </div>
              </div>
              
              <div class="bg-slate-700/30 rounded-lg p-3">
                <div class="text-slate-400 text-xs mb-1">Points For</div>
                <div class="font-mono font-semibold text-green-400">
                  {team.points_for ? Number(team.points_for).toFixed(1) : '0.0'}
                </div>
              </div>
              
              <div class="bg-slate-700/30 rounded-lg p-3 col-span-2">
                <div class="text-slate-400 text-xs mb-1">Points Against</div>
                <div class="font-mono font-semibold text-red-400">
                  {team.points_against ? Number(team.points_against).toFixed(1) : '0.0'}
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Legend -->
  <div class="max-w-6xl mx-auto mt-8 p-4 bg-slate-800/30 rounded-lg border border-slate-700">
    <h3 class="font-semibold mb-2">Playoff Status:</h3>
    <div class="flex flex-wrap gap-4 text-sm">
      <div class="flex items-center gap-2">
        <span class="text-xs bg-yellow-500 text-white px-2 py-1 rounded">🏆 Champion</span>
        <span class="text-slate-400">- Won championship</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs bg-blue-500 text-white px-2 py-1 rounded">Playoffs</span>
        <span class="text-slate-400">- Made playoffs</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs bg-slate-600 text-white px-2 py-1 rounded">Missed</span>
        <span class="text-slate-400">- Missed playoffs</span>
      </div>
    </div>
  </div>
</div>

<style>
  /* Mobile-specific adjustments */
  @media (max-width: 768px) {
    h1 {
      font-size: 2rem;
      line-height: 1.2;
    }
  }
</style>