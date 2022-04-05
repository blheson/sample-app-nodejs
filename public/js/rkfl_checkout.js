(() => {
    var serverApiUrl = 'https://a434-197-210-28-239.ngrok.io';


    var path = window.location.pathname;
    let currentPage = path.split('/').pop();
    var thisScript = document.currentScript;
    function paramsToJSON(search) {
         search = search.substring(1);
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
        hash:'',
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

                    document.querySelector('#radio-moneyorder').parentElement.querySelector('label .paymentProviderHeader-cc').innerHTML = '<div id="rocketfuel_payment" class="rocketfuel_payment">Click to pay</div>';


                    document.querySelector(".rocketfuel_payment").addEventListener('click', (e) => {


                        RocketfuelPaymentEngine.init();

                    })
                    clearInterval(checkIframe);
                }

            }, 500);

        },
        getUUID: async function () {

            let result = {
                data: {
                    temporary_order_id: new Date().getTime() + '_' + Math.floor(Math.random() * 999),

                    uuid: '5ae7a2f6-d10c-4491-80ea-1672147067fd'

                }
            }
            RocketfuelPaymentEngine.order_id = result.data.temporary_order_id;

            window.localStorage.setItem('temp_orderid_rocketfuel', result.data.temporary_order_id);

            console.log("res", result.data.uuid);

            return result.data.uuid;

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
        updateOrder: function (result) {
            try {

                console.log("Response from callback :", result, result?.status === undefined);


                let status = "wc-on-hold";

                if (result?.status === undefined) {
                    return false;
                }

                let result_status = parseInt(result.status);

                if (result_status === 101) {
                    status = "wc-partial-payment";
                }

                if (result_status === 1 || result.status === "completed") {

                    status = 'wc-processing';

                }

                if (result_status === -1) {
                    status = "wc-failed";
                }

                window.localStorage.setItem('payment_complete_order_status_rocketfuel', status);

                document.getElementById('checkout-payment-continue').removeEventListener('click', handlePlaceOrderButton, false);

                document.getElementById('checkout-payment-continue').click();
            } catch (error) {

                console.error('Error from update order method', error);

            }

        },

        startPayment: function (autoTriggerState = true) {

            // document.getElementById('rocketfuel_payment').innerText = "Preparing Payment window...";
            this.watchIframeShow = true;

            document.getElementById('rocketfuel_payment').disabled = true;

            let checkIframe = setInterval(() => {

                if (RocketfuelPaymentEngine.rkfl.iframeInfo.iframe) {
                    RocketfuelPaymentEngine.rkfl.initPayment();
                    clearInterval(checkIframe);
                }

            }, 500);

        },
        prepareRetrigger: function () {

            //show retrigger button
            document.getElementById('rocketfuel_payment').disabled = false;
            document.getElementById('checkout-payment-continue').disabled = false


        },
        prepareProgressMessage: function () {

            //revert trigger button message
            document.getElementById('rocketfuel_payment').disabled = true;

        },

        windowListener: function () {
            let engine = this;

            window.addEventListener('message', (event) => {

                switch (event.data.type) {
                    case 'rocketfuel_iframe_close':
                        engine.prepareRetrigger();
                        break;
                    case 'rocketfuel_new_height':
                        engine.prepareProgressMessage();
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

                console.log("This is the USER DATA, ", userData);

                let payload, response, rkflToken;

                RocketfuelPaymentEngine.rkfl = new RocketFuel({
                    environment: RocketfuelPaymentEngine.getEnvironment()
                });

                // let uuid = await this.getUUID(); //set uuid
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
                        merchantAuth: atob(this.response.merchantAuth),
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
        await RocketfuelPaymentEngine.loadButtonRkfl();

        console.log('Button loaded');

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


                console.log('Engin response ', RocketfuelPaymentEngine.response);

            }

        } catch (error) {

            console.log('error from init', error)
        }

    }
    function handlePlaceOrderButton(e) {
        console.log(e, "Evernt from handle place order");
        document.getElementById('checkout-payment-continue').disabled = true

        e.preventDefault();
        RocketfuelPaymentEngine.init();
    }
    function handleClick(e) {

        if (e.target.id === 'radio-moneyorder') {

            document.getElementById('checkout-payment-continue').addEventListener('click', handlePlaceOrderButton, false)
            console.log("RKFL HAS BEEN SELECTED");

        } else {
            console.warn("RKFL HAS BEEN UNSELECTED");
            document.getElementById('checkout-payment-continue').removeEventListener('click', handlePlaceOrderButton, false);
            document.getElementById('checkout-payment-continue').disabled = false
        }


    }

    if (currentPage.includes('checkout')) {

        document.addEventListener('DOMContentLoaded', async () => {
            var scriptUrlInterval = setInterval(async function () {
  
                if (thisScript) {
                    clearInterval(scriptUrlInterval);
                    var script_url = thisScript.src;
                    let search = script_url.replace(`https://businesstosales.com/assets/js/rkfl_checkout.js`, '');
                    let par =  paramsToJSON(search)
        
                    RocketfuelPaymentEngine.hash = par['storeHash'];
                    // hash = search.split('&')[0].split('=')[1]
                    // console.log(hash,'search')
                    // hash = hash.split('&')[0];
                    await initUUID();
                }
            }, 2000);
          

            let formChecklist = setInterval(() => {

          

                if (document.querySelector('.form-checklist.optimizedCheckout-form-checklist')) {
                    console.log('Interval has been cleared for ')

                    clearInterval(formChecklist);

                    document.querySelector('.form-checklist.optimizedCheckout-form-checklist').addEventListener('click', handleClick, false);

                }

            }, 2000)

        });

    }

    if (currentPage.includes('order-confirmation')) {

        console.log("Order placed");

    }


    // r9f8hq4vqa
    // r9f8hq4vqa.
})();