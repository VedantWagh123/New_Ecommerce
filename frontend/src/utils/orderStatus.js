export const ORDER_STATUS = {
    PACKING: 'Packing',
    SHIPPED: 'Shipped',
    OUT_FOR_DELIVERY: 'Out for delivery',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
    DELIVERY_FAILED: 'Delivery Failed',
    RETURN_REQUESTED: 'Return Requested',
    RETURNED: 'Returned'
};

export const STATUS_STEPS = [
    ORDER_STATUS.PACKING,
    ORDER_STATUS.SHIPPED,
    ORDER_STATUS.OUT_FOR_DELIVERY,
    ORDER_STATUS.DELIVERED
];

export const getStatusStepIndex = (status) => {
    switch (status) {
        case ORDER_STATUS.PACKING:
        case 'Order Placed':
        case 'Placed':
            return 0;
        case ORDER_STATUS.SHIPPED:
            return 1;
        case ORDER_STATUS.OUT_FOR_DELIVERY:
            return 2;
        case ORDER_STATUS.DELIVERED:
            return 3;
        default:
            return -1; // Exception/Terminal states
    }
};

export const getStatusBadgeStyle = (status) => {
    switch (status) {
        case ORDER_STATUS.PACKING:
        case 'Order Placed':
            return 'bg-blue-50 text-blue-700 border-blue-200';
        case ORDER_STATUS.SHIPPED:
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
