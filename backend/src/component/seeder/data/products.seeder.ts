import { EStatus, PrismaClient } from 'src/generated/prisma/client';

const UNSPLASH_IMAGES = [
  'https://images.unsplash.com/photo-1516652695352-6118f7cc1a07?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1615329028188-4ae392fd75d2?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1615378809683-6737a9e362f2?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1624451322046-a31372fa6e3e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1615286922420-c6b348ffbd62?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1615529328331-f8917597711f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1507940317731-997f3d05f20d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1556760544-74068565f05c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1600585152915-d208bec867a1?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
] as const;

type CategorySeed = {
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
};

const CATEGORIES: CategorySeed[] = [
  {
    name: 'Laser Cutting',
    slug: 'laser-cutting',
    description: 'Precision laser cutting and engraving on wood, plexiglass and more.',
    sortOrder: 1,
  },
  {
    name: 'Graphic Design',
    slug: 'graphic-design',
    description: 'Logos, brand kits and visual identities crafted for your business.',
    sortOrder: 2,
  },
  {
    name: 'Print on Any Surface',
    slug: 'print-on-any-surface',
    description: 'High-quality printing on mugs, textiles, acrylic and custom media.',
    sortOrder: 3,
  },
  {
    name: 'Gift Ideas',
    slug: 'gift-ideas',
    description: 'Personalized gifts and artisan boxes for every occasion.',
    sortOrder: 4,
  },
  {
    name: 'Vehicle Wrap & Vinyl',
    slug: 'vehicle-wrap-vinyl',
    description: 'Vinyl wraps, stickers and vehicle branding applied with precision.',
    sortOrder: 5,
  },
];

type ProductTemplate = {
  title: string;
  description: string;
  categorySlug: string;
  price: number;
  discountedPrice?: number;
  materials: string[];
  sizes: string[];
  badges: string[];
  hasEngraving: boolean;
  featured?: boolean;
};

