import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  FlatList,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useAuth } from "../../hooks/useAuth";
import { userAPI, postsAPI } from "../../services/api";
import { getStaticImageBaseUrl } from "../../utils/networkConfig";
import { useRealTimeUpdates } from "../../hooks/useRealTimeUpdates";

export default function ProfileScreen() {
  const [userPosts, setUserPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    posts: 0,
    followers: 0,
    following: 0,
    likes: 0,
  });

  const { user, logout } = useAuth();
  const { getFollowerDelta, getFollowingDelta } = useRealTimeUpdates(user?._id);

  useEffect(() => {
    if (user) {
      fetchUserPosts();
    }
  }, [user]);

  // Refresh profile data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        fetchUserPosts();
      }
    }, [user])
  );

  const fetchUserPosts = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Fetch fresh user data to get updated follower/following counts
      const [postsResponse, userResponse] = await Promise.all([
        postsAPI.getUserPosts(user._id),
        userAPI.getProfile(),
      ]);

      const posts = postsResponse.data.data.posts || [];
      const freshUserData = userResponse.data.data.user;

      setUserPosts(posts);

      // Calculate real stats with fresh user data
      const totalLikes = posts.reduce(
        (sum, post) => sum + (post.likeCount || 0),
        0
      );

      setStats({
        posts: posts.length,
        followers: freshUserData.followers?.length || 0,
        following: freshUserData.following?.length || 0,
        likes: totalLikes,
      });
    } catch (error) {
      console.error("Error fetching user posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserPosts().finally(() => setRefreshing(false));
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout },
    ]);
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

  return (
    <View className="flex-1">
      {/* Header with gradient extending to notch */}
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
          <Text className="text-white text-2xl font-bold">Profile</Text>
          <TouchableOpacity onPress={handleLogout}>
            <Ionicons name="settings" size={24} color="#ffffff" />
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>

      <View className="flex-1 bg-gray-50">
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Info */}
          <View className="bg-white mx-4 mt-4 rounded-lg p-6 shadow-sm border border-gray-100">
            {/* Avatar and Basic Info */}
            <View className="items-center mb-6">
              <View className="w-24 h-24 bg-gray-300 rounded-full items-center justify-center mb-4">
                {user?.profilePicture ? (
                  <Image
                    source={{
                      uri: `${getStaticImageBaseUrl()}${user.profilePicture}`,
                    }}
                    className="w-24 h-24 rounded-full"
                    resizeMode="cover"
                  />
                ) : (
                  <Text className="text-gray-600 text-2xl font-bold">
                    {user?.name?.charAt(0) || "U"}
                  </Text>
                )}
              </View>

              <View className="items-center">
                <View className="flex-row items-center mb-2">
                  <Text className="text-2xl font-bold text-gray-900">
                    {user?.name || "User"}
                  </Text>
                  {user?.isVerified && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#3b82f6"
                      className="ml-2"
                    />
                  )}
                </View>

                {user?.username && (
                  <Text className="text-gray-600 mb-2">@{user.username}</Text>
                )}

                {user?.bio && (
                  <Text className="text-gray-600 text-base mt-2 text-center">
                    {user.bio}
                  </Text>
                )}
                {user?.location && (
                  <Text className="text-gray-500 text-sm mt-1 text-center">
                    📍 {user.location}
                  </Text>
                )}
              </View>
            </View>

            {/* Stats */}
            <View className="flex-row justify-around border-t border-b border-gray-100 py-4">
              <View className="items-center">
                <Text className="text-xl font-bold text-gray-900">
                  {stats.posts}
                </Text>
                <Text className="text-gray-600 text-sm">Posts</Text>
              </View>
              <TouchableOpacity
                className="items-center"
                onPress={() =>
                  router.push(
                    `/followersList?userId=${user._id}&type=followers`
                  )
                }
              >
                <Text className="text-xl font-bold text-gray-900">
                  {stats.followers + getFollowerDelta(user?._id)}
                </Text>
                <Text className="text-gray-600 text-sm">Followers</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="items-center"
                onPress={() =>
                  router.push(
                    `/followersList?userId=${user._id}&type=following`
                  )
                }
              >
                <Text className="text-xl font-bold text-gray-900">
                  {stats.following + getFollowingDelta(user?._id)}
                </Text>
                <Text className="text-gray-600 text-sm">Following</Text>
              </TouchableOpacity>
              <View className="items-center">
                <Text className="text-xl font-bold text-gray-900">
                  {stats.likes}
                </Text>
                <Text className="text-gray-600 text-sm">Likes</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row mt-4 space-x-3">
              <TouchableOpacity
                onPress={() => router.push("/editProfile")}
                className="flex-1 bg-blue-600 py-3 rounded-lg"
              >
                <Text className="text-white font-medium text-center">
                  Edit Profile
                </Text>
              </TouchableOpacity>

              <TouchableOpacity className="bg-gray-200 py-3 px-4 rounded-lg">
                <Text className="text-gray-700 font-medium">Share Profile</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Recent Posts */}
          <View className="mx-4 mt-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-gray-900">
                Recent Posts
              </Text>
              <TouchableOpacity>
                <Text className="text-blue-600 font-medium">View All</Text>
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <View className="bg-white rounded-lg p-8 shadow-sm border border-gray-100">
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text className="text-gray-600 text-center mt-2">
                  Loading posts...
                </Text>
              </View>
            ) : userPosts.length > 0 ? (
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
                  No posts yet. Share your first moment!
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
