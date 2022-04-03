import { NextApiRequest, NextApiResponse } from 'next';

import { getSession } from '../../../lib/auth';

import { getUUID } from '../../../lib/rkfl';

export default async function merchant(req: NextApiRequest, res: NextApiResponse) {

    const {
        body,
        method,
    } = req;

    switch (method) {
        case 'GET':
            try {

                const { storeHash } = await getSession(req);

                const data = {
                    'amount': body.amount.toString(),
                    'currency': body.currency,
                    'orderId': new Date().getTime() + new Date().getTime().toString().substring(1, 4),
                    'cart': body.cart,
                    'storeHash': storeHash,
                    'redirectUrl': ''
                }

                const { uuid } = await getUUID(data);

                // const bigcommerce = bigcommerceClient(accessToken, storeHash);

                // const merchantData = await getMerchantData(req);

                res.status(200).json(uuid);
            } catch (error) {

                const { message, response } = error;

                res.status(response?.status || 500).json({ message });

            }
            break;
        default:
            res.setHeader('Allow', ['GET', 'POST']);
            res.status(405).end(`Method ${method} Not Allowed`);
    }
}
