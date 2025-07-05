const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, "Post content is required"],
      maxlength: [2000, "Post content cannot exceed 2000 characters"],
    },
    images: [
      {
        url: String,
        alt: String,
      },
    ],
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    likes: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    shares: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    isPublic: {
      type: Boolean,
      default: true,
    },
    hashtags: [String],
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isEdited: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for like count
postSchema.virtual("likeCount").get(function () {
  return this.likes.length;
});

// Virtual for share count
postSchema.virtual("shareCount").get(function () {
  return this.shares.length;
});

// Virtual for comment count
postSchema.virtual("commentCount").get(function () {
  return this.comments.length;
});

// Ensure virtuals are included in JSON output
postSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Post", postSchema);
