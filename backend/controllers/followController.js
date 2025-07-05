const Follow = require("../models/Follow");
const User = require("../models/User");

// Follow a user
const followUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.user._id;

    if (userId === followerId.toString()) {
      return res.status(400).json({
        status: "error",
        message: "You cannot follow yourself",
      });
    }

    // Check if user exists
    const userToFollow = await User.findById(userId);
    if (!userToFollow) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // Check if already following
    const existingFollow = await Follow.findOne({
      follower: followerId,
      following: userId,
    });

    if (existingFollow) {
      return res.status(400).json({
        status: "error",
        message: "Already following this user",
      });
    }

    // Create follow relationship
    const follow = new Follow({
      follower: followerId,
      following: userId,
      status: userToFollow.isPrivate ? "pending" : "accepted",
    });

    await follow.save();

    // Update user's following and follower arrays if accepted
    if (!userToFollow.isPrivate) {
      await User.findByIdAndUpdate(followerId, {
        $push: { following: userId },
      });
      await User.findByIdAndUpdate(userId, {
        $push: { followers: followerId },
      });
    }

    res.json({
      status: "success",
      message: userToFollow.isPrivate
        ? "Follow request sent"
        : "Successfully followed user",
      data: {
        follow,
      },
    });
  } catch (error) {
    console.error("Follow user error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

// Unfollow a user
const unfollowUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.user._id;

    const follow = await Follow.findOneAndDelete({
      follower: followerId,
      following: userId,
    });

    if (!follow) {
      return res.status(404).json({
        status: "error",
        message: "Follow relationship not found",
      });
    }

    // Update user's following and follower arrays
    await User.findByIdAndUpdate(followerId, {
      $pull: { following: userId },
    });
    await User.findByIdAndUpdate(userId, {
      $pull: { followers: followerId },
    });

    res.json({
      status: "success",
      message: "Successfully unfollowed user",
    });
  } catch (error) {
    console.error("Unfollow user error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

// Get user's followers
const getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const user = await User.findById(userId).populate({
      path: "followers",
      select: "name username profilePicture bio isVerified",
      options: {
        skip: skip,
        limit: parseInt(limit),
        sort: { name: 1 },
      },
    });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    const total = user.followers.length;

    res.json({
      status: "success",
      data: {
        users: user.followers || [],
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Get followers error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

// Get user's following
const getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const user = await User.findById(userId).populate({
      path: "following",
      select: "name username profilePicture bio isVerified",
      options: {
        skip: skip,
        limit: parseInt(limit),
        sort: { name: 1 },
      },
    });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    const total = user.following.length;

    res.json({
      status: "success",
      data: {
        users: user.following || [],
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Get following error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

// Get follow requests (for private accounts)
const getFollowRequests = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const requests = await Follow.find({ following: userId, status: "pending" })
      .populate("follower", "name username avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Follow.countDocuments({
      following: userId,
      status: "pending",
    });

    res.json({
      status: "success",
      data: {
        requests,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Get follow requests error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

// Accept follow request
const acceptFollowRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const follow = await Follow.findById(requestId);
    if (!follow || follow.following.toString() !== userId.toString()) {
      return res.status(404).json({
        status: "error",
        message: "Follow request not found",
      });
    }

    follow.status = "accepted";
    await follow.save();

    // Update user's following and follower arrays
    await User.findByIdAndUpdate(follow.follower, {
      $push: { following: userId },
    });
    await User.findByIdAndUpdate(userId, {
      $push: { followers: follow.follower },
    });

    res.json({
      status: "success",
      message: "Follow request accepted",
    });
  } catch (error) {
    console.error("Accept follow request error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

// Reject follow request
const rejectFollowRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const follow = await Follow.findById(requestId);
    if (!follow || follow.following.toString() !== userId.toString()) {
      return res.status(404).json({
        status: "error",
        message: "Follow request not found",
      });
    }

    await Follow.findByIdAndDelete(requestId);

    res.json({
      status: "success",
      message: "Follow request rejected",
    });
  } catch (error) {
    console.error("Reject follow request error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

module.exports = {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getFollowRequests,
  acceptFollowRequest,
  rejectFollowRequest,
};
