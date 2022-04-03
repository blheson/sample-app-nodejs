
import { MerchantData, RKFLPayload } from '../types';

import db from './db';

function getEnvironment(environment) {

    const environmentData = {
        'prod': 'https://app.rocketfuelblockchain.com/api',
        'dev': 'https://dev-app.rocketdemo.net/api',
        'stage2': 'https://qa-app.rocketdemo.net/api',
        'preprod': 'https://preprod-app.rocketdemo.net/api',
        'sandbox': 'https://app-sandbox.rocketfuelblockchain.com/api',
    };

    return environmentData[environment] ?? 'https://app.rocketfuelblockchain.com/api';

}

async function getMerchantData(storeHash): Promise<MerchantData> {

    const merchantD = await db.getMerchant(storeHash);

    const merchantData = merchantD.map(({ publicKey, environment, password, email, merchantId }: MerchantData) => ({
        publicKey,
        environment,
        password,
        email,
        merchantId,
    }))

    return merchantData[0];

}
async function login(environment: string, { email, password }: MerchantData): Promise<{ access: string }> {

    const response = await fetch(environment + '/auth/login', {
        method: "POST",
        body: JSON.stringify({ email: email, password })
    })
    const result = await response.json();

    return { access: result.result.access };

}
async function charge(access: string, { environment, merchantId }: MerchantData, { amount, cart, currency, orderId, redirectUrl }: RKFLPayload): Promise<{ uuid: string }> {
    const rkflHeaders: Headers = new Headers();

    rkflHeaders.append("Authorization", "Bearer " + access);

    rkflHeaders.append("Content-Type", "application/json");

    const requestOptions: RequestInit = {
        method: 'POST',
        headers: rkflHeaders,
        body: JSON.stringify({ amount, cart, merchantId, currency, orderId, redirectUrl }),
        redirect: 'follow'
    };
    const response = await fetch(environment + '/auth/login', requestOptions);

    const result = await response.json();

    return { uuid: result.result.uuid };

}
export async function getUUID(payload: RKFLPayload): Promise<{ uuid: string }> {

    const merchantData = await getMerchantData(payload.storeHash);

    const environment = getEnvironment(merchantData.environment);

    const { access } = await login(environment, merchantData);

    return await charge(access, merchantData, payload);
}

