import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  RefreshControl,
  Image,
  Modal,
  Dimensions,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as ImagePicker from "expo-image-picker";
import { getStaticImageBaseUrl } from "../../utils/networkConfig";
import * as MediaLibrary from "expo-media-library";
import { useAuth } from "../../hooks/useAuth";
import { postsAPI, userAPI } from "../../services/api";
import { router } from "expo-router";
import CommentsBottomSheet from "../../components/CommentsBottomSheet";

export default function CommunityScreen() {
  const [posts, setPosts] = useState([]);
  const [postContent, setPostContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [selectedPostCommentCount, setSelectedPostCommentCount] = useState(0);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [modalPostContent, setModalPostContent] = useState("");
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editingPostContent, setEditingPostContent] = useState("");

  const { user } = useAuth();

  // Debounced search function
  const debouncedSearch = (query) => {
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (!query.trim() || query.trim().length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);

    // Set new timeout for search
    const newTimeout = setTimeout(async () => {
      try {
        const response = await userAPI.searchUsers(query.trim());
        setSearchResults(response.data.data.users || []);
      } catch (error) {
        console.error("Error searching users:", error);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300); // 300ms delay

    setSearchTimeout(newTimeout);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async (pageNum = 1, refresh = false) => {
    if (pageNum === 1 && !refresh) setIsLoading(true);

    try {
      const response = await postsAPI.getFeed({ page: pageNum, limit: 10 });
      const newPosts = response.data.data.posts;

      if (refresh || pageNum === 1) {
        setPosts(newPosts);
      } else {
        setPosts((prev) => [...prev, ...newPosts]);
      }
      setPage(pageNum);
    } catch (error) {
      console.error("Error fetching posts:", error);
      const errorMessage =
        error.code === "NETWORK_ERROR"
          ? "Network connection failed. Please check if the server is running."
          : "Failed to load posts. Please try again.";
      Alert.alert("Connection Error", errorMessage);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreatePost = async () => {
    if (!postContent.trim()) {
      Alert.alert("Error", "Please enter some content");
      return;
    }

    try {
      const response = await postsAPI.createPost({ content: postContent });
      const newPost = response.data.data.post;

      setPosts((prev) => [newPost, ...prev]);
      setPostContent("");
      setShowCreatePost(false);
      Alert.alert("Success", "Post created successfully");
    } catch (error) {
      console.error("Error creating post:", error);
      Alert.alert("Error", "Failed to create post");
    }
  };

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await userAPI.searchUsers(query.trim());
      setSearchResults(response.data.data.users || []);
    } catch (error) {
      console.error("Error searching users:", error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchSubmit = () => {
    handleSearch(searchQuery);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearch(false);
  };

  const handleCreatePostWithMedia = async () => {
    if (!modalPostContent.trim() && selectedMedia.length === 0) {
      Alert.alert("Error", "Please enter some content or attach media");
      return;
    }

    try {
      if (selectedMedia.length > 0) {
        // Create FormData for media upload
        const formData = new FormData();

        // Only append content if it's not empty
        if (modalPostContent.trim()) {
          formData.append("content", modalPostContent.trim());
        }

        selectedMedia.forEach((media, index) => {
          const uriParts = media.uri.split(".");
          const fileType = uriParts[uriParts.length - 1];

          formData.append("images", {
            uri: media.uri,
            name: `image_${Date.now()}_${index}.${fileType}`,
            type: `image/${fileType}`,
          });
        });

        const response = await postsAPI.createPostWithMedia(formData);
        const newPost = response.data.data.post;
        setPosts((prev) => [newPost, ...prev]);
      } else {
        // Create text-only post
        const response = await postsAPI.createPost({
          content: modalPostContent.trim(),
        });
        const newPost = response.data.data.post;
        setPosts((prev) => [newPost, ...prev]);
      }

      setModalPostContent("");
      setSelectedMedia([]);
      setShowCreatePostModal(false);
      Alert.alert("Success", "Post created successfully");
    } catch (error) {
      console.error("Error creating post:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to create post";
      Alert.alert("Error", errorMessage);
    }
  };

  const pickMedia = () => {
    Alert.alert("Select Media", "Choose an option", [
      { text: "Camera", onPress: () => openCamera() },
      { text: "Photo Library", onPress: () => openImagePicker() },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const openCamera = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Camera permission is required to take photos"
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedMedia((prev) => [...prev, result.assets[0]]);
      }
    } catch (error) {
      console.error("Camera error:", error);
      Alert.alert("Error", "Failed to open camera");
    }
  };

  const openImagePicker = async () => {
    try {
      // Request media library permissions
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Photo library permission is required to select photos"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: true,
      });

      if (!result.canceled) {
        setSelectedMedia((prev) => [...prev, ...result.assets]);
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to open photo library");
    }
  };

  const removeMedia = (index) => {
    setSelectedMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLikePost = async (postId) => {
    try {
      const response = await postsAPI.likePost(postId);
      const updatedPost = response.data.data.post;

      setPosts((prev) =>
        prev.map((post) =>
          post._id === postId
            ? { ...updatedPost, author: post.author } // Preserve author data
            : post
        )
      );
    } catch (error) {
      console.error("Error liking post:", error);
      Alert.alert("Error", "Failed to like post");
    }
  };

  const handleOpenComments = (postId, commentCount) => {
    setSelectedPostId(postId);
    setSelectedPostCommentCount(commentCount);
    setCommentsVisible(true);
  };

  const handleCloseComments = () => {
    setCommentsVisible(false);
    setSelectedPostId(null);
    setSelectedPostCommentCount(0);
  };

  const handleCommentAdded = () => {
    // Refresh the post to get updated comment count
    fetchPosts(1, true);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts(1, true);
  };

  const handleEditPost = (post) => {
    setEditingPostId(post._id);
    setEditingPostContent(post.content);
  };

  const handleUpdatePost = async (postId) => {
    if (!editingPostContent.trim()) {
      Alert.alert("Error", "Post content cannot be empty");
      return;
    }

    try {
      const response = await postsAPI.updatePost(postId, {
        content: editingPostContent.trim(),
      });

      setPosts((prev) =>
        prev.map((post) =>
          post._id === postId ? { ...post, ...response.data.data.post } : post
        )
      );

      setEditingPostId(null);
      setEditingPostContent("");
      Alert.alert("Success", "Post updated successfully");
    } catch (error) {
      console.error("Error updating post:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to update post";
      Alert.alert("Error", errorMessage);
    }
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setEditingPostContent("");
  };

  const handleDeletePost = async (postId) => {
    Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await postsAPI.deletePost(postId);
            setPosts((prev) => prev.filter((post) => post._id !== postId));
            Alert.alert("Success", "Post deleted successfully");
          } catch (error) {
            console.error("Error deleting post:", error);
            const errorMessage =
              error.response?.data?.message || "Failed to delete post";
            Alert.alert("Error", errorMessage);
          }
        },
      },
    ]);
  };

  const showPostOptions = (post) => {
    if (Platform.OS === "ios") {
      const options = ["Cancel", "Edit Post", "Delete Post"];
      Alert.alert(
        "Post Options",
        "",
        [
          {
            text: "Edit Post",
            onPress: () => handleEditPost(post),
          },
          {
            text: "Delete Post",
            onPress: () => handleDeletePost(post._id),
            style: "destructive",
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ],
        { cancelable: true }
      );
    } else {
      Alert.alert(
        "Post Options",
        "",
        [
          {
            text: "Edit Post",
            onPress: () => handleEditPost(post),
          },
          {
            text: "Delete Post",
            onPress: () => handleDeletePost(post._id),
            style: "destructive",
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ],
        { cancelable: true }
      );
    }
  };

  const renderPost = ({ item }) => {
    // Add null checks
    if (!item || !item.author) {
      return null;
    }
  
  }
  