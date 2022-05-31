import { Box, H1 } from '@bigcommerce/big-design';
import Image from 'next/image';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';
import InnerHeader from './innerHeader';

export const TabIds = {
    HOME: 'home',
    MERCHANT: 'merchant',
};

export const TabRoutes = {
    [TabIds.HOME]: '/',
    [TabIds.MERCHANT]: '/merchant'

};

const HeaderlessRoutes = [
    '/orders/[orderId]',
    '/orders/[orderId]/labels',
    '/orders/[orderId]/modal',
];

const InnerRoutes = [
    '/products/[pid]',
];

const HeaderTypes = {
    GLOBAL: 'global',
    INNER: 'inner',
    HEADERLESS: 'headerless',
};

const Header = () => {

    const [headerType, setHeaderType] = useState<string>(HeaderTypes.GLOBAL);
    const router = useRouter();
    const { pathname } = router;

    useEffect(() => {
        if (InnerRoutes.includes(pathname)) {
            // Use InnerHeader if route matches inner routes
            setHeaderType(HeaderTypes.INNER);
        } else if (HeaderlessRoutes.includes(pathname)) {
            setHeaderType(HeaderTypes.HEADERLESS);
        } else {
            // Check if new route matches TabRoutes

            // Set the active tab to tabKey or set no active tab if route doesn't match (404)

            setHeaderType(HeaderTypes.GLOBAL);
        }

    }, [pathname]);

    useEffect(() => {
        // Prefetch products page to reduce latency (doesn't prefetch in dev)
        router.prefetch('/products');
    });



    if (headerType === HeaderTypes.HEADERLESS) return null;
    if (headerType === HeaderTypes.INNER) return <InnerHeader />;

    return (
        <Box marginBottom="xxLarge">
            <Image src='https://store.rocketfuelblockchain.com/wp-content/uploads/2021/04/RocketFuelLogo-450x81.png' width='166' height='29.88' />
            <H1>Welcome to Rocketfuel</H1>
            <span>Please fill in the details below</span>
            {/* <Tabs
                activeTab={activeTab}
                items={items}
                onTabClick={handleTabClick}
            /> */}
        </Box>
    );
};

export default Header;
