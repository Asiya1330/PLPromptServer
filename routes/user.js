const { addFollower, getLikesViewsPurchasesAndRank, updateUserCreatedAt } = require("../controllers/userController");

const router = require("express").Router();

router.post("/addfollower", addFollower);
router.get("/getlikesviewspurchasesandrank",getLikesViewsPurchasesAndRank);

router.post("/addcreatedAt",updateUserCreatedAt);

module.exports = router;