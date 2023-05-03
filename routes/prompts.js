const { insertPrompt, getPrompts, getTrendingPromptsBasedOnHourlyFactor, fetchNonApprovedPrompts, approvePrompt, markFeatured, getBadgesByUserID, updatePrompt } = require("../controllers/promptController");
const { insertPromptLikes, getPromptLikeByUserId } = require('../controllers/promptLikesController')
const { insertPromptPurchase, getPromptPurchaseByUserId } = require('../controllers/promptPurchase')
const { insertPromptViews, getPromptViewByUserId } = require('../controllers/promptviewsController')

const router = require("express").Router();

router.post("/addprompt/", insertPrompt);
router.get("/getprompts/", getPrompts);
router.get("/gettrendingprompt/", getTrendingPromptsBasedOnHourlyFactor)
router.get("/getnonapprovedprompts/", fetchNonApprovedPrompts)
router.post("/approvePrompt", approvePrompt);
router.post("/markfeature", markFeatured);
router.get("/getbadgesbyuserid", getBadgesByUserID);

router.post("/likeprompt/", insertPromptLikes);
router.get("/likeprompt/:userId/:promptId", getPromptLikeByUserId);

router.post("/viewprompt/", insertPromptViews);
router.get("/promptview/:userId/:promptId", getPromptViewByUserId);

router.post("/purchaseprompt/", insertPromptPurchase);
router.get("/purchaseprompt/:userId/:promptId", getPromptPurchaseByUserId);

router.post("/update", updatePrompt);

module.exports = router;
