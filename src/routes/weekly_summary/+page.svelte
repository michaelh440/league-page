<!-- src/routes/weekly_summary/+page.svelte -->
<script>
    import { onMount } from 'svelte';
    
    let selectedSeason = '2024';
    let selectedWeek = '1';
    let matchups = [];
    let loading = false;
    let importing = false;
    let generating = false;
    let generatedSummary = '';
    let error = '';
    let importStatus = null;
    
    const seasons = Array.from({ length: 10 }, (_, i) => 2026 - i);
    const weeks = Array.from({ length: 18 }, (_, i) => i + 1);
    
    onMount(() => {
        checkImportStatus();
    });
    
    async function checkImportStatus() {
        try {
            const response = await fetch(
                `/api/import_sleeper_week?season=${selectedSeason}&week=${selectedWeek}`
            );
            
            // Check if response is JSON before parsing
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                console.log('Import status endpoint not ready (returned HTML)');
                return;
            }
            
            const data = await response.json();
            
            if (data.success) {
                importStatus = data;
                
                // If data exists in main tables, load it for preview
                if (data.main && data.main.matchups_count > 0) {
                    await loadWeeklyData();
                }
            }
        } catch (err) {
            console.error('Error checking import status:', err);
        }
    }
    
    async function importWeek() {
        importing = true;
        error = '';
        
        try {
            const response = await fetch('/api/import_sleeper_week', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    season: parseInt(selectedSeason),
                    week: parseInt(selectedWeek),
                    processImmediately: true
                })
            });
            
            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Non-JSON response:', text);
                error = 'API endpoint not found. Make sure src/routes/api/import_sleeper_week/+server.js exists.';
                importing = false;
                return;
            }
            
            const data = await response.json();
            
            if (data.success) {
                importStatus = {
                    success: true,
                    main: { 
                        season_id: data.seasonId,
                        matchups_count: 0 
                    }
                };
                
                // Refresh status and load data
                await checkImportStatus();
                await loadWeeklyData();
            } else {
                error = data.error || 'Failed to import week data';
            }
        } catch (err) {
            console.error('Import error:', err);
            error = 'Failed to import: ' + (err.message || 'Unknown error');
        } finally {
            importing = false;
        }
    }
    
    async function loadWeeklyData() {
    loading = true;
    error = '';
    matchups = []; // Clear existing data first
    
    console.log('Loading data for:', selectedSeason, selectedWeek); // Debug log
    
    try {
        const url = `/api/weekly-summary?season=${selectedSeason}&week=${selectedWeek}`;
        console.log('Fetching:', url); // Debug log
        
        const response = await fetch(url);
        const data = await response.json();
        
        console.log('Received data:', data); // Debug log
        
        if (data.success) {
            matchups = data.matchups;
        } else {
            error = data.error || 'Failed to load data';
        }
    } catch (err) {
        error = 'Failed to fetch weekly data';
        console.error(err);
    } finally {
        loading = false;
    }
}
    
    async function generateSummary() {
        if (matchups.length === 0) {
            error = 'No matchup data to summarize. Import the week first.';
            return;
        }
        
        generating = true;
        error = '';
        
        try {
            const summaryPrompt = formatDataForAI(matchups);
            
            const response = await fetch('/api/generate_summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: summaryPrompt,
                    season: selectedSeason,
                    week: selectedWeek
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                generatedSummary = data.summary;
            } else {
                error = data.error || 'Failed to generate summary';
            }
        } catch (err) {
            error = 'Failed to generate summary';
            console.error(err);
        } finally {
            generating = false;
        }
    }
    
    function formatDataForAI(matchups) {
        let prompt = `You are a snarky fantasy football analyst creating a weekly recap for Week ${selectedWeek} of the ${selectedSeason} season.\n\n`;
        
        matchups.forEach((m, idx) => {
            const margin = parseFloat(m.margin) || 0;
            prompt += `MATCHUP ${idx + 1}:\n`;
            prompt += `${m.team1_name} (${m.manager1_name}) ${m.team1_score} vs ${m.team2_name} (${m.manager2_name}) ${m.team2_score}\n`;
            prompt += `Winner: ${m.winner} by ${margin.toFixed(2)} points\n\n`;
        });
        
        return prompt;
    }
    
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text);
        alert('Summary copied!');
    }
    
    function handleSeasonChange() {
        checkImportStatus();
    }
    
    function handleWeekChange() {
        checkImportStatus();
    }
</script>