const PRODUCT_TEMPLATES: ProductTemplate[] = [
  {
    title: 'Engraved wood keychain',
    description: 'Laser-engraved wooden keychain with a neat finish, ideal for names or logos.',
    categorySlug: 'laser-cutting',
    price: 18,
    materials: ['Wood'],
    sizes: ['Small', 'Medium'],
    badges: ['Customizable', 'Bestseller'],
    hasEngraving: true,
    featured: true,
  },
  {
    title: 'Plexiglass wall clock',
    description: 'Laser-cut plexiglass clock with precise finishes for modern interiors.',
    categorySlug: 'laser-cutting',
    price: 95,
    discountedPrice: 79,
    materials: ['Plexiglass'],
    sizes: ['30cm', '40cm'],
    badges: ['Popular'],
    hasEngraving: true,
    featured: true,
  },
  {
    title: 'Wooden quote board',
    description: 'Inspirational quote engraved on solid wood for your wall.',
    categorySlug: 'laser-cutting',
    price: 65,
    materials: ['Wood'],
    sizes: ['A4', 'A3'],
    badges: ['New'],
    hasEngraving: true,
  },
  {
    title: 'Laser-cut décor lamp',
    description: 'Ambient lamp with carved geometric patterns, crafted in our Sfax workshop.',
    categorySlug: 'laser-cutting',
    price: 120,
    materials: ['Wood', 'Plexiglass'],
    sizes: ['One size'],
    badges: ['Bestseller'],
    hasEngraving: false,
    featured: true,
  },
  {
    title: 'Plexiglass wedding seating chart',
    description: 'Elegant engraved plexiglass panel for wedding and event seating plans.',
    categorySlug: 'laser-cutting',
    price: 180,
    materials: ['Plexiglass'],
    sizes: ['A2', 'A1'],
    badges: ['Customizable'],
    hasEngraving: true,
  },
  {
    title: 'Engraved jewelry box',
    description: 'Wooden jewelry box with custom laser engraving on the lid.',
    categorySlug: 'laser-cutting',
    price: 85,
    discountedPrice: 72,
    materials: ['Wood'],
    sizes: ['Small', 'Large'],
    badges: ['Customizable', 'Popular'],
    hasEngraving: true,
  },
  {
    title: 'Geometric coaster set',
    description: 'Set of laser-cut wooden coasters with geometric motifs.',
    categorySlug: 'laser-cutting',
    price: 35,
    materials: ['Wood'],
    sizes: ['Set of 4', 'Set of 6'],
    badges: ['New'],
    hasEngraving: true,
  },
  {
    title: 'Custom name plaque',
    description: 'Door or desk name plaque laser-cut in wood or plexiglass.',
    categorySlug: 'laser-cutting',
    price: 42,
    materials: ['Wood', 'Plexiglass'],
    sizes: ['15cm', '20cm', '25cm'],
    badges: ['Customizable'],
    hasEngraving: true,
  },
  {
    title: 'Logo brand kit',
    description: 'Complete logo and brand guidelines package for your business.',
    categorySlug: 'graphic-design',
    price: 350,
    materials: ['Digital'],
    sizes: ['Standard'],
    badges: ['Popular'],
    hasEngraving: false,
    featured: true,
  },
  {
    title: 'Social media pack',
    description: 'Ready-to-post templates and visual assets for your brand channels.',
    categorySlug: 'graphic-design',
    price: 180,
    materials: ['Digital'],
    sizes: ['10 posts', '20 posts'],
    badges: ['New'],
    hasEngraving: false,
  },
  {
    title: 'Business card design',
    description: 'Professional business card layout with print-ready files.',
    categorySlug: 'graphic-design',
    price: 75,
    materials: ['Digital'],
    sizes: ['Standard'],
    badges: ['Bestseller'],
    hasEngraving: false,
  },
  {
    title: 'Menu & flyer design',
    description: 'Print-ready menu or flyer design tailored to your venue.',
    categorySlug: 'graphic-design',
    price: 140,
    materials: ['Digital'],
    sizes: ['A5', 'A4'],
    badges: ['Customizable'],
    hasEngraving: false,
  },
  {
    title: 'Custom photo mug',
    description: 'High-quality print on a ceramic mug — perfect for photos or logos.',
    categorySlug: 'print-on-any-surface',
    price: 28,
    materials: ['Ceramic'],
    sizes: ['300ml', '350ml'],
    badges: ['Bestseller', 'Customizable'],
    hasEngraving: false,
    featured: true,
  },
  {
    title: 'Printed tote bag',
    description: 'Durable canvas tote with full-color custom print.',
    categorySlug: 'print-on-any-surface',
    price: 32,
    materials: ['Canvas'],
    sizes: ['One size'],
    badges: ['Popular'],
    hasEngraving: false,
  },
  {
    title: 'Acrylic photo print',
    description: 'Crystal-clear acrylic print for a premium photo display.',
    categorySlug: 'print-on-any-surface',
    price: 110,
    discountedPrice: 95,
    materials: ['Acrylic'],
    sizes: ['20x30', '30x40', '40x60'],
    badges: ['New'],
    hasEngraving: false,
  },
  {
    title: 'Printed metal sign',
    description: 'Weather-resistant metal sign with vivid UV print.',
    categorySlug: 'print-on-any-surface',
    price: 90,
    materials: ['Metal'],
    sizes: ['A4', 'A3'],
    badges: ['Customizable'],
    hasEngraving: false,
  },
  {
    title: '“Sweet Home” gift box',
    description: 'Artisan gift box for a warm interior — curated Biblio Squad pieces.',
    categorySlug: 'gift-ideas',
    price: 150,
    discountedPrice: 129,
    materials: ['Wood', 'Mixed'],
    sizes: ['Standard'],
    badges: ['Bestseller', 'Popular'],
    hasEngraving: true,
    featured: true,
  },
  {
    title: 'Corporate gift pouch',
    description: 'Customizable corporate gift kit for clients and teams.',
    categorySlug: 'gift-ideas',
    price: 95,
    materials: ['Mixed'],
    sizes: ['Individual', 'Bulk 10'],
    badges: ['Customizable'],
    hasEngraving: true,
  },
  {
    title: 'LED neon sign',
    description: 'Custom LED neon sign for shops, events or home décor.',
    categorySlug: 'gift-ideas',
    price: 220,
    materials: ['LED', 'Acrylic'],
    sizes: ['Small', 'Medium', 'Large'],
    badges: ['New', 'Popular'],
    hasEngraving: false,
    featured: true,
  },
  {
    title: 'Personalized notebook set',
    description: 'Engraved cover notebooks — ideal for gifting or onboarding kits.',
    categorySlug: 'gift-ideas',
    price: 48,
    materials: ['Paper', 'Wood'],
    sizes: ['A5', 'A6'],
    badges: ['Customizable'],
    hasEngraving: true,
  },
  {
    title: 'Window stickers — pack of 10',
    description: 'Cut vinyl stickers for windows, vehicles or décor.',
    categorySlug: 'vehicle-wrap-vinyl',
    price: 40,
    materials: ['Vinyl'],
    sizes: ['Pack of 10', 'Pack of 25'],
    badges: ['Bestseller'],
    hasEngraving: false,
  },
  {
    title: 'Partial vehicle wrap',
    description: 'Partial vinyl wrap applied with precision for brand visibility.',
    categorySlug: 'vehicle-wrap-vinyl',
    price: 450,
    materials: ['Vinyl'],
    sizes: ['Hood', 'Doors', 'Rear'],
    badges: ['Customizable', 'Popular'],
    hasEngraving: false,
  },
  {
    title: 'Full vehicle branding kit',
    description: 'Design and vinyl application for complete vehicle branding.',
    categorySlug: 'vehicle-wrap-vinyl',
    price: 980,
    discountedPrice: 890,
    materials: ['Vinyl'],
    sizes: ['Compact', 'Sedan', 'Van'],
    badges: ['Customizable'],
    hasEngraving: false,
    featured: true,
  },
  {
    title: 'Floor & wall vinyl lettering',
    description: 'Durable cut vinyl lettering for storefronts and interiors.',
    categorySlug: 'vehicle-wrap-vinyl',
    price: 70,
    materials: ['Vinyl'],
    sizes: ['Per linear meter'],
    badges: ['New'],
    hasEngraving: false,
  },
];

