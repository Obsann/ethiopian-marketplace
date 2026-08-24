import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import prisma from '../src/models/prisma';
import { isCloudinaryConfigured, uploadImageBuffer } from '../src/utils/cloudinary';

const CATEGORIES = [
  'Electronics',
  'Clothing',
  'Furniture',
  'Books',
  'Vehicles',
  'Kitchen',
  'Tools',
  'Other',
];

const PLACEHOLDER_DIR = path.join(process.cwd(), 'public', 'placeholders');
const PLACEHOLDER_COLORS = ['#C2410C', '#0F766E', '#7C3AED', '#B45309', '#1D4ED8'];

function publicBaseUrl(): string {
  return (process.env.BACKEND_PUBLIC_URL || `http://localhost:${process.env.PORT || 4000}`).replace(
    /\/$/,
    ''
  );
}

function listingPlaceholderSvg(label: string, color: string): Buffer {
  const safe = label.replace(/[<>&]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="${color}"/>
  <text x="400" y="300" text-anchor="middle" fill="#ffffff" font-family="system-ui,sans-serif" font-size="32">${safe}</text>
  <text x="400" y="340" text-anchor="middle" fill="#ffffff" font-family="system-ui,sans-serif" font-size="18" opacity="0.85">SuqET seed listing</text>
</svg>`;
  return Buffer.from(svg);
}

function ensureLocalPlaceholderUrls(labels: string[]): string[] {
  fs.mkdirSync(PLACEHOLDER_DIR, { recursive: true });
  return labels.map((label, i) => {
    const filename = `listing-${i + 1}.svg`;
    fs.writeFileSync(
      path.join(PLACEHOLDER_DIR, filename),
      listingPlaceholderSvg(label, PLACEHOLDER_COLORS[i % PLACEHOLDER_COLORS.length])
    );
    return `${publicBaseUrl()}/placeholders/${filename}`;
  });
}

async function resolveListingImageUrls(labels: string[]): Promise<string[]> {
  const localUrls = ensureLocalPlaceholderUrls(labels);
  if (!isCloudinaryConfigured()) {
    console.log('Seed images: local placeholders (Cloudinary not set).');
    return localUrls;
  }
  try {
    const uploaded: string[] = [];
    for (let i = 0; i < labels.length; i++) {
      const buf = listingPlaceholderSvg(labels[i], PLACEHOLDER_COLORS[i % PLACEHOLDER_COLORS.length]);
      uploaded.push(await uploadImageBuffer(buf, 'ethiopian-marketplace/seed'));
    }
    console.log('Seed images: uploaded to Cloudinary.');
    return uploaded;
  } catch (err) {
    console.warn(
      'Cloudinary seed upload failed; using local placeholders.',
      err instanceof Error ? err.message : ''
    );
    return localUrls;
  }
}

async function main() {
  if (process.env.NODE_ENV === 'production' && process.env.FORCE_SEED !== 'true') {
    throw new Error('Refusing to seed in production. Set FORCE_SEED=true to override.');
  }

  await prisma.oAuthExchangeCode.deleteMany();
  await prisma.emailVerificationToken.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.report.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.image.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const password_hash = await bcrypt.hash('Password123!', 10);

  const sellers = await Promise.all(
    [
      { name: 'Abebe Kebede', email: 'abebe@seller.et', phone: '+251911000001', location: 'Addis Ababa' },
      { name: 'Tigist Haile', email: 'tigist@seller.et', phone: '+251911000002', location: 'Jimma' },
      { name: 'Dawit Mekonnen', email: 'dawit@seller.et', phone: '+251911000003', location: 'Hawassa' },
    ].map((s) =>
      prisma.user.create({
        data: {
          name: s.name,
          email: s.email,
          phone: s.phone,
          password_hash,
          role: 'seller',
          is_verified: true,
        },
      })
    )
  );

  const buyers = await Promise.all(
    [
      { name: 'Sara Alemu', email: 'sara@buyer.et', phone: '+251922000001' },
      { name: 'Yonas Bekele', email: 'yonas@buyer.et', phone: '+251922000002' },
      { name: 'Hanna Girma', email: 'hanna@buyer.et', phone: '+251922000003' },
    ].map((b) =>
      prisma.user.create({
        data: {
          name: b.name,
          email: b.email,
          phone: b.phone,
          password_hash,
          role: 'buyer',
        },
      })
    )
  );

  await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@marketplace.et',
      phone: '+251900000000',
      password_hash,
      role: 'admin',
      is_verified: true,
    },
  });

  const categories = await Promise.all(
    CATEGORIES.map((name) => prisma.category.create({ data: { name } }))
  );

  const products = [
    { title: 'Samsung Galaxy A14', desc: 'Lightly used phone, battery healthy, includes charger.', price: 8500, condition: 'like_new' as const, cat: 'Electronics', loc: 'Addis Ababa', seller: 0 },
    { title: 'Traditional Habesha Kemis', desc: 'Handwoven kemis, worn once for holiday.', price: 4200, condition: 'good' as const, cat: 'Clothing', loc: 'Addis Ababa', seller: 0 },
    { title: 'Wooden Coffee Table', desc: 'Solid wood table, minor scratches, perfect for living room.', price: 6500, condition: 'good' as const, cat: 'Furniture', loc: 'Jimma', seller: 1 },
    { title: 'Amharic Novel Bundle', desc: '5 popular Amharic novels in good condition.', price: 900, condition: 'fair' as const, cat: 'Books', loc: 'Hawassa', seller: 2 },
    { title: 'Yamaha Motorcycle Helmet', desc: 'Full-face helmet, size L, barely used.', price: 2800, condition: 'like_new' as const, cat: 'Vehicles', loc: 'Addis Ababa', seller: 0 },
    { title: 'Injera Mitad (Electric)', desc: 'Electric mitad for injera, works perfectly.', price: 3500, condition: 'good' as const, cat: 'Kitchen', loc: 'Hawassa', seller: 2 },
    { title: 'Toolbox Set 48pcs', desc: 'Complete hand tool set for home repairs.', price: 2100, condition: 'new' as const, cat: 'Tools', loc: 'Jimma', seller: 1 },
    { title: 'HP Laptop 15s', desc: 'i5, 8GB RAM, 256GB SSD. Good for students.', price: 18500, condition: 'good' as const, cat: 'Electronics', loc: 'Addis Ababa', seller: 1 },
    { title: 'Kids Bicycle', desc: '16-inch kids bike, training wheels included.', price: 3200, condition: 'fair' as const, cat: 'Other', loc: 'Jimma', seller: 2 },
    { title: 'Sofa Set 3-Seater', desc: 'Comfortable fabric sofa, no tears, pickup only.', price: 12000, condition: 'good' as const, cat: 'Furniture', loc: 'Addis Ababa', seller: 0 },
  ];

  const imageUrls = await resolveListingImageUrls([
    'Phone',
    'Watch',
    'Headphones',
    'Shoes',
    'Bag',
  ]);

  const listings = [];
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const category = categories.find((c) => c.name === p.cat)!;
    const listing = await prisma.listing.create({
      data: {
        title: p.title,
        description: p.desc,
        price: p.price,
        condition: p.condition,
        category_id: category.id,
        location: p.loc,
        seller_id: sellers[p.seller].id,
        images: {
          create: [
            { url: imageUrls[i % imageUrls.length], is_primary: true },
            { url: imageUrls[(i + 1) % imageUrls.length], is_primary: false },
          ],
        },
      },
    });
    listings.push(listing);
  }

  await prisma.message.createMany({
    data: [
      {
        sender_id: buyers[0].id,
        receiver_id: sellers[0].id,
        listing_id: listings[0].id,
        content: 'Hi Abebe, is the Galaxy A14 still available?',
      },
      {
        sender_id: sellers[0].id,
        receiver_id: buyers[0].id,
        listing_id: listings[0].id,
        content: 'Yes Sara, still available. Can meet in Bole.',
      },
      {
        sender_id: buyers[1].id,
        receiver_id: sellers[1].id,
        listing_id: listings[2].id,
        content: 'Can you deliver the coffee table to Merkato area?',
      },
    ],
  });

  await prisma.transaction.create({
    data: {
      listing_id: listings[3].id,
      buyer_id: buyers[2].id,
      seller_id: sellers[2].id,
      amount: products[3].price,
      chapa_ref: 'seed-completed-tx-001',
      status: 'released',
    },
  });

  await prisma.listing.update({
    where: { id: listings[3].id },
    data: { status: 'sold' },
  });

  console.log('Seed complete. Wipes existing marketplace rows (dev only unless FORCE_SEED=true).');
  console.log('Sellers:', sellers.map((s) => s.email).join(', '));
  console.log('Buyers:', buyers.map((b) => b.email).join(', '));
  console.log('Admin: admin@marketplace.et / Password123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
