<script>
  import StatsLayout from '$lib/components/StatsLayout.svelte';
  import StatCard from '$lib/components/StatCard.svelte';
  import { enhance } from '$app/forms';

  export let data;
  export let form;

  const navItems = [
    { label: "Confirm Yahoo Points", href: "/admin/confirm_yahoo_points_staging", active: false },
    { label: "Upload Player Roster", href: "/admin/upload_player_roster", active: true }
  ];

  let selectedFile = null;
  let fileInfo = null;
  let uploadMode = 'insert'; // 'insert' or 'update'
  let previewData = null;
  let uploading = false;

  function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) {
      selectedFile = null;
      fileInfo = null;
      previewData = null;
      return;
    }

    if (!file.name.endsWith('.csv')) {
      alert('Please select a CSV file');
      event.target.value = '';
      return;
    }

    selectedFile = file;
    fileInfo = {
      name: file.name,
      size: (file.size / 1024).toFixed(2) + ' KB',
      lastModified: new Date(file.lastModified).toLocaleString()
    };

    // Preview first few rows
    previewFile(file);
  }

  function previewFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n').slice(0, 6); // Header + 5 rows
      const rows = lines.map(line => line.split(','));
      
      previewData = {
        headers: rows[0],
        rows: rows.slice(1, 6)
      };
    };
    reader.readAsText(file);
  }

  function clearFile() {
    selectedFile = null;
    fileInfo = null;
    previewData = null;
    const fileInput = document.getElementById('csvFile');
    if (fileInput) fileInput.value = '';
  }

  function handleSubmit() {
    return async ({ result, update }) => {
      if (result.type === 'success') {
        clearFile();
      }
      uploading = false;
      await update();
    };
  }
</script>

