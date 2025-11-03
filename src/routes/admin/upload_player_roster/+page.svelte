<script>
	import { enhance } from '$app/forms';
	
	export let data;
	export let form;
	
	let uploading = false;
	let selectedFile = null;
	let previewData = null;
	let runningETL = false;
	let etlResult = null;
	
	// Playoff configuration - default week 15 for all seasons
	let playoffConfig = {
		'1': 15, '2': 15, '3': 15, '4': 15, '5': 15,
		'6': 15, '7': 15, '8': 15, '9': 15
	};
	
	function handleFileSelect(event) {
		const file = event.target.files[0];
		if (file) {
			selectedFile = file;
			previewCSV(file);
		}
	}
	
	async function previewCSV(file) {
		const text = await file.text();
		const lines = text.split('\n').slice(0, 6); // Header + 5 rows
		const rows = lines.map(line => line.split(',').map(cell => cell.trim().replace(/"/g, '')));
		previewData = {
			headers: rows[0],
			rows: rows.slice(1).filter(row => row.length > 1)
		};
	}
	
	function formatBytes(bytes) {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
	}
	
	async function runETL() {
		if (!confirm('Run ETL to migrate staging data to production tables?\n\nThis will:\n- Split data into regular season and playoff tables\n- Mark staging records as processed\n\nContinue?')) {
			return;
		}
		
		runningETL = true;
		etlResult = null;
		
		// Use form submission instead of fetch
		const form = document.createElement('form');
		form.method = 'POST';
		form.action = '?/runETL';
		
		const input = document.createElement('input');
		input.type = 'hidden';
		input.name = 'playoffConfig';
		input.value = JSON.stringify(playoffConfig);
		form.appendChild(input);
		
		document.body.appendChild(form);
		
		// Submit and handle with enhance
		const formData = new FormData(form);
		
		try {
			const response = await fetch('?/runETL', {
				method: 'POST',
				body: formData
			});
			
			const contentType = response.headers.get('content-type');
			
			if (contentType && contentType.includes('application/json')) {
				const result = await response.json();
				
				if (result.type === 'success' || response.ok) {
					etlResult = result.data || { success: true, message: 'ETL completed successfully!' };
				} else {
					etlResult = { success: false, error: result.data?.error || result.error || 'ETL failed' };
				}
			} else {
				// Not JSON, might be redirect or other response
				const text = await response.text();
				console.log('ETL Response:', text);
				
				if (response.ok) {
					etlResult = { success: true, message: 'ETL completed! Refresh the page to see updated data.' };
					
					// Refresh page data after 2 seconds
					setTimeout(() => {
						window.location.reload();
					}, 2000);
				} else {
					etlResult = { success: false, error: 'ETL failed. Check server logs for details.' };
				}
			}
		} catch (error) {
			console.error('ETL error:', error);
			etlResult = { success: false, error: error.message };
		} finally {
			runningETL = false;
			document.body.removeChild(form);
		}
	}
</script>

<div class="container">
	<div class="header">
		<h1>📤 Upload Player Stats CSV</h1>
		<p class="subtitle">Import fantasy stats to staging table for review and processing</p>
	</div>

	{#if form?.success}
		<div class="alert alert-success">
			<div class="alert-icon">✅</div>
			<div class="alert-content">
				<div class="alert-title">Upload Successful!</div>
				<div class="alert-message">{form.message}</div>
				{#if form.stats}
					<div class="stats-summary">
						<span class="stat-item">✅ Inserted: <strong>{form.stats.inserted}</strong></span>
						<span class="stat-item">⏭️ Skipped: <strong>{form.stats.skipped}</strong></span>
						{#if form.stats.errors && form.stats.errors.length > 0}
							<span class="stat-item">❌ Errors: <strong>{form.stats.errors.length}</strong></span>
						{/if}
					</div>
					{#if form.stats.summary}
						<div class="next-steps">
							<strong>Next Step:</strong> 
							{#if form.stats.summary.missing_position > 0}
								Go to <a href="/admin/confirm_yahoo_points_staging">/admin/confirm_yahoo_points_staging</a> to fix {form.stats.summary.missing_position} missing positions
							{:else}
								All positions are set! Run the ETL script to migrate to production tables.
							{/if}
						</div>
					{/if}
				{/if}
			</div>
		</div>
	{/if}

	{#if form?.error}
		<div class="alert alert-error">
			<div class="alert-icon">❌</div>
			<div class="alert-content">
				<div class="alert-title">Upload Failed</div>
				<div class="alert-message">{form.error}</div>
			</div>
		</div>
	{/if}

	<div class="card">
		<div class="card-header">
			<h2>Upload CSV File</h2>
			<p>Upload your Yahoo fantasy stats CSV file (yahoo_complete_YYYY.csv)</p>
		</div>

		<form 
			method="POST" 
			action="?/upload" 
			enctype="multipart/form-data"
			use:enhance={() => {
				uploading = true;
				return async ({ result, update }) => {
					uploading = false;
					await update();
					if (result.type === 'success') {
						selectedFile = null;
						previewData = null;
						const fileInput = document.getElementById('csvFile');
						if (fileInput) fileInput.value = '';
					}
				};
			}}
		>
			<div class="form-section">
				<div class="file-upload-area">
					<input
						type="file"
						id="csvFile"
						name="csvFile"
						accept=".csv"
						required
						on:change={handleFileSelect}
						disabled={uploading}
					/>
					<label for="csvFile" class="file-upload-label">
						<div class="upload-icon">📁</div>
						<div class="upload-text">
							{#if selectedFile}
								<strong>{selectedFile.name}</strong>
								<span class="file-size">{formatBytes(selectedFile.size)}</span>
							{:else}
								<strong>Choose CSV file</strong>
								<span>or drag and drop</span>
							{/if}
						</div>
					</label>
				</div>

				{#if previewData}
					<!-- Season Configuration -->
					<div class="config-section">
						<h3>⚙️ Season Configuration</h3>
						<div class="config-input">
							<label for="seasonId">Season ID (for your database):</label>
							<input
								type="number"
								id="seasonId"
								name="seasonId"
								placeholder="e.g., 1"
								min="1"
								value="1"
								disabled={uploading}
							/>
							<small>Enter the season_id from your PostgreSQL seasons table (e.g., 1 for 2015, 2 for 2016, etc.)</small>
						</div>
					</div>
				{/if}

				{#if previewData}
					<div class="preview-section">
						<h3>📋 Preview (First 5 Rows)</h3>
						<div class="table-container">
							<table class="preview-table">
								<thead>
									<tr>
										{#each previewData.headers as header}
											<th>{header}</th>
										{/each}
									</tr>
								</thead>
								<tbody>
									{#each previewData.rows as row}
										<tr>
											{#each row as cell}
												<td>{cell}</td>
											{/each}
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				{/if}

				<div class="button-group">
					<button 
						type="submit" 
						class="btn btn-primary"
						disabled={!selectedFile || uploading}
					>
						{#if uploading}
							<span class="spinner"></span>
							Uploading...
						{:else}
							📤 Upload to Staging
						{/if}
					</button>
					
					{#if selectedFile}
						<button 
							type="button" 
							class="btn btn-secondary"
							on:click={() => {
								selectedFile = null;
								previewData = null;
								const fileInput = document.getElementById('csvFile');
								if (fileInput) fileInput.value = '';
							}}
							disabled={uploading}
						>
							Clear
						</button>
					{/if}
				</div>
			</div>
		</form>
	</div>

	{#if data.hasUnprocessedData}
		<!-- ETL Section -->
		<div class="card etl-card">
			<div class="card-header">
				<h2>⚙️ Run ETL - Migrate to Production</h2>
				<p>You have unprocessed staging data ready to migrate</p>
			</div>

			<div class="form-section">
				<!-- Staging Summary -->
				<div class="staging-summary">
					<h3>📊 Staging Data Summary</h3>
					<div class="summary-grid">
						{#each data.stagingSummary as season}
							<div class="summary-card">
								<div class="summary-header">Season {season.season_id}</div>
								<div class="summary-stat">
									<span class="stat-label">Records:</span>
									<span class="stat-value">{season.record_count}</span>
								</div>
								<div class="summary-stat">
									<span class="stat-label">Weeks:</span>
									<span class="stat-value">{season.min_week}-{season.max_week}</span>
								</div>
								{#if season.missing_position > 0}
									<div class="summary-warning">
										⚠️ {season.missing_position} missing positions
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>

				<!-- Playoff Configuration -->
				<div class="playoff-config">
					<h3>🏈 Playoff Configuration</h3>
					<p class="config-description">
						Set the week number when playoffs start for each season. 
						Weeks before this will go to <code>player_fantasy_stats</code>, 
						weeks at or after will go to <code>playoff_fantasy_stats</code>.
					</p>
					
					<div class="config-grid">
						{#each Object.keys(playoffConfig) as seasonId}
							<div class="config-row">
								<label for="playoff-{seasonId}">Season {seasonId}:</label>
								<input
									type="number"
									id="playoff-{seasonId}"
									bind:value={playoffConfig[seasonId]}
									min="1"
									max="18"
									class="playoff-week-input"
									disabled={runningETL}
								/>
								<span class="config-hint">Playoffs start week {playoffConfig[seasonId]}</span>
							</div>
						{/each}
					</div>
				</div>

				<!-- ETL Result -->
				{#if etlResult}
					<div class="alert {etlResult.success ? 'alert-success' : 'alert-error'}">
						<div class="alert-icon">{etlResult.success ? '✅' : '❌'}</div>
						<div class="alert-content">
							<div class="alert-title">{etlResult.success ? 'ETL Complete!' : 'ETL Failed'}</div>
							<div class="alert-message">{etlResult.message || etlResult.error}</div>
							{#if etlResult.success && etlResult.stats}
								<div class="stats-summary">
									<span class="stat-item">📈 Regular Season: <strong>{etlResult.stats.regularInserted}</strong></span>
									<span class="stat-item">🏆 Playoffs: <strong>{etlResult.stats.playoffInserted}</strong></span>
									<span class="stat-item">⏭️ Skipped: <strong>{etlResult.stats.skipped}</strong></span>
									<span class="stat-item">✅ Total: <strong>{etlResult.stats.total}</strong></span>
								</div>
							{/if}
						</div>
					</div>
				{/if}

				<!-- Run ETL Button -->
				<div class="button-group">
					<button
						type="button"
						class="btn btn-primary btn-etl"
						on:click={runETL}
						disabled={runningETL}
					>
						{#if runningETL}
							<span class="spinner"></span>
							Running ETL...
						{:else}
							⚡ Run ETL Migration
						{/if}
					</button>
				</div>

				<div class="etl-info">
					<strong>⚠️ Important:</strong> Make sure all positions are fixed before running ETL. 
					Records with missing positions will be skipped. 
					<a href="/admin/confirm_yahoo_points_staging">→ Fix positions</a>
				</div>
			</div>
		</div>
	{/if}

	<div class="info-card">
		<h3>ℹ️ Upload Process</h3>
		<ol class="process-list">
			<li>
				<strong>Upload CSV</strong> - Select your yahoo_complete_YYYY.csv file
				<div class="sub-text">Data is imported to <code>staging_yahoo_player_stats</code></div>
			</li>
			<li>
				<strong>Fix Positions</strong> - Review and fix any missing positions
				<div class="sub-text">Navigate to <a href="/admin/confirm_yahoo_points_staging">/admin/confirm_yahoo_points_staging</a></div>
			</li>
			<li>
				<strong>Run ETL</strong> - Execute the ETL script to migrate to production
				<div class="sub-text">Run <code>etl_configurable_playoff_split.sql</code></div>
			</li>
		</ol>
	</div>

	<div class="info-card">
		<h3>📝 Expected CSV Format</h3>
		<div class="code-block">
			<code>season,week,team_id,team_name,player_id,player_name,position,selected_position,nfl_team,status,fantasy_points</code>
		</div>
		<ul class="format-notes">
			<li><strong>season</strong> - Season year (e.g., 2015) - will be mapped to season_id you specify</li>
			<li><strong>week</strong> - Week number (1-17)</li>
			<li><strong>player_id</strong> - Yahoo player ID</li>
			<li><strong>player_name</strong> - Player's name</li>
			<li><strong>position</strong> - NFL position (QB, RB, WR, TE, K, DEF)</li>
			<li><strong>fantasy_points</strong> - Points scored that week</li>
			<li>Note: team_id and team_name columns are ignored for staging (stats only)</li>
		</ul>
	</div>
</div>

<style>
	/* All previous styles remain the same */
	.container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
	
	/* ETL Section Styles */
	.etl-card {
		border: 2px solid #4299e1;
		background: linear-gradient(135deg, #ebf8ff 0%, #ffffff 100%);
	}

	.staging-summary {
		margin-bottom: 2rem;
	}

	.staging-summary h3 {
		font-size: 1.1rem;
		font-weight: 600;
		color: #1a202c;
		margin: 0 0 1rem 0;
	}

	.summary-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1rem;
	}

	.summary-card {
		background: white;
		border: 2px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 1rem;
	}

	.summary-header {
		font-size: 1.1rem;
		font-weight: 700;
		color: #2d3748;
		margin-bottom: 0.75rem;
		padding-bottom: 0.5rem;
		border-bottom: 2px solid #e2e8f0;
	}

	.summary-stat {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.25rem 0;
		font-size: 0.9rem;
	}

	.stat-label {
		color: #718096;
	}

	.stat-value {
		font-weight: 600;
		color: #1a202c;
	}

	.summary-warning {
		margin-top: 0.5rem;
		padding: 0.5rem;
		background: #fef5e7;
		border: 1px solid #f39c12;
		border-radius: 0.25rem;
		color: #d68910;
		font-size: 0.85rem;
		font-weight: 600;
	}

	.playoff-config {
		background: #f7fafc;
		border: 2px solid #e2e8f0;
		border-radius: 0.75rem;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.playoff-config h3 {
		font-size: 1.1rem;
		font-weight: 600;
		color: #1a202c;
		margin: 0 0 0.5rem 0;
	}

	.config-description {
		color: #4a5568;
		font-size: 0.9rem;
		margin-bottom: 1.5rem;
		line-height: 1.6;
	}

	.config-description code {
		background: white;
		padding: 0.2rem 0.4rem;
		border-radius: 0.25rem;
		font-size: 0.85rem;
		color: #d63384;
		border: 1px solid #e2e8f0;
	}

	.config-grid {
		display: grid;
		gap: 0.75rem;
	}

	.config-row {
		display: grid;
		grid-template-columns: 120px 100px 1fr;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem;
		background: white;
		border-radius: 0.5rem;
		border: 1px solid #e2e8f0;
	}

	.config-row label {
		font-weight: 600;
		color: #2d3748;
		font-size: 0.95rem;
	}

	.playoff-week-input {
		padding: 0.5rem;
		border: 2px solid #e2e8f0;
		border-radius: 0.375rem;
		font-size: 1rem;
		font-weight: 600;
		text-align: center;
		transition: all 0.2s;
	}

	.playoff-week-input:focus {
		outline: none;
		border-color: #3182ce;
		box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
	}

	.config-hint {
		font-size: 0.85rem;
		color: #718096;
	}

	.btn-etl {
		font-size: 1.1rem;
		padding: 1rem 2rem;
		background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
	}

	.btn-etl:hover:not(:disabled) {
		background: linear-gradient(135deg, #38a169 0%, #2f855a 100%);
	}

	.etl-info {
		margin-top: 1rem;
		padding: 1rem;
		background: #fff3cd;
		border: 1px solid #ffc107;
		border-radius: 0.5rem;
		color: #856404;
		font-size: 0.9rem;
		line-height: 1.6;
	}

	.etl-info a {
		color: #3182ce;
		text-decoration: none;
		font-weight: 600;
	}

	.etl-info a:hover {
		text-decoration: underline;
	}
	
	.config-section {
		background: #fff3cd;
		border: 2px solid #ffc107;
		border-radius: 0.75rem;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.config-section h3 {
		font-size: 1.1rem;
		font-weight: 600;
		color: #1a202c;
		margin: 0 0 1rem 0;
	}

	.config-input {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.config-input label {
		font-weight: 600;
		color: #2d3748;
		font-size: 0.95rem;
	}

	.config-input input {
		width: 200px;
		padding: 0.75rem;
		border: 2px solid #e2e8f0;
		border-radius: 0.5rem;
		font-size: 1rem;
		transition: all 0.2s;
	}

	.config-input input:focus {
		outline: none;
		border-color: #3182ce;
		box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
	}

	.config-input small {
		color: #718096;
		font-size: 0.85rem;
		line-height: 1.4;
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	.header {
		margin-bottom: 2rem;
	}

	.header h1 {
		font-size: 2rem;
		font-weight: 700;
		color: #1a202c;
		margin: 0 0 0.5rem 0;
	}

	.subtitle {
		color: #718096;
		font-size: 1rem;
		margin: 0;
	}

	.alert {
		padding: 1rem 1.5rem;
		border-radius: 0.5rem;
		margin-bottom: 1.5rem;
		display: flex;
		gap: 1rem;
		align-items: flex-start;
	}

	.alert-success {
		background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
		border: 1px solid #b1dfbb;
	}

	.alert-error {
		background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
		border: 1px solid #f1b0b7;
	}

	.alert-icon {
		font-size: 1.5rem;
		flex-shrink: 0;
	}

	.alert-content {
		flex: 1;
	}

	.alert-title {
		font-weight: 700;
		font-size: 1.1rem;
		margin-bottom: 0.25rem;
		color: #1a202c;
	}

	.alert-message {
		color: #2d3748;
		margin-bottom: 0.5rem;
	}

	.stats-summary {
		display: flex;
		gap: 1.5rem;
		margin-top: 0.75rem;
		flex-wrap: wrap;
	}

	.stat-item {
		font-size: 0.95rem;
		color: #4a5568;
	}

	.stat-item strong {
		color: #1a202c;
		font-weight: 600;
	}

	.next-steps {
		margin-top: 1rem;
		padding: 0.75rem;
		background: rgba(255, 255, 255, 0.7);
		border-radius: 0.375rem;
		font-size: 0.95rem;
	}

	.next-steps a {
		color: #3182ce;
		text-decoration: none;
		font-weight: 600;
	}

	.next-steps a:hover {
		text-decoration: underline;
	}

	.card {
		background: white;
		border-radius: 0.75rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		margin-bottom: 1.5rem;
		overflow: hidden;
	}

	.card-header {
		padding: 1.5rem;
		border-bottom: 1px solid #e2e8f0;
	}

	.card-header h2 {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1a202c;
		margin: 0 0 0.5rem 0;
	}

	.card-header p {
		color: #718096;
		margin: 0;
		font-size: 0.95rem;
	}

	.form-section {
		padding: 1.5rem;
	}

	.file-upload-area {
		position: relative;
		margin-bottom: 1.5rem;
	}

	.file-upload-area input[type="file"] {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.file-upload-label {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		padding: 2rem;
		border: 2px dashed #cbd5e0;
		border-radius: 0.5rem;
		background: #f7fafc;
		cursor: pointer;
		transition: all 0.2s;
	}

	.file-upload-label:hover {
		border-color: #3182ce;
		background: #ebf8ff;
	}

	.file-upload-area input[type="file"]:disabled + .file-upload-label {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.upload-icon {
		font-size: 3rem;
	}

	.upload-text {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.upload-text strong {
		font-size: 1.1rem;
		color: #1a202c;
	}

	.upload-text span {
		font-size: 0.9rem;
		color: #718096;
	}

	.file-size {
		font-size: 0.85rem;
		color: #a0aec0;
	}

	.preview-section {
		margin-bottom: 1.5rem;
	}

	.preview-section h3 {
		font-size: 1.1rem;
		font-weight: 600;
		color: #1a202c;
		margin: 0 0 1rem 0;
	}

	.table-container {
		overflow-x: auto;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
	}

	.preview-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.85rem;
	}

	.preview-table thead {
		background: #f7fafc;
	}

	.preview-table th {
		padding: 0.75rem;
		text-align: left;
		font-weight: 600;
		color: #2d3748;
		border-bottom: 2px solid #e2e8f0;
		white-space: nowrap;
	}

	.preview-table td {
		padding: 0.75rem;
		border-bottom: 1px solid #e2e8f0;
		color: #4a5568;
	}

	.preview-table tbody tr:last-child td {
		border-bottom: none;
	}

	.preview-table tbody tr:hover {
		background: #f7fafc;
	}

	.button-group {
		display: flex;
		gap: 1rem;
		justify-content: flex-start;
	}

	.btn {
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		font-weight: 600;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s;
		border: none;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}

	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-primary {
		background: linear-gradient(135deg, #3182ce 0%, #2c5282 100%);
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background: linear-gradient(135deg, #2c5282 0%, #2a4365 100%);
		transform: translateY(-1px);
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.btn-secondary {
		background: #e2e8f0;
		color: #2d3748;
	}

	.btn-secondary:hover:not(:disabled) {
		background: #cbd5e0;
	}

	.spinner {
		width: 1rem;
		height: 1rem;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.info-card {
		background: white;
		border-radius: 0.75rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.info-card h3 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1a202c;
		margin: 0 0 1rem 0;
	}

	.process-list {
		list-style: none;
		padding: 0;
		margin: 0;
		counter-reset: step-counter;
	}

	.process-list li {
		counter-increment: step-counter;
		position: relative;
		padding-left: 3rem;
		margin-bottom: 1.5rem;
	}

	.process-list li:before {
		content: counter(step-counter);
		position: absolute;
		left: 0;
		top: 0;
		width: 2rem;
		height: 2rem;
		background: linear-gradient(135deg, #3182ce 0%, #2c5282 100%);
		color: white;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 0.9rem;
	}

	.process-list li:last-child {
		margin-bottom: 0;
	}

	.sub-text {
		margin-top: 0.5rem;
		font-size: 0.9rem;
		color: #718096;
	}

	.sub-text code, .code-block code {
		background: #f7fafc;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-family: 'Courier New', monospace;
		font-size: 0.85rem;
		color: #2d3748;
	}

	.code-block {
		background: #f7fafc;
		padding: 1rem;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
		overflow-x: auto;
	}

	.format-notes {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.format-notes li {
		padding: 0.5rem 0;
		border-bottom: 1px solid #e2e8f0;
		font-size: 0.9rem;
		color: #4a5568;
	}

	.format-notes li:last-child {
		border-bottom: none;
	}

	.format-notes strong {
		color: #1a202c;
		font-weight: 600;
	}

	@media (max-width: 768px) {
		.container {
			padding: 1rem;
		}

		.header h1 {
			font-size: 1.5rem;
		}

		.file-upload-label {
			flex-direction: column;
			text-align: center;
		}

		.button-group {
			flex-direction: column;
		}

		.btn {
			width: 100%;
			justify-content: center;
		}

		.stats-summary {
			flex-direction: column;
			gap: 0.5rem;
		}
	}
</style>