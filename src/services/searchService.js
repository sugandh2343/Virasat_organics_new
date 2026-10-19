import { isProductVisible } from '../domain/productSelectors';
import { getProducts } from './productService';
import { products } from '../mock-data/products.js';
import { searchKeywords } from '../mock-data/search.js';
export function normalizeSearch(value = '') {
  return String(value).normalize('NFKC').toLocaleLowerCase('en-IN')
    .replace(/\b(millilitres?|milliliters?)\b/g, 'ml')
    .replace(/\b(litres?|liters?)\b/g, 'l')
    .replace(/\b(kilograms?|kgs)\b/g, 'kg')
    .replace(/(\d)\s*(ml|kg|l)\b/g, '$1$2')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ').trim().replace(/\s+/g, ' ');
}
export function searchProducts(query, catalogue = products) {
  const tokens = normalizeSearch(query).split(' ').filter(Boolean);
  if (!tokens.length) return [];
  return catalogue.filter(product => {
    if (!isProductVisible(product)) return false;
    const searchable = normalizeSearch([product.name, product.category, product.packageSize, product.size, ...(product.keywords || []), ...(searchKeywords[product.id] || [])].join(' '));
    return tokens.every(token => searchable.includes(token));
  });
}


export async function searchCatalogue(query) { return searchProducts(query, await getProducts()); }


