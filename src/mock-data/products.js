export const PRODUCT_STATUSES = Object.freeze({
  ACTIVE: 'active', INACTIVE: 'inactive', OUT_OF_STOCK: 'out_of_stock', COMING_SOON: 'coming_soon',
});
// Internal demo identifiers only. Pricing, stock, ingredients and specifications
// remain unverified. null means unknown, never free or zero inventory.
// All five entries are independent products; there is no variant relationship.
const createProduct = (id, slug, name, SKU, packageSize, category) => ({
  id, slug, name, SKU, packageSize, category, sku: SKU, size: packageSize === '1 litre' ? '1 L' : packageSize, categoryId: category === 'Mustard Oils' ? 'category-oils' : 'category-atta', shortDescription: null, longDescription: null, nutrition: null, storage: null, seo: { title: name + ' | Virasat Organics', description: null },
  images: [], videos: [],
  description: 'Full product information will be added before launch.',
  price: null, compareAtPrice: null, stock: null,
  status: PRODUCT_STATUSES.COMING_SOON,
  ingredients: [], specifications: {},
  SEO: { title: name + ' — ' + packageSize + ' | Virasat Organics', description: 'Discover ' + name + ' (' + packageSize + '). Product details coming soon.' },
});
export const products = [
  createProduct('demo-atta-5kg', 'atta-5kg', 'Atta', 'DEMO-ATTA-5KG', '5 kg', 'Atta & Flours'),
  createProduct('demo-black-oil-500ml', 'black-mustard-oil-500ml', 'Black Mustard Oil', 'DEMO-BMO-500ML', '500 ml', 'Mustard Oils'),
  createProduct('demo-black-oil-1l', 'black-mustard-oil-1-litre', 'Black Mustard Oil', 'DEMO-BMO-1L', '1 litre', 'Mustard Oils'),
  createProduct('demo-yellow-oil-500ml', 'yellow-mustard-oil-500ml', 'Yellow Mustard Oil', 'DEMO-YMO-500ML', '500 ml', 'Mustard Oils'),
  createProduct('demo-yellow-oil-1l', 'yellow-mustard-oil-1-litre', 'Yellow Mustard Oil', 'DEMO-YMO-1L', '1 litre', 'Mustard Oils'),
];



