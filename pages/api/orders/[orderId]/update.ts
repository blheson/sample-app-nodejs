
import { NextApiRequest, NextApiResponse } from 'next';

import { runMiddleware } from '@lib/cors';
import { updateOrderStatus } from '@lib/rkfl';

export default async function orderId(req: NextApiRequest, res: NextApiResponse) {

    await runMiddleware(req, res);

    const {
        body,
        query: { orderId },
        method,
    } = req;

    // console.log(req.query,req.origin);
    try {


        switch (method) {
            case 'POST': {

                if (!body.storeHash || body.status === undefined) {
                    res.status(400).json({message: "Request must have storeHash,  status" });

                    return;
                }

                const result = await updateOrderStatus(body.storeHash, orderId, body.status);
         

                res.status(200).json({ result });

                break;
            }

            default: {
                res.setHeader('Allow', ['POST']);
                res.status(405).end(`Method ${method} Not Allowed`);
            }
        }

    } catch (error) {
        const { message, response } = error;
        res.status(response?.status || 500).json({ message });
    }
}
