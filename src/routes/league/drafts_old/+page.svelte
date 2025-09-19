<script>
    import StatsLayout from '$lib/components/StatsLayout.svelte';
    import { Drafts } from '$lib/components';

    export let data;
    const { upcomingDraftData, previousDraftsData, leagueTeamManagersData, playersData } = data;

    // Sidebar nav config (Draft Room is active here)
    const navItems = [
        { label: "All Time Scoring", href: "/league/all_time_stats" },
        { label: "Regular Season Scoring", href: "/league/reg_season_stats" },
        { label: "Playoff Scoring", href: "/league/playoff_stats" },
        { label: "Streaks", href: "/league/streaks" },
        { label: "Potential Points", href: "/league/potential_points" },
        { label: "Ranking", href: "/league/ranking" },
        { label: "Rivalries", href: "/league/rivalries" },
        { label: "Trophy Room", href: "/league/trophy_room" },
        { label: "Draft Room", href: "/league/drafts", active: true }
    ];
</script>

<StatsLayout title="Draft Room" {navItems}>
    <div id="main">
        <Drafts {upcomingDraftData} {previousDraftsData} {leagueTeamManagersData} {playersData} />
    </div>
</StatsLayout>

<style>
    #main {
        position: relative;
        z-index: 1;
    }
</style>

<div id="main">
	<Drafts {upcomingDraftData} {previousDraftsData} {leagueTeamManagersData} {playersData} />
</div>