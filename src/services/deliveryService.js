import { readMock } from './mockStore';
import { deliverySettings } from '../mock-data/delivery';
export const normalizePin = value => String(value ?? '').trim();
export const isValidPin = value => /^[1-9][0-9]{5}$/.test(normalizePin(value));
export function evaluateDelivery(pin, settings) {
 const postalCode=normalizePin(pin);
 if(!isValidPin(postalCode)) return {status:'invalid',postalCode,message:settings.messages.invalid};
 if(settings.configured!==true) return {status:'unconfigured',postalCode,message:settings.messages.unconfigured};
 const serviceable=Array.isArray(settings.serviceablePins) && settings.serviceablePins.includes(postalCode);
 const status=serviceable?'serviceable':'unserviceable';
 return {status,postalCode,message:settings.messages[status]};
}
// Static adapter only; no request, postcode database or live coverage check.
export async function checkDelivery(pin) { const business=await readMock("business"); return evaluateDelivery(pin,{...structuredClone(deliverySettings),...business.delivery}); }
