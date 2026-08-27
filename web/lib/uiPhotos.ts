/** Static UI photos on Cloudinary, matched to SuqET categories and seed products. */

export const UI_PHOTOS = {
  hero: 'https://res.cloudinary.com/dfghwzinf/image/upload/v1787781695/suqet/ui/hero-market.jpg',
  sell: 'https://res.cloudinary.com/dfghwzinf/image/upload/v1787781722/suqet/ui/sell-market.jpg',
  samsung: 'https://res.cloudinary.com/dfghwzinf/image/upload/v1787781697/suqet/ui/samsung-phone.jpg',
  kemis: 'https://res.cloudinary.com/dfghwzinf/image/upload/v1787784544/suqet/ui/habesha-kemis.jpg',
  table: 'https://res.cloudinary.com/dfghwzinf/image/upload/v1787781698/suqet/ui/coffee-table.jpg',
  books: 'https://res.cloudinary.com/dfghwzinf/image/upload/v1787785916/suqet/ui/amharic-books.jpg',
  helmet: 'https://res.cloudinary.com/dfghwzinf/image/upload/v1787781723/suqet/ui/moto-helmet.jpg',
  mitad: 'https://res.cloudinary.com/dfghwzinf/image/upload/v1787788981/suqet/ui/injera-mitad.jpg',
  toolbox: 'https://res.cloudinary.com/dfghwzinf/image/upload/v1787781702/suqet/ui/toolbox.jpg',
  laptop: 'https://res.cloudinary.com/dfghwzinf/image/upload/v1787781702/suqet/ui/hp-laptop.jpg',
  bike: 'https://res.cloudinary.com/dfghwzinf/image/upload/v1787781703/suqet/ui/kids-bike.jpg',
  sofa: 'https://res.cloudinary.com/dfghwzinf/image/upload/v1787781704/suqet/ui/sofa.jpg',
  jebena: 'https://res.cloudinary.com/dfghwzinf/image/upload/v1787785918/suqet/ui/jebena.jpg',
  tv: 'https://res.cloudinary.com/dfghwzinf/image/upload/v1787781959/suqet/ui/led-tv.jpg',
  guitar: 'https://res.cloudinary.com/dfghwzinf/image/upload/v1787781960/suqet/ui/guitar.jpg',
  backpack: 'https://res.cloudinary.com/dfghwzinf/image/upload/v1787781977/suqet/ui/backpack.jpg',
  camera: 'https://res.cloudinary.com/dfghwzinf/image/upload/v1787781961/suqet/ui/camera.jpg',
  jacket: 'https://res.cloudinary.com/dfghwzinf/image/upload/v1787782826/suqet/ui/leather-jacket.jpg',
  chair: 'https://res.cloudinary.com/dfghwzinf/image/upload/v1787781963/suqet/ui/office-chair.jpg',
  tablet: 'https://res.cloudinary.com/dfghwzinf/image/upload/v1787781964/suqet/ui/tablet.jpg',
  netela: 'https://res.cloudinary.com/dfghwzinf/image/upload/v1787782824/suqet/ui/netela.jpg',
  stroller: 'https://res.cloudinary.com/dfghwzinf/image/upload/v1787781965/suqet/ui/stroller.jpg',
} as const;

export const CATEGORY_PHOTOS: Record<string, string> = {
  Electronics: UI_PHOTOS.samsung,
  Clothing: UI_PHOTOS.kemis,
  Furniture: UI_PHOTOS.sofa,
  Books: UI_PHOTOS.books,
  Vehicles: UI_PHOTOS.helmet,
  Kitchen: UI_PHOTOS.mitad,
  Tools: UI_PHOTOS.toolbox,
  Other: UI_PHOTOS.bike,
};

export type DemoSellerKey = 'abebe' | 'tigist';

export interface CatalogItem {
  title: string;
  price: number;
  location: string;
  condition: 'new' | 'like_new' | 'good' | 'fair';
  image: string;
  category: string;
  seller: DemoSellerKey;
  description: string;
  meetup_ok?: boolean;
  delivery_ok?: boolean;
  delivery_fee?: number | null;
  size?: string | null;
}

