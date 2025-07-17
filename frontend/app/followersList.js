import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { followAPI } from "../services/api";
import { getStaticImageBaseUrl } from "../utils/networkConfig";

export default function FollowersListScreen() {
  const { userId, type } = useLocalSearchParams();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [userId, type]);

  const fetchUsers = async () => {
    if (!userId || !type) return;

    setIsLoading(true);
    try {
      const response =
        type === "followers"
          ? await followAPI.getFollowers(userId)
          : await followAPI.getFollowing(userId);

      setUsers(response.data.data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const renderUser = ({ item }) => (
    <TouchableOpacity
      className="bg-white mx-4 mb-3 rounded-lg p-4 shadow-sm border border-gray-100"
      onPress={() => router.push(`/userProfile?userId=${item._id}`)}
    >
      <View className="flex-row items-center">
        <View className="w-12 h-12 bg-gray-300 rounded-full mr-3 items-center justify-center">
          {item.profilePicture ? (
            <Image
              source={{
                uri: `${getStaticImageBaseUrl()}${item.profilePicture}`,
              }}
              className="w-12 h-12 rounded-full"
              resizeMode="cover"
            />
          ) : (
            <Text className="text-gray-600 font-semibold text-lg">
              {item.name?.charAt(0) || "U"}
            </Text>
          )}
        </View>
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="font-semibold text-gray-900 mr-2">
              {item.name}
            </Text>
            {item.isVerified && (
              <Ionicons name="checkmark-circle" size={16} color="#3b82f6" />
            )}
          </View>
          {item.username && (
            <Text className="text-gray-500 text-sm">@{item.username}</Text>
          )}
          {item.bio && (
            <Text className="text-gray-600 text-sm mt-1" numberOfLines={2}>
              {item.bio}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      </View>
    </TouchableOpacity>
  );
}
