import 'dotenv/config';
import prisma from '../src/models/prisma';
import { runDemoSeed } from '../src/utils/demoSeed';

/**
 * Demo accounts (same password for every seeded user): Password123!
 * Admin: admin@marketplace.et
 * Sellers: abebe@seller.et, tigist@seller.et
 * Buyers: sara@buyer.et, yonas@buyer.et
 *
 * Production: NODE_ENV=production refuses unless FORCE_SEED=true.
 * On Render, set FORCE_SEED=true and redeploy — the API upserts these users on boot.
 */
async function main() {
  if (process.env.NODE_ENV === 'production' && process.env.FORCE_SEED !== 'true') {
    console.error('Refusing to seed in production. Set FORCE_SEED=true to override.');
    process.exit(1);
  }

  await runDemoSeed({ resetListings: true });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