/** Names match the original SuqET seed catalog. Split between Abebe and Tigist. */
export const DEMO_CATALOG: CatalogItem[] = [
  {
    title: 'Samsung Galaxy A14',
    price: 8500,
    location: 'Addis Ababa',
    condition: 'like_new',
    image: UI_PHOTOS.samsung,
    category: 'Electronics',
    seller: 'abebe',
    description:
      'Lightly used Galaxy A14. Battery is healthy, no cracks on the screen. Charger in the box. We can meet in Bole or Megenagna.',
    meetup_ok: true,
    delivery_ok: false,
  },
  {
    title: 'Traditional Habesha Kemis',
    price: 4200,
    location: 'Jimma',
    condition: 'good',
    image: UI_PHOTOS.kemis,
    category: 'Clothing',
    seller: 'tigist',
    description:
      'Handwoven kemis, worn once for the holiday. Clean, no stains. Message me for measurements before you come.',
    meetup_ok: true,
    delivery_ok: true,
    delivery_fee: 120,
    size: 'M',
  },
  {
    title: 'Wooden Coffee Table',
    price: 6500,
    location: 'Jimma',
    condition: 'good',
    image: UI_PHOTOS.table,
    category: 'Furniture',
    seller: 'tigist',
    description:
      'Solid wood table, a few light scratches. Pickup in Jimma — too heavy to ship unless we agree in chat.',
    meetup_ok: true,
    delivery_ok: false,
  },
  {
    title: 'Amharic Novel Bundle',
    price: 900,
    location: 'Hawassa',
    condition: 'fair',
    image: UI_PHOTOS.books,
    category: 'Books',
    seller: 'tigist',
    description:
      'Five popular Amharic novels. Pages are clean, covers show normal wear. Easy to send within Hawassa or by bus.',
    meetup_ok: true,
    delivery_ok: true,
    delivery_fee: 80,
  },
  {
    title: 'Yamaha Motorcycle Helmet',
    price: 2800,
    location: 'Addis Ababa',
    condition: 'like_new',
    image: UI_PHOTOS.helmet,
    category: 'Vehicles',
    seller: 'abebe',
    description:
      'Full-face Yamaha helmet, size L. Worn a handful of times. Meet near Megenagna or CMC.',
    meetup_ok: true,
    delivery_ok: false,
  },
  {
    title: 'Injera Mitad (Electric)',
    price: 3500,
    location: 'Bahir Dar',
    condition: 'good',
    image: UI_PHOTOS.mitad,
    category: 'Kitchen',
    seller: 'tigist',
    description:
      'Electric mitad, heats evenly, works every day in our kitchen. Pickup in Bahir Dar; I can help load a taxi.',
    meetup_ok: true,
    delivery_ok: false,
  },
  {
    title: 'Toolbox Set 48pcs',
    price: 2100,
    location: 'Jimma',
    condition: 'new',
    image: UI_PHOTOS.toolbox,
    category: 'Tools',
    seller: 'tigist',
    description:
      'Unopened 48-piece home tool set. Sockets, screwdrivers, and a case. Meet in town or I can send with a driver.',
    meetup_ok: true,
    delivery_ok: true,
    delivery_fee: 120,
  },
  {
    title: 'HP Laptop 15s',
    price: 18500,
    location: 'Mekelle',
    condition: 'good',
    image: UI_PHOTOS.laptop,
    category: 'Electronics',
    seller: 'abebe',
    description:
      'i5, 8GB RAM, 256GB SSD. Good for class and office work. Charger included. Meet on campus or around town.',
    meetup_ok: true,
    delivery_ok: true,
    delivery_fee: 250,
  },
  {
    title: 'Kids Bicycle',
    price: 3200,
    location: 'Gondar',
    condition: 'fair',
    image: UI_PHOTOS.bike,
    category: 'Other',
    seller: 'tigist',
    description:
      '16-inch kids bike with training wheels. Tires hold air. Best as a meetup in Gondar — I can bring it to Piassa.',
    meetup_ok: true,
    delivery_ok: false,
  },
  {
    title: 'Sofa Set 3-Seater',
    price: 12000,
    location: 'Addis Ababa',
    condition: 'good',
    image: UI_PHOTOS.sofa,
    category: 'Furniture',
    seller: 'abebe',
    description:
      'Comfortable fabric 3-seater, no tears. Pickup only from Kazanchis — bring a bajaj or a small truck.',
    meetup_ok: true,
    delivery_ok: false,
  },
  {
    title: 'Jebena Coffee Pot',
    price: 1800,
    location: 'Jimma',
    condition: 'good',
    image: UI_PHOTOS.jebena,
    category: 'Kitchen',
    seller: 'tigist',
    description:
      'Clay jebena from Jimma. Used for family buna, no cracks. Easy to carry — meetup or a small delivery fee.',
    meetup_ok: true,
    delivery_ok: true,
    delivery_fee: 90,
  },
  {
    title: '32-inch LED TV',
    price: 9500,
    location: 'Dire Dawa',
    condition: 'like_new',
    image: UI_PHOTOS.tv,
    category: 'Electronics',
    seller: 'abebe',
    description:
      '32-inch LED, remote included, barely used. Meet in Kezira. I can help arrange a taxi to Harar if we agree.',
    meetup_ok: true,
    delivery_ok: true,
    delivery_fee: 400,
  },
  {
    title: 'Acoustic Guitar',
    price: 4500,
    location: 'Hawassa',
    condition: 'good',
    image: UI_PHOTOS.guitar,
    category: 'Other',
    seller: 'abebe',
    description:
      'Full-size acoustic, stays in tune. A small scratch on the body. Meet by the lake or at Atote.',
    meetup_ok: true,
    delivery_ok: true,
    delivery_fee: 150,
  },
  {
    title: 'School Backpack',
    price: 750,
    location: 'Gondar',
    condition: 'fair',
    image: UI_PHOTOS.backpack,
    category: 'Other',
    seller: 'abebe',
    description:
      'Sturdy school bag, zippers work. Normal wear from a year of class. Easy meetup near the university.',
    meetup_ok: true,
    delivery_ok: true,
    delivery_fee: 70,
  },
  {
    title: 'Canon EOS Camera',
    price: 22000,
    location: 'Addis Ababa',
    condition: 'like_new',
    image: UI_PHOTOS.camera,
    category: 'Electronics',
    seller: 'abebe',
    description:
      'Canon EOS with kit lens. Shutter count is low. Come try it in Bole — bring a card if you want to test shots.',
    meetup_ok: true,
    delivery_ok: false,
  },
  {
    title: 'Leather Jacket',
    price: 3800,
    location: 'Addis Ababa',
    condition: 'good',
    image: UI_PHOTOS.jacket,
    category: 'Clothing',
    seller: 'abebe',
    description:
      'Real leather jacket, size L. Soft, no rips. Meet in Piassa or 4 Kilo so you can try it on.',
    meetup_ok: true,
    delivery_ok: true,
    delivery_fee: 100,
    size: 'L',
  },
  {
    title: 'Office Chair',
    price: 2400,
    location: 'Mekelle',
    condition: 'good',
    image: UI_PHOTOS.chair,
    category: 'Furniture',
    seller: 'tigist',
    description:
      'Rolling office chair, height adjusts, wheels still smooth. Pickup in Mekelle; I can help get it downstairs.',
    meetup_ok: true,
    delivery_ok: true,
    delivery_fee: 200,
  },
  {
    title: 'Samsung Tablet',
    price: 7200,
    location: 'Bahir Dar',
    condition: 'like_new',
    image: UI_PHOTOS.tablet,
    category: 'Electronics',
    seller: 'abebe',
    description:
      'Samsung tablet, screen protector on, charger included. Meet near the university or the lake road.',
    meetup_ok: true,
    delivery_ok: true,
    delivery_fee: 200,
  },
  {
    title: 'Cotton Netela Shawl',
    price: 1100,
    location: 'Dire Dawa',
    condition: 'new',
    image: UI_PHOTOS.netela,
    category: 'Clothing',
    seller: 'tigist',
    description:
      'New cotton netela, never worn. Soft weave, ready for church or a holiday. Easy to send or meet in Kezira.',
    meetup_ok: true,
    delivery_ok: true,
    delivery_fee: 80,
  },
  {
    title: 'Baby Stroller',
    price: 3900,
    location: 'Hawassa',
    condition: 'fair',
    image: UI_PHOTOS.stroller,
    category: 'Other',
    seller: 'tigist',
    description:
      'Folds down, wheels roll. Used for one child. Meet in Hawassa — I can show you how it folds in person.',
    meetup_ok: true,
    delivery_ok: false,
  },
];
