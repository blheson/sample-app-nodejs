// import Cors from 'cors'
import { NextApiRequest, NextApiResponse } from 'next';
import { runMiddleware } from '@lib/cors';

import { getUUID } from '../../../lib/rkfl';


// Initializing the cors middleware
// const cors = Cors({
//     methods: ['POST'],
//     origin: '*'
// })
// // Helper method to wait for a middleware to execute before continuing
// And to throw an error when an error happens in a middleware
// function runMiddleware(req, res, fn) {
//     return new Promise((resolve, reject) => {
//         fn(req, res, (result) => {
//             if (result instanceof Error) {
//                 return reject(result)
//             }

//             return resolve(result)
//         })
//     })
// }
export default async function merchant(req: NextApiRequest, res: NextApiResponse) {

    // Run the middleware
    await runMiddleware(req, res)

    const {
        body,
        method,
    } = req;

    switch (method) {
        case 'POST':
            try {
                if (!body.amount || !body.currency || !body.cart || !body.storeHash) {
                    res.status(400).json({ message: "Request must have amount, currency, cart" });

                    return;
                }

                const temporaryOrderId = new Date().getTime() + new Date().getTime().toString().substring(1, 4);
                const data = {
                    'amount': body.amount.toString(),
                    'currency': body.currency,
                    'orderId': temporaryOrderId,
                    'cart': body.cart,
                    'storeHash': body.storeHash,
                    'redirectUrl': ''
                }

                const { uuid, merchantAuth, environment } = await getUUID(data);
                const result = { uuid, merchantAuth, environment, temporaryOrderId };

                // const bigcommerce = bigcommerceClient(accessToken, storeHash);

                // const merchantData = await getMerchantData(req);

                res.status(200).json(result);
            } catch (error) {

                const { message, response } = error;

                res.status(response?.status || 500).json({ message });

            }
            break;
        case 'OPTION':
            res.status(200).json('success');
            break;
        default:
            res.setHeader('Allow', ['GET']);
            res.status(405).end(`Method ${method} Not Allowed`);
    }
}
