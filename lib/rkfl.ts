import * as crypto from 'crypto';
import { ORDER_STATUS } from '../consts/status';
import { getEncrypted } from '../lib/merchant';
import { MerchantData, orderPayload, RKFLPayload } from '../types';

import { bigcommerceClient, publicKey } from './auth';

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
function mapStatus(status: number) {

    switch (status) {

        case ORDER_STATUS.RKFL_PARTIAL:
            return ORDER_STATUS.BG_ON_HOLD //on hold
            break;
        case ORDER_STATUS.RKFL_SUCCESS:
            return ORDER_STATUS.BG_AWAITING_FULFILMENT; //awaiting fulfilment
        case ORDER_STATUS.RKFL_DECLINED:
            return ORDER_STATUS.BG_DECLINED //declined
        default:
            return ORDER_STATUS.BG_AWAITING_PAYMENT //awaiting payment
            break;
    }
}
async function getTransactions(environment: string, { access }: { access: string }): Promise<any> {
    try {

        const myHeaders = new Headers();

        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("Authorization", "Bearer " + access);


        const response = await fetch(environment + '/tx?limit=10', {
            method: "GET",
            headers: myHeaders
        })

        const result = await response.json();

        return result;
    } catch (error) {
        return {
            error: true,
            message: error?.message
        }
    }
}
async function getInvoiceData(environment: string, uuid: string): Promise<any> {
    try {

        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");


        const response = await fetch(environment + '/hosted-page?uuid=' + uuid, {
            method: "GET",
            headers: myHeaders
        })

        const result = await response.json();

        return result;

    } catch (error) {
        console.error("There was an error confirming uuid", error?.message);

        return {} as Response
    }

    return true;


}
async function autologin(storeHash) {

    const merchantData = await getMerchantData(storeHash);

    const environment = getEnvironment(merchantData.environment);


    return await login(environment, merchantData);
}
async function login(environment: string, { email, password }: MerchantData): Promise<{ access: string, error?: boolean }> {
    const raw = { email, password };
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    const response = await fetch(environment + '/auth/login', {
        method: "POST",
        headers: myHeaders,
        body: JSON.stringify(raw)
    })


    const result = await response.json();
    if (result.ok === false) {
        return { access: '', error: true };
    }

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
async function sendSwapRequest(environment, rkflHeaders, merchantAuth, merchantId) {


    const requestOptions: RequestInit = {
        method: 'POST',
        headers: rkflHeaders,
        body: JSON.stringify({ merchantAuth, merchantId })
    };

    const response = await fetch(environment + '/update/orderId', requestOptions);

    const result = await response.json();

    return result;
}
async function swap(environment: string, { orderId, temporaryOrderId }, storeHash: string, merchantData: MerchantData, merchantAuth = ''): Promise<boolean> {
    const rkflHeaders: Headers = new Headers();

    rkflHeaders.append("Content-Type", "application/json");

    const data = {
        'tempOrderId':
            temporaryOrderId,
        'newOrderId': orderId
    };

    merchantAuth = merchantAuth || await getEncrypted(JSON.stringify(data), false, storeHash);

    const merchantId = Buffer.from(merchantData.merchantId).toString('base64');

    return await sendSwapRequest(environment, rkflHeaders, merchantAuth, merchantId);

}

export async function getUUID(payload: RKFLPayload): Promise<{ merchantAuth: string, uuid: string, environment: string, error?: boolean, message?: string }> {

    const merchantData = await getMerchantData(payload.storeHash);

    const environment = getEnvironment(merchantData.environment);


    const { access, error } = await login(environment, merchantData);

    if (error === true) {
        return { merchantAuth: '', uuid: '', environment: '', error: true, message: 'Could not verify merchant login details' };
    }

    const { uuid } = await charge(access, environment, merchantData, payload);

    const result = { merchantAuth: await getEncrypted(merchantData.merchantId), uuid, environment: merchantData.environment };

    return result
}
export async function swapOrder({ orderId, temporaryOrderId, storeHash }: { temporaryOrderId: string, orderId: string, storeHash: string }): Promise<boolean> {

    const merchantData = await getMerchantData(storeHash);

    const environment = getEnvironment(merchantData.environment);

    const result = await swap(environment, { orderId, temporaryOrderId }, storeHash, merchantData);

    return result;
}
export function verifyCallback(data: string, signature: string): boolean {

    // const signatureBuffer = Buffer.from(signature);
    // const bufData = Buffer.from(data);

    const algorithm = "SHA256";

    // const isVerified = crypto.verify(algorithm, bufData, publicKey, signatureBuffer);

    // console.warn({signatureBuffer,bufData,isVerified});


    // Creating verify object with its algo
    const verify = crypto.createVerify(algorithm);
    verify.write(data);

    // Calling end method
    verify.end();
    const localPubKey = publicKey as crypto.KeyLike
    // Prints true if verified else false
    const isVerified = verify.verify(localPubKey, signature, 'base64');



    return isVerified;
}
/**
 * Placeholder validate!!!
 * @param storeHash
 * @param merchantAuth 
 * @returns 
 */
export async function validateAuth(storeHash: string, merchantAuth: string) {
    if (merchantAuth.length < 300 || merchantAuth.length > 500 || merchantAuth.split("/").length < 2 || !merchantAuth.endsWith('=')) {
        return { error: true }
    }

    return { error: false }

    // const merchantData = await getMerchantData(storeHash);

    // const environment = getEnvironment(merchantData.environment);

    // return await swap(environment, { orderId: '', temporaryOrderId: '' }, storeHash, merchantData, merchantAuth)
}
export async function txWebhook(payl: orderPayload) {

    // const payl = { storeHash, orderId, orderAmount: amount, status };

    console.warn("Data for updating bigcommerce:", payl);

    return await updateBigcommerceOrder(payl);
}
export async function updateOrderStatus(storeHash, orderId, uuid) {

    try {

        const merchantData = await getMerchantData(storeHash);


        const environment = getEnvironment(merchantData.environment);

        const resultAuthLogin = await autologin(storeHash);
        console.warn("Result of login?", { resultAuthLogin })
        if (resultAuthLogin.error) return { error: true, message: 'Could not verify merchant' }

        const confirmation = await getInvoiceData(environment, uuid);
        const txData = await getTransactions(environment, resultAuthLogin);

        console.warn("Were we able to get transaction?", { txData })

        if (txData.error) return { error: true, message: 'Could not get transactions' }
        // console.warn(JSON.stringify(txData.result.txs,null,4));
        const foundTx = txData.result.txs.find((tx) =>
            tx.hostedPage.uuid === uuid
        )
        const payl = { storeHash, orderId, orderAmount: confirmation.result?.returnval?.amount?.toString(), status: foundTx?.status };
        console.warn("Data for updating bigcommerce:", payl)

        return await updateBigcommerceOrder(payl)

        // confirmation.amount

        //check amount is same
        //check tx is available and status is okay


        // return response;

    } catch (error) {
        return { error: true, message: 'Error with sorting: ' + error?.message }

    }

}

async function updateBigcommerceOrder({ storeHash, orderId, orderAmount, status }: orderPayload) {

    const mappedStatus = mapStatus(status);

    if (mappedStatus === 7) {

        // return { error: true, message: 'Order is pending' };

    }

    const accessToken = await db.getStoreToken(storeHash);

    console.warn({ accessToken, storeHash, orderId });

    const bigcommerce = bigcommerceClient(accessToken, storeHash, 'v2');

    const data = await bigcommerce.get(`/orders/${orderId}`);

    console.warn(orderAmount, "orderAmount", data.total_inc_tax, " data.total_inc_tax", data.total_ex_tax);

    if (Number(orderAmount) !== Number(data.total_inc_tax) && Number(orderAmount) !== Number(data.total_ex_tax)) {

        return { error: true, message: 'Error with order _', data: { orderAmount, dataTax: data.total_inc_tax, dataexTax: data.total_ex_tax } }

    }

    const payload = {
        status_id: mappedStatus
    }

    const response = await bigcommerce.put(`/orders/${orderId}`, payload);

    console.warn("Response from Bigcommerce Update?", { response });

    return response;

}