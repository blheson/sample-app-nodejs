(() => {
    var serverApiUrl = 'https://bigcommerce.rocketfuelblockchain.com';
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
        order_id: 'v2w0dnb99p',
        url: new URL(window.location.href),
        hash: 'v2w0dnb99p',
        watchIframeShow: false,
        rkflConfig: null,
        buttonEventAdded: false,
        user_data: {
            email: null
        },
        loading: false,
        response: {
            uuid: '',
            temporary_order_id: ''
        },


        getEnvironment: function () {
            return RocketfuelPaymentEngine.response?.environment || 'prod';
        },
        getUserData: function () {


            let email = document.querySelector('.customerView-body.optimizedCheckout-contentPrimary')?.innerText || null;

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


                let status = 0;

                if (result?.status === undefined) {
                    return false;
                }

                let result_status = parseInt(result.status);

                if (result_status === 101) {
                    status = 12;
                }

                if (result_status === 1 || result.status === "completed") {

                    status = 11;

                }

                if (result_status === -1) {
                    status = 6;
                }

                window.localStorage.setItem('payment_complete_order_status_rocketfuel', status);

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
                        RocketfuelPaymentEngine.loading = false;

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

            result = JSON.parse(result);

            let theIndex = result[0];
            let cart;

            if (theIndex && theIndex.id) {

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

        e.preventDefault();



        console.log("Default prevented, Loading status", RocketfuelPaymentEngine.loading);

        if (RocketfuelPaymentEngine.loading === true)
            return
        RocketfuelPaymentEngine.loading = true;
        console.log("Loading set to", RocketfuelPaymentEngine.loading);

        let rkflInterval = setInterval(() => {
            if (document.getElementById('Rocketfuel')) {
                document.getElementById('Rocketfuel').style.display = 'block'
                clearInterval(rkflInterval)
            }
        }, 1000)
        RocketfuelPaymentEngine.init();



    }
    function handleClick(e) {

        if (!e.target.id || e.target.id === 'rkfl-btn-place-order') {
            return
        }

        if (e.target.id === 'radio-moneyorder') {
            if (!document.getElementById('rkfl-btn-place-order')) {
                createPlaceOrderButton()
            }
            document.getElementById('checkout-payment-continue').style.visibility = 'hidden'
            setTimeout(() => {
                document.getElementById('rkfl-btn-place-order').style.display = 'block'
            }, 1000)
            RocketfuelPaymentEngine.buttonEventAdded = true;

            console.log("RKFL HAS BEEN SELECTED");



            document.getElementById('checkout-payment-continue').style.visibility = 'hidden';


        } else {
            console.warn("RKFL HAS BEEN UNSELECTED");
            if (document.getElementById('rkfl-btn-place-order')) {
                document.getElementById('rkfl-btn-place-order').style.display = 'none'
            }
            if (document.getElementById('checkout-payment-continue')) {
                document.getElementById('checkout-payment-continue').style.visibility = 'inherit'
            }





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

                        if (!document.getElementById('checkout-payment-continue').dataset.rkfl) {
                            if (document.getElementById('radio-moneyorder')?.checked === true) {
                                // createPlaceOrderButton()
                                document.getElementById('checkout-payment-continue').dataset.rkfl = 'active';

                                if (document.getElementById('rkfl-btn-place-order')) {
                                    document.getElementById('rkfl-btn-place-order').style.display = 'block';
                                }


                                console.log('add button listener');


                            }


                        }


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
        if (!document.getElementById('checkout-payment-continue')) return;
        if (status && document.getElementById('checkout-payment-continue')) {

            setTimeout(() => {

                if (RocketfuelPaymentEngine.loading === true) return;

                document.getElementById('rkfl-btn-place-order').disabled = false;
                document.getElementById('rkfl-btn-place-order').style.display = 'block';
                console.log('make visibile')
            }, 2000)
        } else {

            if (RocketfuelPaymentEngine.response.uuid && RocketfuelPaymentEngine.buttonEventAdded === true) {// if we have uuid, no need to disabled
                console.log('We have UUID, no buton disabling and event has been added ')

                return;
            }
            console.log('Disabling buton');
            document.getElementById('rkfl-btn-place-order').disabled = true;


        }
    }
    function getStoreHash() {
        // return new Promise((resolve, reject) => {
        //     var scriptUrlInterval = setInterval(function () {

        //         if (thisScript) {
        //             try {
        //                 clearInterval(scriptUrlInterval);
        //                 var script_url = thisScript.src;
        //                 let search = script_url.replace(serverApiUrl + `/js/rkfl_checkout.js`, '');
        //                 let par = paramsToJSON(search)

        //                 RocketfuelPaymentEngine.hash = par['storeHash'];

        //                 console.log("Rocketfuel now ready----->");
        //                 resolve(par['storeHash']);
        //             } catch (error) {
        //                 resolve(false)

        //             }                  

        //         }
        //     }, 2000);
        // })

    }

    if (currentPage.includes('checkout')) {

        localStorage.removeItem('temp_orderid_rocketfuel');
        localStorage.removeItem('payment_complete_order_status_rocketfuel');
        function createPlaceOrderButton() {
            if (document.getElementById('rkfl-btn-place-order')) {
                return;
            }
            const rfklCheckoutBtnCover = document.createElement('div');
            rfklCheckoutBtnCover.classList.add('form-actions');

            const rfklCheckoutBtn = document.createElement('div');

            rfklCheckoutBtn.id = 'rkfl-btn-place-order';
            rfklCheckoutBtn.disabled = true;

            rfklCheckoutBtn.style.cssText = 'display:none;background-color:#333;border-color:#333;color:#fff;font-family:Montserrat,Arial,Helvetica,sans-serif;padding:1.1875rem 4.5rem;font-size:1.38462rem;text-align:center;cursor:pointer;margin-left:0;width:100%';

            rfklCheckoutBtn.addEventListener('click', handlePlaceOrderButton);

            rfklCheckoutBtn.innerHTML = 'PLACE ORDER WITH ROCKETFUEL';

            rfklCheckoutBtnCover.appendChild(rfklCheckoutBtn)

            // document.getElementById('checkout-payment-continue').parentElement.prepend(rfklCheckoutBtn);
            const checkoutPayIn = setInterval(() => {
                if (document.getElementById('checkout-payment-continue')) {

                    document.getElementById('checkout-payment-continue').parentNode.parentNode.insertBefore(rfklCheckoutBtnCover, document.getElementById('checkout-payment-continue').parentNode);

                    clearInterval(checkoutPayIn);
                }
            }, 1000);
        }
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

                document.getElementById('iframeWrapper').style.position = 'fixed';

                clearInterval(fixIframe);
            }
        }, 1000);


        document.addEventListener('DOMContentLoaded', async () => {

            createPlaceOrderButton();
            // var scriptUrlInterval = setInterval(async function () {

            //     if (thisScript) {
            //         clearInterval(scriptUrlInterval);
            //         var script_url = thisScript.src;
            //         let search = script_url.replace(serverApiUrl + `/js/rkfl_checkout.js`, '');
            //         let par = paramsToJSON(search)
            //         console.log("par['storeHash']", par['storeHash'])
            //         RocketfuelPaymentEngine.hash = par['storeHash'];
            //         // hash = search.split('&')[0].split('=')[1]
            //         // console.log(hash,'search')
            //         // hash = hash.split('&')[0];
            //         await initUUID();
            //         console.log("Rocketfuel now ready----->");

            //     

            //     }
            // }, 2000);
            await initUUID();


            let formChecklist = setInterval(() => {



                if (document.querySelector('.form-checklist.optimizedCheckout-form-checklist')) {
                    console.log('Interval has been cleared for formChecklist')

                    clearInterval(formChecklist);


                    document.getElementById('checkout-app').addEventListener('click', handleClick, false);


                }

            }, 2000)
            let triggerBtn = setInterval(() => {

                if (document.querySelector('.form-checklist.optimizedCheckout-form-checklist li input#radio-moneyorder')) {

                    mutateObserver();

                    console.log('triggerBtn has been cleared');


                    clearInterval(triggerBtn);


                    if (document.getElementById('radio-moneyorder')?.checked === true) {
                        enableButton(true);
                        if (!document.getElementById('rkfl-btn-place-order')) {
                            createPlaceOrderButton();
                        }

                        RocketfuelPaymentEngine.buttonEventAdded = true;

                        document.getElementById('checkout-payment-continue').dataset.rkfl = 'active'

                    }



                }

            }, 2000)

        });

    }

    if (currentPage.includes('order-confirmation')) {



        let orderStatus = localStorage.getItem('payment_complete_order_status_rocketfuel');
        async function sortSuccessPage() {
            if (orderStatus) {
                const storeHash = await getStoreHash();
                let thankyouInter = setInterval(async () => {

                    if (!document.querySelector('p[data-test=order-confirmation-order-status-text]')) return;

                    document.querySelector('p[data-test=order-confirmation-order-status-text]').innerHTML = 'Your order has been received, An email will be sent containing information about your purchase.';

                    document.querySelector('div[data-test=payment-instructions]').innerHTML = '';

                    clearInterval(thankyouInter);

                    try {
                        const temp_orderid_rocketfuel = localStorage.getItem("temp_orderid_rocketfuel");

                        const order_id = document.querySelector('p[data-test=order-confirmation-order-number-text] strong').innerText;

                        if (!order_id && !temp_orderid_rocketfuel) {

                            console.log("could not retrieve", { order_id, temp_orderid_rocketfuel });

                            return;

                        }

                        var myHeaders = new Headers();

                        myHeaders.append("Content-Type", "application/json");

                        const payload = {

                            temporaryOrderId: temp_orderid_rocketfuel,
                            orderId: order_id,
                            storeHash: RocketfuelPaymentEngine.hash,
                            status: orderStatus
                        }
                        var requestOptions = {
                            method: 'POST',
                            headers: myHeaders,
                            body: JSON.stringify(payload),

                        };

                        const result = await fetch(serverApiUrl + "/api/sort-order", requestOptions);

                        console.log("Result from swap", { result });
                        // if(result){

                        // }

                    } catch (error) {
                        console.error(error?.message);
                    }

                }, 500);

            }
        }
        sortSuccessPage();

    }

})();