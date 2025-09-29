import React from "react";
import { View, TextInput, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

interface SearchBarProps {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChange, placeholder }: SearchBarProps) {
  return (
    <View style={styles.container}>
      <Ionicons name="search-outline" size={20} color="#6b7280" style={{ marginRight: 8 }} />
      <TextInput
        style={styles.input}
        placeholder={placeholder || "Search products..."}
        value={value}
        onChangeText={onChange}
        placeholderTextColor="#9ca3af"
        clearButtonMode="while-editing"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1f2937",
  },
});



// http://192.168.0.101:8000/search-product