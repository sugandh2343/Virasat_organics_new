import { getProductAvailability, isProductVisible, isValidPrice } from './productSelectors';
import { normalizeSearch, searchProducts } from '../services/searchService';
export const defaultFilters = { category: '', availability: '', sort: '', min: '', max: '' };
export const availabilityOptions = [['', 'All'], ['available', 'Available'], ['out_of_stock', 'Out of Stock'], ['coming_soon', 'Coming Soon']];
export const sortOptions = [['', 'Default'], ['name-asc', 'Name A–Z'], ['name-desc', 'Name Z–A']];
export function resolveCategory(categories, slug) { return categories.find(category => category.slug === slug) ?? null; }
export function hasCataloguePrices(products) { return products.some(product => isProductVisible(product) && isValidPrice(product.price)); }
export function browseProducts(products, categories, filters = {}) {
  let result = products.filter(isProductVisible);
  if (filters.category) {
    const category = resolveCategory(categories, filters.category);
    result = result.filter(product => category && product.categoryId === category.id);
  }
  if (normalizeSearch(filters.q)) result = searchProducts(filters.q, result);
  if (filters.availability) result = result.filter(product => {
    const availability = getProductAvailability(product);
    return filters.availability === 'available' ? availability.purchasable : availability.status === filters.availability;
  });
  if (hasCataloguePrices(products)) {
    for (const key of ['min', 'max']) {
      const value = filters[key];
      if (value !== '' && value != null && Number.isFinite(Number(value))) result = result.filter(product => isValidPrice(product.price) && (key === 'min' ? product.price >= Number(value) : product.price <= Number(value)));
    }
  }
  if (filters.sort === 'name-asc' || filters.sort === 'name-desc') result.sort((a,b) => a.name.localeCompare(b.name, 'en-IN') * (filters.sort === 'name-desc' ? -1 : 1));
  if (hasCataloguePrices(products) && ['price-asc','price-desc'].includes(filters.sort)) result.sort((a,b) => {
    if (!isValidPrice(a.price)) return isValidPrice(b.price) ? 1 : 0;
    if (!isValidPrice(b.price)) return -1;
    return (a.price-b.price) * (filters.sort === 'price-desc' ? -1 : 1);
  });
  return result;
}
