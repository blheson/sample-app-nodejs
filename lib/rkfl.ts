import { getEncrypted } from '../lib/merchant';
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
    const raw = { email, password };
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    const response = await fetch(environment + '/auth/login', {
        method: "POST",
        headers: myHeaders,
        body: JSON.stringify(raw)
    })


    const result = await response.json();


    return { access: result.result.access };

}
async function charge(access: string, environment, { merchantId: merchant_id }: MerchantData, { amount, cart, currency, orderId: order, redirectUrl }: RKFLPayload): Promise<{ uuid: string }> {
    const rkflHeaders: Headers = new Headers();

    rkflHeaders.append("Authorization", "Bearer " + access);

    rkflHeaders.append("Content-Type", "application/json");

    const requestOptions: RequestInit = {
        method: 'POST',
        headers: rkflHeaders,
        body: JSON.stringify({ amount, cart, merchant_id, currency, order, redirectUrl })
    };

    const response = await fetch(environment + '/hosted-page', requestOptions);

    const result = await response.json();


    return { uuid: result.result.uuid };

}
async function swap(environment: string, { orderId, temporaryOrderId },storeHash:string,merchantData: MerchantData): Promise<boolean> {
    const rkflHeaders: Headers = new Headers();

    rkflHeaders.append("Content-Type", "application/json");
    const data = {
        'tempOrderId':
            temporaryOrderId,
        'newOrderId': orderId
    };

    const merchantAuth = await getEncrypted(JSON.stringify(data), false,storeHash);
    const merchantId = Buffer.from(merchantData.merchantId).toString('base64');
    
    const requestOptions: RequestInit = {
        method: 'POST',
        headers: rkflHeaders,
        body: JSON.stringify({ merchantAuth, merchantId })
    };
    console.warn("Swap", {environment,requestOptions});
    const response = await fetch(environment + '/update/orderId', requestOptions);

    const result = await response.json();



    return result?.ok;

}
export async function getUUID(payload: RKFLPayload): Promise<{ merchantAuth: string, uuid: string, environment: string }> {

    const merchantData = await getMerchantData(payload.storeHash);

    const environment = getEnvironment(merchantData.environment);


    const { access } = await login(environment, merchantData);


    const { uuid } = await charge(access, environment, merchantData, payload);

    const result = { merchantAuth: await getEncrypted(merchantData.merchantId), uuid, environment: merchantData.environment };

    return result
}
export async function swapOrder({orderId,temporaryOrderId,storeHash}: { temporaryOrderId: string, orderId: string, storeHash: string}): Promise<boolean> {

    const merchantData = await getMerchantData(storeHash);
    
    const environment = getEnvironment(merchantData.environment);

    const result = await swap(environment,{orderId,temporaryOrderId},storeHash,merchantData);




    return result;
}

