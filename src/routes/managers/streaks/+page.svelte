<script>
  import StatsLayout from '$lib/components/StatsLayout.svelte';
  import StatsCardGrid from '$lib/components/StatsCardGrid.svelte';

  // Sidebar nav config (Streaks is active)
  const navItems = [
    { label: "Manager Bio", href: withMgr("/managers/bio")},
    { label: "All Time Scoring", href: "/league/all_time_stats"},
    { label: "Regular Season Scoring", href: "/league/reg_season_stats" },
    { label: "Playoff Scoring", href: "/league/playoff_stats" },
    //{ label: "Streaks", href: "/league/streaks", active: true  },
    //{ label: "Potential Points", href: "/league/potential_points" },
    { label: "Ranking", href: "/league/ranking" },
    { label: "Rivalries", href: "/league/rivalries" },
    //{ label: "Trophy Room", href: "/league/trophy_room" },
    { label: "Draft Room", href: "/league/drafts" }
  ];

  // Cards specific to Streaks
  const cards = [
    { title: "All Time Winning Streaks" },
    { title: "All Time Losing Streaks" },
    { title: "Regular Season Winning Streaks" },
    { title: "Regular Season Losing Streaks" },
    { title: "Playoff Winning Streaks" },
    { title: "Playoff Losing Streaks" }
  ];
</script>

<StatsLayout title="Streaks" {navItems}>
  <StatsCardGrid {cards} />
</StatsLayout>
