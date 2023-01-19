export interface FormData {
    description: string;
    isVisible: boolean;
    name: string;
    price: number;
    type: string;
}
export interface MerchantData {
    publicKey: string;
    environment: string;
    password: string;
    email: string;
    merchantId: string;
}
export interface RKFLPayload {
    amount: string,
    currency: string,
    orderId: string,
    cart: [],
    storeHash: string,
    redirectUrl: string
}
export interface TableItem {
    id: number;
    name: string;
    price: number;
    stock: number;
}

export interface ListItem extends FormData {
    id: number;
}

export interface StringKeyValue {
    [key: string]: string;
}

export interface orderPayload {
    storeHash: string,
    orderId: string,
    orderAmount: string|number,
    status: number
}
export interface UUIDResponse{
    merchantAuth: string, 
    uuid:string, 
    environment: string,
    temporaryOrderId:
    string,
    isPartial?:boolean
}