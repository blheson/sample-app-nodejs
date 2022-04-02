import { NextApiRequest, NextApiResponse } from 'next';
// import { getSession } from '../../../lib/auth';
import { getMerchantData, setMerchantData, } from '../../../lib/merchant';

export default async function merchant(req: NextApiRequest, res: NextApiResponse) {

    const {
        body,
        method,
    } = req;

    switch (method) {
        case 'GET':
            try {

                // const { storeHash } = await getSession(req);
               
                // const bigcommerce = bigcommerceClient(accessToken, storeHash);

                // const { data } = await bigcommerce.get('/content/scripts');
                const merchantData = await getMerchantData(req);

                res.status(200).json(merchantData);
            } catch (error) {
                const { message, response } = error;
                res.status(response?.status || 500).json({ message });
            }
            break;
        case 'POST':
            try {
                // const { storeHash } = await getSession(req);

                const merchantData = await setMerchantData(req, body);

                res.status(200).json({ merchantData });

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
