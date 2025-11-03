<script>
	import { enhance } from '$app/forms';

	let fileInput;
	let fileName = '';
	let csvPreview = [];
	let uploading = false;
	let uploadResult = null;
	let csvText = '';
	let uniqueTeams = [];
	let teamMappings = {};
	let seasonId = '1';

	// Reactive variables that update automatically
	$: mappedCount = Object.values(teamMappings).filter(id => id && id !== '').length;
	$: totalTeams = uniqueTeams.length;
	$: allMapped = totalTeams > 0 && mappedCount === totalTeams;
	$: uploadDisabled = uploading || !fileName || !allMapped || !seasonId;

	function handleFileSelect(event) {
		const file = event.target.files[0];
		if (file) {
			fileName = file.name;
			uploadResult = null;
			
			const reader = new FileReader();
			reader.onload = (e) => {
				csvText = e.target.result;
				parseCSVPreview(csvText);
				extractUniqueTeams(csvText);
			};
			reader.readAsText(file);
		}
	}

	function parseCSVPreview(text) {
		const lines = text.trim().split('\n');
		const headers = lines[0].split(',');
		
		csvPreview = lines.slice(1, 6).map(line => {
			const values = line.split(',');
			const row = {};
			headers.forEach((header, i) => {
				row[header.trim()] = values[i]?.trim() || '';
			});
			return row;
		});
	}

	function extractUniqueTeams(text) {
		const lines = text.trim().split('\n');
		const headers = lines[0].split(',').map(h => h.trim());
		
		const teamIdIndex = headers.indexOf('team_id');
		const teamNameIndex = headers.indexOf('team_name');
		
		if (teamIdIndex === -1 || teamNameIndex === -1) {
			console.log('Could not find team columns in CSV');
			return;
		}

		const teamsMap = new Map();
		
		lines.slice(1).forEach(line => {
			const values = line.split(',');
			const teamId = values[teamIdIndex]?.trim();
			const teamName = values[teamNameIndex]?.trim();
			
			if (teamId && teamName && !teamsMap.has(teamId)) {
				teamsMap.set(teamId, teamName);
			}
		});

		uniqueTeams = Array.from(teamsMap.entries()).map(([id, name]) => ({
			yahooId: id,
			name: name
		})).sort((a, b) => parseInt(a.yahooId) - parseInt(b.yahooId));

		// Initialize team mappings
		teamMappings = {};
		uniqueTeams.forEach(team => {
			teamMappings[team.yahooId] = '';
		});
		
		console.log('Found teams:', uniqueTeams);
	}

	function handleTeamMappingChange(yahooId, value) {
		teamMappings[yahooId] = value;
		// Force reactivity by creating new object
		teamMappings = {...teamMappings};
	}

	function handleSubmit() {
		uploading = true;
		uploadResult = null;
		
		return async ({ result, update }) => {
			uploading = false;
			if (result.type === 'success') {
				uploadResult = result.data;
				fileName = '';
				csvPreview = [];
				csvText = '';
				uniqueTeams = [];
				teamMappings = {};
				if (fileInput) {
					fileInput.value = '';
				}
			} else if (result.type === 'failure') {
				uploadResult = { success: false, message: result.data?.message || 'Upload failed' };
			}
			await update();
		};
	}
</script>

