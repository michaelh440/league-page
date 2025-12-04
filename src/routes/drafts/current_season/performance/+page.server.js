import { getPreviousDrafts, getLeagueTeamManagers, loadPlayers, getLeagueData, getNflState, leagueID } from '$lib/utils/helper';
import { waitForAll } from '$lib/utils/helperFunctions/multiPromise';

export async function load() {
    // Get draft data, team managers, players, league data, and NFL state
    const [previousDraftsData, leagueTeamManagersData, playersData, leagueData, nflState] = await waitForAll(
        getPreviousDrafts(),
        getLeagueTeamManagers(),
        loadPlayers(),
        getLeagueData(),
        getNflState()
    );

    // Get the most recent draft (first item in array)
    const currentDraft = previousDraftsData && previousDraftsData.length > 0 
        ? previousDraftsData[0] 
        : null;

    if (!currentDraft) {
        return {
            error: 'No draft data found',
            draftPickStats: [],
            leagueTeamManagersData,
            playersData: playersData.players,
            currentWeek: 0,
            year: new Date().getFullYear()
        };
    }

    const year = currentDraft.year;
    
    // Determine how many weeks to fetch (last completed week)
    let currentWeek = 0;
    if (nflState.season_type === 'regular') {
        currentWeek = nflState.display_week > 1 ? nflState.display_week - 1 : 0;
    } else if (nflState.season_type === 'post') {
        currentWeek = leagueData.settings.playoff_week_start - 1; // Full regular season
    }

    // If no weeks completed yet, return empty stats
    if (currentWeek < 1) {
        return {
            draftPickStats: [],
            currentDraft,
            leagueTeamManagersData,
            playersData: playersData.players,
            currentWeek: 0,
            year,
            message: 'Season has not started yet. Check back after Week 1!'
        };
    }

    // Fetch weekly stats AND roster data for each completed week
    const weeklyDataPromises = [];
    for (let week = 1; week <= currentWeek; week++) {
        // Fetch both stats and matchups (which contain roster info) for each week
        weeklyDataPromises.push(
            Promise.all([
                fetch(`https://api.sleeper.app/v1/stats/nfl/regular/${year}/${week}`)
                    .then(res => res.ok ? res.json() : {})
                    .catch(() => ({})),
                fetch(`https://api.sleeper.app/v1/league/${leagueID}/matchups/${week}`)
                    .then(res => res.ok ? res.json() : [])
                    .catch(() => [])
            ]).then(([stats, matchups]) => ({ week, stats, matchups }))
        );
    }

    const weeklyData = await Promise.all(weeklyDataPromises);

    // Build a map of player_id -> weekly ownership and points
    // Structure: { playerId: { weeks: { 1: { rosterID, points }, 2: { rosterID, points }, ... } } }
    const playerWeeklyData = {};
    
    for (const { week, stats, matchups } of weeklyData) {
        // First, build roster ownership map for this week
        const playerToRoster = {};
        for (const matchup of matchups) {
            if (matchup.players) {
                for (const playerId of matchup.players) {
                    playerToRoster[playerId] = matchup.roster_id;
                }
            }
        }
        
        // Now assign points to owners
        for (const [playerId, playerStats] of Object.entries(stats)) {
            if (!playerWeeklyData[playerId]) {
                playerWeeklyData[playerId] = { 
                    weeks: {}, 
                    totalPoints: 0, 
                    gamesPlayed: 0,
                    ownershipHistory: {} // Track who owned the player each week
                };
            }
            
            const pts = calculateFantasyPoints(playerStats, 'half_ppr');
            const ownerRosterID = playerToRoster[playerId] || null;
            
            if (pts > 0 || ownerRosterID) {
                playerWeeklyData[playerId].weeks[week] = {
                    points: pts,
                    rosterID: ownerRosterID,
                    owned: !!ownerRosterID
                };
                
                if (ownerRosterID) {
                    playerWeeklyData[playerId].ownershipHistory[week] = ownerRosterID;
                }
                
                if (pts > 0) {
                    playerWeeklyData[playerId].totalPoints += pts;
                    playerWeeklyData[playerId].gamesPlayed++;
                }
            }
        }
    }

    // Fetch ADP data (using Sleeper's search_rank as proxy)
    const adpData = await fetchADPData(year);

    // Now process draft picks and attach points with ownership breakdown
    const draftPickStats = [];
    const draft = currentDraft.draft;
    const draftOrder = currentDraft.draftOrder;
    const draftType = currentDraft.draftType;

    // Track points by manager (including from traded/dropped players)
    const managerPointsBreakdown = {};

    // Handle different draft types
    if (draftType === 'auction') {
        // Auction draft - different structure
        for (let col = 0; col < draft[0].length; col++) {
            for (let row = 0; row < draft.length; row++) {
                const pick = draft[row][col];
                if (!pick || !pick.player) continue;

                const playerId = pick.player;
                const drafterRosterID = draftOrder[col];
                const playerInfo = playersData.players[playerId];
                const weeklyInfo = playerWeeklyData[playerId] || { 
                    weeks: {}, 
                    totalPoints: 0, 
                    gamesPlayed: 0,
                    ownershipHistory: {}
                };

                // Calculate points by owner
                const pointsByOwner = calculatePointsByOwner(weeklyInfo, drafterRosterID);

                const pickData = {
                    pickNumber: null,
                    round: null,
                    slot: null,
                    drafterRosterID,
                    playerId,
                    playerName: playerInfo ? `${playerInfo.fn} ${playerInfo.ln}` : playerId,
                    position: playerInfo?.pos || 'Unknown',
                    team: playerInfo?.t || 'FA',
                    totalPoints: Math.round(weeklyInfo.totalPoints * 100) / 100,
                    weeklyBreakdown: weeklyInfo.weeks,
                    gamesPlayed: weeklyInfo.gamesPlayed,
                    auctionAmount: pick.amount || 0,
                    ppg: weeklyInfo.gamesPlayed > 0 
                        ? Math.round((weeklyInfo.totalPoints / weeklyInfo.gamesPlayed) * 100) / 100 
                        : 0,
                    pointsByOwner,
                    drafterPoints: pointsByOwner[drafterRosterID] || 0,
                    currentOwner: getCurrentOwner(weeklyInfo, currentWeek),
                    adp: adpData[playerId] || null,
                    adpDiff: null
                };

                draftPickStats.push(pickData);
                
                // Track manager points
                for (const [rosterID, pts] of Object.entries(pointsByOwner)) {
                    if (!managerPointsBreakdown[rosterID]) {
                        managerPointsBreakdown[rosterID] = { 
                            drafted: 0, 
                            acquired: 0, 
                            total: 0,
                            players: []
                        };
                    }
                    if (rosterID == drafterRosterID) {
                        managerPointsBreakdown[rosterID].drafted += pts;
                    } else {
                        managerPointsBreakdown[rosterID].acquired += pts;
                    }
                    managerPointsBreakdown[rosterID].total += pts;
                }
            }
        }
    } else {
        // Snake/linear draft
        let pickNumber = 0;
        for (let round = 0; round < draft.length; round++) {
            for (let slot = 0; slot < draft[round].length; slot++) {
                pickNumber++;
                const pick = draft[round][slot];
                if (!pick || !pick.player) continue;

                const playerId = pick.player;
                const drafterRosterID = draftOrder[slot];
                const playerInfo = playersData.players[playerId];
                const weeklyInfo = playerWeeklyData[playerId] || { 
                    weeks: {}, 
                    totalPoints: 0, 
                    gamesPlayed: 0,
                    ownershipHistory: {}
                };

                // Calculate points by owner
                const pointsByOwner = calculatePointsByOwner(weeklyInfo, drafterRosterID);

                const pickData = {
                    pickNumber,
                    round: round + 1,
                    slot: slot + 1,
                    drafterRosterID,
                    playerId,
                    playerName: playerInfo ? `${playerInfo.fn} ${playerInfo.ln}` : playerId,
                    position: playerInfo?.pos || 'Unknown',
                    team: playerInfo?.t || 'FA',
                    totalPoints: Math.round(weeklyInfo.totalPoints * 100) / 100,
                    weeklyBreakdown: weeklyInfo.weeks,
                    gamesPlayed: weeklyInfo.gamesPlayed,
                    newOwner: pick.newOwner || null,
                    ppg: weeklyInfo.gamesPlayed > 0 
                        ? Math.round((weeklyInfo.totalPoints / weeklyInfo.gamesPlayed) * 100) / 100 
                        : 0,
                    pointsByOwner,
                    drafterPoints: pointsByOwner[drafterRosterID] || 0,
                    currentOwner: getCurrentOwner(weeklyInfo, currentWeek),
                    adp: adpData[playerId] || null
                };

                draftPickStats.push(pickData);
                
                // Track manager points
                for (const [rosterID, pts] of Object.entries(pointsByOwner)) {
                    if (!managerPointsBreakdown[rosterID]) {
                        managerPointsBreakdown[rosterID] = { 
                            drafted: 0, 
                            acquired: 0, 
                            total: 0,
                            players: []
                        };
                    }
                    if (rosterID == drafterRosterID) {
                        managerPointsBreakdown[rosterID].drafted += pts;
                    } else {
                        managerPointsBreakdown[rosterID].acquired += pts;
                    }
                    managerPointsBreakdown[rosterID].total += pts;
                }
            }
        }
    }

    // Calculate ADP difference (positive = outperforming draft position)
    // Sort by total points to get actual ranking
    const sortedByPoints = [...draftPickStats].sort((a, b) => b.totalPoints - a.totalPoints);
    sortedByPoints.forEach((pick, index) => {
        pick.performanceRank = index + 1;
        if (pick.pickNumber) {
            // Compare pick position to performance rank
            // Positive = performing better than draft position
            pick.adpDiff = pick.pickNumber - pick.performanceRank;
        }
    });

    // Calculate chart data
    const chartData = calculateChartData(draftPickStats, draftOrder, currentWeek);

    return {
        draftPickStats,
        currentDraft,
        leagueTeamManagersData,
        playersData: playersData.players,
        currentWeek,
        year,
        draftType,
        managerPointsBreakdown,
        chartData
    };
}

