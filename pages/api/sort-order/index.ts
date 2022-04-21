
import { NextApiRequest, NextApiResponse } from 'next';

import { runMiddleware } from '@lib/cors';
import { swapOrder, updateOrderStatus } from '@lib/rkfl';


export default async function merchant(req: NextApiRequest, res: NextApiResponse) {

    // Run the middleware
    await runMiddleware(req, res);

    const {
        body,
        method,
    } = req;

    switch (method) {
        case 'POST':
            try {
                if (!body.temporaryOrderId || !body.orderId || !body.storeHash) {

                    res.status(400).json({ message: "Request must have temporary_order_id, store_hash or order_id" });

                    return;
                }

                const data = {
                    'temporaryOrderId': body.temporaryOrderId,
                    'storeHash': body.storeHash,
                    'orderId': body.orderId.toString()
                }
                let updateResult = { status_id: '' };

                let result = {};
                try {
                    updateResult = await updateOrderStatus(body.storeHash, data.orderId, body.status);
                    console.warn({ updateResult: updateResult.status_id });
                } catch (error) {
                    console.error("updateOrderStatus", error?.message)
                }

                try {
                    result = await swapOrder(data);
                    console.warn("swapOrder result", { result });

                } catch (error) {
                    console.error("Swap error", { message: error?.message })

                }

                // const result = { uuid, merchantAuth, environment, temporaryOrderId };

                // const merchantData = await getMerchantData(req);

                res.status(200).json({ updateOrder: updateResult, swap: result });
            } catch (error) {

                const { message, response } = error;

                console.error("Sort order error", { message, response })
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
