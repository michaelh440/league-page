<!-- src/routes/weekly_summary/+page.svelte -->
<script>
	import { onMount } from 'svelte';

	let selectedSeason = '2025';
	let selectedWeek = '1';
	let matchups = [];
	let loading = false;
	let importing = false;
	let generating = false;
	let generatedSummary = '';
	let error = '';
	let dataLoaded = false;

	// AI Prompts
	let availablePrompts = [];
	let selectedPromptId = null;
	let systemPrompt = `You are a witty, snarky fantasy football analyst writing weekly recaps for "The Hou Dat League". Your writing style is entertaining and slightly sarcastic. Call out bad performances and celebrate great ones. Use sports commentary language. Keep it fun and lighthearted. Format as a narrative, not bullet points. Keep it around 300-500 words.`;
	let showAdvancedSettings = false;
	let customPromptName = '';
	let savingPrompt = false;

	// Refinement
	let refining = false;
	let refinementInstructions = '';

	// Video generation
	let videoUrl = null;
	let videoStatus = null;
	let videoError = null;
	let videoId = null;
	let testMode = true;

	// NEW: Avatar and Voice selection
	let availableAvatars = [];
	let availableVoices = [];
	let selectedAvatar = null;
	let selectedVoice = null;
	let loadingAvatars = false;
	let loadingVoices = false;
	let showVideoSettings = false;

	const seasons = Array.from({ length: 11 }, (_, i) => 2025 - i);

	onMount(() => {
		loadPrompts();
		loadAvatarsAndVoices();
	});

	async function loadPrompts() {
		try {
			const response = await fetch('/api/ai_prompts');
			const data = await response.json();
			if (data.success) {
				availablePrompts = data.prompts;
				const defaultPrompt = availablePrompts.find((p) => p.is_default);
				if (defaultPrompt) {
					selectedPromptId = defaultPrompt.prompt_id;
					systemPrompt = defaultPrompt.system_prompt;
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
			// Load avatars
			const avatarsResponse = await fetch('/api/heygen_avatars');
			const avatarsData = await avatarsResponse.json();
			if (avatarsData.success && avatarsData.avatars) {
				availableAvatars = avatarsData.avatars;
				// Set default avatar (Annelise or first available)
				selectedAvatar = availableAvatars.find(a => a.avatar_id?.includes('Annelise')) || availableAvatars[0];
			}
		} catch (err) {
			console.error('Error loading avatars:', err);
		} finally {
			loadingAvatars = false;
		}

		try {
			// Load voices
			const voicesResponse = await fetch('/api/heygen_voices');
			const voicesData = await voicesResponse.json();
			if (voicesData.success && voicesData.voices) {
				availableVoices = voicesData.voices;
				// Set default voice (Jenny or first available)
				selectedVoice = availableVoices.find(v => v.voice_id?.includes('jenny')) || availableVoices[0];
			}
		} catch (err) {
			console.error('Error loading voices:', err);
		} finally {
			loadingVoices = false;
		}
	}

	function onPromptChange() {
		if (!selectedPromptId) return;
		const selected = availablePrompts.find((p) => p.prompt_id === parseInt(selectedPromptId));
		if (selected) {
			systemPrompt = selected.system_prompt;
		}
	}

	async function savePrompt() {
		if (!customPromptName.trim()) {
			alert('Please enter a name for the prompt');
			return;
		}

		savingPrompt = true;
		try {
			const response = await fetch('/api/ai_prompts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					promptName: customPromptName.trim(),
					systemPrompt: systemPrompt
				})
			});

			const data = await response.json();
			if (data.success) {
				alert('Prompt saved successfully!');
				customPromptName = '';
				await loadPrompts();
			} else {
				alert('Error saving prompt: ' + data.error);
			}
		} catch (err) {
			console.error('Error saving prompt:', err);
			alert('Error saving prompt');
		} finally {
			savingPrompt = false;
		}
	}

	async function loadWeeklyData() {
		console.log('Loading data for:', selectedSeason, selectedWeek);
		loading = true;
		error = '';
		matchups = [];
		generatedSummary = '';
		dataLoaded = false;

		try {
			console.log('Fetching matchups:', `/api/weekly_summary?season=${selectedSeason}&week=${selectedWeek}`);
			const response = await fetch(`/api/weekly_summary?season=${selectedSeason}&week=${selectedWeek}`);
			const data = await response.json();

			console.log('Received matchup data:', data);

			if (data.success && data.matchups) {
				matchups = data.matchups;
				console.log('Found', matchups.length, 'matchups');

				if (data.summary) {
					generatedSummary = data.summary;
					console.log('Loaded existing summary');
				}

				dataLoaded = true;
				await loadExistingVideo();
			} else {
				error = data.error || 'No matchup data found';
			}
		} catch (err) {
			console.error('Error loading weekly data:', err);
			error = 'Failed to load weekly data: ' + err.message;
		} finally {
			loading = false;
		}
	}

	async function importFromSleeper() {
		importing = true;
		error = '';

		try {
			const response = await fetch('/api/import_sleeper_week', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					season: selectedSeason,
					week: selectedWeek
				})
			});

			const data = await response.json();

			if (data.success) {
				alert(`Successfully imported ${data.matchupsImported} matchups from Sleeper!`);
				await loadWeeklyData();
			} else {
				error = data.error || 'Failed to import from Sleeper';
			}
		} catch (err) {
			console.error('Error importing from Sleeper:', err);
			error = 'Failed to import from Sleeper: ' + err.message;
		} finally {
			importing = false;
		}
	}

	async function generateSummary() {
		if (!matchups || matchups.length === 0) {
			alert('Please load week data first');
			return;
		}

		generating = true;
		error = '';

		try {
			const response = await fetch('/api/generate_summary', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					matchups,
					season: selectedSeason,
					week: selectedWeek,
					systemPrompt
				})
			});

			const data = await response.json();

			if (data.success) {
				generatedSummary = data.summary;
			} else {
				error = data.error || 'Failed to generate summary';
			}
		} catch (err) {
			console.error('Error generating summary:', err);
			error = 'Failed to generate summary: ' + err.message;
		} finally {
			generating = false;
		}
	}

	async function refineSummary() {
		if (!generatedSummary) {
			alert('Generate a summary first');
			return;
		}
		if (!refinementInstructions.trim()) {
			alert('Please provide refinement instructions');
			return;
		}

		refining = true;
		error = '';

		try {
			const response = await fetch('/api/generate_summary', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					matchups,
					season: selectedSeason,
					week: selectedWeek,
					systemPrompt,
					refinementMode: true,
					previousSummary: generatedSummary,
					refinementInstructions: refinementInstructions.trim()
				})
			});

			const data = await response.json();

			if (data.success) {
				generatedSummary = data.summary;
				refinementInstructions = '';
			} else {
				error = data.error || 'Failed to refine summary';
			}
		} catch (err) {
			console.error('Error refining summary:', err);
			error = 'Failed to refine summary: ' + err.message;
		} finally {
			refining = false;
		}
	}

	async function saveSummary() {
		if (!generatedSummary) {
			alert('No summary to save');
			return;
		}

		try {
			const response = await fetch('/api/weekly_summary', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					season: selectedSeason,
					week: selectedWeek,
					summary: generatedSummary
				})
			});

			const data = await response.json();

			if (data.success) {
				alert('Summary saved successfully!');
			} else {
				alert('Error saving summary: ' + data.error);
			}
		} catch (err) {
			console.error('Error saving summary:', err);
			alert('Error saving summary');
		}
	}

	async function loadExistingVideo() {
		try {
			const response = await fetch(
				`/api/weekly_summary_video?season=${selectedSeason}&week=${selectedWeek}`
			);
			const data = await response.json();

			if (data.success && data.video) {
				videoUrl = data.video.video_url;
				videoStatus = data.video.generation_status;
				videoError = data.video.error_message;
				videoId = data.video.video_id;
			} else {
				videoUrl = null;
				videoStatus = null;
				videoError = null;
				videoId = null;
			}
		} catch (err) {
			console.error('Error loading existing video:', err);
		}
	}

	async function generateVideo() {
		if (!generatedSummary) {
			alert('Please generate a summary first');
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

		const confirmMessage = testMode
			? 'Generate test video? (Will use mock video for testing)'
			: 'Generate video with HeyGen? (This will use your HeyGen credits)';

		if (!confirm(confirmMessage)) return;

		generating = true;
		videoStatus = 'pending';

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
				alert('Error generating video: ' + data.error);
				videoStatus = 'failed';
				videoError = data.error;
			}
		} catch (err) {
			console.error('Error generating video:', err);
			alert('Error generating video');
			videoStatus = 'failed';
			videoError = err.message;
		} finally {
			generating = false;
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
				} else if (
					data.video.generation_status === 'processing' ||
					data.video.generation_status === 'pending'
				) {
					setTimeout(() => pollVideoStatus(videoId, attempts + 1), pollInterval);
				} else {
					await loadExistingVideo();
				}
			}
		} catch (err) {
			console.error('Error polling video status:', err);
		}
	}

	async function cancelAndRetryVideo() {
		if (!confirm('Cancel the current video and start over?')) return;

		try {
			const response = await fetch('/api/weekly_summary_video', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					season: selectedSeason,
					week: selectedWeek
				})
			});

			const data = await response.json();
			if (data.success) {
				videoUrl = null;
				videoStatus = null;
				videoError = null;
				videoId = null;
			}
		} catch (err) {
			console.error('Error canceling video:', err);
		}
	}

	async function regenerateVideo() {
		if (!confirm('Regenerate video with current summary?')) return;

		try {
			await fetch('/api/weekly_summary_video', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					season: selectedSeason,
					week: selectedWeek
				})
			});

			videoUrl = null;
			videoStatus = null;
			videoError = null;
			videoId = null;

			await generateVideo();
		} catch (err) {
			console.error('Error regenerating video:', err);
		}
	}
