<script>
  import StatsLayout from '$lib/components/StatsLayout.svelte';
  import { Awards } from '$lib/components';
  import { waitForAll } from '$lib/utils/helper';
  import LinearProgress from '@smui/linear-progress';

  export let data;

  const { awardsData, teamManagersData } = data;

  const navItems = [
    { label: "All Time Scoring", href: "/league/all_time_stats" },
    { label: "Regular Season Scoring", href: "/league/reg_season_stats" },
    { label: "Playoff Scoring", href: "/league/playoff_stats" },
    //{ label: "Streaks", href: "/league/streaks" },
    //{ label: "Potential Points", href: "/league/potential_points" },
    //{ label: "Ranking", href: "/league/ranking" },
    { label: "Rivalries", href: "/league/rivalries" },
    //{ label: "Trophy Room", href: "/league/trophy_room", active: true },
    { label: "Draft Room", href: "/league/drafts" }
  ];
</script>

<StatsLayout title="Trophy Room" {navItems}>
  <div class="awards">
    {#await waitForAll(awardsData, teamManagersData) }
      <div class="loading">
        <p>Retrieving awards data...</p>
        <LinearProgress indeterminate />
      </div>
    {:then [podiums, leagueTeamManagers] }
      {#each podiums as podium}
        <Awards {podium} {leagueTeamManagers} />
      {:else}
        <p class="nothingYet">
          No seasons have been completed yet, so no awards have been earned...
        </p>
      {/each}
    {:catch error}
      <p>Something went wrong: {error.message}</p>
    {/await}
  </div>
</StatsLayout>

<style>
  .awards {
    display: block;
    margin: 30px auto;
    width: 95%;
    max-width: 1000px;
    position: relative;
    z-index: 1;
    overflow-y: hidden;
  }

  .loading {
    display: block;
    width: 85%;
    max-width: 500px;
    margin: 80px auto;
  }

  .nothingYet {
    display: block;
    width: 85%;
    max-width: 500px;
    margin: 80px auto;
    text-align: center;
  }
</style>
