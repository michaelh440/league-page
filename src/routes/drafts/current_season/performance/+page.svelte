<script>
    import { onMount, onDestroy } from 'svelte';
    import { browser } from '$app/environment';
    import { getTeamNameFromTeamManagers, getAvatarFromTeamManagers } from '$lib/utils/helperFunctions/universalFunctions';
    
    export let data;
    
    const { 
        draftPickStats, 
        currentDraft, 
        leagueTeamManagersData, 
        playersData, 
        currentWeek, 
        year,
        draftType,
        managerPointsBreakdown,
        chartData,
        message,
        error 
    } = data;

    // Chart.js loaded dynamically
    let Chart = null;
    let roundChartCanvas;
    let positionChartCanvas;
    let managerChartCanvas;
    let weeklyChartCanvas;
    let roundChart = null;
    let positionChart = null;
    let managerChart = null;
    let weeklyChart = null;

    // Sorting state
    let sortField = 'totalPoints';
    let sortDirection = 'desc';
    
    // Filter state
    let positionFilter = 'ALL';
    let managerFilter = 'ALL';
    let searchQuery = '';
    let showValueOnly = false;

    // Expanded rows state
    let expandedRows = new Set();

    // Active tab
    let activeTab = 'table'; // 'table', 'charts', 'value'

    // Get unique positions and managers for filters
    $: positions = ['ALL', ...new Set(draftPickStats.map(p => p.position).filter(p => p && p !== 'Unknown'))];
    
    $: managers = ['ALL', ...new Set(draftPickStats.map(p => {
        try {
            return getTeamNameFromTeamManagers(leagueTeamManagersData, p.drafterRosterID, year);
        } catch {
            return `Team ${p.drafterRosterID}`;
        }
    }))];

    // Filtered and sorted picks
    $: filteredPicks = draftPickStats
        .filter(pick => {
            if (positionFilter !== 'ALL' && pick.position !== positionFilter) return false;
            
            if (managerFilter !== 'ALL') {
                let teamName;
                try {
                    teamName = getTeamNameFromTeamManagers(leagueTeamManagersData, pick.drafterRosterID, year);
                } catch {
                    teamName = `Team ${pick.drafterRosterID}`;
                }
                if (teamName !== managerFilter) return false;
            }
            
            if (showValueOnly && (!pick.adpDiff || pick.adpDiff <= 0)) return false;
            
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return pick.playerName.toLowerCase().includes(query) || 
                       pick.position.toLowerCase().includes(query) ||
                       pick.team.toLowerCase().includes(query);
            }
            
            return true;
        })
        .sort((a, b) => {
            let aVal = a[sortField];
            let bVal = b[sortField];
            
            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }
            
            // Handle null values
            if (aVal === null) aVal = sortDirection === 'asc' ? Infinity : -Infinity;
            if (bVal === null) bVal = sortDirection === 'asc' ? Infinity : -Infinity;
            
            if (sortDirection === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });

    // Summary stats
    $: totalDraftPoints = draftPickStats.reduce((sum, p) => sum + p.totalPoints, 0);
    $: avgPointsPerPick = draftPickStats.length > 0 
        ? Math.round((totalDraftPoints / draftPickStats.length) * 100) / 100 
        : 0;
    $: topPick = draftPickStats.length > 0 
        ? [...draftPickStats].sort((a, b) => b.totalPoints - a.totalPoints)[0] 
        : null;
    $: biggestValue = draftPickStats.length > 0 
        ? [...draftPickStats].filter(p => p.adpDiff !== null).sort((a, b) => b.adpDiff - a.adpDiff)[0] 
        : null;

    function handleSort(field) {
        if (sortField === field) {
            sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            sortField = field;
            sortDirection = 'desc';
        }
    }

    function getSortIcon(field) {
        if (sortField !== field) return '↕';
        return sortDirection === 'asc' ? '↑' : '↓';
    }

    function toggleRow(playerId) {
        if (expandedRows.has(playerId)) {
            expandedRows.delete(playerId);
        } else {
            expandedRows.add(playerId);
        }
        expandedRows = expandedRows; // Trigger reactivity
    }

    function getManagerName(rosterID) {
        try {
            return getTeamNameFromTeamManagers(leagueTeamManagersData, rosterID, year);
        } catch {
            return `Team ${rosterID}`;
        }
    }

    function getManagerAvatar(rosterID) {
        try {
            return getAvatarFromTeamManagers(leagueTeamManagersData, rosterID, year);
        } catch {
            return 'https://sleepercdn.com/images/v2/icons/player_default.webp';
        }
    }

    function getPositionClass(position) {
        const posClasses = {
            'QB': 'pos-qb',
            'RB': 'pos-rb',
            'WR': 'pos-wr',
            'TE': 'pos-te',
            'K': 'pos-k',
            'DEF': 'pos-def'
        };
        return posClasses[position] || 'pos-default';
    }

    function getPlayerImage(playerId, position) {
        if (position === 'DEF') {
            return `https://sleepercdn.com/images/team_logos/nfl/${playerId.toLowerCase()}.png`;
        }
        return `https://sleepercdn.com/content/nfl/players/thumb/${playerId}.jpg`;
    }

    function formatPoints(pts) {
        if (pts === null || pts === undefined) return '-';
        return pts.toFixed(2);
    }

    function getValueClass(adpDiff) {
        if (adpDiff === null) return '';
        if (adpDiff >= 20) return 'value-great';
        if (adpDiff >= 10) return 'value-good';
        if (adpDiff >= 0) return 'value-ok';
        if (adpDiff >= -10) return 'value-below';
        return 'value-poor';
    }

    function getValueLabel(adpDiff) {
        if (adpDiff === null) return '-';
        if (adpDiff > 0) return `+${adpDiff}`;
        return adpDiff.toString();
    }

    // Chart colors
    const chartColors = [
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 99, 132, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(255, 159, 64, 0.8)',
        'rgba(153, 102, 255, 0.8)',
        'rgba(255, 205, 86, 0.8)',
        'rgba(201, 203, 207, 0.8)',
        'rgba(255, 99, 71, 0.8)',
        'rgba(60, 179, 113, 0.8)',
        'rgba(238, 130, 238, 0.8)',
        'rgba(106, 90, 205, 0.8)',
        'rgba(244, 164, 96, 0.8)'
    ];

    const positionColors = {
        'QB': 'rgba(255, 107, 107, 0.8)',
        'RB': 'rgba(78, 205, 196, 0.8)',
        'WR': 'rgba(69, 183, 209, 0.8)',
        'TE': 'rgba(247, 183, 49, 0.8)',
        'K': 'rgba(165, 94, 234, 0.8)',
        'DEF': 'rgba(119, 140, 163, 0.8)'
    };

    function createCharts() {
        if (!Chart || !chartData) return;

        // Points by Round Chart
        if (roundChartCanvas) {
            if (roundChart) roundChart.destroy();
            const rounds = Object.keys(chartData.avgPointsByRound).sort((a, b) => a - b);
            roundChart = new Chart(roundChartCanvas, {
                type: 'bar',
                data: {
                    labels: rounds.map(r => `Round ${r}`),
                    datasets: [{
                        label: 'Avg Points per Pick',
                        data: rounds.map(r => chartData.avgPointsByRound[r]),
                        backgroundColor: 'rgba(54, 162, 235, 0.8)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: { display: true, text: 'Average Points by Draft Round', font: { size: 16 } }
                    },
                    scales: {
                        y: { beginAtZero: true, title: { display: true, text: 'Points' } }
                    }
                }
            });
        }

        // Points by Position Chart
        if (positionChartCanvas) {
            if (positionChart) positionChart.destroy();
            const positions = Object.keys(chartData.pointsByPosition).filter(p => p !== 'Unknown');
            positionChart = new Chart(positionChartCanvas, {
                type: 'doughnut',
                data: {
                    labels: positions,
                    datasets: [{
                        data: positions.map(p => Math.round(chartData.pointsByPosition[p])),
                        backgroundColor: positions.map(p => positionColors[p] || 'rgba(200,200,200,0.8)')
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: { display: true, text: 'Total Points by Position', font: { size: 16 } },
                        legend: { position: 'right' }
                    }
                }
            });
        }

        // Points by Manager Chart
        if (managerChartCanvas) {
            if (managerChart) managerChart.destroy();
            const managerData = Object.entries(chartData.pointsByManager)
                .map(([rosterID, data]) => ({
                    name: getManagerName(rosterID),
                    drafted: Math.round(data.drafted),
                    lost: Math.round(data.total - data.drafted) // Points from their picks now on other teams
                }))
                .sort((a, b) => (b.drafted + b.lost) - (a.drafted + a.lost));

            managerChart = new Chart(managerChartCanvas, {
                type: 'bar',
                data: {
                    labels: managerData.map(m => m.name),
                    datasets: [
                        {
                            label: 'Points (Still on Team)',
                            data: managerData.map(m => m.drafted),
                            backgroundColor: 'rgba(75, 192, 192, 0.8)',
                            borderColor: 'rgba(75, 192, 192, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Points (Traded/Dropped)',
                            data: managerData.map(m => m.lost),
                            backgroundColor: 'rgba(255, 99, 132, 0.5)',
                            borderColor: 'rgba(255, 99, 132, 1)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: { display: true, text: 'Draft Pick Production by Manager', font: { size: 16 } }
                    },
                    scales: {
                        x: { stacked: true },
                        y: { stacked: true, beginAtZero: true, title: { display: true, text: 'Points' } }
                    }
                }
            });
        }

        // Weekly Totals Chart
        if (weeklyChartCanvas) {
            if (weeklyChart) weeklyChart.destroy();
            const weeks = Object.keys(chartData.weeklyTotals).sort((a, b) => a - b);
            weeklyChart = new Chart(weeklyChartCanvas, {
                type: 'line',
                data: {
                    labels: weeks.map(w => `Week ${w}`),
                    datasets: [{
                        label: 'Total Draft Pick Points',
                        data: weeks.map(w => chartData.weeklyTotals[w]),
                        borderColor: 'rgba(153, 102, 255, 1)',
                        backgroundColor: 'rgba(153, 102, 255, 0.2)',
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: { display: true, text: 'Weekly Point Production (All Draft Picks)', font: { size: 16 } }
                    },
                    scales: {
                        y: { beginAtZero: true, title: { display: true, text: 'Points' } }
                    }
                }
            });
        }
    }

    onMount(async () => {
        if (browser && chartData) {
            const chartModule = await import('chart.js/auto');
            Chart = chartModule.default;
            setTimeout(createCharts, 100);
        }
    });

    onDestroy(() => {
        if (roundChart) roundChart.destroy();
        if (positionChart) positionChart.destroy();
        if (managerChart) managerChart.destroy();
        if (weeklyChart) weeklyChart.destroy();
    });

    // Update charts when tab changes to charts
    $: if (activeTab === 'charts' && Chart) {
        setTimeout(createCharts, 100);
    }
</script>

<style>
    .container {
        max-width: 1400px;
        margin: 0 auto;
        padding: 20px;
    }

    h1 {
        text-align: center;
        margin-bottom: 10px;
        color: var(--header-text, #333);
    }

    .subtitle {
        text-align: center;
        color: #666;
        margin-bottom: 30px;
    }

    .message, .error {
        text-align: center;
        padding: 40px;
        font-style: italic;
    }
    .error { color: #d32f2f; }
    .message { color: #666; }

    /* Tabs */
    .tabs {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin-bottom: 25px;
        flex-wrap: wrap;
    }

    .tab-btn {
        padding: 10px 25px;
        border: 2px solid #ddd;
        background: white;
        border-radius: 25px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
    }

    .tab-btn:hover {
        border-color: #1a73e8;
        color: #1a73e8;
    }

    .tab-btn.active {
        background: #1a73e8;
        border-color: #1a73e8;
        color: white;
    }

    /* Summary Cards */
    .summary-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 15px;
        margin-bottom: 25px;
    }

    .summary-card {
        background: var(--card-bg, #fff);
        border-radius: 12px;
        padding: 15px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        text-align: center;
    }

    .summary-card .label {
        font-size: 0.8em;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .summary-card .value {
        font-size: 1.6em;
        font-weight: bold;
        color: var(--primary-color, #1a73e8);
        margin: 5px 0;
    }

    .summary-card .detail {
        font-size: 0.85em;
        color: #888;
    }

    .summary-card.highlight {
        background: linear-gradient(135deg, #1a73e8 0%, #4285f4 100%);
        color: white;
    }

    .summary-card.highlight .label,
    .summary-card.highlight .detail { color: rgba(255,255,255,0.8); }
    .summary-card.highlight .value { color: white; }

    /* Filters */
    .filters {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-bottom: 15px;
        padding: 15px;
        background: var(--card-bg, #f5f5f5);
        border-radius: 8px;
        align-items: flex-end;
    }

    .filter-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .filter-group label {
        font-size: 0.75em;
        color: #666;
        text-transform: uppercase;
    }

    .filter-group select,
    .filter-group input[type="text"] {
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 0.9em;
        min-width: 140px;
    }

    .filter-group.checkbox {
        flex-direction: row;
        align-items: center;
        gap: 8px;
    }

    .search-input { flex-grow: 1; min-width: 180px; }

    .results-count {
        text-align: right;
        color: #666;
        font-size: 0.85em;
        margin-bottom: 8px;
    }

    /* Table */
    .table-container {
        overflow-x: auto;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    table {
        width: 100%;
        border-collapse: collapse;
        background: var(--card-bg, #fff);
    }

    th {
        background: var(--header-bg, #f8f9fa);
        padding: 10px 6px;
        text-align: left;
        font-weight: 600;
        font-size: 0.8em;
        color: #555;
        text-transform: uppercase;
        cursor: pointer;
        user-select: none;
        white-space: nowrap;
        border-bottom: 2px solid #e0e0e0;
    }

    th:hover { background: #e8e8e8; }
    th .sort-icon { margin-left: 4px; opacity: 0.5; }

    td {
        padding: 8px 6px;
        border-bottom: 1px solid #eee;
        vertical-align: middle;
    }

    tr:hover { background: #f8f9fa; }
    tr.expanded { background: #f0f7ff; }

    /* Expandable row */
    .expand-btn {
        cursor: pointer;
        padding: 4px 8px;
        background: #f0f0f0;
        border: none;
        border-radius: 4px;
        font-size: 0.9em;
    }
    .expand-btn:hover { background: #e0e0e0; }

    .weekly-breakdown {
        background: #fafafa;
        border-top: 1px dashed #ddd;
    }

    .weekly-breakdown td {
        padding: 12px;
    }

    .weekly-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: 8px;
        max-width: 900px;
    }

    .week-cell {
        padding: 8px;
        background: white;
        border-radius: 6px;
        text-align: center;
        border: 1px solid #eee;
    }

    .week-cell.different-owner {
        border-color: #ff9800;
        background: #fff8e1;
    }

    .week-cell .week-num {
        font-size: 0.75em;
        color: #888;
        display: block;
    }

    .week-cell .week-pts {
        font-weight: 600;
        font-size: 1.1em;
    }

    .week-cell .week-owner {
        font-size: 0.7em;
        color: #666;
        margin-top: 2px;
    }

    /* Player cell */
    .player-cell {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .player-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        object-fit: cover;
        background: #f0f0f0;
    }

    .player-info { display: flex; flex-direction: column; }
    .player-name { font-weight: 500; font-size: 0.95em; }
    .player-team { font-size: 0.75em; color: #888; }

    /* Manager cell */
    .manager-cell {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .manager-avatar {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        object-fit: cover;
    }

    .manager-name { font-size: 0.85em; }

    /* Position badge */
    .position-badge {
        display: inline-block;
        padding: 3px 6px;
        border-radius: 4px;
        font-size: 0.75em;
        font-weight: 600;
        color: white;
    }

    .pos-qb { background: #ff6b6b; }
    .pos-rb { background: #4ecdc4; }
    .pos-wr { background: #45b7d1; }
    .pos-te { background: #f7b731; }
    .pos-k { background: #a55eea; }
    .pos-def { background: #778ca3; }
    .pos-default { background: #999; }

    /* Points styling */
    .points { font-weight: 600; }
    .ppg { color: #666; font-size: 0.85em; }

    /* Value styling */
    .value-badge {
        display: inline-block;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 0.8em;
        font-weight: 600;
    }
    .value-great { background: #c8e6c9; color: #2e7d32; }
    .value-good { background: #dcedc8; color: #558b2f; }
    .value-ok { background: #fff3e0; color: #f57c00; }
    .value-below { background: #ffe0b2; color: #ef6c00; }
    .value-poor { background: #ffcdd2; color: #c62828; }

    /* Pick number */
    .pick-info {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .pick-num { font-weight: bold; font-size: 1em; }
    .pick-round { font-size: 0.7em; color: #888; }

    /* Charts Section */
    .charts-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        gap: 20px;
        margin-bottom: 30px;
    }

    .chart-container {
        background: white;
        border-radius: 12px;
        padding: 15px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        height: 350px;
    }

    /* Value Analysis Section */
    .value-section {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
        gap: 20px;
    }

    .value-card {
        background: white;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .value-card h3 {
        margin: 0 0 15px 0;
        font-size: 1.1em;
        color: #333;
    }

    .value-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .value-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px;
        background: #f8f9fa;
        border-radius: 8px;
    }

    .value-rank {
        font-weight: bold;
        font-size: 1.2em;
        color: #888;
        width: 25px;
    }

    .value-player-info { flex: 1; }
    .value-player-name { font-weight: 500; }
    .value-player-detail { font-size: 0.8em; color: #666; }

    .value-stats { text-align: right; }
    .value-points { font-weight: 600; font-size: 1.1em; }
    .value-diff { font-size: 0.85em; }

    /* Responsive */
    @media (max-width: 768px) {
        .summary-cards { grid-template-columns: repeat(2, 1fr); }
        .filters { flex-direction: column; }
        .filter-group select, .filter-group input { width: 100%; }
        th, td { padding: 6px 4px; font-size: 0.8em; }
        .player-avatar { width: 28px; height: 28px; }
        .hide-mobile { display: none; }
        .charts-grid { grid-template-columns: 1fr; }
        .chart-container { height: 280px; }
        .value-section { grid-template-columns: 1fr; }
    }

    @media (max-width: 480px) {
        .summary-cards { grid-template-columns: 1fr; }
        .tabs { gap: 5px; }
        .tab-btn { padding: 8px 15px; font-size: 0.85em; }
    }
</style>

<div class="container">
    <h1>🏈 {year} Draft Pick Performance</h1>
    <p class="subtitle">
        {#if currentWeek > 0}
            Fantasy points through Week {currentWeek} • {draftType === 'auction' ? 'Auction' : 'Snake'} Draft
        {:else}
            Draft Results
        {/if}
    </p>

    {#if error}
        <p class="error">{error}</p>
    {:else if message}
        <p class="message">{message}</p>
    {:else if draftPickStats.length === 0}
        <p class="message">No draft data available yet.</p>
    {:else}
        <!-- Summary Cards -->
        <div class="summary-cards">
            <div class="summary-card highlight">
                <div class="label">Total Draft Points</div>
                <div class="value">{formatPoints(totalDraftPoints)}</div>
                <div class="detail">{draftPickStats.length} picks</div>
            </div>
            
            <div class="summary-card">
                <div class="label">Avg Points/Pick</div>
                <div class="value">{formatPoints(avgPointsPerPick)}</div>
                <div class="detail">Through Week {currentWeek}</div>
            </div>

            {#if topPick}
                <div class="summary-card">
                    <div class="label">Top Performer</div>
                    <div class="value">{formatPoints(topPick.totalPoints)}</div>
                    <div class="detail">{topPick.playerName}</div>
                </div>
            {/if}

            {#if biggestValue && biggestValue.adpDiff > 0}
                <div class="summary-card">
                    <div class="label">Best Value</div>
                    <div class="value">+{biggestValue.adpDiff}</div>
                    <div class="detail">{biggestValue.playerName}</div>
                </div>
            {/if}
        </div>

        <!-- Tabs -->
        <div class="tabs">
            <button class="tab-btn" class:active={activeTab === 'table'} on:click={() => activeTab = 'table'}>
                📋 Draft Table
            </button>
            <button class="tab-btn" class:active={activeTab === 'charts'} on:click={() => activeTab = 'charts'}>
                📊 Charts
            </button>
            <button class="tab-btn" class:active={activeTab === 'value'} on:click={() => activeTab = 'value'}>
                💎 Value Analysis
            </button>
        </div>

        <!-- Table Tab -->
        {#if activeTab === 'table'}
            <div class="filters">
                <div class="filter-group">
                    <label>Position</label>
                    <select bind:value={positionFilter}>
                        {#each positions as pos}
                            <option value={pos}>{pos}</option>
                        {/each}
                    </select>
                </div>

                <div class="filter-group">
                    <label>Drafter</label>
                    <select bind:value={managerFilter}>
                        {#each managers as manager}
                            <option value={manager}>{manager}</option>
                        {/each}
                    </select>
                </div>

                <div class="filter-group checkbox">
                    <input type="checkbox" id="valueOnly" bind:checked={showValueOnly} />
                    <label for="valueOnly">Value picks only</label>
                </div>

                <div class="filter-group search-input">
                    <label>Search</label>
                    <input 
                        type="text" 
                        placeholder="Search player, position, team..."
                        bind:value={searchQuery}
                    />
                </div>
            </div>

            <div class="results-count">
                Showing {filteredPicks.length} of {draftPickStats.length} picks
            </div>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th style="width: 40px;"></th>
                            {#if draftType !== 'auction'}
                                <th on:click={() => handleSort('pickNumber')}>
                                    Pick <span class="sort-icon">{getSortIcon('pickNumber')}</span>
                                </th>
                            {:else}
                                <th on:click={() => handleSort('auctionAmount')}>
                                    $ <span class="sort-icon">{getSortIcon('auctionAmount')}</span>
                                </th>
                            {/if}
                            <th on:click={() => handleSort('playerName')}>
                                Player <span class="sort-icon">{getSortIcon('playerName')}</span>
                            </th>
                            <th on:click={() => handleSort('position')}>
                                Pos <span class="sort-icon">{getSortIcon('position')}</span>
                            </th>
                            <th>Drafter</th>
                            <th on:click={() => handleSort('totalPoints')}>
                                Total <span class="sort-icon">{getSortIcon('totalPoints')}</span>
                            </th>
                            <th on:click={() => handleSort('drafterPoints')}>
                                Drafter Pts <span class="sort-icon">{getSortIcon('drafterPoints')}</span>
                            </th>
                            <th on:click={() => handleSort('ppg')} class="hide-mobile">
                                PPG <span class="sort-icon">{getSortIcon('ppg')}</span>
                            </th>
                            <th on:click={() => handleSort('adpDiff')} class="hide-mobile">
                                Value <span class="sort-icon">{getSortIcon('adpDiff')}</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each filteredPicks as pick (pick.playerId + '-' + pick.drafterRosterID)}
                            <tr class:expanded={expandedRows.has(pick.playerId)}>
                                <td>
                                    <button class="expand-btn" on:click={() => toggleRow(pick.playerId)}>
                                        {expandedRows.has(pick.playerId) ? '▼' : '▶'}
                                    </button>
                                </td>
                                {#if draftType !== 'auction'}
                                    <td>
                                        <div class="pick-info">
                                            <span class="pick-num">{pick.pickNumber}</span>
                                            <span class="pick-round">Rd {pick.round}</span>
                                        </div>
                                    </td>
                                {:else}
                                    <td><span style="font-weight: 600; color: #2e7d32;">${pick.auctionAmount}</span></td>
                                {/if}
                                <td>
                                    <div class="player-cell">
                                        <img 
                                            class="player-avatar" 
                                            src={getPlayerImage(pick.playerId, pick.position)}
                                            alt={pick.playerName}
                                            on:error={(e) => e.currentTarget.src = 'https://sleepercdn.com/images/v2/icons/player_default.webp'}
                                        />
                                        <div class="player-info">
                                            <span class="player-name">{pick.playerName}</span>
                                            <span class="player-team">{pick.team}</span>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span class="position-badge {getPositionClass(pick.position)}">{pick.position}</span>
                                </td>
                                <td>
                                    <div class="manager-cell">
                                        <img 
                                            class="manager-avatar" 
                                            src={getManagerAvatar(pick.drafterRosterID)}
                                            alt="Manager"
                                            on:error={(e) => e.currentTarget.src = 'https://sleepercdn.com/images/v2/icons/player_default.webp'}
                                        />
                                        <span class="manager-name">{getManagerName(pick.drafterRosterID)}</span>
                                    </div>
                                </td>
                                <td><span class="points">{formatPoints(pick.totalPoints)}</span></td>
                                <td>
                                    <span class="points" style="color: {pick.drafterPoints < pick.totalPoints ? '#f57c00' : '#2e7d32'}">
                                        {formatPoints(pick.drafterPoints)}
                                    </span>
                                </td>
                                <td class="hide-mobile"><span class="ppg">{formatPoints(pick.ppg)}</span></td>
                                <td class="hide-mobile">
                                    {#if pick.adpDiff !== null}
                                        <span class="value-badge {getValueClass(pick.adpDiff)}">
                                            {getValueLabel(pick.adpDiff)}
                                        </span>
                                    {:else}
                                        -
                                    {/if}
                                </td>
                            </tr>
                            
                            <!-- Expanded weekly breakdown -->
                            {#if expandedRows.has(pick.playerId)}
                                <tr class="weekly-breakdown">
                                    <td colspan="10">
                                        <strong style="display: block; margin-bottom: 10px;">
                                            Weekly Breakdown for {pick.playerName}
                                            {#if Object.keys(pick.pointsByOwner).length > 1}
                                                <span style="color: #f57c00; font-weight: normal; font-size: 0.9em;">
                                                    (Multiple owners)
                                                </span>
                                            {/if}
                                        </strong>
                                        <div class="weekly-grid">
                                            {#each Array(currentWeek).fill().map((_, i) => i + 1) as week}
                                                {@const weekData = pick.weeklyBreakdown[week]}
                                                {@const isDifferentOwner = weekData?.rosterID && weekData.rosterID != pick.drafterRosterID}
                                                <div class="week-cell" class:different-owner={isDifferentOwner}>
                                                    <span class="week-num">Week {week}</span>
                                                    <span class="week-pts">
                                                        {weekData?.points ? formatPoints(weekData.points) : '-'}
                                                    </span>
                                                    {#if weekData?.rosterID}
                                                        <span class="week-owner">
                                                            {getManagerName(weekData.rosterID)}
                                                        </span>
                                                    {:else}
                                                        <span class="week-owner" style="color: #999;">Free Agent</span>
                                                    {/if}
                                                </div>
                                            {/each}
                                        </div>
                                        
                                        <!-- Points by owner summary -->
                                        {#if Object.keys(pick.pointsByOwner).length > 0}
                                            <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #ddd;">
                                                <strong style="font-size: 0.9em;">Points by Owner:</strong>
                                                <div style="display: flex; gap: 15px; flex-wrap: wrap; margin-top: 8px;">
                                                    {#each Object.entries(pick.pointsByOwner) as [rosterID, pts]}
                                                        <div style="display: flex; align-items: center; gap: 6px; padding: 5px 10px; background: {rosterID == pick.drafterRosterID ? '#e8f5e9' : '#fff3e0'}; border-radius: 6px;">
                                                            <img 
                                                                src={getManagerAvatar(rosterID)} 
                                                                alt="" 
                                                                style="width: 20px; height: 20px; border-radius: 50%;"
                                                                on:error={(e) => e.currentTarget.src = 'https://sleepercdn.com/images/v2/icons/player_default.webp'}
                                                            />
                                                            <span style="font-size: 0.85em;">
                                                                {getManagerName(rosterID)}: <strong>{formatPoints(pts)}</strong>
                                                                {#if rosterID == pick.drafterRosterID}
                                                                    <span style="font-size: 0.75em; color: #2e7d32;">(drafter)</span>
                                                                {/if}
                                                            </span>
                                                        </div>
                                                    {/each}
                                                </div>
                                            </div>
                                        {/if}
                                    </td>
                                </tr>
                            {/if}
                        {/each}
                    </tbody>
                </table>
            </div>
        {/if}

        <!-- Charts Tab -->
        {#if activeTab === 'charts'}
            <div class="charts-grid">
                <div class="chart-container">
                    <canvas bind:this={roundChartCanvas}></canvas>
                </div>
                <div class="chart-container">
                    <canvas bind:this={positionChartCanvas}></canvas>
                </div>
                <div class="chart-container">
                    <canvas bind:this={managerChartCanvas}></canvas>
                </div>
                <div class="chart-container">
                    <canvas bind:this={weeklyChartCanvas}></canvas>
                </div>
            </div>
        {/if}

        <!-- Value Analysis Tab -->
        {#if activeTab === 'value'}
            <div class="value-section">
                <div class="value-card">
                    <h3>🌟 Best Value Picks</h3>
                    <p style="font-size: 0.85em; color: #666; margin-bottom: 15px;">
                        Players outperforming their draft position
                    </p>
                    <div class="value-list">
                        {#each (chartData?.valuePicks || []).slice(0, 10) as pick, i}
                            <div class="value-item">
                                <span class="value-rank">{i + 1}</span>
                                <img 
                                    class="player-avatar" 
                                    src={getPlayerImage(pick.playerId, pick.position)}
                                    alt=""
                                    style="width: 40px; height: 40px;"
                                    on:error={(e) => e.currentTarget.src = 'https://sleepercdn.com/images/v2/icons/player_default.webp'}
                                />
                                <div class="value-player-info">
                                    <div class="value-player-name">{pick.playerName}</div>
                                    <div class="value-player-detail">
                                        Pick #{pick.pickNumber} • {pick.position} • {getManagerName(pick.drafterRosterID)}
                                    </div>
                                </div>
                                <div class="value-stats">
                                    <div class="value-points">{formatPoints(pick.totalPoints)}</div>
                                    <div class="value-diff value-great">+{pick.adpDiff}</div>
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>

                <div class="value-card">
                    <h3>💔 Biggest Busts (Rounds 1-5)</h3>
                    <p style="font-size: 0.85em; color: #666; margin-bottom: 15px;">
                        Early picks with lowest production
                    </p>
                    <div class="value-list">
                        {#each (chartData?.bustPicks || []).slice(0, 10) as pick, i}
                            <div class="value-item">
                                <span class="value-rank">{i + 1}</span>
                                <img 
                                    class="player-avatar" 
                                    src={getPlayerImage(pick.playerId, pick.position)}
                                    alt=""
                                    style="width: 40px; height: 40px;"
                                    on:error={(e) => e.currentTarget.src = 'https://sleepercdn.com/images/v2/icons/player_default.webp'}
                                />
                                <div class="value-player-info">
                                    <div class="value-player-name">{pick.playerName}</div>
                                    <div class="value-player-detail">
                                        Pick #{pick.pickNumber} (Rd {pick.round}) • {pick.position} • {getManagerName(pick.drafterRosterID)}
                                    </div>
                                </div>
                                <div class="value-stats">
                                    <div class="value-points" style="color: #c62828;">{formatPoints(pick.totalPoints)}</div>
                                    <div class="value-diff" style="color: #888;">{pick.gamesPlayed} GP</div>
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            </div>
        {/if}
    {/if}
</div>