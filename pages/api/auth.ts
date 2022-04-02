import { NextApiRequest, NextApiResponse } from 'next';
import { bigcommerceClient, encodePayload, getBCAuth, setSession,APP_URL } from '../../lib/auth';

export default async function auth(req: NextApiRequest, res: NextApiResponse) {
    try {
        // Authenticate the app on install
        const session = await getBCAuth(req.query);
        console.warn("sessionsession", session);

        const encodedContext = encodePayload(session); // Signed JWT to validate/ prevent tampering
        // const { accessToken, storeHash } = await getSession(req);
        try {
            const bigcommerce = bigcommerceClient(session.access_token, session.context.split(''));
            const payload = {
                "name": "RKFL Checkout",
                "description": "It ",
                "html": "string",
                "src": "https://code.jquery.com/jquery-3.2.1.min.js",
                "auto_uninstall": true,
                "load_method": "default",
                "location": "head",
                "visibility": "storefront",
                "kind": "src",
                "api_client_id": "string",
                "consent_category": "essential",
                "enabled": true,
                "channel_id": 1
              }
            const { data } = await bigcommerce.get('/content/scripts',payload);

        } catch (error) {
            console.error(error)
        }



        await setSession(session);

        res.redirect(302, `/?context=${encodedContext}`);
    } catch (error) {
        const { message, response } = error;
        res.status(response?.status || 500).json({ message });
    }
}
