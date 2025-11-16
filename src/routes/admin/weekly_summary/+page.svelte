<!-- src/routes/admin/weekly_summary/+page.svelte -->
<!--Adding comment to force-->
<script>
    import { onMount } from 'svelte';
    
    let selectedSeason = '2025';
    let selectedWeek = '1';
    let seasonType = 'regular'; // NEW: 'regular' or 'playoffs'
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
    let showAdvancedSettings = false;
    let systemPrompt = '';
    let savedPrompts = [];
    let selectedPromptName = 'Default Snarky Analyst';
    let refining = false;
    let showRefinement = false;
    let refinementInstructions = '';
    let videoData = null;
    let generatingVideo = false;
    let checkingVideo = false;
    let testMode = true;
    
    let availableAvatars = [];
    let availableVoices = [];
    let selectedAvatar = null;
    let selectedVoice = null;
    let loadingAvatars = false;
    let loadingVoices = false;
    let showVideoSettings = false;
    
    const seasons = Array.from({ length: 11 }, (_, i) => 2025 - i);
    const weeks = Array.from({ length: 18 }, (_, i) => i + 1);
    
    onMount(() => {
        loadPrompts();
        loadAvatarsAndVoices();
    });
    
    async function loadPrompts() {
        try {
            const response = await fetch('/api/ai_prompts');
            const data = await response.json();
            
            if (data.success) {
                savedPrompts = data.prompts;
                const defaultPrompt = savedPrompts.find(p => p.is_default);
                if (defaultPrompt) {
                    systemPrompt = defaultPrompt.system_prompt;
                    selectedPromptName = defaultPrompt.prompt_name;
                }
            }
        } catch (err) {
            console.error('Error loading prompts:', err);
        }
    }
    
    async function loadAvatarsAndVoices() {
        loadingAvatars = true;
        loadingVoices = true;

        try {
            const avatarsResponse = await fetch('/api/heygen_avatars');
            const avatarsData = await avatarsResponse.json();
            if (avatarsData.success && avatarsData.avatars) {
                availableAvatars = avatarsData.avatars;
                selectedAvatar = availableAvatars.find(a => a.avatar_id?.includes('Annelise')) || availableAvatars[0];
            }
        } catch (err) {
            console.error('Error loading avatars:', err);
        } finally {
            loadingAvatars = false;
        }

        try {
            const voicesResponse = await fetch('/api/heygen_voices');
            const voicesData = await voicesResponse.json();
            if (voicesData.success && voicesData.voices) {
                availableVoices = voicesData.voices;
                selectedVoice = availableVoices.find(v => v.voice_id?.includes('jenny')) || availableVoices[0];
            }
        } catch (err) {
            console.error('Error loading voices:', err);
        } finally {
            loadingVoices = false;
        }
    }
    
    function loadSelectedPrompt() {
        const selected = savedPrompts.find(p => p.prompt_name === selectedPromptName);
        if (selected) {
            systemPrompt = selected.system_prompt;
        }
    }
    
    async function savePrompt() {
        const promptName = prompt('Enter a name for this prompt:');
        if (!promptName) return;
        
        try {
            const response = await fetch('/api/ai_prompts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    promptName,
                    systemPrompt,
                    isDefault: false
                })
            });
            
            const data = await response.json();
            if (data.success) {
                alert('Prompt saved successfully!');
                await loadPrompts();
            }
        } catch (err) {
            console.error('Error saving prompt:', err);
            error = 'Failed to save prompt';
        }
    }
    
    async function loadWeeklyData() {
        loading = true;
        error = '';
        matchups = [];
        generatedSummary = '';
        summaryExists = false;
        editMode = false;
        dataLoaded = false;
        showRefinement = false;
        videoData = null;
        
        console.log('Loading data for:', selectedSeason, selectedWeek, seasonType);
        
        try {
            const matchupsUrl = `/api/weekly_summary?season=${selectedSeason}&week=${selectedWeek}&type=${seasonType}`;
            console.log('Fetching matchups:', matchupsUrl);
            
            const matchupsResponse = await fetch(matchupsUrl);
            const matchupsData = await matchupsResponse.json();
            
            console.log('Received matchup data:', matchupsData);
            
            if (matchupsData.success) {
                matchups = matchupsData.matchups || [];
                dataLoaded = true;
                console.log(`Found ${matchups.length} matchups`);
                
                if (matchups.length > 0) {
                    await loadExistingSummary();
                    await loadExistingVideo();
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
    
    async function loadExistingVideo() {
        checkingVideo = true;
        try {
            const videoUrl = `/api/weekly_summary_video?season=${selectedSeason}&week=${selectedWeek}`;
            const response = await fetch(videoUrl);
            const data = await response.json();
            
            if (data.success && data.video) {
                videoData = data.video;
                console.log('Loaded existing video:', videoData);
            } else {
                videoData = null;
            }
        } catch (err) {
            console.error('Error loading existing video:', err);
            videoData = null;
        } finally {
            checkingVideo = false;
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
        showRefinement = false;
        
        try {
            const summaryPrompt = formatDataForAI(matchups);
            
            const response = await fetch('/api/generate_summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: summaryPrompt,
                    season: selectedSeason,
                    week: selectedWeek,
                    systemPrompt: systemPrompt || undefined,
                    seasonType: seasonType
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
    
    async function refineSummary() {
        if (!generatedSummary || !refinementInstructions.trim()) {
            error = 'Please enter refinement instructions';
            return;
        }
        
        refining = true;
        error = '';
        
        try {
            const response = await fetch('/api/generate_summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    refinementMode: true,
                    existingSummary: generatedSummary,
                    refinementInstructions: refinementInstructions,
                    systemPrompt: systemPrompt || undefined,
                    season: selectedSeason,
                    week: selectedWeek
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                generatedSummary = data.summary;
                refinementInstructions = '';
                showRefinement = false;
            } else {
                error = data.error || 'Failed to refine summary';
            }
        } catch (err) {
            error = 'Failed to refine summary';
            console.error(err);
        } finally {
            refining = false;
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
    
    async function generateVideo() {
        if (!generatedSummary || !generatedSummary.trim()) {
            error = 'No summary available to generate video from';
            return;
        }

        if (!selectedAvatar) {
            alert('Please select an avatar');
            return;
        }

        if (!selectedVoice) {
            alert('Please select a voice');
            return;
        }
        
        generatingVideo = true;
        error = '';
        
        try {
            const response = await fetch('/api/generate_weekly_summary_video', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    season: selectedSeason,
                    week: selectedWeek,
                    summary: generatedSummary,
                    testMode: testMode,
                    avatarId: selectedAvatar.avatar_id,
                    voiceId: selectedVoice.voice_id
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                const message = testMode 
                    ? 'Test video generation started! Check back in a few seconds.'
                    : 'HeyGen video generation started! This usually takes 2-3 minutes.';
                alert(message);
                
                pollVideoStatus(data.videoId);
            } else {
                error = data.error || 'Failed to generate video';
            }
        } catch (err) {
            error = 'Failed to generate video';
            console.error(err);
        } finally {
            generatingVideo = false;
        }
    }
    
    async function pollVideoStatus(videoId, attempts = 0) {
        const maxAttempts = testMode ? 20 : 60;
        const pollInterval = testMode ? 500 : 5000;
        
        if (attempts > maxAttempts) {
            console.log('Polling timeout');
            await loadExistingVideo();
            return;
        }
        
        try {
            const response = await fetch(`/api/generate_weekly_summary_video?videoId=${videoId}`);
            const data = await response.json();
            
            if (data.success && data.video) {
                if (data.video.generation_status === 'completed') {
                    await loadExistingVideo();
                } else if (data.video.generation_status === 'processing' || data.video.generation_status === 'pending') {
                    setTimeout(() => pollVideoStatus(videoId, attempts + 1), pollInterval);
                } else {
                    await loadExistingVideo();
                }
            }
        } catch (err) {
            console.error('Error polling video status:', err);
        }
    }
    
    function toggleEditMode() {
        editMode = !editMode;
    }
    
    function cancelEdit() {
        editMode = false;
        loadExistingSummary();
    }
    
    function formatDataForAI(matchups) {
        const typeLabel = seasonType === 'playoffs' ? 'PLAYOFF' : 'REGULAR SEASON';
        let prompt = `You are a snarky fantasy football analyst creating a ${typeLabel} recap for Week ${selectedWeek} of the ${selectedSeason} season.\n\n`;
        
        matchups.forEach((m, idx) => {
            const margin = parseFloat(m.margin) || 0;
            
            prompt += `MATCHUP ${idx + 1}`;
            if (m.round_name) {
                prompt += ` - ${m.round_name}`;
            }
            if (m.bracket) {
                prompt += ` (${m.bracket} Bracket)`;
            }
            prompt += `:\n`;
            
            prompt += `${m.team1_name} (${m.manager1_name}) ${m.team1_score} vs ${m.team2_name} (${m.manager2_name}) ${m.team2_score}\n`;
            prompt += `Winner: ${m.winner} by ${margin.toFixed(2)} points\n`;
            
            if (m.team1_roster && m.team1_roster.length > 0) {
                prompt += `\n${m.team1_name} TOP PERFORMERS:\n`;
                const topScorers = m.team1_roster
                    .filter(p => p.is_starter)
                    .sort((a, b) => (b.points || 0) - (a.points || 0))
                    .slice(0, 3);
                topScorers.forEach(p => {
                    prompt += `  - ${p.player_name} (${p.position}): ${(p.points || 0).toFixed(1)} pts\n`;
                });
                
                const benchBlunders = m.team1_roster
                    .filter(p => !p.is_starter && p.points > 10)
                    .sort((a, b) => (b.points || 0) - (a.points || 0));
                    
                if (benchBlunders.length > 0) {
                    prompt += `\n${m.team1_name} BENCH PLAYERS (left on bench):\n`;
                    benchBlunders.slice(0, 2).forEach(p => {
                        prompt += `  - ${p.player_name} (${p.position}): ${(p.points || 0).toFixed(1)} pts (BENCHED!)\n`;
                    });
                }
            }
            
            if (m.team2_roster && m.team2_roster.length > 0) {
                prompt += `\n${m.team2_name} TOP PERFORMERS:\n`;
                const topScorers = m.team2_roster
                    .filter(p => p.is_starter)
                    .sort((a, b) => (b.points || 0) - (a.points || 0))
                    .slice(0, 3);
                topScorers.forEach(p => {
                    prompt += `  - ${p.player_name} (${p.position}): ${(p.points || 0).toFixed(1)} pts\n`;
                });
                
                const benchBlunders = m.team2_roster
                    .filter(p => !p.is_starter && p.points > 10)
                    .sort((a, b) => (b.points || 0) - (a.points || 0));
                    
                if (benchBlunders.length > 0) {
                    prompt += `\n${m.team2_name} BENCH PLAYERS (left on bench):\n`;
                    benchBlunders.slice(0, 2).forEach(p => {
                        prompt += `  - ${p.player_name} (${p.position}): ${(p.points || 0).toFixed(1)} pts (BENCHED!)\n`;
                    });
                }
            }
            
            prompt += `\n`;
        });
        
        if (seasonType === 'playoffs') {
            prompt += '\nRemember this is a playoff game - emphasize the high stakes, pressure, and what this means for championship hopes!';
        }
        
        return prompt;
    }
    
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text);
        alert('Summary copied!');
    }
    
    function handleSeasonTypeChange() {
        matchups = [];
        generatedSummary = '';
        summaryExists = false;
        dataLoaded = false;
        videoData = null;
    }
</script>

<div class="content">
    <h2>📊 Weekly Summary Generator (Admin)</h2>
    
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
        
        <div class="selector">
            <label for="seasonType">Type:</label>
            <select id="seasonType" bind:value={seasonType} on:change={handleSeasonTypeChange}>
                <option value="regular">Regular Season</option>
                <option value="playoffs">Playoffs</option>
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
    
    <!-- Advanced Settings -->
    <div class="advanced-settings">
        <button 
            on:click={() => showAdvancedSettings = !showAdvancedSettings}
            class="btn-secondary"
            style="width: 100%; text-align: left; margin-bottom: 1rem;"
        >
            {showAdvancedSettings ? '▼' : '▶'} Advanced AI Settings
        </button>
        
        {#if showAdvancedSettings}
            <div class="settings-panel">
                <div style="margin-bottom: 1.5rem; padding: 1rem; background: #fef3c7; border: 2px solid #f59e0b; border-radius: 6px;">
                    <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                        <input type="checkbox" bind:checked={testMode} style="width: 20px; height: 20px; cursor: pointer;">
                        <span style="font-weight: 700; font-size: 1.05em;">🧪 Test Mode (Use Mock Video)</span>
                    </label>
                    <p style="margin: 0.5rem 0 0 1.75rem; font-size: 0.9em; color: #92400e;">
                        When enabled, video generation will use a test video instead of calling HeyGen API (saves money during testing)
                    </p>
                </div>
                
                <div style="margin-bottom: 1rem;">
                    <label for="promptSelect" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">
                        Load Saved Prompt:
                    </label>
                    <div style="display: flex; gap: 0.5rem;">
                        <select 
                            id="promptSelect"
                            bind:value={selectedPromptName}
                            on:change={loadSelectedPrompt}
                            style="flex: 1; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;"
                        >
                            {#each savedPrompts as prompt}
                                <option value={prompt.prompt_name}>
                                    {prompt.prompt_name} {prompt.is_default ? '(Default)' : ''}
                                </option>
                            {/each}
                        </select>
                    </div>
                </div>
                
                <div>
                    <label for="systemPrompt" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">
                        System Prompt:
                    </label>
                    <textarea
                        id="systemPrompt"
                        bind:value={systemPrompt}
                        rows="6"
                        placeholder="Enter the AI system prompt here..."
                        style="width: 100%; padding: 0.75rem; border: 1px solid #ccc; border-radius: 4px; font-family: monospace; font-size: 0.9em;"
                    ></textarea>
                    <button on:click={savePrompt} class="btn-secondary" style="margin-top: 0.5rem;">
                        💾 Save as New Prompt
                    </button>
                </div>
            </div>
        {/if}
    </div>
    
    {#if dataLoaded}
        {#if matchups.length === 0}
            <div class="status-card warning-card">
                <div class="status-message">
                    <span class="warning">⚠️ No {seasonType === 'playoffs' ? 'playoff' : 'regular season'} data found for Week {selectedWeek} of {selectedSeason}</span>
                    {#if seasonType === 'regular'}
                        <p style="margin: 0.5rem 0 0 0; font-size: 0.9em;">
                            Click the button below to import this week's data from Sleeper.
                        </p>
                    {:else}
                        <p style="margin: 0.5rem 0 0 0; font-size: 0.9em;">
                            Playoff data must be manually entered in the database.
                        </p>
                    {/if}
                </div>
                {#if seasonType === 'regular'}
                    <button 
                        on:click={importWeek} 
                        disabled={importing}
                        class="btn-primary btn-large"
                    >
                        {importing ? '⏳ Importing from Sleeper...' : '📥 Import Week from Sleeper'}
                    </button>
                {/if}
            </div>
        {:else}
            <div class="status-card success-card">
                <span class="success">✓ {seasonType === 'playoffs' ? 'Playoff' : 'Regular Season'} Week {selectedWeek} data loaded ({matchups.length} matchups)</span>
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
    
    {#if generatedSummary}
        <div class="summary-output">
            <div class="summary-header">
                <h3>Weekly Summary</h3>
                <div style="display: flex; gap: 0.5rem;">
                    {#if !editMode}
                        <button on:click={() => showRefinement = !showRefinement} class="btn-secondary">
                            ✨ Refine
                        </button>
                        <button on:click={toggleEditMode} class="btn-secondary">
                            ✏️ Edit
                        </button>
                        <button on:click={() => copyToClipboard(generatedSummary)} class="btn-secondary">
                            📋 Copy
                        </button>
                        <button on:click={saveSummary} disabled={saving} class="btn-primary">
                            {saving ? '⏳ Saving...' : '💾 Save'}
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
            
            {#if showRefinement && !editMode}
                <div class="refinement-panel">
                    <label for="refinementInstructions" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">
                        How would you like to refine this summary?
                    </label>
                    <textarea
                        id="refinementInstructions"
                        bind:value={refinementInstructions}
                        rows="3"
                        placeholder="E.g., 'Make it funnier', 'Add more stats', 'Focus on the upsets', 'Make it more professional'..."
                        style="width: 100%; padding: 0.75rem; border: 1px solid #ccc; border-radius: 4px; margin-bottom: 0.5rem;"
                    ></textarea>
                    <div style="display: flex; gap: 0.5rem;">
                        <button on:click={refineSummary} disabled={refining || !refinementInstructions.trim()} class="btn-primary">
                            {refining ? '⏳ Refining...' : '✨ Apply Refinement'}
                        </button>
                        <button on:click={() => { showRefinement = false; refinementInstructions = ''; }} class="btn-secondary">
                            Cancel
                        </button>
                    </div>
                </div>
            {/if}
            
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
        
        <!-- Video Section -->
        <div class="video-section">
            <div class="section-header">
                <h3>🎥 AI Sportscaster Video</h3>
            </div>
            
            <button 
                on:click={() => showVideoSettings = !showVideoSettings}
                class="btn-secondary"
                style="width: 100%; text-align: left; margin-bottom: 1rem;"
            >
                {showVideoSettings ? '▼' : '▶'} Video Settings (Avatar & Voice)
            </button>
            
            {#if showVideoSettings}
                <div class="settings-panel" style="margin-bottom: 1.5rem;">
                    <div style="margin-bottom: 1.5rem;">
                        <h4 style="margin: 0 0 0.75rem 0;">Select Avatar</h4>
                        {#if loadingAvatars}
                            <p style="margin: 0; color: #6b7280;">⏳ Loading avatars...</p>
                        {:else if availableAvatars.length > 0}
                            <div class="avatar-grid">
                                {#each availableAvatars as avatar}
                                    <div
                                        class="avatar-card {selectedAvatar?.avatar_id === avatar.avatar_id ? 'selected' : ''}"
                                        on:click={() => (selectedAvatar = avatar)}
                                        role="button"
                                        tabindex="0"
                                        on:keypress={(e) => e.key === 'Enter' && (selectedAvatar = avatar)}
                                    >
                                        {#if avatar.preview_image_url}
                                            <img src={avatar.preview_image_url} alt={avatar.avatar_name} />
                                        {/if}
                                        <p>{avatar.avatar_name || avatar.avatar_id}</p>
                                    </div>
                                {/each}
                            </div>
                        {:else}
                            <p style="margin: 0; color: #6b7280;">No avatars available. Using default avatar.</p>
                        {/if}
                    </div>
                    
                    <div>
                        <h4 style="margin: 0 0 0.75rem 0;">Select Voice</h4>
                        {#if loadingVoices}
                            <p style="margin: 0; color: #6b7280;">⏳ Loading voices...</p>
                        {:else if availableVoices.length > 0}
                            <select bind:value={selectedVoice} style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;">
                                {#each availableVoices as voice}
                                    <option value={voice}>
                                        {voice.name || voice.voice_id} ({voice.language || 'English'}) {voice.gender ? `- ${voice.gender}` : ''}
                                    </option>
                                {/each}
                            </select>
                        {:else}
                            <p style="margin: 0; color: #6b7280;">No voices available. Using default voice.</p>
                        {/if}
                    </div>
                </div>
            {/if}
            
            {#if checkingVideo}
                <div class="status-card" style="text-align: center;">
                    <p>⏳ Checking for existing video...</p>
                </div>
            {:else if videoData}
                {#if videoData.generation_status === 'completed' && videoData.video_url}
                    <div class="video-player">
                        <video controls style="width: 100%; max-width: 800px; border-radius: 8px;">
                            <source src={videoData.video_url} type="video/mp4">
                            Your browser does not support the video tag.
                        </video>
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 0.75rem; margin-top: 1rem; width: 100%;">
                            {#if videoData.completed_at}
                                <p style="margin: 0; color: #6b7280; font-size: 0.9em;">
                                    Generated: {new Date(videoData.completed_at).toLocaleString()}
                                </p>
                            {/if}
                            <button 
                                on:click={generateVideo} 
                                disabled={generatingVideo}
                                class="btn-primary"
                                style="padding: 0.75rem 1.5rem;"
                            >
                                {generatingVideo ? '⏳ Regenerating...' : '🔄 Regenerate Video with Current Summary'}
                            </button>
                        </div>
                    </div>
                {:else if videoData.generation_status === 'processing' || videoData.generation_status === 'pending'}
                    <div class="status-card warning-card">
                        <p style="margin: 0;">⏳ Video is being generated...</p>
                        {#if videoData.error_message}
                            <p style="margin: 0.5rem 0 0 0; font-size: 0.9em; color: #d97706;">
                                Note: {videoData.error_message}
                            </p>
                        {/if}
                    </div>
                {:else if videoData.generation_status === 'failed'}
                    <div class="status-card" style="background: #fee2e2; border: 2px solid #dc2626;">
                        <p style="margin: 0; color: #991b1b;">❌ Video generation failed</p>
                        {#if videoData.error_message}
                            <p style="margin: 0.5rem 0 0 0; font-size: 0.9em; color: #991b1b;">
                                Error: {videoData.error_message}
                            </p>
                        {/if}
                        <button 
                            on:click={generateVideo} 
                            disabled={generatingVideo}
                            class="btn-primary"
                            style="margin-top: 1rem;"
                        >
                            {generatingVideo ? '⏳ Retrying...' : '🔄 Retry Generation'}
                        </button>
                    </div>
                {/if}
            {:else}
                <div class="status-card" style="text-align: center;">
                    <p style="margin: 0 0 1rem 0; color: #6b7280;">
                        📹 No video generated yet. Click "Generate Video" to create an AI sportscaster video from your summary!
                    </p>
                    {#if testMode}
                        <p style="margin: 0 0 1rem 0; font-size: 0.85em; color: #059669;">
                            🧪 Test mode is enabled - will use a mock video for testing
                        </p>
                    {/if}
                    <button 
                        on:click={generateVideo} 
                        disabled={generatingVideo || !generatedSummary}
                        class="btn-primary btn-large"
                    >
                        {generatingVideo ? '⏳ Generating Video...' : '🎬 Generate Video'}
                    </button>
                </div>
            {/if}
        </div>
    {/if}

    {#if matchups.length > 0}
        <div class="matchups">
            <h3>{seasonType === 'playoffs' ? 'Playoff' : 'Regular Season'} Week {selectedWeek} Matchups</h3>
            
            {#each matchups as matchup, idx}
                <div class="matchup-card">
                    <div class="matchup-title">
                        {#if matchup.round_name}
                            {matchup.round_name} - Matchup {idx + 1}
                        {:else}
                            Matchup {idx + 1}
                        {/if}
                        {#if matchup.bracket}
                            <span class="bracket-label">({matchup.bracket})</span>
                        {/if}
                    </div>
                    
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

    h4 {
        font-size: 1.1em;
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
    
    .bracket-label {
        font-size: 0.9em;
        color: #6b7280;
        font-weight: 500;
        margin-left: 0.5rem;
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
    
    .advanced-settings {
        margin-bottom: 1.5rem;
    }
    
    .settings-panel {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 4px;
        padding: 1.5rem;
        margin-bottom: 1rem;
    }
    
    .refinement-panel {
        background: #fef3c7;
        border: 2px solid #f59e0b;
        border-radius: 4px;
        padding: 1rem;
        margin-bottom: 1rem;
    }
    
    .video-section {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 1.5rem;
        margin-top: 2rem;
    }
    
    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }
    
    .video-player {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 1rem;
        background: #f9fafb;
        border-radius: 8px;
    }

    .avatar-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 1rem;
        margin-top: 0.5rem;
    }

    .avatar-card {
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        padding: 1rem;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s;
    }

    .avatar-card:hover {
        border-color: #2563eb;
        box-shadow: 0 2px 8px rgba(37, 99, 235, 0.2);
    }

    .avatar-card.selected {
        border-color: #2563eb;
        background: #eff6ff;
        box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
    }

    .avatar-card img {
        width: 100%;
        height: auto;
        border-radius: 4px;
        margin-bottom: 0.5rem;
    }

    .avatar-card p {
        margin: 0;
        font-size: 0.9rem;
        font-weight: 500;
    }
</style>