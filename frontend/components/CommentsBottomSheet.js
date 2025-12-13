import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../hooks/useAuth";
import { postsAPI } from "../services/api";

const CommentsBottomSheet = ({
  isVisible,
  onClose,
  postId,
  commentCount = 0,
  onCommentAdded,
}) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState("");

  const { user } = useAuth();
  const bottomSheetRef = useRef(null);
  const snapPoints = useMemo(() => ["25%", "75%"], []);

  useEffect(() => {
    if (isVisible) {
      bottomSheetRef.current?.expand();
      fetchComments();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isVisible]);

  const fetchComments = async () => {
    if (!postId) return;

    setIsLoading(true);
    try {
      const response = await postsAPI.getComments(postId);
      setComments(response.data.data.comments || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
      Alert.alert("Error", "Failed to load comments");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    const commentContent = newComment.trim();

    try {
      const response = await postsAPI.addComment(postId, {
        content: commentContent,
      });

      const newCommentData = response.data.data.comment;
      const isToxic = response.data.data.isToxic;

      // Add comment to UI
      setComments((prev) => [newCommentData, ...prev]);
      setNewComment("");

      // Check if comment is toxic
      if (isToxic) {
        console.log("Toxic comment detected, will be removed in 2 seconds");

        // Wait 2 seconds, then show warning and remove
        setTimeout(() => {
          // Remove comment from UI
          setComments((prev) =>
            prev.filter((c) => c._id !== newCommentData._id)
          );

          // Show warning
          Alert.alert(
            "🚫 Toxic Content Detected",
            "Your comment contained inappropriate or toxic content and has been removed. Please be respectful in your comments.",
            [{ text: "OK", style: "default" }]
          );
        }, 2000);
      } else {
        // Notify parent component only for non-toxic comments
        if (onCommentAdded) {
          onCommentAdded();
        }
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to add comment";
      Alert.alert("Error", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = (comment) => {
    setEditingCommentId(comment._id);
    setEditingContent(comment.content);
  };

  const handleUpdateComment = async (commentId) => {
    if (!editingContent.trim()) return;

    try {
      const response = await postsAPI.updateComment(commentId, {
        content: editingContent.trim(),
      });

      // Update comment in UI
      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? response.data.data.comment : c))
      );

      setEditingCommentId(null);
      setEditingContent("");
      Alert.alert("Success", "Comment updated successfully");
    } catch (error) {
      console.error("Error updating comment:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to update comment";
      Alert.alert("Error", errorMessage);
    }
  };

  const handleDeleteComment = async (commentId) => {
    Alert.alert(
      "Delete Comment",
      "Are you sure you want to delete this comment?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await postsAPI.deleteComment(commentId);
              setComments((prev) => prev.filter((c) => c._id !== commentId));

              // Notify parent component
              if (onCommentAdded) {
                onCommentAdded();
              }

              Alert.alert("Success", "Comment deleted successfully");
            } catch (error) {
              console.error("Error deleting comment:", error);
              const errorMessage =
                error.response?.data?.message || "Failed to delete comment";
              Alert.alert("Error", errorMessage);
            }
          },
        },
      ]
    );
  };

  const handleCommentLongPress = (comment) => {
    const isOwner = user?._id === comment.author?._id;

    if (!isOwner) return;

    Alert.alert("Comment Options", "What would you like to do?", [
      {
        text: "Edit",
        onPress: () => handleEditComment(comment),
      },
      {
        text: "Delete",
        onPress: () => handleDeleteComment(comment._id),
        style: "destructive",
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  const renderComment = ({ item }) => {
    const isEditing = editingCommentId === item._id;
    const isOwner = user?._id === item.author?._id;

    return (
      <View className="flex-row p-4 border-b border-gray-100">
        {/* Avatar */}
        <View className="w-8 h-8 bg-gray-300 rounded-full mr-3 items-center justify-center">
          <Text className="text-gray-600 font-semibold text-xs">
            {item.author?.name?.charAt(0) || "U"}
          </Text>
        </View>

        {/* Comment Content */}
        <View className="flex-1">
          <TouchableOpacity
            onLongPress={() => handleCommentLongPress(item)}
            activeOpacity={0.7}
            delayLongPress={500}
          >
            <View className="bg-gray-100 rounded-xl px-3 py-2">
              <Text className="font-semibold text-gray-900 text-sm">
                {item.author?.name || "Unknown User"}
                {item.isEdited && (
                  <Text className="text-gray-500 text-xs font-normal">
                    {" "}
                    (edited)
                  </Text>
                )}
              </Text>

              {isEditing ? (
                <View className="mt-2">
                  <TextInput
                    value={editingContent}
                    onChangeText={setEditingContent}
                    multiline
                    maxLength={500}
                    className="text-gray-900 bg-white rounded-lg px-2 py-1"
                    autoFocus
                  />
                  <View className="flex-row mt-2">
                    <TouchableOpacity
                      onPress={() => handleUpdateComment(item._id)}
                      className="bg-blue-600 rounded px-3 py-1 mr-2"
                    >
                      <Text className="text-white text-xs font-semibold">
                        Save
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setEditingCommentId(null);
                        setEditingContent("");
                      }}
                      className="bg-gray-300 rounded px-3 py-1"
                    >
                      <Text className="text-gray-700 text-xs font-semibold">
                        Cancel
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <Text className="text-gray-800 mt-1">{item.content}</Text>
              )}
            </View>
          </TouchableOpacity>

          {/* Comment Actions */}
          {!isEditing && (
            <View className="flex-row items-center mt-2 ml-3">
              <TouchableOpacity className="mr-4">
                <Text className="text-gray-600 font-medium text-sm">Like</Text>
              </TouchableOpacity>
              <TouchableOpacity className="mr-4">
                <Text className="text-gray-600 font-medium text-sm">Reply</Text>
              </TouchableOpacity>
              <Text className="text-gray-500 text-xs">
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const handleSheetChanges = useCallback(
    (index) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={isVisible ? 0 : -1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose={true}
      backgroundStyle={{ backgroundColor: "#ffffff" }}
      handleIndicatorStyle={{ backgroundColor: "#d1d5db" }}
    >
      <BottomSheetView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
          <Text className="text-lg font-semibold text-gray-900">
            Comments ({commentCount})
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Comments List */}
        <View className="flex-1">
          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#2563eb" />
            </View>
          ) : (
            <FlatList
              data={comments}
              renderItem={renderComment}
              keyExtractor={(item) => item._id}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={() => (
                <View className="flex-1 items-center justify-center py-12">
                  <Ionicons
                    name="chatbubble-outline"
                    size={48}
                    color="#d1d5db"
                  />
                  <Text className="text-gray-500 mt-2">No comments yet</Text>
                  <Text className="text-gray-400 text-sm">
                    Be the first to comment
                  </Text>
                </View>
              )}
            />
          )}
        </View>

        {/* Comment Input */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={100}
        >
          <View className="flex-row items-center px-4 py-3 border-t border-gray-200 bg-white">
            {/* User Avatar */}
            <View className="w-8 h-8 bg-gray-300 rounded-full mr-3 items-center justify-center">
              <Text className="text-gray-600 font-semibold text-xs">
                {user?.name?.charAt(0) || "U"}
              </Text>
            </View>

            {/* Text Input */}
            <View className="flex-1 bg-gray-100 rounded-full px-4 py-2 mr-3">
              <TextInput
                value={newComment}
                onChangeText={setNewComment}
                placeholder="Write a comment..."
                placeholderTextColor="#9ca3af"
                multiline
                maxLength={500}
                className="text-gray-900"
                style={{ maxHeight: 100 }}
              />
            </View>

            {/* Send Button */}
            <TouchableOpacity
              onPress={handleAddComment}
              disabled={!newComment.trim() || isSubmitting}
              className={`w-8 h-8 rounded-full items-center justify-center ${
                newComment.trim() && !isSubmitting
                  ? "bg-blue-600"
                  : "bg-gray-300"
              }`}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Ionicons
                  name="send"
                  size={16}
                  color={newComment.trim() ? "#ffffff" : "#9ca3af"}
                />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </BottomSheetView>
    </BottomSheet>
  );
};

export default CommentsBottomSheet;
