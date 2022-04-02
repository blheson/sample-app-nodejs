
import { NextApiRequest } from 'next';
import { MerchantData } from '../types';
import { decodePayload } from './auth';

import db from './db';



export async function setMerchantData({ query: { context = '' } }, data: MerchantData) {
    if (typeof context !== 'string') return;
    const { context: storeHash } = decodePayload(context);

    return await db.setMerchant(storeHash, data);

}

export async function getMerchantData({ query: { context = '' } }: NextApiRequest) {
    if (typeof context !== 'string') return;
    const { context: storeHash, user } = decodePayload(context);
    const hasUser = await db.hasStoreUser(storeHash, user?.id);

    // Before retrieving session/ hitting APIs, check user
    if (!hasUser) {
        throw new Error('User is not available. Please login or ensure you have access permissions.');


    }

    return await db.getMerchant(storeHash);
}


