import MerchantForm from '../components/merchantForm';


const Merchant = () => {
    const formData = { environment: '', password: '', email: '', merchant_id: '', public_key: '' };
    const handleSubmit = async (data: MerchantData) => {
        console.warn(data);
        // getSession('');
        // addMerchantDetails( data);

        return false;
    }

    return (<MerchantForm formData={formData} onSubmit={handleSubmit} />);
};

export default Merchant;
