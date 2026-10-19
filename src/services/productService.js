import {apiMode,publicProducts,publicProduct} from './catalogueApi';
import { readMock, updateMockRecord } from './mockStore';
import { isProductVisible } from '../domain/productSelectors';
export async function getProducts({includeInactive = false} = {}) { if(apiMode)return publicProducts(); const products = await readMock('products'); return includeInactive ? products : products.filter(isProductVisible); }
export async function getProductBySlug(slug) { if(apiMode)return publicProduct(slug); return (await getProducts()).find(product => product.slug === slug) ?? null; }
export const updateProduct = (id, patch) => {if(apiMode)throw new Error('Use the authenticated catalogue editor.');return updateMockRecord('products', id, patch);};

