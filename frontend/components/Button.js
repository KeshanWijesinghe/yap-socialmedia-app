import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

const Button = ({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  className = "",
  ...props
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case "primary":
        return disabled ? "bg-gray-300" : "bg-blue-500 active:bg-blue-600";
      case "secondary":
        return disabled
          ? "bg-gray-200 border border-gray-300"
          : "bg-white border border-blue-500 active:bg-gray-50";
      case "outline":
        return disabled
          ? "border border-gray-300"
          : "border border-blue-500 active:bg-blue-50";
      default:
        return "bg-blue-500 active:bg-blue-600";
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "py-2 px-3";
      case "md":
        return "py-3 px-4";
      case "lg":
        return "py-4 px-6";
      default:
        return "py-3 px-4";
    }
  };

  const getTextClasses = () => {
    if (disabled) return "text-gray-500";

    switch (variant) {
      case "primary":
        return "text-white font-medium";
      case "secondary":
      case "outline":
        return "text-blue-500 font-medium";
      default:
        return "text-white font-medium";
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className={`rounded-lg items-center justify-center ${getVariantClasses()} ${getSizeClasses()} ${className}`}
      {...props}
    >
      <Text className={`text-base ${getTextClasses()}`}>{title}</Text>
    </TouchableOpacity>
  );
};

export default Button;
