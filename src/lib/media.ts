export const foodMedia = {
  charcuterieBox: "/food/charcuterie-spread.jpg",
  charcuteriePlatter: "/food/charcuterie-platter.jpg",
  miniPancakes: "/food/mini-pancakes.jpg",
  fruitSodaBottles: "/food/fruit-soda-bottles.jpg",
  dirtySodaFloat: "/food/dirty-soda-float.jpg",
} as const;

export const clientMedia = {
  cartDirtySodaHero: "/client/cart-dirty-soda-hero.jpg",
  cartUmbrellaWide: "/client/cart-umbrella-wide.jpg",
  miniPancakeBar: "/client/mini-pancake-bar.jpg",
  dirtySodaAndCharcuterieBox: "/client/dirty-soda-and-charcuterie-box.jpg",
  charcuterieCupCloseup: "/client/charcuterie-cup-closeup.jpg",
  charcuterieCupDetail: "/client/charcuterie-cup-detail.jpg",
} as const;

export const lifestyleGrid = [
  clientMedia.cartDirtySodaHero,
  foodMedia.charcuterieBox,
  clientMedia.miniPancakeBar,
  clientMedia.dirtySodaAndCharcuterieBox,
] as const;

export const cartGallery = [
  clientMedia.cartUmbrellaWide,
  clientMedia.cartDirtySodaHero,
  clientMedia.miniPancakeBar,
  clientMedia.dirtySodaAndCharcuterieBox,
] as const;