</script>

<div class="container">
	<h1>📊 Weekly Summary Generator</h1>

	<!-- Week Selection -->
	<div class="controls">
		<div class="week-selector">
			<label>
				Season:
				<select bind:value={selectedSeason}>
					{#each seasons as season}
						<option value={season}>{season}</option>
					{/each}
				</select>
			</label>

			<label>
				Week:
				<select bind:value={selectedWeek}>
					{#each Array(18) as _, i}
						<option value={i + 1}>Week {i + 1}</option>
					{/each}
				</select>
			</label>

			<button on:click={loadWeeklyData} disabled={loading}>
				{loading ? '⏳ Loading...' : '🔍 Load Week Data'}
			</button>

			<button on:click={importFromSleeper} disabled={importing || !dataLoaded}>
				{importing ? '⏳ Importing...' : '📥 Import from Sleeper'}
			</button>
		</div>
	</div>

	{#if error}
		<div class="error">{error}</div>
	{/if}

	<!-- Advanced AI Settings -->
	{#if dataLoaded}
		<div class="advanced-settings">
			<button class="toggle-btn" on:click={() => (showAdvancedSettings = !showAdvancedSettings)}>
				{showAdvancedSettings ? '▼' : '▶'} Advanced AI Settings
			</button>

			{#if showAdvancedSettings}
				<div class="settings-content">
					<!-- Test Mode Toggle -->
					<div class="test-mode-toggle">
						<label>
							<input type="checkbox" bind:checked={testMode} style="width: 20px; height: 20px;" />
							<strong>🧪 Test Mode (Use Mock Video)</strong>
							<span style="display: block; margin-left: 28px; color: #666; font-size: 0.9em;">
								Enabled = Free test video. Disabled = Real HeyGen video (uses credits)
							</span>
						</label>
					</div>

					<!-- Prompt Selection -->
					<div class="prompt-selection">
						<label>
							Load Saved Prompt:
							<select bind:value={selectedPromptId} on:change={onPromptChange}>
								<option value={null}>-- Select a prompt --</option>
								{#each availablePrompts as prompt}
									<option value={prompt.prompt_id}>
										{prompt.prompt_name} {prompt.is_default ? '(Default)' : ''}
									</option>
								{/each}
							</select>
						</label>
					</div>

					<!-- System Prompt -->
					<div class="system-prompt">
						<label>
							System Prompt:
							<textarea bind:value={systemPrompt} rows="6" />
						</label>
					</div>

					<!-- Save Prompt -->
					<div class="save-prompt">
						<label>
							Save Current Prompt As:
							<input type="text" bind:value={customPromptName} placeholder="e.g., 'Funny Analyst'" />
						</label>
						<button on:click={savePrompt} disabled={savingPrompt || !customPromptName.trim()}>
							{savingPrompt ? '💾 Saving...' : '💾 Save Prompt'}
						</button>
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Matchups Display -->
	{#if dataLoaded && matchups.length > 0}
		<div class="matchups-section">
			<h2>Week {selectedWeek} Matchups</h2>
			<div class="matchups-grid">
				{#each matchups as matchup}
					<div class="matchup-card">
						<div class="team">
							<strong>{matchup.team1_name}</strong>
							<span class="score">{matchup.team1_score}</span>
						</div>
						<div class="vs">vs</div>
						<div class="team">
							<strong>{matchup.team2_name}</strong>
							<span class="score">{matchup.team2_score}</span>
						</div>
					</div>
				{/each}
			</div>

			<button on:click={generateSummary} disabled={generating}>
				{generating ? '⏳ Generating...' : '✨ Generate AI Summary'}
			</button>
		</div>
	{/if}

	<!-- Generated Summary -->
	{#if generatedSummary}
		<div class="summary-section">
			<h2>Generated Summary</h2>
			<textarea bind:value={generatedSummary} rows="15" class="summary-text" />

			<div class="summary-actions">
				<button on:click={saveSummary} class="save-btn">💾 Save Summary</button>
			</div>

			<!-- Refinement Section -->
			<div class="refinement-section">
				<h3>🔧 Refine Summary</h3>
				<textarea
					bind:value={refinementInstructions}
					placeholder="Enter refinement instructions (e.g., 'Make it funnier' or 'Add more stats about highest scorer')"
					rows="3"
				/>
				<button on:click={refineSummary} disabled={refining || !refinementInstructions.trim()}>
					{refining ? '⏳ Refining...' : '🔧 Refine Summary'}
				</button>
			</div>
		</div>
	{/if}

	<!-- Video Section -->
	{#if generatedSummary}
		<div class="video-section">
			<h2>🎬 Video Generation</h2>

			<!-- Video Settings Toggle -->
			<button class="toggle-btn" on:click={() => (showVideoSettings = !showVideoSettings)}>
				{showVideoSettings ? '▼' : '▶'} Video Settings
			</button>

			{#if showVideoSettings}
				<div class="video-settings">
					<!-- Avatar Selection -->
					<div class="avatar-selection">
						<h3>Select Avatar</h3>
						{#if loadingAvatars}
							<p>⏳ Loading avatars...</p>
						{:else if availableAvatars.length > 0}
							<div class="avatar-grid">
								{#each availableAvatars as avatar}
									<div
										class="avatar-card {selectedAvatar?.avatar_id === avatar.avatar_id
											? 'selected'
											: ''}"
										on:click={() => (selectedAvatar = avatar)}
									>
										{#if avatar.preview_image_url}
											<img src={avatar.preview_image_url} alt={avatar.avatar_name} />
										{/if}
										<p>{avatar.avatar_name || avatar.avatar_id}</p>
									</div>
								{/each}
							</div>
						{:else}
							<p>No avatars available. Using default avatar.</p>
						{/if}
					</div>

					<!-- Voice Selection -->
					<div class="voice-selection">
						<h3>Select Voice</h3>
						{#if loadingVoices}
							<p>⏳ Loading voices...</p>
						{:else if availableVoices.length > 0}
							<select bind:value={selectedVoice}>
								{#each availableVoices as voice}
									<option value={voice}>
										{voice.name || voice.voice_id} ({voice.language || 'English'}) {voice.gender
											? `- ${voice.gender}`
											: ''}
									</option>
								{/each}
							</select>
						{:else}
							<p>No voices available. Using default voice.</p>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Video Status -->
			{#if !videoUrl && !videoStatus}
				<p style="color: #666; font-style: italic;">
					{testMode ? '🧪 Test mode is enabled - will use mock video' : 'No video generated yet'}
				</p>
				<button on:click={generateVideo} disabled={generating} class="generate-video-btn">
					{generating ? '⏳ Generating Video...' : '🎬 Generate Video'}
				</button>
			{:else if videoStatus === 'pending' || videoStatus === 'processing'}
				<p style="color: #ff9800;">⏳ Video Processing... This may take 2-3 minutes.</p>
				<button on:click={cancelAndRetryVideo} class="cancel-btn">🔄 Cancel & Retry</button>
			{:else if videoStatus === 'failed'}
				<p style="color: #f44336;">❌ Video generation failed: {videoError || 'Unknown error'}</p>
				<button on:click={cancelAndRetryVideo} class="cancel-btn">🔄 Try Again</button>
			{:else if videoStatus === 'completed' && videoUrl}
				<div class="video-player">
					<video controls width="100%">
						<source src={videoUrl} type="video/mp4" />
						Your browser does not support the video tag.
					</video>
				</div>
				<button on:click={regenerateVideo} class="regenerate-btn">
					🔄 Regenerate Video with Current Summary
				</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	h1 {
		color: #333;
		margin-bottom: 2rem;
	}

	.controls {
		background: #f5f5f5;
		padding: 1.5rem;
		border-radius: 8px;
		margin-bottom: 2rem;
	}

	.week-selector {
		display: flex;
		gap: 1rem;
		align-items: center;
		flex-wrap: wrap;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	select,
	input[type='text'],
	textarea {
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
	}

	button {
		padding: 0.75rem 1.5rem;
		background: #2196f3;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
		transition: background 0.2s;
	}

	button:hover:not(:disabled) {
		background: #1976d2;
	}

	button:disabled {
		background: #ccc;
		cursor: not-allowed;
	}

	.error {
		background: #ffebee;
		color: #c62828;
		padding: 1rem;
		border-radius: 4px;
		margin-bottom: 1rem;
	}

	.advanced-settings {
		background: #f9f9f9;
		border: 1px solid #ddd;
		border-radius: 8px;
		padding: 1rem;
		margin-bottom: 2rem;
	}

	.toggle-btn {
		background: transparent;
		color: #333;
		padding: 0.5rem;
		text-align: left;
		width: 100%;
		font-weight: bold;
	}

	.toggle-btn:hover {
		background: #f0f0f0;
	}

	.settings-content {
		margin-top: 1rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.test-mode-toggle {
		background: #fff9c4;
		padding: 1rem;
		border-radius: 4px;
		border: 1px solid #f9a825;
	}

	.system-prompt textarea {
		width: 100%;
		font-family: monospace;
	}

	.save-prompt {
		display: flex;
		gap: 1rem;
		align-items: flex-end;
	}

	.save-prompt label {
		flex: 1;
	}

	.matchups-section {
		margin-bottom: 2rem;
	}

	.matchups-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.matchup-card {
		background: white;
		border: 1px solid #ddd;
		border-radius: 8px;
		padding: 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.team {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.score {
		font-size: 1.5rem;
		color: #2196f3;
		font-weight: bold;
	}

	.vs {
		color: #999;
		font-weight: bold;
	}

	.summary-section {
		background: white;
		border: 1px solid #ddd;
		border-radius: 8px;
		padding: 1.5rem;
		margin-bottom: 2rem;
	}

	.summary-text {
		width: 100%;
		font-family: Arial, sans-serif;
		line-height: 1.6;
		margin-bottom: 1rem;
	}

	.summary-actions {
		display: flex;
		gap: 1rem;
	}

	.save-btn {
		background: #4caf50;
	}

	.save-btn:hover:not(:disabled) {
		background: #45a049;
	}

	.refinement-section {
		margin-top: 2rem;
		padding-top: 1.5rem;
		border-top: 1px solid #ddd;
	}

	.refinement-section textarea {
		width: 100%;
		margin-bottom: 1rem;
	}

	.video-section {
		background: white;
		border: 1px solid #ddd;
		border-radius: 8px;
		padding: 1.5rem;
		margin-bottom: 2rem;
	}

	.video-settings {
		background: #f9f9f9;
		padding: 1.5rem;
		border-radius: 4px;
		margin-top: 1rem;
		margin-bottom: 1rem;
	}

	.avatar-selection,
	.voice-selection {
		margin-bottom: 1.5rem;
	}

	.avatar-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 1rem;
		margin-top: 1rem;
	}

	.avatar-card {
		border: 2px solid #ddd;
		border-radius: 8px;
		padding: 1rem;
		text-align: center;
		cursor: pointer;
		transition: all 0.2s;
	}

	.avatar-card:hover {
		border-color: #2196f3;
		box-shadow: 0 2px 8px rgba(33, 150, 243, 0.2);
	}

	.avatar-card.selected {
		border-color: #2196f3;
		background: #e3f2fd;
		box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
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

	.voice-selection select {
		width: 100%;
		padding: 0.75rem;
	}

	.generate-video-btn {
		background: #9c27b0;
		font-size: 1.1rem;
		padding: 1rem 2rem;
	}

	.generate-video-btn:hover:not(:disabled) {
		background: #7b1fa2;
	}

	.cancel-btn {
		background: #ff9800;
	}

	.cancel-btn:hover:not(:disabled) {
		background: #f57c00;
	}

	.regenerate-btn {
		background: #03a9f4;
		margin-top: 1rem;
		width: 100%;
		padding: 1rem;
		font-size: 1.1rem;
	}

	.regenerate-btn:hover:not(:disabled) {
		background: #0288d1;
	}

	.video-player {
		margin: 1.5rem 0;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}
</style>