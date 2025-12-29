<!--script>
    import { invalidateAll } from '$app/navigation';
    
    export let data;
    
    let selectedSeason = data.seasons?.length > 0 ? data.seasons[0] : null;
    let activeTab = 'production'; // 'production', 'season', or 'weekly'
    let refreshing = false;
    
    async function refresh() {
        refreshing = true;
        await invalidateAll();
        refreshing = false;
    }
    
    function getStatusClass(processed, unprocessed) {
        if (unprocessed === 0 && processed > 0) return 'complete';
        if (processed === 0 && unprocessed > 0) return 'pending';
        if (processed > 0 && unprocessed > 0) return 'partial';
        return 'empty';
    }
    
    function getStatusLabel(processed, unprocessed) {
        if (unprocessed === 0 && processed > 0) return 'Complete';
        if (processed === 0 && unprocessed > 0) return 'Pending';
        if (processed > 0 && unprocessed > 0) return 'Partial';
        return 'Empty';
    }
    
    // Get all unique weeks across all week-level tables for the selected season
    $: selectedSeasonWeeks = (() => {
        if (!data || !selectedSeason || !data.weekLevel[selectedSeason]) return [];
        
        const seasonData = data.weekLevel[selectedSeason];
        const allWeeks = new Set();
        
        seasonData.matchups.forEach(r => allWeeks.add(r.week));
        seasonData.playerStats.forEach(r => allWeeks.add(r.week));
        seasonData.weeklyRosters.forEach(r => allWeeks.add(r.week));
        
        return Array.from(allWeeks).sort((a, b) => a - b);
    })();
    
    // Helper to get week data for a specific table
    function getWeekData(tableName, week) {
        if (!data || !selectedSeason || !data.weekLevel[selectedSeason]) return null;
        
        const seasonData = data.weekLevel[selectedSeason];
        const tableData = seasonData[tableName];
        
        return tableData?.find(r => r.week === week) || null;
    }
</script>

<svelte:head>
    <title>Staging Tables Status | Admin</title>
</svelte:head>

