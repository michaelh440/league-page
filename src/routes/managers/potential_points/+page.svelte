<script>
  import StatsLayout from '$lib/components/StatsLayout.svelte';
  import StatsCardGrid from '$lib/components/StatsCardGrid.svelte';

  // Sidebar nav config (Potential Points is active)
  const navItems = [
    { label: "All Time Scoring", href: "/league/all_time_stats"},
    { label: "Regular Season Scoring", href: "/league/reg_season_stats" },
    { label: "Playoff Scoring", href: "/league/playoff_stats" },
    //{ label: "Streaks", href: "/league/streaks" },
    //{ label: "Potential Points", href: "/league/potential_points", active: true  },
    { label: "Ranking", href: "/league/ranking" },
    { label: "Rivalries", href: "/league/rivalries" },
    //{ label: "Trophy Room", href: "/league/trophy_room" },
    { label: "Draft Room", href: "/league/drafts" }
  ];

  // Cards specific to Potential Points
  const cards = [
    { title: "Potential Points All Time" },
    { title: "Potential Points Regular Season" },
    { title: "Potential Points Playoffs" }
  ];
</script>

<StatsLayout title="Potential Points" {navItems}>
  <StatsCardGrid {cards} />
</StatsLayout>
