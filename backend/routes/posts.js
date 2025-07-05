const express = require("express");
const { body } = require("express-validator");
const {
  getFeed,
  getUserPosts,
  getPostById,
  createPost,
  toggleLike,
  sharePost,
  addComment,
  getComments,
  updatePost,
  deletePost,
  updateComment,
  deleteComment,
} = require("../controllers/postController");
const { auth } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

// Post validation rules
const postValidation = [
  body("content")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Post content cannot exceed 2000 characters"),
];

// Comment validation rules
const commentValidation = [
  body("content")
    .trim()
    .notEmpty()
    .withMessage("Comment content is required")
    .isLength({ min: 1, max: 500 })
    .withMessage("Comment content must be between 1 and 500 characters"),
];

// @route   GET /api/posts/feed
// @desc    Get posts feed (from followed users + own posts)
// @access  Private
router.get("/feed", auth, getFeed);

// @route   GET /api/posts/:postId
// @desc    Get single post by ID
// @access  Public
router.get("/:postId", getPostById);

// @route   GET /api/posts/user/:userId
// @desc    Get user's posts
// @access  Public
router.get("/user/:userId", getUserPosts);

// @route   POST /api/posts
// @desc    Create new post
// @access  Private
router.post("/", auth, postValidation, createPost);

// @route   POST /api/posts/with-media
// @desc    Create new post with media
// @access  Private
router.post(
  "/with-media",
  auth,
  upload.array("images", 5),
  postValidation,
  createPost
);

// @route   POST /api/posts/:postId/like
// @desc    Like/Unlike a post
// @access  Private
router.post("/:postId/like", auth, toggleLike);

// @route   POST /api/posts/:postId/share
// @desc    Share a post
// @access  Private
router.post("/:postId/share", auth, sharePost);

// @route   POST /api/posts/:postId/comments
// @desc    Add comment to post
// @access  Private
router.post("/:postId/comments", auth, commentValidation, addComment);

// @route   GET /api/posts/:postId/comments
// @desc    Get comments for a post
// @access  Public
router.get("/:postId/comments", getComments);

// @route   PUT /api/posts/comments/:commentId
// @desc    Update a comment
// @access  Private (Comment author only)
router.put("/comments/:commentId", auth, commentValidation, updateComment);

// @route   DELETE /api/posts/comments/:commentId
// @desc    Delete a comment
// @access  Private (Comment author or Post owner)
router.delete("/comments/:commentId", auth, deleteComment);

// @route   DELETE /api/posts/:postId
// @desc    Delete post
// @access  Private (Owner or Admin)
router.delete("/:postId", auth, deletePost);

// @route   PUT /api/posts/:postId
// @desc    Update post
// @access  Private (Owner only)
router.put("/:postId", auth, postValidation, updatePost);

module.exports = router;
