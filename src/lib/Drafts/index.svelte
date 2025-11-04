<script>
	import { waitForAll } from '$lib/utils/helper';
    import LinearProgress from '@smui/linear-progress';
    import Draft from './Draft.svelte'; 

    export let previousDraftsData, leagueTeamManagersData, playersData;
    // Commented out for now - uncomment when ready to show upcoming draft
    // export let upcomingDraftData;
</script>

<style>
	.loading {
		display: block;
		width: 85%;
		max-width: 500px;
		margin: 80px auto;
	}

    h4 {
        text-align: center;
    }

    h6 {
        text-align: center;
    }
</style>

<!-- Upcoming Draft Section - Commented out for future use -->
<!-- 
{#await waitForAll(upcomingDraftData, leagueTeamManagersData, playersData) }
	<div class="loading">
		<p>Retrieving upcoming draft...</p>
		<br />
		<LinearProgress indeterminate />
	</div>
{:then [upcomingDraft, leagueTeamManagers, {players}] }
    <h4>Upcoming {upcomingDraft.year} Draft</h4>
    <Draft draftData={upcomingDraft} {leagueTeamManagers} year={upcomingDraft.year} {players} />
{:catch error}
	<p>Something went wrong: {error.message}</p>
{/await}
-->

{#await waitForAll(previousDraftsData, leagueTeamManagersData, playersData) }
	<div class="loading">
		<p>Retrieving draft...</p>
		<br />
		<LinearProgress indeterminate />
	</div>
{:then [previousDrafts, leagueTeamManagers, {players}] }
	<!-- Display the most recent draft -->
	{#if previousDrafts.length}
		{#each previousDrafts as previousDraft}
			<h4>{previousDraft.year} Draft</h4>
			<Draft draftData={previousDraft} previous={true} {leagueTeamManagers} year={previousDraft.year} {players} />
		{/each}
	{/if}
{:catch error}
	<!-- promise was rejected -->
	<p>Something went wrong: {error.message}</p>
{/await}