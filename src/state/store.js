import { updateAdminDemoOrder } from '../services/orderAdminService';
import { reorderEligibility } from '../domain/orderSelectors';
import { getSessionDemoOrder } from '../services/checkoutService';
import { createDemoOrder, cancelSessionDemoOrder } from '../services/checkoutService';
import { createDemoSession } from '../services/authService';
import { reconcileShopping } from '../domain/cartSelectors';
import { isProductPurchasable, isProductVisible } from '../domain/productSelectors';
export const STORAGE_KEY = 'virasat-v2:local-preview:v1';
export const initialState = {cart:[], wishlist:[], session:{mode:'guest',customerId:null}, location:null, overlay:null};
export function sanitizePersisted(value) {
  return {
    cart: Array.isArray(value?.cart) ? value.cart.filter(item => typeof item?.productId === 'string' && Number.isInteger(item.quantity) && item.quantity > 0).map(item=>({productId:item.productId,quantity:Math.min(item.quantity,99)})) : [],
    wishlist: Array.isArray(value?.wishlist) ? [...new Set(value.wishlist.filter(id=>typeof id === 'string' && id))] : [],
    location: typeof value?.location?.postalCode === 'string' && /^\d{6}$/.test(value.location.postalCode) ? {postalCode:value.location.postalCode} : null,
  };
}
export function storefrontReducer(state, action) {
  switch(action.type) {
    case 'catalogue/load': {
      const value = action.persisted ? sanitizePersisted(action.persisted) : state;
      return {...state,...value,...reconcileShopping(value,action.products),catalogue:action.products,ready:true};
    }
    case 'storage/sync': {
      const value=sanitizePersisted(action.value);
      return {...state,...value,...reconcileShopping(value,state.catalogue || [])};
    }
    case 'checkout/place': {
      if(action.sessionId!==state.session.instanceId)return state;
      try {
        const order=createDemoOrder(state,action);
        if(state.session.orders?.some(item=>item.id===order.id))return state;
        return {...state,cart:[],checkoutError:null,session:{...state.session,orders:[...(state.session.orders || []),order]}};
      } catch(error) { return {...state,checkoutError:error.message}; }
    }
    case 'orders/admin-update': {
        if(action.sessionId!==state.session.instanceId)return state;
        try { const orders=updateAdminDemoOrder(state.session,action);return {...state,orderError:null,session:{...state.session,orders}}; }
        catch(error){return {...state,orderError:error.message};}
      }
      case 'orders/cancel': {
      if(action.sessionId!==state.session.instanceId)return state;
      try {const orders=cancelSessionDemoOrder(state.session,action.orderId);return orders===state.session.orders?state:{...state,orderError:null,session:{...state.session,orders}};}
      catch(error){return {...state,orderError:error.message};}
    }
    case 'orders/reorder': {
      if(action.sessionId!==state.session.instanceId)return state;
      const result=reorderEligibility(getSessionDemoOrder(state.session,action.orderId),state.catalogue || [],state.cart);
      if(!result.eligible)return {...state,orderError:result.reason};
      let next=state;
      for(const {product,quantity} of result.items)next=storefrontReducer(next,{type:'cart/add',product,quantity});
      return {...next,orderError:null};
    }
    case 'cart/remove': return {...state,cart:state.cart.filter(item=>item.productId!==action.id)};
    case 'cart/clear': return {...state,cart:[]};
    case 'cart/quantity': {
      const product=state.catalogue?.find(item=>item.id===action.id) || action.product;
      if(!isProductPurchasable(product) || !Number.isInteger(action.quantity) || action.quantity<1)return state;
      return {...state,cart:state.cart.map(item=>item.productId===action.id?{...item,quantity:Math.min(action.quantity,product.stock,99)}:item)};
    }
    case 'cart/add': {
      const product = state.catalogue ? state.catalogue.find(item=>item.id===action.product?.id) : action.product;
      if (!isProductPurchasable(product) || typeof product.id !== 'string') return state;
      const existing = state.cart.find(item => item.productId === product.id);
      const limit = Math.min(product.stock, 99); const requested = action.quantity ?? 1; if (!Number.isInteger(requested) || requested < 1) return state;
      if (existing && existing.quantity >= limit) return state;
      return { ...state, cart: existing ? state.cart.map(item => item.productId === product.id ? { ...item, quantity: Math.min(limit, item.quantity + requested) } : item) : [...state.cart, { productId: product.id, quantity: Math.min(limit, requested) }] };
    }
    case 'cart/set': {const value=sanitizePersisted({cart:action.value}); return {...state,cart:state.catalogue?reconcileShopping(value,state.catalogue).cart:value.cart};}
    case 'wishlist/toggle': if(state.catalogue && !state.catalogue.some(product=>product.id===action.id && isProductVisible(product)))return state; return typeof action.id !== 'string' || !action.id ? state : {...state,wishlist:state.wishlist.includes(action.id) ? state.wishlist.filter(id=>id!==action.id) : [...state.wishlist,action.id]};
    case 'location/set': return {...state,session:{...state.session,deliveryAddressId:null},location:sanitizePersisted({location:action.value}).location};
    case 'session/demo': return {...state,orderError:null,session:createDemoSession(action.profile)};
    case 'session/profile': return state.session.mode==='demo' && action.sessionId===state.session.instanceId?{...state,session:{...state.session,profile:action.profile}}:state;
    case 'session/addresses': {
      if(state.session.mode!=='demo'||action.sessionId!==state.session.instanceId)return state;
      const addresses=action.addresses.filter(address=>address.sessionId===state.session.instanceId&&address.customerId===state.session.customerId);
      const selected=addresses.find(address=>address.id===state.session.deliveryAddressId);
      return {...state,session:{...state.session,addresses,deliveryAddressId:selected?.id || null},location:state.session.deliveryAddressId?(selected?{postalCode:selected.postalCode}:null):state.location};
    }
    case 'session/address-select': {
      const address=state.session.addresses?.find(item=>item.id===action.id && item.sessionId===state.session.instanceId);
      return address?{...state,session:{...state.session,deliveryAddressId:address.id},location:{postalCode:address.postalCode}}:state;
    }
    case 'session/clear': return {...state,orderError:null,session:initialState.session,location:state.session.deliveryAddressId?null:state.location};
    case 'overlay/set': return {...state,overlay:action.value};
    case 'reset': return {...initialState};
    default: return state;
  }
}










