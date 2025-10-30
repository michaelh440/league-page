import { getUpcomingDraft, getPreviousDrafts, getLeagueTeamManagers, loadPlayers } from '$lib/utils/helper';

export async function load({ fetch }) {
    const allPreviousDrafts = await getPreviousDrafts();
    
    // Get the most recent draft (last item in array)
    const lastDraft = allPreviousDrafts && allPreviousDrafts.length > 0 
        ? allPreviousDrafts[allPreviousDrafts.length - 1] 
        : null;
    
    const leagueTeamManagersData = await getLeagueTeamManagers();
    const playersData = await loadPlayers(fetch);

    return {
        previousDraftsData: lastDraft ? [lastDraft] : [], // Wrap in array for component compatibility
        leagueTeamManagersData,
        playersData,
    };
}
//adding comment to trigger rebuild