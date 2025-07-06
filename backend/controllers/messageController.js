const { validationResult } = require("express-validator");
const { Conversation, Message } = require("../models/Message");
const User = require("../models/User");
const { checkToxicity } = require("../utils/toxicityChecker");

// Get user's conversations
const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate("participants", "name username profilePicture isVerified")
      .populate("lastMessage")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender",
          select: "name username",
        },
      })
      .sort({ lastActivity: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Format conversations for frontend
    const formattedConversations = conversations.map((conv) => {
      const otherParticipant = conv.participants.find(
        (p) => p._id.toString() !== userId.toString()
      );

      return {
        _id: conv._id,
        participant: otherParticipant,
        lastMessage: conv.lastMessage,
        lastActivity: conv.lastActivity,
        unreadCount: 0, // TODO: Implement unread count
      };
    });

    const total = await Conversation.countDocuments({
      participants: userId,
    });

    res.json({
      status: "success",
      data: {
        conversations: formattedConversations,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

// Create new conversation
const createConversation = async (req, res) => {
  try {
    const { participants, isGroup, groupName } = req.body;
    const userId = req.user._id;

    // Add current user to participants if not included
    if (!participants.includes(userId.toString())) {
      participants.push(userId);
    }

    // For non-group chats, check mutual following requirement
    if (!isGroup && participants.length === 2) {
      const otherUserId = participants.find((p) => p !== userId.toString());

      // Check if users follow each other (mutual follow required for messaging)
      const currentUser = await User.findById(userId);
      const otherUser = await User.findById(otherUserId);

      if (!currentUser || !otherUser) {
        return res.status(404).json({
          status: "error",
          message: "User not found",
        });
      }

      const isFollowingOther = currentUser.following.includes(otherUserId);
      const isFollowedByOther = otherUser.following.includes(userId.toString());

      if (!isFollowingOther || !isFollowedByOther) {
        return res.status(403).json({
          status: "error",
          message: "You can only message users you mutually follow",
        });
      }

      // Check if conversation already exists
      const existingConversation = await Conversation.findOne({
        participants: { $all: participants, $size: 2 },
        isGroup: false,
      }).populate("participants", "name username profilePicture");

      if (existingConversation) {
        return res.status(200).json({
          status: "success",
          message: "Conversation found",
          data: {
            conversation: existingConversation,
          },
        });
      }
    }

    const conversation = new Conversation({
      participants,
      isGroup,
      groupName,
      createdBy: userId,
    });

    await conversation.save();
    await conversation.populate("participants", "name username profilePicture");

    res.status(201).json({
      status: "success",
      message: "Conversation created successfully",
      data: {
        conversation,
      },
    });
  } catch (error) {
    console.error("Create conversation error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

// Send message
const sendMessage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { conversationId } = req.params;
    const { content, messageType, attachments } = req.body;
    const userId = req.user._id;

    // Check if conversation exists and user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        status: "error",
        message: "Conversation not found",
      });
    }

    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to send message to this conversation",
      });
    }

    // Check for toxic content in message (only for text messages)
    if (messageType === "text" || !messageType) {
      const toxicityCheck = await checkToxicity(content);
      if (toxicityCheck.isToxic) {
        return res.status(400).json({
          status: "error",
          message:
            "Your message contains toxic or inappropriate content. Please revise your message.",
          isToxic: true,
          confidence: toxicityCheck.confidence,
        });
      }
    }

    const message = new Message({
      content,
      sender: userId,
      conversation: conversationId,
      messageType: messageType || "text",
      attachments: attachments || [],
      readBy: [{ user: userId }], // Mark as read by sender
    });

    await message.save();
    await message.populate("sender", "name username profilePicture");

    // Update conversation's last message and activity
    conversation.lastMessage = message._id;
    conversation.lastActivity = new Date();
    await conversation.save();

    res.status(201).json({
      status: "success",
      message: "Message sent successfully",
      data: {
        message,
      },
    });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

// Get messages in a conversation
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user._id;
    const skip = (page - 1) * limit;

    // Check if user is participant
    const conversation = await Conversation.findById(conversationId).populate(
      "participants",
      "name username profilePicture isVerified"
    );
    if (
      !conversation ||
      !conversation.participants.some(
        (p) => p._id.toString() === userId.toString()
      )
    ) {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to view this conversation",
      });
    }

    const messages = await Message.find({
      conversation: conversationId,
      deletedAt: { $exists: false },
    })
      .populate("sender", "name username profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Message.countDocuments({
      conversation: conversationId,
      deletedAt: { $exists: false },
    });

    // Get the other participant for the conversation details
    const otherParticipant = conversation.participants.find(
      (p) => p._id.toString() !== userId.toString()
    );

    res.json({
      status: "success",
      data: {
        messages: messages.reverse(), // Reverse to show oldest first
        conversation: {
          _id: conversation._id,
          participant: otherParticipant,
        },
        hasMore: page < Math.ceil(total / limit),
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

// Mark message as read
const markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        status: "error",
        message: "Message not found",
      });
    }

    // Check if user already marked as read
    const alreadyRead = message.readBy.some(
      (read) => read.user.toString() === userId.toString()
    );
    if (alreadyRead) {
      return res.json({
        status: "success",
        message: "Message already marked as read",
      });
    }

    message.readBy.push({ user: userId });
    await message.save();

    res.json({
      status: "success",
      message: "Message marked as read",
    });
  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

