import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { dummySurfConditions, dummyNews } from "../../constants/dummyData";

export default function HomeScreen() {
  const renderConditionCard = ({ item }) => (
    <View className="bg-white rounded-lg p-4 mr-4 shadow-sm border border-gray-100 min-w-[200px]">
      <Text className="font-semibold text-lg text-gray-900 mb-1">
        {item.location}
      </Text>
      <Text className="text-blue-600 font-medium text-base mb-2">
        {item.waveHeight}
      </Text>
      <Text className="text-gray-600 text-sm mb-3">{item.windCondition}</Text>
      <View className={`px-3 py-1 rounded-full self-start ${item.ratingColor}`}>
        <Text className="text-white text-xs font-medium">{item.rating}</Text>
      </View>
    </View>
  );

  const renderNewsCard = ({ item }) => (
    <View className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-100">
      <View className="flex-row justify-between items-start mb-3">
        <View className="bg-blue-100 px-2 py-1 rounded">
          <Text className="text-blue-700 text-xs font-medium">
            {item.category}
          </Text>
        </View>
        <Text className="text-gray-500 text-xs">{item.timeAgo}</Text>
      </View>

      <Text className="text-lg font-semibold text-gray-900 mb-2">
        {item.title}
      </Text>
      <Text className="text-gray-600 text-sm mb-3 leading-5">
        {item.description}
      </Text>

      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center">
          <View className="w-6 h-6 bg-gray-300 rounded-full mr-2" />
          <Text className="text-gray-600 text-xs">{item.source}</Text>
        </View>
        <Text className="text-gray-500 text-xs">{item.readTime}</Text>
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
          <Text className="text-white text-2xl font-bold">Surf Ceylon</Text>
          <Text className="text-blue-100 text-sm">
            Latest surf news & updates
          </Text>
        </SafeAreaView>
      </LinearGradient>

      <View className="flex-1 bg-gray-50">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Live Surf Conditions */}
          <View className="py-6">
            <View className="flex-row justify-between items-center px-6 mb-4">
              <Text className="text-xl font-bold text-gray-900">
                Live Surf Conditions
              </Text>
              <TouchableOpacity>
                <Text className="text-blue-600 font-medium">View All</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={dummySurfConditions}
              renderItem={renderConditionCard}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24 }}
            />
          </View>

          {/* Featured Stories */}
          <View className="px-6 py-2">
            <Text className="text-xl font-bold text-gray-900 mb-4">
              Featured Stories
            </Text>

            <FlatList
              data={dummyNews}
              renderItem={renderNewsCard}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          </View>

          {/* Latest Updates */}
          <View className="px-6 py-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-900">
                Latest Updates
              </Text>
              <TouchableOpacity>
                <Text className="text-blue-600 font-medium">See All</Text>
              </TouchableOpacity>
            </View>

            {/* Placeholder for latest updates */}
            <View className="bg-white rounded-lg p-4 border border-gray-100">
              <Text className="text-gray-600 text-center py-8">
                More updates coming soon...
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
