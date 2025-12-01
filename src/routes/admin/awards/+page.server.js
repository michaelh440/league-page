import { query } from '$lib/db';
import { fail } from '@sveltejs/kit';

export async function load() {
  try {
    // Get all award definitions with their enabled status
    const awards = (await query(`
      SELECT 
        award_id,
        award_key,
        award_name,
        award_description,
        award_category,
        is_enabled,
        sort_order,
        icon_emoji,
        created_at,
        updated_at
      FROM award_definitions
      ORDER BY sort_order, award_name
    `)).rows;

    // Group awards by category
    const awardsByCategory = awards.reduce((acc, award) => {
      if (!acc[award.award_category]) {
        acc[award.award_category] = [];
      }
      acc[award.award_category].push(award);
      return acc;
    }, {});

    return {
      awards,
      awardsByCategory,
      categoryLabels: {
        weekly: 'Weekly Awards',
        seasonal: 'Seasonal Awards',
        positional: 'Positional Awards',
        career: 'Career Awards'
      }
    };
  } catch (error) {
    console.error('Error loading awards:', error);
    return {
      awards: [],
      awardsByCategory: {},
      categoryLabels: {
        weekly: 'Weekly Awards',
        seasonal: 'Seasonal Awards',
        positional: 'Positional Awards',
        career: 'Career Awards'
      },
      error: error.message
    };
  }
}

export const actions = {
  // Toggle a single award's enabled status
  toggleAward: async ({ request }) => {
    const formData = await request.formData();
    const awardId = formData.get('award_id');
    const isEnabled = formData.get('is_enabled') === 'true';

    try {
      await query(`
        UPDATE award_definitions 
        SET is_enabled = $1, updated_at = CURRENT_TIMESTAMP
        WHERE award_id = $2
      `, [isEnabled, awardId]);

      return { success: true };
    } catch (error) {
      console.error('Error toggling award:', error);
      return fail(500, { success: false, error: error.message });
    }
  },

  // Bulk enable/disable by category
  bulkToggleCategory: async ({ request }) => {
    const formData = await request.formData();
    const category = formData.get('category');
    const isEnabled = formData.get('is_enabled') === 'true';

    try {
      await query(`
        UPDATE award_definitions 
        SET is_enabled = $1, updated_at = CURRENT_TIMESTAMP
        WHERE award_category = $2
      `, [isEnabled, category]);

      return { success: true };
    } catch (error) {
      console.error('Error bulk toggling awards:', error);
      return fail(500, { success: false, error: error.message });
    }
  },

  // Update award details
  updateAward: async ({ request }) => {
    const formData = await request.formData();
    const awardId = formData.get('award_id');
    const awardName = formData.get('award_name');
    const awardDescription = formData.get('award_description');
    const iconEmoji = formData.get('icon_emoji');
    const sortOrder = formData.get('sort_order');

    try {
      await query(`
        UPDATE award_definitions 
        SET 
          award_name = $1,
          award_description = $2,
          icon_emoji = $3,
          sort_order = $4,
          updated_at = CURRENT_TIMESTAMP
        WHERE award_id = $5
      `, [awardName, awardDescription, iconEmoji, sortOrder, awardId]);

      return { success: true };
    } catch (error) {
      console.error('Error updating award:', error);
      return fail(500, { success: false, error: error.message });
    }
  },

  // Add a new custom award
  addAward: async ({ request }) => {
    const formData = await request.formData();
    const awardKey = formData.get('award_key');
    const awardName = formData.get('award_name');
    const awardDescription = formData.get('award_description');
    const awardCategory = formData.get('award_category');
    const iconEmoji = formData.get('icon_emoji') || '🏆';
    const sortOrder = formData.get('sort_order') || 999;

    try {
      await query(`
        INSERT INTO award_definitions 
          (award_key, award_name, award_description, award_category, icon_emoji, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [awardKey, awardName, awardDescription, awardCategory, iconEmoji, sortOrder]);

      return { success: true, message: 'Award created successfully' };
    } catch (error) {
      console.error('Error adding award:', error);
      return fail(500, { success: false, error: error.message });
    }
  }
};