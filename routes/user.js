const { addFollower, getLikesViewsPurchasesAndRank, updateUserCreatedAt, sendverificationemail, updateUserStatus, deleteAllRecords, UpdateUser, fetchUserByEmail } = require("../controllers/userController");

const router = require("express").Router();

// router.post('/sendverficationemail', sendverificationemail);

router.post("/addfollower", addFollower);
router.get("/getlikesviewspurchasesandrank", getLikesViewsPurchasesAndRank);

router.post("/addcreatedAt", updateUserCreatedAt);

router.post("/updateuserstatus",updateUserStatus);

router.delete("/deleteAlltables",deleteAllRecords)

router.put("/update", UpdateUser);
router.get("/fetch-user-by-email", fetchUserByEmail)

module.exports = router;