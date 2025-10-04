import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRouter } from "expo-router";
import React, { useEffect, useLayoutEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export const options = {
  headerShown: false,
};
const { width } = Dimensions.get('window');

type CartItem = {
  barcode: string;
  name: string;
  price: number;
  description?: string | null;
};

type PaymentMode = 'Cash' | 'Card' | 'UPI';

export default function Cart() {
const navigation = useNavigation();
useLayoutEffect(() => {
  navigation.setOptions({
    headerShown: false,
  });
}, [navigation]);
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("Cash");
  const [cartId, setCartId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const paymentOptions: PaymentMode[] = ['Cash', 'Card', 'UPI'];

  const loadCart = async () => {
    try {
      setLoading(true);
      const storedCart = await AsyncStorage.getItem("cart");
      if (storedCart) {
        setCartItems(JSON.parse(storedCart));
      }
    } catch (error) {
      console.error("Error loading cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (barcode: string) => {
    try {
      const updatedCart = cartItems.filter(item => item.barcode !== barcode);
      setCartItems(updatedCart);
      await AsyncStorage.setItem("cart", JSON.stringify(updatedCart));
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  // Step 1: Proceed-cart
  const handleCheckout = async () => {
    try {
      const barcodes = cartItems.map(item => item.barcode);
      if (barcodes.length === 0) {
        Alert.alert("Error", "Cart is empty");
        return;
      }

      const response = await fetch("https://erp-pos-backend.onrender.com/proceed-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcodes }),
      });

      const result = await response.json();
      console.log("Proceed cart result:", result);

      if (response.ok) {
        setCartId(result.cartId);
        setModalVisible(true); // open modal for customer details
      } else {
        Alert.alert("Error", result.error || "Failed to proceed cart");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      Alert.alert("Error", "Failed to proceed cart");
    }
  };

  // Step 2: Finalize-sale
  const finalizeSale = async () => {
    if (!customerName.trim() || !customerPhone.trim() || !cartId) {
      Alert.alert("Error", "Please fill all details");
      return;
    }

    // Basic phone validation
    if (customerPhone.length < 10) {
      Alert.alert("Error", "Please enter a valid phone number");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("https://erp-pos-backend.onrender.com/finalize-sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerName, customerPhone, paymentMode, cartId }),
      });

      const result = await response.json();
      console.log(JSON.stringify(result.bill));

      if (response.ok) {
        await AsyncStorage.removeItem("cart");
        setCartItems([]);
        setModalVisible(false);
        
        // Reset form
        setCustomerName("");
        setCustomerPhone("");
        setPaymentMode("Cash");

        router.push({
          pathname: "./BillPage",
          params: { bill: JSON.stringify(result.bill) },
        });
      } else {
        Alert.alert("Error", result.error || "Failed to finalize sale");
      }
    } catch (error) {
      console.error("Finalize error:", error);
      Alert.alert("Error", "Failed to finalize sale");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPaymentOption = (option: PaymentMode) => {
    const isSelected = paymentMode === option;
    const getIcon = () => {
      switch (option) {
        case 'Cash': return 'cash-outline';
        case 'Card': return 'card-outline';
        case 'UPI': return 'phone-portrait-outline';
        default: return 'cash-outline';
      }
    };

    return (
      <TouchableOpacity
        key={option}
        style={[styles.paymentOption, isSelected && styles.paymentOptionSelected]}
        onPress={() => setPaymentMode(option)}
      >
        <View style={styles.paymentOptionContent}>
          <Ionicons 
            name={getIcon()} 
            size={24} 
            color={isSelected ? '#007bff' : '#666'} 
          />
          <Text style={[styles.paymentOptionText, isSelected && styles.paymentOptionTextSelected]}>
            {option}
          </Text>
        </View>
        <View style={[styles.radioButton, isSelected && styles.radioButtonSelected]}>
          {isSelected && <View style={styles.radioButtonInner} />}
        </View>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={styles.item}>
      <View style={styles.itemInfo}>
        <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.barcode}>#{item.barcode}</Text>
        <Text style={styles.price}>₹{Number(item.price).toFixed(2)}</Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleRemove(item.barcode)}
      >
        <Ionicons name="trash-outline" size={20} color="white" />
      </TouchableOpacity>
    </View>
  );

  const total = cartItems.reduce((sum, item) => sum + Number(item.price || 0), 0);

  return (
    <>
      <View style={styles.header}>
        <Ionicons name="cart" size={28} color="#007bff" />
        <Text style={styles.title}>Your Cart</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading cart...</Text>
        </View>
      ) : cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={64} color="#ccc" />
          <Text style={styles.empty}>Your cart is empty</Text>
          <Text style={styles.emptySubtext}>Start shopping to add items</Text>
        </View>
      ) : (
        <>
          <Text style={styles.itemCount}>
            {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in cart
          </Text>
          
          <FlatList
            data={cartItems}
            keyExtractor={(item, index) => item.barcode + index}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 120 }}
            refreshing={refreshing}
            onRefresh={loadCart}
            showsVerticalScrollIndicator={false}
          />

          <View style={styles.totalContainer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalText}>₹{total.toFixed(2)}</Text>
            </View>
            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={handleCheckout}
            >
              <Ionicons name="arrow-forward" size={20} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.checkoutText}>Proceed to Checkout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Enhanced Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Customer Details</Text>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Customer Name"
                  value={customerName}
                  onChangeText={setCustomerName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Customer Phone"
                  keyboardType="phone-pad"
                  value={customerPhone}
                  onChangeText={setCustomerPhone}
                  maxLength={15}
                />
              </View>

              <Text style={styles.sectionTitle}>Payment Method</Text>
              <View style={styles.paymentOptionsContainer}>
                {paymentOptions.map(renderPaymentOption)}
              </View>

              <View style={styles.orderSummary}>
                <Text style={styles.orderSummaryTitle}>Order Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryText}>Items: {cartItems.length}</Text>
                  <Text style={styles.summaryAmount}>${total.toFixed(2)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={() => setModalVisible(false)}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]} 
                onPress={finalizeSale}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color="white" style={{ marginRight: 8 }} />
                    <Text style={styles.submitBtnText}>Complete Sale</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f8fafc" 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  title: { 
    fontSize: 24, 
    fontWeight: "bold", 
    marginLeft: 12,
    color: '#1a202c'
  },
  itemCount: {
    fontSize: 16,
    color: '#666',
    paddingHorizontal: 20,
    paddingVertical: 8,
    fontWeight: '500'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  empty: { 
    fontSize: 20, 
    fontWeight: '600',
    color: "#666",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
    textAlign: 'center'
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  itemInfo: { 
    flex: 1,
    paddingRight: 12 
  },
  name: { 
    fontSize: 16, 
    fontWeight: "600",
    color: '#1a202c',
    lineHeight: 22
  },
  barcode: { 
    fontSize: 13, 
    color: "#666", 
    marginTop: 4,
    fontFamily: 'monospace'
  },
  price: { 
    fontSize: 18, 
    fontWeight: "bold", 
    marginTop: 6, 
    color: "#007bff" 
  },
  deleteButton: { 
    backgroundColor: "#ef4444", 
    padding: 12, 
    borderRadius: 10,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  totalContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666'
  },
  totalText: { 
    fontSize: 24, 
    fontWeight: "bold", 
    color: "#16a34a" 
  },
  checkoutButton: {
    backgroundColor: "#007bff",
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007bff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  checkoutText: { 
    color: "white", 
    fontSize: 16, 
    fontWeight: "600" 
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: "bold",
    color: '#1a202c'
  },
  closeButton: {
    padding: 4,
  },
  formContainer: {
    padding: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc'
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#1a202c'
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: 12,
    marginTop: 8,
  },
  paymentOptionsContainer: {
    marginBottom: 20,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#fff'
  },
  paymentOptionSelected: {
    borderColor: '#007bff',
    backgroundColor: '#f0f8ff'
  },
  paymentOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentOptionText: {
    fontSize: 16,
    marginLeft: 12,
    color: '#666',
    fontWeight: '500'
  },
  paymentOptionTextSelected: {
    color: '#007bff',
    fontWeight: '600'
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: '#007bff',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007bff',
  },
  orderSummary: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  orderSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  modalActions: { 
    flexDirection: "row", 
    padding: 20,
    gap: 12,
  },
  cancelBtn: { 
    flex: 1,
    backgroundColor: "#6b7280", 
    paddingVertical: 16, 
    borderRadius: 12,
    alignItems: 'center'
  },
  cancelBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  submitBtn: { 
    flex: 2,
    backgroundColor: "#16a34a", 
    paddingVertical: 16, 
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  submitBtnDisabled: {
    backgroundColor: '#9ca3af'
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});