
import { NextApiRequest, NextApiResponse } from 'next';

import { runMiddleware } from '@lib/cors';
// eslint-disable-next-line import/namespace
import { swapOrder, updateOrderStatus, validateAuth } from '@lib/rkfl';


export default async function merchant(req: NextApiRequest, res: NextApiResponse) {

    // Run the middleware
    await runMiddleware(req, res);

    const {
        body,
        headers,
        method,
    } = req;
    switch (method) {
        case 'POST':
            try {
                if (headers['merchant-auth'] == '' || !body.temporaryOrderId || !body.orderId || !body.storeHash || !body.uuid) {

                    res.status(400).json({ message: "Request must have temporary_order_id, store_hash or order_id" });

                    return;
                }

                const data = {
                    'temporaryOrderId': body.temporaryOrderId,
                    'storeHash': body.storeHash,
                    'orderId': body.orderId.toString()
                }
                let updateResult;

                let result = {};
                try {
                    const validation = await validateAuth(body.storeHash, headers['merchant-auth'] as string);
                     
                    if (validation.error === false) {
                        updateResult = await updateOrderStatus(body.storeHash, data.orderId, body.uuid);
                    }
                    console.warn({ updateResult });

                } catch (error) {

                    console.error("updateOrderStatus", error?.message);

                }
                // if (updateResult && !updateResult.error) {
                    try {

                        result = await swapOrder(data);

                        console.warn("swapOrder result", { result });

                    } catch (error) {
                        console.error("Swap error", { message: error?.message })

                    }
                // }


                // const result = { uuid, merchantAuth, environment, temporaryOrderId };

                // const merchantData = await getMerchantData(req);

                res.status(200).json({ updateOrder: updateResult?.status_id, swap: result });

            } catch (error) {

                const { message, response } = error;

                console.error("Sort order error", { message, response });

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
