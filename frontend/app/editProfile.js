import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../hooks/useAuth";
import { userAPI } from "../services/api";
import { getStaticImageBaseUrl } from "../utils/networkConfig";

export default function EditProfileScreen() {
  const { user, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    bio: "",
    location: "",
    website: "",
    phone: "",
  });
  const [profileImage, setProfileImage] = useState(null);
  const [imageChanged, setImageChanged] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        bio: user.bio || "",
        location: user.location || "",
        website: user.website || "",
        phone: user.phone || "",
      });

      if (user.profilePicture) {
        setProfileImage(`${getStaticImageBaseUrl()}${user.profilePicture}`);
      }
    }
  }, [user]);

  const handleInputChange = (field, value) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Sorry, we need camera roll permissions to select a profile picture."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
        setImageChanged(true);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const formData = new FormData();

      // Add text fields
      Object.keys(profileData).forEach((key) => {
        if (profileData[key]) {
          formData.append(key, profileData[key]);
        }
      });

      // Add profile image if changed
      if (imageChanged && profileImage) {
        const fileName = profileImage.split("/").pop();
        const fileType = fileName.split(".").pop();

        formData.append("profilePicture", {
          uri: profileImage,
          name: fileName,
          type: `image/${fileType}`,
        });
      }

      console.log("Updating profile with data:", profileData);

      const response = await userAPI.updateProfile(formData);

      if (response.data.success) {
        // Update user context with new data
        updateUser(response.data.data.user);

        Alert.alert("Success", "Profile updated successfully!", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        throw new Error(response.data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message ||
          "Failed to update profile. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <LinearGradient
        colors={["#1e40af", "#3b82f6", "#60a5fa"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="px-4 py-3"
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          <Text className="text-white text-lg font-bold">Edit Profile</Text>

          <TouchableOpacity
            onPress={handleSave}
            disabled={isLoading}
            className="p-2"
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-white font-medium">Save</Text>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile Picture Section */}
        <View className="items-center py-6 bg-white mx-4 mt-4 rounded-lg shadow-sm">
          <TouchableOpacity onPress={pickImage} className="relative">
            <View className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden">
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-full bg-blue-100 items-center justify-center">
                  <Ionicons name="person" size={40} color="#3b82f6" />
                </View>
              )}
            </View>
            <View className="absolute -bottom-1 -right-1 bg-blue-600 p-1 rounded-full">
              <Ionicons name="camera" size={16} color="white" />
            </View>
          </TouchableOpacity>
          <Text className="text-gray-600 text-sm mt-2">
            Tap to change photo
          </Text>
        </View>

        {/* Form Section */}
        <View className="bg-white mx-4 mt-4 rounded-lg shadow-sm">
          {/* Name */}
          <View className="p-4 border-b border-gray-100">
            <Text className="text-gray-700 font-medium mb-2">Full Name</Text>
            <TextInput
              value={profileData.name}
              onChangeText={(text) => handleInputChange("name", text)}
              placeholder="Enter your full name"
              className="text-gray-900 text-base p-3 bg-gray-50 rounded-lg"
            />
          </View>

          {/* Email */}
          <View className="p-4 border-b border-gray-100">
            <Text className="text-gray-700 font-medium mb-2">Email</Text>
            <TextInput
              value={profileData.email}
              onChangeText={(text) => handleInputChange("email", text)}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              className="text-gray-900 text-base p-3 bg-gray-50 rounded-lg"
            />
          </View>

          {/* Bio */}
          <View className="p-4 border-b border-gray-100">
            <Text className="text-gray-700 font-medium mb-2">Bio</Text>
            <TextInput
              value={profileData.bio}
              onChangeText={(text) => handleInputChange("bio", text)}
              placeholder="Tell us about yourself"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className="text-gray-900 text-base p-3 bg-gray-50 rounded-lg min-h-[80px]"
            />
          </View>

          {/* Location */}
          <View className="p-4 border-b border-gray-100">
            <Text className="text-gray-700 font-medium mb-2">Location</Text>
            <TextInput
              value={profileData.location}
              onChangeText={(text) => handleInputChange("location", text)}
              placeholder="Enter your location"
              className="text-gray-900 text-base p-3 bg-gray-50 rounded-lg"
            />
          </View>

          {/* Website */}
          <View className="p-4 border-b border-gray-100">
            <Text className="text-gray-700 font-medium mb-2">Website</Text>
            <TextInput
              value={profileData.website}
              onChangeText={(text) => handleInputChange("website", text)}
              placeholder="Enter your website URL"
              autoCapitalize="none"
              className="text-gray-900 text-base p-3 bg-gray-50 rounded-lg"
            />
          </View>

          {/* Phone */}
          <View className="p-4">
            <Text className="text-gray-700 font-medium mb-2">Phone</Text>
            <TextInput
              value={profileData.phone}
              onChangeText={(text) => handleInputChange("phone", text)}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
              className="text-gray-900 text-base p-3 bg-gray-50 rounded-lg"
            />
          </View>
        </View>

        {/* Save Button */}
        <View className="p-4 mt-4">
          <TouchableOpacity
            onPress={handleSave}
            disabled={isLoading}
            className="bg-blue-600 py-4 rounded-lg shadow-sm"
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-white text-center font-bold text-base">
                Save Changes
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
