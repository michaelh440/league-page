<script>
	export let data;
	const { diagnostics } = data;
</script>

<svelte:head>
	<title>Database Diagnostics</title>
</svelte:head>

<div class="diagnostics-page">
	<h1>🔍 Database Diagnostics</h1>
	
	<div class="section">
		<h2>1. Database Connection</h2>
		{#if diagnostics.connection}
			<div class="success">
				✅ Connected successfully
				<pre>{JSON.stringify(diagnostics.connection, null, 2)}</pre>
			</div>
		{:else}
			<div class="error">❌ Connection failed</div>
		{/if}
	</div>
	
	<div class="section">
		<h2>2. Table: weekly_summary_videos</h2>
		{#if diagnostics.tables.weekly_summary_videos}
			<div class="success">
				✅ Table exists with {diagnostics.tables.weekly_summary_videos.length} columns
				<table>
					<thead>
						<tr>
							<th>Column Name</th>
							<th>Data Type</th>
							<th>Nullable</th>
						</tr>
					</thead>
					<tbody>
						{#each diagnostics.tables.weekly_summary_videos as col}
							<tr>
								<td>{col.column_name}</td>
								<td>{col.data_type}</td>
								<td>{col.is_nullable}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<div class="error">❌ Table not found or error checking</div>
		{/if}
	</div>
	
	<div class="section">
		<h2>3. Videos in Database</h2>
		{#if diagnostics.videos}
			<div class="success">
				✅ Found {diagnostics.videos.count} video(s)
				<h3>Raw Video Data:</h3>
				<pre>{JSON.stringify(diagnostics.videos.raw_data, null, 2)}</pre>
			</div>
		{:else}
			<div class="error">❌ Error querying videos</div>
		{/if}
	</div>
	
	<div class="section">
		<h2>4. Table: seasons</h2>
		{#if diagnostics.tables.seasons}
			<div class="success">
				✅ Table exists with {diagnostics.tables.seasons.length} columns
				<table>
					<thead>
						<tr>
							<th>Column Name</th>
							<th>Data Type</th>
							<th>Nullable</th>
						</tr>
					</thead>
					<tbody>
						{#each diagnostics.tables.seasons as col}
							<tr>
								<td>{col.column_name}</td>
								<td>{col.data_type}</td>
								<td>{col.is_nullable}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<div class="error">❌ Table not found or error checking</div>
		{/if}
	</div>
	
	<div class="section">
		<h2>5. Seasons in Database</h2>
		{#if diagnostics.seasons}
			<div class="success">
				✅ Found {diagnostics.seasons.count} season(s)
				<h3>Seasons Data:</h3>
				<pre>{JSON.stringify(diagnostics.seasons.data, null, 2)}</pre>
			</div>
		{:else}
			<div class="error">❌ Error querying seasons</div>
		{/if}
	</div>
	
	<div class="section">
		<h2>6. JOIN Query Test</h2>
		{#if diagnostics.joinTest}
			<div class="success">
				✅ JOIN successful - found {diagnostics.joinTest.length} result(s)
				<pre>{JSON.stringify(diagnostics.joinTest, null, 2)}</pre>
			</div>
		{:else}
			<div class="error">❌ JOIN query failed</div>
		{/if}
	</div>
	
	{#if diagnostics.errors && diagnostics.errors.length > 0}
		<div class="section">
			<h2>❌ Errors Encountered</h2>
			{#each diagnostics.errors as err}
				<div class="error">
					<strong>{err.test}:</strong> {err.error}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.diagnostics-page {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
	}
	
	h1 {
		color: #00316b;
		border-bottom: 3px solid #00316b;
		padding-bottom: 1rem;
	}
	
	.section {
		margin: 2rem 0;
		padding: 1.5rem;
		background: white;
		border: 1px solid #ddd;
		border-radius: 8px;
	}
	
	h2 {
		color: #333;
		margin-top: 0;
	}
	
	h3 {
		color: #666;
		font-size: 1rem;
		margin-top: 1rem;
	}
	
	.success {
		padding: 1rem;
		background: #e7f5e7;
		border: 2px solid #4caf50;
		border-radius: 6px;
		color: #2e7d32;
	}
	
	.error {
		padding: 1rem;
		background: #ffebee;
		border: 2px solid #f44336;
		border-radius: 6px;
		color: #c62828;
		margin: 0.5rem 0;
	}
	
	pre {
		background: #f5f5f5;
		padding: 1rem;
		border-radius: 4px;
		overflow-x: auto;
		font-size: 0.875rem;
		margin: 0.5rem 0;
		border: 1px solid #ddd;
	}
	
	table {
		width: 100%;
		border-collapse: collapse;
		margin-top: 1rem;
	}
	
	th, td {
		text-align: left;
		padding: 0.75rem;
		border-bottom: 1px solid #ddd;
	}
	
	th {
		background: #f5f5f5;
		font-weight: 600;
		color: #333;
	}
	
	tbody tr:hover {
		background: #f9f9f9;
	}
</style>