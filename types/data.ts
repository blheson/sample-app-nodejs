export interface FormData {
    description: string;
    isVisible: boolean;
    name: string;
    price: number;
    type: string;
}
export interface MerchantData {
    public_key: string;
    environment: string;
    password: string;
    email: string;
    merchant_id: string;
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
