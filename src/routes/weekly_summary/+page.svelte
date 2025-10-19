<!-- src/routes/weekly_summary/+page.svelte -->
<script>
    let selectedSeason = '2025';
    let selectedWeek = '1';
    let matchups = [];
    let loading = false;
    let importing = false;
    let generating = false;
    let generatedSummary = '';
    let error = '';
    let dataLoaded = false;
    let editMode = false;
    let saving = false;
    let summaryExists = false;
    
    const seasons = Array.from({ length: 11 }, (_, i) => 2025 - i);
    const weeks = Array.from({ length: 18 }, (_, i) => i + 1);
    
    async function loadWeeklyData() {
        loading = true;
        error = '';
        matchups = [];
        generatedSummary = '';
        summaryExists = false;
        editMode = false;
        dataLoaded = false;
        
        console.log('Loading data for:', selectedSeason, selectedWeek);
        
        try {
            // Load matchups
            const matchupsUrl = `/api/weekly_summary?season=${selectedSeason}&week=${selectedWeek}`;
            console.log('Fetching matchups:', matchupsUrl);
            
            const matchupsResponse = await fetch(matchupsUrl);
            const matchupsData = await matchupsResponse.json();
            
            console.log('Received matchup data:', matchupsData);
            
            if (matchupsData.success) {
                matchups = matchupsData.matchups || [];
                dataLoaded = true;
                console.log(`Found ${matchups.length} matchups`);
                
                // If matchups exist, also load the summary
                if (matchups.length > 0) {
                    await loadExistingSummary();
                }
            } else {
                error = matchupsData.error || 'Failed to load data';
                dataLoaded = true;
            }
        } catch (err) {
            error = 'Failed to fetch weekly data';
            console.error(err);
            dataLoaded = true;
        } finally {
            loading = false;
        }
    }
    
    async function loadExistingSummary() {
        try {
            const summaryUrl = `/api/weekly_summary_text?season=${selectedSeason}&week=${selectedWeek}`;
            const response = await fetch(summaryUrl);
            const data = await response.json();
            
            if (data.success && data.summary) {
                generatedSummary = data.summary.summary_text;
                summaryExists = true;
                console.log('Loaded existing summary');
            } else {
                summaryExists = false;
            }
        } catch (err) {
            console.error('Error loading existing summary:', err);
        }
    }
    
    async function importWeek() {
        importing = true;
        error = '';
        
        try {
            console.log('Importing week:', selectedSeason, selectedWeek);
            
            const response = await fetch('/api/import_sleeper_week', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    season: parseInt(selectedSeason),
                    week: parseInt(selectedWeek),
                    processImmediately: true
                })
            });
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Non-JSON response:', text);
                error = 'API endpoint not found. Make sure src/routes/api/import_sleeper_week/+server.js exists.';
                return;
            }
            
            const data = await response.json();
            console.log('Import result:', data);
            
            if (data.success) {
                alert('Week imported successfully!');
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
                summaryExists = true;
                editMode = false;
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
    
    async function saveSummary() {
        if (!generatedSummary.trim()) {
            error = 'Summary cannot be empty';
            return;
        }
        
        saving = true;
        error = '';
        
        try {
            const response = await fetch('/api/weekly_summary_text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    season: selectedSeason,
                    week: selectedWeek,
                    summaryText: generatedSummary
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                summaryExists = true;
                editMode = false;
                alert('Summary saved successfully!');
            } else {
                error = data.error || 'Failed to save summary';
            }
        } catch (err) {
            error = 'Failed to save summary';
            console.error(err);
        } finally {
            saving = false;
        }
    }
    
    function toggleEditMode() {
        editMode = !editMode;
    }
    
    function cancelEdit() {
        editMode = false;
        // Reload the original summary
        loadExistingSummary();
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
</script>

<div class="content">
    <h2>Weekly Summary Generator</h2>
    
    <div class="controls">
        <div class="selector">
            <label for="season">Season:</label>
            <select id="season" bind:value={selectedSeason}>
                {#each seasons as season}
                    <option value={season}>{season}</option>
                {/each}
            </select>
        </div>
        
        <div class="selector">
            <label for="week">Week:</label>
            <select id="week" bind:value={selectedWeek}>
                {#each weeks as week}
                    <option value={week}>Week {week}</option>
                {/each}
            </select>
        </div>
        
        <button 
            on:click={loadWeeklyData} 
            disabled={loading}
            class="btn-primary"
            style="margin-top: auto;"
        >
            {loading ? '⏳ Loading...' : '🔍 Load Week Data'}
        </button>
    </div>
    
    {#if error}
        <div class="error">{error}</div>
    {/if}
    
    <!-- Show status after data is loaded -->
    {#if dataLoaded}
        {#if matchups.length === 0}
            <div class="status-card warning-card">
                <div class="status-message">
                    <span class="warning">⚠️ No data found for Week {selectedWeek} of {selectedSeason}</span>
                    <p style="margin: 0.5rem 0 0 0; font-size: 0.9em;">
                        Click the button below to import this week's data from Sleeper.
                    </p>
                </div>
                <button 
                    on:click={importWeek} 
                    disabled={importing}
                    class="btn-primary btn-large"
                >
                    {importing ? '⏳ Importing from Sleeper...' : '📥 Import Week from Sleeper'}
                </button>
            </div>
        {:else}
            <div class="status-card success-card">
                <span class="success">✓ Week {selectedWeek} data loaded ({matchups.length} matchups)</span>
                <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem;">
                    <button 
                        on:click={loadWeeklyData} 
                        disabled={loading}
                        class="btn-secondary"
                    >
                        {loading ? 'Loading...' : '🔄 Reload Data'}
                    </button>
                    
                    <button 
                        on:click={generateSummary} 
                        disabled={loading || generating}
                        class="btn-primary"
                    >
                        {generating ? '⏳ Generating...' : summaryExists ? '🔄 Regenerate Summary' : '🤖 Generate AI Summary'}
                    </button>
                </div>
            </div>
        {/if}
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
                            <div class="manager-name">({matchup.manager1_name})</div>
                            <div class="score {parseFloat(matchup.team1_score) > parseFloat(matchup.team2_score) ? 'winner' : ''}">
                                {parseFloat(matchup.team1_score || 0).toFixed(2)}
                            </div>
                        </div>
                        
                        <div class="vs">VS</div>
                        
                        <div class="team">
                            <div class="team-name">{matchup.team2_name}</div>
                            <div class="manager-name">({matchup.manager2_name})</div>
                            <div class="score {parseFloat(matchup.team2_score) > parseFloat(matchup.team1_score) ? 'winner' : ''}">
                                {parseFloat(matchup.team2_score || 0).toFixed(2)}
                            </div>
                        </div>
                    </div>
                    
                    {#if matchup.margin}
                        <div class="margin">
                            Margin: {parseFloat(matchup.margin || 0).toFixed(2)} points
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    {/if}
    
    {#if generatedSummary}
        <div class="summary-output">
            <div class="summary-header">
                <h3>Weekly Summary</h3>
                <div style="display: flex; gap: 0.5rem;">
                    {#if !editMode}
                        <button on:click={toggleEditMode} class="btn-secondary">
                            ✏️ Edit
                        </button>
                        <button on:click={() => copyToClipboard(generatedSummary)} class="btn-secondary">
                            📋 Copy
                        </button>
                    {:else}
                        <button on:click={saveSummary} disabled={saving} class="btn-primary">
                            {saving ? '⏳ Saving...' : '💾 Save'}
                        </button>
                        <button on:click={cancelEdit} disabled={saving} class="btn-secondary">
                            ❌ Cancel
                        </button>
                    {/if}
                </div>
            </div>
            
            {#if editMode}
                <textarea
                    bind:value={generatedSummary}
                    class="summary-textarea"
                    rows="15"
                    placeholder="Enter your summary..."
                ></textarea>
            {:else}
                <div class="summary-text">
                    {generatedSummary}
                </div>
            {/if}
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
        transition: background 0.2s;
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
    
    .btn-large {
        padding: 0.75rem 1.5rem;
        font-size: 1.05em;
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
        padding: 1.5rem;
        background: #f3f4f6;
        border-radius: 6px;
        margin-bottom: 1.5rem;
    }
    
    .warning-card {
        background: #fef3c7;
        border: 2px solid #f59e0b;
        text-align: center;
    }
    
    .success-card {
        background: #d1fae5;
        border: 2px solid #10b981;
    }
    
    .status-message {
        margin-bottom: 1rem;
    }
    
    .success {
        color: #059669;
        font-weight: 600;
        font-size: 1.05em;
    }
    
    .warning {
        color: #d97706;
        font-weight: 600;
        font-size: 1.05em;
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
        margin-bottom: 0.25rem;
    }
    
    .manager-name {
        font-size: 0.85em;
        color: #6b7280;
        margin-bottom: 0.5rem;
    }
    
    .score {
        font-size: 1.75rem;
        font-weight: 700;
        color: #6b7280;
    }
    
    .score.winner {
        color: #059669;
    }
    
    .vs {
        font-weight: 700;
        color: #9ca3af;
        font-size: 1.25em;
    }
    
    .margin {
        text-align: center;
        margin-top: 0.75rem;
        font-size: 0.9em;
        color: #6b7280;
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
    
    .summary-textarea {
        width: 100%;
        padding: 1rem;
        border: 2px solid #e5e7eb;
        border-radius: 4px;
        font-family: inherit;
        font-size: 1em;
        line-height: 1.6;
        resize: vertical;
        min-height: 300px;
    }
    
    .summary-textarea:focus {
        outline: none;
        border-color: #2563eb;
    }
</style>