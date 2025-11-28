<script>
  import StatsLayout from '$lib/components/StatsLayout.svelte';
  import StatsCardGrid from '$lib/components/StatsCardGrid.svelte';

  // Sidebar nav config (Ranking is active)
  const navItems = [
    { label: "Manager Bio", href: withMgr("/managers/bio")},
    { label: "All Time Scoring", href: "/league/all_time_stats"},
    { label: "Regular Season Scoring", href: "/league/reg_season_stats" },
    { label: "Playoff Scoring", href: "/league/playoff_stats" },
    //{ label: "Streaks", href: "/league/streaks" },
    //{ label: "Potential Points", href: "/league/potential_points" },
    //{ label: "Ranking", href: "/league/ranking", active: true  },
    { label: "Rivalries", href: "/league/rivalries" },
    //{ label: "Trophy Room", href: "/league/trophy_room" },
    { label: "Draft Room", href: "/drafts/managers" }
  ];

  const cards = [
    { title: "Top Final Ranking" },
    { title: "Top Regular Season Ranking" },
    { title: "Playoff Appearances" },
    { title: "Championships" }
  ];
</script>

<StatsLayout title="Ranking" {navItems}>
  <StatsCardGrid {cards} />
</StatsLayout>
