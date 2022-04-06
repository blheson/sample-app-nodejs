import Index from '@pages/index';
import { render, screen } from '@test/utils';

jest.mock('@lib/hooks', () => require('@mocks/hooks'));

describe('Homepage', () => {
    test('renders form', () => {
        const { container } = render(<Index />);
        const merchantId = screen.getByRole('textbox', { name: 'Merchant ID' });
        const email = screen.getByRole('textbox', { name: 'Email' });
        const password = screen.getByTitle('password');
        const publicKey = screen.getByRole('textbox', { name: 'Public Key' });
        const environment = screen.getByRole('listbox', { name: 'Environment' });

        expect(container.firstChild).toMatchSnapshot();
        expect(email).toBeInTheDocument();
        expect(merchantId).toBeInTheDocument();
        expect(password).toBeInTheDocument();
      
        expect(environment).toBeInTheDocument();
        expect(publicKey).toBeInTheDocument();
    });
    
});
