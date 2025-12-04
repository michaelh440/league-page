<script>
    import { onMount, onDestroy } from 'svelte';
    import { browser } from '$app/environment';
    import { getTeamNameFromTeamManagers, getAvatarFromTeamManagers } from '$lib/utils/helperFunctions/universalFunctions';
    import StatsLayout from '$lib/components/StatsLayout.svelte';
    import StatCard from '$lib/components/StatCard.svelte';
    
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

    const navItems = [
        { label: "Draft Recap", href: "/drafts/current_season" },
        { label: "Draft Performance", href: "/drafts/current_season/performance", active: true },
        { label: "Previous Drafts", href: "/drafts/previous_seasons" }
    ];

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

    // Chart/Value filter state
    let chartManagerFilter = 'ALL';

    // Expanded rows state
    let expandedRows = new Set();

    // Active tab
    let activeTab = 'table';

    // Get unique positions and managers for filters
    $: positions = ['ALL', ...new Set(draftPickStats.map(p => p.position).filter(p => p && p !== 'Unknown'))];
    
    $: managerList = [...new Set(draftPickStats.map(p => {
        try {
            return { id: p.drafterRosterID, name: getTeamNameFromTeamManagers(leagueTeamManagersData, p.drafterRosterID, year) };
        } catch {
            return { id: p.drafterRosterID, name: `Team ${p.drafterRosterID}` };
        }
    }).map(m => JSON.stringify(m)))].map(s => JSON.parse(s));

    $: managers = ['ALL', ...managerList.map(m => m.name)];

    // Filtered picks for charts/value analysis
    $: chartFilteredPicks = chartManagerFilter === 'ALL' 
        ? draftPickStats 
        : draftPickStats.filter(pick => {
            const teamName = getManagerName(pick.drafterRosterID);
            return teamName === chartManagerFilter;
        });

    // Recalculate chart data when filter changes
    $: filteredChartData = calculateFilteredChartData(chartFilteredPicks, currentWeek);

    function calculateFilteredChartData(picks, weeks) {
        if (!picks || picks.length === 0) return null;

        // Points by Round
        const pointsByRound = {};
        const picksByRound = {};
        for (const pick of picks) {
            if (pick.round) {
                if (!pointsByRound[pick.round]) {
                    pointsByRound[pick.round] = 0;
                    picksByRound[pick.round] = 0;
                }
                pointsByRound[pick.round] += pick.totalPoints;
                picksByRound[pick.round]++;
            }
        }
        
        const avgPointsByRound = {};
        for (const round in pointsByRound) {
            avgPointsByRound[round] = Math.round((pointsByRound[round] / picksByRound[round]) * 100) / 100;
        }

        // Points by Position
        const pointsByPosition = {};
        const picksByPosition = {};
        for (const pick of picks) {
            const pos = pick.position;
            if (pos && pos !== 'Unknown') {
                if (!pointsByPosition[pos]) {
                    pointsByPosition[pos] = 0;
                    picksByPosition[pos] = 0;
                }
                pointsByPosition[pos] += pick.totalPoints;
                picksByPosition[pos]++;
            }
        }

        // Points by Manager
        const pointsByManager = {};
        for (const pick of picks) {
            const rosterID = pick.drafterRosterID;
            if (!pointsByManager[rosterID]) {
                pointsByManager[rosterID] = {
                    drafted: 0,
                    total: 0,
                    picksCount: 0
                };
            }
            pointsByManager[rosterID].drafted += pick.drafterPoints;
            pointsByManager[rosterID].total += pick.totalPoints;
            pointsByManager[rosterID].picksCount++;
        }

        // Weekly totals
        const weeklyTotals = {};
        for (let w = 1; w <= weeks; w++) {
            weeklyTotals[w] = 0;
            for (const pick of picks) {
                if (pick.weeklyBreakdown[w]) {
                    weeklyTotals[w] += pick.weeklyBreakdown[w].points || 0;
                }
            }
            weeklyTotals[w] = Math.round(weeklyTotals[w] * 100) / 100;
        }

        // Value picks
        const valuePicks = picks
            .filter(p => p.adpDiff !== null && p.totalPoints > 0 && p.pickNumber)
            .sort((a, b) => b.adpDiff - a.adpDiff)
            .slice(0, 10);

        // Bust picks
        const bustPicks = picks
            .filter(p => p.round && p.round <= 5)
            .sort((a, b) => a.totalPoints - b.totalPoints)
            .slice(0, 10);

        return {
            pointsByRound,
            avgPointsByRound,
            pointsByPosition,
            picksByPosition,
            pointsByManager,
            weeklyTotals,
            valuePicks,
            bustPicks
        };
    }

    // Filtered and sorted picks for table
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
        expandedRows = expandedRows;
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

    // Chart colors matching site theme
    const positionColors = {
        'QB': 'rgba(220, 53, 69, 0.8)',
        'RB': 'rgba(32, 201, 151, 0.8)',
        'WR': 'rgba(0, 123, 255, 0.8)',
        'TE': 'rgba(255, 193, 7, 0.8)',
        'K': 'rgba(111, 66, 193, 0.8)',
        'DEF': 'rgba(108, 117, 125, 0.8)'
    };

    function createCharts() {
        if (!Chart || !filteredChartData) return;

        // Points by Round Chart
        if (roundChartCanvas) {
            if (roundChart) roundChart.destroy();
            const rounds = Object.keys(filteredChartData.avgPointsByRound).sort((a, b) => a - b);
            roundChart = new Chart(roundChartCanvas, {
                type: 'bar',
                data: {
                    labels: rounds.map(r => `Rd ${r}`),
                    datasets: [{
                        label: 'Avg Points',
                        data: rounds.map(r => filteredChartData.avgPointsByRound[r]),
                        backgroundColor: 'rgba(0, 51, 102, 0.8)',
                        borderColor: 'rgba(0, 51, 102, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: { display: false },
                        legend: { display: false }
                    },
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });
        }

        // Points by Position Chart
        if (positionChartCanvas) {
            if (positionChart) positionChart.destroy();
            const positions = Object.keys(filteredChartData.pointsByPosition).filter(p => p !== 'Unknown');
            positionChart = new Chart(positionChartCanvas, {
                type: 'doughnut',
                data: {
                    labels: positions,
                    datasets: [{
                        data: positions.map(p => Math.round(filteredChartData.pointsByPosition[p])),
                        backgroundColor: positions.map(p => positionColors[p] || 'rgba(200,200,200,0.8)')
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: { display: false },
                        legend: { position: 'right' }
                    }
                }
            });
        }

        // Points by Manager Chart
        if (managerChartCanvas && chartManagerFilter === 'ALL') {
            if (managerChart) managerChart.destroy();
            const managerData = Object.entries(filteredChartData.pointsByManager)
                .map(([rosterID, data]) => ({
                    name: getManagerName(rosterID),
                    drafted: Math.round(data.drafted),
                    lost: Math.round(data.total - data.drafted)
                }))
                .sort((a, b) => (b.drafted + b.lost) - (a.drafted + a.lost));

            managerChart = new Chart(managerChartCanvas, {
                type: 'bar',
                data: {
                    labels: managerData.map(m => m.name),
                    datasets: [
                        {
                            label: 'Kept',
                            data: managerData.map(m => m.drafted),
                            backgroundColor: 'rgba(40, 167, 69, 0.8)',
                            borderColor: 'rgba(40, 167, 69, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Lost',
                            data: managerData.map(m => m.lost),
                            backgroundColor: 'rgba(220, 53, 69, 0.5)',
                            borderColor: 'rgba(220, 53, 69, 1)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    plugins: {
                        title: { display: false }
                    },
                    scales: {
                        x: { stacked: true, beginAtZero: true },
                        y: { stacked: true }
                    }
                }
            });
        }

        // Weekly Totals Chart
        if (weeklyChartCanvas) {
            if (weeklyChart) weeklyChart.destroy();
            const weeks = Object.keys(filteredChartData.weeklyTotals).sort((a, b) => a - b);
            weeklyChart = new Chart(weeklyChartCanvas, {
                type: 'line',
                data: {
                    labels: weeks.map(w => `Wk ${w}`),
                    datasets: [{
                        label: 'Total Points',
                        data: weeks.map(w => filteredChartData.weeklyTotals[w]),
                        borderColor: 'rgba(0, 51, 102, 1)',
                        backgroundColor: 'rgba(0, 51, 102, 0.1)',
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: { display: false },
                        legend: { display: false }
                    },
                    scales: {
                        y: { beginAtZero: true }
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

    // Update charts when tab changes or filter changes
    $: if ((activeTab === 'charts' || activeTab === 'value') && Chart && filteredChartData) {
        setTimeout(createCharts, 100);
    }
</script>

<StatsLayout title="{year} Draft Performance" {navItems}>
    <p class="subtitle">
        {#if currentWeek > 0}
            Through Week {currentWeek} • {draftType === 'auction' ? 'Auction' : 'Snake'} Draft
        {:else}
            Draft Results
        {/if}
    </p>

    {#if error}
        <p class="error-message">{error}</p>
    {:else if message}
        <p class="info-message">{message}</p>
    {:else if draftPickStats.length === 0}
        <p class="info-message">No draft data available yet.</p>
    {:else}
        <!-- Summary Cards Row -->
        <div class="summary-row">
            <div class="summary-card highlight">
                <span class="summary-label">Total Points</span>
                <span class="summary-value">{formatPoints(totalDraftPoints)}</span>
                <span class="summary-detail">{draftPickStats.length} picks</span>
            </div>
            <div class="summary-card">
                <span class="summary-label">Avg/Pick</span>
                <span class="summary-value">{formatPoints(avgPointsPerPick)}</span>
            </div>
            {#if topPick}
                <div class="summary-card">
                    <span class="summary-label">Top Performer</span>
                    <span class="summary-value">{formatPoints(topPick.totalPoints)}</span>
                    <span class="summary-detail">{topPick.playerName}</span>
                </div>
            {/if}
            {#if biggestValue && biggestValue.adpDiff > 0}
                <div class="summary-card">
                    <span class="summary-label">Best Value</span>
                    <span class="summary-value">+{biggestValue.adpDiff}</span>
                    <span class="summary-detail">{biggestValue.playerName}</span>
                </div>
            {/if}
        </div>

        <!-- Tab Buttons -->
        <div class="tab-buttons">
            <button class="tab-btn" class:active={activeTab === 'table'} on:click={() => activeTab = 'table'}>
                Draft Table
            </button>
            <button class="tab-btn" class:active={activeTab === 'charts'} on:click={() => activeTab = 'charts'}>
                Charts
            </button>
            <button class="tab-btn" class:active={activeTab === 'value'} on:click={() => activeTab = 'value'}>
                Value Analysis
            </button>
        </div>

        <!-- Table Tab -->
        {#if activeTab === 'table'}
            <div class="filters-bar">
                <select bind:value={positionFilter}>
                    <option value="ALL">All Positions</option>
                    {#each positions.filter(p => p !== 'ALL') as pos}
                        <option value={pos}>{pos}</option>
                    {/each}
                </select>

                <select bind:value={managerFilter}>
                    <option value="ALL">All Drafters</option>
                    {#each managers.filter(m => m !== 'ALL') as manager}
                        <option value={manager}>{manager}</option>
                    {/each}
                </select>

                <label class="checkbox-label">
                    <input type="checkbox" bind:checked={showValueOnly} />
                    Value only
                </label>

                <input 
                    type="text" 
                    class="search-input"
                    placeholder="Search player..."
                    bind:value={searchQuery}
                />
            </div>

            <p class="results-count">Showing {filteredPicks.length} of {draftPickStats.length} picks</p>

            <StatCard size="full">
                <div class="table-wrapper">
                    <table class="stats-table">
                        <thead>
                            <tr>
                                <th class="table-title" colspan="9">Draft Pick Performance</th>
                            </tr>
                            <tr>
                                <th class="expand-col"></th>
                                {#if draftType !== 'auction'}
                                    <th class="sortable" on:click={() => handleSort('pickNumber')}>
                                        Pick {getSortIcon('pickNumber')}
                                    </th>
                                {:else}
                                    <th class="sortable" on:click={() => handleSort('auctionAmount')}>
                                        $ {getSortIcon('auctionAmount')}
                                    </th>
                                {/if}
                                <th class="sortable" on:click={() => handleSort('playerName')}>
                                    Player {getSortIcon('playerName')}
                                </th>
                                <th class="sortable" on:click={() => handleSort('position')}>
                                    Pos {getSortIcon('position')}
                                </th>
                                <th>Drafter</th>
                                <th class="sortable" on:click={() => handleSort('totalPoints')}>
                                    Total {getSortIcon('totalPoints')}
                                </th>
                                <th class="sortable" on:click={() => handleSort('drafterPoints')}>
                                    Kept {getSortIcon('drafterPoints')}
                                </th>
                                <th class="sortable hide-mobile" on:click={() => handleSort('ppg')}>
                                    PPG {getSortIcon('ppg')}
                                </th>
                                <th class="sortable hide-mobile" on:click={() => handleSort('adpDiff')}>
                                    Value {getSortIcon('adpDiff')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each filteredPicks as pick (pick.playerId + '-' + pick.drafterRosterID)}
                                <tr class:expanded-row={expandedRows.has(pick.playerId)}>
                                    <td class="expand-col">
                                        <button class="expand-btn" on:click={() => toggleRow(pick.playerId)}>
                                            {expandedRows.has(pick.playerId) ? '▼' : '▶'}
                                        </button>
                                    </td>
                                    {#if draftType !== 'auction'}
                                        <td class="pick-cell">
                                            <span class="pick-num">{pick.pickNumber}</span>
                                            <span class="pick-round">Rd {pick.round}</span>
                                        </td>
                                    {:else}
                                        <td class="auction-cell">${pick.auctionAmount}</td>
                                    {/if}
                                    <td class="team-cell">
                                        <img 
                                            class="team-logo" 
                                            src={getPlayerImage(pick.playerId, pick.position)}
                                            alt={pick.playerName}
                                            on:error={(e) => e.currentTarget.src = 'https://sleepercdn.com/images/v2/icons/player_default.webp'}
                                        />
                                        <div class="player-info">
                                            <span class="team-name">{pick.playerName}</span>
                                            <span class="player-team">{pick.team}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span class="position-badge {getPositionClass(pick.position)}">{pick.position}</span>
                                    </td>
                                    <td class="team-cell">
                                        <img 
                                            class="team-logo small" 
                                            src={getManagerAvatar(pick.drafterRosterID)}
                                            alt="Manager"
                                            on:error={(e) => e.currentTarget.src = 'https://sleepercdn.com/images/v2/icons/player_default.webp'}
                                        />
                                        <span class="team-name">{getManagerName(pick.drafterRosterID)}</span>
                                    </td>
                                    <td class="points-cell">{formatPoints(pick.totalPoints)}</td>
                                    <td class="points-cell {pick.drafterPoints < pick.totalPoints ? 'points-lost' : ''}">
                                        {formatPoints(pick.drafterPoints)}
                                    </td>
                                    <td class="hide-mobile">{formatPoints(pick.ppg)}</td>
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
                                
                                {#if expandedRows.has(pick.playerId)}
                                    <tr class="weekly-breakdown-row">
                                        <td colspan="9">
                                            <div class="weekly-breakdown">
                                                <strong>Weekly Breakdown for {pick.playerName}</strong>
                                                {#if Object.keys(pick.pointsByOwner).length > 1}
                                                    <span class="multi-owner-badge">Multiple owners</span>
                                                {/if}
                                                <div class="weekly-grid">
                                                    {#each Array(currentWeek).fill().map((_, i) => i + 1) as week}
                                                        {@const weekData = pick.weeklyBreakdown[week]}
                                                        {@const isDifferentOwner = weekData?.rosterID && weekData.rosterID != pick.drafterRosterID}
                                                        <div class="week-cell" class:different-owner={isDifferentOwner}>
                                                            <span class="week-num">Wk {week}</span>
                                                            <span class="week-pts">
                                                                {weekData?.points ? formatPoints(weekData.points) : '-'}
                                                            </span>
                                                            <span class="week-owner">
                                                                {#if weekData?.rosterID}
                                                                    {getManagerName(weekData.rosterID)}
                                                                {:else}
                                                                    FA
                                                                {/if}
                                                            </span>
                                                        </div>
                                                    {/each}
                                                </div>
                                                
                                                {#if Object.keys(pick.pointsByOwner).length > 0}
                                                    <div class="owner-summary">
                                                        <strong>Points by Owner:</strong>
                                                        {#each Object.entries(pick.pointsByOwner) as [rosterID, pts]}
                                                            <span class="owner-chip" class:drafter={rosterID == pick.drafterRosterID}>
                                                                <img 
                                                                    src={getManagerAvatar(rosterID)} 
                                                                    alt=""
                                                                    on:error={(e) => e.currentTarget.src = 'https://sleepercdn.com/images/v2/icons/player_default.webp'}
                                                                />
                                                                {getManagerName(rosterID)}: {formatPoints(pts)}
                                                            </span>
                                                        {/each}
                                                    </div>
                                                {/if}
                                            </div>
                                        </td>
                                    </tr>
                                {/if}
                            {:else}
                                <tr><td colspan="9" class="text-center text-gray-600">No picks match your filters</td></tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            </StatCard>
        {/if}

        <!-- Charts Tab -->
        {#if activeTab === 'charts'}
            <div class="chart-filter-bar">
                <label>Filter by Drafter:</label>
                <select bind:value={chartManagerFilter}>
                    <option value="ALL">All Drafters</option>
                    {#each managers.filter(m => m !== 'ALL') as manager}
                        <option value={manager}>{manager}</option>
                    {/each}
                </select>
                {#if chartManagerFilter !== 'ALL'}
                    <span class="filter-badge">{chartFilteredPicks.length} picks</span>
                {/if}
            </div>

            <div class="content-grid">
                <StatCard size="lg">
                    <div class="table-wrapper">
                        <table class="stats-table chart-table">
                            <thead>
                                <tr><th class="table-title">Avg Points by Round</th></tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td class="chart-cell">
                                        <canvas bind:this={roundChartCanvas}></canvas>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </StatCard>

                <StatCard size="lg">
                    <div class="table-wrapper">
                        <table class="stats-table chart-table">
                            <thead>
                                <tr><th class="table-title">Points by Position</th></tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td class="chart-cell">
                                        <canvas bind:this={positionChartCanvas}></canvas>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </StatCard>

                {#if chartManagerFilter === 'ALL'}
                    <StatCard size="lg">
                        <div class="table-wrapper">
                            <table class="stats-table chart-table">
                                <thead>
                                    <tr><th class="table-title">Draft Production by Manager</th></tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td class="chart-cell tall">
                                            <canvas bind:this={managerChartCanvas}></canvas>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </StatCard>
                {/if}

                <StatCard size="lg">
                    <div class="table-wrapper">
                        <table class="stats-table chart-table">
                            <thead>
                                <tr><th class="table-title">Weekly Point Production</th></tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td class="chart-cell">
                                        <canvas bind:this={weeklyChartCanvas}></canvas>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </StatCard>
            </div>
        {/if}

        <!-- Value Analysis Tab -->
        {#if activeTab === 'value'}
            <div class="chart-filter-bar">
                <label>Filter by Drafter:</label>
                <select bind:value={chartManagerFilter}>
                    <option value="ALL">All Drafters</option>
                    {#each managers.filter(m => m !== 'ALL') as manager}
                        <option value={manager}>{manager}</option>
                    {/each}
                </select>
                {#if chartManagerFilter !== 'ALL'}
                    <span class="filter-badge">{chartFilteredPicks.length} picks</span>
                {/if}
            </div>

            <div class="content-grid">
                <StatCard size="lg">
                    <div class="table-wrapper">
                        <table class="stats-table">
                            <thead>
                                <tr><th class="table-title" colspan="4">🌟 Best Value Picks</th></tr>
                                <tr><th>#</th><th>Player</th><th>Pick</th><th>Points / Value</th></tr>
                            </thead>
                            <tbody>
                                {#each (filteredChartData?.valuePicks || []) as pick, i}
                                    <tr>
                                        <td>{i + 1}</td>
                                        <td class="team-cell">
                                            <img 
                                                class="team-logo" 
                                                src={getPlayerImage(pick.playerId, pick.position)}
                                                alt=""
                                                on:error={(e) => e.currentTarget.src = 'https://sleepercdn.com/images/v2/icons/player_default.webp'}
                                            />
                                            <div class="player-info">
                                                <span class="team-name">{pick.playerName}</span>
                                                <span class="player-team">{pick.position} • {getManagerName(pick.drafterRosterID)}</span>
                                            </div>
                                        </td>
                                        <td>#{pick.pickNumber}</td>
                                        <td>
                                            <span class="points-cell">{formatPoints(pick.totalPoints)}</span>
                                            <span class="value-badge value-great">+{pick.adpDiff}</span>
                                        </td>
                                    </tr>
                                {:else}
                                    <tr><td colspan="4" class="text-center text-gray-600">No value picks found</td></tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                </StatCard>

                <StatCard size="lg">
                    <div class="table-wrapper">
                        <table class="stats-table">
                            <thead>
                                <tr><th class="table-title" colspan="4">💔 Biggest Busts (Rounds 1-5)</th></tr>
                                <tr><th>#</th><th>Player</th><th>Pick</th><th>Points / GP</th></tr>
                            </thead>
                            <tbody>
                                {#each (filteredChartData?.bustPicks || []) as pick, i}
                                    <tr>
                                        <td>{i + 1}</td>
                                        <td class="team-cell">
                                            <img 
                                                class="team-logo" 
                                                src={getPlayerImage(pick.playerId, pick.position)}
                                                alt=""
                                                on:error={(e) => e.currentTarget.src = 'https://sleepercdn.com/images/v2/icons/player_default.webp'}
                                            />
                                            <div class="player-info">
                                                <span class="team-name">{pick.playerName}</span>
                                                <span class="player-team">{pick.position} • {getManagerName(pick.drafterRosterID)}</span>
                                            </div>
                                        </td>
                                        <td>#{pick.pickNumber} (Rd {pick.round})</td>
                                        <td>
                                            <span class="points-cell bust">{formatPoints(pick.totalPoints)}</span>
                                            <span class="gp-badge">{pick.gamesPlayed} GP</span>
                                        </td>
                                    </tr>
                                {:else}
                                    <tr><td colspan="4" class="text-center text-gray-600">No bust picks found</td></tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                </StatCard>
            </div>
        {/if}
    {/if}
</StatsLayout>

<style>
    .subtitle {
        text-align: center;
        color: #6c757d;
        margin: -0.5rem 0 1.5rem 0;
        font-size: 0.95rem;
    }

    .error-message, .info-message {
        text-align: center;
        padding: 2rem;
        color: #6c757d;
        font-style: italic;
    }
    .error-message { color: #dc3545; }

    /* Summary Cards */
    .summary-row {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
    }

    .summary-card {
        flex: 1;
        min-width: 140px;
        background: white;
        border-radius: 8px;
        padding: 1rem;
        text-align: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .summary-card.highlight {
        background: linear-gradient(135deg, #003366, #004080);
        color: white;
    }

    .summary-label {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        opacity: 0.8;
    }

    .summary-value {
        font-size: 1.5rem;
        font-weight: bold;
    }

    .summary-detail {
        font-size: 0.8rem;
        opacity: 0.7;
    }

    /* Tab Buttons */
    .tab-buttons {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1.5rem;
        justify-content: center;
        flex-wrap: wrap;
    }

    .tab-btn {
        padding: 0.6rem 1.5rem;
        border: 2px solid #dee2e6;
        background: white;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
        font-size: 0.9rem;
        transition: all 0.2s;
    }

    .tab-btn:hover {
        border-color: #003366;
        color: #003366;
    }

    .tab-btn.active {
        background: linear-gradient(135deg, #003366, #004080);
        border-color: #003366;
        color: white;
    }

    /* Filters */
    .filters-bar {
        display: flex;
        gap: 0.75rem;
        margin-bottom: 1rem;
        flex-wrap: wrap;
        align-items: center;
    }

    .filters-bar select,
    .filters-bar .search-input {
        padding: 0.5rem 0.75rem;
        border: 1px solid #dee2e6;
        border-radius: 6px;
        font-size: 0.85rem;
    }

    .filters-bar select { min-width: 140px; }
    .filters-bar .search-input { flex: 1; min-width: 150px; }

    .checkbox-label {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.85rem;
        cursor: pointer;
    }

    .results-count {
        font-size: 0.8rem;
        color: #6c757d;
        margin-bottom: 0.5rem;
        text-align: right;
    }

    /* Chart filter bar */
    .chart-filter-bar {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1.5rem;
        padding: 0.75rem 1rem;
        background: #f8f9fa;
        border-radius: 8px;
    }

    .chart-filter-bar label {
        font-weight: 500;
        font-size: 0.9rem;
    }

    .chart-filter-bar select {
        padding: 0.5rem 0.75rem;
        border: 1px solid #dee2e6;
        border-radius: 6px;
        font-size: 0.85rem;
    }

    .filter-badge {
        background: #003366;
        color: white;
        padding: 0.25rem 0.6rem;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 500;
    }

    /* Content Grid */
    .content-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1.5rem;
        margin-bottom: 2rem;
    }

    /* Table styles matching site */
    .table-wrapper {
        width: 100%;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        border-radius: 8px;
    }

    .stats-table {
        width: 100%;
        min-width: 700px;
        border-collapse: collapse;
        font-size: 0.85rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        background: white;
    }

    .stats-table th,
    .stats-table td {
        border: 1px solid #dee2e6;
        padding: 0.6rem 0.5rem;
        color: #212529;
    }

    .stats-table th {
        text-align: center;
        background: #f8f9fa;
        font-weight: 600;
        color: #495057;
        font-size: 0.8rem;
    }

    .stats-table th.sortable {
        cursor: pointer;
        user-select: none;
    }

    .stats-table th.sortable:hover {
        background: #e9ecef;
    }

    .stats-table td {
        text-align: left;
        background: white;
    }

    .stats-table tbody tr:nth-child(even) {
        background: #f8f9fa;
    }

    .stats-table tbody tr:hover {
        background: #e3f2fd !important;
    }

    .table-title {
        text-align: center !important;
        background: linear-gradient(135deg, #003366, #004080) !important;
        color: white !important;
        font-size: 1rem;
        font-weight: bold;
        padding: 0.75rem;
    }

    /* Team/Player cell */
    .team-cell {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .team-logo {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid #e9ecef;
        flex-shrink: 0;
    }

    .team-logo.small {
        width: 22px;
        height: 22px;
    }

    .player-info {
        display: flex;
        flex-direction: column;
        min-width: 0;
    }

    .team-name {
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .player-team {
        font-size: 0.7rem;
        color: #6c757d;
    }

    /* Position badge */
    .position-badge {
        display: inline-block;
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
        font-size: 0.7rem;
        font-weight: 600;
        color: white;
    }

    .pos-qb { background: #dc3545; }
    .pos-rb { background: #20c997; }
    .pos-wr { background: #007bff; }
    .pos-te { background: #ffc107; color: #212529; }
    .pos-k { background: #6f42c1; }
    .pos-def { background: #6c757d; }
    .pos-default { background: #adb5bd; }

    /* Pick cell */
    .pick-cell {
        text-align: center;
    }

    .pick-num {
        font-weight: bold;
        display: block;
    }

    .pick-round {
        font-size: 0.7rem;
        color: #6c757d;
    }

    .auction-cell {
        font-weight: 600;
        color: #28a745;
        text-align: center;
    }

    /* Points */
    .points-cell {
        font-weight: 600;
        color: #007bff;
    }

    .points-cell.points-lost {
        color: #fd7e14;
    }

    .points-cell.bust {
        color: #dc3545;
    }

    /* Value badge */
    .value-badge {
        display: inline-block;
        padding: 0.15rem 0.4rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
    }

    .value-great { background: #c8e6c9; color: #2e7d32; }
    .value-good { background: #dcedc8; color: #558b2f; }
    .value-ok { background: #fff3e0; color: #f57c00; }
    .value-below { background: #ffe0b2; color: #ef6c00; }
    .value-poor { background: #ffcdd2; color: #c62828; }

    .gp-badge {
        font-size: 0.75rem;
        color: #6c757d;
        margin-left: 0.5rem;
    }

    /* Expand button */
    .expand-col { width: 35px; text-align: center; }

    .expand-btn {
        background: #e9ecef;
        border: none;
        border-radius: 4px;
        padding: 0.2rem 0.5rem;
        cursor: pointer;
        font-size: 0.75rem;
    }

    .expand-btn:hover { background: #dee2e6; }

    .expanded-row { background: #e3f2fd !important; }

    /* Weekly breakdown */
    .weekly-breakdown-row td {
        background: #f8f9fa !important;
        padding: 1rem !important;
    }

    .weekly-breakdown {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .multi-owner-badge {
        display: inline-block;
        background: #fd7e14;
        color: white;
        padding: 0.15rem 0.5rem;
        border-radius: 12px;
        font-size: 0.7rem;
        font-weight: 500;
        margin-left: 0.5rem;
    }

    .weekly-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
        gap: 0.5rem;
    }

    .week-cell {
        background: white;
        border: 1px solid #dee2e6;
        border-radius: 6px;
        padding: 0.5rem;
        text-align: center;
    }

    .week-cell.different-owner {
        border-color: #fd7e14;
        background: #fff8e1;
    }

    .week-num {
        display: block;
        font-size: 0.65rem;
        color: #6c757d;
    }

    .week-pts {
        display: block;
        font-weight: 600;
        font-size: 0.9rem;
    }

    .week-owner {
        display: block;
        font-size: 0.6rem;
        color: #6c757d;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .owner-summary {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem;
        padding-top: 0.5rem;
        border-top: 1px solid #dee2e6;
    }

    .owner-chip {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        padding: 0.3rem 0.6rem;
        background: #fff3e0;
        border-radius: 16px;
        font-size: 0.75rem;
    }

    .owner-chip.drafter {
        background: #e8f5e9;
    }

    .owner-chip img {
        width: 18px;
        height: 18px;
        border-radius: 50%;
    }

    /* Chart cells */
    .chart-table { min-width: auto; }

    .chart-cell {
        height: 250px;
        padding: 1rem !important;
    }

    .chart-cell.tall {
        height: 350px;
    }

    /* Utility */
    .text-center { text-align: center; }
    .text-gray-600 { color: #6c757d; }

    .hide-mobile { }

    /* Mobile */
    @media (max-width: 768px) {
        .content-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
        }

        .summary-row {
            flex-direction: column;
        }

        .summary-card {
            min-width: 100%;
        }

        .stats-table {
            min-width: 600px;
            font-size: 0.8rem;
        }

        .filters-bar {
            flex-direction: column;
            align-items: stretch;
        }

        .filters-bar select,
        .filters-bar .search-input {
            width: 100%;
        }

        .tab-btn {
            padding: 0.5rem 1rem;
            font-size: 0.8rem;
        }

        .hide-mobile {
            display: none;
        }

        .chart-filter-bar {
            flex-wrap: wrap;
        }

        .chart-cell {
            height: 200px;
        }
    }

    @media (max-width: 480px) {
        .stats-table {
            min-width: 500px;
            font-size: 0.75rem;
        }

        .team-logo {
            width: 22px;
            height: 22px;
        }

        .weekly-grid {
            grid-template-columns: repeat(auto-fill, minmax(65px, 1fr));
        }
    }
</style>