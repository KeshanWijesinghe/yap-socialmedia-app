import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../hooks/useAuth";
import Input from "../../components/Input";
import Button from "../../components/Button";

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const { register } = useAuth();
  const router = useRouter();

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    }

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username =
        "Username can only contain letters, numbers, and underscores";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password =
        "Password must contain at least one lowercase letter, one uppercase letter, and one number";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!agreedToTerms) {
      Alert.alert("Terms Required", "Please agree to the Terms and Conditions");
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    const { confirmPassword, ...registerData } = formData;
    const result = await register(registerData);
    setIsLoading(false);

    if (result.success) {
      router.replace("/(tabs)");
    } else {
      Alert.alert("Registration Failed", result.error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <ScrollView
        className="flex-1 bg-white"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-6 justify-center py-8">
          {/* Header */}
          <View className="items-center mb-8">
            <Text className="text-3xl font-bold text-gray-900 mb-2">
              Create Account
            </Text>
            <Text className="text-gray-600 text-base text-center">
              Join the surf community
            </Text>
          </View>

          {/* Form */}
          <View className="mb-6">
            <Input
              label="Full Name"
              value={formData.name}
              onChangeText={(value) => handleInputChange("name", value)}
              placeholder="Enter your full name"
              icon="person"
              error={errors.name}
            />

            <Input
              label="Username"
              value={formData.username}
              onChangeText={(value) => handleInputChange("username", value)}
              placeholder="Choose a username"
              autoCapitalize="none"
              icon="at"
              error={errors.username}
            />

            <Input
              label="Email Address"
              value={formData.email}
              onChangeText={(value) => handleInputChange("email", value)}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              icon="mail"
              error={errors.email}
            />

            <Input
              label="Password"
              value={formData.password}
              onChangeText={(value) => handleInputChange("password", value)}
              placeholder="Create a password"
              secureTextEntry
              icon="lock-closed"
              error={errors.password}
            />
            {!errors.password && (
              <Text className="text-xs text-gray-500 mb-4 -mt-2">
                Must contain at least 6 characters, one uppercase, one
                lowercase, and one number
              </Text>
            )}

            <Input
              label="Confirm Password"
              value={formData.confirmPassword}
              onChangeText={(value) =>
                handleInputChange("confirmPassword", value)
              }
              placeholder="Confirm your password"
              secureTextEntry
              icon="lock-closed"
              error={errors.confirmPassword}
            />

            {/* Terms and Conditions */}
            <View className="flex-row items-start mb-6">
              <TouchableOpacity
                onPress={() => setAgreedToTerms(!agreedToTerms)}
                className="mr-3 mt-1"
              >
                <View
                  className={`w-5 h-5 border-2 rounded ${
                    agreedToTerms
                      ? "bg-blue-500 border-blue-500"
                      : "border-gray-400"
                  } items-center justify-center`}
                >
                  {agreedToTerms && (
                    <Text className="text-white text-xs">✓</Text>
                  )}
                </View>
              </TouchableOpacity>
              <View className="flex-1">
                <Text className="text-gray-600 text-sm">
                  I agree to the{" "}
                  <Text className="text-blue-500 underline">
                    Terms and Conditions
                  </Text>{" "}
                  and{" "}
                  <Text className="text-blue-500 underline">
                    Privacy Policy
                  </Text>
                </Text>
              </View>
            </View>
          </View>

          {/* Create Account Button */}
          <Button
            title={isLoading ? "Creating Account..." : "Create Account"}
            onPress={handleRegister}
            disabled={isLoading}
            className="mb-6"
          />

          {/* Divider */}
          <View className="flex-row items-center mb-6">
            <View className="flex-1 h-px bg-gray-300" />
            <Text className="mx-4 text-gray-500 font-medium">OR</Text>
            <View className="flex-1 h-px bg-gray-300" />
          </View>

          {/* Google Sign In */}
          <TouchableOpacity className="flex-row items-center justify-center py-3 px-4 border border-gray-300 rounded-lg mb-8">
            <Text className="text-red-500 text-lg mr-2">G</Text>
            <Text className="text-gray-700 font-medium">
              Continue with Google
            </Text>
          </TouchableOpacity>

          {/* Sign In Link */}
          <View className="flex-row justify-center">
            <Text className="text-gray-600">Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
              <Text className="text-blue-500 font-medium">Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
