import React, { useEffect, useRef } from "react";
import { View, Text, Image, Animated, Easing } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useAuth } from "../hooks/useAuth";

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous rotation animation for loading indicator
    const rotateLoop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    rotateLoop.start();

    if (!isLoading) {
      setTimeout(() => {
        if (isAuthenticated) {
          router.replace("/(tabs)/community");
        } else {
          router.replace("/(auth)/login");
        }
      }, 2500); // Show splash for 2.5 seconds
    }

    return () => rotateLoop.stop();
  }, [isAuthenticated, isLoading]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <LinearGradient
      colors={["#2563eb", "#1d4ed8"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1 items-center justify-center"
    >
      {/* Animated Logo Container */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
        }}
        className="items-center mb-8"
      >
        {/* Logo */}
        <View className="w-32 h-32 bg-white rounded-full items-center justify-center mb-6 shadow-2xl">
          <Image
            source={require("../assets/logo1.png")}
            className="w-24 h-24"
            resizeMode="contain"
          />
        </View>

        {/* App Title */}
        <Text className="text-white text-4xl font-bold text-center mb-2">
          YAP
        </Text>
        <Text className="text-blue-100 text-lg font-medium tracking-wide">
          THE SMART SOCIAL APP
        </Text>
      </Animated.View>

      {/* Loading Indicator */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ rotate: spin }],
        }}
        className="absolute bottom-20"
      >
        <View className="w-10 h-10 border-4 border-white border-t-transparent rounded-full" />
      </Animated.View>
    </LinearGradient>
  );
}
