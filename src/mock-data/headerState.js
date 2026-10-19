// Presentation-only state. No cart/wishlist workflow or browser persistence.
export const demoCart = [];
export const demoWishlist = [];
export function getHeaderCounts(cart = demoCart, wishlist = demoWishlist) {
  return {
    cart: cart.reduce((total, item) => total + (Number.isInteger(item.quantity) && item.quantity > 0 ? item.quantity : 0), 0),
    wishlist: new Set(wishlist.map(item => typeof item === 'string' ? item : item.id).filter(Boolean)).size,
  };
}

