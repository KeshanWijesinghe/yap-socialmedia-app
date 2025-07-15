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
      <SafeAreaView className="flex-1 bg-gray-50">
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
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-gray-600 mt-2">Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profileUser) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
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
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-600">User not found</Text>
        </View>
      </SafeAreaView>
    );
  }
}