<StatsLayout title="Upload Player Roster" {navItems}>
  <div class="content-grid">
    
    <!-- Instructions Card -->
    <StatCard size="full">
      <div class="instructions">
        <h3>📤 Upload Player Roster & Stats</h3>
        <p>Upload CSV files containing player roster and stats data to insert or update records in the database.</p>
        
        <div class="format-section">
          <h4>Required CSV Format:</h4>
          <div class="format-example">
            <code>season,week,team_id,team_name,player_id,player_name,position,selected_position,nfl_team,status,fantasy_points,passing_yards,rushing_yards,...</code>
          </div>
          
          <h4>Required Columns (minimum):</h4>
          <ul>
            <li><strong>season</strong> - Season year (e.g., 2015, 2023)</li>
            <li><strong>week</strong> - Week number (1-17)</li>
            <li><strong>player_id</strong> - Yahoo player ID</li>
            <li><strong>player_name</strong> - Player's full name</li>
            <li><strong>position</strong> - Player position (QB, RB, WR, TE, K, DEF)</li>
            <li><strong>nfl_team</strong> - NFL team abbreviation</li>
            <li><strong>fantasy_points</strong> - Total fantasy points</li>
          </ul>

          <h4>Optional Stat Columns:</h4>
          <p>Include any of these for detailed stats: <code>passing_yards</code>, <code>passing_touchdowns</code>, <code>rushing_yards</code>, <code>rushing_touchdowns</code>, <code>receptions</code>, <code>receiving_yards</code>, <code>receiving_touchdowns</code>, etc.</p>
        </div>
      </div>
    </StatCard>

    <!-- Message Display -->
    {#if form?.success}
      <StatCard size="full">
        <div class="message-box success">
          ✓ {form.message}
          {#if form.details}
            <div class="details">
              <div>Records processed: {form.details.processed}</div>
              <div>Inserted: {form.details.inserted}</div>
              <div>Updated: {form.details.updated}</div>
              <div>Skipped: {form.details.skipped}</div>
            </div>
          {/if}
        </div>
      </StatCard>
    {/if}

    {#if form?.error}
      <StatCard size="full">
        <div class="message-box error">
          ✗ {form.message}
        </div>
      </StatCard>
    {/if}

    <!-- Upload Form -->
    <StatCard size="full">
      <form method="POST" action="?/uploadCSV" enctype="multipart/form-data" use:enhance={handleSubmit}>
        <div class="upload-container">
          
          <!-- Mode Selection -->
          <div class="mode-selection">
            <label>
              <input type="radio" name="mode" value="insert" bind:group={uploadMode} />
              <span class="mode-label">
                <strong>Insert New Records</strong>
                <small>Add new data, skip if exists</small>
              </span>
            </label>
            
            <label>
              <input type="radio" name="mode" value="update" bind:group={uploadMode} />
              <span class="mode-label">
                <strong>Update/Upsert</strong>
                <small>Insert new or update existing records</small>
              </span>
            </label>
          </div>

          <!-- File Input -->
          <div class="file-input-section">
            <label for="csvFile" class="file-label">
              Select CSV File
            </label>
            <input 
              type="file" 
              id="csvFile" 
              name="csvFile" 
              accept=".csv"
              on:change={handleFileSelect}
              required
            />
          </div>

          <!-- File Info -->
          {#if fileInfo}
            <div class="file-info">
              <div class="file-details">
                <strong>{fileInfo.name}</strong>
                <span>{fileInfo.size}</span>
                <span>Modified: {fileInfo.lastModified}</span>
              </div>
              <button type="button" class="clear-btn" on:click={clearFile}>✕ Clear</button>
            </div>
          {/if}

          <!-- Preview -->
          {#if previewData}
            <div class="preview-section">
              <h4>Preview (first 5 rows):</h4>
              <div class="preview-table-wrapper">
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

          <!-- Submit Button -->
          <button 
            type="submit" 
            class="upload-btn"
            disabled={!selectedFile || uploading}
          >
            {uploading ? '⏳ Uploading...' : '📤 Upload & Process'}
          </button>
        </div>
      </form>
    </StatCard>

    <!-- Summary Stats (if available) -->
    {#if data.stats}
      <StatCard size="sm">
        <div class="stat-summary">
          <div class="stat-label">Total Records</div>
          <div class="stat-value">{data.stats.totalRecords.toLocaleString()}</div>
        </div>
      </StatCard>

      <StatCard size="sm">
        <div class="stat-summary">
          <div class="stat-label">Seasons Covered</div>
          <div class="stat-value">{data.stats.seasons.join(', ')}</div>
        </div>
      </StatCard>

      <StatCard size="sm">
        <div class="stat-summary">
          <div class="stat-label">Last Upload</div>
          <div class="stat-value">{data.stats.lastUpload || 'Never'}</div>
        </div>
      </StatCard>
    {/if}

  </div>
</StatsLayout>

<style>
  .content-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    padding: 1.5rem;
  }

  .instructions {
    padding: 1rem;
  }

  .instructions h3 {
    color: #003366;
    margin-bottom: 1rem;
  }

  .instructions p {
    margin-bottom: 1rem;
    line-height: 1.6;
  }

  .format-section {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 6px;
    margin-top: 1rem;
  }

  .format-section h4 {
    color: #003366;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
  }

  .format-section h4:first-child {
    margin-top: 0;
  }

  .format-example {
    background: white;
    padding: 0.75rem;
    border-radius: 4px;
    border: 1px solid #dee2e6;
    overflow-x: auto;
    margin-bottom: 1rem;
  }

  .format-example code {
    font-family: 'Courier New', monospace;
    font-size: 0.85rem;
    color: #e83e8c;
    white-space: nowrap;
  }

  .format-section ul {
    margin-left: 1.5rem;
    margin-bottom: 1rem;
  }

  .format-section li {
    margin-bottom: 0.5rem;
  }

  .upload-container {
    padding: 1.5rem;
  }

  .mode-selection {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 6px;
  }

  .mode-selection label {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: white;
    border: 2px solid #dee2e6;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .mode-selection label:hover {
    border-color: #0066cc;
  }

  .mode-selection input[type="radio"] {
    width: 20px;
    height: 20px;
  }

  .mode-selection input[type="radio"]:checked + .mode-label {
    color: #0066cc;
  }

  .mode-label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .mode-label small {
    color: #6c757d;
    font-size: 0.85rem;
  }

  .file-input-section {
    margin-bottom: 1rem;
  }

  .file-label {
    display: block;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #003366;
  }

  input[type="file"] {
    width: 100%;
    padding: 0.75rem;
    border: 2px dashed #dee2e6;
    border-radius: 6px;
    cursor: pointer;
  }

  input[type="file"]:hover {
    border-color: #0066cc;
  }

  .file-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: #e7f3ff;
    border-radius: 6px;
    margin-bottom: 1rem;
  }

  .file-details {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .file-details span {
    font-size: 0.85rem;
    color: #6c757d;
  }

  .clear-btn {
    padding: 0.5rem 1rem;
    background: #dc3545;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
  }

  .clear-btn:hover {
    background: #c82333;
  }

  .preview-section {
    margin-bottom: 1.5rem;
  }

  .preview-section h4 {
    margin-bottom: 0.75rem;
    color: #003366;
  }

  .preview-table-wrapper {
    overflow-x: auto;
    border: 1px solid #dee2e6;
    border-radius: 6px;
  }

  .preview-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
  }

  .preview-table th {
    background: #003366;
    color: white;
    padding: 0.75rem;
    text-align: left;
    font-weight: 600;
    white-space: nowrap;
  }

  .preview-table td {
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid #dee2e6;
    white-space: nowrap;
  }

  .preview-table tbody tr:hover {
    background: #f8f9fa;
  }

  .upload-btn {
    width: 100%;
    padding: 1rem;
    background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s;
  }

  .upload-btn:hover:not(:disabled) {
    transform: translateY(-2px);
  }

  .upload-btn:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }

  .message-box {
    padding: 1rem;
    border-radius: 6px;
    margin-bottom: 1rem;
  }

  .message-box.success {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }

  .message-box.error {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }

  .details {
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid rgba(0,0,0,0.1);
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }

  .stat-summary {
    text-align: center;
    padding: 1rem;
  }

  .stat-label {
    font-size: 0.85rem;
    color: #6c757d;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .stat-value {
    font-size: 1.75rem;
    font-weight: 700;
    color: #003366;
  }
</style>