const { addFollower, getLikesViewsPurchasesAndRank, updateUserCreatedAt, sendverificationemail, updateUserStatus, deleteAllRecords } = require("../controllers/userController");

const router = require("express").Router();

// router.post('/sendverficationemail', sendverificationemail);

router.post("/addfollower", addFollower);
router.get("/getlikesviewspurchasesandrank", getLikesViewsPurchasesAndRank);

router.post("/addcreatedAt", updateUserCreatedAt);

router.post("/updateuserstatus",updateUserStatus);

router.delete("/deleteAlltables",deleteAllRecords)

module.exports = router;