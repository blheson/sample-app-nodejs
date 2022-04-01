import ErrorMessage from '../components/error';
import MerchantForm from '../components/merchantForm';

import { useUser } from '../lib/hooks';
import { MerchantData } from "../types/data";


const Merchant = () => {
    const {
        merchantData,
        error
    } = useUser();
    const formData = { environment: '', password: '', email: '', merchant_id: '', public_key: '' };

    const newData  = {...formData,...merchantData};
    const handleSubmit = async (data: MerchantData) => {
        console.warn(data);
        // getSession('');
        // addMerchantDetails( data);

        return false;
    }
    // if (isLoading) return <Loading />;
    if (error) return <ErrorMessage error={error} />;

    return (<MerchantForm formData={newData} onSubmit={handleSubmit} />);
};

export default Merchant;