<div class="dashboard">
    <header class="dashboard-header">
        <div class="header-content">
            <h1>Staging Tables Status</h1>
            <p class="subtitle">View data in staging tables awaiting processing</p>
        </div>
        <button class="refresh-btn" on:click={refresh} disabled={refreshing}>
            {#if refreshing}
                <span class="spinner-small"></span>
            {:else}
                ↻
            {/if}
            Refresh
        </button>
    </header>
    
    {#if data.error}
        <div class="error-message">
            <strong>Error:</strong> {data.error}
        </div>
    {/if}
    
    {#if data}
        <!-- Tab Navigation >
        <div class="tabs">
            <button 
                class="tab" 
                class:active={activeTab === 'production'}
                on:click={() => activeTab = 'production'}
            >
                Production Status
            </button>
            <button 
                class="tab" 
                class:active={activeTab === 'season'}
                on:click={() => activeTab = 'season'}
            >
                Season-Level Staging
            </button>
            <button 
                class="tab" 
                class:active={activeTab === 'weekly'}
                on:click={() => activeTab = 'weekly'}
            >
                Weekly Staging
            </button>
        </div>
        
        <!-- Production Status Tab >
        {#if activeTab === 'production'}
            <div class="tab-content">
                <h2>Sleeper Seasons - Production Data Status</h2>
                <p class="section-desc">Shows which Sleeper seasons have data in production tables</p>
                
                {#if data.sleeperSeasons.length === 0}
                    <div class="empty-table">No Sleeper seasons found in database</div>
                {:else}
                    <div class="production-grid">
                        <table class="data-table production-table">
                            <thead>
                                <tr>
                                    <th class="sticky-col">Season</th>
                                    <th>Teams</th>
                                    <th>Managers</th>
                                    <th>Drafts</th>
                                    <th>Draft Picks</th>
                                    <th>Weekly Rosters</th>
                                    <th>Playoff Rosters</th>
                                    <th>Player Stats</th>
                                    <th>Playoff Stats</th>
                                    <th>Matchups</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each data.sleeperSeasons as season}
                                    {@const teams = data.production.teams.find(t => t.season_id === season.season_id)}
                                    {@const managers = data.production.managers.find(m => m.season_id === season.season_id)}
                                    {@const drafts = data.production.drafts.find(d => d.season_id === season.season_id)}
                                    {@const picks = data.production.draftPicks.find(p => p.season_id === season.season_id)}
                                    {@const weeklyRoster = data.production.weeklyRoster.find(w => w.season_id === season.season_id)}
                                    {@const playoffRoster = data.production.playoffRoster.find(p => p.season_id === season.season_id)}
                                    {@const playerStats = data.production.playerStats.find(p => p.season_id === season.season_id)}
                                    {@const playoffStats = data.production.playoffStats.find(p => p.season_id === season.season_id)}
                                    {@const matchups = data.production.matchups.find(m => m.season_id === season.season_id)}
                                    <tr>
                                        <td class="sticky-col season-cell">
                                            {season.season_year}
                                            {#if season.is_active}
                                                <span class="active-badge">Active</span>
                                            {/if}
                                        </td>
                                        <td>
                                            {#if teams}
                                                <span class="has-data">{teams.team_count}</span>
                                            {:else}
                                                <span class="no-data-icon">✗</span>
                                            {/if}
                                        </td>
                                        <td>
                                            {#if managers}
                                                <span class="has-data">{managers.manager_count}</span>
                                            {:else}
                                                <span class="no-data-icon">✗</span>
                                            {/if}
                                        </td>
                                        <td>
                                            {#if drafts}
                                                <span class="has-data">{drafts.draft_count}</span>
                                            {:else}
                                                <span class="no-data-icon">✗</span>
                                            {/if}
                                        </td>
                                        <td>
                                            {#if picks && picks.pick_count > 0}
                                                <span class="has-data">{picks.pick_count}</span>
                                            {:else}
                                                <span class="no-data-icon">✗</span>
                                            {/if}
                                        </td>
                                        <td>
                                            {#if weeklyRoster}
                                                <span class="has-data" title="{weeklyRoster.total_records} records">
                                                    {weeklyRoster.weeks_with_data} wks
                                                </span>
                                            {:else}
                                                <span class="no-data-icon">✗</span>
                                            {/if}
                                        </td>
                                        <td>
                                            {#if playoffRoster}
                                                <span class="has-data" title="{playoffRoster.total_records} records">
                                                    {playoffRoster.weeks_with_data} wks
                                                </span>
                                            {:else}
                                                <span class="no-data-icon">✗</span>
                                            {/if}
                                        </td>
                                        <td>
                                            {#if playerStats}
                                                <span class="has-data" title="{playerStats.total_records} records">
                                                    {playerStats.weeks_with_data} wks
                                                </span>
                                            {:else}
                                                <span class="no-data-icon">✗</span>
                                            {/if}
                                        </td>
                                        <td>
                                            {#if playoffStats}
                                                <span class="has-data" title="{playoffStats.total_records} records">
                                                    {playoffStats.weeks_with_data} wks
                                                </span>
                                            {:else}
                                                <span class="no-data-icon">✗</span>
                                            {/if}
                                        </td>
                                        <td>
                                            {#if matchups}
                                                <span class="has-data" title="{matchups.total_records} records">
                                                    {matchups.weeks_with_data} wks
                                                </span>
                                            {:else}
                                                <span class="no-data-icon">✗</span>
                                            {/if}
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="legend production-legend">
                        <div class="legend-items">
                            <div class="legend-item">
                                <span class="has-data">123</span>
                                <span>Has data (count shown)</span>
                            </div>
                            <div class="legend-item">
                                <span class="no-data-icon">✗</span>
                                <span>No data</span>
                            </div>
                            <div class="legend-item">
                                <span class="active-badge">Active</span>
                                <span>Current active season</span>
                            </div>
                        </div>
                    </div>
                {/if}
            </div>
        {/if}
        
        <!-- Season-Level Tables Tab >
        {#if activeTab === 'season'}
            <div class="tab-content">
                <h2>Season-Level Staging Tables</h2>
                <p class="section-desc">Data in staging tables waiting to be processed into production</p>
                
                <!-- League Staging >
                <div class="staging-table-section">
                    <h3>
                        <span class="table-icon">🏆</span>
                        staging_sleeper_league
                        <span class="arrow">→</span>
                        <span class="target">leagues</span>
                    </h3>
                    {#if data.seasonLevel.league.length === 0}
                        <div class="empty-table">No data in staging table</div>
                    {:else}
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Season</th>
                                    <th>Total</th>
                                    <th>Processed</th>
                                    <th>Unprocessed</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each data.seasonLevel.league as row}
                                    <tr>
                                        <td class="season-cell">{row.season_year}</td>
                                        <td>{row.total_records}</td>
                                        <td class="processed">{row.processed_count}</td>
                                        <td class="unprocessed">{row.unprocessed_count}</td>
                                        <td>
                                            <span class="status-badge {getStatusClass(row.processed_count, row.unprocessed_count)}">
                                                {getStatusLabel(row.processed_count, row.unprocessed_count)}
                                            </span>
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    {/if}
                </div>
                
                <!-- Users Staging >
                <div class="staging-table-section">
                    <h3>
                        <span class="table-icon">👤</span>
                        staging_sleeper_users
                        <span class="arrow">→</span>
                        <span class="target">managers</span>
                    </h3>
                    {#if data.seasonLevel.users.length === 0}
                        <div class="empty-table">No data in staging table</div>
                    {:else}
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Season</th>
                                    <th>Total</th>
                                    <th>Processed</th>
                                    <th>Unprocessed</th>
                                    <th>Mapped</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each data.seasonLevel.users as row}
                                    <tr>
                                        <td class="season-cell">{row.season_year}</td>
                                        <td>{row.total_records}</td>
                                        <td class="processed">{row.processed_count}</td>
                                        <td class="unprocessed">{row.unprocessed_count}</td>
                                        <td>{row.mapped_count}</td>
                                        <td>
                                            <span class="status-badge {getStatusClass(row.processed_count, row.unprocessed_count)}">
                                                {getStatusLabel(row.processed_count, row.unprocessed_count)}
                                            </span>
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    {/if}
                </div>
                
                <!-- Rosters Staging >
                <div class="staging-table-section">
                    <h3>
                        <span class="table-icon">📋</span>
                        staging_sleeper_rosters
                        <span class="arrow">→</span>
                        <span class="target">teams</span>
                    </h3>
                    {#if data.seasonLevel.rosters.length === 0}
                        <div class="empty-table">No data in staging table</div>
                    {:else}
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Season</th>
                                    <th>Total</th>
                                    <th>Processed</th>
                                    <th>Unprocessed</th>
                                    <th>Mapped</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each data.seasonLevel.rosters as row}
                                    <tr>
                                        <td class="season-cell">{row.season_year}</td>
                                        <td>{row.total_records}</td>
                                        <td class="processed">{row.processed_count}</td>
                                        <td class="unprocessed">{row.unprocessed_count}</td>
                                        <td>{row.mapped_count}</td>
                                        <td>
                                            <span class="status-badge {getStatusClass(row.processed_count, row.unprocessed_count)}">
                                                {getStatusLabel(row.processed_count, row.unprocessed_count)}
                                            </span>
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    {/if}
                </div>
                
                <!-- Drafts Staging >
                <div class="staging-table-section">
                    <h3>
                        <span class="table-icon">📝</span>
                        staging_sleeper_drafts
                        <span class="arrow">→</span>
                        <span class="target">drafts</span>
                    </h3>
                    {#if data.seasonLevel.drafts.length === 0}
                        <div class="empty-table">No data in staging table</div>
                    {:else}
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Season</th>
                                    <th>Total</th>
                                    <th>Processed</th>
                                    <th>Unprocessed</th>
                                    <th>Mapped</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each data.seasonLevel.drafts as row}
                                    <tr>
                                        <td class="season-cell">{row.season_year}</td>
                                        <td>{row.total_records}</td>
                                        <td class="processed">{row.processed_count}</td>
                                        <td class="unprocessed">{row.unprocessed_count}</td>
                                        <td>{row.mapped_count}</td>
                                        <td>
                                            <span class="status-badge {getStatusClass(row.processed_count, row.unprocessed_count)}">
                                                {getStatusLabel(row.processed_count, row.unprocessed_count)}
                                            </span>
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    {/if}
                </div>
                
                <!-- Draft Picks Staging >
                <div class="staging-table-section">
                    <h3>
                        <span class="table-icon">🎯</span>
                        staging_sleeper_draft_picks
                        <span class="arrow">→</span>
                        <span class="target">draft_picks</span>
                    </h3>
                    {#if data.seasonLevel.draftPicks.length === 0}
                        <div class="empty-table">No data in staging table</div>
                    {:else}
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Season</th>
                                    <th>Total</th>
                                    <th>Processed</th>
                                    <th>Unprocessed</th>
                                    <th>Mapped</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each data.seasonLevel.draftPicks as row}
                                    <tr>
                                        <td class="season-cell">{row.season_year}</td>
                                        <td>{row.total_records}</td>
                                        <td class="processed">{row.processed_count}</td>
                                        <td class="unprocessed">{row.unprocessed_count}</td>
                                        <td>{row.mapped_count}</td>
                                        <td>
                                            <span class="status-badge {getStatusClass(row.processed_count, row.unprocessed_count)}">
                                                {getStatusLabel(row.processed_count, row.unprocessed_count)}
                                            </span>
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    {/if}
                </div>
            </div>
        {/if}
        
        <!-- Weekly Data Tab >
        {#if activeTab === 'weekly'}
            <div class="tab-content">
                <h2>Weekly Staging Tables</h2>
                <p class="section-desc">Week-by-week data in staging tables waiting to be processed</p>
                
                <!-- Season Selector >
                <div class="season-selector">
                    <label for="season-select">Select Season:</label>
                    <select id="season-select" bind:value={selectedSeason}>
                        {#each data.seasons as season}
                            <option value={season}>{season}</option>
                        {/each}
                    </select>
                </div>
                
                {#if selectedSeason && data.weekLevel[selectedSeason]}
                    <!-- Weekly Grid View >
                    <div class="weekly-grid-container">
                        <div class="weekly-grid">
                            <div class="grid-header">
                                <div class="header-cell week-col">Week</div>
                                <div class="header-cell table-col">
                                    <span class="table-name">weekly_rosters</span>
                                    <span class="target-hint">→ weekly_roster / playoff_roster</span>
                                </div>
                                <div class="header-cell table-col">
                                    <span class="table-name">player_stats</span>
                                    <span class="target-hint">→ player_fantasy_stats / playoff_fantasy_stats</span>
                                </div>
                                <div class="header-cell table-col">
                                    <span class="table-name">matchups</span>
                                    <span class="target-hint">→ matchups / playoffs</span>
                                </div>
                            </div>
                            
                            {#each selectedSeasonWeeks as week}
                                {@const rosterData = getWeekData('weeklyRosters', week)}
                                {@const statsData = getWeekData('playerStats', week)}
                                {@const matchupData = getWeekData('matchups', week)}
                                <div class="grid-row">
                                    <div class="cell week-col">
                                        <span class="week-number">{week}</span>
                                    </div>
                                    
                                    <!-- Weekly Rosters >
                                    <div class="cell table-col">
                                        {#if rosterData}
                                            <div class="cell-content">
                                                <span class="status-badge small {getStatusClass(rosterData.processed_count, rosterData.unprocessed_count)}">
                                                    {getStatusLabel(rosterData.processed_count, rosterData.unprocessed_count)}
                                                </span>
                                                <span class="counts">
                                                    <span class="count-processed" title="Processed">{rosterData.processed_count}</span>
                                                    /
                                                    <span class="count-unprocessed" title="Unprocessed">{rosterData.unprocessed_count}</span>
                                                </span>
                                            </div>
                                        {:else}
                                            <span class="no-data">—</span>
                                        {/if}
                                    </div>
                                    
                                    <!-- Player Stats >
                                    <div class="cell table-col">
                                        {#if statsData}
                                            <div class="cell-content">
                                                <span class="status-badge small {getStatusClass(statsData.processed_count, statsData.unprocessed_count)}">
                                                    {getStatusLabel(statsData.processed_count, statsData.unprocessed_count)}
                                                </span>
                                                <span class="counts">
                                                    <span class="count-processed" title="Processed">{statsData.processed_count}</span>
                                                    /
                                                    <span class="count-unprocessed" title="Unprocessed">{statsData.unprocessed_count}</span>
                                                </span>
                                            </div>
                                        {:else}
                                            <span class="no-data">—</span>
                                        {/if}
                                    </div>
                                    
                                    <!-- Matchups >
                                    <div class="cell table-col">
                                        {#if matchupData}
                                            <div class="cell-content">
                                                <span class="status-badge small {getStatusClass(matchupData.processed_count, matchupData.unprocessed_count)}">
                                                    {getStatusLabel(matchupData.processed_count, matchupData.unprocessed_count)}
                                                </span>
                                                <span class="counts">
                                                    <span class="count-processed" title="Processed">{matchupData.processed_count}</span>
                                                    /
                                                    <span class="count-unprocessed" title="Unprocessed">{matchupData.unprocessed_count}</span>
                                                </span>
                                            </div>
                                        {:else}
                                            <span class="no-data">—</span>
                                        {/if}
                                    </div>
                                </div>
                            {/each}
                            
                            {#if selectedSeasonWeeks.length === 0}
                                <div class="empty-weeks">No weekly data found for {selectedSeason}</div>
                            {/if}
                        </div>
                    </div>
                    
                    <!-- Legend >
                    <div class="legend">
                        <h4>Legend</h4>
                        <div class="legend-items">
                            <div class="legend-item">
                                <span class="status-badge small complete">Complete</span>
                                <span>All records processed</span>
                            </div>
                            <div class="legend-item">
                                <span class="status-badge small partial">Partial</span>
                                <span>Some records processed</span>
                            </div>
                            <div class="legend-item">
                                <span class="status-badge small pending">Pending</span>
                                <span>No records processed yet</span>
                            </div>
                            <div class="legend-item">
                                <span class="counts-legend">
                                    <span class="count-processed">✓</span> / <span class="count-unprocessed">✗</span>
                                </span>
                                <span>Processed / Unprocessed counts</span>
                            </div>
                        </div>
                    </div>
                {:else}
                    <div class="empty-state">
                        <p>No weekly data available</p>
                    </div>
                {/if}
            </div>
        {/if}
    {/if}
</div>

<style>
    .dashboard {
        max-width: 1100px;
        margin: 0 auto;
        padding: 2rem;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 2px solid #e2e8f0;
    }
    
    .header-content h1 {
        margin: 0 0 0.5rem 0;
        font-size: 1.75rem;
        font-weight: 700;
        color: #1e293b;
    }
    
    .subtitle {
        margin: 0;
        color: #64748b;
        font-size: 0.95rem;
    }
    
    .refresh-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.625rem 1rem;
        background: #f1f5f9;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        font-size: 0.875rem;
        font-weight: 500;
        color: #475569;
        cursor: pointer;
        transition: all 0.15s ease;
    }
    
    .refresh-btn:hover:not(:disabled) {
        background: #e2e8f0;
        border-color: #94a3b8;
    }
    
    .refresh-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
    
    .spinner-small {
        width: 14px;
        height: 14px;
        border: 2px solid #cbd5e1;
        border-top-color: #3b82f6;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }
    
    .error-message {
        padding: 1rem;
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 8px;
        color: #991b1b;
        margin-bottom: 1.5rem;
    }
    
    .loading {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 3rem;
        justify-content: center;
        color: #64748b;
    }
    
    .spinner {
        width: 28px;
        height: 28px;
        border: 3px solid #e2e8f0;
        border-top-color: #3b82f6;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    
    /* Tabs */
    .tabs {
        display: flex;
        gap: 0;
        margin-bottom: 1.5rem;
        border-bottom: 2px solid #e2e8f0;
    }
    
    .tab {
        padding: 0.875rem 1.5rem;
        background: none;
        border: none;
        font-size: 0.95rem;
        font-weight: 500;
        color: #64748b;
        cursor: pointer;
        border-bottom: 2px solid transparent;
        margin-bottom: -2px;
        transition: all 0.15s ease;
    }
    
    .tab:hover {
        color: #334155;
    }
    
    .tab.active {
        color: #3b82f6;
        border-bottom-color: #3b82f6;
    }
    
    .tab-content {
        animation: fadeIn 0.2s ease;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    .tab-content h2 {
        margin: 0 0 0.5rem 0;
        font-size: 1.1rem;
        font-weight: 600;
        color: #334155;
    }
    
    .section-desc {
        margin: 0 0 1.5rem 0;
        color: #64748b;
        font-size: 0.875rem;
    }
    
    /* Staging Table Sections */
    .staging-table-section {
        margin-bottom: 1.5rem;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        overflow: hidden;
    }
    
    .staging-table-section h3 {
        margin: 0;
        padding: 0.875rem 1rem;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
        font-size: 0.9rem;
        font-weight: 600;
        color: #334155;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .table-icon {
        font-size: 1rem;
    }
    
    .arrow {
        color: #94a3b8;
        margin: 0 0.25rem;
    }
    
    .target {
        color: #059669;
        font-weight: 500;
    }
    
    .empty-table {
        padding: 1.5rem;
        text-align: center;
        color: #94a3b8;
        font-size: 0.875rem;
    }
    
    /* Data Tables */
    .data-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.875rem;
    }
    
    .data-table th {
        text-align: left;
        padding: 0.75rem 1rem;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
        font-weight: 600;
        color: #475569;
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.025em;
    }
    
    .data-table td {
        padding: 0.75rem 1rem;
        border-bottom: 1px solid #f1f5f9;
        color: #334155;
    }
    
    .data-table tr:last-child td {
        border-bottom: none;
    }
    
    .data-table tr:hover {
        background: #f8fafc;
    }
    
    .season-cell {
        font-weight: 600;
        color: #1e293b;
    }
    
    .processed {
        color: #059669;
    }
    
    .unprocessed {
        color: #dc2626;
    }
    
    /* Status Badges */
    .status-badge {
        display: inline-block;
        padding: 0.25rem 0.625rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.025em;
    }
    
    .status-badge.small {
        padding: 0.2rem 0.5rem;
        font-size: 0.7rem;
    }
    
    .status-badge.complete {
        background: #d1fae5;
        color: #065f46;
    }
    
    .status-badge.partial {
        background: #fef3c7;
        color: #92400e;
    }
    
    .status-badge.pending {
        background: #fee2e2;
        color: #991b1b;
    }
    
    .status-badge.empty {
        background: #f1f5f9;
        color: #64748b;
    }
    
    /* Season Selector */
    .season-selector {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1.5rem;
        padding: 1rem;
        background: #f8fafc;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
    }
    
    .season-selector label {
        font-size: 0.875rem;
        font-weight: 600;
        color: #475569;
    }
    
    .season-selector select {
        padding: 0.5rem 1rem;
        font-size: 0.95rem;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        background: white;
        cursor: pointer;
    }
    
    .season-selector select:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }
    
    /* Weekly Grid */
    .weekly-grid-container {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        overflow: hidden;
        margin-bottom: 1.5rem;
    }
    
    .weekly-grid {
        display: flex;
        flex-direction: column;
    }
    
    .grid-header {
        display: flex;
        background: #f1f5f9;
        border-bottom: 1px solid #e2e8f0;
    }
    
    .header-cell {
        padding: 0.875rem 1rem;
        font-weight: 600;
        font-size: 0.8rem;
        color: #475569;
    }
    
    .header-cell .table-name {
        display: block;
        font-size: 0.85rem;
        color: #334155;
    }
    
    .header-cell .target-hint {
        display: block;
        font-size: 0.7rem;
        font-weight: 400;
        color: #059669;
        margin-top: 0.25rem;
    }
    
    .grid-row {
        display: flex;
        border-bottom: 1px solid #f1f5f9;
    }
    
    .grid-row:last-child {
        border-bottom: none;
    }
    
    .grid-row:hover {
        background: #f8fafc;
    }
    
    .cell {
        padding: 0.75rem 1rem;
        display: flex;
        align-items: center;
    }
    
    .week-col {
        width: 80px;
        justify-content: center;
    }
    
    .table-col {
        flex: 1;
    }
    
    .week-number {
        font-weight: 600;
        color: #334155;
        background: #f1f5f9;
        padding: 0.25rem 0.625rem;
        border-radius: 4px;
        font-size: 0.875rem;
    }
    
    .cell-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    
    .counts {
        font-size: 0.8rem;
        color: #64748b;
    }
    
    .count-processed {
        color: #059669;
        font-weight: 500;
    }
    
    .count-unprocessed {
        color: #dc2626;
        font-weight: 500;
    }
    
    .no-data {
        color: #cbd5e1;
        font-size: 1rem;
    }
    
    .empty-weeks {
        padding: 2rem;
        text-align: center;
        color: #94a3b8;
    }
    
    /* Legend */
    .legend {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 1rem 1.25rem;
    }
    
    .legend h4 {
        margin: 0 0 0.75rem 0;
        font-size: 0.8rem;
        font-weight: 600;
        color: #475569;
        text-transform: uppercase;
        letter-spacing: 0.025em;
    }
    
    .legend-items {
        display: flex;
        flex-wrap: wrap;
        gap: 1.5rem;
    }
    
    .legend-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.8rem;
        color: #64748b;
    }
    
    .counts-legend {
        font-size: 0.8rem;
    }
    
    .empty-state {
        text-align: center;
        padding: 3rem;
        color: #64748b;
    }
    
    /* Production Table Styles */
    .production-grid {
        overflow-x: auto;
        margin-bottom: 1.5rem;
    }
    
    .production-table {
        min-width: 900px;
    }
    
    .production-table th,
    .production-table td {
        text-align: center;
        white-space: nowrap;
    }
    
    .production-table .sticky-col {
        position: sticky;
        left: 0;
        background: white;
        z-index: 1;
        text-align: left;
    }
    
    .production-table thead .sticky-col {
        background: #f8fafc;
    }
    
    .production-table tr:hover .sticky-col {
        background: #f8fafc;
    }
    
    .has-data {
        display: inline-block;
        padding: 0.2rem 0.5rem;
        background: #d1fae5;
        color: #065f46;
        border-radius: 4px;
        font-weight: 600;
        font-size: 0.8rem;
    }
    
    .no-data-icon {
        color: #dc2626;
        font-weight: 700;
        font-size: 0.9rem;
    }
    
    .active-badge {
        display: inline-block;
        margin-left: 0.5rem;
        padding: 0.15rem 0.4rem;
        background: #3b82f6;
        color: white;
        border-radius: 3px;
        font-size: 0.65rem;
        font-weight: 600;
        text-transform: uppercase;
        vertical-align: middle;
    }
    
    .production-legend {
        margin-top: 1rem;
    }
    
    /* Responsive */
    @media (max-width: 768px) {
        .dashboard {
            padding: 1rem;
        }
        
        .dashboard-header {
            flex-direction: column;
            gap: 1rem;
        }
        
        .tabs {
            overflow-x: auto;
        }
        
        .tab {
            white-space: nowrap;
        }
        
        .legend-items {
            flex-direction: column;
            gap: 0.75rem;
        }
    }
</style-->
















<!--script>
    import { invalidateAll } from '$app/navigation';
    
    export let data;
    
    let selectedSeason = data.seasons?.length > 0 ? data.seasons[0] : null;
    let activeTab = 'production'; // 'production', 'season', or 'weekly'
    let refreshing = false;
    
    async function refresh() {
        refreshing = true;
        await invalidateAll();
        refreshing = false;
    }
    
    function getStatusClass(processed, unprocessed) {
        if (unprocessed === 0 && processed > 0) return 'complete';
        if (processed === 0 && unprocessed > 0) return 'pending';
        if (processed > 0 && unprocessed > 0) return 'partial';
        return 'empty';
    }
    
    function getStatusLabel(processed, unprocessed) {
        if (unprocessed === 0 && processed > 0) return 'Complete';
        if (processed === 0 && unprocessed > 0) return 'Pending';
        if (processed > 0 && unprocessed > 0) return 'Partial';
        return 'Empty';
    }
    
    // Get all unique weeks across all week-level tables for the selected season
    $: selectedSeasonWeeks = (() => {
        if (!data || !selectedSeason || !data.weekLevel[selectedSeason]) return [];
        
        const seasonData = data.weekLevel[selectedSeason];
        const allWeeks = new Set();
        
        seasonData.matchups.forEach(r => allWeeks.add(r.week));
        seasonData.playerStats.forEach(r => allWeeks.add(r.week));
        seasonData.weeklyRosters.forEach(r => allWeeks.add(r.week));
        
        return Array.from(allWeeks).sort((a, b) => a - b);
    })();
    
    // Helper to get week data for a specific table
    function getWeekData(tableName, week) {
        if (!data || !selectedSeason || !data.weekLevel[selectedSeason]) return null;
        
        const seasonData = data.weekLevel[selectedSeason];
        const tableData = seasonData[tableName];
        
        return tableData?.find(r => r.week === week) || null;
    }
</script>

<svelte:head>
    <title>Staging Tables Status | Admin</title>
</svelte:head>

<div class="dashboard">
    <header class="dashboard-header">
        <div class="header-content">
            <h1>Staging Tables Status</h1>
            <p class="subtitle">View data in staging tables awaiting processing</p>
        </div>
        <button class="refresh-btn" on:click={refresh} disabled={refreshing}>
            {#if refreshing}
                <span class="spinner-small"></span>
            {:else}
                ↻
            {/if}
            Refresh
        </button>
    </header>
    
    {#if data.error}
        <div class="error-message">
            <strong>Error:</strong> {data.error}
        </div>
    {/if}
    
    {#if data}
        <!-- Tab Navigation >
        <div class="tabs">
            <button 
                class="tab" 
                class:active={activeTab === 'production'}
                on:click={() => activeTab = 'production'}
            >
                Production Status
            </button>
            <button 
                class="tab" 
                class:active={activeTab === 'season'}
                on:click={() => activeTab = 'season'}
            >
                Season-Level Staging
            </button>
            <button 
                class="tab" 
                class:active={activeTab === 'weekly'}
                on:click={() => activeTab = 'weekly'}
            >
                Weekly Staging
            </button>
        </div>
        
        <!-- Production Status Tab >
        {#if activeTab === 'production'}
            <div class="tab-content">
                <h2>Sleeper Seasons - Production Data Status</h2>
                <p class="section-desc">Shows which Sleeper seasons have data in production tables</p>
                
                {#if data.sleeperSeasons.length === 0}
                    <div class="empty-table">No Sleeper seasons found in database</div>
                {:else}
                    <div class="production-grid">
                        <table class="data-table production-table">
                            <thead>
                                <tr>
                                    <th class="sticky-col">Season</th>
                                    <th>Teams</th>
                                    <th>Managers</th>
                                    <th>Drafts</th>
                                    <th>Draft Picks</th>
                                    <th>Weekly Rosters</th>
                                    <th>Playoff Rosters</th>
                                    <th>Player Stats</th>
                                    <th>Playoff Stats</th>
                                    <th>Matchups</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each data.sleeperSeasons as season}
                                    {@const teams = data.production.teams.find(t => t.season_id === season.season_id)}
                                    {@const managers = data.production.managers.find(m => m.season_id === season.season_id)}
                                    {@const drafts = data.production.drafts.find(d => d.season_id === season.season_id)}
                                    {@const picks = data.production.draftPicks.find(p => p.season_id === season.season_id)}
                                    {@const weeklyRoster = data.production.weeklyRoster.find(w => w.season_id === season.season_id)}
                                    {@const playoffRoster = data.production.playoffRoster.find(p => p.season_id === season.season_id)}
                                    {@const playerStats = data.production.playerStats.find(p => p.season_id === season.season_id)}
                                    {@const playoffStats = data.production.playoffStats.find(p => p.season_id === season.season_id)}
                                    {@const matchups = data.production.matchups.find(m => m.season_id === season.season_id)}
                                    <tr>
                                        <td class="sticky-col season-cell">
                                            {season.season_year}
                                            {#if season.is_active}
                                                <span class="active-badge">Active</span>
                                            {/if}
                                        </td>
                                        <td>
                                            {#if teams}
                                                <span class="has-data">{teams.team_count}</span>
                                            {:else}
                                                <span class="no-data-icon">✗</span>
                                            {/if}
                                        </td>
                                        <td>
                                            {#if managers}
                                                <span class="has-data">{managers.manager_count}</span>
                                            {:else}
                                                <span class="no-data-icon">✗</span>
                                            {/if}
                                        </td>
                                        <td>
                                            {#if drafts}
                                                <span class="has-data">{drafts.draft_count}</span>
                                            {:else}
                                                <span class="no-data-icon">✗</span>
                                            {/if}
                                        </td>
                                        <td>
                                            {#if picks && picks.pick_count > 0}
                                                <span class="has-data">{picks.pick_count}</span>
                                            {:else}
                                                <span class="no-data-icon">✗</span>
                                            {/if}
                                        </td>
                                        <td>
                                            {#if weeklyRoster}
                                                <span class="has-data" title="{weeklyRoster.total_records} records">
                                                    {weeklyRoster.weeks_with_data} wks
                                                </span>
                                            {:else}
                                                <span class="no-data-icon">✗</span>
                                            {/if}
                                        </td>
                                        <td>
                                            {#if playoffRoster}
                                                <span class="has-data" title="{playoffRoster.total_records} records">
                                                    {playoffRoster.weeks_with_data} wks
                                                </span>
                                            {:else}
                                                <span class="no-data-icon">✗</span>
                                            {/if}
                                        </td>
                                        <td>
                                            {#if playerStats}
                                                <span class="has-data" title="{playerStats.total_records} records">
                                                    {playerStats.weeks_with_data} wks
                                                </span>
                                            {:else}
                                                <span class="no-data-icon">✗</span>
                                            {/if}
                                        </td>
                                        <td>
                                            {#if playoffStats}
                                                <span class="has-data" title="{playoffStats.total_records} records">
                                                    {playoffStats.weeks_with_data} wks
                                                </span>
                                            {:else}
                                                <span class="no-data-icon">✗</span>
                                            {/if}
                                        </td>
                                        <td>
                                            {#if matchups}
                                                <span class="has-data" title="{matchups.total_records} records">
                                                    {matchups.weeks_with_data} wks
                                                </span>
                                            {:else}
                                                <span class="no-data-icon">✗</span>
                                            {/if}
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="legend production-legend">
                        <div class="legend-items">
                            <div class="legend-item">
                                <span class="has-data">123</span>
                                <span>Has data (count shown)</span>
                            </div>
                            <div class="legend-item">
                                <span class="no-data-icon">✗</span>
                                <span>No data</span>
                            </div>
                            <div class="legend-item">
                                <span class="active-badge">Active</span>
                                <span>Current active season</span>
                            </div>
                        </div>
                    </div>
                {/if}
            </div>
        {/if}
        
        <!-- Season-Level Staging Tab >
        {#if activeTab === 'season'}
            <div class="tab-content">
                <h2>Season-Level Staging Tables</h2>
                <p class="section-desc">Data in staging tables waiting to be processed into production</p>
                
                {#if data.sleeperSeasons.length === 0}
                    <div class="empty-table">No Sleeper seasons found in database</div>
                {:else}
                    <div class="production-grid">
                        <table class="data-table production-table">
                            <thead>
                                <tr>
                                    <th class="sticky-col">Season</th>
                                    <th>League</th>
                                    <th>Users → Managers</th>
                                    <th>Rosters → Teams</th>
                                    <th>Drafts</th>
                                    <th>Draft Picks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each data.sleeperSeasons as season}
                                    {@const league = data.seasonLevel.league.find(l => l.season_year === season.season_year)}
                                    {@const users = data.seasonLevel.users.find(u => u.season_year === season.season_year)}
                                    {@const rosters = data.seasonLevel.rosters.find(r => r.season_year === season.season_year)}
                                    {@const drafts = data.seasonLevel.drafts.find(d => d.season_year === season.season_year)}
                                    {@const draftPicks = data.seasonLevel.draftPicks.find(p => p.season_year === season.season_year)}
                                    <tr>
                                        <td class="sticky-col season-cell">
                                            {season.season_year}
                                            {#if season.is_active}
                                                <span class="active-badge">Active</span>
                                            {/if}
                                        </td>
                                        <td>
                                            {#if league}
                                                <div class="staging-cell">
                                                    <span class="status-badge small {getStatusClass(league.processed_count, league.unprocessed_count)}">
                                                        {getStatusLabel(league.processed_count, league.unprocessed_count)}
                                                    </span>
                                                    <span class="staging-counts">
                                                        <span class="count-processed">{league.processed_count}</span>/<span class="count-unprocessed">{league.unprocessed_count}</span>
                                                    </span>
                                                </div>
                                            {:else}
                                                <span class="no-staging">—</span>
                                            {/if}
                                        </td>
                                        <td>
                                            {#if users}
                                                <div class="staging-cell">
                                                    <span class="status-badge small {getStatusClass(users.processed_count, users.unprocessed_count)}">
                                                        {getStatusLabel(users.processed_count, users.unprocessed_count)}
                                                    </span>
                                                    <span class="staging-counts">
                                                        <span class="count-processed">{users.processed_count}</span>/<span class="count-unprocessed">{users.unprocessed_count}</span>
                                                    </span>
                                                    {#if users.mapped_count > 0}
                                                        <span class="mapped-count" title="Mapped to managers">{users.mapped_count} mapped</span>
                                                    {/if}
                                                </div>
                                            {:else}
                                                <span class="no-staging">—</span>
                                            {/if}
                                        </td>
                                        <td>
                                            {#if rosters}
                                                <div class="staging-cell">
                                                    <span class="status-badge small {getStatusClass(rosters.processed_count, rosters.unprocessed_count)}">
                                                        {getStatusLabel(rosters.processed_count, rosters.unprocessed_count)}
                                                    </span>
                                                    <span class="staging-counts">
                                                        <span class="count-processed">{rosters.processed_count}</span>/<span class="count-unprocessed">{rosters.unprocessed_count}</span>
                                                    </span>
                                                    {#if rosters.mapped_count > 0}
                                                        <span class="mapped-count" title="Mapped to teams">{rosters.mapped_count} mapped</span>
                                                    {/if}
                                                </div>
                                            {:else}
                                                <span class="no-staging">—</span>
                                            {/if}
                                        </td>
                                        <td>
                                            {#if drafts}
                                                <div class="staging-cell">
                                                    <span class="status-badge small {getStatusClass(drafts.processed_count, drafts.unprocessed_count)}">
                                                        {getStatusLabel(drafts.processed_count, drafts.unprocessed_count)}
                                                    </span>
                                                    <span class="staging-counts">
                                                        <span class="count-processed">{drafts.processed_count}</span>/<span class="count-unprocessed">{drafts.unprocessed_count}</span>
                                                    </span>
                                                    {#if drafts.mapped_count > 0}
                                                        <span class="mapped-count" title="Mapped to drafts">{drafts.mapped_count} mapped</span>
                                                    {/if}
                                                </div>
                                            {:else}
                                                <span class="no-staging">—</span>
                                            {/if}
                                        </td>
                                        <td>
                                            {#if draftPicks}
                                                <div class="staging-cell">
                                                    <span class="status-badge small {getStatusClass(draftPicks.processed_count, draftPicks.unprocessed_count)}">
                                                        {getStatusLabel(draftPicks.processed_count, draftPicks.unprocessed_count)}
                                                    </span>
                                                    <span class="staging-counts">
                                                        <span class="count-processed">{draftPicks.processed_count}</span>/<span class="count-unprocessed">{draftPicks.unprocessed_count}</span>
                                                    </span>
                                                    {#if draftPicks.mapped_count > 0}
                                                        <span class="mapped-count" title="Mapped to picks">{draftPicks.mapped_count} mapped</span>
                                                    {/if}
                                                </div>
                                            {:else}
                                                <span class="no-staging">—</span>
                                            {/if}
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="legend">
                        <h4>Legend</h4>
                        <div class="legend-items">
                            <div class="legend-item">
                                <span class="status-badge small complete">Complete</span>
                                <span>All records processed</span>
                            </div>
                            <div class="legend-item">
                                <span class="status-badge small partial">Partial</span>
                                <span>Some records processed</span>
                            </div>
                            <div class="legend-item">
                                <span class="status-badge small pending">Pending</span>
                                <span>No records processed yet</span>
                            </div>
                            <div class="legend-item">
                                <span class="staging-counts">
                                    <span class="count-processed">✓</span>/<span class="count-unprocessed">✗</span>
                                </span>
                                <span>Processed / Unprocessed</span>
                            </div>
                            <div class="legend-item">
                                <span class="no-staging">—</span>
                                <span>No staging data</span>
                            </div>
                        </div>
                    </div>
                {/if}
            </div>
        {/if}
        
        <!-- Weekly Data Tab >
        {#if activeTab === 'weekly'}
            <div class="tab-content">
                <h2>Weekly Staging Tables</h2>
                <p class="section-desc">Week-by-week data in staging tables waiting to be processed</p>
                
                <!-- Season Selector >
                <div class="season-selector">
                    <label for="season-select">Select Season:</label>
                    <select id="season-select" bind:value={selectedSeason}>
                        {#each data.seasons as season}
                            <option value={season}>{season}</option>
                        {/each}
                    </select>
                </div>
                
                {#if selectedSeason && data.weekLevel[selectedSeason]}
                    <!-- Weekly Grid View >
                    <div class="weekly-grid-container">
                        <div class="weekly-grid">
                            <div class="grid-header">
                                <div class="header-cell week-col">Week</div>
                                <div class="header-cell table-col">
                                    <span class="table-name">weekly_rosters</span>
                                    <span class="target-hint">→ weekly_roster / playoff_roster</span>
                                </div>
                                <div class="header-cell table-col">
                                    <span class="table-name">player_stats</span>
                                    <span class="target-hint">→ player_fantasy_stats / playoff_fantasy_stats</span>
                                </div>
                                <div class="header-cell table-col">
                                    <span class="table-name">matchups</span>
                                    <span class="target-hint">→ matchups / playoffs</span>
                                </div>
                            </div>
                            
                            {#each selectedSeasonWeeks as week}
                                {@const rosterData = getWeekData('weeklyRosters', week)}
                                {@const statsData = getWeekData('playerStats', week)}
                                {@const matchupData = getWeekData('matchups', week)}
                                <div class="grid-row">
                                    <div class="cell week-col">
                                        <span class="week-number">{week}</span>
                                    </div>
                                    
                                    <!-- Weekly Rosters >
                                    <div class="cell table-col">
                                        {#if rosterData}
                                            <div class="cell-content">
                                                <span class="status-badge small {getStatusClass(rosterData.processed_count, rosterData.unprocessed_count)}">
                                                    {getStatusLabel(rosterData.processed_count, rosterData.unprocessed_count)}
                                                </span>
                                                <span class="counts">
                                                    <span class="count-processed" title="Processed">{rosterData.processed_count}</span>
                                                    /
                                                    <span class="count-unprocessed" title="Unprocessed">{rosterData.unprocessed_count}</span>
                                                </span>
                                            </div>
                                        {:else}
                                            <span class="no-data">—</span>
                                        {/if}
                                    </div>
                                    
                                    <!-- Player Stats >
                                    <div class="cell table-col">
                                        {#if statsData}
                                            <div class="cell-content">
                                                <span class="status-badge small {getStatusClass(statsData.processed_count, statsData.unprocessed_count)}">
                                                    {getStatusLabel(statsData.processed_count, statsData.unprocessed_count)}
                                                </span>
                                                <span class="counts">
                                                    <span class="count-processed" title="Processed">{statsData.processed_count}</span>
                                                    /
                                                    <span class="count-unprocessed" title="Unprocessed">{statsData.unprocessed_count}</span>
                                                </span>
                                            </div>
                                        {:else}
                                            <span class="no-data">—</span>
                                        {/if}
                                    </div>
                                    
                                    <!-- Matchups >
                                    <div class="cell table-col">
                                        {#if matchupData}
                                            <div class="cell-content">
                                                <span class="status-badge small {getStatusClass(matchupData.processed_count, matchupData.unprocessed_count)}">
                                                    {getStatusLabel(matchupData.processed_count, matchupData.unprocessed_count)}
                                                </span>
                                                <span class="counts">
                                                    <span class="count-processed" title="Processed">{matchupData.processed_count}</span>
                                                    /
                                                    <span class="count-unprocessed" title="Unprocessed">{matchupData.unprocessed_count}</span>
                                                </span>
                                            </div>
                                        {:else}
                                            <span class="no-data">—</span>
                                        {/if}
                                    </div>
                                </div>
                            {/each}
                            
                            {#if selectedSeasonWeeks.length === 0}
                                <div class="empty-weeks">No weekly data found for {selectedSeason}</div>
                            {/if}
                        </div>
                    </div>
                    
                    <!-- Legend >
                    <div class="legend">
                        <h4>Legend</h4>
                        <div class="legend-items">
                            <div class="legend-item">
                                <span class="status-badge small complete">Complete</span>
                                <span>All records processed</span>
                            </div>
                            <div class="legend-item">
                                <span class="status-badge small partial">Partial</span>
                                <span>Some records processed</span>
                            </div>
                            <div class="legend-item">
                                <span class="status-badge small pending">Pending</span>
                                <span>No records processed yet</span>
                            </div>
                            <div class="legend-item">
                                <span class="counts-legend">
                                    <span class="count-processed">✓</span> / <span class="count-unprocessed">✗</span>
                                </span>
                                <span>Processed / Unprocessed counts</span>
                            </div>
                        </div>
                    </div>
                {:else}
                    <div class="empty-state">
                        <p>No weekly data available</p>
                    </div>
                {/if}
            </div>
        {/if}
    {/if}
</div>

<style>
    .dashboard {
        max-width: 1100px;
        margin: 0 auto;
        padding: 2rem;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 2px solid #e2e8f0;
    }
    
    .header-content h1 {
        margin: 0 0 0.5rem 0;
        font-size: 1.75rem;
        font-weight: 700;
        color: #1e293b;
    }
    
    .subtitle {
        margin: 0;
        color: #64748b;
        font-size: 0.95rem;
    }
    
    .refresh-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.625rem 1rem;
        background: #f1f5f9;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        font-size: 0.875rem;
        font-weight: 500;
        color: #475569;
        cursor: pointer;
        transition: all 0.15s ease;
    }
    
    .refresh-btn:hover:not(:disabled) {
        background: #e2e8f0;
        border-color: #94a3b8;
    }
    
    .refresh-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
    
    .spinner-small {
        width: 14px;
        height: 14px;
        border: 2px solid #cbd5e1;
        border-top-color: #3b82f6;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }
    
    .error-message {
        padding: 1rem;
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 8px;
        color: #991b1b;
        margin-bottom: 1.5rem;
    }
    
    .loading {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 3rem;
        justify-content: center;
        color: #64748b;
    }
    
    .spinner {
        width: 28px;
        height: 28px;
        border: 3px solid #e2e8f0;
        border-top-color: #3b82f6;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    
    /* Tabs */
    .tabs {
        display: flex;
        gap: 0;
        margin-bottom: 1.5rem;
        border-bottom: 2px solid #e2e8f0;
    }
    
    .tab {
        padding: 0.875rem 1.5rem;
        background: none;
        border: none;
        font-size: 0.95rem;
        font-weight: 500;
        color: #64748b;
        cursor: pointer;
        border-bottom: 2px solid transparent;
        margin-bottom: -2px;
        transition: all 0.15s ease;
    }
    
    .tab:hover {
        color: #334155;
    }
    
    .tab.active {
        color: #3b82f6;
        border-bottom-color: #3b82f6;
    }
    
    .tab-content {
        animation: fadeIn 0.2s ease;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    .tab-content h2 {
        margin: 0 0 0.5rem 0;
        font-size: 1.1rem;
        font-weight: 600;
        color: #334155;
    }
    
    .section-desc {
        margin: 0 0 1.5rem 0;
        color: #64748b;
        font-size: 0.875rem;
    }
    
    /* Staging Table Sections */
    .staging-table-section {
        margin-bottom: 1.5rem;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        overflow: hidden;
    }
    
    .staging-table-section h3 {
        margin: 0;
        padding: 0.875rem 1rem;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
        font-size: 0.9rem;
        font-weight: 600;
        color: #334155;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .table-icon {
        font-size: 1rem;
    }
    
    .arrow {
        color: #94a3b8;
        margin: 0 0.25rem;
    }
    
    .target {
        color: #059669;
        font-weight: 500;
    }
    
    .empty-table {
        padding: 1.5rem;
        text-align: center;
        color: #94a3b8;
        font-size: 0.875rem;
    }
    
    /* Data Tables */
    .data-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.875rem;
    }
    
    .data-table th {
        text-align: left;
        padding: 0.75rem 1rem;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
        font-weight: 600;
        color: #475569;
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.025em;
    }
    
    .data-table td {
        padding: 0.75rem 1rem;
        border-bottom: 1px solid #f1f5f9;
        color: #334155;
    }
    
    .data-table tr:last-child td {
        border-bottom: none;
    }
    
    .data-table tr:hover {
        background: #f8fafc;
    }
    
    .season-cell {
        font-weight: 600;
        color: #1e293b;
    }
    
    .processed {
        color: #059669;
    }
    
    .unprocessed {
        color: #dc2626;
    }
    
    /* Status Badges */
    .status-badge {
        display: inline-block;
        padding: 0.25rem 0.625rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.025em;
    }
    
    .status-badge.small {
        padding: 0.2rem 0.5rem;
        font-size: 0.7rem;
    }
    
    .status-badge.complete {
        background: #d1fae5;
        color: #065f46;
    }
    
    .status-badge.partial {
        background: #fef3c7;
        color: #92400e;
    }
    
    .status-badge.pending {
        background: #fee2e2;
        color: #991b1b;
    }
    
    .status-badge.empty {
        background: #f1f5f9;
        color: #64748b;
    }
    
    /* Season Selector */
    .season-selector {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1.5rem;
        padding: 1rem;
        background: #f8fafc;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
    }
    
    .season-selector label {
        font-size: 0.875rem;
        font-weight: 600;
        color: #475569;
    }
    
    .season-selector select {
        padding: 0.5rem 1rem;
        font-size: 0.95rem;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        background: white;
        cursor: pointer;
    }
    
    .season-selector select:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }
    
    /* Weekly Grid */
    .weekly-grid-container {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        overflow: hidden;
        margin-bottom: 1.5rem;
    }
    
    .weekly-grid {
        display: flex;
        flex-direction: column;
    }
    
    .grid-header {
        display: flex;
        background: #f1f5f9;
        border-bottom: 1px solid #e2e8f0;
    }
    
    .header-cell {
        padding: 0.875rem 1rem;
        font-weight: 600;
        font-size: 0.8rem;
        color: #475569;
    }
    
    .header-cell .table-name {
        display: block;
        font-size: 0.85rem;
        color: #334155;
    }
    
    .header-cell .target-hint {
        display: block;
        font-size: 0.7rem;
        font-weight: 400;
        color: #059669;
        margin-top: 0.25rem;
    }
    
    .grid-row {
        display: flex;
        border-bottom: 1px solid #f1f5f9;
    }
    
    .grid-row:last-child {
        border-bottom: none;
    }
    
    .grid-row:hover {
        background: #f8fafc;
    }
    
    .cell {
        padding: 0.75rem 1rem;
        display: flex;
        align-items: center;
    }
    
    .week-col {
        width: 80px;
        justify-content: center;
    }
    
    .table-col {
        flex: 1;
    }
    
    .week-number {
        font-weight: 600;
        color: #334155;
        background: #f1f5f9;
        padding: 0.25rem 0.625rem;
        border-radius: 4px;
        font-size: 0.875rem;
    }
    
    .cell-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    
    .counts {
        font-size: 0.8rem;
        color: #64748b;
    }
    
    .count-processed {
        color: #059669;
        font-weight: 500;
    }
    
    .count-unprocessed {
        color: #dc2626;
        font-weight: 500;
    }
    
    .no-data {
        color: #cbd5e1;
        font-size: 1rem;
    }
    
    .empty-weeks {
        padding: 2rem;
        text-align: center;
        color: #94a3b8;
    }
    
    /* Legend */
    .legend {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 1rem 1.25rem;
    }
    
    .legend h4 {
        margin: 0 0 0.75rem 0;
        font-size: 0.8rem;
        font-weight: 600;
        color: #475569;
        text-transform: uppercase;
        letter-spacing: 0.025em;
    }
    
    .legend-items {
        display: flex;
        flex-wrap: wrap;
        gap: 1.5rem;
    }
    
    .legend-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.8rem;
        color: #64748b;
    }
    
    .counts-legend {
        font-size: 0.8rem;
    }
    
    .empty-state {
        text-align: center;
        padding: 3rem;
        color: #64748b;
    }
    
    /* Production Table Styles */
    .production-grid {
        overflow-x: auto;
        margin-bottom: 1.5rem;
    }
    
    .production-table {
        min-width: 900px;
    }
    
    .production-table th,
    .production-table td {
        text-align: center;
        white-space: nowrap;
    }
    
    .production-table .sticky-col {
        position: sticky;
        left: 0;
        background: white;
        z-index: 1;
        text-align: left;
    }
    
    .production-table thead .sticky-col {
        background: #f8fafc;
    }
    
    .production-table tr:hover .sticky-col {
        background: #f8fafc;
    }
    
    .has-data {
        display: inline-block;
        padding: 0.2rem 0.5rem;
        background: #d1fae5;
        color: #065f46;
        border-radius: 4px;
        font-weight: 600;
        font-size: 0.8rem;
    }
    
    .no-data-icon {
        color: #dc2626;
        font-weight: 700;
        font-size: 0.9rem;
    }
    
    .active-badge {
        display: inline-block;
        margin-left: 0.5rem;
        padding: 0.15rem 0.4rem;
        background: #3b82f6;
        color: white;
        border-radius: 3px;
        font-size: 0.65rem;
        font-weight: 600;
        text-transform: uppercase;
        vertical-align: middle;
    }
    
    .production-legend {
        margin-top: 1rem;
    }
    
    /* Staging Cell Styles */
    .staging-cell {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
    }
    
    .staging-counts {
        font-size: 0.75rem;
        color: #64748b;
    }
    
    .mapped-count {
        font-size: 0.65rem;
        color: #6366f1;
        background: #eef2ff;
        padding: 0.1rem 0.35rem;
        border-radius: 3px;
    }
    
    .no-staging {
        color: #cbd5e1;
        font-size: 1rem;
    }
    
    /* Responsive */
    @media (max-width: 768px) {
        .dashboard {
            padding: 1rem;
        }
        
        .dashboard-header {
            flex-direction: column;
            gap: 1rem;
        }
        
        .tabs {
            overflow-x: auto;
        }
        
        .tab {
            white-space: nowrap;
        }
        
        .legend-items {
            flex-direction: column;
            gap: 0.75rem;
        }
    }
</style-->


















<script>
    import { invalidateAll } from '$app/navigation';
    import { enhance } from '$app/forms';
    
    export let data;
    
    let selectedSeason = data.seasons?.length > 0 ? data.seasons[0] : null;
    let activeTab = 'production'; // 'production', 'season', or 'weekly'
    let refreshing = false;
    let fetchingDraftPicks = null; // Track which season is being fetched
    let fetchResult = null; // Store fetch result message
    
    async function refresh() {
        refreshing = true;
        await invalidateAll();
        refreshing = false;
    }
    
    function getStatusClass(processed, unprocessed) {
        if (unprocessed === 0 && processed > 0) return 'complete';
        if (processed === 0 && unprocessed > 0) return 'pending';
        if (processed > 0 && unprocessed > 0) return 'partial';
        return 'empty';
    }
    
    function getStatusLabel(processed, unprocessed) {
        if (unprocessed === 0 && processed > 0) return 'Complete';
        if (processed === 0 && unprocessed > 0) return 'Pending';
        if (processed > 0 && unprocessed > 0) return 'Partial';
        return 'Empty';
    }
    
    // Helper to check if a season exists in Sleeper seasons
    function getSleeperSeason(seasonYear) {
        return data.sleeperSeasons?.find(s => s.season_year === seasonYear);
    }
    
    // Helper to get production data for a season
    function getProductionData(type, seasonYear) {
        const season = getSleeperSeason(seasonYear);
        if (!season) return null;
        return data.production[type]?.find(p => p.season_id === season.season_id);
    }
    
    // Get all unique weeks across all week-level tables for the selected season
    $: selectedSeasonWeeks = (() => {
        if (!data || !selectedSeason || !data.weekLevel[selectedSeason]) return [];
        
        const seasonData = data.weekLevel[selectedSeason];
        const allWeeks = new Set();
        
        seasonData.matchups.forEach(r => allWeeks.add(r.week));
        seasonData.playerStats.forEach(r => allWeeks.add(r.week));
        seasonData.weeklyRosters.forEach(r => allWeeks.add(r.week));
        
        return Array.from(allWeeks).sort((a, b) => a - b);
    })();
    
    // Helper to get week data for a specific table
    function getWeekData(tableName, week) {
        if (!data || !selectedSeason || !data.weekLevel[selectedSeason]) return null;
        
        const seasonData = data.weekLevel[selectedSeason];
        const tableData = seasonData[tableName];
        
        return tableData?.find(r => r.week === week) || null;
    }
</script>

<svelte:head>
    <title>Staging Tables Status | Admin</title>
</svelte:head>

<div class="dashboard">
    <header class="dashboard-header">
        <div class="header-content">
            <h1>Staging Tables Status</h1>
            <p class="subtitle">View data in staging tables awaiting processing</p>
        </div>
        <button class="refresh-btn" on:click={refresh} disabled={refreshing}>
            {#if refreshing}
                <span class="spinner-small"></span>
            {:else}
                ↻
            {/if}
            Refresh
        </button>
    </header>
    
    {#if data.error}
        <div class="error-message">
            <strong>Error:</strong> {data.error}
        </div>
    {/if}
    
    {#if data}
        <!-- Tab Navigation -->
        <div class="tabs">
            <button 
                class="tab" 
                class:active={activeTab === 'production'}
                on:click={() => activeTab = 'production'}
            >
                Production Status
            </button>
            <button 
                class="tab" 
                class:active={activeTab === 'season'}
                on:click={() => activeTab = 'season'}
            >
                Season-Level Staging
            </button>
            <button 
                class="tab" 
                class:active={activeTab === 'weekly'}
                on:click={() => activeTab = 'weekly'}
            >
                Weekly Staging
            </button>
        </div>
        
        <!-- Production Status Tab -->
        {#if activeTab === 'production'}
            <div class="tab-content">
                <h2>Sleeper Seasons - Production Data Status</h2>
                <p class="section-desc">Shows which Sleeper seasons have data in production tables</p>
                
                {#if data.sleeperSeasons.length === 0}
                    <div class="empty-table">No Sleeper seasons found in database</div>
                {:else}
                    <div class="production-grid">
                        <table class="data-table production-table">
                            <thead>
                                <tr>
                                    <th class="sticky-col">Season</th>
                                    <th>Teams</th>
                                    <th>Managers</th>
                                    <th>Drafts</th>
                                    <th>Draft Picks</th>
                                    <th>Weekly Rosters</th>
                                    <th>Playoff Rosters</th>
                                    <th>Player Stats</th>
                                    <th>Playoff Stats</th>
                                    <th>Matchups</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each data.sleeperSeasons as season}
                                    {@const teams = data.production.teams.find(t => t.season_id === season.season_id)}
                                    {@const managers = data.production.managers.find(m => m.season_id === season.season_id)}
                                    {@const drafts = data.production.drafts.find(d => d.season_id === season.season_id)}
                                    {@const picks = data.production.draftPicks.find(p => p.season_id === season.season_id)}
                                    {@const weeklyRoster = data.production.weeklyRoster.find(w => w.season_id === season.season_id)}
                                    {@const playoffRoster = data.production.playoffRoster.find(p => p.season_id === season.season_id)}
                                    {@const playerStats = data.production.playerStats.find(p => p.season_id === season.season_id)}
                                    {@const playoffStats = data.production.playoffStats.find(p => p.season_id === season.season_id)}
                                    {@const matchups = data.production.matchups.find(m => m.season_id === season.season_id)}
                                    <tr>
                                        <td class="sticky-col season-cell">
                                            {season.season_year}
                                            {#if season.is_active}
                                                <span class="active-badge">Active</span>
                                            {/if}
                                        </td>
                                        <td>
                                            {#if teams}
                                                <span class="has-data">{teams.team_count}</span>
                                            {:else}
                                                <span class="no-data-icon">✗</span>
                                            {/if}
                                        </td>
                                        <td>
                                            {#if managers}
                                                <span class="has-data">{managers.manager_count}</span>
                                            {:else}
                                                <span class="no-data-icon">✗</span>
                                            {/if}
                                        </td>
                                        <td>
                                            {#if drafts}
                                                <span class="has-data">{drafts.draft_count}</span>
                                            {:else}
                                                <span class="no-data-icon">✗</span>
                                            {/if}
                                        </td>
                                        <td>
                                            {#if picks && picks.pick_count > 0}
                                                <span class="has-data">{picks.pick_count}</span>
                                            {:else}
                                                <span class="no-data-icon">✗</span>
                                            {/if}
                                        </td>
                                        <td>
                                            {#if weeklyRoster}
                                                <span class="has-data" title="{weeklyRoster.total_records} records">
                                                    {weeklyRoster.weeks_with_data} wks
                                                </span>
                                            {:else}
                                                <span class="no-data-icon">✗</span>
                                            {/if}
                                        </td>
                                        <td>
                                            {#if playoffRoster}
                                                <span class="has-data" title="{playoffRoster.total_records} records">
                                                    {playoffRoster.weeks_with_data} wks
                                                </span>
                                            {:else}
                                                <span class="no-data-icon">✗</span>
                                            {/if}
                                        </td>
                                        <td>
                                            {#if playerStats}
                                                <span class="has-data" title="{playerStats.total_records} records">
                                                    {playerStats.weeks_with_data} wks
                                                </span>
                                            {:else}
                                                <span class="no-data-icon">✗</span>
                                            {/if}
                                        </td>
                                        <td>
                                            {#if playoffStats}
                                                <span class="has-data" title="{playoffStats.total_records} records">
                                                    {playoffStats.weeks_with_data} wks
                                                </span>
                                            {:else}
                                                <span class="no-data-icon">✗</span>
                                            {/if}
                                        </td>
                                        <td>
                                            {#if matchups}
                                                <span class="has-data" title="{matchups.total_records} records">
                                                    {matchups.weeks_with_data} wks
                                                </span>
                                            {:else}
                                                <span class="no-data-icon">✗</span>
                                            {/if}
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="legend production-legend">
                        <div class="legend-items">
                            <div class="legend-item">
                                <span class="has-data">123</span>
                                <span>Has data (count shown)</span>
                            </div>
                            <div class="legend-item">
                                <span class="no-data-icon">✗</span>
                                <span>No data</span>
                            </div>
                            <div class="legend-item">
                                <span class="active-badge">Active</span>
                                <span>Current active season</span>
                            </div>
                        </div>
                    </div>
                {/if}
            </div>
        {/if}
        
        <!-- Season-Level Tables Tab -->
        {#if activeTab === 'season'}
            <div class="tab-content">
                <h2>Season-Level Staging Tables</h2>
                <p class="section-desc">Data in staging tables waiting to be processed into production</p>
                
                <!-- League Staging -->
                <div class="staging-table-section">
                    <h3>
                        <span class="table-icon">🏆</span>
                        staging_sleeper_league
                        <span class="arrow">→</span>
                        <span class="target">leagues</span>
                    </h3>
                    {#if data.seasonLevel.league.length === 0 && data.sleeperSeasons.length === 0}
                        <div class="empty-table">No data in staging table and no Sleeper seasons found</div>
                    {:else}
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Season</th>
                                    <th>In Staging</th>
                                    <th>Processed</th>
                                    <th>Unprocessed</th>
                                    <th>Status</th>
                                    <th>In Production</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each data.sleeperSeasons as season}
                                    {@const staging = data.seasonLevel.league.find(l => l.season_year === season.season_year)}
                                    <tr>
                                        <td class="season-cell">
                                            {season.season_year}
                                            {#if season.is_active}
                                                <span class="active-badge">Active</span>
                                            {/if}
                                        </td>
                                        <td>
                                            {#if staging}
                                                <span class="has-data">{staging.total_records}</span>
                                            {:else}
                                                <span class="no-staging">—</span>
                                            {/if}
                                        </td>
                                        <td class="processed">{staging?.processed_count ?? '—'}</td>
                                        <td class="unprocessed">{staging?.unprocessed_count ?? '—'}</td>
                                        <td>
                                            {#if staging}
                                                <span class="status-badge {getStatusClass(staging.processed_count, staging.unprocessed_count)}">
                                                    {getStatusLabel(staging.processed_count, staging.unprocessed_count)}
                                                </span>
                                            {:else}
                                                <span class="status-badge empty">No Data</span>
                                            {/if}
                                        </td>
                                        <td>
                                            <span class="has-data" title="Season exists in leagues table">✓</span>
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    {/if}
                </div>
                
                <!-- Users Staging -->
                <div class="staging-table-section">
                    <h3>
                        <span class="table-icon">👤</span>
                        staging_sleeper_users
                        <span class="arrow">→</span>
                        <span class="target">managers</span>
                    </h3>
                    {#if data.sleeperSeasons.length === 0}
                        <div class="empty-table">No Sleeper seasons found</div>
                    {:else}
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Season</th>
                                    <th>In Staging</th>
                                    <th>Processed</th>
                                    <th>Unprocessed</th>
                                    <th>Mapped</th>
                                    <th>Status</th>
                                    <th>In Production</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each data.sleeperSeasons as season}
                                    {@const staging = data.seasonLevel.users.find(u => u.season_year === season.season_year)}
                                    {@const production = data.production.managers.find(m => m.season_id === season.season_id)}
                                    <tr>
                                        <td class="season-cell">
                                            {season.season_year}
                                            {#if season.is_active}
                                                <span class="active-badge">Active</span>
                                            {/if}
                                        </td>
                                        <td>
                                            {#if staging}
                                                <span class="has-data">{staging.total_records}</span>
                                            {:else}
                                                <span class="no-staging">—</span>
                                            {/if}
                                        </td>
                                        <td class="processed">{staging?.processed_count ?? '—'}</td>
                                        <td class="unprocessed">{staging?.unprocessed_count ?? '—'}</td>
                                        <td>{staging?.mapped_count ?? '—'}</td>
                                        <td>
                                            {#if staging}
                                                <span class="status-badge {getStatusClass(staging.processed_count, staging.unprocessed_count)}">
                                                    {getStatusLabel(staging.processed_count, staging.unprocessed_count)}
                                                </span>
                                            {:else}
                                                <span class="status-badge empty">No Data</span>
                                            {/if}
                                        </td>
                                        <td>
                                            {#if production}
                                                <span class="has-data">{production.manager_count}</span>
                                            {:else}
                                                <span class="no-data-icon">✗</span>
                                            {/if}
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    {/if}
                </div>
                
                <!-- Rosters Staging -->
                <div class="staging-table-section">
                    <h3>
                        <span class="table-icon">📋</span>
                        staging_sleeper_rosters
                        <span class="arrow">→</span>
                        <span class="target">teams</span>
                    </h3>
                    {#if data.sleeperSeasons.length === 0}
                        <div class="empty-table">No Sleeper seasons found</div>
                    {:else}
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Season</th>
                                    <th>In Staging</th>
                                    <th>Processed</th>
                                    <th>Unprocessed</th>
                                    <th>Mapped</th>
                                    <th>Status</th>
                                    <th>In Production</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each data.sleeperSeasons as season}
                                    {@const staging = data.seasonLevel.rosters.find(r => r.season_year === season.season_year)}
                                    {@const production = data.production.teams.find(t => t.season_id === season.season_id)}
                                    <tr>
                                        <td class="season-cell">
                                            {season.season_year}
                                            {#if season.is_active}
                                                <span class="active-badge">Active</span>
                                            {/if}
                                        </td>
                                        <td>
                                            {#if staging}
                                                <span class="has-data">{staging.total_records}</span>
                                            {:else}
                                                <span class="no-staging">—</span>
                                            {/if}
                                        </td>
                                        <td class="processed">{staging?.processed_count ?? '—'}</td>
                                        <td class="unprocessed">{staging?.unprocessed_count ?? '—'}</td>
                                        <td>{staging?.mapped_count ?? '—'}</td>
                                        <td>
                                            {#if staging}
                                                <span class="status-badge {getStatusClass(staging.processed_count, staging.unprocessed_count)}">
                                                    {getStatusLabel(staging.processed_count, staging.unprocessed_count)}
                                                </span>
                                            {:else}
                                                <span class="status-badge empty">No Data</span>
                                            {/if}
                                        </td>
                                        <td>
                                            {#if production}
                                                <span class="has-data">{production.team_count}</span>
                                            {:else}
                                                <span class="no-data-icon">✗</span>
                                            {/if}
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    {/if}
                </div>
                
                <!-- Drafts Staging -->
                <div class="staging-table-section">
                    <h3>
                        <span class="table-icon">📝</span>
                        staging_sleeper_drafts
                        <span class="arrow">→</span>
                        <span class="target">drafts</span>
                    </h3>
                    {#if data.sleeperSeasons.length === 0}
                        <div class="empty-table">No Sleeper seasons found</div>
                    {:else}
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Season</th>
                                    <th>In Staging</th>
                                    <th>Processed</th>
                                    <th>Unprocessed</th>
                                    <th>Mapped</th>
                                    <th>Status</th>
                                    <th>In Production</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each data.sleeperSeasons as season}
                                    {@const staging = data.seasonLevel.drafts.find(d => d.season_year === season.season_year)}
                                    {@const production = data.production.drafts.find(d => d.season_id === season.season_id)}
                                    {@const needsFetch = !staging && !production}
                                    <tr>
                                        <td class="season-cell">
                                            {season.season_year}
                                            {#if season.is_active}
                                                <span class="active-badge">Active</span>
                                            {/if}
                                        </td>
                                        <td>
                                            {#if staging}
                                                <span class="has-data">{staging.total_records}</span>
                                            {:else}
                                                <span class="no-staging">—</span>
                                            {/if}
                                        </td>
                                        <td class="processed">{staging?.processed_count ?? '—'}</td>
                                        <td class="unprocessed">{staging?.unprocessed_count ?? '—'}</td>
                                        <td>{staging?.mapped_count ?? '—'}</td>
                                        <td>
                                            {#if staging}
                                                <span class="status-badge {getStatusClass(staging.processed_count, staging.unprocessed_count)}">
                                                    {getStatusLabel(staging.processed_count, staging.unprocessed_count)}
                                                </span>
                                            {:else}
                                                <span class="status-badge empty">No Data</span>
                                            {/if}
                                        </td>
                                        <td>
                                            {#if production}
                                                <span class="has-data">{production.draft_count}</span>
                                            {:else}
                                                <span class="no-data-icon">✗</span>
                                            {/if}
                                        </td>
                                        <td>
                                            {#if needsFetch}
                                                <form 
                                                    method="POST" 
                                                    action="?/fetchDraftPicks"
                                                    use:enhance={() => {
                                                        fetchingDraftPicks = season.season_year;
                                                        fetchResult = null;
                                                        return async ({ result }) => {
                                                            fetchingDraftPicks = null;
                                                            if (result.type === 'success') {
                                                                fetchResult = result.data;
                                                                await invalidateAll();
                                                            } else {
                                                                fetchResult = { success: false, error: 'Request failed' };
                                                            }
                                                        };
                                                    }}
                                                >
                                                    <input type="hidden" name="seasonYear" value={season.season_year} />
                                                    <input type="hidden" name="sleeperLeagueId" value={season.sleeper_league_id} />
                                                    <button 
                                                        type="submit" 
                                                        class="fetch-btn"
                                                        disabled={fetchingDraftPicks !== null}
                                                    >
                                                        {#if fetchingDraftPicks === season.season_year}
                                                            <span class="spinner-tiny"></span>
                                                            Fetching...
                                                        {:else}
                                                            ↓ Fetch
                                                        {/if}
                                                    </button>
                                                </form>
                                            {:else}
                                                <span class="no-action">—</span>
                                            {/if}
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    {/if}
                </div>
                
                <!-- Draft Picks Staging -->
                <div class="staging-table-section">
                    <h3>
                        <span class="table-icon">🎯</span>
                        staging_sleeper_draft_picks
                        <span class="arrow">→</span>
                        <span class="target">draft_picks</span>
                    </h3>
                    
                    {#if fetchResult}
                        <div class="fetch-result {fetchResult.success ? 'success' : 'error'}">
                            {#if fetchResult.success}
                                ✓ {fetchResult.message}
                            {:else}
                                ✗ Error: {fetchResult.error}
                            {/if}
                            <button class="dismiss-btn" on:click={() => fetchResult = null}>×</button>
                        </div>
                    {/if}
                    
                    {#if data.sleeperSeasons.length === 0}
                        <div class="empty-table">No Sleeper seasons found</div>
                    {:else}
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Season</th>
                                    <th>In Staging</th>
                                    <th>Processed</th>
                                    <th>Unprocessed</th>
                                    <th>Mapped</th>
                                    <th>Status</th>
                                    <th>In Production</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each data.sleeperSeasons as season}
                                    {@const staging = data.seasonLevel.draftPicks.find(p => p.season_year === season.season_year)}
                                    {@const production = data.production.draftPicks.find(p => p.season_id === season.season_id)}
                                    {@const needsFetch = !staging && (!production || production.pick_count === 0)}
                                    <tr>
                                        <td class="season-cell">
                                            {season.season_year}
                                            {#if season.is_active}
                                                <span class="active-badge">Active</span>
                                            {/if}
                                        </td>
                                        <td>
                                            {#if staging}
                                                <span class="has-data">{staging.total_records}</span>
                                            {:else}
                                                <span class="no-staging">—</span>
                                            {/if}
                                        </td>
                                        <td class="processed">{staging?.processed_count ?? '—'}</td>
                                        <td class="unprocessed">{staging?.unprocessed_count ?? '—'}</td>
                                        <td>{staging?.mapped_count ?? '—'}</td>
                                        <td>
                                            {#if staging}
                                                <span class="status-badge {getStatusClass(staging.processed_count, staging.unprocessed_count)}">
                                                    {getStatusLabel(staging.processed_count, staging.unprocessed_count)}
                                                </span>
                                            {:else}
                                                <span class="status-badge empty">No Data</span>
                                            {/if}
                                        </td>
                                        <td>
                                            {#if production && production.pick_count > 0}
                                                <span class="has-data">{production.pick_count}</span>
                                            {:else}
                                                <span class="no-data-icon">✗</span>
                                            {/if}
                                        </td>
                                        <td>
                                            {#if needsFetch}
                                                <form 
                                                    method="POST" 
                                                    action="?/fetchDraftPicks"
                                                    use:enhance={() => {
                                                        fetchingDraftPicks = season.season_year;
                                                        fetchResult = null;
                                                        return async ({ result }) => {
                                                            fetchingDraftPicks = null;
                                                            if (result.type === 'success') {
                                                                fetchResult = result.data;
                                                                await invalidateAll();
                                                            } else {
                                                                fetchResult = { success: false, error: 'Request failed' };
                                                            }
                                                        };
                                                    }}
                                                >
                                                    <input type="hidden" name="seasonYear" value={season.season_year} />
                                                    <input type="hidden" name="sleeperLeagueId" value={season.sleeper_league_id} />
                                                    <button 
                                                        type="submit" 
                                                        class="fetch-btn"
                                                        disabled={fetchingDraftPicks !== null}
                                                    >
                                                        {#if fetchingDraftPicks === season.season_year}
                                                            <span class="spinner-tiny"></span>
                                                            Fetching...
                                                        {:else}
                                                            ↓ Fetch
                                                        {/if}
                                                    </button>
                                                </form>
                                            {:else}
                                                <span class="no-action">—</span>
                                            {/if}
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    {/if}
                </div>
            </div>
        {/if}
        
        <!-- Weekly Data Tab -->
        {#if activeTab === 'weekly'}
            <div class="tab-content">
                <h2>Weekly Staging Tables</h2>
                <p class="section-desc">Week-by-week data in staging tables waiting to be processed</p>
                
                <!-- Season Selector -->
                <div class="season-selector">
                    <label for="season-select">Select Season:</label>
                    <select id="season-select" bind:value={selectedSeason}>
                        {#each data.seasons as season}
                            <option value={season}>{season}</option>
                        {/each}
                    </select>
                </div>
                
                {#if selectedSeason && data.weekLevel[selectedSeason]}
                    <!-- Weekly Grid View -->
                    <div class="weekly-grid-container">
                        <div class="weekly-grid">
                            <div class="grid-header">
                                <div class="header-cell week-col">Week</div>
                                <div class="header-cell table-col">
                                    <span class="table-name">weekly_rosters</span>
                                    <span class="target-hint">→ weekly_roster / playoff_roster</span>
                                </div>
                                <div class="header-cell table-col">
                                    <span class="table-name">player_stats</span>
                                    <span class="target-hint">→ player_fantasy_stats / playoff_fantasy_stats</span>
                                </div>
                                <div class="header-cell table-col">
                                    <span class="table-name">matchups</span>
                                    <span class="target-hint">→ matchups / playoffs</span>
                                </div>
                            </div>
                            
                            {#each selectedSeasonWeeks as week}
                                {@const rosterData = getWeekData('weeklyRosters', week)}
                                {@const statsData = getWeekData('playerStats', week)}
                                {@const matchupData = getWeekData('matchups', week)}
                                <div class="grid-row">
                                    <div class="cell week-col">
                                        <span class="week-number">{week}</span>
                                    </div>
                                    
                                    <!-- Weekly Rosters -->
                                    <div class="cell table-col">
                                        {#if rosterData}
                                            <div class="cell-content">
                                                <span class="status-badge small {getStatusClass(rosterData.processed_count, rosterData.unprocessed_count)}">
                                                    {getStatusLabel(rosterData.processed_count, rosterData.unprocessed_count)}
                                                </span>
                                                <span class="counts">
                                                    <span class="count-processed" title="Processed">{rosterData.processed_count}</span>
                                                    /
                                                    <span class="count-unprocessed" title="Unprocessed">{rosterData.unprocessed_count}</span>
                                                </span>
                                            </div>
                                        {:else}
                                            <span class="no-data">—</span>
                                        {/if}
                                    </div>
                                    
                                    <!-- Player Stats -->
                                    <div class="cell table-col">
                                        {#if statsData}
                                            <div class="cell-content">
                                                <span class="status-badge small {getStatusClass(statsData.processed_count, statsData.unprocessed_count)}">
                                                    {getStatusLabel(statsData.processed_count, statsData.unprocessed_count)}
                                                </span>
                                                <span class="counts">
                                                    <span class="count-processed" title="Processed">{statsData.processed_count}</span>
                                                    /
                                                    <span class="count-unprocessed" title="Unprocessed">{statsData.unprocessed_count}</span>
                                                </span>
                                            </div>
                                        {:else}
                                            <span class="no-data">—</span>
                                        {/if}
                                    </div>
                                    
                                    <!-- Matchups -->
                                    <div class="cell table-col">
                                        {#if matchupData}
                                            <div class="cell-content">
                                                <span class="status-badge small {getStatusClass(matchupData.processed_count, matchupData.unprocessed_count)}">
                                                    {getStatusLabel(matchupData.processed_count, matchupData.unprocessed_count)}
                                                </span>
                                                <span class="counts">
                                                    <span class="count-processed" title="Processed">{matchupData.processed_count}</span>
                                                    /
                                                    <span class="count-unprocessed" title="Unprocessed">{matchupData.unprocessed_count}</span>
                                                </span>
                                            </div>
                                        {:else}
                                            <span class="no-data">—</span>
                                        {/if}
                                    </div>
                                </div>
                            {/each}
                            
                            {#if selectedSeasonWeeks.length === 0}
                                <div class="empty-weeks">No weekly data found for {selectedSeason}</div>
                            {/if}
                        </div>
                    </div>
                    
                    <!-- Legend -->
                    <div class="legend">
                        <h4>Legend</h4>
                        <div class="legend-items">
                            <div class="legend-item">
                                <span class="status-badge small complete">Complete</span>
                                <span>All records processed</span>
                            </div>
                            <div class="legend-item">
                                <span class="status-badge small partial">Partial</span>
                                <span>Some records processed</span>
                            </div>
                            <div class="legend-item">
                                <span class="status-badge small pending">Pending</span>
                                <span>No records processed yet</span>
                            </div>
                            <div class="legend-item">
                                <span class="counts-legend">
                                    <span class="count-processed">✓</span> / <span class="count-unprocessed">✗</span>
                                </span>
                                <span>Processed / Unprocessed counts</span>
                            </div>
                        </div>
                    </div>
                {:else}
                    <div class="empty-state">
                        <p>No weekly data available</p>
                    </div>
                {/if}
            </div>
        {/if}
    {/if}
</div>

<style>
    .dashboard {
        max-width: 1100px;
        margin: 0 auto;
        padding: 2rem;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 2px solid #e2e8f0;
    }
    
    .header-content h1 {
        margin: 0 0 0.5rem 0;
        font-size: 1.75rem;
        font-weight: 700;
        color: #1e293b;
    }
    
    .subtitle {
        margin: 0;
        color: #64748b;
        font-size: 0.95rem;
    }
    
    .refresh-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.625rem 1rem;
        background: #f1f5f9;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        font-size: 0.875rem;
        font-weight: 500;
        color: #475569;
        cursor: pointer;
        transition: all 0.15s ease;
    }
    
    .refresh-btn:hover:not(:disabled) {
        background: #e2e8f0;
        border-color: #94a3b8;
    }
    
    .refresh-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
    
    .spinner-small {
        width: 14px;
        height: 14px;
        border: 2px solid #cbd5e1;
        border-top-color: #3b82f6;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }
    
    .error-message {
        padding: 1rem;
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 8px;
        color: #991b1b;
        margin-bottom: 1.5rem;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    
    /* Tabs */
    .tabs {
        display: flex;
        gap: 0;
        margin-bottom: 1.5rem;
        border-bottom: 2px solid #e2e8f0;
    }
    
    .tab {
        padding: 0.875rem 1.5rem;
        background: none;
        border: none;
        font-size: 0.95rem;
        font-weight: 500;
        color: #64748b;
        cursor: pointer;
        border-bottom: 2px solid transparent;
        margin-bottom: -2px;
        transition: all 0.15s ease;
    }
    
    .tab:hover {
        color: #334155;
    }
    
    .tab.active {
        color: #3b82f6;
        border-bottom-color: #3b82f6;
    }
    
    .tab-content {
        animation: fadeIn 0.2s ease;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    .tab-content h2 {
        margin: 0 0 0.5rem 0;
        font-size: 1.1rem;
        font-weight: 600;
        color: #334155;
    }
    
    .section-desc {
        margin: 0 0 1.5rem 0;
        color: #64748b;
        font-size: 0.875rem;
    }
    
    /* Staging Table Sections */
    .staging-table-section {
        margin-bottom: 1.5rem;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        overflow: hidden;
    }
    
    .staging-table-section h3 {
        margin: 0;
        padding: 0.875rem 1rem;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
        font-size: 0.9rem;
        font-weight: 600;
        color: #334155;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .table-icon {
        font-size: 1rem;
    }
    
    .arrow {
        color: #94a3b8;
        margin: 0 0.25rem;
    }
    
    .target {
        color: #059669;
        font-weight: 500;
    }
    
    .empty-table {
        padding: 1.5rem;
        text-align: center;
        color: #94a3b8;
        font-size: 0.875rem;
    }
    
    /* Data Tables */
    .data-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.875rem;
    }
    
    .data-table th {
        text-align: left;
        padding: 0.75rem 1rem;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
        font-weight: 600;
        color: #475569;
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.025em;
    }
    
    .data-table td {
        padding: 0.75rem 1rem;
        border-bottom: 1px solid #f1f5f9;
        color: #334155;
    }
    
    .data-table tr:last-child td {
        border-bottom: none;
    }
    
    .data-table tr:hover {
        background: #f8fafc;
    }
    
    .season-cell {
        font-weight: 600;
        color: #1e293b;
    }
    
    .processed {
        color: #059669;
    }
    
    .unprocessed {
        color: #dc2626;
    }
    
    .no-staging {
        color: #cbd5e1;
    }
    
    /* Fetch Button Styles */
    .fetch-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.35rem 0.65rem;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s ease;
    }
    
    .fetch-btn:hover:not(:disabled) {
        background: #2563eb;
    }
    
    .fetch-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
    
    .spinner-tiny {
        width: 10px;
        height: 10px;
        border: 2px solid rgba(255,255,255,0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }
    
    .no-action {
        color: #cbd5e1;
    }
    
    /* Fetch Result Messages */
    .fetch-result {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem 1rem;
        margin: 0;
        border-bottom: 1px solid #e2e8f0;
        font-size: 0.85rem;
        font-weight: 500;
    }
    
    .fetch-result.success {
        background: #d1fae5;
        color: #065f46;
    }
    
    .fetch-result.error {
        background: #fee2e2;
        color: #991b1b;
    }
    
    .dismiss-btn {
        background: none;
        border: none;
        font-size: 1.1rem;
        cursor: pointer;
        opacity: 0.6;
        padding: 0 0.25rem;
        color: inherit;
    }
    
    .dismiss-btn:hover {
        opacity: 1;
    }
    
    /* Status Badges */
    .status-badge {
        display: inline-block;
        padding: 0.25rem 0.625rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.025em;
    }
    
    .status-badge.small {
        padding: 0.2rem 0.5rem;
        font-size: 0.7rem;
    }
    
    .status-badge.complete {
        background: #d1fae5;
        color: #065f46;
    }
    
    .status-badge.partial {
        background: #fef3c7;
        color: #92400e;
    }
    
    .status-badge.pending {
        background: #fee2e2;
        color: #991b1b;
    }
    
    .status-badge.empty {
        background: #f1f5f9;
        color: #64748b;
    }
    
    /* Season Selector */
    .season-selector {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1.5rem;
        padding: 1rem;
        background: #f8fafc;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
    }
    
    .season-selector label {
        font-size: 0.875rem;
        font-weight: 600;
        color: #475569;
    }
    
    .season-selector select {
        padding: 0.5rem 1rem;
        font-size: 0.95rem;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        background: white;
        cursor: pointer;
    }
    
    .season-selector select:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }
    
    /* Weekly Grid */
    .weekly-grid-container {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        overflow: hidden;
        margin-bottom: 1.5rem;
    }
    
    .weekly-grid {
        display: flex;
        flex-direction: column;
    }
    
    .grid-header {
        display: flex;
        background: #f1f5f9;
        border-bottom: 1px solid #e2e8f0;
    }
    
    .header-cell {
        padding: 0.875rem 1rem;
        font-weight: 600;
        font-size: 0.8rem;
        color: #475569;
    }
    
    .header-cell .table-name {
        display: block;
        font-size: 0.85rem;
        color: #334155;
    }
    
    .header-cell .target-hint {
        display: block;
        font-size: 0.7rem;
        font-weight: 400;
        color: #059669;
        margin-top: 0.25rem;
    }
    
    .grid-row {
        display: flex;
        border-bottom: 1px solid #f1f5f9;
    }
    
    .grid-row:last-child {
        border-bottom: none;
    }
    
    .grid-row:hover {
        background: #f8fafc;
    }
    
    .cell {
        padding: 0.75rem 1rem;
        display: flex;
        align-items: center;
    }
    
    .week-col {
        width: 80px;
        justify-content: center;
    }
    
    .table-col {
        flex: 1;
    }
    
    .week-number {
        font-weight: 600;
        color: #334155;
        background: #f1f5f9;
        padding: 0.25rem 0.625rem;
        border-radius: 4px;
        font-size: 0.875rem;
    }
    
    .cell-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    
    .counts {
        font-size: 0.8rem;
        color: #64748b;
    }
    
    .count-processed {
        color: #059669;
        font-weight: 500;
    }
    
    .count-unprocessed {
        color: #dc2626;
        font-weight: 500;
    }
    
    .no-data {
        color: #cbd5e1;
        font-size: 1rem;
    }
    
    .empty-weeks {
        padding: 2rem;
        text-align: center;
        color: #94a3b8;
    }
    
    /* Legend */
    .legend {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 1rem 1.25rem;
    }
    
    .legend h4 {
        margin: 0 0 0.75rem 0;
        font-size: 0.8rem;
        font-weight: 600;
        color: #475569;
        text-transform: uppercase;
        letter-spacing: 0.025em;
    }
    
    .legend-items {
        display: flex;
        flex-wrap: wrap;
        gap: 1.5rem;
    }
    
    .legend-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.8rem;
        color: #64748b;
    }
    
    .counts-legend {
        font-size: 0.8rem;
    }
    
    .empty-state {
        text-align: center;
        padding: 3rem;
        color: #64748b;
    }
    
    /* Production Table Styles */
    .production-grid {
        overflow-x: auto;
        margin-bottom: 1.5rem;
    }
    
    .production-table {
        min-width: 900px;
    }
    
    .production-table th,
    .production-table td {
        text-align: center;
        white-space: nowrap;
    }
    
    .production-table .sticky-col {
        position: sticky;
        left: 0;
        background: white;
        z-index: 1;
        text-align: left;
    }
    
    .production-table thead .sticky-col {
        background: #f8fafc;
    }
    
    .production-table tr:hover .sticky-col {
        background: #f8fafc;
    }
    
    .has-data {
        display: inline-block;
        padding: 0.2rem 0.5rem;
        background: #d1fae5;
        color: #065f46;
        border-radius: 4px;
        font-weight: 600;
        font-size: 0.8rem;
    }
    
    .no-data-icon {
        color: #dc2626;
        font-weight: 700;
        font-size: 0.9rem;
    }
    
    .active-badge {
        display: inline-block;
        margin-left: 0.5rem;
        padding: 0.15rem 0.4rem;
        background: #3b82f6;
        color: white;
        border-radius: 3px;
        font-size: 0.65rem;
        font-weight: 600;
        text-transform: uppercase;
        vertical-align: middle;
    }
    
    .production-legend {
        margin-top: 1rem;
    }
    
    /* Responsive */
    @media (max-width: 768px) {
        .dashboard {
            padding: 1rem;
        }
        
        .dashboard-header {
            flex-direction: column;
            gap: 1rem;
        }
        
        .tabs {
            overflow-x: auto;
        }
        
        .tab {
            white-space: nowrap;
        }
        
        .legend-items {
            flex-direction: column;
            gap: 0.75rem;
        }
    }
</style>