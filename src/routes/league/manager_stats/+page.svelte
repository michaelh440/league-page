<script>
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import StatsLayout from '$lib/components/StatsLayout.svelte';
  import StatCard from '$lib/components/StatCard.svelte';
  import Chart from 'chart.js/auto';

  export let data;

  // Navigation items
  const navItems = [
    { label: "All Time Scoring", href: "/league/all_time_stats" },
    { label: "Regular Season Scoring", href: "/league/reg_season_stats" },
    { label: "Playoff Scoring", href: "/league/playoff_stats" },
    { label: "Streaks", href: "/league/streaks" },
    { label: "Manager Stats", href: "/league/manager_stats", active: true },
    { label: "Ranking", href: "/league/ranking" },
    { label: "Rivalries", href: "/league/rivalries" },
    { label: "Draft Room", href: "/drafts/previous_seasons" }
  ];

  // State
  let selectedSeason = data.selectedSeasonId;
  let selectedManagers = [];
  let includePlayoffs = false;
  let isManagerDropdownOpen = false;

  // Chart instances
  let avgPointsChart = null;
  let avgMarginChart = null;
  let weeklyMarginChart = null;

  // Chart canvas references
  let avgPointsCanvas;
  let avgMarginCanvas;
  let weeklyMarginCanvas;

  // Predefined colors for managers (up to 12)
  const managerColors = [
    { bg: 'rgba(54, 162, 235, 0.2)', border: 'rgb(54, 162, 235)' },
    { bg: 'rgba(255, 99, 132, 0.2)', border: 'rgb(255, 99, 132)' },
    { bg: 'rgba(75, 192, 192, 0.2)', border: 'rgb(75, 192, 192)' },
    { bg: 'rgba(255, 159, 64, 0.2)', border: 'rgb(255, 159, 64)' },
    { bg: 'rgba(153, 102, 255, 0.2)', border: 'rgb(153, 102, 255)' },
    { bg: 'rgba(255, 205, 86, 0.2)', border: 'rgb(255, 205, 86)' },
    { bg: 'rgba(201, 203, 207, 0.2)', border: 'rgb(201, 203, 207)' },
    { bg: 'rgba(255, 99, 255, 0.2)', border: 'rgb(255, 99, 255)' },
    { bg: 'rgba(99, 255, 132, 0.2)', border: 'rgb(99, 255, 132)' },
    { bg: 'rgba(132, 99, 255, 0.2)', border: 'rgb(132, 99, 255)' },
    { bg: 'rgba(255, 132, 99, 0.2)', border: 'rgb(255, 132, 99)' },
    { bg: 'rgba(99, 255, 255, 0.2)', border: 'rgb(99, 255, 255)' }
  ];

  // Get color for a manager based on their index in selection
  function getManagerColor(managerId) {
    const index = selectedManagers.indexOf(managerId);
    return managerColors[index % managerColors.length];
  }

  // Build labels for x-axis (weeks + playoff rounds)
  function buildLabels(managerData, includePlayoffs) {
    const labels = new Set();
    managerData.forEach(row => {
      if (!includePlayoffs && row.game_type === 'playoff') return;
      const label = row.game_type === 'playoff' 
        ? `P${row.week}` 
        : `W${row.week}`;
      labels.add(label);
    });
    return Array.from(labels).sort((a, b) => {
      const aIsPlayoff = a.startsWith('P');
      const bIsPlayoff = b.startsWith('P');
      if (aIsPlayoff !== bIsPlayoff) return aIsPlayoff ? 1 : -1;
      return parseInt(a.slice(1)) - parseInt(b.slice(1));
    });
  }

  // Filter data for selected managers and playoff toggle
  function filterData(allData, managerId, includePlayoffs) {
    return allData.filter(row => {
      if (row.manager_id !== managerId) return false;
      if (!includePlayoffs && row.game_type === 'playoff') return false;
      return true;
    });
  }

  // Create/update Average Points Chart
  function updateAvgPointsChart() {
    if (!avgPointsCanvas) return;
    
    if (avgPointsChart) {
      avgPointsChart.destroy();
    }

    if (selectedManagers.length === 0) {
      return;
    }

    // Get all data for selected managers
    const allManagerData = data.avgPointsData.filter(row => 
      selectedManagers.includes(row.manager_id)
    );
    
    const labels = buildLabels(allManagerData, includePlayoffs);
    
    const datasets = selectedManagers.map(managerId => {
      const managerData = filterData(data.avgPointsData, managerId, includePlayoffs);
      const managerInfo = data.managers.find(m => m.manager_id === managerId);
      const color = getManagerColor(managerId);
      
      const dataPoints = labels.map(label => {
        const isPlayoff = label.startsWith('P');
        const week = parseInt(label.slice(1));
        const row = managerData.find(r => 
          r.week === week && 
          (isPlayoff ? r.game_type === 'playoff' : r.game_type === 'regular')
        );
        if (!row) return null;
        return includePlayoffs ? row.running_avg_points_all : row.running_avg_points_reg;
      });

      return {
        label: managerInfo?.manager_name || `Manager ${managerId}`,
        data: dataPoints,
        borderColor: color.border,
        backgroundColor: color.bg,
        tension: 0.3,
        fill: false,
        spanGaps: true
      };
    });

    avgPointsChart = new Chart(avgPointsCanvas, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Running Average Points Scored',
            font: { size: 16, weight: 'bold' }
          },
          legend: {
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.dataset.label}: ${context.parsed.y?.toFixed(2) || 'N/A'}`
            }
          }
        },
        scales: {
          y: {
            title: {
              display: true,
              text: 'Points'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Week'
            }
          }
        }
      }
    });
  }

  // Create/update Average Margin Chart
  function updateAvgMarginChart() {
    if (!avgMarginCanvas) return;
    
    if (avgMarginChart) {
      avgMarginChart.destroy();
    }

    if (selectedManagers.length === 0) {
      return;
    }

    const allManagerData = data.avgMarginData.filter(row => 
      selectedManagers.includes(row.manager_id)
    );
    
    const labels = buildLabels(allManagerData, includePlayoffs);
    
    const datasets = selectedManagers.map(managerId => {
      const managerData = filterData(data.avgMarginData, managerId, includePlayoffs);
      const managerInfo = data.managers.find(m => m.manager_id === managerId);
      const color = getManagerColor(managerId);
      
      const dataPoints = labels.map(label => {
        const isPlayoff = label.startsWith('P');
        const week = parseInt(label.slice(1));
        const row = managerData.find(r => 
          r.week === week && 
          (isPlayoff ? r.game_type === 'playoff' : r.game_type === 'regular')
        );
        if (!row) return null;
        return includePlayoffs ? row.running_avg_margin_all : row.running_avg_margin_reg;
      });

      return {
        label: managerInfo?.manager_name || `Manager ${managerId}`,
        data: dataPoints,
        borderColor: color.border,
        backgroundColor: color.bg,
        tension: 0.3,
        fill: false,
        spanGaps: true
      };
    });

    avgMarginChart = new Chart(avgMarginCanvas, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Running Average Margin of Victory',
            font: { size: 16, weight: 'bold' }
          },
          legend: {
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const val = context.parsed.y;
                if (val === null) return 'N/A';
                const sign = val >= 0 ? '+' : '';
                return `${context.dataset.label}: ${sign}${val.toFixed(2)}`;
              }
            }
          }
        },
        scales: {
          y: {
            title: {
              display: true,
              text: 'Margin'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Week'
            }
          }
        }
      }
    });
  }

  // Create/update Weekly Margin Bar Chart
  function updateWeeklyMarginChart() {
    if (!weeklyMarginCanvas) return;
    
    if (weeklyMarginChart) {
      weeklyMarginChart.destroy();
    }

    if (selectedManagers.length === 0) {
      return;
    }

    const allManagerData = data.weeklyMarginsData.filter(row => 
      selectedManagers.includes(row.manager_id)
    );
    
    const labels = buildLabels(allManagerData, includePlayoffs);
    
    const datasets = selectedManagers.map(managerId => {
      const managerData = filterData(data.weeklyMarginsData, managerId, includePlayoffs);
      const managerInfo = data.managers.find(m => m.manager_id === managerId);
      const color = getManagerColor(managerId);
      
      const dataPoints = labels.map(label => {
        const isPlayoff = label.startsWith('P');
        const week = parseInt(label.slice(1));
        const row = managerData.find(r => 
          r.week === week && 
          (isPlayoff ? r.game_type === 'playoff' : r.game_type === 'regular')
        );
        return row ? parseFloat(row.margin) : null;
      });

      // Color bars based on win/loss
      const bgColors = labels.map((label, i) => {
        const val = dataPoints[i];
        if (val === null) return 'rgba(200, 200, 200, 0.5)';
        return val >= 0 ? color.bg : color.bg.replace('0.2', '0.5');
      });

      const borderColors = labels.map((label, i) => {
        const val = dataPoints[i];
        if (val === null) return 'rgb(200, 200, 200)';
        return color.border;
      });

      return {
        label: managerInfo?.manager_name || `Manager ${managerId}`,
        data: dataPoints,
        backgroundColor: bgColors,
        borderColor: borderColors,
        borderWidth: 2
      };
    });

    weeklyMarginChart = new Chart(weeklyMarginCanvas, {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Actual Margin Each Week',
            font: { size: 16, weight: 'bold' }
          },
          legend: {
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const val = context.parsed.y;
                if (val === null) return 'N/A';
                const result = val > 0 ? 'W' : val < 0 ? 'L' : 'T';
                const sign = val >= 0 ? '+' : '';
                return `${context.dataset.label}: ${result} (${sign}${val.toFixed(2)})`;
              }
            }
          }
        },
        scales: {
          y: {
            title: {
              display: true,
              text: 'Margin'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Week'
            }
          }
        }
      }
    });
  }

  // Update all charts
  function updateCharts() {
    updateAvgPointsChart();
    updateAvgMarginChart();
    updateWeeklyMarginChart();
  }

  // Handle season change
  function handleSeasonChange(event) {
    const newSeasonId = event.target.value;
    goto(`?season=${newSeasonId}`, { replaceState: true });
  }

  // Toggle manager selection
  function toggleManager(managerId) {
    if (selectedManagers.includes(managerId)) {
      selectedManagers = selectedManagers.filter(id => id !== managerId);
    } else {
      selectedManagers = [...selectedManagers, managerId];
    }
  }

  // Select/deselect all managers
  function selectAllManagers() {
    if (selectedManagers.length === data.managers.length) {
      selectedManagers = [];
    } else {
      selectedManagers = data.managers.map(m => m.manager_id);
    }
  }

  // Close dropdown when clicking outside
  function handleClickOutside(event) {
    const dropdown = document.getElementById('manager-dropdown');
    if (dropdown && !dropdown.contains(event.target)) {
      isManagerDropdownOpen = false;
    }
  }

  // Reactive updates when selections change
  $: if (selectedManagers && avgPointsCanvas) {
    updateCharts();
  }

  $: if (includePlayoffs !== undefined && avgPointsCanvas) {
    updateCharts();
  }

  onMount(() => {
    // Default to first 2 managers selected if available
    if (data.managers.length >= 2) {
      selectedManagers = [data.managers[0].manager_id, data.managers[1].manager_id];
    } else if (data.managers.length === 1) {
      selectedManagers = [data.managers[0].manager_id];
    }
    
    document.addEventListener('click', handleClickOutside);
    
    // Small delay to ensure canvases are rendered
    setTimeout(updateCharts, 100);
  });

  onDestroy(() => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('click', handleClickOutside);
    }
    if (avgPointsChart) avgPointsChart.destroy();
    if (avgMarginChart) avgMarginChart.destroy();
    if (weeklyMarginChart) weeklyMarginChart.destroy();
  });
</script>

<StatsLayout title="Manager Stats" {navItems}>
  <!-- Controls Section -->
  <div class="controls-section">
    <!-- Season Selector -->
    <div class="control-group">
      <label for="season-select">Season</label>
      <select 
        id="season-select" 
        bind:value={selectedSeason} 
        on:change={handleSeasonChange}
      >
        {#each data.seasons as season}
          <option value={season.season_id}>
            {season.season_year} {season.is_active ? '(Current)' : ''}
          </option>
        {/each}
      </select>
    </div>

    <!-- Manager Multi-Select -->
    <div class="control-group" id="manager-dropdown">
      <label>Managers</label>
      <button 
        class="dropdown-trigger"
        on:click|stopPropagation={() => isManagerDropdownOpen = !isManagerDropdownOpen}
      >
        {selectedManagers.length === 0 
          ? 'Select managers...' 
          : `${selectedManagers.length} selected`}
        <span class="dropdown-arrow">{isManagerDropdownOpen ? '▲' : '▼'}</span>
      </button>
      
      {#if isManagerDropdownOpen}
        <div class="dropdown-menu">
          <button class="select-all-btn" on:click={selectAllManagers}>
            {selectedManagers.length === data.managers.length ? 'Deselect All' : 'Select All'}
          </button>
          <div class="dropdown-items">
            {#each data.managers as manager}
              <label class="dropdown-item">
                <input 
                  type="checkbox" 
                  checked={selectedManagers.includes(manager.manager_id)}
                  on:change={() => toggleManager(manager.manager_id)}
                />
                <span class="manager-option">
                  {#if manager.team_logo}
                    <img src={manager.team_logo} alt="" class="mini-logo" />
                  {/if}
                  {manager.manager_name}
                </span>
              </label>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    <!-- Include Playoffs Toggle -->
    <div class="control-group toggle-group">
      <label class="toggle-label">
        <input 
          type="checkbox" 
          bind:checked={includePlayoffs}
        />
        <span class="toggle-text">Include Playoffs</span>
      </label>
    </div>
  </div>

  <!-- Selected Managers Display -->
  {#if selectedManagers.length > 0}
    <div class="selected-managers">
      {#each selectedManagers as managerId, i}
        {@const manager = data.managers.find(m => m.manager_id === managerId)}
        {@const color = managerColors[i % managerColors.length]}
        <span 
          class="manager-tag"
          style="background-color: {color.bg}; border-color: {color.border};"
        >
          {#if manager?.team_logo}
            <img src={manager.team_logo} alt="" class="tag-logo" />
          {/if}
          {manager?.manager_name || 'Unknown'}
          <button class="remove-tag" on:click={() => toggleManager(managerId)}>×</button>
        </span>
      {/each}
    </div>
  {/if}

  <!-- Charts Grid -->
  <div class="charts-grid">
    <!-- Running Average Points Chart -->
    <StatCard size="full">
      <div class="chart-container">
        {#if selectedManagers.length === 0}
          <div class="no-selection">Select at least one manager to view chart</div>
        {:else}
          <canvas bind:this={avgPointsCanvas}></canvas>
        {/if}
      </div>
    </StatCard>

    <!-- Running Average Margin Chart -->
    <StatCard size="full">
      <div class="chart-container">
        {#if selectedManagers.length === 0}
          <div class="no-selection">Select at least one manager to view chart</div>
        {:else}
          <canvas bind:this={avgMarginCanvas}></canvas>
        {/if}
      </div>
    </StatCard>

    <!-- Weekly Margin Bar Chart -->
    <StatCard size="full">
      <div class="chart-container chart-container-tall">
        {#if selectedManagers.length === 0}
          <div class="no-selection">Select at least one manager to view chart</div>
        {:else}
          <canvas bind:this={weeklyMarginCanvas}></canvas>
        {/if}
      </div>
    </StatCard>
  </div>
</StatsLayout>

<style>
  .controls-section {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 8px;
    align-items: flex-end;
  }

  .control-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    position: relative;
  }

  .control-group label {
    font-weight: 600;
    font-size: 0.85rem;
    color: #495057;
  }

  .control-group select {
    padding: 0.5rem 1rem;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    font-size: 0.9rem;
    background: white;
    min-width: 150px;
  }

  .dropdown-trigger {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 1rem;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    font-size: 0.9rem;
    background: white;
    min-width: 180px;
    cursor: pointer;
  }

  .dropdown-trigger:hover {
    border-color: #adb5bd;
  }

  .dropdown-arrow {
    font-size: 0.7rem;
    margin-left: 0.5rem;
  }

  .dropdown-menu {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 100;
    max-height: 300px;
    overflow-y: auto;
    min-width: 220px;
  }

  .select-all-btn {
    width: 100%;
    padding: 0.6rem 1rem;
    background: #e9ecef;
    border: none;
    border-bottom: 1px solid #dee2e6;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 500;
  }

  .select-all-btn:hover {
    background: #dee2e6;
  }

  .dropdown-items {
    padding: 0.5rem 0;
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    padding: 0.5rem 1rem;
    cursor: pointer;
    gap: 0.5rem;
  }

  .dropdown-item:hover {
    background: #f8f9fa;
  }

  .dropdown-item input {
    cursor: pointer;
  }

  .manager-option {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .mini-logo {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    object-fit: cover;
  }

  .toggle-group {
    justify-content: flex-end;
  }

  .toggle-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    padding: 0.5rem 0;
  }

  .toggle-text {
    font-weight: 500;
  }

  .selected-managers {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }

  .manager-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.35rem 0.6rem;
    border-radius: 20px;
    font-size: 0.85rem;
    border: 2px solid;
  }

  .tag-logo {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    object-fit: cover;
  }

  .remove-tag {
    background: none;
    border: none;
    font-size: 1.1rem;
    cursor: pointer;
    padding: 0;
    margin-left: 0.2rem;
    line-height: 1;
    opacity: 0.6;
  }

  .remove-tag:hover {
    opacity: 1;
  }

  .charts-grid {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .chart-container {
    height: 350px;
    position: relative;
  }

  .chart-container-tall {
    height: 400px;
  }

  .no-selection {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #6c757d;
    font-style: italic;
  }

  /* Mobile Styles */
  @media (max-width: 768px) {
    .controls-section {
      flex-direction: column;
      gap: 1rem;
      padding: 0.75rem;
    }

    .control-group {
      width: 100%;
    }

    .control-group select,
    .dropdown-trigger {
      width: 100%;
    }

    .chart-container {
      height: 280px;
    }

    .chart-container-tall {
      height: 320px;
    }

    .selected-managers {
      gap: 0.4rem;
    }

    .manager-tag {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
    }
  }

  /* Tablet Styles */
  @media (max-width: 1024px) and (min-width: 769px) {
    .controls-section {
      gap: 1rem;
    }

    .chart-container {
      height: 320px;
    }
  }
</style>