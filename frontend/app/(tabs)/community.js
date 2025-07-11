import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  RefreshControl,
  Image,
  Modal,
  Dimensions,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as ImagePicker from "expo-image-picker";
import { getStaticImageBaseUrl } from "../../utils/networkConfig";
import * as MediaLibrary from "expo-media-library";
import { useAuth } from "../../hooks/useAuth";
import { postsAPI, userAPI } from "../../services/api";
import { router } from "expo-router";
import CommentsBottomSheet from "../../components/CommentsBottomSheet";
