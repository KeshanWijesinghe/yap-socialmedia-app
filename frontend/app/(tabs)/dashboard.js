import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { dummyDashboardFeatures } from "../../constants/dummyData";

export default function DashboardScreen() {
  const renderFeatureCard = ({ item }) => (
    <TouchableOpacity className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-100">
      <View className="flex-row items-start">
        <View
          className={`w-12 h-12 ${item.color} rounded-lg items-center justify-center mr-4`}
        >
          <Text className="text-2xl">{item.icon}</Text>
        </View>

        <View className="flex-1">
          <Text className="font-semibold text-lg text-gray-900 mb-1">
            {item.title}
          </Text>
          <Text className="text-gray-600 text-sm leading-5 mb-3">
            {item.description}
          </Text>
        </View>

        <TouchableOpacity>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>
      </View>
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
        <SafeAreaView edges={[]} className="px-6">
          <Text className="text-white text-2xl font-bold">Dashboard</Text>
          <Text className="text-blue-100 text-sm">Advanced surf analytics</Text>
        </SafeAreaView>
      </LinearGradient>

      <View className="flex-1 bg-gray-50">
        <ScrollView
          className="flex-1 px-6 py-6"
          showsVerticalScrollIndicator={false}
        >
          {/* Advanced Features Header */}
          <Text className="text-xl font-bold text-gray-900 mb-6">
            Advanced Features
          </Text>

          {/* Feature Cards */}
          <FlatList
            data={dummyDashboardFeatures}
            renderItem={renderFeatureCard}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />

          {/* Coming Soon Section */}
          <View className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 mt-4">
            <Text className="text-white text-lg font-bold mb-2">
              🚀 More Features Coming Soon!
            </Text>
            <Text className="text-purple-100 text-sm">
              We're working on exciting new features to enhance your surfing
              experience. Stay tuned for updates!
            </Text>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
