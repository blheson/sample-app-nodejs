import { MerchantData } from './data';

import { SessionProps } from './index';

export interface StoreData {
    accessToken?: string;
    scope?: string;
    storeHash: string;
}

export interface UserData {
    email: string;
    username?: string;
}

export interface Db {
    hasStoreUser(storeHash: string, userId: string): boolean;
    setUser(session: SessionProps): Promise<void>;
    setStore(session: SessionProps): Promise<void>;
    setStoreUser(session: SessionProps): Promise<void>;
    setMerchant(storeHash: string, merchantData: MerchantData): Promise<void>;
    getMerchant(context: string): Promise<[]>;
    getStore(): StoreData | null;
    getStoreToken(storeId: string): string ;
    deleteStore(session: SessionProps): Promise<void>;
    deleteUser(session: SessionProps): Promise<void>;
}
