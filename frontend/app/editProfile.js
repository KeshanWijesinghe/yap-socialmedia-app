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
}
