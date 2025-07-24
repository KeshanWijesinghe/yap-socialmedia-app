import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  dummyMarketCategories,
  dummyMarketServices,
} from "../../constants/dummyData";

export default function MarketScreen() {
  const renderCategoryCard = ({ item }) => (
    <TouchableOpacity className="bg-white rounded-lg p-4 items-center shadow-sm border border-gray-100 mr-4 min-w-[100px]">
      <View className="w-12 h-12 bg-blue-100 rounded-lg items-center justify-center mb-2">
        <Text className="text-2xl">{item.icon}</Text>
      </View>
      <Text className="font-medium text-gray-900 text-sm text-center mb-1">
        {item.title}
      </Text>
      <Text className="text-blue-600 text-xs font-medium">{item.count}</Text>
    </TouchableOpacity>
  );

  const renderServiceCard = ({ item }) => (
    <View className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-100">
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1 mr-3">
          <Text className="font-semibold text-lg text-gray-900 mb-1">
            {item.title}
          </Text>
          <Text className="text-gray-600 text-sm mb-2">{item.description}</Text>

          <View className="flex-row items-center mb-2">
            <Ionicons name="star" size={16} color="#fbbf24" />
            <Text className="text-gray-900 font-medium ml-1 mr-2">
              {item.rating}
            </Text>
            <Text className="text-gray-500 text-sm">• {item.reviews}</Text>
          </View>

          <View className="flex-row items-center">
            <Ionicons name="location" size={14} color="#6b7280" />
            <Text className="text-gray-600 text-sm ml-1">{item.location}</Text>
          </View>
        </View>

        <Text className="text-blue-600 font-bold text-lg">{item.price}</Text>
      </View>

      <View className="flex-row space-x-3">
        <TouchableOpacity className="flex-1 bg-blue-600 py-3 rounded-lg">
          <Text className="text-white font-medium text-center">Book Now</Text>
        </TouchableOpacity>

        <TouchableOpacity className="w-12 h-12 border border-gray-300 rounded-lg items-center justify-center">
          <Ionicons name="chatbubble-outline" size={20} color="#6b7280" />
        </TouchableOpacity>

        <TouchableOpacity className="w-12 h-12 border border-gray-300 rounded-lg items-center justify-center">
          <Ionicons name="heart-outline" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>
    </View>
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
        <SafeAreaView edges={[]} className="px-6">
          <Text className="text-white text-2xl font-bold">Surf Market</Text>
          <Text className="text-blue-100 text-sm">
            Find surf schools, instructors & gear
          </Text>
        </SafeAreaView>
      </LinearGradient>

      <View className="flex-1 bg-gray-50">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Search Bar */}
          <View className="px-6 py-4">
            <View className="flex-row items-center bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-200">
              <Ionicons name="search" size={20} color="#9ca3af" />
              <TextInput
                placeholder="Search surf schools, instructors, gear..."
                className="flex-1 ml-3 text-gray-900"
                placeholderTextColor="#9ca3af"
              />
              <TouchableOpacity>
                <Ionicons name="options" size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Categories */}
          <View className="py-2">
            <Text className="text-lg font-bold text-gray-900 px-6 mb-4">
              Categories
            </Text>

            <FlatList
              data={dummyMarketCategories}
              renderItem={renderCategoryCard}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24 }}
            />
          </View>

          {/* Filter Tabs */}
          <View className="px-6 py-4">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row space-x-3">
                {["All", "Near Me", "Top Rated", "Budget Friendly"].map(
                  (tab, index) => (
                    <TouchableOpacity
                      key={tab}
                      className={`px-4 py-2 rounded-full ${
                        index === 0
                          ? "bg-blue-600"
                          : "bg-white border border-gray-300"
                      }`}
                    >
                      <Text
                        className={`font-medium ${
                          index === 0 ? "text-white" : "text-gray-700"
                        }`}
                      >
                        {tab}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            </ScrollView>
          </View>

          {/* Featured Services */}
          <View className="px-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-gray-900">
                Featured Services
              </Text>
              <TouchableOpacity>
                <Text className="text-blue-600 font-medium">See All</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={dummyMarketServices}
              renderItem={renderServiceCard}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
