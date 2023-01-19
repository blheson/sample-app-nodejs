import * as crypto from 'crypto';
import { ORDER_STATUS } from '../consts/status';
import { getEncrypted } from '../lib/merchant';
import { MerchantData, orderPayload, RKFLPayload, UUIDResponse } from '../types';

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

    return await login(storeHash);
}
async function login(storeHash): Promise<{ access: string, error?: boolean }> {
   
     const merchantData = await getMerchantData(storeHash);

     const environment = getEnvironment(merchantData.environment);
 
 
    const raw = { email:merchantData.email, password:merchantData.password };
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

async function purchaseTxPartial(access: string, { tempOrderId, uuid,storeHash }: any): Promise<{ok:boolean,result:any}>{
 
    const rkflHeaders: Headers = new Headers();
    const merchantData = await getMerchantData(storeHash);
    const merchant_id = merchantData.merchantId
   
    const environment = getEnvironment(merchantData.environment);

    rkflHeaders.append("Authorization", "Bearer " + access);

    rkflHeaders.append("Content-Type", "application/json");

    const requestOptions: RequestInit = {
        method: 'GET',
        headers: rkflHeaders,
       
    };

    const response = await fetch(environment + '/purchase/transaction/partials/'+merchant_id+'?offerId='+tempOrderId+'&hostedPageId='+uuid,requestOptions);

    const result = await response.json();


    return result

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
function compareCartPartialTx(externalCart, bGPayload:any):boolean{
 
    if( !externalCart ){
        return false;
        
    }
    const externalCartInfo = externalCart.check;
    const bGCart = bGPayload.cart;

    if( !Array.isArray( externalCartInfo ) ){
        
        console.warn("Not an array");

        return false;
    }
  
    if( externalCart.nativeAmount < bGPayload.amount ){
                               
        console.warn("Compare result native amount is less than total");
        
        return false;
    }
    
    if( externalCartInfo.length !== bGCart.length ){
            
        console.warn("Compare result native product count disparity");
        
        return false;

    }
 
    let flagCompatibleCartProduct = true;

    bGCart.forEach((item)=>{

    
        const findResult = externalCartInfo.find((cartItem)=>{
         
            return cartItem.name === item.name && item.price === cartItem.price;//we use name and price because bigcommerce randomize product Ids
         
         })
         
         if(!findResult){
            flagCompatibleCartProduct = false;
         }
     })
  
 

    return flagCompatibleCartProduct;
}
export async function handleInvoice(body: any): Promise<UUIDResponse>{

    
  
    console.warn('[ Check payload for transactions]', {body} );

    console.warn(' IS_PARTIAL_TRANSACTION', body.isPartial !== false && body.tempOrderIdRocketfuel &&
    body.uuidRocketfuel);

    if(body.isPartial !== false && body.tempOrderIdRocketfuel &&
        body.uuidRocketfuel){
        
        
        const { access } = await login(body.storeHash);
        console.warn('PARTIAL_TX_PAYLOAD',
        {
            storeHash:body.storeHash,
            tempOrderId:body.tempOrderIdRocketfuel,
            uuid:body.uuidRocketfuel
        }
        );
        const partialResponse:any = await  purchaseTxPartial(
            access,
            {
                storeHash:body.storeHash,
                tempOrderId:body.tempOrderIdRocketfuel,
                uuid:body.uuidRocketfuel
            });
        console.warn(
            { partialResponse }
        );
        const compartCartResult = compareCartPartialTx(partialResponse.result.tx,body);
        if(partialResponse?.result?.tx){

      
        console.warn(
            "IS_PARTIAL_TRANSACTION_VALID",
            partialResponse.result.tx.status === ORDER_STATUS.RKFL_PARTIAL,
            partialResponse.result.paymentLinkStatus ===ORDER_STATUS.RKFL_SUCCESS,compartCartResult
        );

        console.warn('COMBINED_CHECK', partialResponse?.result?.tx && partialResponse.result.tx.status === ORDER_STATUS.RKFL_PARTIAL && partialResponse.result.paymentLinkStatus === ORDER_STATUS.RKFL_SUCCESS && compartCartResult)

        if( partialResponse?.result?.tx && 
            partialResponse.result.tx.status === ORDER_STATUS.RKFL_PARTIAL && 
            partialResponse.result.paymentLinkStatus === ORDER_STATUS.RKFL_SUCCESS &&
             compartCartResult){
             
        const merchantData = await getMerchantData(body.storeHash);

                return {
                     merchantAuth: await getEncrypted(merchantData.merchantId), uuid:body.uuidRocketfuel, environment: merchantData.environment,temporaryOrderId:body.tempOrderIdRocketfuel ,isPartial:true
                    };
            }
        }
     
    }
    const temporaryOrderId = new Date().getTime() + new Date().getTime().toString().substring(1, 4);

    const data = {
        amount: body.amount.toString(),
        currency: body.currency,
        orderId: temporaryOrderId,
        cart: body.cart,
        storeHash: body.storeHash,
        redirectUrl: ''
    }
    const result  = await getUUID(data);
    
    return {...result,temporaryOrderId};
}

export async function getUUID(payload: RKFLPayload): Promise<{ merchantAuth: string, uuid: string, environment: string, error?: boolean, message?: string }> {

    const merchantData = await getMerchantData(payload.storeHash);

    const environment = getEnvironment(merchantData.environment);


    const { access, error } = await login(payload.storeHash);

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