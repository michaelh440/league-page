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
      title: 'Week 8 Standings - Scary Moves!',
      url: 'https://youtu.be/jeh1rnTPk_k', // ← UPDATE THIS WITH YOUR ACTUAL VIDEO ID
      date: '2025-10-27',
      description: 'Halloween Edition of the Week 8 Standings Update',
      featured: true
    },
    /*{
      id: '2',
      title: 'Week 7 Highlights',
      url: 'https://www.youtube.com/watch?v=YOUR_VIDEO_ID', // ← UPDATE THIS
      date: '2025-10-20',
      description: 'Check out the biggest plays and most dramatic moments from week 7.'
    },
    {
      id: '3',
      title: 'Week 6 Recap',
      url: 'https://www.youtube.com/watch?v=YOUR_VIDEO_ID', // ← UPDATE THIS
      date: '2025-10-13',
      description: 'Midseason review and power rankings update.'
    }*/
    // Add more videos here as you create them
  ];

  // Sort videos by date, newest first
  videos.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    videos
  };
}