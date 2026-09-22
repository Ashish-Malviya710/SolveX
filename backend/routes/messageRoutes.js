const router = require("express").Router();
const { protect } = require("../middleware/auth");
const { getMessages, sendMessage } = require("../controllers/messageController");

router.get("/:projectId", protect, getMessages);
router.post("/", protect, sendMessage);

module.exports = router;
