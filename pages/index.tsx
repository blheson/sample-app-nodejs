import { AlertProps } from '@bigcommerce/big-design';
import ErrorMessage from '../components/error';
import MerchantForm from '../components/merchantForm';
import { useSession } from '../context/session';
import { useUser } from '../lib/hooks';
import { MerchantData } from "../types/data";
import { alertsManager } from './_app';



const Index = () => {
    const {
        merchantData = [],
        error
    } = useUser();


    const encodedContext = useSession()?.context;

    const formData = { environment: '', password: '', email: '', merchantId: '', publicKey: '' };
    let newData;
    if (merchantData.length > 0) {
        const theData = merchantData[0];

        delete theData.createdAt
        delete theData.updatedAt
        newData = { ...formData, ...theData };

    } else {
        newData = formData;
    }


    const handleSubmit = async (data: MerchantData) => {

        // Update product details
        const response = await fetch(`/api/merchant?context=${encodedContext}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const result = await response.json();
        if (result.merchantData.affectedRows === 1) {
            const alert = {
                // header: 'Optional Headline',
                messages: [
                    {
                        text: 'Details saved'
                    },
                ],
                type: 'success',
                onClose: () => null,
            } as AlertProps;


            alertsManager.add(alert);
        }

        return result;
    }
    // if (isLoading) return <Loading />;
    if (error) return <ErrorMessage error={error} />;

    return (<MerchantForm formData={newData} onSubmit={handleSubmit} />);
};

export default Index;
