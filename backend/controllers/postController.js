const { validationResult } = require("express-validator");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const User = require("../models/User");
const { checkToxicity } = require("../utils/toxicityChecker");

// Get personalized feed (followed users + own posts)
const getFeed = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    const userId = req.user._id;

    // Get current user with following list
    const currentUser = await User.findById(userId).select("following");

    // Create filter: posts from followed users + current user's own posts
    const authorIds = [...(currentUser.following || []), userId];

    const posts = await Post.find({
      author: { $in: authorIds },
      isPublic: true,
    })
      .populate("author", "name username avatar profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get actual comment counts for each post
    const postsWithCounts = await Promise.all(
      posts.map(async (post) => {
        const commentCount = await Comment.countDocuments({ post: post._id });
        const postObj = post.toObject();
        return {
          ...postObj,
          commentCount,
          likeCount: post.likes?.length || 0,
          shareCount: post.shares?.length || 0,
        };
      })
    );

    const total = await Post.countDocuments({
      author: { $in: authorIds },
      isPublic: true,
    });

    res.json({
      status: "success",
      data: {
        posts: postsWithCounts,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Get feed error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

// Get user's posts
const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ author: userId })
      .populate("author", "name username avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get actual comment counts for each post
    const postsWithCounts = await Promise.all(
      posts.map(async (post) => {
        const commentCount = await Comment.countDocuments({ post: post._id });
        const postObj = post.toObject();
        return {
          ...postObj,
          commentCount,
          likeCount: post.likes?.length || 0,
          shareCount: post.shares?.length || 0,
        };
      })
    );

    const total = await Post.countDocuments({ author: userId });

    res.json({
      status: "success",
      data: {
        posts: postsWithCounts,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Get user posts error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

// Get single post by ID
const getPostById = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId).populate(
      "author",
      "name username avatar profilePicture"
    );

    if (!post) {
      return res.status(404).json({
        status: "error",
        message: "Post not found",
      });
    }

    // Get actual comment count
    const commentCount = await Comment.countDocuments({ post: postId });
    const postObj = post.toObject();

    res.json({
      status: "success",
      data: {
        post: {
          ...postObj,
          author: post.author,
          commentCount,
        },
      },
    });
  } catch (error) {
    console.error("Get post by ID error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

// Create a new post
const createPost = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    // Check if either content or images are provided
    const hasContent = req.body.content && req.body.content.trim().length > 0;
    const hasImages = req.files && req.files.length > 0;

    if (!hasContent && !hasImages) {
      return res.status(400).json({
        status: "error",
        message: "Post must have either content or images",
      });
    }

    // Check for toxic content if post has text content
    if (hasContent) {
      const toxicityCheck = await checkToxicity(req.body.content);
      if (toxicityCheck.isToxic) {
        return res.status(400).json({
          status: "error",
          message:
            "Your post contains toxic or inappropriate content. Please revise your message.",
          isToxic: true,
          confidence: toxicityCheck.confidence,
        });
      }
    }

    const postData = {
      ...req.body,
      author: req.user._id,
    };

    // Handle uploaded images
    if (req.files && req.files.length > 0) {
      postData.images = req.files.map((file) => ({
        url: `/uploads/${file.filename}`,
        alt: file.originalname,
      }));
    }

    const post = new Post(postData);
    await post.save();
    await post.populate("author", "name username avatar");

    res.status(201).json({
      status: "success",
      message: "Post created successfully",
      data: {
        post,
      },
    });
  } catch (error) {
    console.error("Create post error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

// Like/Unlike a post
const toggleLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        status: "error",
        message: "Post not found",
      });
    }

    const existingLike = post.likes.find(
      (like) => like.user.toString() === userId.toString()
    );

    if (existingLike) {
      // Unlike
      post.likes = post.likes.filter(
        (like) => like.user.toString() !== userId.toString()
      );
    } else {
      // Like
      post.likes.push({ user: userId });
    }

    await post.save();
    await post.populate("author", "name username avatar");

    const postObj = post.toObject();

    res.json({
      status: "success",
      message: existingLike ? "Post unliked" : "Post liked",
      data: {
        post: {
          ...postObj,
          likeCount: post.likes?.length || 0,
          shareCount: post.shares?.length || 0,
        },
        liked: !existingLike,
      },
    });
  } catch (error) {
    console.error("Toggle like error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

// Share a post
const sharePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        status: "error",
        message: "Post not found",
      });
    }

    // Check if already shared
    const existingShare = post.shares.find(
      (share) => share.user.toString() === userId.toString()
    );
    if (existingShare) {
      return res.status(400).json({
        status: "error",
        message: "Post already shared",
      });
    }

    post.shares.push({ user: userId });
    await post.save();

    res.json({
      status: "success",
      message: "Post shared successfully",
      data: {
        shareCount: post.shareCount,
      },
    });
  } catch (error) {
    console.error("Share post error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

// Add comment to post
const addComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const firstError = errors.array()[0];
      return res.status(400).json({
        status: "error",
        message: firstError.msg || "Validation failed",
        errors: errors.array(),
      });
    }

    const { postId } = req.params;
    const { content, parentComment } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        status: "error",
        message: "Post not found",
      });
    }

    // Create comment first
    const comment = new Comment({
      content,
      author: req.user._id,
      post: postId,
      parentComment: parentComment || null,
    });

    await comment.save();
    await comment.populate("author", "name username avatar");

    // Add comment to post
    post.comments.push(comment._id);
    await post.save();

    // If it's a reply, add to parent comment
    if (parentComment) {
      await Comment.findByIdAndUpdate(parentComment, {
        $push: { replies: comment._id },
      });
    }

    // Check for toxic content AFTER posting
    const toxicityCheck = await checkToxicity(content);
    if (toxicityCheck.isToxic) {
      console.log(
        `🚫 Toxic comment detected and will be deleted. User: ${req.user._id}, Confidence: ${toxicityCheck.confidence}`
      );

      // Return success with comment data but mark as toxic
      // The frontend will show it briefly then delete
      res.status(201).json({
        status: "success",
        message: "Comment added successfully",
        data: {
          comment,
          isToxic: true,
          confidence: toxicityCheck.confidence,
        },
      });

      // Delete the comment after 3 seconds (giving frontend time to display)
      setTimeout(async () => {
        try {
          await Comment.findByIdAndDelete(comment._id);

          // Remove from post's comments array
          await Post.findByIdAndUpdate(postId, {
            $pull: { comments: comment._id },
          });

          // Remove from parent comment if it's a reply
          if (parentComment) {
            await Comment.findByIdAndUpdate(parentComment, {
              $pull: { replies: comment._id },
            });
          }

          console.log(`🗑️ Toxic comment deleted from database: ${comment._id}`);
        } catch (error) {
          console.error("Error deleting toxic comment:", error);
        }
      }, 3000);

      return;
    }

    res.status(201).json({
      status: "success",
      message: "Comment added successfully",
      data: {
        comment,
      },
    });
  } catch (error) {
    console.error("Add comment error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

// Get comments for a post
const getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        status: "error",
        message: "Post not found",
      });
    }

    const comments = await Comment.find({
      post: postId,
      parentComment: null, // Get only top-level comments
    })
      .populate("author", "name username avatar")
      .populate({
        path: "replies",
        populate: {
          path: "author",
          select: "name username avatar",
        },
        options: { limit: 5, sort: { createdAt: 1 } },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Comment.countDocuments({
      post: postId,
      parentComment: null,
    });

    res.json({
      status: "success",
      data: {
        comments,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

// Update post
const updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        status: "error",
        message: "Post not found",
      });
    }

    // Check if user owns the post
    if (post.author.toString() !== userId.toString()) {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to edit this post",
      });
    }

    // Check for toxic content before updating
    if (content && content.trim()) {
      const toxicityCheck = await checkToxicity(content);
      if (toxicityCheck.isToxic) {
        return res.status(400).json({
          status: "error",
          message:
            "Your post contains toxic or inappropriate content. Please revise your post.",
          isToxic: true,
          confidence: toxicityCheck.confidence,
        });
      }
    }

    // Update post content
    post.content = content.trim();
    post.isEdited = true;
    await post.save();

    // Populate author info for response
    await post.populate("author", "name username profilePicture isVerified");

    res.json({
      status: "success",
      message: "Post updated successfully",
      data: {
        post,
      },
    });
  } catch (error) {
    console.error("Update post error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

// Delete post
const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        status: "error",
        message: "Post not found",
      });
    }

    // Check if user owns the post or is admin
    if (
      post.author.toString() !== userId.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to delete this post",
      });
    }

    // Delete all comments associated with the post
    await Comment.deleteMany({ post: postId });

    // Delete the post
    await Post.findByIdAndDelete(postId);

    res.json({
      status: "success",
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Delete post error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

// Update a comment
const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        status: "error",
        message: "Comment not found",
      });
    }

    // Check if user is the comment author
    if (comment.author.toString() !== userId.toString()) {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to edit this comment",
      });
    }

    // Check for toxic content before updating
    const toxicityCheck = await checkToxicity(content);
    if (toxicityCheck.isToxic) {
      return res.status(400).json({
        status: "error",
        message:
          "Your comment contains toxic or inappropriate content. Please revise your message.",
        isToxic: true,
        confidence: toxicityCheck.confidence,
      });
    }

    // Update the comment
    comment.content = content;
    comment.isEdited = true;
    await comment.save();
    await comment.populate("author", "name username avatar");

    res.json({
      status: "success",
      message: "Comment updated successfully",
      data: {
        comment,
      },
    });
  } catch (error) {
    console.error("Update comment error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

// Delete a comment
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        status: "error",
        message: "Comment not found",
      });
    }

    // Check if user is the comment author or post owner
    const post = await Post.findById(comment.post);
    const isAuthor = comment.author.toString() === userId.toString();
    const isPostOwner = post.author.toString() === userId.toString();

    if (!isAuthor && !isPostOwner) {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to delete this comment",
      });
    }

    // Remove comment from post
    await Post.findByIdAndUpdate(comment.post, {
      $pull: { comments: commentId },
    });

    // Delete the comment
    await Comment.findByIdAndDelete(commentId);

    res.json({
      status: "success",
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Delete comment error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

module.exports = {
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
};
