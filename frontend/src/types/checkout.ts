export type CheckoutStepId = 'delivery' | 'shipping' | 'summary';

export type CheckoutDeliveryValues = {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    governorate: string;
    postalCode: string;
};
