
import ErrorMessage from '../components/error';
import MerchantForm from '../components/merchantForm';
import { useSession } from '../context/session';
import { useUser } from '../lib/hooks';
import { MerchantData } from "../types/data";

const Merchant = () => {
    const {
        merchantData,
        error
    } = useUser();

    const encodedContext = useSession()?.context;

    const formData = { environment: '', password: '', email: '', merchant_id: '', public_key: '' };

    const newData  = {...formData,...merchantData};
    const handleSubmit = async (data: MerchantData) => {
  
        // Update product details
        const response=await fetch(`/api/merchant?context=${encodedContext}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const result = await response.json();
   
        return result;
    }
    // if (isLoading) return <Loading />;
    if (error) return <ErrorMessage error={error} />;

    return (<MerchantForm formData={newData} onSubmit={handleSubmit} />);
};

export default Merchant;
