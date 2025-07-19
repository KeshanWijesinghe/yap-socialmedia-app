import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TextInput,
  Platform,
  ActionSheetIOS,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { messageAPI } from "../services/messageAPI";
import { userAPI } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { getStaticImageBaseUrl } from "../utils/networkConfig";
