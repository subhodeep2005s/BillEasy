import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { StyleSheet, TextInput, View } from "react-native";

type Props = {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
};

export default function SearchBar({ value, onChange, placeholder }: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name="search" size={20} color="#6b7280" style={styles.icon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder || "Search..."}
        value={value}
        onChangeText={onChange}
        placeholderTextColor="#9ca3af"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    marginHorizontal: 20,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  icon: { marginRight: 8 },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
  },
});

// http://192.168.0.101:8000/search-product
