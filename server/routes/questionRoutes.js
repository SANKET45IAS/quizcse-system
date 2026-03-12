const express = require("express");

const {
  createQuestion,
  deleteQuestion,
  getAllQuestions,
  getQuestionById,
  updateQuestion,
} = require("../controllers/questionController");
const upload = require("../middleware/upload");

const router = express.Router();

router.route("/").get(getAllQuestions).post(upload.any(), createQuestion);
router
  .route("/:id")
  .get(getQuestionById)
  .put(upload.any(), updateQuestion)
  .delete(deleteQuestion);

module.exports = router;