<div class="upload-container">
	<h1>Upload Player Fantasy Stats</h1>
	<p class="subtitle">Upload Yahoo fantasy stats CSV files to staging table</p>

	<form method="POST" enctype="multipart/form-data" use:enhance={handleSubmit}>
		<!-- Season Configuration -->
		<div class="config-section">
			<h3>⚙️ Season Configuration</h3>
			<div class="season-input">
				<label for="seasonId">
					Season ID:
					<span class="help-text">(1 for 2015, 2 for 2016, etc.)</span>
				</label>
				<input
					type="number"
					id="seasonId"
					name="seasonId"
					bind:value={seasonId}
					min="1"
					max="20"
					required
					class="season-input-field"
				/>
			</div>
		</div>

		<!-- File Upload -->
		<div class="upload-area">
			<input
				type="file"
				accept=".csv"
				name="file"
				bind:this={fileInput}
				on:change={handleFileSelect}
				id="file-input"
				required
			/>
			<label for="file-input" class="file-label">
				<span class="upload-icon">📁</span>
				<span class="upload-text">
					{#if fileName}
						{fileName}
					{:else}
						Click to select CSV file or drag and drop
					{/if}
				</span>
			</label>
		</div>

		{#if csvPreview.length > 0}
			<!-- CSV Preview -->
			<div class="preview-section">
				<h3>📊 CSV Preview (first 5 rows)</h3>
				<div class="preview-table-container">
					<table class="preview-table">
						<thead>
							<tr>
								{#each Object.keys(csvPreview[0]) as header}
									<th>{header}</th>
								{/each}
							</tr>
						</thead>
						<tbody>
							{#each csvPreview as row}
								<tr>
									{#each Object.values(row) as value}
										<td>{value}</td>
									{/each}
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>

			<!-- Team Mapping -->
			{#if uniqueTeams.length > 0}
				<div class="team-mapping-section">
					<h3>🔗 Map Yahoo Team IDs to Your Database Team IDs</h3>
					<p class="mapping-instructions">
						Enter your PostgreSQL team_id for each Yahoo team. Check your database:
						<code>SELECT team_id, team_name FROM teams WHERE season_id = {seasonId} ORDER BY team_id;</code>
					</p>
					
					<div class="progress-bar">
						<div class="progress-label">
							Mapping Progress: {mappedCount} of {totalTeams} teams mapped
						</div>
						<div class="progress-track">
							<div class="progress-fill" style="width: {(mappedCount / totalTeams) * 100}%"></div>
						</div>
					</div>

					<div class="team-mapping-grid">
						{#each uniqueTeams as team}
							<div class="team-card">
								<div class="team-info">
									<div class="yahoo-id">Yahoo ID: {team.yahooId}</div>
									<div class="team-name">{team.name}</div>
								</div>
								<div class="mapping-input">
									<label for="team_{team.yahooId}">Your team_id:</label>
									<input
										type="number"
										id="team_{team.yahooId}"
										name="team_mapping_{team.yahooId}"
										value={teamMappings[team.yahooId]}
										on:input={(e) => handleTeamMappingChange(team.yahooId, e.target.value)}
										placeholder="Enter ID"
										min="1"
										required
										class={teamMappings[team.yahooId] ? 'mapped' : ''}
									/>
									{#if teamMappings[team.yahooId]}
										<span class="check-mark">✓</span>
									{/if}
								</div>
								<!-- Hidden input to ensure value is submitted -->
								<input
									type="hidden"
									name="team_mapping_{team.yahooId}"
									value={teamMappings[team.yahooId]}
								/>
							</div>
						{/each}
					</div>

					{#if !allMapped}
						<div class="warning-message">
							⚠️ Please map all teams before uploading
						</div>
					{/if}
				</div>
			{/if}
		{/if}

		<!-- Debug Info -->
		<div class="debug-info">
			<strong>Debug:</strong>
			File: {fileName ? '✓' : '✗'} |
			Season ID: {seasonId ? '✓' : '✗'} |
			Teams found: {totalTeams} |
			Teams mapped: {mappedCount} |
			All mapped: {allMapped ? '✓' : '✗'} |
			Button: {uploadDisabled ? 'DISABLED' : 'ENABLED'}
		</div>

		<!-- Upload Button -->
		<div class="button-group">
			<button
				type="submit"
				class="upload-button"
				disabled={uploadDisabled}
			>
				{#if uploading}
					⏳ Uploading...
				{:else}
					📤 Upload to Staging Table
				{/if}
			</button>
		</div>
	</form>

	<!-- Results -->
	{#if uploadResult}
		<div class="result {uploadResult.success ? 'success' : 'error'}">
			<h3>{uploadResult.success ? '✅ Success!' : '❌ Error'}</h3>
			<p>{uploadResult.message}</p>
			
			{#if uploadResult.success && uploadResult.stats}
				<div class="stats">
					<p><strong>Records Inserted:</strong> {uploadResult.stats.inserted}</p>
					<p><strong>Records Skipped:</strong> {uploadResult.stats.skipped}</p>
					<p><strong>Total Processed:</strong> {uploadResult.stats.total}</p>
					{#if uploadResult.stats.positions_needing_fixing > 0}
						<div class="next-steps">
							<p><strong>⚠️ {uploadResult.stats.positions_needing_fixing} records need position fixing</strong></p>
							<a href="/admin/confirm_yahoo_points_staging" class="next-step-link">
								→ Go to Position Fixer
							</a>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	{/if}

	<!-- Documentation -->
	<div class="documentation">
		<h3>📋 Required CSV Format</h3>
		<p>Your CSV file must have these columns:</p>
		<ul>
			<li><code>season</code> - Year (e.g., 2015) - will be mapped to season_id you specify</li>
			<li><code>week</code> - Week number (1-17)</li>
			<li><code>team_id</code> - Yahoo team ID</li>
			<li><code>team_name</code> - Yahoo team name</li>
			<li><code>player_id</code> - Yahoo player ID</li>
			<li><code>player_name</code> - Player name</li>
			<li><code>position</code> - Actual NFL position (QB, RB, WR, TE, K, DEF)</li>
			<li><code>selected_position</code> - Fantasy roster slot (QB, RB, WR, TE, K, DEF, W/R/T, BN, etc.)</li>
			<li><code>nfl_team</code> - NFL team abbreviation</li>
			<li><code>fantasy_points</code> - Points scored</li>
		</ul>

		<h3>📝 Process</h3>
		<ol>
			<li>Set the Season ID (1 for 2015, 2 for 2016, etc.)</li>
			<li>Select your <code>yahoo_complete_YYYY.csv</code> file</li>
			<li>Review the CSV preview</li>
			<li>Map Yahoo team IDs to your database team IDs</li>
			<li>Click "Upload to Staging Table"</li>
			<li>If positions need fixing, use the Position Fixer tool</li>
			<li>Run the ETL script to migrate to production tables</li>
		</ol>
	</div>
</div>

<style>
	.upload-container {
		max-width: 1200px;
		margin: 2rem auto;
		padding: 2rem;
		font-family: system-ui, -apple-system, sans-serif;
	}

	h1 {
		color: #1a1a1a;
		margin-bottom: 0.5rem;
	}

	.subtitle {
		color: #666;
		margin-bottom: 2rem;
	}

	.config-section {
		background: #f8f9fa;
		border: 2px solid #e9ecef;
		border-radius: 8px;
		padding: 1.5rem;
		margin-bottom: 2rem;
	}

	.config-section h3 {
		margin: 0 0 1rem 0;
		color: #495057;
		font-size: 1.1rem;
	}

	.season-input {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.season-input label {
		font-weight: 600;
		color: #495057;
	}

	.help-text {
		font-size: 0.875rem;
		color: #6c757d;
		font-weight: normal;
	}

	.season-input-field {
		width: 80px;
		padding: 0.5rem;
		border: 2px solid #dee2e6;
		border-radius: 4px;
		font-size: 1rem;
		font-weight: 600;
	}

	.season-input-field:focus {
		outline: none;
		border-color: #0066cc;
	}

	.upload-area {
		border: 2px dashed #ccc;
		border-radius: 8px;
		padding: 2rem;
		text-align: center;
		margin-bottom: 2rem;
		background: #fafafa;
		transition: all 0.3s ease;
	}

	.upload-area:hover {
		border-color: #0066cc;
		background: #f0f7ff;
	}

	#file-input {
		display: none;
	}

	.file-label {
		cursor: pointer;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.upload-icon {
		font-size: 3rem;
	}

	.upload-text {
		font-size: 1.1rem;
		color: #333;
	}

	.preview-section {
		margin-bottom: 2rem;
	}

	.preview-section h3 {
		margin-bottom: 1rem;
		color: #333;
	}

	.preview-table-container {
		overflow-x: auto;
		border: 1px solid #ddd;
		border-radius: 4px;
	}

	.preview-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
	}

	.preview-table th,
	.preview-table td {
		padding: 0.75rem;
		text-align: left;
		border-bottom: 1px solid #eee;
	}

	.preview-table th {
		background: #f8f9fa;
		font-weight: 600;
		color: #495057;
		white-space: nowrap;
	}

	.preview-table tbody tr:hover {
		background: #f8f9fa;
	}

	.team-mapping-section {
		background: #fff;
		border: 2px solid #dee2e6;
		border-radius: 8px;
		padding: 2rem;
		margin-bottom: 2rem;
	}

	.team-mapping-section h3 {
		margin: 0 0 0.5rem 0;
		color: #212529;
	}

	.mapping-instructions {
		color: #6c757d;
		margin-bottom: 1.5rem;
		font-size: 0.9rem;
	}

	.mapping-instructions code {
		background: #f8f9fa;
		padding: 0.2rem 0.4rem;
		border-radius: 3px;
		font-size: 0.85rem;
		color: #d63384;
	}

	.progress-bar {
		margin-bottom: 1.5rem;
	}

	.progress-label {
		font-weight: 600;
		margin-bottom: 0.5rem;
		color: #495057;
	}

	.progress-track {
		height: 24px;
		background: #e9ecef;
		border-radius: 12px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #0066cc, #0052a3);
		transition: width 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: flex-end;
		padding-right: 0.5rem;
		color: white;
		font-size: 0.85rem;
		font-weight: 600;
	}

	.team-mapping-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.team-card {
		background: #f8f9fa;
		border: 2px solid #dee2e6;
		border-radius: 6px;
		padding: 1rem;
		transition: all 0.2s ease;
	}

	.team-card:has(input.mapped) {
		border-color: #28a745;
		background: #f0fff4;
	}

	.team-info {
		margin-bottom: 0.75rem;
	}

	.yahoo-id {
		font-size: 0.85rem;
		color: #6c757d;
		font-weight: 600;
	}

	.team-name {
		font-size: 1.1rem;
		font-weight: 600;
		color: #212529;
	}

	.mapping-input {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.mapping-input label {
		font-size: 0.9rem;
		color: #495057;
		white-space: nowrap;
	}

	.mapping-input input[type="number"] {
		flex: 1;
		padding: 0.5rem;
		border: 2px solid #ced4da;
		border-radius: 4px;
		font-size: 1rem;
	}

	.mapping-input input[type="number"]:focus {
		outline: none;
		border-color: #0066cc;
	}

	.mapping-input input.mapped {
		border-color: #28a745;
		background: white;
	}

	.check-mark {
		color: #28a745;
		font-size: 1.2rem;
		font-weight: bold;
	}

	.warning-message {
		background: #fff3cd;
		border: 1px solid #ffc107;
		border-radius: 4px;
		padding: 1rem;
		color: #856404;
		text-align: center;
		font-weight: 600;
	}

	.debug-info {
		background: #f8f9fa;
		border: 1px solid #dee2e6;
		border-radius: 4px;
		padding: 0.75rem;
		margin-bottom: 1rem;
		font-family: monospace;
		font-size: 0.85rem;
		color: #495057;
	}

	.button-group {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.upload-button {
		padding: 1rem 2rem;
		font-size: 1.1rem;
		font-weight: 600;
		background: #0066cc;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.upload-button:hover:not(:disabled) {
		background: #0052a3;
		transform: translateY(-1px);
	}

	.upload-button:disabled {
		background: #ccc;
		cursor: not-allowed;
		opacity: 0.6;
	}

	.result {
		padding: 1.5rem;
		border-radius: 6px;
		margin-bottom: 2rem;
	}

	.result.success {
		background: #d4edda;
		border: 1px solid #c3e6cb;
		color: #155724;
	}

	.result.error {
		background: #f8d7da;
		border: 1px solid #f5c6cb;
		color: #721c24;
	}

	.result h3 {
		margin: 0 0 1rem 0;
	}

	.stats {
		margin-top: 1rem;
	}

	.stats p {
		margin: 0.5rem 0;
	}

	.next-steps {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #c3e6cb;
	}

	.next-step-link {
		display: inline-block;
		margin-top: 0.5rem;
		padding: 0.5rem 1rem;
		background: #28a745;
		color: white;
		text-decoration: none;
		border-radius: 4px;
		font-weight: 600;
	}

	.next-step-link:hover {
		background: #218838;
	}

	.documentation {
		background: #f8f9fa;
		border: 1px solid #dee2e6;
		border-radius: 6px;
		padding: 1.5rem;
	}

	.documentation h3 {
		margin-top: 0;
		color: #495057;
	}

	.documentation ul,
	.documentation ol {
		margin: 0.5rem 0;
		padding-left: 1.5rem;
	}

	.documentation li {
		margin: 0.5rem 0;
	}

	.documentation code {
		background: #e9ecef;
		padding: 0.2rem 0.4rem;
		border-radius: 3px;
		font-size: 0.9rem;
		color: #d63384;
	}
</style>