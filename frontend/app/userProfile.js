import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "../hooks/useAuth";
import { userAPI, postsAPI } from "../services/api";
import { messageAPI } from "../services/messageAPI";
import { getStaticImageBaseUrl } from "../utils/networkConfig";
import { useRealTimeUpdates } from "../hooks/useRealTimeUpdates";

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams();
  const { user: currentUser } = useAuth();
  const { updateFollowerCount, updateFollowingCount } =
    useRealTimeUpdates(userId);
  const [profileUser, setProfileUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
      fetchUserPosts();
    }
  }, [userId]);

  const fetchUserProfile = async () => {
    setIsLoading(true);
    try {
      const response = await userAPI.getUserById(userId);
      const user = response.data.data.user;
      setProfileUser(user);

      // Use the isFollowing field from backend response
      setIsFollowing(user.isFollowing || false);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      Alert.alert("Error", "Failed to load user profile");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const response = await postsAPI.getUserPosts(userId);
      setUserPosts(response.data.data.posts || []);
    } catch (error) {
      console.error("Error fetching user posts:", error);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser || !profileUser) return;

    // Prevent following yourself
    if (currentUser._id === profileUser._id) {
      Alert.alert("Error", "You cannot follow yourself");
      return;
    }

    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        await userAPI.unfollowUser(profileUser._id);
        setIsFollowing(false);
        setProfileUser((prev) => ({
          ...prev,
          followerCount: Math.max(0, (prev.followerCount || 0) - 1),
        }));
        // Update real-time counters
        updateFollowerCount(profileUser._id, -1);
        updateFollowingCount(currentUser._id, -1);
      } else {
        // Follow
        await userAPI.followUser(profileUser._id);
        setIsFollowing(true);
        setProfileUser((prev) => ({
          ...prev,
          followerCount: (prev.followerCount || 0) + 1,
        }));
        // Update real-time counters
        updateFollowerCount(profileUser._id, 1);
        updateFollowingCount(currentUser._id, 1);
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      if (error.response?.status === 400) {
        // If it's a 400 error, the backend will tell us what's wrong
        const message =
          error.response?.data?.message || "Already following this user";
        if (message.includes("Already following")) {
          // Backend says already following, so update our state
          setIsFollowing(true);
        } else if (message.includes("cannot follow yourself")) {
          Alert.alert("Error", "You cannot follow yourself");
        } else {
          Alert.alert("Error", message);
        }
      } else {
        Alert.alert("Error", "Failed to update follow status");
      }
    } finally {
      setIsFollowLoading(false);
    }
  };

  const renderPostImage = ({ item }) => (
    <TouchableOpacity
      className="w-1/3 aspect-square bg-gray-200 mr-1 mb-1"
      onPress={() => router.push(`/postDetail?postId=${item._id}`)}
    >
      {item.images && item.images.length > 0 ? (
        <Image
          source={{ uri: `${getStaticImageBaseUrl()}${item.images[0].url}` }}
          className="w-full h-full"
          resizeMode="cover"
        />
      ) : (
        <View className="w-full h-full bg-gray-300 items-center justify-center">
          <Ionicons name="text-outline" size={24} color="#9ca3af" />
          <Text className="text-xs text-gray-500 mt-1">Text</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View className="flex-1">
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
            <Text className="text-white text-xl font-bold">Profile</Text>
          </SafeAreaView>
        </LinearGradient>
        <View className="flex-1 bg-gray-50 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-gray-600 mt-2">Loading profile...</Text>
        </View>
      </View>
    );
  }

  if (!profileUser) {
    return (
      <View className="flex-1">
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
            <Text className="text-white text-xl font-bold">Profile</Text>
          </SafeAreaView>
        </LinearGradient>
        <View className="flex-1 bg-gray-50 items-center justify-center">
          <Text className="text-gray-600">User not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Header */}
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
          <Text className="text-white text-xl font-bold">
            {profileUser.name}
          </Text>
        </SafeAreaView>
      </LinearGradient>

      <View className="flex-1 bg-gray-50">
        <ScrollView className="flex-1">
          {/* Profile Section */}
          <View className="bg-white mx-4 mt-4 rounded-lg shadow-sm border border-gray-100">
            <View className="p-6">
              {/* Avatar and Basic Info */}
              <View className="items-center mb-6">
                <View className="w-24 h-24 bg-gray-300 rounded-full items-center justify-center mb-4">
                  {profileUser?.profilePicture ? (
                    <Image
                      source={{
                        uri: `${getStaticImageBaseUrl()}${
                          profileUser.profilePicture
                        }`,
                      }}
                      className="w-24 h-24 rounded-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <Text className="text-gray-600 text-2xl font-bold">
                      {profileUser?.name?.charAt(0) || "U"}
                    </Text>
                  )}
                </View>

                <View className="items-center">
                  <View className="flex-row items-center mb-2">
                    <Text className="text-2xl font-bold text-gray-900">
                      {profileUser?.name || "User"}
                    </Text>
                    {profileUser?.isVerified && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color="#3b82f6"
                        className="ml-2"
                      />
                    )}
                  </View>

                  {profileUser?.username && (
                    <Text className="text-gray-600 mb-2">
                      @{profileUser.username}
                    </Text>
                  )}

                  {profileUser?.bio && (
                    <Text className="text-gray-600 text-base mt-2 text-center">
                      {profileUser.bio}
                    </Text>
                  )}
                  {profileUser?.location && (
                    <Text className="text-gray-500 text-sm mt-1 text-center">
                      📍 {profileUser.location}
                    </Text>
                  )}
                </View>
              </View>

              {/* Stats */}
              <View className="flex-row justify-around border-t border-b border-gray-100 py-4">
                <View className="items-center">
                  <Text className="text-xl font-bold text-gray-900">
                    {userPosts.length}
                  </Text>
                  <Text className="text-gray-600 text-sm">Posts</Text>
                </View>
                <TouchableOpacity
                  className="items-center"
                  onPress={() =>
                    router.push(
                      `/followersList?userId=${profileUser._id}&type=followers`
                    )
                  }
                >
                  <Text className="text-xl font-bold text-gray-900">
                    {profileUser.followerCount || 0}
                  </Text>
                  <Text className="text-gray-600 text-sm">Followers</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="items-center"
                  onPress={() =>
                    router.push(
                      `/followersList?userId=${profileUser._id}&type=following`
                    )
                  }
                >
                  <Text className="text-xl font-bold text-gray-900">
                    {profileUser.followingCount || 0}
                  </Text>
                  <Text className="text-gray-600 text-sm">Following</Text>
                </TouchableOpacity>
              </View>

              {/* Follow and Message Buttons */}
              {currentUser && currentUser._id !== profileUser._id && (
                <View className="mt-4 flex-row space-x-3">
                  <TouchableOpacity
                    onPress={handleFollowToggle}
                    disabled={isFollowLoading}
                    className={`flex-1 py-3 rounded-lg ${
                      isFollowing
                        ? "bg-gray-200 border border-gray-300"
                        : "bg-blue-600"
                    }`}
                  >
                    {isFollowLoading ? (
                      <ActivityIndicator
                        size="small"
                        color={isFollowing ? "#374151" : "white"}
                      />
                    ) : (
                      <Text
                        className={`text-center font-medium ${
                          isFollowing ? "text-gray-700" : "text-white"
                        }`}
                      >
                        {isFollowing ? "Following" : "Follow"}
                      </Text>
                    )}
                  </TouchableOpacity>

                  {/* Message Button - Only show if mutually following */}
                  {isFollowing && profileUser.isFollowing && (
                    <TouchableOpacity
                      onPress={async () => {
                        try {
                          const response = await messageAPI.createConversation(
                            profileUser._id
                          );
                          const conversationId =
                            response.data.data.conversation._id;
                          router.push(`/chat?conversationId=${conversationId}`);
                        } catch (error) {
                          Alert.alert(
                            "Error",
                            error.response?.data?.message ||
                              "Failed to start conversation"
                          );
                        }
                      }}
                      className="px-4 py-3 rounded-lg bg-blue-100 border border-blue-300"
                    >
                      <Ionicons name="chatbubble" size={20} color="#2563eb" />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            {/* Posts Grid */}
            <View className="mx-4 mt-4 mb-4">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-bold text-gray-900">
                  Posts ({userPosts.length})
                </Text>
              </View>

              {userPosts.length > 0 ? (
                <View className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                  <FlatList
                    data={userPosts}
                    renderItem={renderPostImage}
                    keyExtractor={(item) => item._id}
                    numColumns={3}
                    scrollEnabled={false}
                    columnWrapperStyle={{ justifyContent: "space-between" }}
                  />
                </View>
              ) : (
                <View className="bg-white rounded-lg p-8 shadow-sm border border-gray-100">
                  <Text className="text-gray-600 text-center">
                    No posts yet
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
