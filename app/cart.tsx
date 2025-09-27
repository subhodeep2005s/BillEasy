

import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type CartItem = {
  barcode: string;
  name: string;
  price: number;
  description?: string | null;
};

export default function Cart() {
  const router = useRouter();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMode, setPaymentMode] = useState("");

  // Fetch cart items
  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await fetch("https://erp-pos-backend.onrender.com/cart");
      const data = await response.json();

      if (Array.isArray(data.cart)) {
        setCartItems(data.cart);
      } else {
        setCartItems([]);
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCart();
    setRefreshing(false);
  };

  const handleRemove = async (barcode: string) => {
    try {
      const response = await fetch(
        "https://erp-pos-backend.onrender.com/remove-item",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ barcode }),
        }
      );

      const result = await response.json();
      if (response.ok) {
        Alert.alert("Removed", result.message || "Item removed");
        fetchCart();
      } else {
        Alert.alert("Error", result.error || "Failed to remove item");
      }
    } catch (error) {
      console.error("Remove item error:", error);
      Alert.alert("Error", "Failed to remove item");
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={styles.item}>
      <View style={styles.itemInfo}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.barcode}>Barcode: {item.barcode}</Text>
        <Text style={styles.price}>${item.price.toFixed(2)}</Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleRemove(item.barcode)}
      >
        <Ionicons name="trash-outline" size={22} color="white" />
      </TouchableOpacity>
    </View>
  );

  const total = cartItems.reduce((sum, item) => sum + item.price, 0);

  // Finalize sale
  const finalizeSale = async () => {
    if (!customerName || !customerPhone || !paymentMode) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    try {
      const response = await fetch(
        "https://erp-pos-backend.onrender.com/finalize-sale",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customerName, customerPhone, paymentMode }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        setModalVisible(false);
        // Pass bill data to BillPage
        router.push({
          pathname: "./BillPage",
          params: { bill: JSON.stringify(result.bill) },
        });
      } else {
        Alert.alert("Error", result.error || "Failed to finalize sale");
      }
    } catch (error) {
      console.error("Finalize sale error:", error);
      Alert.alert("Error", "Failed to finalize sale");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>🛒 Your Cart</Text>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#007bff"
          style={{ marginTop: 20 }}
        />
      ) : cartItems.length === 0 ? (
        <Text style={styles.empty}>Your cart is empty</Text>
      ) : (
        <>
          <FlatList
            data={cartItems}
            keyExtractor={(item, index) => item.barcode + index}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />

          <View style={styles.totalContainer}>
            <Text style={styles.totalText}>Total: ${total.toFixed(2)}</Text>
            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.checkoutText}>Checkout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Finalize Sale</Text>

            <TextInput
              placeholder="Customer Name"
              value={customerName}
              onChangeText={setCustomerName}
              style={styles.input}
            />
            <TextInput
              placeholder="Customer Phone"
              value={customerPhone}
              onChangeText={setCustomerPhone}
              keyboardType="phone-pad"
              style={styles.input}
            />

            {/* Payment Options */}
            <Text style={{ marginBottom: 8, fontWeight: "600" }}>Select Payment Mode</Text>
            <View style={styles.paymentOptions}>
              {["UPI", "Cash", "Kidney", "Gand"].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.paymentOption,
                    paymentMode === option && styles.paymentOptionSelected,
                  ]}
                  onPress={() => setPaymentMode(option)}
                >
                  <Text
                    style={[
                      styles.paymentOptionText,
                      paymentMode === option && styles.paymentOptionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#6c757d" }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#007bff" }]}
                onPress={finalizeSale}
              >
                <Text style={styles.modalButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC", padding: 16 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 16, textAlign: "center" },
  empty: { fontSize: 18, textAlign: "center", marginTop: 20, color: "#555" },
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemInfo: { flex: 1 },
  name: { fontSize: 18, fontWeight: "600" },
  barcode: { fontSize: 14, color: "#666", marginTop: 2 },
  price: { fontSize: 16, fontWeight: "bold", marginTop: 6, color: "#007bff" },
  deleteButton: { backgroundColor: "#dc3545", padding: 10, borderRadius: 8 },
  totalContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderColor: "#ddd",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalText: { fontSize: 20, fontWeight: "bold", color: "#28a745" },
  checkoutButton: {
    backgroundColor: "#007bff",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  checkoutText: { color: "white", fontSize: 16, fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: { width: "90%", backgroundColor: "white", padding: 20, borderRadius: 12 },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  paymentOptions: { flexDirection: "row", flexWrap: "wrap", marginBottom: 16 },
  paymentOption: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 10,
    marginBottom: 10,
  },
  paymentOptionSelected: { backgroundColor: "#007bff", borderColor: "#007bff" },
  paymentOptionText: { fontSize: 16, color: "#333" },
  paymentOptionTextSelected: { color: "#fff", fontWeight: "600" },
  modalButtons: { flexDirection: "row", justifyContent: "space-between" },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  modalButtonText: { color: "white", fontWeight: "600", fontSize: 16 },
});
