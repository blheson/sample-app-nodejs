import { NextApiRequest, NextApiResponse } from 'next';

import { getUUID } from '../../../lib/rkfl';

export default async function merchant(req: NextApiRequest, res: NextApiResponse) {

    const {
        body,
        method,
    } = req;

    switch (method) {
        case 'GET':
            try {
                if (!body.amount || !body.currency || !body.cart || !body.storeHash) {
                    res.status(400).json({ message: "Request must have amount, currency, cart" });

                    return;
                }


                const data = {
                    'amount': body.amount.toString(),
                    'currency': body.currency,
                    'orderId': body.orderId || new Date().getTime() + new Date().getTime().toString().substring(1, 4),
                    'cart': body.cart,
                    'storeHash': body.storeHash,
                    'redirectUrl': ''
                }

                const { uuid, merchantAuth } = await getUUID(data);
      
                // const bigcommerce = bigcommerceClient(accessToken, storeHash);

                // const merchantData = await getMerchantData(req);

                res.status(200).json({ uuid, merchantAuth:Buffer.from(merchantAuth).toString("base64")});
            } catch (error) {

                const { message, response } = error;

                res.status(response?.status || 500).json({ message });

            }
            break;
        default:
            res.setHeader('Allow', ['GET']);
            res.status(405).end(`Method ${method} Not Allowed`);
    }
}
