import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TextInput,
  Platform,
  ActionSheetIOS,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { messageAPI } from "../services/messageAPI";
import { userAPI } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { getStaticImageBaseUrl } from "../utils/networkConfig";

const MessengerPage = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const { user } = useAuth();

  // Fetch conversations
  const fetchConversations = useCallback(async (refresh = false) => {
    if (!refresh) setLoading(true);

    try {
      const response = await messageAPI.getConversations();
      setConversations(response.data.data.conversations || []);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      Alert.alert("Error", "Failed to load conversations");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Search users for new conversation
  const searchUsers = async (query) => {
    setSearchLoading(true);
    try {
      const response = await messageAPI.getMessageableUsers(query.trim());
      setSearchResults(response.data.data.users || []);
    } catch (error) {
      console.error("Error searching messageable users:", error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Load all messageable users when opening new message
  const loadMessageableUsers = async () => {
    setSearchLoading(true);
    try {
      const response = await messageAPI.getMessageableUsers("");
      setSearchResults(response.data.data.users || []);
    } catch (error) {
      console.error("Error loading messageable users:", error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Start new conversation
  const startConversation = async (participantId) => {
    try {
      const response = await messageAPI.createConversation(participantId);
      const conversationId = response.data.data.conversation._id;

      setShowNewMessage(false);
      setSearchQuery("");
      setSearchResults([]);

      router.push(`/chat?conversationId=${conversationId}`);
    } catch (error) {
      console.error("Error starting conversation:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to start conversation"
      );
    }
  };

  // Delete conversation
  const handleDeleteConversation = async (conversationId) => {
    Alert.alert(
      "Delete Conversation",
      "Are you sure you want to delete this entire conversation? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await messageAPI.deleteConversation(conversationId);
              setConversations((prev) =>
                prev.filter((conv) => conv._id !== conversationId)
              );
              Alert.alert("Success", "Conversation deleted successfully");
            } catch (error) {
              console.error("Error deleting conversation:", error);
              const errorMessage =
                error.response?.data?.message ||
                "Failed to delete conversation";
              Alert.alert("Error", errorMessage);
            }
          },
        },
      ]
    );
  };

  // Show conversation options (open chat or delete)
  const showConversationOptions = (item) => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Open Chat", "Delete Conversation"],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            router.push(`/chat?conversationId=${item._id}`);
          } else if (buttonIndex === 2) {
            handleDeleteConversation(item._id);
          }
        }
      );
    } else {
      Alert.alert(
        "Conversation Options",
        `Chat with ${item.participant?.name || "Unknown User"}`,
        [
          {
            text: "Open Chat",
            onPress: () => router.push(`/chat?conversationId=${item._id}`),
          },
          {
            text: "Delete Conversation",
            onPress: () => handleDeleteConversation(item._id),
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

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        searchUsers(searchQuery);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else if (showNewMessage) {
      // Load all messageable users when search is empty but new message is open
      loadMessageableUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, showNewMessage]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations(true);
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.abs(now - date) / 36e5;

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString("en-US", { weekday: "short" });
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const renderConversation = ({ item }) => {
    const otherParticipant = item.participant;
    const lastMessage = item.lastMessage;

    return (
      <TouchableOpacity
        onPress={() => router.push(`/chat?conversationId=${item._id}`)}
        onLongPress={() => showConversationOptions(item)}
        delayLongPress={500}
        className="flex-row items-center p-4 bg-white border-b border-gray-100"
      >
        {/* Profile Picture */}
        <View className="w-14 h-14 mr-3">
          {otherParticipant?.profilePicture ? (
            <Image
              source={{
                uri: `${getStaticImageBaseUrl()}${
                  otherParticipant.profilePicture
                }`,
              }}
              className="w-14 h-14 rounded-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-14 h-14 bg-gray-300 rounded-full items-center justify-center">
              <Text className="text-gray-600 font-semibold text-lg">
                {otherParticipant?.name?.charAt(0) || "U"}
              </Text>
            </View>
          )}
        </View>

        {/* Conversation Details */}
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <View className="flex-row items-center flex-1">
              <Text
                className="font-semibold text-gray-900 text-base"
                numberOfLines={1}
              >
                {otherParticipant?.name || "Unknown User"}
              </Text>
              {otherParticipant?.isVerified && (
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color="#3b82f6"
                  className="ml-1"
                />
              )}
            </View>
            {lastMessage && (
              <Text className="text-gray-500 text-xs">
                {formatMessageTime(lastMessage.createdAt)}
              </Text>
            )}
          </View>

          {lastMessage && (
            <View className="flex-row items-center">
              <Text className="text-gray-600 text-sm flex-1" numberOfLines={1}>
                {lastMessage.sender === user._id ? "You: " : ""}
                {lastMessage.content}
              </Text>
              {item.unreadCount > 0 && (
                <View className="bg-blue-600 rounded-full w-5 h-5 items-center justify-center ml-2">
                  <Text className="text-white text-xs font-bold">
                    {item.unreadCount > 9 ? "9+" : item.unreadCount}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSearchResult = ({ item }) => (
    <TouchableOpacity
      onPress={() => startConversation(item._id)}
      className="flex-row items-center p-4 border-b border-gray-100"
    >
      {/* Profile Picture */}
      <View className="w-12 h-12 mr-3">
        {item.profilePicture ? (
          <Image
            source={{
              uri: `${getStaticImageBaseUrl()}${item.profilePicture}`,
            }}
            className="w-12 h-12 rounded-full"
            resizeMode="cover"
          />
        ) : (
          <View className="w-12 h-12 bg-gray-300 rounded-full items-center justify-center">
            <Text className="text-gray-600 font-semibold">
              {item.name?.charAt(0) || "U"}
            </Text>
          </View>
        )}
      </View>

      {/* User Details */}
      <View className="flex-1">
        <View className="flex-row items-center">
          <Text className="font-medium text-gray-900">{item.name}</Text>
          {item.isVerified && (
            <Ionicons
              name="checkmark-circle"
              size={16}
              color="#3b82f6"
              className="ml-1"
            />
          )}
        </View>
        {item.username && (
          <Text className="text-gray-500 text-sm">@{item.username}</Text>
        )}
      </View>

      <Ionicons name="send" size={20} color="#3b82f6" />
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <LinearGradient
        colors={["#2563eb", "#1d4ed8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="pt-12 pb-4"
      >
        <SafeAreaView edges={[]} className="px-6">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <TouchableOpacity onPress={() => router.back()} className="mr-3">
                <Ionicons name="arrow-back" size={24} color="#ffffff" />
              </TouchableOpacity>
              <View>
                <Text className="text-white text-xl font-bold">Messages</Text>
                <Text className="text-blue-100 text-sm">
                  {conversations.length} conversation
                  {conversations.length !== 1 ? "s" : ""}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setShowNewMessage(!showNewMessage)}
            >
              <Ionicons name="create-outline" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* New Message Search */}
      {showNewMessage && (
        <View className="bg-white p-4 border-b border-gray-200">
          <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2 mb-3">
            <Ionicons name="search" size={20} color="#6b7280" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search followers..."
              className="flex-1 ml-2 text-gray-900"
              autoFocus
            />
            {searchQuery && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color="#6b7280" />
              </TouchableOpacity>
            )}
          </View>

          {searchLoading && (
            <View className="py-4">
              <ActivityIndicator size="small" color="#3b82f6" />
            </View>
          )}

          {searchResults.length > 0 && (
            <View className="max-h-60">
              <FlatList
                data={searchResults}
                renderItem={renderSearchResult}
                keyExtractor={(item) => item._id}
                showsVerticalScrollIndicator={false}
              />
            </View>
          )}

          {searchQuery && !searchLoading && searchResults.length === 0 && (
            <Text className="text-gray-500 text-center py-4">
              No followers found matching your search.
            </Text>
          )}

          {showNewMessage &&
            !searchQuery &&
            !searchLoading &&
            searchResults.length === 0 && (
              <Text className="text-gray-500 text-center py-4">
                No mutual followers found. You can only message users you
                mutually follow.
              </Text>
            )}
        </View>
      )}

      {/* Conversations List */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-gray-600 mt-2">Loading conversations...</Text>
        </View>
      ) : conversations.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="chatbubbles-outline" size={80} color="#d1d5db" />
          <Text className="text-gray-500 text-lg font-medium mt-4 text-center">
            No conversations yet
          </Text>
          <Text className="text-gray-400 text-center mt-2">
            Start messaging your followers by tapping the + button above
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default MessengerPage;
