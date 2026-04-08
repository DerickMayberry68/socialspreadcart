export const foodMedia = {
  charcuterieSpread: "/food/charcuterie-spread.jpg",
  charcuteriePlatter: "/food/charcuterie-platter.jpg",
  miniPancakes: "/food/mini-pancakes.jpg",
  fruitSodaBottles: "/food/fruit-soda-bottles.jpg",
  dirtySodaFloat: "/food/dirty-soda-float.jpg",
} as const;

export const lifestyleGrid = [
  foodMedia.charcuterieSpread,
  foodMedia.dirtySodaFloat,
  foodMedia.miniPancakes,
  foodMedia.fruitSodaBottles,
] as const;

export const cartGallery = [
  foodMedia.charcuteriePlatter,
  foodMedia.miniPancakes,
  foodMedia.dirtySodaFloat,
  foodMedia.charcuterieSpread,
] as const;