// Edit message
const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!content || !content.trim()) {
      return res.status(400).json({
        status: "error",
        message: "Message content is required",
      });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        status: "error",
        message: "Message not found",
      });
    }

    // Check if user is the sender
    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to edit this message",
      });
    }

    // Check for toxic content
    const toxicityCheck = await checkToxicity(content.trim());
    if (toxicityCheck.isToxic) {
      return res.status(400).json({
        status: "error",
        message:
          "Your message contains toxic or inappropriate content. Please revise your message.",
        isToxic: true,
        confidence: toxicityCheck.confidence,
      });
    }

    // Update message content
    message.content = content.trim();
    message.edited = true;
    message.editedAt = new Date();
    await message.save();

    // Populate sender information
    await message.populate("sender", "name username profilePicture");

    res.json({
      status: "success",
      message: "Message updated successfully",
      data: {
        message,
      },
    });
  } catch (error) {
    console.error("Edit message error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

// Delete message
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        status: "error",
        message: "Message not found",
      });
    }

    // Check if user is the sender or admin
    if (
      message.sender.toString() !== userId.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to delete this message",
      });
    }

    message.deletedAt = new Date();
    await message.save();

    res.json({
      status: "success",
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("Delete message error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

// Get list of users that can be messaged (mutual followers)
const getMessageableUsers = async (req, res) => {
  try {
    const userId = req.user._id;
    const { search } = req.query;

    const currentUser = await User.findById(userId).populate(
      "following",
      "_id"
    );

    // Find users who are mutually following
    let query = {
      _id: { $in: currentUser.following },
      followers: userId,
    };

    if (search && search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { username: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const messageableUsers = await User.find(query)
      .select("name username profilePicture bio isVerified")
      .limit(20);

    res.json({
      status: "success",
      data: {
        users: messageableUsers,
      },
    });
  } catch (error) {
    console.error("Error fetching messageable users:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch users",
    });
  }
};

// Delete conversation
const deleteConversation = async (req, res) => {
  try {
    const conversationId = req.params.conversationId;
    const userId = req.user._id;

    // Find conversation
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        status: "error",
        message: "Conversation not found",
      });
    }

    // Check if user is participant
    if (!conversation.participants.includes(userId.toString())) {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to delete this conversation",
      });
    }

    // Delete all messages in the conversation
    await Message.deleteMany({ conversation: conversationId });

    // Delete the conversation
    await Conversation.findByIdAndDelete(conversationId);

    res.json({
      status: "success",
      message: "Conversation deleted successfully",
    });
  } catch (error) {
    console.error("Delete conversation error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

module.exports = {
  getConversations,
  createConversation,
  sendMessage,
  getMessages,
  markAsRead,
  editMessage,
  deleteMessage,
  deleteConversation,
  getMessageableUsers,
};
