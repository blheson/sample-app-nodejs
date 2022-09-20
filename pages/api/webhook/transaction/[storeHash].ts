import { NextApiRequest, NextApiResponse } from 'next';
import { runMiddleware } from '@lib/cors';

import { updateOrderStatus, verifyCallback } from '@lib/rkfl';

export default async function transaction(req: NextApiRequest, res: NextApiResponse) {
    await runMiddleware(req, res);

    const {
        body,
        query: { storeHash },
        method,
    } = req;

    switch (method) {
        case 'POST':
            try {

                console.warn({webhook:body});
                const data = body.data;

                const signature = body.signature;
                // const storeHash = body.storeHash;
                const paymentStatus = parseInt(data.paymentStatus);

                const isVerified = verifyCallback(data.data, signature)


                console.warn("Was callback verified?", {isVerified});


                if (!isVerified) {

                    res.status(200).json({ message: 'Could not verify' });

                    return;
                }
                let status = 0;
              
                switch (paymentStatus) {

                    case 1:
                        status = 11;

                        break;
                    case 101:
                        status = 12;

                        break;
                    case -1:
                        status = 6;

                        break;
                    case 0:
                    default:
                        status = 7;
                        break;
                }
                let result;


                if (status !== 7) {

                    result = await updateOrderStatus(storeHash, data.offerId, status);
                    console.warn("Is the order status updated?",{result})

                } else {// do not update if payment status is not confirmed
                    result = { received: true }
                }


                res.status(200).json({ result });
            } catch (error) {

                const { message, response } = error;

                res.status(response?.status || 500).json({ message });

            }
            break;
        case 'GET':
            res.status(200).json('success');
            break;
        case 'OPTION':
            res.status(200).json('success');
            break;
        default:
            res.setHeader('Allow', ['POST', 'GET']);
            res.status(405).end(`Method ${method} Not Allowed`);
    }


}