const VARIATIONS = [
  'Classic',
  'Premium',
  'Minimal',
  'Oak finish',
  'Walnut finish',
  'Black edition',
  'White edition',
  'Gold accent',
  'Compact',
  'XL',
  'Duo pack',
  'Family set',
  'Pro',
  'Studio',
  'Limited',
  'Seasonal',
  'Heritage',
  'Urban',
  'Soft touch',
  'Matte',
];

const BADGE_POOL = ['Bestseller', 'New', 'Customizable', 'Popular'] as const;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036f]/g, '')
    .replaceAll(/[^\w\s-]/g, '')
    .trim()
    .replaceAll(/[\s_-]+/g, '-')
    .replaceAll(/^-+|-+$/g, '');
}

function pickImages(index: number): string[] {
  const primary = UNSPLASH_IMAGES[index % UNSPLASH_IMAGES.length];
  const secondary = UNSPLASH_IMAGES[(index + 17) % UNSPLASH_IMAGES.length];
  const tertiary = UNSPLASH_IMAGES[(index + 33) % UNSPLASH_IMAGES.length];
  return [primary, secondary, tertiary];
}

function buildProducts(count: number): Array<ProductTemplate & { slug: string; images: string[] }> {
  const products: Array<ProductTemplate & { slug: string; images: string[] }> = [];

  for (let i = 0; i < count; i += 1) {
    const base = PRODUCT_TEMPLATES[i % PRODUCT_TEMPLATES.length];
    const variation = VARIATIONS[i % VARIATIONS.length];
    const series = Math.floor(i / PRODUCT_TEMPLATES.length) + 1;
    const title =
      series === 1 && i < PRODUCT_TEMPLATES.length
        ? base.title
        : `${base.title} — ${variation}`;
    const slugBase = slugify(title);
    const slug = `${slugBase}-${String(i + 1).padStart(3, '0')}`;
    const priceBump = (i % 7) * 3;
    const price = base.price + priceBump;
    const discountedPrice =
      base.discountedPrice != null
        ? Math.max(5, base.discountedPrice + Math.floor(priceBump / 2))
        : i % 5 === 0
          ? Math.round(price * 0.85)
          : undefined;

    products.push({
      ...base,
      title,
      slug,
      price,
      discountedPrice,
      badges:
        i % 4 === 0
          ? [...new Set([...base.badges, BADGE_POOL[i % BADGE_POOL.length]])]
          : base.badges,
      featured: base.featured === true || i % 11 === 0,
      images: pickImages(i),
    });
  }

  return products;
}

export const seedProducts = async (prisma: PrismaClient) => {
  const existingProducts = await prisma.product.count({
    where: { deletedAt: null },
  });
  if (existingProducts >= 100) {
    return;
  }

  const categoryIds = new Map<string, string>();

  for (const category of CATEGORIES) {
    const row = await prisma.productCategory.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        sortOrder: category.sortOrder,
        status: EStatus.ACTIVE,
      },
      create: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        sortOrder: category.sortOrder,
        status: EStatus.ACTIVE,
      },
    });
    categoryIds.set(category.slug, row.id);
  }

  const products = buildProducts(100);

  for (const product of products) {
    const categoryId = categoryIds.get(product.categorySlug);
    if (!categoryId) {
      throw new Error(`Missing category for slug "${product.categorySlug}"`);
    }

    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        title: product.title,
        description: product.description,
        price: product.price,
        discountedPrice: product.discountedPrice ?? null,
        imageUrl: product.images[0],
        images: [...product.images],
        badges: product.badges,
        materials: product.materials,
        sizes: product.sizes,
        hasEngraving: product.hasEngraving,
        featured: product.featured === true,
        status: EStatus.ACTIVE,
        categoryId,
        deletedAt: null,
      },
      create: {
        title: product.title,
        description: product.description,
        price: product.price,
        discountedPrice: product.discountedPrice ?? null,
        imageUrl: product.images[0],
        images: [...product.images],
        slug: product.slug,
        badges: product.badges,
        materials: product.materials,
        sizes: product.sizes,
        hasEngraving: product.hasEngraving,
        featured: product.featured === true,
        status: EStatus.ACTIVE,
        categoryId,
      },
    });
  }
};
