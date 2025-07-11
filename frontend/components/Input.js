import React, { useState } from "react";
import { View, TextInput, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  error,
  icon,
  keyboardType = "default",
  className = "",
  ...props
}) => {
  const [isSecure, setIsSecure] = useState(secureTextEntry);

  return (
    <View className={`mb-4 ${className}`}>
      {label && (
        <Text className="text-gray-700 text-sm font-medium mb-2">{label}</Text>
      )}

      <View className="relative">
        <View className="flex-row items-center border border-gray-300 rounded-lg bg-white">
          {icon && (
            <View className="pl-3">
              <Ionicons name={icon} size={20} color="#9ca3af" />
            </View>
          )}

          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            secureTextEntry={isSecure}
            keyboardType={keyboardType}
            className={`flex-1 py-3 px-3 text-gray-900 ${icon ? "pl-2" : ""}`}
            placeholderTextColor="#9ca3af"
            {...props}
          />

          {secureTextEntry && (
            <TouchableOpacity
              onPress={() => setIsSecure(!isSecure)}
              className="pr-3"
            >
              <Ionicons
                name={isSecure ? "eye-off" : "eye"}
                size={20}
                color="#9ca3af"
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {error && <Text className="text-red-500 text-xs mt-1">{error}</Text>}
    </View>
  );
};

export default Input;
