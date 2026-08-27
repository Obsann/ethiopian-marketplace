import bcrypt from 'bcryptjs';
import prisma from '../models/prisma';

/** Demo password for every upserted account: Password123! (admin@marketplace.et, sellers, buyers). */

const CATEGORY_IDS: Record<string, string> = {
  Electronics: 'a1b2c3d4-e5f6-7890-abcd-000000000001',
  Clothing: 'a1b2c3d4-e5f6-7890-abcd-000000000002',
  Furniture: 'a1b2c3d4-e5f6-7890-abcd-000000000003',
  Books: 'a1b2c3d4-e5f6-7890-abcd-000000000004',
  Vehicles: 'a1b2c3d4-e5f6-7890-abcd-000000000005',
  Kitchen: 'a1b2c3d4-e5f6-7890-abcd-000000000006',
  Tools: 'a1b2c3d4-e5f6-7890-abcd-000000000007',
  Other: 'a1b2c3d4-e5f6-7890-abcd-000000000008',
};

/** Keep in sync with web/lib/uiPhotos.ts DEMO_CATALOG. Index 0 is newest (Amharic books). */
const PRODUCTS = [
  {
    title: 'Amharic Novel Bundle',
    description:
      'Five popular Amharic novels. Pages are clean, covers show normal wear. Easy to send within Hawassa or by bus.',
    price: 900,
    condition: 'fair' as const,
    category: 'Books',
    location: 'Hawassa',
    seller: 'tigist' as const,
    image: 'https://res.cloudinary.com/dfghwzinf/image/upload/v1787785916/suqet/ui/amharic-books.jpg',
    meetup_ok: true,
    delivery_ok: true,
    delivery_fee: 80,
    size: null as string | null,
  },
  {
    title: 'Traditional Habesha Kemis',
    description:
      'Handwoven kemis, worn once for the holiday. Clean, no stains. Message me for measurements before you come.',
    price: 4200,
    condition: 'good' as const,
    category: 'Clothing',
    location: 'Jimma',
    seller: 'tigist' as const,
    image: 'https://res.cloudinary.com/dfghwzinf/image/upload/v1787784544/suqet/ui/habesha-kemis.jpg',
    meetup_ok: true,
    delivery_ok: true,
    delivery_fee: 120,
    size: 'M',
  },
  {
    title: 'Samsung Galaxy A14',
    description:
      'Lightly used Galaxy A14. Battery is healthy, no cracks on the screen. Charger in the box. We can meet in Bole or Megenagna.',
    price: 8500,
    condition: 'like_new' as const,
    category: 'Electronics',
    location: 'Addis Ababa',
    seller: 'abebe' as const,
    image: 'https://res.cloudinary.com/dfghwzinf/image/upload/v1787781697/suqet/ui/samsung-phone.jpg',
    meetup_ok: true,
    delivery_ok: false,
    delivery_fee: null as number | null,
    size: null as string | null,
  },
  {
    title: 'Wooden Coffee Table',
    description:
      'Solid wood table, a few light scratches. Pickup in Jimma — too heavy to ship unless we agree in chat.',
    price: 6500,
    condition: 'good' as const,
    category: 'Furniture',
    location: 'Jimma',
    seller: 'tigist' as const,
    image: 'https://res.cloudinary.com/dfghwzinf/image/upload/v1787781698/suqet/ui/coffee-table.jpg',
    meetup_ok: true,
    delivery_ok: false,
    delivery_fee: null,
    size: null,
  },
  {
    title: 'Yamaha Motorcycle Helmet',
    description:
      'Full-face Yamaha helmet, size L. Worn a handful of times. Meet near Megenagna or CMC.',
    price: 2800,
    condition: 'like_new' as const,
    category: 'Vehicles',
    location: 'Addis Ababa',
    seller: 'abebe' as const,
    image: 'https://res.cloudinary.com/dfghwzinf/image/upload/v1787781723/suqet/ui/moto-helmet.jpg',
    meetup_ok: true,
    delivery_ok: false,
    delivery_fee: null,
    size: null,
  },
  {
    title: 'Injera Mitad (Electric)',
    description:
      'Electric mitad, heats evenly, works every day in our kitchen. Pickup in Bahir Dar; I can help load a taxi.',
    price: 3500,
    condition: 'good' as const,
    category: 'Kitchen',
    location: 'Bahir Dar',
    seller: 'tigist' as const,
    image: 'https://res.cloudinary.com/dfghwzinf/image/upload/v1787788981/suqet/ui/injera-mitad.jpg',
    meetup_ok: true,
    delivery_ok: false,
    delivery_fee: null,
    size: null,
  },
  {
    title: 'Toolbox Set 48pcs',
    description:
      'Unopened 48-piece home tool set. Sockets, screwdrivers, and a case. Meet in town or I can send with a driver.',
    price: 2100,
    condition: 'new' as const,
    category: 'Tools',
    location: 'Jimma',
    seller: 'tigist' as const,
    image: 'https://res.cloudinary.com/dfghwzinf/image/upload/v1787781702/suqet/ui/toolbox.jpg',
    meetup_ok: true,
    delivery_ok: true,
    delivery_fee: 120,
    size: null,
  },
  {
    title: 'HP Laptop 15s',
    description:
      'i5, 8GB RAM, 256GB SSD. Good for class and office work. Charger included. Meet on campus or around town.',
    price: 18500,
    condition: 'good' as const,
    category: 'Electronics',
    location: 'Mekelle',
    seller: 'abebe' as const,
    image: 'https://res.cloudinary.com/dfghwzinf/image/upload/v1787781702/suqet/ui/hp-laptop.jpg',
    meetup_ok: true,
    delivery_ok: true,
    delivery_fee: 250,
    size: null,
  },
  {
    title: 'Kids Bicycle',
    description:
      '16-inch kids bike with training wheels. Tires hold air. Best as a meetup in Gondar — I can bring it to Piassa.',
    price: 3200,
    condition: 'fair' as const,
    category: 'Other',
    location: 'Gondar',
    seller: 'tigist' as const,
    image: 'https://res.cloudinary.com/dfghwzinf/image/upload/v1787781703/suqet/ui/kids-bike.jpg',
    meetup_ok: true,
    delivery_ok: false,
    delivery_fee: null,
    size: null,
  },
  {
    title: 'Sofa Set 3-Seater',
    description:
      'Comfortable fabric 3-seater, no tears. Pickup only from Kazanchis — bring a bajaj or a small truck.',
    price: 12000,
    condition: 'good' as const,
    category: 'Furniture',
    location: 'Addis Ababa',
    seller: 'abebe' as const,
    image: 'https://res.cloudinary.com/dfghwzinf/image/upload/v1787781704/suqet/ui/sofa.jpg',
    meetup_ok: true,
    delivery_ok: false,
    delivery_fee: null,
    size: null,
  },
  {
    title: 'Jebena Coffee Pot',
    description:
      'Clay jebena from Jimma. Used for family buna, no cracks. Easy to carry — meetup or a small delivery fee.',
    price: 1800,
    condition: 'good' as const,
    category: 'Kitchen',
    location: 'Jimma',
    seller: 'tigist' as const,
    image: 'https://res.cloudinary.com/dfghwzinf/image/upload/v1787785918/suqet/ui/jebena.jpg',
    meetup_ok: true,
    delivery_ok: true,
    delivery_fee: 90,
    size: null,
  },
  {
    title: '32-inch LED TV',
    description:
      '32-inch LED, remote included, barely used. Meet in Kezira. I can help arrange a taxi to Harar if we agree.',
    price: 9500,
    condition: 'like_new' as const,
    category: 'Electronics',
    location: 'Dire Dawa',
    seller: 'abebe' as const,
    image: 'https://res.cloudinary.com/dfghwzinf/image/upload/v1787781959/suqet/ui/led-tv.jpg',
    meetup_ok: true,
    delivery_ok: true,
    delivery_fee: 400,
    size: null,
  },
  {
    title: 'Acoustic Guitar',
    description:
      'Full-size acoustic, stays in tune. A small scratch on the body. Meet by the lake or at Atote.',
    price: 4500,
    condition: 'good' as const,
    category: 'Other',
    location: 'Hawassa',
    seller: 'abebe' as const,
    image: 'https://res.cloudinary.com/dfghwzinf/image/upload/v1787781960/suqet/ui/guitar.jpg',
    meetup_ok: true,
    delivery_ok: true,
    delivery_fee: 150,
    size: null,
  },
  {
    title: 'School Backpack',
    description:
      'Sturdy school bag, zippers work. Normal wear from a year of class. Easy meetup near the university.',
    price: 750,
    condition: 'fair' as const,
    category: 'Other',
    location: 'Gondar',
    seller: 'abebe' as const,
    image: 'https://res.cloudinary.com/dfghwzinf/image/upload/v1787781977/suqet/ui/backpack.jpg',
    meetup_ok: true,
    delivery_ok: true,
    delivery_fee: 70,
    size: null,
  },
  {
    title: 'Canon EOS Camera',
    description:
      'Canon EOS with kit lens. Shutter count is low. Come try it in Bole — bring a card if you want to test shots.',
    price: 22000,
    condition: 'like_new' as const,
    category: 'Electronics',
    location: 'Addis Ababa',
    seller: 'abebe' as const,
    image: 'https://res.cloudinary.com/dfghwzinf/image/upload/v1787781961/suqet/ui/camera.jpg',
    meetup_ok: true,
    delivery_ok: false,
    delivery_fee: null,
    size: null,
  },
  {
    title: 'Leather Jacket',
    description:
      'Real leather jacket, size L. Soft, no rips. Meet in Piassa or 4 Kilo so you can try it on.',
    price: 3800,
    condition: 'good' as const,
    category: 'Clothing',
    location: 'Addis Ababa',
    seller: 'abebe' as const,
    image: 'https://res.cloudinary.com/dfghwzinf/image/upload/v1787782826/suqet/ui/leather-jacket.jpg',
    meetup_ok: true,
    delivery_ok: true,
    delivery_fee: 100,
    size: 'L',
  },
  {
    title: 'Office Chair',
    description:
      'Rolling office chair, height adjusts, wheels still smooth. Pickup in Mekelle; I can help get it downstairs.',
    price: 2400,
    condition: 'good' as const,
    category: 'Furniture',
    location: 'Mekelle',
    seller: 'tigist' as const,
    image: 'https://res.cloudinary.com/dfghwzinf/image/upload/v1787781963/suqet/ui/office-chair.jpg',
    meetup_ok: true,
    delivery_ok: true,
    delivery_fee: 200,
    size: null,
  },
  {
    title: 'Samsung Tablet',
    description:
      'Samsung tablet, screen protector on, charger included. Meet near the university or the lake road.',
    price: 7200,
    condition: 'like_new' as const,
    category: 'Electronics',
    location: 'Bahir Dar',
    seller: 'abebe' as const,
    image: 'https://res.cloudinary.com/dfghwzinf/image/upload/v1787781964/suqet/ui/tablet.jpg',
    meetup_ok: true,
    delivery_ok: true,
    delivery_fee: 200,
    size: null,
  },
  {
    title: 'Cotton Netela Shawl',
    description:
      'New cotton netela, never worn. Soft weave, ready for church or a holiday. Easy to send or meet in Kezira.',
    price: 1100,
    condition: 'new' as const,
    category: 'Clothing',
    location: 'Dire Dawa',
    seller: 'tigist' as const,
    image: 'https://res.cloudinary.com/dfghwzinf/image/upload/v1787782824/suqet/ui/netela.jpg',
    meetup_ok: true,
    delivery_ok: true,
    delivery_fee: 80,
    size: null,
  },
  {
    title: 'Baby Stroller',
    description:
      'Folds down, wheels roll. Used for one child. Meet in Hawassa — I can show you how it folds in person.',
    price: 3900,
    condition: 'fair' as const,
    category: 'Other',
    location: 'Hawassa',
    seller: 'tigist' as const,
    image: 'https://res.cloudinary.com/dfghwzinf/image/upload/v1787781965/suqet/ui/stroller.jpg',
    meetup_ok: true,
    delivery_ok: false,
    delivery_fee: null,
    size: null,
  },
];

