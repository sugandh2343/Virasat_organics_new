import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
try {
  const { default: ProductCard, getProductAvailability } = await vite.ssrLoadModule('/src/components/ui/ProductCard.jsx');
  const { default: PriceDisplay } = await vite.ssrLoadModule('/src/components/ui/PriceDisplay.jsx');
  const { default: RatingDisplay } = await vite.ssrLoadModule('/src/components/ui/RatingDisplay.jsx');
  const { products } = await vite.ssrLoadModule('/src/mock-data/products.js');
  const renderCard = (product, extra = {}) => renderToStaticMarkup(React.createElement(MemoryRouter, null, React.createElement(ProductCard, { product, ...extra })));
  assert.equal(products.length, 5);
  for (const key of ['id', 'slug', 'SKU']) assert.equal(new Set(products.map(p => p[key])).size, 5);
  for (const product of products) {
    assert.equal(product.price, null);
    assert.equal(product.compareAtPrice, null);
    assert.equal(product.stock, null);
    assert.match(renderCard(product), /Price coming soon/);
    assert.match(renderCard(product), /disabled/);
  }
  // Synthetic boundary inputs are test fixtures only, never catalogue data.
  const base = products[0];
  assert.equal(renderCard({ ...base, status: 'inactive' }), '');
  for (const status of ['coming_soon', 'out_of_stock']) {
    const product = { ...base, status, price: 100, stock: 1 };
    assert.equal(getProductAvailability(product).purchasable, false);
    assert.match(renderCard(product, { onAddToCart() {} }), /disabled/);
  }
  const active = { ...base, status: 'active', price: 100, stock: 1 };
  assert.equal(getProductAvailability(active).purchasable, true);
  assert.match(renderCard(active, { onAddToCart() {} }), /Add to cart/);
  assert.doesNotMatch(renderCard(active, { onAddToCart() {}, onWishlist() {} }), /disabled/);
  assert.match(renderCard(active), /Shopping coming soon/);
  for (const price of [null, undefined, NaN, Infinity, -1, '100']) assert.equal(getProductAvailability({ ...active, price }).purchasable, false);
  for (const stock of [null, undefined, 0, -1, Infinity, 1.5, '1']) assert.equal(getProductAvailability({ ...active, stock }).purchasable, false);
  assert.match(renderToStaticMarkup(React.createElement(PriceDisplay, { price: null })), /Price coming soon/);
  assert.match(renderToStaticMarkup(React.createElement(PriceDisplay, { price: 100, compareAtPrice: 120 })), /<del>/);
  assert.doesNotMatch(renderToStaticMarkup(React.createElement(PriceDisplay, { price: 100, compareAtPrice: 90 })), /<del>/);
  assert.match(renderToStaticMarkup(React.createElement(RatingDisplay)), /No ratings yet/);
  const scripts = (await readdir('dist/assets')).filter(file => file.endsWith('.js'));
  for (const file of scripts) {
    const source = await readFile('dist/assets/' + file, 'utf8');
    assert.doesNotMatch(source, /A considered foundation|design-system|Demo only/);
  }
  console.log('PASS: five independent unchanged products; all availability states; price and MRP boundaries; no fabricated default ratings; development preview absent from production JS.');
} finally { await vite.close(); }

