import { cartSettings } from './cart';
export const checkoutSettings = { ...cartSettings, codEnabled:false };
export const checkoutSteps = ['Delivery address','Order review','Payment method','Confirmation'];
export const checkoutNotice = 'Static demo only. Identity and addresses are unverified. Nothing is sent to Virasat Organics; no payment, stock reservation or delivery booking occurs.';
