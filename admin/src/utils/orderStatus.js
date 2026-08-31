export const ORDER_STATUS = {
    PACKING: 'Packing',
    ACCEPTED: 'Accepted',
    PACKED: 'Packed',
    READY_FOR_PICKUP: 'Ready for Pickup',
    HANDED_TO_LOGISTICS: 'Handed to Logistics',
    SHIPPED: 'Shipped',
    IN_TRANSIT: 'In Transit',
    OUT_FOR_DELIVERY: 'Out for Delivery',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
    DELIVERY_FAILED: 'Delivery Failed',
    RETURN_REQUESTED: 'Return Requested',
    RETURNED: 'Returned'
};

export const ALL_STATUSES = [
    ORDER_STATUS.PACKING,
    ORDER_STATUS.ACCEPTED,
    ORDER_STATUS.PACKED,
    ORDER_STATUS.READY_FOR_PICKUP,
    ORDER_STATUS.HANDED_TO_LOGISTICS,
    ORDER_STATUS.SHIPPED,
    ORDER_STATUS.IN_TRANSIT,
    ORDER_STATUS.OUT_FOR_DELIVERY,
    ORDER_STATUS.DELIVERED,
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.DELIVERY_FAILED,
    ORDER_STATUS.RETURN_REQUESTED,
    ORDER_STATUS.RETURNED
];

export const STATUS_STEPS = [
    ORDER_STATUS.PACKING,
    ORDER_STATUS.ACCEPTED,
    ORDER_STATUS.PACKED,
    ORDER_STATUS.READY_FOR_PICKUP,
    ORDER_STATUS.HANDED_TO_LOGISTICS,
    ORDER_STATUS.SHIPPED,
    ORDER_STATUS.IN_TRANSIT,
    ORDER_STATUS.OUT_FOR_DELIVERY,
    ORDER_STATUS.DELIVERED
];

export const getStatusStepIndex = (status) => {
    const index = STATUS_STEPS.indexOf(status);
    return index !== -1 ? index : -1;
};

export const getStatusBadgeStyle = (status) => {
    switch (status) {
        case ORDER_STATUS.PACKING:
        case 'Order Placed':
            return 'bg-blue-50 text-blue-700 border-blue-200';
        case ORDER_STATUS.ACCEPTED:
        case ORDER_STATUS.PACKED:
        case ORDER_STATUS.READY_FOR_PICKUP:
        case ORDER_STATUS.HANDED_TO_LOGISTICS:
            return 'bg-purple-50 text-purple-700 border-purple-200';
        case ORDER_STATUS.SHIPPED:
        case ORDER_STATUS.IN_TRANSIT:
            return 'bg-indigo-50 text-indigo-700 border-indigo-200';
        case ORDER_STATUS.OUT_FOR_DELIVERY:
            return 'bg-amber-50 text-amber-700 border-amber-200';
        case ORDER_STATUS.DELIVERED:
            return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        case ORDER_STATUS.CANCELLED:
        case ORDER_STATUS.DELIVERY_FAILED:
            return 'bg-rose-50 text-rose-700 border-rose-200';
        default:
            return 'bg-gray-50 text-gray-700 border-gray-200';
    }
};
