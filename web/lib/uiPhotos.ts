/** Static UI photos hosted on Cloudinary (copied from the original Unsplash seed/hero). */
export const UI_PHOTOS = {
  hero: 'https://res.cloudinary.com/dfghwzinf/image/upload/v1787780944/suqet/ui/hero.jpg',
  phone: 'https://res.cloudinary.com/dfghwzinf/image/upload/v1787780945/suqet/ui/phone.jpg',
  watch: 'https://res.cloudinary.com/dfghwzinf/image/upload/v1787780946/suqet/ui/watch.jpg',
  headphones: 'https://res.cloudinary.com/dfghwzinf/image/upload/v1787780946/suqet/ui/headphones.jpg',
  sneakers: 'https://res.cloudinary.com/dfghwzinf/image/upload/v1787780947/suqet/ui/sneakers.jpg',
  shoes: 'https://res.cloudinary.com/dfghwzinf/image/upload/v1787780949/suqet/ui/shoes.jpg',
} as const;

export const CATEGORY_PHOTOS: Record<string, string> = {
  Electronics: UI_PHOTOS.phone,
  Clothing: UI_PHOTOS.sneakers,
  Furniture: UI_PHOTOS.shoes,
  Books: UI_PHOTOS.watch,
  Vehicles: UI_PHOTOS.hero,
  Kitchen: UI_PHOTOS.headphones,
  Tools: UI_PHOTOS.headphones,
  Other: UI_PHOTOS.shoes,
};
