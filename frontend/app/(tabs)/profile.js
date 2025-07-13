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
}
