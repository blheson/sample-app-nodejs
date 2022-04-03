import { NextApiRequest, NextApiResponse } from 'next';
import { bigcommerceClient, checkoutScript, encodePayload, getBCAuth, rkflSdkScript, setSession } from '../../lib/auth';

export default async function auth(req: NextApiRequest, res: NextApiResponse) {
    try {
        // Authenticate the app on install
        const session = await getBCAuth(req.query);
        console.warn("sessionsession", session);

        const encodedContext = encodePayload(session); // Signed JWT to validate/ prevent tampering
        // const { accessToken, storeHash } = await getSession(req);

        try {
            const storeHash = session.context.split('/')[1];
            const bigcommerce = bigcommerceClient(session.access_token, storeHash);

            const payload1 = {
                "name": "RKFL SDK Script",
                "description": "Abstracts calls to RKFL enpoints for iframe trigger",
                "src": rkflSdkScript,
                "auto_uninstall": true,
                "load_method": "defer",
                "location": "footer",
                "visibility": "checkout",
                "kind": "src",
                "api_client_id": "",
                "consent_category": "essential",
                "enabled": true,
                "channel_id": 1
            }

            const payload2 = {
                "name": "RKFL Checkout",
                "description": "Generates Rocketfuel Iframe on Checkout page",
                "src": checkoutScript,
                "auto_uninstall": true,
                "load_method": "defer",
                "location": "footer",
                "visibility": "checkout",
                "kind": "src",
                "api_client_id": "",
                "consent_category": "essential",
                "enabled": true,
                "channel_id": 1
            }

            const request1 = await bigcommerce.post('/content/scripts',payload1);

            const request2 = await bigcommerce.post('/content/scripts', payload2);
            console.warn('Install complete',request2,request1);

        //    Promise.all([request2,request1]).then((res) => {
        //     // Promise.all([request1, request2]).then((res) => {

        //         console.warn('Install complete',res);

        //     }).catch(e=>{
        //         console.error('Install not complete',e.message);

        //     });

        } catch (error) {

            console.error("error from script install", error?.message);

        }



        await setSession(session);

        res.redirect(302, `/?context=${encodedContext}`);
    } catch (error) {
        const { message, response } = error;
        res.status(response?.status || 500).json({ message });
    }
}
