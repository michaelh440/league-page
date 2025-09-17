// src/routes/+page.server.js
/*import { 
  getLeagueStandings, 
  getLeagueTeamManagers, 
  getNflState, 
  getAwards 
} from '$lib/utils/helper';

export async function load() {
  const standingsData = getLeagueStandings();
  const leagueTeamManagersData = getLeagueTeamManagers();
  const nflState = getNflState();
  const podiumsData = getAwards();

  return {
    standingsData,
    leagueTeamManagersData,
    nflState,
    podiumsData
  };
}*/

import { getLeagueStandings, getLeagueTeamManagers } from '$lib/utils/helper';

export async function load() {
  const standingsData = await getLeagueStandings();
  const leagueTeamManagersData = await getLeagueTeamManagers();

  return {
    standingsData,
    leagueTeamManagersData,
  };
}

