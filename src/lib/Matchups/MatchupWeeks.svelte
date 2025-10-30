<script>
	import { Icon } from '@smui/tab';
    import Matchup from './Matchup.svelte'
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    export let queryWeek, players, matchupWeeks, year, week, regularSeasonLength, selection, leagueTeamManagers, weeklySummary = null;

    let displayWeek = queryWeek * 1 || 1;

    onMount(() => {
        if(!queryWeek || queryWeek < 1) {
            queryWeek = week;
            displayWeek = queryWeek * 1;
            goto(`/current_season/matchups?week=${queryWeek}`, {noscroll: true});
            if(queryWeek > regularSeasonLength) {
                selection = 'champions';
                return;
            }
            processDisplayMatchup(queryWeek)
            return;
        }
        if(queryWeek > regularSeasonLength) {
            selection = 'champions';
            return;
        }
        processDisplayMatchup(displayWeek)
    })

    let matchupArray = [];

    // rand is used as a hacky way to make sure that the each block re-renders when the matchupArray changes
    // the new arrays are too similar to the old ones for Svelte to pick up the difference
    let rand;

    const processDisplayMatchup = (newWeek) => {
        const matchup = matchupWeeks[newWeek-1];
        const allMatchups = matchup.matchups;
        matchupArray = [];
        for (const key in allMatchups) {
            matchupArray.push(allMatchups[key]);
        }
        rand = Math.random();
    }

    let active;
    
    const changeWeek = (newWeek) => {
        displayWeek = newWeek;
        processDisplayMatchup(displayWeek);
        active = null;
        goto(`/current_season/matchups?week=${displayWeek}`, {noscroll: true});
    }

    // NEW: Collapsible summary state
    let summaryExpanded = true;
</script>

<style>
    .matchups {
        margin: 2em 0 6em;
    }
    .weekContainer {
        display: flex;
        width: 95%;
        max-width: 600px;
        margin: 0 auto;
        align-items: center;
    }

    :global(.changeWeek) {
        font-size: 3em;
        cursor: pointer;
        color: #888;
    }

    :global(.changeWeek:hover) {
        color: #00316b;
    }

    .spacer {
        width: 48px;
    }

    .weekText {
        flex-grow: 1;
        text-align: center;
        font-size: 2em;
    }

    @media (max-width: 800px) {
        .weekText {
            font-size: 1.6em;
        }
    }

    @media (max-width: 400px) {
        .weekText {
            font-size: 1.3em;
        }
    }

    @media (max-width: 350px) {
        .weekText {
            font-size: 1.2em;
        }
    }

    /* NEW: Weekly Summary Styles */
    .weekly-summary-card {
        background: var(--bracketMatch, white);
        border: 2px solid var(--ccc, #e5e7eb);
        border-radius: 10px;
        padding: 1.5rem;
        margin: 2rem auto;
        max-width: 800px;
        width: 90%;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .summary-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1rem;
        padding-bottom: 0.75rem;
        border-bottom: 2px solid var(--ccc, #e5e7eb);
        cursor: pointer;
        user-select: none;
    }

    .summary-header:hover {
        opacity: 0.8;
    }
    
    .summary-header h3 {
        margin: 0;
        font-size: 1.5rem;
        color: var(--g444, #1f2937);
        flex-grow: 1;
    }

    .toggle-icon {
        font-size: 1.2rem;
        color: var(--g999, #6b7280);
        transition: transform 0.2s;
    }

    .toggle-icon.expanded {
        transform: rotate(180deg);
    }
    
    .summary-content {
        color: var(--g333, #374151);
        line-height: 1.7;
        white-space: pre-wrap;
        font-size: 1rem;
        animation: slideDown 0.2s ease-out;
    }

    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @media (max-width: 800px) {
        .summary-header h3 {
            font-size: 1.3rem;
        }

        .summary-content {
            font-size: 0.95rem;
        }
    }

    @media (max-width: 400px) {
        .weekly-summary-card {
            padding: 1rem;
        }

        .summary-header h3 {
            font-size: 1.1rem;
        }

        .summary-content {
            font-size: 0.9rem;
        }
    }
</style>

<div class="matchups">
    <div class="weekContainer">
        {#if displayWeek > 1}
            <Icon class="material-icons changeWeek" onclick={() => changeWeek(displayWeek - 1)}>chevron_left</Icon>
        {:else}
            <span class="spacer" />
        {/if}
        <h3 class="weekText">{year} Week {displayWeek} Matchups</h3>
        {#if displayWeek < matchupWeeks.length}
            <Icon class="material-icons changeWeek" onclick={() => changeWeek(displayWeek + 1)}>chevron_right</Icon>
        {:else}
            <span class="spacer" />
        {/if}
    </div>

    <!-- NEW: Weekly Summary Section -->
    {#if weeklySummary && queryWeek == displayWeek}
        <div class="weekly-summary-card">
            <div 
                class="summary-header" 
                on:click={() => summaryExpanded = !summaryExpanded}
                role="button"
                tabindex="0"
                on:keypress={(e) => e.key === 'Enter' && (summaryExpanded = !summaryExpanded)}
            >
                <h3>📰 Week {displayWeek} Recap</h3>
                <span class="toggle-icon {summaryExpanded ? 'expanded' : ''}">▼</span>
            </div>
            {#if summaryExpanded}
                <div class="summary-content">
                    {weeklySummary}
                </div>
            {/if}
        </div>
    {/if}

    {#each matchupArray as matchup, ix (rand * (ix + 1))}
        <Matchup {ix} {matchup} {players} {displayWeek} bind:active={active} {leagueTeamManagers} />
    {/each}
</div>