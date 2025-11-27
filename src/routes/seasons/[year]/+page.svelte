<script>
    import { Icon } from '@smui/tab';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    export let data;
    
    // Reactive destructuring - updates when navigating between years
    $: ({ season, weeks } = data);

    const seasons = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];

    let active = null;

    onMount(() => {
        // Initialize component
    });

    function getWinner(score1, score2) {
        const num1 = Number(score1);
        const num2 = Number(score2);
        
        if (isNaN(num1) || isNaN(num2)) {
            // Fallback to string comparison if conversion fails
            return score1 > score2 ? 'home' : score2 > score1 ? 'away' : 'tied';
        }
        
        return num1 > num2 ? 'home' : num2 > num1 ? 'away' : 'tied';
    }

    function expandClose(matchupId) {
        active = active === matchupId ? null : matchupId;
    }

    // Get position badge color
    function getPositionColor(position) {
        const colors = {
            'QB': '#ff0066',
            'RB': '#00ceb8',
            'WR': '#58a7ff',
            'TE': '#ffae58',
            'K': '#bd66ff',
            'DEF': '#f5c842',
            'FLEX': '#00ceb8'
        };
        return colors[position] || '#999';
    }
</script>

<div class="page-layout">
    <!-- Sidebar -->
    <aside class="sidebar">
        {#each seasons as yr}
            <a 
                href="/seasons/{yr}" 
                class="season-card"
                class:active={season === yr}
            >
                {yr}
            </a>
        {/each}
    </aside>

    <!-- Main Content -->
    <main class="content">
        <h3 style="text-align: center;">{season} Season</h3>

        <nav class="season-nav">
          <a href="/standings/{season}" class="season-btn">Reg Season Standings</a>
          <a href="/seasons/{season}" class="season-btn active">Reg Season Week View</a>
          <a href="/seasons/{season}/playoffs" class="season-btn"> Playoff Week View</a>
        </nav>

        <!-- All weeks displayed vertically -->
        <div class="season-container">
            {#each weeks as week}
                <div class="week-section">
                    <h4>Week {week.week}</h4>
                    <div class="matchups">
                        {#each week.games as game, ix}
                            {@const matchupId = `${week.week}-${ix}`}
                            {@const winner = getWinner(game.score1, game.score2)}
                            <div class="matchup">
                                <div class="header" on:click={() => expandClose(matchupId)}>
                                    <div class="opponent home {winner === 'home' ? 'homeGlow' : ''}">
                                        {#if game.team1_logo}
                                            <img class="avatar" src={game.team1_logo} alt="{game.team1}" />
                                        {/if}
                                        <div class="name">{game.team1}</div>
                                        <div class="totalPoints totalPointsR">{game.score1}</div>
                                    </div>
                                    <img class="divider" src="/{winner}Divider.jpg" alt="divider" />
                                    <div class="opponent away {winner === 'away' ? 'awayGlow' : ''}">
                                        <div class="totalPoints totalPointsL">{game.score2}</div>
                                        <div class="name">{game.team2}</div>
                                        {#if game.team2_logo}
                                            <img class="avatar" src={game.team2_logo} alt="{game.team2}" />
                                        {/if}
                                    </div>
                                </div>

                                <!-- Expandable roster content -->
                                <div class="rosters" 
                                     style:max-height={active === matchupId ? '600px' : '0'} 
                                     style:border={active !== matchupId ? 'none' : ''}>
                                    
                                    {#if game.team1_roster && game.team2_roster}
                                        <div class="roster-container">
                                            <!-- Team 1 Roster -->
                                            <div class="team-roster">
                                                <h5>{game.team1}</h5>
                                                {#each game.team1_roster as player}
                                                    <div class="player-row {player.is_starter ? 'starter' : 'bench'}">
                                                        <div class="position-badge" style="background-color: {getPositionColor(player.position)}">
                                                            {player.lineup_slot}
                                                        </div>
                                                        <div class="player-info">
                                                            <span class="player-name">{player.player_name}</span>
                                                        </div>
                                                    </div>
                                                {/each}
                                            </div>

                                            <!-- Divider -->
                                            <div class="roster-divider"></div>

                                            <!-- Team 2 Roster -->
                                            <div class="team-roster">
                                                <h5>{game.team2}</h5>
                                                {#each game.team2_roster as player}
                                                    <div class="player-row {player.is_starter ? 'starter' : 'bench'}">
                                                        <div class="position-badge" style="background-color: {getPositionColor(player.position)}">
                                                            {player.lineup_slot}
                                                        </div>
                                                        <div class="player-info">
                                                            <span class="player-name">{player.player_name}</span>
                                                        </div>
                                                    </div>
                                                {/each}
                                            </div>
                                        </div>
                                    {:else}
                                        <div class="placeholder-content">
                                            <p>No roster data available for this matchup</p>
                                        </div>
                                    {/if}
                                    
                                    <div class="close" on:click={() => expandClose(matchupId)}>Close Matchup</div>
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            {/each}
        </div>
    </main>
</div>

<style>
    /* Desktop Layout */
    .page-layout {
        display: flex;
        gap: 2rem;
        min-height: 100vh;
        padding: 0 1rem;
    }

    .sidebar {
        flex: 0 0 12%;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-left: 0.5rem;
        margin-top: 1rem;
        position: sticky;
        top: 1rem;
        height: fit-content;
    }

    .season-card {
        display: block;
        padding: 0.8rem;
        text-align: center;
        font-weight: bold;
        text-decoration: none;
        color: white;
        background: linear-gradient(135deg, #007bff, #0056b3);
        border-radius: 6px;
        transition: all 0.2s ease;
    }

    .season-card:hover {
        background: #0056b3;
        transform: translateY(-2px);
    }

    .season-card.active {
        background: silver;
        color: #222;
    }

    .content {
        flex: 1;
        max-width: 100%;
    }

    /* Navigation */
    .season-nav {
        display: flex;
        justify-content: center;
        gap: 1rem;
        margin: 1rem 0 2rem 0;
    }

    .season-btn {
        display: inline-block;
        text-decoration: none;
        font-weight: bold;
        color: white;
        background: #007bff;
        padding: 0.6rem 1.2rem;
        border-radius: 6px;
        transition: all 0.2s ease;
    }

    .season-btn:hover {
        background: #0056b3;
        transform: translateY(-2px);
    }

    .season-btn.active {
        background: #004085;
    }

    /* Season container and week sections */
    .season-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2rem;
        padding-bottom: 2rem;
    }

    .week-section {
        width: 100%;
        max-width: 800px;
    }

    h4 {
        color: #004085;
        margin: 1rem 0 0.5rem 0;
        text-align: center;
        font-size: 1.5em;
    }

    /* Matchups styling (from live matchups) */
    .matchups {
        margin: 2em 0;
    }

    .matchup {
        width: 95%;
        max-width: 600px;
        margin: 10px auto;
    }

    .header {
        display: flex;
        justify-content: space-between;
        position: relative;
        border: 1px solid #bbb;
        border-radius: 10px;
        opacity: 0.8;
        cursor: pointer;
        transition: opacity 0.5s;
        overflow: hidden;
    }

    .header:hover {
        opacity: 1;
    }

    .opponent {
        display: flex;
        align-items: center;
        width: 46%;
        padding: 5px 2%;
        top: 0;
        z-index: 2;
    }

    .divider {
        position: absolute;
        z-index: 3;
        transform: translateX(-50%);
        top: 0;
        left: 50%;
        height: 100%;
        width: 15px;
    }

    .home {
        justify-content: flex-start;
        left: 0;
        text-align: left;
        background-color: #485566;
    }

    .home.homeGlow {
        box-shadow: 0 0 6px 4px #3279cf;
        background-color: #00316b !important;
    }

    .away {
        justify-content: flex-end;
        right: 0;
        text-align: right;
        background-color: #8b6969;
    }

    .away.awayGlow {
        box-shadow: 0 0 6px 4px #d15454;
        background-color: #920505 !important;
    }

    .name {
        margin: 0 5px;
        font-size: 1em;
        line-height: 1.1em;
        flex-grow: 1;
        word-break: break-word;
        color: #fff;
        font-style: italic;
    }

    .avatar {
        vertical-align: middle;
        border-radius: 50%;
        height: 35px;
        width: 35px;
        margin: 0;
        border: 0.25px solid #777;
        background-color: #eee;
    }

    .totalPoints {
        line-height: 1.1em;
        color: #fff;
        font-weight: 600;
        font-size: 1.1em;
    }

    .totalPointsR {
        margin-right: 0.1em;
        text-align: right;
    }

    .totalPointsL {
        margin-left: 0.1em;
        text-align: left;
    }

    /* Expandable roster content */
    .rosters {
        position: relative;
        background-color: #fff;
        border-radius: 8px;
        overflow-y: auto;
        border-left: 1px solid #bbb;
        border-right: 1px solid #bbb;
        border-bottom: 1px solid #bbb;
        transition: max-height 0.4s;
    }

    .roster-container {
        display: flex;
        gap: 1px;
        background-color: #ddd;
        padding: 0;
    }

    .team-roster {
        flex: 1;
        background-color: #fff;
        padding: 0.5rem;
    }

    .team-roster h5 {
        margin: 0 0 0.5rem 0;
        padding: 0.5rem;
        background-color: #f0f0f0;
        text-align: center;
        font-size: 0.9rem;
        font-weight: 600;
        color: #333;
    }

    .player-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.4rem 0.5rem;
        margin-bottom: 2px;
        border-radius: 4px;
        background-color: #f8f8f8;
    }

    .player-row.starter {
        background-color: #fff;
        border-left: 3px solid #007bff;
    }

    .player-row.bench {
        background-color: #f8f8f8;
        opacity: 0.7;
    }

    .position-badge {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 38px;
        height: 38px;
        border-radius: 6px;
        color: white;
        font-weight: bold;
        font-size: 0.75rem;
        text-align: center;
        padding: 0 4px;
    }

    .player-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-width: 0;
    }

    .player-name {
        font-size: 0.85rem;
        font-weight: 500;
        color: #333;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .roster-divider {
        width: 2px;
        background: linear-gradient(to bottom, #ddd, #999, #ddd);
    }

    .placeholder-content {
        padding: 1rem;
        text-align: center;
        color: #666;
    }

    .close {
        display: block;
        width: 100%;
        background-color: #eee;
        text-align: center;
        cursor: pointer;
        z-index: 2;
        font-size: 1.1em;
        padding: 6px 0;
        position: sticky;
        bottom: 0;
    }

    .close:hover {
        background-color: #ddd;
    }

    h3 {
        color: #004085;
        margin: 1rem 0;
    }

    /* Mobile responsive */
    @media screen and (max-width: 768px) {
        .page-layout {
            flex-direction: column;
            gap: 0;
            padding: 0.5rem;
        }

        .sidebar {
            position: relative;
            flex: none;
            flex-direction: row;
            width: 100%;
            margin: 0 0 1rem 0;
            padding: 0.75rem;
            background: #f8f9fa;
            border-radius: 8px;
            overflow-x: auto;
            overflow-y: hidden;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: thin;
            scrollbar-color: #ccc transparent;
        }

        .sidebar::-webkit-scrollbar {
            height: 4px;
        }

        .sidebar::-webkit-scrollbar-track {
            background: transparent;
        }

        .sidebar::-webkit-scrollbar-thumb {
            background: #ccc;
            border-radius: 2px;
        }

        .season-card {
            flex: 0 0 auto;
            padding: 0.6rem 1rem;
            font-size: 0.9rem;
            white-space: nowrap;
            min-width: 65px;
            text-align: center;
        }

        .content {
            width: 100%;
        }

        h3 {
            font-size: 1.4rem;
            margin: 0.5rem 0 1rem 0;
            text-align: center;
            color: white !important;
        }

        h4 {
            font-size: 1.2rem;
            margin: 0.5rem 0;
            color: white !important;
            font-weight: 600;
        }

        .name {
            font-size: 0.8em;
        }

        .totalPoints {
            font-size: 0.8em;
        }

        .roster-container {
            flex-direction: column;
        }

        .roster-divider {
            width: 100%;
            height: 2px;
        }

        .player-name {
            font-size: 0.75rem;
        }

        .position-badge {
            min-width: 32px;
            height: 32px;
            font-size: 0.65rem;
        }
    }

    @media (max-width: 500px) {
        .name {
            font-size: 0.7em;
        }

        .totalPoints {
            font-size: 0.7em;
        }
    }

    @media (max-width: 410px) {
        .name {
            font-size: 0.5em;
        }

        .totalPoints {
            font-size: 0.5em;
        }
    }
</style>