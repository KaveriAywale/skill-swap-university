'use strict';

const { CATEGORIES, SKILL_CATALOG } = require('../constants/skillCatalog');
const { Category, Skill } = require('../models');

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Ensures the base skill catalogue (categories + skills) exists.
 *
 * The catalogue is product configuration, not demo data, so it is upserted on
 * every boot. This keeps a fresh database fully usable (onboarding, discover,
 * offers) without requiring the demo seeder. Safe to run repeatedly.
 */
async function ensureCatalogSeeded() {
  const categoryOps = CATEGORIES.map((cat, i) => ({
    updateOne: {
      filter: { key: cat.key },
      update: { $set: { ...cat, order: i } },
      upsert: true,
    },
  }));
  if (categoryOps.length) await Category.bulkWrite(categoryOps, { ordered: false });

  const skillOps = SKILL_CATALOG.map((s) => {
    const slug = slugify(s.name);
    return {
      updateOne: {
        filter: { slug },
        update: { $setOnInsert: { ...s, slug, isActive: true } },
        upsert: true,
      },
    };
  });
  if (skillOps.length) await Skill.bulkWrite(skillOps, { ordered: false });
}

module.exports = { ensureCatalogSeeded, slugify };