function calculatePointsByOwner(weeklyInfo, drafterRosterID) {
    const pointsByOwner = {};
    
    for (const [week, data] of Object.entries(weeklyInfo.weeks)) {
        if (data.rosterID && data.points > 0) {
            if (!pointsByOwner[data.rosterID]) {
                pointsByOwner[data.rosterID] = 0;
            }
            pointsByOwner[data.rosterID] += data.points;
        }
    }
    
    // Round all values
    for (const key in pointsByOwner) {
        pointsByOwner[key] = Math.round(pointsByOwner[key] * 100) / 100;
    }
    
    return pointsByOwner;
}

function getCurrentOwner(weeklyInfo, currentWeek) {
    // Find the most recent week with ownership data
    for (let w = currentWeek; w >= 1; w--) {
        if (weeklyInfo.ownershipHistory[w]) {
            return weeklyInfo.ownershipHistory[w];
        }
    }
    return null;
}

function calculateChartData(draftPickStats, draftOrder, currentWeek) {
    // Points by Round
    const pointsByRound = {};
    const picksByRound = {};
    for (const pick of draftPickStats) {
        if (pick.round) {
            if (!pointsByRound[pick.round]) {
                pointsByRound[pick.round] = 0;
                picksByRound[pick.round] = 0;
            }
            pointsByRound[pick.round] += pick.totalPoints;
            picksByRound[pick.round]++;
        }
    }
    
    // Average points per pick by round
    const avgPointsByRound = {};
    for (const round in pointsByRound) {
        avgPointsByRound[round] = Math.round((pointsByRound[round] / picksByRound[round]) * 100) / 100;
    }

    // Points by Position
    const pointsByPosition = {};
    const picksByPosition = {};
    for (const pick of draftPickStats) {
        const pos = pick.position;
        if (pos && pos !== 'Unknown') {
            if (!pointsByPosition[pos]) {
                pointsByPosition[pos] = 0;
                picksByPosition[pos] = 0;
            }
            pointsByPosition[pos] += pick.totalPoints;
            picksByPosition[pos]++;
        }
    }

    // Points by Manager (from draft picks)
    const pointsByManager = {};
    for (const pick of draftPickStats) {
        const rosterID = pick.drafterRosterID;
        if (!pointsByManager[rosterID]) {
            pointsByManager[rosterID] = {
                drafted: 0,      // Points from players they drafted (while on their team)
                total: 0,        // Total points from their drafted players (regardless of current owner)
                picksCount: 0
            };
        }
        pointsByManager[rosterID].drafted += pick.drafterPoints;
        pointsByManager[rosterID].total += pick.totalPoints;
        pointsByManager[rosterID].picksCount++;
    }

    // Weekly totals for all drafted players
    const weeklyTotals = {};
    for (let w = 1; w <= currentWeek; w++) {
        weeklyTotals[w] = 0;
        for (const pick of draftPickStats) {
            if (pick.weeklyBreakdown[w]) {
                weeklyTotals[w] += pick.weeklyBreakdown[w].points || 0;
            }
        }
        weeklyTotals[w] = Math.round(weeklyTotals[w] * 100) / 100;
    }

    // Value picks (outperforming draft position)
    const valuePicks = draftPickStats
        .filter(p => p.adpDiff !== null && p.totalPoints > 0 && p.pickNumber)
        .sort((a, b) => b.adpDiff - a.adpDiff)
        .slice(0, 10);

    // Bust picks (early picks with poor performance)
    const bustPicks = draftPickStats
        .filter(p => p.round && p.round <= 5)
        .sort((a, b) => a.totalPoints - b.totalPoints)
        .slice(0, 10);

    return {
        pointsByRound,
        avgPointsByRound,
        pointsByPosition,
        picksByPosition,
        pointsByManager,
        weeklyTotals,
        valuePicks,
        bustPicks
    };
}

