export const isValidPrice = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;
export const isProductVisible = product => ['active', 'out_of_stock', 'coming_soon'].includes(product?.status);
export function getProductAvailability(product) {
  if (!isProductVisible(product)) return { visible: false, purchasable: false, status: 'inactive', label: 'Unavailable' };
  if (product.status === 'out_of_stock' || (product.status === 'active' && product.stock === 0)) return { visible: true, purchasable: false, status: 'out_of_stock', label: 'Out of stock' };
  if (product.status !== 'active' || !isValidPrice(product.price) || !Number.isInteger(product.stock) || product.stock < 1) return { visible: true, purchasable: false, status: 'coming_soon', label: 'Coming soon' };
  return { visible: true, purchasable: true, status: 'active', label: 'Add to cart' };
}
export const isProductPurchasable = product => getProductAvailability(product).purchasable;

