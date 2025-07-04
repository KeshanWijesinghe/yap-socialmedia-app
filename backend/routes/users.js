const express = require("express");
const { body } = require("express-validator");
const User = require("../models/User");
const { auth, adminAuth } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get("/profile", auth, async (req, res) => {
  try {
    res.json({
      status: "success",
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put(
  "/profile",
  [
    auth,
    upload.single("profilePicture"),
    body("name")
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Name must be between 2 and 50 characters"),
    body("username")
      .optional()
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage("Username must be between 3 and 20 characters")
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage(
        "Username can only contain letters, numbers, and underscores"
      ),
    body("email")
      .optional()
      .isEmail()
      .withMessage("Please provide a valid email")
      .normalizeEmail(),
    body("bio")
      .optional()
      .isLength({ max: 160 })
      .withMessage("Bio cannot exceed 160 characters"),
    body("phone")
      .optional()
      .isMobilePhone("any")
      .withMessage("Please provide a valid phone number"),
  ],
  async (req, res) => {
    try {
      const {
        name,
        username,
        email,
        bio,
        website,
        location,
        phone,
        isPrivate,
      } = req.body;

      // Check if email or username is already taken by another user
      if (email && email !== req.user.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(400).json({
            status: "error",
            message: "Email is already in use",
          });
        }
      }

      if (username && username !== req.user.username) {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
          return res.status(400).json({
            status: "error",
            message: "Username is already taken",
          });
        }
      }

      const updateData = {};
      if (name) updateData.name = name;
      if (username) updateData.username = username;
      if (email) updateData.email = email;
      if (bio !== undefined) updateData.bio = bio;
      if (website !== undefined) updateData.website = website;
      if (location !== undefined) updateData.location = location;
      if (phone !== undefined) updateData.phone = phone;
      if (typeof isPrivate === "boolean") updateData.isPrivate = isPrivate;

      // Handle profile picture upload
      if (req.file) {
        updateData.profilePicture = `/uploads/${req.file.filename}`;
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        updateData,
        { new: true, runValidators: true }
      );

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: {
          user: updatedUser,
        },
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private/Admin
router.get("/", adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;

    const filter = {};
    if (search) {
      filter.$or = [
        { name: new RegExp(search, "i") },
        { email: new RegExp(search, "i") },
      ];
    }

    const skip = (page - 1) * limit;

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      status: "success",
      data: {
        users,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
});

// @route   GET /api/users/search
// @desc    Search users by name or username
// @access  Private
router.get("/search", auth, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters long",
      });
    }

    const searchRegex = new RegExp(q.trim(), "i");

    const users = await User.find({
      $and: [
        {
          $or: [
            { name: { $regex: searchRegex } },
            { username: { $regex: searchRegex } },
          ],
        },
        { _id: { $ne: req.user._id } }, // Exclude current user
      ],
    })
      .select("name username profilePicture isVerified")
      .limit(20);

    res.json({
      success: true,
      data: {
        users,
      },
    });
  } catch (error) {
    console.error("Search users error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user profile by ID
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("followers", "name username profilePicture")
      .populate("following", "name username profilePicture");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Ensure virtual fields are included
    const userWithCounts = user.toJSON();
    userWithCounts.followerCount = user.followers.length;
    userWithCounts.followingCount = user.following.length;

    // Add isFollowing field to indicate if current user follows this user
    userWithCounts.isFollowing = user.followers.some(
      (follower) => follower._id.toString() === req.user._id.toString()
    );

    // Add isFollowedByUser field to indicate if this user follows the current user back
    userWithCounts.isFollowedByUser = user.following.some(
      (followedUser) => followedUser._id.toString() === req.user._id.toString()
    );

    res.json({
      success: true,
      data: {
        user: userWithCounts,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   POST /api/users/:id/follow
// @desc    Follow a user
// @access  Private
router.post("/:id/follow", auth, async (req, res) => {
  try {
    console.log("=== FOLLOW REQUEST DEBUG ===");
    console.log("- Target user ID:", req.params.id);
    console.log("- Current user ID:", req.user._id);
    console.log("- Current user ID type:", typeof req.user._id);
    console.log("- Target user ID type:", typeof req.params.id);
    console.log(
      "- IDs are equal (string)?",
      req.params.id === req.user._id.toString()
    );

    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    console.log("- User to follow found:", !!userToFollow);
    console.log("- User to follow name:", userToFollow?.name);
    console.log("- Current user found:", !!currentUser);
    console.log("- Current user name:", currentUser?.name);
    console.log(
      "- Current user following array length:",
      currentUser?.following?.length
    );

    if (!userToFollow) {
      console.log("- ERROR: User to follow not found");
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (req.params.id === req.user._id.toString()) {
      console.log("- ERROR: User trying to follow themselves");
      return res.status(400).json({
        success: false,
        message: "You cannot follow yourself",
      });
    }

    // Check if already following
    const isAlreadyFollowing = currentUser.following.some(
      (id) => id.toString() === req.params.id
    );
    console.log("- Already following check:", isAlreadyFollowing);

    if (isAlreadyFollowing) {
      console.log("- ERROR: Already following this user");
      return res.status(400).json({
        success: false,
        message: "Already following this user",
      });
    }

    // Add to following/followers
    currentUser.following.push(req.params.id);
    userToFollow.followers.push(req.user._id);

    await Promise.all([currentUser.save(), userToFollow.save()]);

    console.log("- Follow operation successful");
    console.log("=== END FOLLOW REQUEST DEBUG ===");

    res.json({
      success: true,
      message: "Successfully followed user",
    });
  } catch (error) {
    console.error("Follow user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   DELETE /api/users/:id/follow
// @desc    Unfollow a user
// @access  Private
router.delete("/:id/follow", auth, async (req, res) => {
  try {
    const userToUnfollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    if (!userToUnfollow) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Remove from following/followers
    currentUser.following = currentUser.following.filter(
      (id) => id.toString() !== req.params.id
    );
    userToUnfollow.followers = userToUnfollow.followers.filter(
      (id) => id.toString() !== req.user._id.toString()
    );

    await Promise.all([currentUser.save(), userToUnfollow.save()]);

    res.json({
      success: true,
      message: "Successfully unfollowed user",
    });
  } catch (error) {
    console.error("Unfollow user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;
