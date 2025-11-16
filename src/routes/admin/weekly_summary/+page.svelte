<script>
    import { onMount } from 'svelte';
    
    // State Management
    let selectedSeason = '2025';
    let selectedWeek = '1';
    let seasonType = 'regular';
    let matchups = [];
    let generatedSummary = '';
    let videoData = null;
    let savedPrompts = [];
    let selectedPromptName = 'Default Snarky Analyst';
    let systemPrompt = '';
    let refinementInstructions = '';
    let availableAvatars = [];
    let availableVoices = [];
    let selectedAvatar = null;
    let selectedVoice = null;
    
    // UI State
    let loading = false;
    let importing = false;
    let generating = false;
    let saving = false;
    let refining = false;
    let generatingVideo = false;
    let checkingVideo = false;
    let loadingAvatars = false;
    let loadingVoices = false;
    let error = '';
    let dataLoaded = false;
    let summaryExists = false;
    let editMode = false;
    let showAdvancedSettings = false;
    let showRefinement = false;
    let showVideoSettings = false;
    let testMode = true;
    
    // Constants
    const seasons = Array.from({ length: 11 }, (_, i) => 2025 - i);
    const weeks = Array.from({ length: 18 }, (_, i) => i + 1);
    
    onMount(() => {
        loadPrompts();
        loadAvatarsAndVoices();
    });
    
    // ============================================
    // INITIALIZATION FUNCTIONS
    // ============================================
    
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
    
    // ============================================
    // DATA LOADING FUNCTIONS
    // ============================================
    
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
        
        console.log('📊 Loading data for:', selectedSeason, 'Week', selectedWeek, seasonType);
        
        try {
            const matchupsUrl = `/api/weekly_summary?season=${selectedSeason}&week=${selectedWeek}&type=${seasonType}`;
            console.log('🔍 Fetching matchups:', matchupsUrl);
            
            const matchupsResponse = await fetch(matchupsUrl);
            const matchupsData = await matchupsResponse.json();
            
            console.log('✅ Received matchup data:', matchupsData);
            
            if (matchupsData.success) {
                matchups = matchupsData.matchups || [];
                dataLoaded = true;
                console.log(`✅ Found ${matchups.length} matchups`);
                
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
            console.error('❌ Error:', err);
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
                console.log('✅ Loaded existing summary');
            } else {
                summaryExists = false;
            }
        } catch (err) {
            console.error('❌ Error loading existing summary:', err);
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
                console.log('✅ Loaded existing video:', videoData);
            } else {
                videoData = null;
            }
        } catch (err) {
            console.error('❌ Error loading existing video:', err);
            videoData = null;
        } finally {
            checkingVideo = false;
        }
    }
    
    // ============================================
    // IMPORT & GENERATION FUNCTIONS
    // ============================================
    
    async function importWeek() {
        importing = true;
        error = '';
        
        try {
            console.log('📥 Importing week:', selectedSeason, 'Week', selectedWeek);
            
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
                console.error('❌ Non-JSON response:', text);
                error = 'API endpoint not found. Make sure the import endpoint exists.';
                return;
            }
            
            const data = await response.json();
            console.log('✅ Import result:', data);
            
            if (data.success) {
                alert('✅ Week imported successfully!');
                await loadWeeklyData();
            } else {
                error = data.error || 'Failed to import week data';
            }
        } catch (err) {
            console.error('❌ Import error:', err);
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
            console.log('🤖 Generating AI summary with enhanced context...');
            
            // Format basic matchup data
            const basicPrompt = formatMatchupData(matchups);
            
            const response = await fetch('/api/generate_summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: basicPrompt,
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
                console.log('✅ Summary generated successfully!');
            } else {
                error = data.error || 'Failed to generate summary';
            }
        } catch (err) {
            error = 'Failed to generate summary';
            console.error('❌ Error:', err);
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
            console.log('✨ Refining summary...');
            
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
                console.log('✅ Summary refined successfully!');
            } else {
                error = data.error || 'Failed to refine summary';
            }
        } catch (err) {
            error = 'Failed to refine summary';
            console.error('❌ Error:', err);
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
            console.log('💾 Saving summary...');
            
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
                alert('✅ Summary saved successfully!');
            } else {
                error = data.error || 'Failed to save summary';
            }
        } catch (err) {
            error = 'Failed to save summary';
            console.error('❌ Error:', err);
        } finally {
            saving = false;
        }
    }
    
    // ============================================
    // VIDEO GENERATION FUNCTIONS
    // ============================================
    
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
            console.log('🎬 Generating video...');
            
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
                    ? '✅ Test video generation started! Check back in a few seconds.'
                    : '✅ HeyGen video generation started! This usually takes 2-3 minutes.';
                alert(message);
                
                pollVideoStatus(data.videoId);
            } else {
                error = data.error || 'Failed to generate video';
            }
        } catch (err) {
            error = 'Failed to generate video';
            console.error('❌ Error:', err);
        } finally {
            generatingVideo = false;
        }
    }
    
    async function pollVideoStatus(videoId, attempts = 0) {
        const maxAttempts = testMode ? 20 : 60;
        const pollInterval = testMode ? 500 : 5000;
        
        if (attempts > maxAttempts) {
            console.log('⏱️ Polling timeout');
            await loadExistingVideo();
            return;
        }
        
        try {
            const response = await fetch(`/api/generate_weekly_summary_video?videoId=${videoId}`);
            const data = await response.json();
            
            if (data.success && data.video) {
                if (data.video.generation_status === 'completed') {
                    console.log('✅ Video completed!');
                    await loadExistingVideo();
                } else if (data.video.generation_status === 'processing' || data.video.generation_status === 'pending') {
                    setTimeout(() => pollVideoStatus(videoId, attempts + 1), pollInterval);
                } else {
                    await loadExistingVideo();
                }
            }
        } catch (err) {
            console.error('❌ Error polling video status:', err);
        }
    }
    
    // ============================================
    // PROMPT MANAGEMENT
    // ============================================
    
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
                alert('✅ Prompt saved successfully!');
                await loadPrompts();
            }
        } catch (err) {
            console.error('❌ Error saving prompt:', err);
            error = 'Failed to save prompt';
        }
    }
    
    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    
    function formatMatchupData(matchups) {
        const typeLabel = seasonType === 'playoffs' ? 'PLAYOFF' : 'REGULAR SEASON';
        let prompt = `Creating a ${typeLabel} recap for Week ${selectedWeek} of the ${selectedSeason} season.\n\n`;
        
        matchups.forEach((m, idx) => {
            const margin = parseFloat(m.margin) || 0;
            
            prompt += `MATCHUP ${idx + 1}`;
            if (m.round_name) prompt += ` - ${m.round_name}`;
            if (m.bracket) prompt += ` (${m.bracket} Bracket)`;
            prompt += `:\n`;
            
            prompt += `${m.team1_name} (${m.manager1_name}) ${m.team1_score} vs ${m.team2_name} (${m.manager2_name}) ${m.team2_score}\n`;
            prompt += `Winner: ${m.winner} by ${margin.toFixed(2)} points\n`;
            
            // Add team 1 roster details
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
                    prompt += `\n${m.team1_name} HIGH-SCORING BENCH:\n`;
                    benchBlunders.slice(0, 2).forEach(p => {
                        prompt += `  - ${p.player_name} (${p.position}): ${(p.points || 0).toFixed(1)} pts (BENCHED!)\n`;
                    });
                }
            }
            
            // Add team 2 roster details
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
                    prompt += `\n${m.team2_name} HIGH-SCORING BENCH:\n`;
                    benchBlunders.slice(0, 2).forEach(p => {
                        prompt += `  - ${p.player_name} (${p.position}): ${(p.points || 0).toFixed(1)} pts (BENCHED!)\n`;
                    });
                }
            }
            
            prompt += `\n`;
        });
        
        if (seasonType === 'playoffs') {
            prompt += '\nThis is a PLAYOFF game - emphasize the high stakes and championship implications!';
        }
        
        return prompt;
    }
    
    function toggleEditMode() {
        editMode = !editMode;
    }
    
    function cancelEdit() {
        editMode = false;
        loadExistingSummary();
    }
    
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text);
        alert('📋 Summary copied to clipboard!');
    }
    
    function handleSeasonTypeChange() {
        matchups = [];
        generatedSummary = '';
        summaryExists = false;
        dataLoaded = false;
        videoData = null;
    }
