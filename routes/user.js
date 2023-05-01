const { addFollower, getLikesViewsPurchasesAndRank, updateUserCreatedAt, sendverificationemail } = require("../controllers/userController");

const router = require("express").Router();

router.post('/sendverficationemail', sendverificationemail);

router.post("/addfollower", addFollower);
router.get("/getlikesviewspurchasesandrank", getLikesViewsPurchasesAndRank);

router.post("/addcreatedAt", updateUserCreatedAt);

module.exports = router;