const Stripe = require("stripe");
const userModel = require("../models/userModel");

require("dotenv").config();

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);


module.exports.CheckoutSession = async (req, res) => {
    const { userId } = req['body'];
    const customer = await stripe.customers.create({
        metadata: {
            userId: userId,
            cart: JSON.stringify(req.body.cartItems),
        },
    });

    const line_items = req.body.cartItems.map((item) => {
        return {
            price_data: {
                currency: "usd",
                product_data: {
                    name: item.name,
                    images: [item.image],
                    description: item.desc,
                    metadata: {
                        id: item.id,
                    },
                },
                unit_amount: item.price * 100,
            },
            quantity: item.cartQuantity,
        };
    });

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        shipping_address_collection: {
            allowed_countries: ["US", "CA", "KE"],
        },
        shipping_options: [
            {
                shipping_rate_data: {
                    type: "fixed_amount",
                    fixed_amount: {
                        amount: 0,
                        currency: "usd",
                    },
                    display_name: "Free shipping",
                    // Delivers between 5-7 business days
                    delivery_estimate: {
                        minimum: {
                            unit: "business_day",
                            value: 5,
                        },
                        maximum: {
                            unit: "business_day",
                            value: 7,
                        },
                    },
                },
            },
            {
                shipping_rate_data: {
                    type: "fixed_amount",
                    fixed_amount: {
                        amount: 1500,
                        currency: "usd",
                    },
                    display_name: "Next day air",
                    // Delivers in exactly 1 business day
                    delivery_estimate: {
                        minimum: {
                            unit: "business_day",
                            value: 1,
                        },
                        maximum: {
                            unit: "business_day",
                            value: 1,
                        },
                    },
                },
            },
        ],
        phone_number_collection: {
            enabled: true,
        },
        line_items,
        mode: "payment",
        customer: customer.id,
        success_url: `${process.env.CLIENT_URL}/checkout-success`,
        cancel_url: `${process.env.CLIENT_URL}/cart`,
    });

    res.send({ url: session.url });
}

module.exports.PaymentLink = async (req, res, next) => {
    try {
        const { userId, name, description, images, price } = req['body'];
        const priceInCents = price.split('$')[0];

        if (!userId || !name || !description || !images || !price) return res.send({ msg: 'required params are missing' })

        const data = await userModel.findOne({ _id: userId });
        
        if (!data?.ownerStripeId) return res.send({ msg: 'seller of this product is not connected to stripe Oauth' })

        const product = await stripe.products.create({
            name,
            description,
            images: images.length ? images : ['https://promptbase-files.s3.amazonaws.com/promptbase-dev-645036e52e2323b5ef654b1d/1682978804697-avatar-diffusion1.png']
        })

        const priceStripe = await stripe.prices.create({
            unit_amount: priceInCents * 100,
            currency: 'usd',
            product: product.id,
            tax_behavior: 'inclusive'
        })
        // const account = await stripe.accounts.update(
        //     data.ownerStripeId,
        //     {
        //         tos_acceptance: {
        //             service_agreement: 'recipient',
        //         },
        //     }
        // );
        // console.log('====================================');
        // console.log(account, 'lolol');
        console.log('====================================');
        const paymentLink = await stripe.paymentLinks.create({
            line_items: [
                {
                    price: priceStripe.id,
                    quantity: 1,
                },
            ],
            transfer_data: {
                destination: data.ownerStripeId
                // destination: 'acct_1N3e5TPTRjOAGUVA',
            },
        });

        console.log(paymentLink);
        res.send(paymentLink)
    }
    catch (err) {
        console.log(err);
        next(err)
    }
}

module.exports.Connect = async (req, res, next) => {
    try {
        res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');

        const redirectUri = process.env.REDirect_CONNECT_OAUTH_CALLBACK
        const authorizeUrl = await stripe.oauth.authorizeUrl({
            response_type: "code",
            client_id: process.env.STRIPE_CLIENT_ID,
            redirect_uri: redirectUri,
            scope: 'read_write' // The scopes your platform needs to access the seller's account
            // state: 'some-state-data', // Optional parameter to help prevent CSRF attacks
        });
        console.log(authorizeUrl);
        res.send(authorizeUrl);
    }
    catch (err) {
        next(err)
    }
}


module.exports.RedirectCallback = async (req, res, next) => {
    try {

        const { code } = req.query;
        if (!code) return res.send({ msg: 'code parameter is required' })
        // Exchange authorization code for access token
        const response = await stripe.oauth.token({
            grant_type: 'authorization_code',
            code,
        });

        // Get seller account ID from response
        const sellerAccountId = response.stripe_user_id;
        console.log(response, 'p;ololo');
        // Store seller account ID in your database
        // ...

        // Redirect to a success page
        return res.send(response);
    }
    catch (err) {
        next(err)
    }
}


module.exports.CreateSellerAcc = async (req, res, next) => {
    try {

        const { email } = req['body'];
        const account = await stripe.accounts.create({
            country: 'US',
            type: 'custom',
            capabilities: {
                card_payments: {
                    requested: true,
                },
                transfers: {
                    requested: true,
                },
            },
        });

        res.send(account)
    }
    catch (err) {
        next(err)
    }
}