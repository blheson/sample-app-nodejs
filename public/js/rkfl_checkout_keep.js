(() => {
    var serverApiUrl = 'https://rkfl-bigcommerce.herokuapp.com';


    var path = window.location.pathname;
    let currentPage = path.split('/').pop();
    var thisScript = document.currentScript;
    // localStorage.removeItem('payment_complete_order_status_rocketfuel')


    function paramsToJSON(search) {
        var search = search.substring(1);
        return JSON.parse('{"' + decodeURI(search).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}')
    }




    // necessary infor include
    // merchant auth, uuid
    /**
     * Payment Engine object
     */
    var RocketfuelPaymentEngine = {

        order_id: '',
        url: new URL(window.location.href),
        hash: '',
        watchIframeShow: false,
        rkflConfig: null,
        user_data: {
            email: null
        },
        response: {
            uuid: '',
            temporary_order_id: ''
        },
        loadButtonRkfl: function () {
            let checkIframe = setInterval(() => {

                if (document.querySelector('#radio-moneyorder')) {


                    clearInterval(checkIframe);
                }

            }, 500);

        },

        getEnvironment: function () {
            return RocketfuelPaymentEngine.response?.environment || 'stage2';
        },
        getUserData: function () {


            let email = RocketfuelPaymentEngine.user_data.email || document.querySelector('.customerView-body.optimizedCheckout-contentPrimary')?.innerText || null;
            const merchantAuth = 'Z+ASsXb/1puWbNxU20jRVtegmZmMg9MtJMAY4h9a/K5vVVvfnDd2LN42fGlOgkq4iKnDFiqF/juYKFNV8YrOht7Y9Qjtamz9cJHhVdqtlabnBIFJCPefHb6FD2ZpQt7qfPTd9LBg15mkndTvq9WoVWvwj7spSHAwXgw1VVGL1ByICVG7AKHZJef6wLX08muTgcOkkLjS8cI00YCoCWqziXgEIJ6fssgFQby6dr6+vTccAgIamt/OHZ1VIqHdXwunv/ai/rPOPrBVhee9KXNDBOUy2n5F+M18itNbvIKvi4oiMU27QohM1hHvwXQLlU3xY4rCLr/kps4NlkwqdeomDg=='; //qa 2335689b-7a4d-420a-9cc0-f5d765a96967
            // const merchantAuth = 'TNc/qaLPSX+al57l7jKkmKz2nPNzJXowAK0AlBwFNTLXdjh0OD74SyqhOTXlM+JA3O1LsxgH0Jm+Z9Rs5nulVI5uGveycWbPsBj912bv8tbuFTUJlgDGZk9mxnZ4lZWNKCusFxuILRJ9qMjJSFB16AeFkI1hVVvEH3tfnEDdx5bcZFDFyEGD1F0P/Lwg0Vvo4gKqKfbaptH5pgX35iXomXC8HvTQyDVIZWi4wa52PYZr0Ws0Jgb7NcNSqHmoviQr8889SOrsWMjeu7YsDpPFEsgx+Knox5+IfFfj1OwpqflzxShtKvepjCxFfnBoV09BP230h/+/zmTkhs7yaTytew=='//merchant test prod 75e5cc4e-fad4-45b2-96d5-9dfea2ccb744
            let user_data = {
                firstName: document.querySelector('.first-name')?.innerText || null,
                lastName: document.querySelector('.family-name')?.innerText || null,
                email,
                merchantAuth
            }

            if (!user_data) return false;

            return user_data;

        },
        triggerPlaceOrder: function () {

            console.log('Trigger is calling');


            document.getElementById('checkout-payment-continue').disabled = false;
            console.log("Event has been removed from button");

            document.getElementById('checkout-payment-continue').click();
            console.log("Place order triggered");
            console.log('Trigger has neen called ');
        },
        updateOrder: function (result) {
            try {

                console.log("Response from callback :", result, result?.status === undefined);


                let status = "bc-failed";

                if (result?.status === undefined) {
                    return false;
                }

                let result_status = parseInt(result.status);

                if (result_status === 101) {
                    status = "bc-partial-payment";
                }

                if (result_status === 1 || result.status === "completed" || result.status === 0) {

                    status = 'bc-processing';

                }

                if (result_status === -1) {
                    status = "bc-failed";
                }

                window.localStorage.setItem('payment_complete_order_status_rocketfuel', status);
                document.getElementById('checkout-payment-continue').removeEventListener('click', handlePlaceOrderButton, false);
                document.getElementById('checkout-payment-continue').dataset.rkfl = 'notactive'


            } catch (error) {

                console.error('Error from update order method', error);

            }

        },

        startPayment: function (autoTriggerState = true) {


            this.watchIframeShow = true;


            let checkIframe = setInterval(() => {

                if (RocketfuelPaymentEngine.rkfl.iframeInfo.iframe) {
                    RocketfuelPaymentEngine.rkfl.initPayment();
                    clearInterval(checkIframe);
                }

            }, 500);

        },
        prepareRetrigger: function () {

            //show retrigger button
            if (document.getElementById('rocketfuel_overlay_page_for_iframe')) {
                document.getElementById('rocketfuel_overlay_page_for_iframe').remove();
            }
            document.getElementById('checkout-payment-continue').disabled = false


        },


        windowListener: function () {
            let engine = this;

            window.addEventListener('message', (event) => {

                switch (event.data.type) {
                    case 'rocketfuel_iframe_close':
                        engine.prepareRetrigger();
                        if (event.data.paymentCompleted === 1) {
                            engine.triggerPlaceOrder();
                        }
                        break;
                    case 'rocketfuel_new_height':
                        if (!document.getElementById('rocketfuel_overlay_page_for_iframe')) {
                            let overlay = document.createElement('div')
                            overlay.id = 'rocketfuel_overlay_page_for_iframe';
                            overlay.style.cssText = "position: fixed;width: 100%;height: 100%;top: 0;"
                            document.body.appendChild(overlay);
                        }

                        engine.watchIframeShow = false;

                    case 'rocketfuel_result_ok':

                        if (event.data.response) {
                            console.log('Event from rocketfuel_result_ok', event.data);
                            RocketfuelPaymentEngine.updateOrder(event.data.response);
                        }

                    default:
                        break;
                }

            })
        },
        setLocalStorage: function (key, value) {
            console.log({ key, value });
            localStorage.setItem(key, value);
        },
        initRocketFuel: async function () {

            return new Promise(async (resolve, reject) => {
                if (!RocketFuel) {
                    location.reload();
                    reject();
                }
                let userData = RocketfuelPaymentEngine.getUserData();

                console.log("This is the USER DATA, ", userData);

                let payload, response, rkflToken;

                RocketfuelPaymentEngine.rkfl = new RocketFuel({
                    environment: RocketfuelPaymentEngine.getEnvironment()
                });


                let uuid = this.response.uuid; //set uuid

                RocketfuelPaymentEngine.rkflConfig = {
                    uuid,
                    callback: RocketfuelPaymentEngine.updateOrder,
                    environment: RocketfuelPaymentEngine.getEnvironment()
                }

                if (userData.firstName && userData.email) {
                    payload = {
                        firstName: userData.firstName,
                        lastName: userData.lastName,
                        email: userData.email,
                        merchantAuth: userData.merchantAuth,
                        kycType: 'null',
                        kycDetails: {
                            'DOB': "01-01-1990"
                        }
                    }

                    try {
                        console.log('details', userData.email, localStorage.getItem('rkfl_email'), payload);

                        if (userData.email !== localStorage.getItem('rkfl_email')) { //remove signon details when email is different
                            localStorage.removeItem('rkfl_token');
                            localStorage.removeItem('access');

                        }

                        rkflToken = localStorage.getItem('rkfl_token');

                        if (!rkflToken && payload.merchantAuth) {

                            response = await RocketfuelPaymentEngine.rkfl.rkflAutoSignUp(payload, RocketfuelPaymentEngine.getEnvironment());


                            RocketfuelPaymentEngine.setLocalStorage('rkfl_email', userData.email);

                            if (response) {

                                rkflToken = response.result?.rkflToken;

                            }

                        }


                        if (rkflToken) {
                            RocketfuelPaymentEngine.rkflConfig.token = rkflToken;
                        }

                        resolve(true);
                    } catch (error) {
                        reject(error?.message);
                    }

                }

                if (RocketfuelPaymentEngine.rkflConfig) {

                    RocketfuelPaymentEngine.rkfl = new RocketFuel(RocketfuelPaymentEngine.rkflConfig); // init RKFL
                    resolve(true);

                } else {
                    resolve(false);
                }

            })

        },

        init: async function () {

            let engine = this;
            console.log('Start initiating RKFL');

            try {

                let res = await engine.initRocketFuel();
                console.log(res);

            } catch (error) {

                console.log('error from promise', error);

            }

            console.log('Done initiating RKFL');

            engine.windowListener();



            engine.startPayment();

        }
    }


    function sortIndividual(items) {
        return items.map(item => {
            return {
                'name': item.name,
                'id': item.id.toString(),
                'price': item.listPrice,
                'quantity': item.quantity.toString()
            }
        })
    }

    function sortCart(cartItems) {
        let customItems = digitalItems = giftCertificates = physicalItems = [];
        if (cartItems.customItems.length > 0) {
            customItems = sortIndividual(cartItems.customItems);
        }
        if (cartItems.digitalItems.length > 0) {
            digitalItems = sortIndividual(cartItems.digitalItems);
        }
        if (cartItems.giftCertificates.length > 0) {
            giftCertificates = sortIndividual(cartItems.giftCertificates);
        }

        if (cartItems.physicalItems.length > 0) {
            physicalItems = sortIndividual(cartItems.physicalItems);
        }
        return [...customItems, ...digitalItems, ...giftCertificates, ...physicalItems]

    }
    async function initUUID() {
        // await RocketfuelPaymentEngine.loadButtonRkfl();

        // console.log('Button loaded');

        var requestOptions = {
            method: 'GET',
            redirect: 'follow'
        };

        try {

            let rootUrl = window.location.origin;

            let response = await fetch(rootUrl + "/api/storefront/carts", requestOptions);

            let result = await response.text();
            console.log('Result from carts: ', result);
            result = JSON.parse(result);

            let theIndex = result[0];
            let cart;

            if (theIndex && theIndex.id) {
                console.log('Result from carts parsed: ', theIndex.id);
                RocketfuelPaymentEngine.user_data.email = theIndex.email;
                cart = sortCart(theIndex.lineItems);

                let payload = {
                    currency: theIndex.currency.code,
                    cart,
                    amount: theIndex.baseAmount,
                    storeHash: RocketfuelPaymentEngine.hash
                }

                console.log('Sorted Cart ', cart, RocketfuelPaymentEngine.hash);
                //Get UUID here
                //fetch here
                var myHeaders = new Headers();

                myHeaders.append("Content-Type", "application/json");

                var requestOptions = {
                    method: 'POST',
                    headers: myHeaders,
                    body: JSON.stringify(payload),

                };

                let uuidResponse = await fetch(serverApiUrl + "/payment.php", requestOptions);



                let uuidResult = await uuidResponse.json();

                console.log('Parse result: ', uuidResult);

                //response here
                //set localstorage
                RocketfuelPaymentEngine.response = uuidResult

                RocketfuelPaymentEngine.setLocalStorage('temp_orderid_rocketfuel', RocketfuelPaymentEngine.response.temporary_order_id)
                // temp_orderid_rocketfuel

                console.log('Engin response ', RocketfuelPaymentEngine.response);

            }

        } catch (error) {

            console.log('error from init', error)
        }

    }
    function handlePlaceOrderButton(e) {
        console.log(e, "Evernt from handle place order");

        e.preventDefault();
        RocketfuelPaymentEngine.init();
    }
    function handleClick(e) {

        console.log(e.target.id, "e.target.id")
        if (!e.target.id) {
            return
        }
        if (e.target.id === 'radio-moneyorder') {

            document.getElementById('checkout-payment-continue').addEventListener('click', handlePlaceOrderButton, false)
            console.log("RKFL HAS BEEN SELECTED");
            document.getElementById('checkout-payment-continue').dataset.rkfl = 'active'
        } else {
            console.warn("RKFL HAS BEEN UNSELECTED");
            document.getElementById('checkout-payment-continue').dataset.rkfl = 'notactive'

            document.getElementById('checkout-payment-continue').removeEventListener('click', handlePlaceOrderButton, false);
            document.getElementById('checkout-payment-continue').disabled = false
        }


    }
    const mutateObserver = () => {
        // Select the node that will be observed for mutations
        const targetNode = document.querySelector('.checkout-step--payment');
        // Options for the observer (which mutations to observe)
        const config = { attributes: true, childList: true, subtree: true };
        // Callback function to execute when mutations are observed
        const callback = function (mutationsList, observer) {
            // Use traditional 'for loops' for IE 11
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    if (document.getElementById('checkout-payment-continue')) {
                        // if (document.querySelector('label[for=radio-moneyorder] span[data-test=payment-method-name]')) {
                        //     if (document.querySelector('label[for=radio-moneyorder] span[data-test=payment-method-name]').innerText !== 'Pay With Rocketfuel') {
                        //         document.querySelector('label[for=radio-moneyorder] span[data-test=payment-method-name]').innerText = 'Pay With Rocketfuel';
                        //     }

                        // }


                        if (!document.getElementById('checkout-payment-continue').dataset.rkfl) {
                            document.getElementById('checkout-payment-continue').addEventListener('click', handlePlaceOrderButton, false)
                            document.getElementById('checkout-payment-continue').dataset.rkfl = 'active'
                            console.log('add button listener')
                        }

                        console.log('A child node has been added or removed.');
                    }

                }

            }
        };

        // Create an observer instance linked to the callback function
        const observer = new MutationObserver(callback);
        // Start observing the target node for configured mutations
        observer.observe(targetNode, config);
    }
    if (currentPage.includes('checkout')) {
        localStorage.removeItem('temp_orderid_rocketfuel');
        let checkPlaceOrder = setInterval(() => {
            if (document.getElementById('radio-moneyorder')) {
                if (document.getElementById('radio-moneyorder').checked == true) {
                    document.getElementById('checkout-payment-continue').disabled = true;
                }
                clearInterval(checkPlaceOrder);
            }
        }, 1000)
        document.addEventListener('DOMContentLoaded', async () => {

            await initUUID();

            if (document.getElementById('checkout-payment-continue')) {
                document.getElementById('checkout-payment-continue').disabled = false;
            }


            let formChecklist = setInterval(() => {



                if (document.querySelector('.form-checklist.optimizedCheckout-form-checklist')) {
                    console.log('Interval has been cleared for ')

                    clearInterval(formChecklist);
                    if (document.getElementById('checkout-payment-continue')) {
                        document.getElementById('checkout-payment-continue').disabled = false;
                    }
                    document.querySelector('.form-checklist.optimizedCheckout-form-checklist').addEventListener('click', handleClick, false);

                }

            }, 2000)
            let triggerBtn = setInterval(() => {



                if (document.querySelector('.form-checklist.optimizedCheckout-form-checklist li input#radio-moneyorder')) {

                    mutateObserver()

                    console.log('triggerBtn has been cleared for ')
                    document.getElementById('checkout-payment-continue').disabled = false;

                    clearInterval(triggerBtn);
                    // document.querySelector('label[for=radio-moneyorder] span[data-test=payment-method-name]').innerText = 'Pay With Rocketfuel';
                    console.log('add button listener')
                    document.getElementById('checkout-payment-continue').addEventListener('click', handlePlaceOrderButton, false)
                    document.getElementById('checkout-payment-continue').dataset.rkfl = 'active'


                }

            }, 2000)


        });

    }

    if (currentPage.includes('order-confirmation')) {

        console.log("Order placed");
        //  document.querySelector('p[data-test=order-confirmation-order-status-text]').innerHTML = 'Your order has been received';
        let result = localStorage.getItem('payment_complete_order_status_rocketfuel')
        //  document.querySelector('p[data-test=order-confirmation-order-status-text]').innerHTML = 'Your order has been received'
        if (result) {
            let thankyouInter = setInterval(() => {

                if (!document.querySelector('p[data-test=order-confirmation-order-status-text]')) return;
                document.querySelector('p[data-test=order-confirmation-order-status-text]').innerHTML = 'Your order has been received, An email will be sent containing information about your purchase.';
                document.querySelector('div[data-test=payment-instructions]').innerHTML = '';

                clearInterval(thankyouInter);

                try {
                    const temp_orderid_rocketfuel = localStorage.getItem("temp_orderid_rocketfuel");

                    const order_id = document.querySelector('p[data-test=order-confirmation-order-number-text] strong').innerText;

                    if (!order_id, !temp_orderid_rocketfuel) {
                        console.log("could not retrieve", { order_id, temp_orderid_rocketfuel });
                        return;
                    }
                    var myHeaders = new Headers();

                    myHeaders.append("Content-Type", "application/json");

                    const payload = {
                        temporary_order_id: temp_orderid_rocketfuel,
                        order_id
                    }

                    var requestOptions = {
                        method: 'POST',
                        headers: myHeaders,
                        body: JSON.stringify(payload),

                    };

                    fetch(serverApiUrl + "/swap.php", requestOptions);

                } catch (error) {

                }
            }, 400);

        }

    }


    // r9f8hq4vqa
    // r9f8hq4vqa.
})();