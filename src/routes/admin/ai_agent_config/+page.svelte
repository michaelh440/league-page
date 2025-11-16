<script>
    import { onMount } from 'svelte';
    
    // State variables
    let templates = [];
    let selectedTemplateId = null;
    let currentTemplate = {
        name: '',
        system_prompt: '',
        tone_preset: 'snarky',
        context_settings: {
            include_standings: true,
            include_streaks: true,
            include_head_to_head: true,
            include_bench_analysis: true,
            include_career_stats: true,
            include_previous_summaries: true
        },
        temperature: 0.7,
        max_tokens: 2000,
        length_preset: 'medium'
    };
    
    let isEditing = false;
    let isSaving = false;
    let message = { text: '', type: '' };
    
    // Tone presets with descriptions
    const tonePresets = [
        { value: 'snarky', label: 'Snarky', description: 'Witty, sarcastic, and entertaining' },
        { value: 'professional', label: 'Professional', description: 'Formal analysis with statistics' },
        { value: 'humorous', label: 'Humorous', description: 'Funny and lighthearted' },
        { value: 'dramatic', label: 'Dramatic', description: 'Epic storytelling style' },
        { value: 'analytical', label: 'Analytical', description: 'Data-driven deep dive' },
        { value: 'trash_talk', label: 'Trash Talk', description: 'Roasting bad performances' }
    ];
    
    // Length presets
    const lengthPresets = [
        { value: 'short', label: 'Short', tokens: 1000, description: '~250 words' },
        { value: 'medium', label: 'Medium', tokens: 2000, description: '~500 words' },
        { value: 'long', label: 'Long', tokens: 4000, description: '~1000 words' }
    ];
    
    // Default system prompts for each tone
    const defaultPrompts = {
        snarky: `You are a snarky fantasy football analyst who doesn't hold back. Your job is to create entertaining weekly recaps that highlight the highs, lows, and questionable decisions of fantasy managers.

Be witty and sarcastic, especially about:
- Bad lineup decisions (leaving studs on the bench)
- Close losses that could have been wins
- Blowout victories and embarrassing defeats
- Ongoing streaks and patterns

Keep it fun but not mean-spirited. Include specific player performances and statistics to back up your commentary.`,

        professional: `You are a professional fantasy football analyst providing detailed weekly analysis. Your recaps should be informative, data-driven, and insightful.

Focus on:
- Statistical analysis of performances
- Strategic lineup decisions and their outcomes
- League standings and playoff implications
- Historical context and trends

Maintain a formal tone while being engaging and thorough.`,

        humorous: `You are a comedic fantasy football commentator who makes even the worst losses entertaining. Your weekly recaps should be funny, creative, and full of personality.

Use humor to discuss:
- Surprising outcomes and upsets
- Ridiculous player performances
- Manager decision-making
- League storylines and rivalries

Keep jokes appropriate and don't cross the line into cruelty.`,

        dramatic: `You are an epic storyteller who transforms fantasy football matchups into legendary battles. Your recaps should be dramatic, engaging, and larger-than-life.

Frame each week as:
- An epic narrative with heroes and villains
- Dramatic rises and falls
- Clutch performances and devastating losses
- Championship-worthy moments

Use vivid language and build suspense throughout the recap.`,

        analytical: `You are a data-driven fantasy football analyst who digs deep into the numbers. Your recaps should provide comprehensive statistical analysis.

Include:
- Advanced metrics and efficiency stats
- Comparative analysis across matchups
- Trend identification and patterns
- Predictive insights for future weeks

Support all observations with specific data points.`,

        trash_talk: `You are the league's official trash talker who roasts bad performances and hypes up big wins. Your recaps should be bold, provocative, and entertaining.

Don't hold back on:
- Terrible lineup decisions
- Embarrassing losses
- Missed opportunities
- Rivalry matchups

Keep it entertaining and within the spirit of friendly competition.`
    };
    
    onMount(() => {
        loadTemplates();
    });
    
    // Load all templates from database
    async function loadTemplates() {
        try {
            const response = await fetch('/api/admin/ai_templates');
            if (!response.ok) throw new Error('Failed to load templates');
            
            templates = await response.json();
            console.log('📚 Loaded templates:', templates);
            
            // If no templates exist, create default ones
            if (templates.length === 0) {
                await createDefaultTemplates();
            }
        } catch (error) {
            console.error('❌ Error loading templates:', error);
            showMessage('Failed to load templates', 'error');
        }
    }
    
    // Create default templates for each tone
    async function createDefaultTemplates() {
        console.log('🎨 Creating default templates...');
        
        for (const preset of tonePresets) {
            const template = {
                name: `${preset.label} Default`,
                system_prompt: defaultPrompts[preset.value],
                tone_preset: preset.value,
                context_settings: {
                    include_standings: true,
                    include_streaks: true,
                    include_head_to_head: true,
                    include_bench_analysis: true,
                    include_career_stats: true,
                    include_previous_summaries: true
                },
                temperature: preset.value === 'analytical' ? 0.5 : preset.value === 'dramatic' ? 0.9 : 0.7,
                max_tokens: 2000,
                length_preset: 'medium',
                is_default: true
            };
            
            await saveTemplate(template, false);
        }
        
        await loadTemplates();
        showMessage('Created default templates', 'success');
    }
    
    // Load a template into the editor
    function loadTemplate(template) {
        currentTemplate = { ...template };
        selectedTemplateId = template.id;
        isEditing = true;
        console.log('📝 Loaded template for editing:', template.name);
    }
    
    // Create a new template
    function createNewTemplate() {
        currentTemplate = {
            name: 'New Template',
            system_prompt: defaultPrompts.snarky,
            tone_preset: 'snarky',
            context_settings: {
                include_standings: true,
                include_streaks: true,
                include_head_to_head: true,
                include_bench_analysis: true,
                include_career_stats: true,
                include_previous_summaries: true
            },
            temperature: 0.7,
            max_tokens: 2000,
            length_preset: 'medium'
        };
        selectedTemplateId = null;
        isEditing = true;
        console.log('✨ Creating new template');
    }
    
    // Update system prompt when tone preset changes
    function handleTonePresetChange() {
        if (confirm('Change to default prompt for this tone? (Your current prompt will be replaced)')) {
            currentTemplate.system_prompt = defaultPrompts[currentTemplate.tone_preset];
            console.log('🎭 Updated prompt for tone:', currentTemplate.tone_preset);
        }
    }
    
    // Update max tokens when length preset changes
    function handleLengthPresetChange() {
        const lengthConfig = lengthPresets.find(p => p.value === currentTemplate.length_preset);
        if (lengthConfig) {
            currentTemplate.max_tokens = lengthConfig.tokens;
            console.log('📏 Updated max tokens:', currentTemplate.max_tokens);
        }
    }
    
    // Save template to database
    async function saveTemplate(template = currentTemplate, showFeedback = true) {
        isSaving = true;
        
        try {
            const method = template.id ? 'PUT' : 'POST';
            const url = template.id ? `/api/admin/ai_templates/${template.id}` : '/api/admin/ai_templates';
            
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(template)
            });
            
            if (!response.ok) throw new Error('Failed to save template');
            
            const savedTemplate = await response.json();
            console.log('💾 Saved template:', savedTemplate);
            
            if (showFeedback) {
                showMessage('Template saved successfully!', 'success');
            }
            
            await loadTemplates();
            isEditing = false;
            
            return savedTemplate;
        } catch (error) {
            console.error('❌ Error saving template:', error);
            if (showFeedback) {
                showMessage('Failed to save template', 'error');
            }
            throw error;
        } finally {
            isSaving = false;
        }
    }
    
    // Delete template
    async function deleteTemplate(templateId) {
        if (!confirm('Are you sure you want to delete this template?')) return;
        
        try {
            const response = await fetch(`/api/admin/ai_templates/${templateId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) throw new Error('Failed to delete template');
            
            console.log('🗑️ Deleted template:', templateId);
            showMessage('Template deleted', 'success');
            
            if (selectedTemplateId === templateId) {
                isEditing = false;
                selectedTemplateId = null;
            }
            
            await loadTemplates();
        } catch (error) {
            console.error('❌ Error deleting template:', error);
            showMessage('Failed to delete template', 'error');
        }
    }
    
    // Duplicate template
    async function duplicateTemplate(template) {
        const duplicate = {
            ...template,
            name: `${template.name} (Copy)`,
            is_default: false
        };
        delete duplicate.id;
        
        try {
            await saveTemplate(duplicate);
            showMessage('Template duplicated!', 'success');
        } catch (error) {
            showMessage('Failed to duplicate template', 'error');
        }
    }
    
    // Cancel editing
    function cancelEdit() {
        isEditing = false;
        selectedTemplateId = null;
    }
    
    // Show message
    function showMessage(text, type) {
        message = { text, type };
        setTimeout(() => {
            message = { text: '', type: '' };
        }, 3000);
    }
</script>

<div class="container">
    <h1>🤖 AI Agent Configuration</h1>
    <p class="subtitle">Customize how AI generates your weekly fantasy football summaries</p>
    
    {#if message.text}
        <div class="message {message.type}">
            {message.text}
        </div>
    {/if}
    
    <div class="layout">
        <!-- Template List Sidebar -->
        <div class="sidebar">
            <div class="sidebar-header">
                <h2>Templates</h2>
                <button on:click={createNewTemplate} class="btn-new">
                    ➕ New
                </button>
            </div>
            
            <div class="template-list">
                {#each templates as template}
                    <div 
                        class="template-card {selectedTemplateId === template.id ? 'active' : ''}"
                        on:click={() => loadTemplate(template)}
                    >
                        <div class="template-info">
                            <div class="template-name">
                                {template.name}
                                {#if template.is_default}
                                    <span class="badge">Default</span>
                                {/if}
                            </div>
                            <div class="template-meta">
                                <span class="tone-badge {template.tone_preset}">
                                    {tonePresets.find(p => p.value === template.tone_preset)?.label || template.tone_preset}
                                </span>
                                <span class="length-badge">
                                    {template.length_preset}
                                </span>
                            </div>
                        </div>
                        
                        <div class="template-actions">
                            <button 
                                on:click|stopPropagation={() => duplicateTemplate(template)}
                                class="btn-icon"
                                title="Duplicate"
                            >
                                📋
                            </button>
                            {#if !template.is_default}
                                <button 
                                    on:click|stopPropagation={() => deleteTemplate(template.id)}
                                    class="btn-icon delete"
                                    title="Delete"
                                >
                                    🗑️
                                </button>
                            {/if}
                        </div>
                    </div>
                {/each}
                
                {#if templates.length === 0}
                    <div class="empty-state">
                        <p>No templates yet</p>
                        <button on:click={createDefaultTemplates} class="btn-secondary">
                            Create Default Templates
                        </button>
                    </div>
                {/if}
            </div>
        </div>
        
        <!-- Editor Panel -->
        <div class="editor">
            {#if isEditing}
                <div class="editor-header">
                    <input 
                        type="text" 
                        bind:value={currentTemplate.name}
                        placeholder="Template Name"
                        class="template-name-input"
                    />
                    <div class="editor-actions">
                        <button on:click={cancelEdit} class="btn-secondary">
                            Cancel
                        </button>
                        <button on:click={() => saveTemplate()} class="btn-primary" disabled={isSaving}>
                            {isSaving ? '💾 Saving...' : '💾 Save Template'}
                        </button>
                    </div>
                </div>
                
                <div class="editor-content">
                    <!-- Tone Preset -->
                    <div class="section">
                        <h3>🎭 Tone & Style</h3>
                        <div class="tone-grid">
                            {#each tonePresets as preset}
                                <label class="tone-option {currentTemplate.tone_preset === preset.value ? 'selected' : ''}">
                                    <input 
                                        type="radio" 
                                        bind:group={currentTemplate.tone_preset}
                                        value={preset.value}
                                        on:change={handleTonePresetChange}
                                    />
                                    <div class="tone-content">
                                        <div class="tone-label">{preset.label}</div>
                                        <div class="tone-description">{preset.description}</div>
                                    </div>
                                </label>
                            {/each}
                        </div>
                    </div>
                    
                    <!-- System Prompt -->
                    <div class="section">
                        <h3>📝 System Prompt</h3>
                        <p class="help-text">This defines the AI's personality and instructions for generating summaries.</p>
                        <textarea 
                            bind:value={currentTemplate.system_prompt}
                            rows="10"
                            placeholder="Enter the system prompt that will guide the AI..."
                        />
                    </div>
                    
                    <!-- Context Settings -->
                    <div class="section">
                        <h3>📊 Context Settings</h3>
                        <p class="help-text">Choose what data to include in the AI's context.</p>
                        <div class="checkbox-grid">
                            <label>
                                <input type="checkbox" bind:checked={currentTemplate.context_settings.include_standings} />
                                <span>League Standings</span>
                            </label>
                            <label>
                                <input type="checkbox" bind:checked={currentTemplate.context_settings.include_streaks} />
                                <span>Win/Loss Streaks</span>
                            </label>
                            <label>
                                <input type="checkbox" bind:checked={currentTemplate.context_settings.include_head_to_head} />
                                <span>Head-to-Head Records</span>
                            </label>
                            <label>
                                <input type="checkbox" bind:checked={currentTemplate.context_settings.include_bench_analysis} />
                                <span>Bench Analysis</span>
                            </label>
                            <label>
                                <input type="checkbox" bind:checked={currentTemplate.context_settings.include_career_stats} />
                                <span>Career Stats</span>
                            </label>
                            <label>
                                <input type="checkbox" bind:checked={currentTemplate.context_settings.include_previous_summaries} />
                                <span>Previous Week Summaries</span>
                            </label>
                        </div>
                    </div>
                    
                    <!-- Temperature & Creativity -->
                    <div class="section">
                        <h3>🌡️ Creativity Level</h3>
                        <p class="help-text">Higher values make the output more creative and unpredictable.</p>
                        <div class="slider-container">
                            <input 
                                type="range" 
                                bind:value={currentTemplate.temperature}
                                min="0"
                                max="1"
                                step="0.1"
                                class="slider"
                            />
                            <div class="slider-labels">
                                <span>Factual</span>
                                <span class="slider-value">{currentTemplate.temperature}</span>
                                <span>Creative</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Length Controls -->
                    <div class="section">
                        <h3>📏 Summary Length</h3>
                        <div class="length-options">
                            {#each lengthPresets as preset}
                                <label class="length-option {currentTemplate.length_preset === preset.value ? 'selected' : ''}">
                                    <input 
                                        type="radio" 
                                        bind:group={currentTemplate.length_preset}
                                        value={preset.value}
                                        on:change={handleLengthPresetChange}
                                    />
                                    <div>
                                        <div class="length-label">{preset.label}</div>
                                        <div class="length-description">{preset.description}</div>
                                    </div>
                                </label>
                            {/each}
                        </div>
                        <div class="tokens-display">
                            Max Tokens: <strong>{currentTemplate.max_tokens}</strong>
                        </div>
                    </div>
                </div>
            {:else}
                <div class="empty-editor">
                    <div class="empty-icon">🤖</div>
                    <h2>Select a template to edit</h2>
                    <p>Or create a new one to get started</p>
                    <button on:click={createNewTemplate} class="btn-primary">
                        ➕ Create New Template
                    </button>
                </div>
            {/if}
        </div>
    </div>
</div>

<style>
    .container {
        max-width: 1400px;
        margin: 0 auto;
        padding: 2rem;
    }
    
    h1 {
        margin: 0 0 0.5rem 0;
        color: #1a1a1a;
    }
    
    .subtitle {
        color: #666;
        margin: 0 0 2rem 0;
    }
    
    .message {
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 1rem;
        font-weight: 500;
    }
    
    .message.success {
        background: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
    }
    
    .message.error {
        background: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
    }
    
    .layout {
        display: grid;
        grid-template-columns: 300px 1fr;
        gap: 2rem;
        min-height: 600px;
    }
    
    /* Sidebar */
    .sidebar {
        background: #f8f9fa;
        border-radius: 12px;
        padding: 1.5rem;
        height: fit-content;
        position: sticky;
        top: 2rem;
    }
    
    .sidebar-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }
    
    .sidebar-header h2 {
        margin: 0;
        font-size: 1.25rem;
    }
    
    .btn-new {
        padding: 0.5rem 1rem;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 600;
    }
    
    .btn-new:hover {
        background: #0056b3;
    }
    
    .template-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }
    
    .template-card {
        background: white;
        border: 2px solid #e9ecef;
        border-radius: 8px;
        padding: 1rem;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .template-card:hover {
        border-color: #007bff;
        box-shadow: 0 2px 8px rgba(0,123,255,0.1);
    }
    
    .template-card.active {
        border-color: #007bff;
        background: #e7f3ff;
    }
    
    .template-info {
        margin-bottom: 0.5rem;
    }
    
    .template-name {
        font-weight: 600;
        margin-bottom: 0.5rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .badge {
        background: #ffc107;
        color: #000;
        padding: 0.125rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
    }
    
    .template-meta {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }
    
    .tone-badge, .length-badge {
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
    }
    
    .tone-badge {
        background: #e9ecef;
        color: #495057;
    }
    
    .tone-badge.snarky { background: #fff3cd; color: #856404; }
    .tone-badge.professional { background: #d1ecf1; color: #0c5460; }
    .tone-badge.humorous { background: #f8d7da; color: #721c24; }
    .tone-badge.dramatic { background: #d4edda; color: #155724; }
    .tone-badge.analytical { background: #e2e3e5; color: #383d41; }
    .tone-badge.trash_talk { background: #f5c6cb; color: #721c24; }
    
    .length-badge {
        background: #e9ecef;
        color: #495057;
    }
    
    .template-actions {
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
    }
    
    .btn-icon {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1.25rem;
        padding: 0.25rem;
        opacity: 0.7;
        transition: opacity 0.2s;
    }
    
    .btn-icon:hover {
        opacity: 1;
    }
    
    .btn-icon.delete:hover {
        filter: brightness(0.8);
    }
    
    .empty-state {
        text-align: center;
        padding: 2rem 1rem;
        color: #6c757d;
    }
    
    /* Editor */
    .editor {
        background: white;
        border: 2px solid #e9ecef;
        border-radius: 12px;
        overflow: hidden;
    }
    
    .editor-header {
        background: #f8f9fa;
        padding: 1.5rem;
        border-bottom: 2px solid #e9ecef;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
    }
    
    .template-name-input {
        flex: 1;
        padding: 0.75rem;
        border: 2px solid #e9ecef;
        border-radius: 6px;
        font-size: 1.125rem;
        font-weight: 600;
    }
    
    .template-name-input:focus {
        outline: none;
        border-color: #007bff;
    }
    
    .editor-actions {
        display: flex;
        gap: 0.75rem;
    }
    
    .btn-primary, .btn-secondary {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.2s;
    }
    
    .btn-primary {
        background: #007bff;
        color: white;
    }
    
    .btn-primary:hover:not(:disabled) {
        background: #0056b3;
    }
    
    .btn-primary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
    
    .btn-secondary {
        background: #6c757d;
        color: white;
    }
    
    .btn-secondary:hover {
        background: #545b62;
    }
    
    .editor-content {
        padding: 2rem;
        max-height: calc(100vh - 200px);
        overflow-y: auto;
    }
    
    .section {
        margin-bottom: 2.5rem;
    }
    
    .section h3 {
        margin: 0 0 0.5rem 0;
        color: #1a1a1a;
    }
    
    .help-text {
        color: #6c757d;
        font-size: 0.875rem;
        margin: 0 0 1rem 0;
    }
    
    textarea {
        width: 100%;
        padding: 1rem;
        border: 2px solid #e9ecef;
        border-radius: 6px;
        font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
        font-size: 0.875rem;
        resize: vertical;
    }
    
    textarea:focus {
        outline: none;
        border-color: #007bff;
    }
    
    /* Tone Grid */
    .tone-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
    }
    
    .tone-option {
        display: block;
        padding: 1rem;
        border: 2px solid #e9ecef;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .tone-option:hover {
        border-color: #007bff;
    }
    
    .tone-option.selected {
        border-color: #007bff;
        background: #e7f3ff;
    }
    
    .tone-option input[type="radio"] {
        display: none;
    }
    
    .tone-content {
        pointer-events: none;
    }
    
    .tone-label {
        font-weight: 600;
        margin-bottom: 0.25rem;
    }
    
    .tone-description {
        font-size: 0.875rem;
        color: #6c757d;
    }
    
    /* Checkbox Grid */
    .checkbox-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
    }
    
    .checkbox-grid label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
    }
    
    .checkbox-grid input[type="checkbox"] {
        width: 18px;
        height: 18px;
        cursor: pointer;
    }
    
    /* Slider */
    .slider-container {
        margin-top: 1rem;
    }
    
    .slider {
        width: 100%;
        height: 8px;
        border-radius: 4px;
        background: #e9ecef;
        outline: none;
        -webkit-appearance: none;
    }
    
    .slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #007bff;
        cursor: pointer;
    }
    
    .slider::-moz-range-thumb {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #007bff;
        cursor: pointer;
        border: none;
    }
    
    .slider-labels {
        display: flex;
        justify-content: space-between;
        margin-top: 0.5rem;
        font-size: 0.875rem;
        color: #6c757d;
    }
    
    .slider-value {
        font-weight: 600;
        color: #007bff;
    }
    
    /* Length Options */
    .length-options {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
        margin-bottom: 1rem;
    }
    
    .length-option {
        display: block;
        padding: 1rem;
        border: 2px solid #e9ecef;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        text-align: center;
    }
    
    .length-option:hover {
        border-color: #007bff;
    }
    
    .length-option.selected {
        border-color: #007bff;
        background: #e7f3ff;
    }
    
    .length-option input[type="radio"] {
        display: none;
    }
    
    .length-label {
        font-weight: 600;
        margin-bottom: 0.25rem;
    }
    
    .length-description {
        font-size: 0.875rem;
        color: #6c757d;
    }
    
    .tokens-display {
        text-align: center;
        color: #6c757d;
        font-size: 0.875rem;
    }
    
    /* Empty Editor */
    .empty-editor {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4rem 2rem;
        text-align: center;
        color: #6c757d;
    }
    
    .empty-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
    }
    
    .empty-editor h2 {
        margin: 0 0 0.5rem 0;
        color: #1a1a1a;
    }
    
    .empty-editor p {
        margin: 0 0 2rem 0;
    }
    
    /* Responsive */
    @media (max-width: 1024px) {
        .layout {
            grid-template-columns: 1fr;
        }
        
        .sidebar {
            position: static;
        }
    }
</style>