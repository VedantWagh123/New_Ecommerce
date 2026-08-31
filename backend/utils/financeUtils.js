export const calculateSellerShare = (order, sellerId, commissionRate) => {
    const sellerItems = order.items.filter(i => i.sellerId === sellerId);
    if (sellerItems.length === 0) return { itemTotal: 0, sellerShare: 0, platformCommission: 0, sellerItems: [] };
    
    const itemTotal = sellerItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    
    let totalDiscount = 0;
    if (order.subtotal && order.amount) {
        totalDiscount = Math.max(0, order.subtotal - (order.amount - (order.tax || 0) - (order.platformFee || 0) - (order.deliveryFee || 0)));
    } else {
        totalDiscount = order.couponDiscount || 0;
    }

    let proratedDiscount = 0;
    if (order.subtotal && order.subtotal > 0) {
        proratedDiscount = totalDiscount * (itemTotal / order.subtotal);
    }

    const sellerDiscountBurden = proratedDiscount * 0.5;
    const baseRevenue = Math.max(0, itemTotal - sellerDiscountBurden);
    
    const platformCommission = baseRevenue * commissionRate;
    const sellerShare = baseRevenue - platformCommission;

    return { itemTotal, sellerShare, platformCommission, sellerDiscountBurden, sellerItems };
};
