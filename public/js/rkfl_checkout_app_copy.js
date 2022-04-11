
(() => {
    var serverApiUrl = 'https://bigcommerce.rocketfuelblockchain.com';
    // var serverApiUrl = 'https://df4d-102-89-33-196.ngrok.io';

    var path = window.location.pathname;
    let currentPage = path.split('/').pop();
    var thisScript = document.currentScript;
    function paramsToJSON(search) {
        search = search.substring(1);
        return JSON.parse('{"' + decodeURI(search).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}')
    }



    // merchant auth, uuid
    /**
     * Payment Engine object
     */
    var RocketfuelPaymentEngine = {

        order_id: '',
        url: new URL(window.location.href),
        hash: 'v2w0dnb99p',
        watchIframeShow: false,
        rkflConfig: null,
        user_data: {
            email: null
        },
        response: {
            uuid: '',
            temporary_order_id: ''
        },


        getEnvironment: function () {
            return RocketfuelPaymentEngine.response?.environment || 'prod';
        },
        getUserData: function () {


            let email = RocketfuelPaymentEngine.user_data.email || document.querySelector('.customerView-body.optimizedCheckout-contentPrimary')?.innerText || null;

            let user_data = {
                firstName: document.querySelector('.first-name')?.innerText || null,
                lastName: document.querySelector('.family-name')?.innerText || null,
                email,
            }

            if (!user_data) return false;

            return user_data;

        },
        triggerPlaceOrder: function () {


            document.getElementById('checkout-payment-continue').disabled = false;

            document.getElementById('checkout-payment-continue').click();

            console.log('Trigger has been called ');
        },
        updateOrder: function (result) {
            try {

                console.log("Response from callback :", result, result?.status === undefined);


                let status = "bc-on-hold";

                if (result?.status === undefined) {
                    return false;
                }

                let result_status = parseInt(result.status);

                if (result_status === 101) {
                    status = "bc-partial-payment";
                }

                if (result_status === 1 || result.status === "completed") {

                    status = 'bc-processing';

                }

                if (result_status === -1) {
                    status = "bc-failed";
                }

                window.localStorage.setItem('payment_complete_order_status_rocketfuel', status);

                document.getElementById('checkout-payment-continue').removeEventListener('click', handlePlaceOrderButton, false);
                document.getElementById('checkout-payment-continue').dataset.rkfl = 'notactive'
                // document.getElementById('checkout-payment-continue').click();
            } catch (error) {

                console.error('Error from update order method', error?.message);

            }

        },

        startPayment: function (autoTriggerState = true) {

            // document.getElementById('rocketfuel_payment').innerText = "Preparing Payment window...";
            this.watchIframeShow = true;

            // document.getElementById('rocketfuel_payment').disabled = true;

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
            localStorage.setItem(key, value);
        },
        initRocketFuel: async function () {

            return new Promise(async (resolve, reject) => {
                if (!RocketFuel) {
                    location.reload();
                    reject();
                }

                let userData = RocketfuelPaymentEngine.getUserData();

                let payload, response, rkflToken;

                RocketfuelPaymentEngine.rkfl = new RocketFuel({
                    environment: RocketfuelPaymentEngine.getEnvironment()
                });

                // let uuid = await this.getUUID(); //set uuid
                let uuid = RocketfuelPaymentEngine.response.uuid; //set uuid

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
                        merchantAuth: RocketfuelPaymentEngine.response.merchantAuth,
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

                let uuidResponse = await fetch(serverApiUrl + "/api/payment", requestOptions);


                let uuidResult = await uuidResponse.json();

                console.log('Parse result: ', uuidResult);

                //response here
                //set localstorage
                RocketfuelPaymentEngine.response = uuidResult

                RocketfuelPaymentEngine.setLocalStorage('temp_orderid_rocketfuel', RocketfuelPaymentEngine.response.temporaryOrderId)
                // temp_orderid_rocketfuel

                console.log('Engin response ', RocketfuelPaymentEngine.response);

            }

        } catch (error) {

            console.log('error from init', error)
        }

    }
    function handlePlaceOrderButton(e) {
        console.log(e, "Event from handle place order");


        e.preventDefault();
        RocketfuelPaymentEngine.init();
    }
    function handleClick(e) {
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
    function enableButton(status) {
        if(!document.getElementById('checkout-payment-continue')) return;
        if (status && document.getElementById('checkout-payment-continue')) {
           
            console.log('Enabling buton')

            document.getElementById('checkout-payment-continue').disabled = false;
        } else {
            console.log('Disabling buton')
            document.getElementById('checkout-payment-continue').disabled = true;

        }
    }
    if (currentPage.includes('checkout')) {
        localStorage.removeItem('temp_orderid_rocketfuel');
        let checkPlaceOrder = setInterval(() => {
            if (document.getElementById('radio-moneyorder')) {
              

                if (document.getElementById('radio-moneyorder').checked == true) {
                    enableButton(false);
                }
                clearInterval(checkPlaceOrder);
            }
        }, 1000);

        let fixIframe = setInterval(() => {
            if (document.getElementById('iframeWrapper')) {
                console.log('Disabling')

                document.getElementById('iframeWrapper').style.position = 'fixed';

                clearInterval(fixIframe);
            }
        }, 1000);
        
        document.addEventListener('DOMContentLoaded', async () => {


            await initUUID();
            console.log("Rocketfuel now ready----->");
            enableButton(true);

            let formChecklist = setInterval(() => {

                if (document.querySelector('.form-checklist.optimizedCheckout-form-checklist')) {
                    console.log('Interval has been cleared for ')

                    clearInterval(formChecklist);
                    enableButton(true);

                    document.querySelector('.form-checklist.optimizedCheckout-form-checklist').addEventListener('click', handleClick, false);

                }

            }, 2000)
            let triggerBtn = setInterval(() => {

                if (document.querySelector('.form-checklist.optimizedCheckout-form-checklist li input#radio-moneyorder')) {

                    mutateObserver()

                    console.log('triggerBtn has been cleared for ');

                    enableButton(true);

                    clearInterval(triggerBtn);
                    // document.querySelector('label[for=radio-moneyorder] span[data-test=payment-method-name]').innerText = 'Pay With Rocketfuel';

                    document.getElementById('checkout-payment-continue').addEventListener('click', handlePlaceOrderButton, false)
                    document.getElementById('checkout-payment-continue').dataset.rkfl = 'active'


                }

            }, 2000)

        });

    }

    if (currentPage.includes('order-confirmation')) {



        let result = localStorage.getItem('payment_complete_order_status_rocketfuel')

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

                    fetch(serverApiUrl + "/swap", requestOptions);

                } catch (error) {

                }
            }, 500);

        }
    }


    // r9f8hq4vqa
    // r9f8hq4vqa.
})();