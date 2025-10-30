import { getBrackets, getLeagueMatchups, getLeagueTeamManagers, loadPlayers } from '$lib/utils/helper';

export async function load({ url, fetch }) {
    const queryWeek = url?.searchParams?.get('week');
    const weekNum = isNaN(queryWeek) ? null : parseInt(queryWeek);
    
    // Fetch weekly summary if we have a week
    let weeklySummary = null;
    if (weekNum) {
        try {
            const currentYear = new Date().getFullYear();
            const response = await fetch(`/api/weekly_summary_text?season=${currentYear}&week=${weekNum}`);
            const data = await response.json();
            if (data.success && data.summary) {
                weeklySummary = data.summary.summary_text;
            }
        } catch (err) {
            console.error('Error loading weekly summary:', err);
        }
    }
    
    return {
        queryWeek: weekNum,
        matchupsData: getLeagueMatchups(),
        bracketsData: getBrackets(),
        leagueTeamManagersData: getLeagueTeamManagers(),
        playersData: loadPlayers(fetch),
        weeklySummary: weeklySummary,
    };
}