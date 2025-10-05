<!-- src/routes/weekly-summary/+page.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    
    let selectedSeason = '2024';
    let selectedWeek = '1';
    let matchups: any[] = [];
    let loading = false;
    let importing = false;
    let generating = false;
    let generatedSummary = '';
    let error = '';
    let importStatus: any = null;
    
    const seasons = Array.from({ length: 10 }, (_, i) => 2024 - i);
    const weeks = Array.from({ length: 18 }, (_, i) => i + 1);
    
    onMount(() => {
        checkImportStatus();
    });
    
    async function checkImportStatus() {
        try {
            const response = await fetch(
                `/api/import-week?season=${selectedSeason}&week=${selectedWeek}`
            );
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
            const response = await fetch('/api/import-week', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    season: parseInt(selectedSeason),
                    week: parseInt(selectedWeek),
                    processImmediately: true
                })
            });
            
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
        } catch (err: any) {
            error = 'Failed to import week: ' + err.message;
            console.error(err);
        } finally {
            importing = false;
        }
    }
    
    async function loadWeeklyData() {
        loading = true;
        error = '';
        
        try {
            const response = await fetch(
                `/api/weekly-summary?season=${selectedSeason}&week=${selectedWeek}`
            );
            const data = await response.json();
            
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
            // Format data for Claude
            const summaryPrompt = formatDataForAI(matchups);
            
            const response = await fetch('/api/generate-summary', {
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
                
                // Save summary
                await fetch('/api/weekly-summary', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        season: selectedSeason,
                        week: selectedWeek,
                        summary: generatedSummary,
                        format: 'text'
                    })
                });
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
    
    function formatDataForAI(matchups: any[]): string {
        let prompt = `You are a snarky fantasy football analyst creating a weekly recap for Week ${selectedWeek} of the ${selectedSeason} season. Write an entertaining summary that includes:\n\n`;
        prompt += `1. Individual matchup recaps with personality\n`;
        prompt += `2. Standings changes and team momentum\n`;
        prompt += `3. Lineup decisions that cost managers wins (if available)\n`;
        prompt += `4. Manager-specific commentary based on their style\n\n`;
        prompt += `Keep it witty, a bit snarky, and entertaining. Here's the data:\n\n`;
        
        matchups.forEach((m, idx) => {
            prompt += `MATCHUP ${idx + 1}:\n`;
            prompt += `${m.team1_name} (${m.manager1_name}) ${m.team1_score} vs ${m.team2_name} (${m.manager2_name}) ${m.team2_score}\n`;
            prompt += `Winner: ${m.winner} by ${m.margin.toFixed(2)} points\n\n`;
            
            if (m.team1_rank) {
                prompt += `STANDINGS:\n`;
                prompt += `${m.team1_name}: Rank #${m.team1_rank} (${m.team1_rank_change > 0 ? '+' : ''}${m.team1_rank_change || 0}), Record: ${m.team1_wins}-${m.team1_losses}\n`;
                prompt += `${m.team2_name}: Rank #${m.team2_rank} (${m.team2_rank_change > 0 ? '+' : ''}${m.team2_rank_change || 0}), Record: ${m.team2_wins}-${m.team2_losses}\n\n`;
            }
            
            if (m.team1_points_left > 5 || m.team2_points_left > 5) {
                prompt += `LINEUP DECISIONS:\n`;
                if (m.team1_points_left > 5) {
                    prompt += `${m.manager1_name} left ${m.team1_points_left.toFixed(2)} points on the bench\n`;
                }
                if (m.team2_points_left > 5) {
                    prompt += `${m.manager2_name} left ${m.team2_points_left.toFixed(2)} points on the bench\n`;
                }
                if (m.lineup_impact && m.lineup_impact !== 'Not yet calculated') {
                    prompt += `Impact: ${m.lineup_impact}\n\n`;
                }
            }
            
            prompt += `---\n\n`;
        });
        
        prompt += `Write a cohesive, entertaining summary that flows naturally and highlights the most interesting storylines from this week.`;
        
        return prompt;
    }
    
    function copyToClipboard(text: string) {
        navigator.clipboard.writeText(text);
        alert('Summary copied to clipboard!');
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
                class="import-btn"
            >
                {#if importing}
                    Importing from Sleeper...
                {:else}
                    Import Week from Sleeper
                {/if}
            </button>
        {:else}
            <button 
                on:click={loadWeeklyData} 
                disabled={loading}
                class="load-btn"
            >
                {#if loading}
                    Loading...
                {:else}
                    Reload Data
                {/if}
            </button>
            
            <button 
                on:click={generateSummary} 
                disabled={loading || generating || matchups.length === 0}
                class="generate-btn"
            >
                {#if generating}
                    Generating AI Summary...
                {:else}
                    Generate AI Summary
                {/if}
            </button>
        {/if}
    </div>
    
    {#if importStatus}
        <div class="status-card">
            <h3>Import Status</h3>
            {#if importStatus.main && importStatus.main.matchups_count > 0}
                <div class="status-good">
                    ✓ Week {selectedWeek} data is loaded
                    <div class="status-details">
                        {importStatus.main.matchups_count} matchups, 
                        {importStatus.main.teams_with_scores} teams with scores
                    </div>
                </div>
            {:else}
                <div class="status-warning">
                    No data loaded for this week. Click "Import Week from Sleeper" to fetch data.
                </div>
            {/if}
        </div>
    {/if}
    
    {#if error}
        <div class="error">{error}</div>
    {/if}
    
    {#if matchups.length > 0}
        <div class="data-preview">
            <h2>Week {selectedWeek} Matchups</h2>
            
            {#each matchups as matchup, idx}
                <div class="matchup-card">
                    <h3>Matchup {idx + 1}</h3>
                    
                    <div class="matchup-score">
                        <div class="team">
                            <div class="team-name">{matchup.team1_name}</div>
                            <div class="manager">{matchup.manager1_name}</div>
                            <div class="score {matchup.team1_score > matchup.team2_score ? 'winner' : ''}">
                                {matchup.team1_score?.toFixed(2) || '0.00'}
                            </div>
                            {#if matchup.team1_rank}
                                <div class="record">
                                    Rank #{matchup.team1_rank}
                                    {#if matchup.team1_rank_change}
                                        <span class={matchup.team1_rank_change > 0 ? 'up' : 'down'}>
                                            ({matchup.team1_rank_change > 0 ? '+' : ''}{matchup.team1_rank_change})
                                        </span>
                                    {/if}
                                </div>
                                <div class="record">{matchup.team1_wins}-{matchup.team1_losses}</div>
                            {/if}
                        </div>
                        
                        <div class="vs">VS</div>
                        
                        <div class="team">
                            <div class="team-name">{matchup.team2_name}</div>
                            <div class="manager">{matchup.manager2_name}</div>
                            <div class="score {matchup.team2_score > matchup.team1_score ? 'winner' : ''}">
                                {matchup.team2_score?.toFixed(2) || '0.00'}
                            </div>
                            {#if matchup.team2_rank}
                                <div class="record">
                                    Rank #{matchup.team2_rank}
                                    {#if matchup.team2_rank_change}
                                        <span class={matchup.team2_rank_change > 0 ? 'up' : 'down'}>
                                            ({matchup.team2_rank_change > 0 ? '+' : ''}{matchup.team2_rank_change})
                                        </span>
                                    {/if}
                                </div>
                                <div class="record">{matchup.team2_wins}-{matchup.team2_losses}</div>
                            {/if}
                        </div>
                    </div>
                    
                    {#if (matchup.team1_points_left && matchup.team1_points_left > 5) || (matchup.team2_points_left && matchup.team2_points_left > 5)}
                        <div class="lineup-issues">
                            <strong>Lineup Decisions:</strong>
                            {#if matchup.team1_points_left > 5}
                                <div class="bench-points">
                                    {matchup.manager1_name} left {matchup.team1_points_left.toFixed(2)} points on bench
                                </div>
                            {/if}
                            {#if matchup.team2_points_left > 5}
                                <div class="bench-points">
                                    {matchup.manager2_name} left {matchup.team2_points_left.toFixed(2)} points on bench
                                </div>
                            {/if}
                            {#if matchup.lineup_impact && matchup.lineup_impact.includes('would have won')}
                                <div class="impact-warning">⚠️ {matchup.lineup_impact}</div>
                            {/if}
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    {/if}
    
    {#if generatedSummary}
        <div class="summary-output">
            <div class="summary-header">
                <h2>Generated Summary</h2>
                <button on:click={() => copyToClipboard(generatedSummary)} class="copy-btn">
                    Copy to Clipboard
                </button>
            </div>
            
            <div class="summary-text">
                {generatedSummary}
            </div>
            
            <div class="next-steps">
                <h3>Create Your Video:</h3>
                <ol>
                    <li><strong>ElevenLabs</strong> - Generate voiceover from summary text</li>
                    <li><strong>D-ID or Synthesia</strong> - Create AI avatar video</li>
                    <li><strong>Add graphics</strong> - Team logos, score overlays</li>
                    <li><strong>Publish</strong> - Share with your league!</li>
                </ol>
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
        margin-bottom: 1.5em;
        color: #333;
    }
    
    h3 {
        font-size: 1.25em;
        margin: 1em 0 0.5em 0;
    }
    
    .controls {
        display: flex;
        gap: 1rem;
        margin-bottom: 2rem;
        justify-content: center;
        flex-wrap: wrap;
    }
    
    .selector {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    
    select {
        padding: 0.5rem;
        border: 1px solid #ccc;
        border-radius: 4px;
    }
    
    button {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 4px;
        font-weight: 600;
        cursor: pointer;
        transition: opacity 0.2s;
    }
    
    button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .import-btn {
        background: #f59e0b;
        color: white;
    }
    
    .load-btn {
        background: #3b82f6;
        color: white;
    }
    
    .generate-btn {
        background: #10b981;
        color: white;
    }
    
    .copy-btn {
        background: #6366f1;
        color: white;
    }
    
    .status-card {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 1rem;
    }
    
    .status-good {
        color: #059669;
        font-weight: 600;
    }
    
    .status-warning {
        color: #f59e0b;
    }
    
    .status-details {
        font-size: 0.875rem;
        color: #666;
        font-weight: normal;
        margin-top: 0.25rem;
    }
    
    .error {
        padding: 1rem;
        background: #fee2e2;
        border: 1px solid #ef4444;
        border-radius: 4px;
        color: #991b1b;
        margin-bottom: 1rem;
    }
    
    .matchup-card {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 1.5rem;
        margin-bottom: 1rem;
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
        font-weight: 700;
        font-size: 1.1rem;
    }
    
    .manager {
        font-size: 0.9rem;
        color: #666;
        margin: 0.25rem 0;
    }
    
    .score {
        font-size: 1.75rem;
        font-weight: 700;
        margin: 0.5rem 0;
    }
    
    .score.winner {
        color: #059669;
    }
    
    .record {
        font-size: 0.875rem;
        color: #666;
    }
    
    .record .up {
        color: #059669;
    }
    
    .record .down {
        color: #dc2626;
    }
    
    .vs {
        font-weight: 700;
        color: #9ca3af;
        font-size: 1.25rem;
    }
    
    .lineup-issues {
        background: #fef3c7;
        border: 1px solid #f59e0b;
        border-radius: 4px;
        padding: 1rem;
        margin-top: 1rem;
    }
    
    .bench-points {
        margin: 0.5rem 0;
        color: #92400e;
    }
    
    .impact-warning {
        margin-top: 0.5rem;
        color: #dc2626;
        font-weight: 600;
    }
    
    .summary-output {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
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
        margin-bottom: 1.5rem;
    }
    
    .next-steps {
        background: #eff6ff;
        border: 1px solid #3b82f6;
        border-radius: 4px;
        padding: 1rem;
    }
</style>