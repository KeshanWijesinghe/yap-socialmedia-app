import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { router, useLocalSearchParams } from "expo-router";
import { postsAPI } from "../services/api";
import { getStaticImageBaseUrl } from "../utils/networkConfig";
import { useAuth } from "../hooks/useAuth";
import CommentsBottomSheet from "../components/CommentsBottomSheet";

const { width } = Dimensions.get("window");

export default function PostDetailScreen() {
  const { postId } = useLocalSearchParams();
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (postId) {
      fetchPost();
    }
  }, [postId]);

  const fetchPost = async () => {
    setIsLoading(true);
    try {
      const response = await postsAPI.getPostById(postId);
      const foundPost = response.data.data.post;

      if (foundPost) {
        setPost(foundPost);
      } else {
        Alert.alert("Error", "Post not found");
        router.back();
      }
    } catch (error) {
      console.error("Error fetching post:", error);
      if (error.response?.status === 404) {
        Alert.alert("Error", "Post not found");
      } else {
        Alert.alert("Error", "Failed to load post");
      }
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLikePost = async () => {
    if (!post) return;

    try {
      const response = await postsAPI.likePost(post._id);
      const updatedPost = response.data.data.post;
      setPost({ ...updatedPost, author: post.author });
    } catch (error) {
      console.error("Error liking post:", error);
      Alert.alert("Error", "Failed to like post");
    }
  };

  const handleOpenComments = () => {
    setCommentsVisible(true);
  };

  const handleCloseComments = () => {
    setCommentsVisible(false);
  };

  const handleCommentAdded = () => {
    // Refresh the post to get updated comment count
    fetchPost();
  };

  if (isLoading) {
    return (
      <GestureHandlerRootView className="flex-1">
        <View className="flex-1 bg-gray-50">
          <LinearGradient
            colors={["#2563eb", "#1d4ed8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="pt-12 pb-4"
          >
            <SafeAreaView edges={[]} className="px-6 flex-row items-center">
              <TouchableOpacity onPress={() => router.back()} className="mr-4">
                <Ionicons name="arrow-back" size={24} color="#ffffff" />
              </TouchableOpacity>
              <Text className="text-white text-xl font-bold">Post</Text>
            </SafeAreaView>
          </LinearGradient>

          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="text-gray-600 mt-2">Loading post...</Text>
          </View>
        </View>
      </GestureHandlerRootView>
    );
  }

  if (!post) {
    return (
      <GestureHandlerRootView className="flex-1">
        <View className="flex-1 bg-gray-50">
          <LinearGradient
            colors={["#2563eb", "#1d4ed8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="pt-12 pb-4"
          >
            <SafeAreaView edges={[]} className="px-6 flex-row items-center">
              <TouchableOpacity onPress={() => router.back()} className="mr-4">
                <Ionicons name="arrow-back" size={24} color="#ffffff" />
              </TouchableOpacity>
              <Text className="text-white text-xl font-bold">Post</Text>
            </SafeAreaView>
          </LinearGradient>

          <View className="flex-1 justify-center items-center">
            <Text className="text-gray-600">Post not found</Text>
          </View>
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView className="flex-1">
      <View className="flex-1 bg-gray-50">
        {/* Header */}
        <LinearGradient
          colors={["#2563eb", "#1d4ed8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="pt-12 pb-4"
        >
          <SafeAreaView
            edges={[]}
            className="px-6 flex-row items-center justify-between"
          >
            <View className="flex-row items-center flex-1">
              <TouchableOpacity onPress={() => router.back()} className="mr-4">
                <Ionicons name="arrow-back" size={24} color="#ffffff" />
              </TouchableOpacity>
              <Text className="text-white text-xl font-bold">Post</Text>
            </View>
            <TouchableOpacity>
              <Ionicons name="ellipsis-horizontal" size={24} color="#ffffff" />
            </TouchableOpacity>
          </SafeAreaView>
        </LinearGradient>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="bg-white rounded-lg mx-4 mt-4 shadow-sm border border-gray-100">
            {/* Post Header */}
            <View className="flex-row items-center p-4 pb-3">
              <TouchableOpacity
                onPress={() =>
                  router.push(`/userProfile?userId=${post.author._id}`)
                }
                className="flex-row items-center flex-1"
              >
                <View className="w-12 h-12 bg-gray-300 rounded-full mr-3 items-center justify-center">
                  {post.author?.profilePicture ? (
                    <Image
                      source={{
                        uri: `${getStaticImageBaseUrl()}${
                          post.author.profilePicture
                        }`,
                      }}
                      className="w-12 h-12 rounded-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <Text className="text-gray-600 font-semibold">
                      {post.author?.name?.charAt(0) || "U"}
                    </Text>
                  )}
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center">
                    <Text className="font-semibold text-gray-900 mr-2">
                      {post.author?.name || "Unknown User"}
                    </Text>
                    {post.author?.isVerified && (
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color="#3b82f6"
                      />
                    )}
                  </View>
                  <Text className="text-gray-500 text-sm">
                    {new Date(post.createdAt).toLocaleDateString()} •{" "}
                    {new Date(post.createdAt).toLocaleTimeString()}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity>
                <Ionicons
                  name="ellipsis-horizontal"
                  size={20}
                  color="#6b7280"
                />
              </TouchableOpacity>
            </View>

            {/* Post Content */}
            <View className="px-4 pb-4">
              <Text className="text-gray-900 leading-6 text-base">
                {post.content}
              </Text>

              {/* Hashtags */}
              {post.hashtags && post.hashtags.length > 0 && (
                <Text className="text-blue-600 mt-3">
                  {post.hashtags.map((tag) => `#${tag}`).join(" ")}
                </Text>
              )}
            </View>

            {/* Post Images */}
            {post.images && post.images.length > 0 && (
              <View className="mb-4">
                {post.images.length === 1 ? (
                  <Image
                    source={{
                      uri: `${getStaticImageBaseUrl()}${post.images[0].url}`,
                    }}
                    style={{ width: width - 32, height: 400 }}
                    resizeMode="cover"
                  />
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {post.images.map((image, index) => (
                      <Image
                        key={index}
                        source={{
                          uri: `${getStaticImageBaseUrl()}${image.url}`,
                        }}
                        style={{ width: 300, height: 400, marginRight: 8 }}
                        resizeMode="cover"
                      />
                    ))}
                  </ScrollView>
                )}
              </View>
            )}

            {/* Post Stats */}
            <View className="flex-row items-center px-4 py-3 border-t border-gray-100">
              <Text className="text-gray-600 text-sm flex-1">
                {post.likeCount || 0} likes
              </Text>
              <Text className="text-gray-600 text-sm">
                {post.commentCount || 0} comments
              </Text>
              <Text className="text-gray-600 text-sm ml-4">
                {post.shareCount || 0} shares
              </Text>
            </View>

            {/* Action Buttons */}
            <View className="flex-row items-center px-4 py-3 border-t border-gray-100">
              <TouchableOpacity
                onPress={handleLikePost}
                className="flex-row items-center flex-1 justify-center py-1"
              >
                <Ionicons
                  name={
                    post.likes?.some((like) => like.user === user?._id)
                      ? "heart"
                      : "heart-outline"
                  }
                  size={20}
                  color={
                    post.likes?.some((like) => like.user === user?._id)
                      ? "#ef4444"
                      : "#6b7280"
                  }
                />
                <Text
                  className={`ml-1 ${
                    post.likes?.some((like) => like.user === user?._id)
                      ? "text-red-500"
                      : "text-gray-600"
                  }`}
                >
                  Like
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleOpenComments}
                className="flex-row items-center flex-1 justify-center py-1"
              >
                <Ionicons name="chatbubble-outline" size={20} color="#6b7280" />
                <Text className="text-gray-600 ml-1">Comment</Text>
              </TouchableOpacity>

              <TouchableOpacity className="flex-row items-center flex-1 justify-center py-1">
                <Ionicons name="share-outline" size={20} color="#6b7280" />
                <Text className="text-gray-600 ml-1">Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Comments Bottom Sheet */}
        <CommentsBottomSheet
          isVisible={commentsVisible}
          onClose={handleCloseComments}
          postId={post._id}
          commentCount={post.commentCount || 0}
          onCommentAdded={handleCommentAdded}
        />
      </View>
    </GestureHandlerRootView>
  );
}
