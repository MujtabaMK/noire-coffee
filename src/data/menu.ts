import type { StaticImageData } from "next/image";
import espresso from "../../public/images/menu-espresso.jpg";
import americano from "../../public/images/menu-americano.jpg";
import cappuccino from "../../public/images/menu-cappuccino.jpg";
import latte from "../../public/images/menu-latte.jpg";
import spanishLatte from "../../public/images/menu-spanish-latte.jpg";
import mocha from "../../public/images/menu-mocha.jpg";

/**
 * Signature menu — edit names, notes, prices and images here.
 * Prices are in Indian Rupees.
 */
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  notes: string;
  price: number;
  image: StaticImageData;
  imageAlt: string;
}

export const CURRENCY = "₹";

export const menu: MenuItem[] = [
  {
    id: "espresso",
    name: "Espresso",
    description: "A concentrated, velvet-bodied shot with a thick hazel crema.",
    notes: "Dark cocoa · Molasses",
    price: 120,
    image: espresso,
    imageAlt: "Espresso with rich crema seen from above",
  },
  {
    id: "americano",
    name: "Americano",
    description: "Our house espresso lengthened with hot water — clean and quietly bold.",
    notes: "Roasted almond · Cedar",
    price: 150,
    image: americano,
    imageAlt: "Black Americano in a white porcelain cup",
  },
  {
    id: "cappuccino",
    name: "Cappuccino",
    description: "Equal parts espresso, silken milk and a cloud of microfoam.",
    notes: "Caramel · Toasted hazelnut",
    price: 180,
    image: cappuccino,
    imageAlt: "Cappuccino with latte art on a dark wooden table",
  },
  {
    id: "cafe-latte",
    name: "Café Latte",
    description: "A gentle, creamy cup — double ristretto beneath steamed milk.",
    notes: "Milk chocolate · Honey",
    price: 190,
    image: latte,
    imageAlt: "Café latte in a glass with a rosetta pattern",
  },
  {
    id: "spanish-latte",
    name: "Spanish Latte",
    description: "Espresso layered over chilled milk and slow-cooked condensed milk.",
    notes: "Dulce de leche · Vanilla",
    price: 220,
    image: spanishLatte,
    imageAlt: "Iced Spanish latte with layers of espresso and milk",
  },
  {
    id: "mocha",
    name: "Mocha",
    description: "Single-origin dark chocolate melted into espresso and steamed milk.",
    notes: "70% cacao · Orange zest",
    price: 230,
    image: mocha,
    imageAlt: "Iced mocha with a paper straw",
  },
];

export const formatPrice = (n: number) => `${CURRENCY}${n}`;
