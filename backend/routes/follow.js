const express = require("express");
const {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getFollowRequests,
  acceptFollowRequest,
  rejectFollowRequest,
} = require("../controllers/followController");
const { auth } = require("../middleware/auth");

const router = express.Router();

// @route   POST /api/follow/:userId
// @desc    Follow a user
// @access  Private
router.post("/:userId", auth, followUser);

// @route   DELETE /api/follow/:userId
// @desc    Unfollow a user
// @access  Private
router.delete("/:userId", auth, unfollowUser);

// @route   GET /api/follow/:userId/followers
// @desc    Get user's followers
// @access  Public
router.get("/:userId/followers", getFollowers);

// @route   GET /api/follow/:userId/following
// @desc    Get user's following
// @access  Public
router.get("/:userId/following", getFollowing);

// @route   GET /api/follow/requests
// @desc    Get follow requests (for current user)
// @access  Private
router.get("/requests", auth, getFollowRequests);

// @route   POST /api/follow/requests/:requestId/accept
// @desc    Accept follow request
// @access  Private
router.post("/requests/:requestId/accept", auth, acceptFollowRequest);

// @route   POST /api/follow/requests/:requestId/reject
// @desc    Reject follow request
// @access  Private
router.post("/requests/:requestId/reject", auth, rejectFollowRequest);

module.exports = router;
