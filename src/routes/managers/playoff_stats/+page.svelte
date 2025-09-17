<script>
  import StatsLayout from '$lib/components/StatsLayout.svelte';
  import StatCard from '$lib/components/StatCard.svelte';

  export let data;

  const navItems = [
    { label: "All Time Scoring", href: `/managers/${data.managerId}/all_time_stats` },
    { label: "Regular Season Scoring", href: `/managers/${data.managerId}/reg_season_stats` },
    { label: "Playoff Scoring", href: `/managers/${data.managerId}/playoff_stats`, active: true },
    { label: "Streaks", href: `/managers/${data.managerId}/streaks` },
    { label: "Potential Points", href: `/managers/${data.managerId}/potential_points` },
    { label: "Ranking", href: `/managers/${data.managerId}/ranking` },
    { label: "Rivalries", href: `/managers/${data.managerId}/rivalries` },
    { label: "Trophy Room", href: `/managers/${data.managerId}/trophy_room` },
    { label: "Draft Room", href: `/managers/${data.managerId}/drafts` }
  ];
</script>

<StatsLayout title="Manager Playoff Scoring" {navItems}>
  <div class="content-grid">
    <!-- ♻ Copy the StatCard grid from league playoff_stats -->
  </div>
</StatsLayout>

<style>
  /* ♻ reuse the same CSS as league playoff_stats */
  .content-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
  .stats-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
  .stats-table th, .stats-table td { border: 1px solid #ddd; padding: 0.35rem 0.5rem; }
  .stats-table th { text-align: center; background: #f5f5f5; font-weight: bold; }
  .stats-table tr:nth-child(even) { background: #fafafa; }
  .table-title { text-align: center; background-color: #003366; color: white; font-size: 1.1rem; font-weight: bold; padding: 0.6rem; }
  .team-cell { display: flex; align-items: center; gap: 0.5rem; }
  .team-logo { width: 22px; height: 22px; border-radius: 50%; object-fit: cover; }
</style>
