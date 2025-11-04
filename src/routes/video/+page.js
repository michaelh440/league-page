// src/routes/video/+page.js

/**
 * @typedef {Object} Video
 * @property {string} id
 * @property {string} title
 * @property {string} url - YouTube or Vimeo URL
 * @property {string} date - YYYY-MM-DD format
 * @property {string} [description]
 * @property {boolean} [featured]
 */

export async function load() {
  // TODO: Replace this with actual data fetching from your API or database
  // For now, here's sample data structure - UPDATE WITH YOUR ACTUAL VIDEOS
  
  /** @type {Video[]} */
  const videos = [
    {
      id: '1',
      title: 'Week 9 Standings - Huge Wins and Losses',
      url: 'https://youtu.be/SD1YeArVqP8', // ← UPDATE THIS
      date: '2025-10-13',
      description: 'Week 9 Standings and Highlights'
    },
    // Add more videos here as you create them
    {
      id: '2',
      title: 'Week 8 Standings - Scary Moves!',
      url: 'https://youtu.be/jeh1rnTPk_k', // ← UPDATE THIS WITH YOUR ACTUAL VIDEO ID
      date: '2025-10-27',
      description: 'Halloween Edition of the Week 8 Standings Update',
      featured: true
    },
    {
      id: '3',
      title: 'Week 7 Standings - Midseason Madness',
      url: 'https://youtu.be/ZzznhH1n_wc', // ← UPDATE THIS
      date: '2025-10-20',
      description: 'The season is halfway over.  Check out the midway point standings update.'
    },
    
  ];

  // Sort videos by date, newest first
  videos.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    videos
  };
}