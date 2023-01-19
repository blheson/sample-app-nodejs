// import Cors from 'cors'
import { NextApiRequest, NextApiResponse } from 'next';
import { runMiddleware } from '@lib/cors';

import { handleInvoice } from '../../../lib/rkfl';


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
 
                const result = await handleInvoice(body)

                // const result = await getUUID(data);
                // const result = { uuid, merchantAuth, environment, temporaryOrderId };

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
