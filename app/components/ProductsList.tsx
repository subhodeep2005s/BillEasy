import React from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Product = {
  _id?: string;
  barcode: string;
  name: string;
  price: number; // changed to number to match App.tsx
  stock: number;
  category?: string;
};

type Props = {
  products: Product[];
  loading: boolean;
};

export default function ProductsList({ products, loading }: Props) {
  const renderItem = ({ item }: { item: Product }) => (
    <View style={styles.card}>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.details}>Barcode: {item.barcode}</Text>
      <Text style={styles.details}>Stock: {item.stock}</Text>
      <Text style={styles.price}>₹{item.price ?? "N/A"}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Loading products...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>All Products ({products.length})</Text>
      <FlatList
        data={products}
        keyExtractor={(item, index) => item._id ?? index.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    padding: 16,
    color: "#111827",
  },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  name: { fontSize: 18, fontWeight: "600", color: "#111827" },
  details: { fontSize: 14, color: "#6B7280", marginTop: 4 },
  price: { fontSize: 16, fontWeight: "bold", color: "#007AFF", marginTop: 6 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
});
