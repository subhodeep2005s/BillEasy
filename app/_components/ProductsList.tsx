import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Product = {
  _id?: string;
  barcode: string;
  name: string;
  price: number | string;
  stock: number | string;
  category?: string;
};

type Props = {
  products: Product[];
  loading: boolean;
  onAddToCart: (product: Product) => void;
};

export default function ProductsList({
  products,
  loading,
  onAddToCart,
}: Props) {
  const renderItem = ({ item }: { item: Product }) => {
    const price =
      typeof item.price === "string" ? parseFloat(item.price) : item.price;
    const stock =
      typeof item.stock === "string" ? parseInt(item.stock, 10) : item.stock;

    const isOutOfStock = stock <= 0;

    return (
      <View style={styles.card}>
        <View style={styles.cardMain}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <Ionicons name="cube-outline" size={20} color="#3b82f6" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.name} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={styles.barcode}>#{item.barcode}</Text>
              {item.category && (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{item.category}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.priceStockContainer}>
              <Text style={styles.price}>₹{price.toFixed(2)}</Text>
              <View
                style={[
                  styles.stockBadge,
                  isOutOfStock && styles.stockBadgeEmpty,
                ]}
              >
                <Ionicons
                  name="layers-outline"
                  size={12}
                  color={isOutOfStock ? "#ef4444" : "#059669"}
                />
                <Text
                  style={[
                    styles.stockText,
                    isOutOfStock && styles.stockTextEmpty,
                  ]}
                >
                  {stock}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.addButton,
                isOutOfStock && styles.addButtonDisabled,
              ]}
              onPress={() => onAddToCart(item)}
              disabled={isOutOfStock}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isOutOfStock ? "close-circle" : "cart"}
                size={18}
                color="white"
              />
              <Text style={styles.addButtonText}>
                {isOutOfStock ? "Out" : "Add"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  if (products.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Ionicons name="cube-outline" size={80} color="#e5e7eb" />
        </View>
        <Text style={styles.emptyText}>No products found</Text>
        <Text style={styles.emptySubtext}>
          Scan a barcode or search to add products
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <Ionicons name="cube" size={20} color="#3b82f6" />
          <Text style={styles.header}>Products</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{products.length}</Text>
        </View>
      </View>

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
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  header: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    letterSpacing: -0.3,
  },

  countBadge: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },

  countText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#3b82f6",
  },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 120,
  },

  card: {
    backgroundColor: "#ffffff",
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  cardMain: {
    padding: 16,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },

  iconContainer: {
    width: 40,
    height: 40,
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  cardContent: {
    flex: 1,
  },

  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    letterSpacing: -0.2,
    lineHeight: 22,
    marginBottom: 4,
  },

  barcode: {
    fontSize: 12,
    color: "#9ca3af",
    fontFamily: "monospace",
    marginBottom: 6,
  },

  categoryBadge: {
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },

  categoryText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#16a34a",
  },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },

  priceStockContainer: {
    flex: 1,
    gap: 8,
  },

  price: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
    letterSpacing: -0.5,
  },

  stockBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
    gap: 4,
  },

  stockBadgeEmpty: {
    backgroundColor: "#fef2f2",
  },

  stockText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#059669",
  },

  stockTextEmpty: {
    color: "#ef4444",
  },

  addButton: {
    backgroundColor: "#3b82f6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },

  addButtonDisabled: {
    backgroundColor: "#9ca3af",
    shadowOpacity: 0,
  },

  addButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },

  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: "#6b7280",
    fontWeight: "500",
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 40,
  },

  emptyIconContainer: {
    width: 120,
    height: 120,
    backgroundColor: "#f9fafb",
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#f1f5f9",
  },

  emptyText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#4b5563",
    marginBottom: 8,
  },

  emptySubtext: {
    fontSize: 15,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 22,
  },
});