async function upsertUser(data: {
  name: string;
  email: string;
  phone: string;
  password_hash: string;
  role: 'buyer' | 'seller' | 'admin';
  is_verified: boolean;
}) {
  return prisma.user.upsert({
    where: { email: data.email },
    create: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      password_hash: data.password_hash,
      role: data.role,
      is_verified: data.is_verified,
      email_verified: true,
    },
    update: {
      name: data.name,
      password_hash: data.password_hash,
      role: data.role,
      is_verified: data.is_verified,
      email_verified: true,
    },
  });
}

async function ensureCategory(name: string, id: string) {
  const existing = await prisma.category.findFirst({ where: { name } });
  if (existing) return existing;
  return prisma.category.create({ data: { id, name } });
}

/** Newest-first APIs list index 0 first. Keep books as the lead card without wiping listings. */
async function syncDemoCatalogOrder(sellerIds: string[]) {
  const now = Date.now();
  for (let i = 0; i < PRODUCTS.length; i += 1) {
    await prisma.listing.updateMany({
      where: { title: PRODUCTS[i].title, seller_id: { in: sellerIds } },
      data: { created_at: new Date(now - i * 8 * 60 * 60 * 1000) },
    });
  }
}

export async function runDemoSeed(opts?: { resetListings?: boolean }) {
  const resetListings = opts?.resetListings === true;
  const password_hash = await bcrypt.hash('Password123!', 10);

  const abebe = await upsertUser({
    name: 'Abebe Kebede',
    email: 'abebe@seller.et',
    phone: '+251911000001',
    password_hash,
    role: 'seller',
    is_verified: true,
  });
  const tigist = await upsertUser({
    name: 'Tigist Haile',
    email: 'tigist@seller.et',
    phone: '+251911000002',
    password_hash,
    role: 'seller',
    is_verified: true,
  });
  const sara = await upsertUser({
    name: 'Sara Alemu',
    email: 'sara@buyer.et',
    phone: '+251922000001',
    password_hash,
    role: 'buyer',
    is_verified: false,
  });
  const yonas = await upsertUser({
    name: 'Yonas Bekele',
    email: 'yonas@buyer.et',
    phone: '+251922000002',
    password_hash,
    role: 'buyer',
    is_verified: false,
  });
  await upsertUser({
    name: 'Admin User',
    email: 'admin@marketplace.et',
    phone: '+251900000000',
    password_hash,
    role: 'admin',
    is_verified: true,
  });

  const sellers = { abebe, tigist };

  const categories: Record<string, { id: string; name: string }> = {};
  for (const [name, id] of Object.entries(CATEGORY_IDS)) {
    categories[name] = await ensureCategory(name, id);
  }

  const existingCount = await prisma.listing.count();
  if (!resetListings && existingCount > 0) {
    await syncDemoCatalogOrder([abebe.id, tigist.id]);
    console.log('Seed users upserted. Demo listing timestamps synced (Amharic books first).');
    console.log('Sellers: abebe@seller.et, tigist@seller.et');
    console.log('Buyers:  sara@buyer.et, yonas@buyer.et');
    console.log('Admin:   admin@marketplace.et');
    console.log('Password for every seeded account: Password123!');
    return;
  }

  const sellerIds = [abebe.id, tigist.id];
  const oldListings = await prisma.listing.findMany({
    where: { seller_id: { in: sellerIds } },
    select: { id: true },
  });
  const oldIds = oldListings.map((l) => l.id);
  if (oldIds.length > 0) {
    await prisma.message.deleteMany({ where: { listing_id: { in: oldIds } } });
    await prisma.savedListing.deleteMany({ where: { listing_id: { in: oldIds } } });
    await prisma.review.deleteMany({ where: { listing_id: { in: oldIds } } });
    await prisma.transaction.deleteMany({ where: { listing_id: { in: oldIds } } });
    await prisma.image.deleteMany({ where: { listing_id: { in: oldIds } } });
    await prisma.listing.deleteMany({ where: { seller_id: { in: sellerIds } } });
  }

  const created = [];
  for (let i = 0; i < PRODUCTS.length; i += 1) {
    const p = PRODUCTS[i];
    const category = categories[p.category];
    const listing = await prisma.listing.create({
      data: {
        title: p.title,
        description: p.description,
        price: p.price,
        condition: p.condition,
        category_id: category.id,
        location: p.location,
        seller_id: sellers[p.seller].id,
        meetup_ok: p.meetup_ok,
        delivery_ok: p.delivery_ok,
        delivery_fee: p.delivery_ok ? p.delivery_fee : null,
        size: p.size,
        created_at: new Date(Date.now() - i * 8 * 60 * 60 * 1000),
        images: {
          create: [{ url: p.image, is_primary: true }],
        },
      },
    });
    created.push(listing);
  }

  const phoneListing = created.find((l) => l.title === 'Samsung Galaxy A14');
  const tableListing = created.find((l) => l.title === 'Wooden Coffee Table');
  if (phoneListing && tableListing) {
    await prisma.message.createMany({
      data: [
        {
          sender_id: sara.id,
          receiver_id: abebe.id,
          listing_id: phoneListing.id,
          content: 'Hi Abebe, is the Galaxy A14 still available?',
        },
        {
          sender_id: abebe.id,
          receiver_id: sara.id,
          listing_id: phoneListing.id,
          content: 'Yes Sara, still available. Can meet in Bole.',
        },
        {
          sender_id: yonas.id,
          receiver_id: tigist.id,
          listing_id: tableListing.id,
          content: 'Selam Tigist, can I pick up the coffee table this weekend?',
        },
      ],
    });
  }

  console.log('Seed complete.');
  console.log('Sellers: abebe@seller.et, tigist@seller.et');
  console.log('Buyers:  sara@buyer.et, yonas@buyer.et');
  console.log('Admin:   admin@marketplace.et');
  console.log('Password for every seeded account: Password123!');
  console.log(`Listings: ${created.length} (Abebe ${created.filter((_, i) => PRODUCTS[i].seller === 'abebe').length}, Tigist ${created.filter((_, i) => PRODUCTS[i].seller === 'tigist').length})`);
}
