// No default orders are seeded. Customer UI reads session.orders via checkoutService.
// Contract for future adapters:
// {orderId, id (compatibility alias), customerId, sessionId, demo, createdAt, status,
//  statusEvents:[{id,status,occurredAt,note}], items:[{productId,name,size,images,quantity,unitPrice,lineTotal}],
//  deliveryAddressSnapshot, subtotal, shipping, tax, total, paymentMethod, paymentStatus,
//  deliveryInstructions}. Legacy address/instructions aliases remain for checkout compatibility.
export const orders = [];
