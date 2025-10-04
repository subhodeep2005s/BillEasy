import Ionicons from "@expo/vector-icons/Ionicons";
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
  price: number;
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
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Ionicons name="cube-outline" size={16} color="#3b82f6" />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.barcode}>#{item.barcode}</Text>
        </View>
      </View>
      
      <View style={styles.cardFooter}>
        <View style={styles.stockBadge}>
          <Ionicons name="layers-outline" size={12} color="#059669" />
          <Text style={styles.stockText}>{item.stock}</Text>
        </View>
        <Text style={styles.price}>₹{item.price}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Products</Text>
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
    backgroundColor: "#f8fafc" 
  },
  
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  
  header: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
    letterSpacing: -0.3,
  },
  
  countBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
  },
  
  listContent: { 
    paddingHorizontal: 20, 
    paddingBottom: 100 
  },
  
  card: {
    backgroundColor: "#ffffff",
    padding: 12,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  iconContainer: {
    width: 32,
    height: 32,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  
  cardContent: {
    flex: 1,
  },
  
  name: { 
    fontSize: 15, 
    fontWeight: "600", 
    color: "#1f2937",
    letterSpacing: -0.2,
  },
  
  barcode: { 
    fontSize: 11, 
    color: "#9ca3af",
    marginTop: 2,
    fontFamily: 'monospace',
  },
  
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  
  stockText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  
  price: { 
    fontSize: 15, 
    fontWeight: "700", 
    color: "#1f2937",
    letterSpacing: -0.3,
  },
  
  loading: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
});