async function fetchADPData(year) {
    try {
        const playersRes = await fetch('https://api.sleeper.app/v1/players/nfl');
        if (!playersRes.ok) return {};
        
        const players = await playersRes.json();
        const adpMap = {};
        
        // Use search_rank as a proxy for ADP
        for (const [playerId, player] of Object.entries(players)) {
            if (player.search_rank && player.search_rank < 500) {
                adpMap[playerId] = player.search_rank;
            }
        }
        
        return adpMap;
    } catch (err) {
        console.error('Error fetching ADP data:', err);
        return {};
    }
}

function calculateFantasyPoints(stats, scoringType = 'half_ppr') {
    let points = 0;
    
    // Passing
    points += (stats.pass_yd || 0) * 0.04;
    points += (stats.pass_td || 0) * 4;
    points += (stats.pass_int || 0) * -2;
    points += (stats.pass_2pt || 0) * 2;
    
    // Rushing
    points += (stats.rush_yd || 0) * 0.1;
    points += (stats.rush_td || 0) * 6;
    points += (stats.rush_2pt || 0) * 2;
    
    // Receiving
    points += (stats.rec_yd || 0) * 0.1;
    points += (stats.rec_td || 0) * 6;
    points += (stats.rec_2pt || 0) * 2;
    
    // PPR scoring
    if (scoringType === 'ppr') {
        points += (stats.rec || 0) * 1;
    } else if (scoringType === 'half_ppr') {
        points += (stats.rec || 0) * 0.5;
    }
    
    // Fumbles
    points += (stats.fum_lost || 0) * -2;
    
    // Kicking
    points += (stats.fgm || 0) * 3;
    points += (stats.fgm_40_49 || 0) * 1;
    points += (stats.fgm_50p || 0) * 2;
    points += (stats.xpm || 0) * 1;
    points += (stats.fgmiss || 0) * -1;
    
    // Defense/ST
    points += (stats.def_td || 0) * 6;
    points += (stats.sack || 0) * 1;
    points += (stats.int || 0) * 2;
    points += (stats.fum_rec || 0) * 2;
    points += (stats.safe || 0) * 2;
    points += (stats.blk_kick || 0) * 2;
    
    return Math.round(points * 100) / 100;
}