import { Button, Flex, Form, FormGroup, Input, Select, Textarea } from '@bigcommerce/big-design';
import { ChangeEvent, FormEvent, useState } from 'react';

import { MerchantData, StringKeyValue } from '../types';
interface FormProps {
    formData: MerchantData;
    onSubmit(form: MerchantData): void;
    storeHash: string
}
const FormErrors = {
    email: 'Email is required',
    publicKey: 'Publickey is required',
};
const MerchantForm = ({ storeHash, formData, onSubmit }: FormProps) => {
    const { environment, password, email, merchantId, publicKey } = formData;


    const [form, setForm] = useState<MerchantData>({ environment, password, email, merchantId, publicKey });
    const [errors, setErrors] = useState<StringKeyValue>({});

    const handleSubmit = (event: FormEvent<EventTarget>) => {
        event.preventDefault();

        // If there are errors, do not submit the form
        const hasErrors = Object.keys(errors).length > 0;

        if (hasErrors) return;

        onSubmit(form);
    };

    const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name: formName, value } = event?.target;
        setForm(prevForm => ({ ...prevForm, [formName]: value }));

        // Add error if it exists in FormErrors and the input is empty, otherwise remove from errors
        !value && FormErrors[formName]
            ? setErrors(prevErrors => ({ ...prevErrors, [formName]: FormErrors[formName] }))
            : setErrors(({ [formName]: removed, ...prevErrors }) => ({ ...prevErrors }));
    };
    const handleSelectChange = (value: string) => {

        setForm(prevForm => ({ ...prevForm, environment: value }));
    };


    return (
        <>
            <Form onSubmit={handleSubmit} >
                <FormGroup>
                    <>
                        <label htmlFor="" style={{    color: '#313440',fontSize:'1rem',fontWeight:600}}>Callback URL:</label>
                        <div style={{ fontSize: '14px' }}>You may login to <a href="https://app.rocketfuelblockchain.com/settings">Rocketfuel Merchant Settings</a> to update your Callback URL to: <span style={{ color: 'red', fontWeight: 600 }}>https://bigcommerce.rocketfuelblockchain.com/api/webhook/transaction/{storeHash}</span></div>
                    </>
                </FormGroup>
                <FormGroup>
                    <Input
                        label="Email"
                        id="rkfl_input_1"
                        labelId='1'
                        type="email"
                        error={errors?.email}
                        name="email"
                        onChange={handleChange}
                        value={form.email}
                        placeholder="Email address"
                        required
                    />
                </FormGroup>
                <FormGroup>
                    <Input
                        label="Password"
                        labelId='2'
                        type="password"
                        name="password"
                        error={errors?.password}
                        id="rkfl_input_2"
                        title="password"
                        onChange={handleChange}
                        value={form.password}

                        description=""
                        placeholder="******"
                        required
                    />
                </FormGroup>
                <FormGroup>

                    <Input
                        label="Merchant ID"
                        type="text"
                        labelId='3'
                        id="rkfl_input_3"

                        name="merchantId"
                        error={errors?.merchantId}

                        value={form.merchantId}
                        onChange={handleChange}

                        placeholder="eyyh-euuej-ee"
                        required
                    />
                </FormGroup>
                <FormGroup>

                    <Textarea
                        label="Public Key"
                        labelId='4'
                        id="rkfl_input_4"

                        name="publicKey"
                        error={errors?.publicKey}
                        rows={3}
                        resize={true}
                        value={form.publicKey}
                        onChange={handleChange}
                  
                        placeholder="Public Key..."
                        required
                    />
                </FormGroup>

                <FormGroup>
                    <Select
                        label="Environment"
                        labelId='5'
                        id="rkfl_input_5"
                        aria-controls='rkfl-bd-select-75-menu'
                        onOptionChange={handleSelectChange}
                        value={form.environment}
                        name="environment"
                        error={errors?.environment}

                        options={[
                            { value: 'prod', content: 'Production' },
                            { value: 'sandbox', content: 'Sandbox' },
                            { value: 'dev', content: 'Development' },
                            { value: 'stage2', content: 'QA' },
                            { value: 'preprod', content: 'Pre-Production' },
                        ]}
                        placeholder="Environment"
                        required
                    />
                </FormGroup>
                <Flex>
                    <Button type="submit">Save Details</Button>
                </Flex>


            </Form>
        </>

    );
};

export default MerchantForm;