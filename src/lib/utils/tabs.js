/*import {leagueID} from '$lib/utils/leagueInfo';

const seasons = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022]; // add/remove as needed


export const tabs = [
    {
        icon: 'home',
        label: 'Home',
        dest: '/',
        key: 'home',
    },
    {
        icon: 'sports',
        label: 'Matchups',
        dest: '/matchups',
        key: 'matchups',
    },
    {
        icon: 'swap_horiz',
        label: 'Trades & Waivers',
        dest: '/transactions',
        key: 'transactions',
    },
    {
        icon: 'article',
        label: 'Previous years',
        dest: '/previous_years',
        key: 'previous_years',
    },
    {
        icon: 'swap_horiz',
        label: '2015',
        dest: '/seasons/2015',
        key: 'season_2015',
    },
    
    {
        icon: 'storage',
        label: 'League Info',
        nest: true,
        key: 'league_info',
        children: [
            {
                icon: 'storage',
                label: 'Rosters',
                dest: '/rosters',
            },
            {
                icon: 'groups',
                label: 'Managers',
                dest: '/managers',
            },
            {
                icon: 'local_fire_department',
                label: 'Rivalry',
                dest: '/rivalry',
            },
            {
                icon: 'leaderboard',
                label: 'Standings',
                dest: '/standings',
            },
            {
                icon: 'view_comfy',
                label: 'Drafts',
                dest: '/drafts',
            },
            {
                icon: 'emoji_events',
                label: 'Trophy Room',
                dest: '/awards',
            },
            {
                icon: 'military_tech',
                label: 'Records',
                dest: '/records',
            },
            {
                icon: 'history_edu',
                label: 'Constitution',
                dest: '/constitution',
            },
            {
                icon: 'sports_football',
                label: 'Go to Sleeper',
                dest: `https://sleeper.app/leagues/${leagueID}`,
            },
        ]
    },
    {
        icon: 'lightbulb',
        label: 'Resources',
        dest: '/resources',
        key: 'resources',
    },
];*/

// src/lib/utils/tabs.js
import { leagueID } from '$lib/utils/leagueInfo';

export const tabs = [
  { icon: 'home', label: 'Home', dest: '/', key: 'home' },
  { icon: 'calendar_month', label: 'Current Season', dest: '/matchups', key: 'current' },
  /*{
    icon: 'storage',
    label: 'League',
    nest: true,
    key: 'league',
    children: [
      { icon: 'article', label: 'Previous Seasons', dest: '/previous_years' },
      { icon: 'bar_chart', label: 'All Time League Stats', dest: '/league/all_time_stats' },
      { icon: 'timeline', label: 'Regular Season Stats', dest: '/league/reg_season_stats' },
      { icon: 'sports', label: 'Playoff Stats', dest: '/league/playoff_stats' },
      { icon: 'compare_arrows', label: 'Matchups/Rivalries', dest: '/league/rivalries' },
      //{ icon: 'emoji_events', label: 'Trophy Room', dest: '/league/trophy_room' },
      { icon: 'history_edu', label: 'Draft Room', dest: '/league/drafts' }
    ]
  },*/
  {
    icon: 'storage',
    label: 'League',
    nest: true,
    key: 'league',
    children: [
      { icon: 'bar_chart', label: 'All Time League Stats', dest: '/league/all_time_stats' },
      { icon: 'timeline', label: 'Regular Season Stats', dest: '/league/reg_season_stats' },
      { icon: 'sports', label: 'Playoff Stats', dest: '/league/playoff_stats' },
      { icon: 'compare_arrows', label: 'Matchups/Rivalries', dest: '/league/rivalries' },
      //{ icon: 'emoji_events', label: 'Streaks', dest: '/league/streaks' },
      //{ icon: 'history_edu', label: 'Trophy Room', dest: '/league/trophy_room' },
      { icon: 'history_edu', label: 'Draft Room', dest: '/league/drafts' }
    ]
  },
  { icon: 'timeline', label: 'Previous Seasons', dest: '/previous_years', key: 'current' },
  /*{
    icon: 'storage',
    label: 'Previous Seasons',
    nest: true,
    key: 'previous_seasons',
    children: [
      { icon: 'bar_chart', label: 'Standings', dest: '/standings' },
      { icon: 'compare_arrows', label: 'Weekly Matchups', dest: '/league/seasons/' },
      { icon: 'history_edu', label: 'Draft Room', dest: '/league/drafts/' },
      { icon: 'sports', label: 'Champions', dest: '/league/champions' },
      { icon: 'timeline', label: 'Regular Season Stats', dest: '/league/reg_season_stats/' },
      { icon: 'sports', label: 'Playoff Season Stats', dest: '/league/playoff_stats/' },
    ]
  },*/
  
  {
    icon: 'groups',
    label: 'Managers',
    nest: true,
    key: 'managers',
    children: [
      { icon: 'list', label: 'List', dest: '/managers' },
      { icon: 'person', label: 'Individual Manager Bio', dest: '/managers/bio' },
      { icon: 'leaderboard', label: 'Manager All Time Stats', dest: '/managers/all_time_stats' },
      { icon: 'bar_chart', label: 'Manager Regular Season Stats', dest: '/managers/reg_season_stats' },
      { icon: 'sports', label: 'Manager Playoff Stats', dest: '/managers/playoff_stats' },
      { icon: 'compare_arrows', label: 'Matchups/Rivalries', dest: '/managers/rivalries' },
      //{ icon: 'emoji_events', label: 'Manager Trophy Room', dest: '/managers/trophy_room' },
      { icon: 'history_edu', label: 'Manager Draft Room', dest: '/managers/drafts' }
    ]
  },
  { icon: 'videocam', label: 'Video', dest: '/video', key: 'video' }
];
