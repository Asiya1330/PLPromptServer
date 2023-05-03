const { PaymentLink, Connect, CreateSellerAcc, RedirectCallback } = require("../controllers/stripe");

const router = require("express").Router();

router.post("/payment-link", PaymentLink)
router.get("/connect", Connect);
router.get("/connect/oauth/callback", RedirectCallback)

router.post("/createselleracc", CreateSellerAcc);

module.exports = router;
