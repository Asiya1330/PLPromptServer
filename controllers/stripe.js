const Stripe = require("stripe");
const userModel = require("../models/userModel");

require("dotenv").config();

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);


module.exports.CheckoutSession = async (req, res) => {
    try {
        let { userId, userEmail, userName, stripeCustomerId, promptProduct } = req['body'];
        const promptOwner = await userModel.findOne({ _id: promptProduct.userId });
        console.log(promptOwner.email);
        if (!promptOwner?.ownerStripeId) return res.send({ msg: 'seller of this product is not connected to stripe Oauth' })

        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: userEmail,
                name: userName,
                metadata: {
                    userId: userId,
                    cart: JSON.stringify(req.body.cartItems),
                },
            });
            stripeCustomerId = customer.id;
            const updateUser = await userModel.findOneAndUpdate({ _id: userId },
                { stripeCustomerId: customer.id },
                { returnOriginal: false });
            console.log(updateUser);
        }
        const priceInCents = promptProduct.price.split('$')[0];
        const line_items = [{
            price_data: {
                currency: "usd",
                product_data: {
                    name: promptProduct.name,
                    images: promptProduct.images,
                    description: promptProduct.description,
                    metadata: {
                        id: promptProduct._id,
                    },
                },
                unit_amount: priceInCents * 100,
            },
            quantity: 1
        }]
        const percentagePrice = Math.ceil((3 / 100) * priceInCents * 100)
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items,
            mode: "payment",
            customer: stripeCustomerId,
            payment_intent_data: {
                transfer_data: {
                    destination: promptOwner.ownerStripeId, // Replace with the ID of the destination account
                },
                application_fee_amount: percentagePrice
            },
            success_url: `${process.env.Remote_Base}/prompt/${encodeURIComponent(promptProduct.name)}`,
            cancel_url: `${process.env.Remote_Base}/failed-payment`,
        });
        res.send({ url: session.url, stripeCustomerId });
    }
    catch (err) {
        console.log(err);
        return res.send({ msg: err })
    }
}

module.exports.PaymentLink = async (req, res, next) => {
    try {
        // const { userId, name, description, images, price, payment_link } = req['body'];
        if (!req['body'].userId || !req['body'].name || !req['body'].description || !req['body'].images || !req['body'].price) return res.send({ msg: 'required params are missing' })
        if (!req['body'].payment_link) {

            const priceInCents = req['body'].price.split('$')[0];

            const data = await userModel.findOne({ _id: req['body'].userId });
            if (!data?.ownerStripeId) return res.send({ msg: 'seller of this product is not connected to stripe Oauth' })

            console.log(req['body'].images.length, req['body'].images);
            const product = await stripe.products.create({
                name: req['body'].name,
                description: req['body'].description,
                images: req['body'].images.length ? req['body'].images : ['https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTPzMemoV1boDZEE_CMFcBm4_dOhrT7Qy4b-Q&usqp=CAU']
            })

            const priceStripe = await stripe.prices.create({
                unit_amount: priceInCents * 100,
                currency: 'usd',
                product: product.id,
                tax_behavior: 'inclusive'
            })
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
            return paymentLink
        }
        return { msg: 'Payment Link already attached' }
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
