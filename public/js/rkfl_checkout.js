(() => {
    var serverApiUrl = 'https://bigcommerce.rocketfuelblockchain.com';

    var path = window.location.pathname; let currentPage = path.split('/').pop(); var thisScript = document.currentScript; function paramsToJSON(search) { search = search.substring(1); return JSON.parse('{"' + decodeURI(search).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}') }
    var RocketfuelPaymentEngine = {
        order_id: '', url: new URL(window.location.href), hash: '', watchIframeShow: false, rkflConfig: null, buttonEventAdded: false, user_data: { email: null }, loading: false, response: { uuid: '', temporary_order_id: '' }, getEnvironment: function () { return RocketfuelPaymentEngine.response?.environment || 'prod'; }, getUserData: function () {
            let email = document.querySelector('.customerView-body.optimizedCheckout-contentPrimary')?.innerText || null; let user_data = { firstName: document.querySelector('.first-name')?.innerText || null, lastName: document.querySelector('.family-name')?.innerText || null, email, }
            if (!user_data) return false; return user_data;
        }, triggerPlaceOrder: function () { document.getElementById('checkout-payment-continue').disabled = false; document.getElementById('checkout-payment-continue').click(); }, updateOrder: function (result) {
            try {
                document.getElementById('checkout-payment-continue').dataset.rkfl = 'notactive'
            } catch (error) { console.error('Error from update order method', error?.message); }
        }, startPayment: function (autoTriggerState = true) { this.watchIframeShow = true; let checkIframe = setInterval(() => { if (RocketfuelPaymentEngine.rkfl.iframeInfo.iframe) { RocketfuelPaymentEngine.rkfl.initPayment(); clearInterval(checkIframe); } }, 500); }, prepareRetrigger: function () {
            if (document.getElementById('rocketfuel_overlay_page_for_iframe')) { document.getElementById('rocketfuel_overlay_page_for_iframe').remove(); }
            document.getElementById('checkout-payment-continue').disabled = false
        }, windowListener: function () {
            let engine = this; window.addEventListener('message', (event) => {
                switch (event.data.type) {
                    case 'rocketfuel_iframe_close': RocketfuelPaymentEngine.loading = false; engine.prepareRetrigger(); if (event.data.paymentCompleted === 1) { engine.triggerPlaceOrder(); }
                        break; case 'rocketfuel_new_height': if (!document.getElementById('rocketfuel_overlay_page_for_iframe')) {
                            let overlay = document.createElement('div')
                            overlay.id = 'rocketfuel_overlay_page_for_iframe'; overlay.style.cssText = "position: fixed;width: 100%;height: 100%;top: 0;"
                            document.body.appendChild(overlay);
                        }
                        engine.watchIframeShow = false; case 'rocketfuel_result_ok': if (event.data.response) { console.log('Event from rocketfuel_result_ok', event.data); RocketfuelPaymentEngine.updateOrder(event.data.response); }
                    default: break;
                }
            })
        }, setLocalStorage: function (key, value) { localStorage.setItem(key, value); }, initRocketFuel: async function () {
            return new Promise(async (resolve, reject) => {
                if (!RocketFuel) { location.reload(); reject(); }
                let userData = RocketfuelPaymentEngine.getUserData(); let payload, response, rkflToken; RocketfuelPaymentEngine.rkfl = new RocketFuel({ environment: RocketfuelPaymentEngine.getEnvironment() }); let uuid = RocketfuelPaymentEngine.response.uuid; RocketfuelPaymentEngine.rkflConfig = { uuid, callback: RocketfuelPaymentEngine.updateOrder, environment: RocketfuelPaymentEngine.getEnvironment() }
                if (userData.firstName && userData.email) {
                    payload = { firstName: userData.firstName, lastName: userData.lastName, email: userData.email, merchantAuth: RocketfuelPaymentEngine.response.merchantAuth, kycType: 'null', kycDetails: { 'DOB': "01-01-1990" } }
                    try {
                        if (userData.email !== localStorage.getItem('rkfl_email')) { localStorage.removeItem('rkfl_token'); localStorage.removeItem('access'); }
                        rkflToken = localStorage.getItem('rkfl_token'); if (!rkflToken && payload.merchantAuth) {
                            try { response = await RocketfuelPaymentEngine.rkfl.rkflAutoSignUp(payload, RocketfuelPaymentEngine.getEnvironment()); RocketfuelPaymentEngine.setLocalStorage('rkfl_email', userData.email); } catch (error) { console.error("Error from signup", error?.message) }
                            if (response) { rkflToken = response.result?.rkflToken; }
                        }
                        if (rkflToken) { RocketfuelPaymentEngine.rkflConfig.token = rkflToken; }
                        resolve(true);
                    } catch (error) { reject(error?.message); }
                }
                if (RocketfuelPaymentEngine.rkflConfig) { RocketfuelPaymentEngine.rkfl = new RocketFuel(RocketfuelPaymentEngine.rkflConfig); resolve(true); } else { resolve(false); }
            })
        }, init: async function () {
            let engine = this; console.log('Start initiating RKFL'); try { let res = await engine.initRocketFuel(); } catch (error) { console.log('error from promise', error); }
            console.log('Done initiating RKFL'); engine.windowListener(); engine.startPayment();
        }
    }
    function getcheckoutTotal(cart, shipping) {
        if (!shipping) {
            return cart
        }
        return parseFloat(cart.toString()) + parseFloat(shipping.toString())
    }
    function sortShipping(amount) {
        return { 'name': 'Shipping', 'id': 'shipping', 'price': amount, 'quantity': '1' }
    }
    function sortIndividual(items) { return items.map(item => { return { 'name': item.name, 'id': item.id.toString(), 'price': item.listPrice, 'quantity': item.quantity.toString() } }) }
    function sortCart({ cart: cartItems, shipping }) {
        let customItems = shippingItems = digitalItems = giftCertificates = physicalItems = []; if (cartItems.customItems.length > 0) { customItems = sortIndividual(cartItems.customItems); }
        if (cartItems.digitalItems.length > 0) { digitalItems = sortIndividual(cartItems.digitalItems); }
        if (cartItems.giftCertificates.length > 0) { giftCertificates = sortIndividual(cartItems.giftCertificates); }
        if (cartItems.physicalItems.length > 0) { physicalItems = sortIndividual(cartItems.physicalItems); }
        if (shipping?.amount && parseFloat(shipping.amount) > 0) {
            shippingItems = [sortShipping(shipping.amount)]
        }
        return [...customItems, ...digitalItems, ...giftCertificates, ...physicalItems, ...shippingItems]
    }
    async function initUUID() {
        var requestOptions = { method: 'GET', redirect: 'follow' }; try {
            let rootUrl = window.location.origin; let response = await fetch(rootUrl + "/api/storefront/carts", requestOptions);

            let result = await response.text(); result = JSON.parse(result); let theIndex = result[0]; let cart, checkoutResult; if (theIndex && theIndex.id) {
                try {
                    let checkoutResponse = await fetch(rootUrl + "/api/storefront/checkout/" + theIndex.id, requestOptions);
                    checkoutResult = await checkoutResponse.text(); checkoutResult = JSON.parse(checkoutResult);


                } catch (error) {
                    console.error('[COULDNOT_SHIPPING]', error)
                }


                RocketfuelPaymentEngine.user_data.email = theIndex.email; cart = sortCart({ cart: theIndex.lineItems, shipping: { amount: checkoutResult?.shippingCostTotal } }); let payload = { currency: theIndex.currency.code, cart, amount: getcheckoutTotal(theIndex.baseAmount,checkoutResult?.shippingCostTotal) }
                console.warn('[DATA_GENERATED]', { payload });
                payload = {...payload,storeHash: RocketfuelPaymentEngine.hash}
                var myHeaders = new Headers(); myHeaders.append("Content-Type", "application/json"); var requestOptions = { method: 'POST', headers: myHeaders, body: JSON.stringify(payload) }; let uuidResponse = await fetch(serverApiUrl + "/api/payment", requestOptions); let uuidResult = await uuidResponse.json();
                RocketfuelPaymentEngine.response = uuidResult

                RocketfuelPaymentEngine.setLocalStorage('merchant_auth_rocketfuel', RocketfuelPaymentEngine.response.merchantAuth)
                RocketfuelPaymentEngine.setLocalStorage('temp_orderid_rocketfuel', RocketfuelPaymentEngine.response.temporaryOrderId)
                RocketfuelPaymentEngine.setLocalStorage('uuid_rocketfuel', RocketfuelPaymentEngine.response.uuid)
            }
        } catch (error) { console.error('error from init', error) }
    }
    function handlePlaceOrderButton(e) {
        e.preventDefault(); console.log("Default prevented, Loading status", RocketfuelPaymentEngine.loading); if (RocketfuelPaymentEngine.loading === true)
            return
        RocketfuelPaymentEngine.loading = true; let rkflInterval = setInterval(() => {
            if (document.getElementById('Rocketfuel')) {
                document.getElementById('Rocketfuel').style.display = 'block'
                clearInterval(rkflInterval)
            }
        }, 1000)
        RocketfuelPaymentEngine.init();
    }
    function handleClick(e) {

        const excludedIds = ['terms', 'rkfl-btn-place-order', 'checkout-payment-continue'];

        if (!e.target?.id || excludedIds.includes(e.target.id)) { return }
        if (e.target.id === 'radio-moneyorder') {
            if (!document.getElementById('rkfl-btn-place-order')) { createPlaceOrderButton() }
            document.getElementById('checkout-payment-continue').style.visibility = 'hidden'
            setTimeout(() => { if (document.getElementById('radio-moneyorder')?.checked === true) { document.getElementById('rkfl-btn-place-order').style.display = 'block' } }, 1000)
            RocketfuelPaymentEngine.buttonEventAdded = true; console.log("RKFL HAS BEEN SELECTED"); document.getElementById('checkout-payment-continue').style.visibility = 'hidden';
        } else {
            RocketfuelPaymentEngine.loading === false
            console.warn("RKFL HAS BEEN UNSELECTED"); if (document.getElementById('rkfl-btn-place-order')) { document.getElementById('rkfl-btn-place-order').style.display = 'none' }
            if (document.getElementById('checkout-payment-continue')) { document.getElementById('checkout-payment-continue').style.visibility = 'inherit' }
        }
    }
    const mutateObserver = () => { const targetNode = document.querySelector('.checkout-step--payment'); const config = { attributes: true, childList: true, subtree: true }; const callback = function (mutationsList, observer) { for (const mutation of mutationsList) { if (mutation.type === 'childList') { if (document.getElementById('checkout-payment-continue')) { if (!document.getElementById('checkout-payment-continue').dataset.rkfl) { if (document.getElementById('radio-moneyorder')?.checked === true) { document.getElementById('checkout-payment-continue').dataset.rkfl = 'active' } } } } } }; const observer = new MutationObserver(callback); observer.observe(targetNode, config); }
    function enableButton(status) {
        if (!document.getElementById('checkout-payment-continue')) return; if (status && document.getElementById('checkout-payment-continue')) { setTimeout(() => { if (RocketfuelPaymentEngine.loading === true) return; document.getElementById('rkfl-btn-place-order').disabled = false; document.getElementById('rkfl-btn-place-order').style.display = 'block'; }, 2000) } else {
            if (RocketfuelPaymentEngine.response.uuid && RocketfuelPaymentEngine.buttonEventAdded === true) {
                console.log('We have UUID, no buton disabling and event has been added ')
                return;
            }
            document.getElementById('rkfl-btn-place-order').disabled = true;
        }
    }
    function getStoreHash() {
        return new Promise((resolve, reject) => {
            var scriptUrlInterval = setInterval(function () {
                if (thisScript) {
                    try {
                        clearInterval(scriptUrlInterval); var script_url = thisScript.src; let search = script_url.replace(serverApiUrl + `/js/rkfl_checkout.js`, ''); let par = paramsToJSON(search)
                        RocketfuelPaymentEngine.hash = par['storeHash']; console.log("Rocketfuel now ready----->"); resolve(par['storeHash']);
                    } catch (error) { resolve(false) }
                }
            }, 2000);
        })
    }
    if (currentPage.includes('checkout')) {
        localStorage.removeItem('temp_orderid_rocketfuel');
        localStorage.removeItem('merchant_auth_rocketfuel');
        function createPlaceOrderButton() {
            if (document.getElementById('rkfl-btn-place-order')) { return; }
            const rfklCheckoutBtnCover = document.createElement('div'); rfklCheckoutBtnCover.classList.add('form-actions'); const rfklCheckoutBtn = document.createElement('div'); rfklCheckoutBtn.id = 'rkfl-btn-place-order'; rfklCheckoutBtn.disabled = true; rfklCheckoutBtn.style.cssText = 'display:none;background-color:#333;border-color:#333;color:#fff;font-family:Montserrat,Arial,Helvetica,sans-serif;padding:1.1875rem 4.5rem;font-size:1.38462rem;text-align:center;cursor:pointer;margin-left:0;width:100%'; rfklCheckoutBtn.addEventListener('click', handlePlaceOrderButton); rfklCheckoutBtn.innerHTML = 'PLACE ORDER WITH ROCKETFUEL'; rfklCheckoutBtnCover.appendChild(rfklCheckoutBtn)
            const checkoutPayIn = setInterval(() => { if (document.getElementById('checkout-payment-continue')) { document.getElementById('checkout-payment-continue').parentNode.parentNode.insertBefore(rfklCheckoutBtnCover, document.getElementById('checkout-payment-continue').parentNode); clearInterval(checkoutPayIn); } }, 1000);
        }
        let checkPlaceOrder = setInterval(() => {
            if (document.getElementById('radio-moneyorder')) {
                if (document.getElementById('radio-moneyorder').checked == true) { enableButton(false); }
                clearInterval(checkPlaceOrder);
            }
        }, 1000); let fixIframe = setInterval(() => { if (document.getElementById('iframeWrapper')) { document.getElementById('iframeWrapper').style.position = 'fixed'; clearInterval(fixIframe); } }, 1000); document.addEventListener('DOMContentLoaded', async () => {
            createPlaceOrderButton(); var scriptUrlInterval = setInterval(async function () {
                if (thisScript) {
                    clearInterval(scriptUrlInterval); var script_url = thisScript.src; let search = script_url.replace(serverApiUrl + `/js/rkfl_checkout.js`, ''); let par = paramsToJSON(search)
                    RocketfuelPaymentEngine.hash = par['storeHash']; await initUUID(); console.log("Rocketfuel now ready----->");
                }
            }, 2000); let formChecklist = setInterval(() => { if (document.querySelector('.form-checklist.optimizedCheckout-form-checklist')) { clearInterval(formChecklist); document.getElementById('checkout-app').addEventListener('click', handleClick, false); } }, 2000)
            let triggerBtn = setInterval(() => {
                if (document.querySelector('.form-checklist.optimizedCheckout-form-checklist li input#radio-moneyorder')) {
                    mutateObserver(); clearInterval(triggerBtn); if (document.getElementById('radio-moneyorder')?.checked === true) {
                        if (!document.getElementById('rkfl-btn-place-order')) { createPlaceOrderButton(); }
                        enableButton(true); RocketfuelPaymentEngine.buttonEventAdded = true; document.getElementById('checkout-payment-continue').dataset.rkfl = 'active'
                    }
                }
            }, 2000)
        });
    }
    if (currentPage.includes('order-confirmation')) {

        let uuid = localStorage.getItem('uuid_rocketfuel');
        let merchant_auth_rocketfuel = localStorage.getItem('merchant_auth_rocketfuel');

        async function sortSuccessPage() {
            if (uuid) {
                const storeHash = await getStoreHash(); let thankyouInter = setInterval(async () => {
                    if (!document.querySelector('p[data-test=order-confirmation-order-status-text]')) return; document.querySelector('p[data-test=order-confirmation-order-status-text]').innerHTML = 'Your order has been received, An email will be sent containing information about your purchase.'; document.querySelector('div[data-test=payment-instructions]').innerHTML = ''; clearInterval(thankyouInter); try {
                        const temp_orderid_rocketfuel = localStorage.getItem("temp_orderid_rocketfuel"); const order_id = document.querySelector('p[data-test=order-confirmation-order-number-text] strong').innerText; if (!order_id && !temp_orderid_rocketfuel) { return; }
                        var myHeaders = new Headers(); myHeaders.append("Content-Type", "application/json"); myHeaders.append("merchant-auth", merchant_auth_rocketfuel);

                        const payload = { temporaryOrderId: temp_orderid_rocketfuel, orderId: order_id, storeHash: RocketfuelPaymentEngine.hash, uuid }
                        var requestOptions = { method: 'POST', headers: myHeaders, body: JSON.stringify(payload), }; const response = await fetch(serverApiUrl + "/api/sort-order", requestOptions);
                        const result = await response.json()
                        console.log("Result from swap", { result });
                    } catch (error) { console.error(error?.message); }
                }, 500);
            }
        }
        sortSuccessPage();
    }
})();
console.log('v1.0.1')