<div class="content">
    <h2>Weekly Summary Generator</h2>
    
    <div class="controls">
        <div class="selector">
            <label for="season">Season:</label>
            <select id="season" bind:value={selectedSeason} on:change={handleSeasonChange}>
                {#each seasons as season}
                    <option value={season}>{season}</option>
                {/each}
            </select>
        </div>
        
        <div class="selector">
            <label for="week">Week:</label>
            <select id="week" bind:value={selectedWeek} on:change={handleWeekChange}>
                {#each weeks as week}
                    <option value={week}>Week {week}</option>
                {/each}
            </select>
        </div>
        
        {#if !importStatus || !importStatus.main || importStatus.main.matchups_count === 0}
            <button 
                on:click={importWeek} 
                disabled={importing}
                class="btn-primary"
            >
                {importing ? 'Importing...' : 'Import Week from Sleeper'}
            </button>
        {:else}
            <button 
                on:click={loadWeeklyData} 
                disabled={loading}
                class="btn-secondary"
            >
                {loading ? 'Loading...' : 'Reload Data'}
            </button>
            
            <button 
                on:click={generateSummary} 
                disabled={loading || generating || matchups.length === 0}
                class="btn-primary"
            >
                {generating ? 'Generating...' : 'Generate AI Summary'}
            </button>
        {/if}
    </div>
    
    {#if error}
        <div class="error">{error}</div>
    {/if}
    
    {#if importStatus}
        <div class="status-card">
            <strong>Status:</strong>
            {#if importStatus.main && importStatus.main.matchups_count > 0}
                <span class="success">✓ Week {selectedWeek} data loaded ({importStatus.main.matchups_count} matchups)</span>
            {:else}
                <span class="warning">No data for this week. Click Import to fetch from Sleeper.</span>
            {/if}
        </div>
    {/if}
    
    {#if matchups.length > 0}
        <div class="matchups">
            <h3>Week {selectedWeek} Matchups</h3>
            
            {#each matchups as matchup, idx}
                <div class="matchup-card">
                    <div class="matchup-title">Matchup {idx + 1}</div>
                    
                    <div class="matchup-score">
                        <div class="team">
                            <div class="team-name">{matchup.team1_name}</div>
                            <div class="score {parseFloat(matchup.team1_score) > parseFloat(matchup.team2_score) ? 'winner' : ''}">
                                {parseFloat(matchup.team1_score || 0).toFixed(2)}
                            </div>
                        </div>
                        
                        <div class="vs">VS</div>
                        
                        <div class="team">
                            <div class="team-name">{matchup.team2_name}</div>
                            <div class="score {parseFloat(matchup.team2_score) > parseFloat(matchup.team1_score) ? 'winner' : ''}">
                                {parseFloat(matchup.team2_score || 0).toFixed(2)}
                            </div>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
    
    {#if generatedSummary}
        <div class="summary-output">
            <div class="summary-header">
                <h3>Generated Summary</h3>
                <button on:click={() => copyToClipboard(generatedSummary)} class="btn-secondary">
                    Copy to Clipboard
                </button>
            </div>
            
            <div class="summary-text">
                {generatedSummary}
            </div>
        </div>
    {/if}
</div>

<style>
    .content {
        padding: 2em;
        max-width: 1200px;
        margin: 0 auto;
    }
    
    h2 {
        font-size: 1.75em;
        margin-bottom: 1em;
    }
    
    h3 {
        font-size: 1.25em;
        margin: 1em 0 0.5em 0;
    }
    
    .controls {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
        align-items: flex-end;
    }
    
    .selector {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }
    
    .selector label {
        font-size: 0.9em;
        font-weight: 600;
    }
    
    select {
        padding: 0.5rem;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 1em;
    }
    
    button {
        padding: 0.6rem 1.2rem;
        border: none;
        border-radius: 4px;
        font-weight: 600;
        cursor: pointer;
        font-size: 0.95em;
    }
    
    button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .btn-primary {
        background: #2563eb;
        color: white;
    }
    
    .btn-primary:hover:not(:disabled) {
        background: #1d4ed8;
    }
    
    .btn-secondary {
        background: #6b7280;
        color: white;
    }
    
    .btn-secondary:hover:not(:disabled) {
        background: #4b5563;
    }
    
    .error {
        padding: 1rem;
        background: #fee2e2;
        border-left: 4px solid #dc2626;
        margin-bottom: 1rem;
        color: #991b1b;
    }
    
    .status-card {
        padding: 1rem;
        background: #f3f4f6;
        border-radius: 4px;
        margin-bottom: 1.5rem;
    }
    
    .success {
        color: #059669;
        font-weight: 600;
    }
    
    .warning {
        color: #d97706;
    }
    
    .matchups {
        margin-top: 2rem;
    }
    
    .matchup-card {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 1.5rem;
        margin-bottom: 1rem;
    }
    
    .matchup-title {
        font-weight: 700;
        margin-bottom: 1rem;
        font-size: 1.1em;
    }
    
    .matchup-score {
        display: flex;
        justify-content: space-around;
        align-items: center;
        gap: 2rem;
    }
    
    .team {
        text-align: center;
        flex: 1;
    }
    
    .team-name {
        font-weight: 600;
        margin-bottom: 0.5rem;
    }
    
    .score {
        font-size: 1.75rem;
        font-weight: 700;
    }
    
    .score.winner {
        color: #059669;
    }
    
    .vs {
        font-weight: 700;
        color: #9ca3af;
    }
    
    .summary-output {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 1.5rem;
        margin-top: 2rem;
    }
    
    .summary-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }
    
    .summary-text {
        background: #f9fafb;
        padding: 1.5rem;
        border-radius: 4px;
        white-space: pre-wrap;
        line-height: 1.6;
    }
</style>