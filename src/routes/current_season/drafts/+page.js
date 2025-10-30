import { getUpcomingDraft, getPreviousDrafts, getLeagueTeamManagers, loadPlayers } from '$lib/utils/helper';

export async function load({ fetch }) {
    const allPreviousDrafts = await getPreviousDrafts();
    
    // Get the most recent draft (FIRST item in array)
    const lastDraft = allPreviousDrafts && allPreviousDrafts.length > 0 
        ? allPreviousDrafts[0]  // First draft is the most recent
        : null;
    
    const leagueTeamManagersData = await getLeagueTeamManagers();
    const playersData = await loadPlayers(fetch);

    return {
        previousDraftsData: lastDraft ? [lastDraft] : [],
        leagueTeamManagersData,
        playersData,
    };
}