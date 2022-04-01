import { Button, Flex, Form, FormGroup, Input, Select, Textarea } from '@bigcommerce/big-design';
import { ChangeEvent, FormEvent, useState } from 'react';

import { MerchantData, StringKeyValue } from '../types';
interface FormProps {
    formData: MerchantData;
    onSubmit(form: MerchantData): void;
}
const FormErrors = {
    name: 'Product name is required',
    price: 'Default price is required',
};
const MerchantForm = ({ formData, onSubmit }: FormProps) => {
    const { environment, password, email, merchant_id, public_key } = formData;

    const [form, setForm] = useState<MerchantData>({ environment, password, email, merchant_id, public_key });
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
                    <Input
                        label="Email"
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
                        type="password"
                        name="password"
                        error={errors?.password}

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
                        name="merchant_id"
                        error={errors?.merchant_id}

                        value={form.merchant_id}
                        onChange={handleChange}

                        placeholder="eyyh-euuej-ee"
                        required
                    />
                </FormGroup>
                <FormGroup>

                    <Textarea
                        label="Public Key"

                        name="public_key"
                        error={errors?.public_key}
                        rows={3}
                        resize={true}
                        value={form.public_key}
                        onChange={handleChange}
                        description="Public Key."
                        placeholder="Public Key..."
                        required
                    />
                </FormGroup>

                <FormGroup>
                    <Select
                        label="Environment"
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