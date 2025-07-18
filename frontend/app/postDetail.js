import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { router, useLocalSearchParams } from "expo-router";
import { postsAPI } from "../services/api";
import { getStaticImageBaseUrl } from "../utils/networkConfig";
import { useAuth } from "../hooks/useAuth";
import CommentsBottomSheet from "../components/CommentsBottomSheet";

const { width } = Dimensions.get("window");
