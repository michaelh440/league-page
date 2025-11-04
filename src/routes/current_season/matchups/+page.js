import { getBrackets, getLeagueMatchups, getLeagueTeamManagers, loadPlayers } from '$lib/utils/helper';

export async function load({ url, fetch }) {
    const queryWeek = url?.searchParams?.get('week');
    const weekNum = isNaN(queryWeek) ? null : parseInt(queryWeek);
    
    // Fetch weekly summary if we have a week
    let weeklySummary = null;
    if (weekNum) {
        try {
            const currentYear = new Date().getFullYear();
            const summaryUrl = `/api/weekly_summary_text?season=${currentYear}&week=${weekNum}`;
            console.log('Fetching summary from:', summaryUrl);
            
            const response = await fetch(summaryUrl);
            const data = await response.json();
            
            console.log('Summary API response:', data);
            
            if (data.success && data.summary) {
                weeklySummary = data.summary.summary_text;
                console.log('Weekly summary loaded:', weeklySummary ? 'YES' : 'NO');
                console.log('Summary length:', weeklySummary?.length);
            }
        } catch (err) {
            console.error('Error loading weekly summary:', err);
        }
    }
    
    console.log('Returning weeklySummary:', weeklySummary ? 'EXISTS' : 'NULL');
    
    return {
        queryWeek: weekNum,
        matchupsData: getLeagueMatchups(),
        bracketsData: getBrackets(),
        leagueTeamManagersData: getLeagueTeamManagers(),
        playersData: loadPlayers(fetch),
        weeklySummary: weeklySummary,
    };
}