</script>

<div class="page-container">
    <header class="page-header">
        <h1>📊 Weekly Summary Generator</h1>
        <p class="subtitle">Generate AI-powered fantasy football recaps with enhanced context</p>
    </header>
    
    <!-- Main Controls -->
    <section class="controls-section card">
        <div class="controls-grid">
            <div class="control-group">
                <label for="season">Season</label>
                <select id="season" bind:value={selectedSeason}>
                    {#each seasons as season}
                        <option value={season}>{season}</option>
                    {/each}
                </select>
            </div>
            
            <div class="control-group">
                <label for="week">Week</label>
                <select id="week" bind:value={selectedWeek}>
                    {#each weeks as week}
                        <option value={week}>Week {week}</option>
                    {/each}
                </select>
            </div>
            
            <div class="control-group">
                <label for="seasonType">Type</label>
                <select id="seasonType" bind:value={seasonType} on:change={handleSeasonTypeChange}>
                    <option value="regular">Regular Season</option>
                    <option value="playoffs">Playoffs</option>
                </select>
            </div>
            
            <div class="control-group">
                <label>&nbsp;</label>
                <button 
                    on:click={loadWeeklyData} 
                    disabled={loading}
                    class="btn btn-primary btn-load"
                >
                    {#if loading}
                        <span class="spinner"></span> Loading...
                    {:else}
                        🔍 Load Week Data
                    {/if}
                </button>
            </div>
        </div>
    </section>
    
    <!-- Error Display -->
    {#if error}
        <div class="alert alert-error">
            <strong>❌ Error:</strong> {error}
        </div>
    {/if}
    
    <!-- Advanced Settings -->
    <section class="card">
        <button 
            on:click={() => showAdvancedSettings = !showAdvancedSettings}
            class="accordion-trigger"
        >
            <span>{showAdvancedSettings ? '▼' : '▶'} Advanced AI Settings</span>
        </button>
        
        {#if showAdvancedSettings}
            <div class="settings-content">
                <!-- Test Mode Toggle -->
                <div class="test-mode-banner">
                    <label class="test-mode-toggle">
                        <input type="checkbox" bind:checked={testMode}>
                        <span class="toggle-label">🧪 Test Mode (Use Mock Video)</span>
                    </label>
                    <p class="help-text">
                        When enabled, video generation uses a test video instead of calling HeyGen API (saves money during testing)
                    </p>
                </div>
                
                <!-- Prompt Selection -->
                <div class="form-group">
                    <label for="promptSelect">Load Saved Prompt</label>
                    <div class="input-with-button">
                        <select 
                            id="promptSelect"
                            bind:value={selectedPromptName}
                            on:change={loadSelectedPrompt}
                        >
                            {#each savedPrompts as prompt}
                                <option value={prompt.prompt_name}>
                                    {prompt.prompt_name} {prompt.is_default ? '(Default)' : ''}
                                </option>
                            {/each}
                        </select>
                    </div>
                </div>
                
                <!-- System Prompt -->
                <div class="form-group">
                    <label for="systemPrompt">System Prompt</label>
                    <textarea
                        id="systemPrompt"
                        bind:value={systemPrompt}
                        rows="6"
                        placeholder="Enter the AI system prompt here..."
                        class="code-textarea"
                    ></textarea>
                    <button on:click={savePrompt} class="btn btn-secondary btn-sm">
                        💾 Save as New Prompt
                    </button>
                </div>
            </div>
        {/if}
    </section>
    
    <!-- Data Status -->
    {#if dataLoaded}
        {#if matchups.length === 0}
            <div class="alert alert-warning">
                <div class="alert-content">
                    <p class="alert-message">
                        <strong>⚠️ No {seasonType === 'playoffs' ? 'playoff' : 'regular season'} data found</strong>
                        for Week {selectedWeek} of {selectedSeason}
                    </p>
                    {#if seasonType === 'regular'}
                        <p class="help-text">Click the button below to import this week's data from Sleeper.</p>
                        <button 
                            on:click={importWeek} 
                            disabled={importing}
                            class="btn btn-primary btn-lg"
                        >
                            {#if importing}
                                <span class="spinner"></span> Importing from Sleeper...
                            {:else}
                                📥 Import Week from Sleeper
                            {/if}
                        </button>
                    {:else}
                        <p class="help-text">Playoff data must be manually entered in the database.</p>
                    {/if}
                </div>
            </div>
        {:else}
            <div class="alert alert-success">
                <div class="alert-content">
                    <p class="alert-message">
                        ✅ {seasonType === 'playoffs' ? 'Playoff' : 'Regular Season'} Week {selectedWeek} data loaded 
                        ({matchups.length} matchup{matchups.length !== 1 ? 's' : ''})
                    </p>
                    <div class="button-group">
                        <button 
                            on:click={loadWeeklyData} 
                            disabled={loading}
                            class="btn btn-secondary"
                        >
                            {loading ? 'Loading...' : '🔄 Reload Data'}
                        </button>
                        
                        <button 
                            on:click={generateSummary} 
                            disabled={loading || generating}
                            class="btn btn-primary"
                        >
                            {#if generating}
                                <span class="spinner"></span> Generating with Enhanced Context...
                            {:else if summaryExists}
                                🔄 Regenerate Summary
                            {:else}
                                🤖 Generate AI Summary
                            {/if}
                        </button>
                    </div>
                </div>
            </div>
        {/if}
    {/if}
    
    <!-- Generated Summary -->
    {#if generatedSummary}
        <section class="card summary-card">
            <div class="card-header">
                <h2>Weekly Summary</h2>
                <div class="button-group">
                    {#if !editMode}
                        <button on:click={() => showRefinement = !showRefinement} class="btn btn-secondary btn-sm">
                            ✨ Refine
                        </button>
                        <button on:click={toggleEditMode} class="btn btn-secondary btn-sm">
                            ✏️ Edit
                        </button>
                        <button on:click={() => copyToClipboard(generatedSummary)} class="btn btn-secondary btn-sm">
                            📋 Copy
                        </button>
                        <button on:click={saveSummary} disabled={saving} class="btn btn-primary btn-sm">
                            {saving ? 'Saving...' : '💾 Save'}
                        </button>
                    {:else}
                        <button on:click={saveSummary} disabled={saving} class="btn btn-primary btn-sm">
                            {saving ? 'Saving...' : '💾 Save Changes'}
                        </button>
                        <button on:click={cancelEdit} disabled={saving} class="btn btn-secondary btn-sm">
                            ❌ Cancel
                        </button>
                    {/if}
                </div>
            </div>
            
            <!-- Refinement Panel -->
            {#if showRefinement && !editMode}
                <div class="refinement-panel">
                    <label for="refinementInstructions">How would you like to refine this summary?</label>
                    <textarea
                        id="refinementInstructions"
                        bind:value={refinementInstructions}
                        rows="3"
                        placeholder="E.g., 'Make it funnier', 'Add more stats', 'Focus on the upsets'..."
                    ></textarea>
                    <div class="button-group">
                        <button 
                            on:click={refineSummary} 
                            disabled={refining || !refinementInstructions.trim()} 
                            class="btn btn-primary"
                        >
                            {refining ? 'Refining...' : '✨ Apply Refinement'}
                        </button>
                        <button 
                            on:click={() => { showRefinement = false; refinementInstructions = ''; }} 
                            class="btn btn-secondary"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            {/if}
            
            <!-- Summary Content -->
            {#if editMode}
                <textarea
                    bind:value={generatedSummary}
                    class="summary-editor"
                    rows="15"
                    placeholder="Enter your summary..."
                ></textarea>
            {:else}
                <div class="summary-display">
                    {generatedSummary}
                </div>
            {/if}
        </section>
        
        <!-- Video Section -->
        <section class="card">
            <div class="card-header">
                <h2>🎥 AI Sportscaster Video</h2>
            </div>
            
            <!-- Video Settings -->
            <button 
                on:click={() => showVideoSettings = !showVideoSettings}
                class="accordion-trigger"
            >
                <span>{showVideoSettings ? '▼' : '▶'} Video Settings (Avatar & Voice)</span>
            </button>
            
            {#if showVideoSettings}
                <div class="settings-content">
                    <!-- Avatar Selection -->
                    <div class="form-group">
                        <h3>Select Avatar</h3>
                        {#if loadingAvatars}
                            <p class="loading-text">⏳ Loading avatars...</p>
                        {:else if availableAvatars.length > 0}
                            <div class="avatar-grid">
                                {#each availableAvatars as avatar}
                                    <button
                                        class="avatar-card {selectedAvatar?.avatar_id === avatar.avatar_id ? 'selected' : ''}"
                                        on:click={() => (selectedAvatar = avatar)}
                                    >
                                        {#if avatar.preview_image_url}
                                            <img src={avatar.preview_image_url} alt={avatar.avatar_name} />
                                        {/if}
                                        <p>{avatar.avatar_name || avatar.avatar_id}</p>
                                    </button>
                                {/each}
                            </div>
                        {:else}
                            <p class="help-text">No avatars available. Using default avatar.</p>
                        {/if}
                    </div>
                    
                    <!-- Voice Selection -->
                    <div class="form-group">
                        <h3>Select Voice</h3>
                        {#if loadingVoices}
                            <p class="loading-text">⏳ Loading voices...</p>
                        {:else if availableVoices.length > 0}
                            <select bind:value={selectedVoice} class="voice-select">
                                {#each availableVoices as voice}
                                    <option value={voice}>
                                        {voice.name || voice.voice_id} ({voice.language || 'English'}) {voice.gender ? `- ${voice.gender}` : ''}
                                    </option>
                                {/each}
                            </select>
                        {:else}
                            <p class="help-text">No voices available. Using default voice.</p>
                        {/if}
                    </div>
                </div>
            {/if}
            
            <!-- Video Display/Generation -->
            <div class="video-content">
                {#if checkingVideo}
                    <div class="video-placeholder">
                        <p>⏳ Checking for existing video...</p>
                    </div>
                {:else if videoData}
                    {#if videoData.generation_status === 'completed' && videoData.video_url}
                        <div class="video-player">
                            <video controls>
                                <source src={videoData.video_url} type="video/mp4">
                                Your browser does not support the video tag.
                            </video>
                            {#if videoData.completed_at}
                                <p class="video-meta">Generated: {new Date(videoData.completed_at).toLocaleString()}</p>
                            {/if}
                            <button 
                                on:click={generateVideo} 
                                disabled={generatingVideo}
                                class="btn btn-primary"
                            >
                                {generatingVideo ? 'Regenerating...' : '🔄 Regenerate Video'}
                            </button>
                        </div>
                    {:else if videoData.generation_status === 'processing' || videoData.generation_status === 'pending'}
                        <div class="alert alert-warning">
                            <p>⏳ Video is being generated...</p>
                            {#if videoData.error_message}
                                <p class="help-text">{videoData.error_message}</p>
                            {/if}
                        </div>
                    {:else if videoData.generation_status === 'failed'}
                        <div class="alert alert-error">
                            <p><strong>❌ Video generation failed</strong></p>
                            {#if videoData.error_message}
                                <p class="help-text">{videoData.error_message}</p>
                            {/if}
                            <button 
                                on:click={generateVideo} 
                                disabled={generatingVideo}
                                class="btn btn-primary"
                            >
                                {generatingVideo ? 'Retrying...' : '🔄 Retry Generation'}
                            </button>
                        </div>
                    {/if}
                {:else}
                    <div class="video-placeholder">
                        <p>📹 No video generated yet</p>
                        {#if testMode}
                            <p class="help-text success-text">🧪 Test mode enabled - will use mock video</p>
                        {/if}
                        <button 
                            on:click={generateVideo} 
                            disabled={generatingVideo || !generatedSummary}
                            class="btn btn-primary btn-lg"
                        >
                            {#if generatingVideo}
                                <span class="spinner"></span> Generating Video...
                            {:else}
                                🎬 Generate Video
                            {/if}
                        </button>
                    </div>
                {/if}
            </div>
        </section>
    {/if}
    
    <!-- Matchups Display -->
    {#if matchups.length > 0}
        <section class="card">
            <div class="card-header">
                <h2>
                    {seasonType === 'playoffs' ? 'Playoff' : 'Regular Season'} Week {selectedWeek} Matchups
                </h2>
            </div>
            
            <div class="matchups-grid">
                {#each matchups as matchup, idx}
                    <div class="matchup-card">
                        <div class="matchup-header">
                            <span class="matchup-number">Matchup {idx + 1}</span>
                            {#if matchup.round_name}
                                <span class="round-label">{matchup.round_name}</span>
                            {/if}
                            {#if matchup.bracket}
                                <span class="bracket-label">{matchup.bracket}</span>
                            {/if}
                        </div>
                        
                        <div class="matchup-teams">
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
                            <div class="matchup-margin">
                                Margin: {parseFloat(matchup.margin || 0).toFixed(2)} points
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
        </section>
    {/if}
</div>

<style>
    :global(body) {
        background: #f3f4f6;
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    
    .page-container {
        max-width: 1400px;
        margin: 0 auto;
        padding: 2rem;
    }
    
    .page-header {
        margin-bottom: 2rem;
    }
    
    .page-header h1 {
        font-size: 2rem;
        margin: 0 0 0.5rem 0;
        color: #111827;
    }
    
    .subtitle {
        color: #6b7280;
        margin: 0;
        font-size: 1rem;
    }
    
    /* Card Component */
    .card {
        background: white;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        margin-bottom: 1.5rem;
        overflow: hidden;
    }
    
    .card-header {
        padding: 1.5rem;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .card-header h2 {
        margin: 0;
        font-size: 1.25rem;
        color: #111827;
    }
    
    /* Controls */
    .controls-section {
        padding: 1.5rem;
    }
    
    .controls-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
    }
    
    .control-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .control-group label {
        font-size: 0.875rem;
        font-weight: 600;
        color: #374151;
    }
    
    select {
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 1rem;
        background: white;
        cursor: pointer;
    }
    
    select:focus {
        outline: none;
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
    
    /* Buttons */
    .btn {
        padding: 0.625rem 1rem;
        border: none;
        border-radius: 6px;
        font-weight: 600;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        justify-content: center;
    }
    
    .btn:disabled {
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
    
    .btn-sm {
        padding: 0.5rem 0.875rem;
        font-size: 0.8125rem;
    }
    
    .btn-lg {
        padding: 0.75rem 1.5rem;
        font-size: 1rem;
    }
    
    .btn-load {
        width: 100%;
    }
    
    .button-group {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }
    
    /* Spinner */
    .spinner {
        display: inline-block;
        width: 14px;
        height: 14px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    
    /* Alerts */
    .alert {
        padding: 1.25rem;
        border-radius: 8px;
        margin-bottom: 1.5rem;
    }
    
    .alert-error {
        background: #fee2e2;
        border: 1px solid #fca5a5;
        color: #991b1b;
    }
    
    .alert-warning {
        background: #fef3c7;
        border: 1px solid #fcd34d;
        color: #92400e;
    }
    
    .alert-success {
        background: #d1fae5;
        border: 1px solid #6ee7b7;
        color: #065f46;
    }
    
    .alert-content {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    
    .alert-message {
        margin: 0;
        font-weight: 500;
    }
    
    .help-text {
        margin: 0;
        font-size: 0.875rem;
        opacity: 0.9;
    }
    
    .success-text {
        color: #059669;
    }
    
    /* Accordion */
    .accordion-trigger {
        width: 100%;
        padding: 1rem 1.5rem;
        background: #f9fafb;
        border: none;
        border-bottom: 1px solid #e5e7eb;
        text-align: left;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
    }
    
    .accordion-trigger:hover {
        background: #f3f4f6;
    }
    
    .settings-content {
        padding: 1.5rem;
    }
    
    /* Test Mode Banner */
    .test-mode-banner {
        background: #fef3c7;
        border: 2px solid #f59e0b;
        border-radius: 6px;
        padding: 1rem;
        margin-bottom: 1.5rem;
    }
    
    .test-mode-toggle {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        cursor: pointer;
        font-weight: 600;
    }
    
    .test-mode-toggle input[type="checkbox"] {
        width: 20px;
        height: 20px;
        cursor: pointer;
    }
    
    .toggle-label {
        font-size: 1.05rem;
    }
    
    /* Form Groups */
    .form-group {
        margin-bottom: 1.5rem;
    }
    
    .form-group label {
        display: block;
        font-weight: 600;
        margin-bottom: 0.5rem;
        color: #374151;
    }
    
    .form-group h3 {
        margin: 0 0 0.75rem 0;
        font-size: 1.1rem;
        color: #111827;
    }
    
    textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-family: inherit;
        font-size: 1rem;
        resize: vertical;
    }
    
    textarea:focus {
        outline: none;
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
    
    .code-textarea {
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 0.875rem;
    }
    
    /* Avatar Grid */
    .avatar-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 1rem;
    }
    
    .avatar-card {
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        padding: 1rem;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s;
        background: white;
    }
    
    .avatar-card:hover {
        border-color: #2563eb;
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
    }
    
    .avatar-card.selected {
        border-color: #2563eb;
        background: #eff6ff;
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
    }
    
    .avatar-card img {
        width: 100%;
        height: auto;
        border-radius: 4px;
        margin-bottom: 0.5rem;
    }
    
    .avatar-card p {
        margin: 0;
        font-size: 0.875rem;
        font-weight: 500;
        color: #374151;
    }
    
    .voice-select {
        width: 100%;
    }
    
    /* Summary Card */
    .summary-card .card-header {
        padding: 1.5rem;
    }
    
    .refinement-panel {
        background: #fef3c7;
        border: 2px solid #f59e0b;
        border-radius: 6px;
        padding: 1.5rem;
        margin: 0 1.5rem 1.5rem 1.5rem;
    }
    
    .refinement-panel label {
        display: block;
        font-weight: 600;
        margin-bottom: 0.5rem;
        color: #78350f;
    }
    
    .summary-display {
        padding: 1.5rem;
        background: #f9fafb;
        margin: 0 1.5rem 1.5rem 1.5rem;
        border-radius: 6px;
        white-space: pre-wrap;
        line-height: 1.7;
        color: #111827;
    }
    
    .summary-editor {
        margin: 0 1.5rem 1.5rem 1.5rem;
        min-height: 300px;
        line-height: 1.7;
    }
    
    /* Video Content */
    .video-content {
        padding: 1.5rem;
    }
    
    .video-placeholder {
        text-align: center;
        padding: 3rem 1.5rem;
        background: #f9fafb;
        border-radius: 8px;
    }
    
    .video-placeholder p {
        margin: 0 0 1rem 0;
        color: #6b7280;
    }
    
    .video-player {
        text-align: center;
    }
    
    .video-player video {
        width: 100%;
        max-width: 800px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .video-meta {
        margin: 1rem 0;
        font-size: 0.875rem;
        color: #6b7280;
    }
    
    .loading-text {
        color: #6b7280;
        font-style: italic;
    }
    
    /* Matchups Grid */
    .matchups-grid {
        padding: 1.5rem;
        display: grid;
        gap: 1rem;
    }
    
    .matchup-card {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 1.5rem;
    }
    
    .matchup-header {
        display: flex;
        gap: 0.75rem;
        margin-bottom: 1rem;
        flex-wrap: wrap;
    }
    
    .matchup-number {
        font-weight: 700;
        color: #111827;
    }
    
    .round-label {
        font-weight: 600;
        color: #2563eb;
    }
    
    .bracket-label {
        color: #6b7280;
        font-size: 0.875rem;
    }
    
    .matchup-teams {
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
        color: #111827;
    }
    
    .manager-name {
        font-size: 0.875rem;
        color: #6b7280;
        margin-bottom: 0.75rem;
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
        font-size: 1.25rem;
    }
    
    .matchup-margin {
        text-align: center;
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid #e5e7eb;
        font-size: 0.875rem;
        color: #6b7280;
    }
    
    /* Responsive */
    @media (max-width: 768px) {
        .page-container {
            padding: 1rem;
        }
        
        .controls-grid {
            grid-template-columns: 1fr;
        }
        
        .matchup-teams {
            flex-direction: column;
            gap: 1rem;
        }
        
        .button-group {
            flex-direction: column;
        }
        
        .button-group .btn {
            width: 100%;
        }
    }
</style>