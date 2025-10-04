import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Link, useFocusEffect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Modal from "react-native-modal";
import ProductsList from "../_components/ProductsList";
import SearchBar from "../_components/SearchBar";
// import PagesIcon from "./components/pagesIcon";

const { width } = Dimensions.get("window");

type Product = {
  _id?: string;
  barcode: string;
  name: string;
  price: number;
  stock: number;
  category?: string;
  description?: string;
  createdAt?: string;
};

const apiUrl = "http://192.168.0.103:8080";
export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [isScanningCheckout, setIsScanningCheckout] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [isModalVisible, setModalVisible] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [existingProduct, setExistingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    stock: "",
    description: "",
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  const loadCartCount = async () => {
    try {
      const storedCart = await AsyncStorage.getItem("cart");
      if (storedCart) {
        const cart = JSON.parse(storedCart);
        setCartItemCount(Array.isArray(cart) ? cart.length : 0);
      } else {
        setCartItemCount(0);
      }
    } catch (error) {
      console.error("Error loading cart count:", error);
      setCartItemCount(0);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCartCount();
    }, [])
  );

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    console.log("Searching for:", query);

    if (!query.trim()) {
      setFilteredProducts(products);
      return;
    }

    try {
      const token = await SecureStore.getItemAsync("accessToken");
      if (!token) {
        throw new Error("No access token found");
      }
      const response = await fetch(`${apiUrl}/product/show-product`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productKeywords: query }),
      });

      const result = await response.json();
      console.log("Search result:", result);

      if (response.ok && Array.isArray(result.products)) {
        setFilteredProducts(result.products);
      } else {
        setFilteredProducts([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setFilteredProducts([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = await SecureStore.getItemAsync("accessToken");
      if (!token) {
        throw new Error("No access token found");
      }
      setLoading(true);
      const response = await fetch(`${apiUrl}/product/show-product`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productKeywords: "" }),
      });
      const result = await response.json();

      if (response.ok && Array.isArray(result.products)) {
        const sortedProducts = (result.products as Product[]).sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          } else if (a._id && b._id) {
            return b._id.localeCompare(a._id);
          } else {
            return b.name.localeCompare(a.name);
          }
        });

        setProducts(sortedProducts);
        setFilteredProducts(sortedProducts);
      } else {
        setProducts([]);
        setFilteredProducts([]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    loadCartCount();
  }, []);

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <View style={styles.permissionContent}>
          <Ionicons name="camera-outline" size={64} color="#6b7280" />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionMessage}>
            We need camera access to scan product barcodes
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Ionicons
              name="camera"
              size={20}
              color="white"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.permissionButtonText}>Grant Camera Access</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleAddBarcodeScanned = async ({ data }: { data: string }) => {
    setIsScanning(false);
    setBarcode(data);

    // Check if product exists
    const product = products.find((p) => p.barcode === data);
    if (product) {
      setExistingProduct(product);
      setFormData({
        name: product.name,
        price: product.price.toString(),
        stock: "",
        description: product.description || "",
      });
    } else {
      setExistingProduct(null);
      setFormData({ name: "", price: "", stock: "", description: "" });
    }

    setModalVisible(true);
  };

  const handleCheckoutBarcodeScanned = ({ data }: { data: string }) => {
    const product = products.find((p) => p.barcode === data);
    if (product) {
      setScannedProduct(product);
      setBarcode(data);
      setIsScanningCheckout(false);
      setModalVisible(true);
    } else {
      Alert.alert("Product Not Found", "No product found with this barcode");
      setIsScanningCheckout(false);
    }
  };

  const handleAddSubmit = async () => {
    if (existingProduct) {
      // Update existing product (only stock and price)
      if (!formData.price.trim() || !formData.stock.trim()) {
        Alert.alert("Validation Error", "Please fill price and stock fields");
        return;
      }

      try {
        const token = await SecureStore.getItemAsync("accessToken");
        if (!token) {
          throw new Error("No access token found");
        }
        console.log("Using token:", token);

        const response = await fetch(
          "https://erp-pos-backend.onrender.com/product/add-product",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              barcode,
              name: existingProduct.name,
              price: Number(formData.price),
              quantity: Number(formData.stock),
            }),
          }
        );
        const result = await response.json();
        if (response.ok) {
          Alert.alert("Success", "Product stock updated successfully!");
          fetchProducts();
        } else {
          Alert.alert("Error", result.message || "Failed to update product");
        }
      } catch (error) {
        console.error("Update product error:", error);
        Alert.alert("Network Error", "Failed to connect to server");
      } finally {
        resetModal();
      }
    } else {
      // Add new product (all fields required)
      if (
        !formData.name.trim() ||
        !formData.price.trim() ||
        !formData.stock.trim()
      ) {
        Alert.alert("Validation Error", "Please fill all required fields");
        return;
      }

      try {
        const token = await SecureStore.getItemAsync("accessToken");
        if (!token) {
          throw new Error("No access token found");
        }
        const response = await fetch(
          "https://erp-pos-backend.onrender.com/product/add-product",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              barcode,
              name: formData.name.trim(),
              price: Number(formData.price),
              quantity: Number(formData.stock),
              description: formData.description.trim(),
            }),
          }
        );
        const result = await response.json();
        if (response.ok) {
          Alert.alert(
            "Success",
            result.message || "Product added successfully!"
          );
          fetchProducts();
        } else {
          Alert.alert("Error", result.message || "Failed to add product");
        }
      } catch (error) {
        console.error("Add product error:", error);
        Alert.alert("Network Error", "Failed to connect to server");
      } finally {
        resetModal();
      }
    }
  };

  const handleSell = async () => {
    if (!barcode || !scannedProduct) return;

    try {
      const token = await SecureStore.getItemAsync("accessToken");
      const response = await fetch(
        "https://erp-pos-backend.onrender.com/product/checkout",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ barcode }),
        }
      );
      const result = await response.json();

      if (response.ok) {
        const storedCart = await AsyncStorage.getItem("cart");
        let cart = storedCart ? JSON.parse(storedCart) : [];

        cart.push({
          barcode: scannedProduct.barcode,
          name: scannedProduct.name,
          price: scannedProduct.price,
        });

        await AsyncStorage.setItem("cart", JSON.stringify(cart));
        setCartItemCount(cart.length);

        Alert.alert("Success", "Product added to cart!");
        fetchProducts();
      } else {
        Alert.alert("Error", result.message || "Failed to checkout product");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      Alert.alert("Network Error", "Failed to connect to server");
    } finally {
      resetModal();
    }
  };

  const resetModal = () => {
    setModalVisible(false);
    setScannedProduct(null);
    setExistingProduct(null);
    setBarcode("");
    setFormData({ name: "", price: "", stock: "", description: "" });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>ERP POS System</Text>
          <Text style={styles.headerSubtitle}>Inventory Management</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.addProductIconButton}
            onPress={() => setIsScanning(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={24} color="#3b82f6" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.cartContainer}>
            <Link href="./cart" asChild>
              <TouchableOpacity style={styles.cartIcon}>
                <Ionicons name="cart-outline" size={24} color="#1f2937" />
                {cartItemCount > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>
                      {cartItemCount > 99 ? "99+" : cartItemCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </Link>
          </TouchableOpacity>
        </View>
      </View>

      {/* <PagesIcon/> */}

      <SearchBar
        value={searchQuery}
        onChange={handleSearch}
        placeholder="Search by name or barcode..."
      />

      <ProductsList
        products={searchQuery.trim() ? filteredProducts : products}
        loading={loading}
      />

      {!isScanning && !isScanningCheckout && (
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.checkoutButton]}
            onPress={() => setIsScanningCheckout(true)}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="scan-outline" size={24} color="white" />
              <Text style={styles.buttonText}>Scan Item</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {(isScanning || isScanningCheckout) && (
        <View style={styles.cameraContainer}>
          <CameraView
            style={StyleSheet.absoluteFill}
            onBarcodeScanned={
              isScanning
                ? handleAddBarcodeScanned
                : handleCheckoutBarcodeScanned
            }
            barcodeScannerSettings={{
              barcodeTypes: [
                "qr",
                "ean13",
                "code128",
                "ean8",
                "code39",
                "code93",
                "codabar",
                "datamatrix",
                "pdf417",
              ],
            }}
          />

          <View style={styles.cameraOverlay}>
            <View style={styles.scanArea}>
              <View style={styles.scanFrame} />
              <Text style={styles.scanInstruction}>
                {isScanning
                  ? "Scan barcode to add new product"
                  : "Scan product barcode to add to cart"}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.cancelScanButton}
              onPress={() => {
                setIsScanning(false);
                setIsScanningCheckout(false);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="close-circle" size={28} color="white" />
              <Text style={styles.cancelScanText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Modal
        isVisible={isModalVisible}
        onBackdropPress={resetModal}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        backdropOpacity={0.5}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {scannedProduct
                  ? "Confirm Sale"
                  : existingProduct
                  ? "Update Product Stock"
                  : "Add New Product"}
              </Text>
              <TouchableOpacity
                onPress={resetModal}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {scannedProduct ? (
                <View style={styles.productDetails}>
                  <View style={styles.productHeader}>
                    <Ionicons name="cube-outline" size={32} color="#3b82f6" />
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>
                        {scannedProduct.name}
                      </Text>
                      <Text style={styles.productBarcode}>
                        #{scannedProduct.barcode}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.productStats}>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Price</Text>
                      <Text style={styles.statValue}>
                        ₹{scannedProduct.price}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Stock</Text>
                      <Text style={styles.statValue}>
                        {scannedProduct.stock}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={handleSell}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="cart"
                      size={20}
                      color="white"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.confirmButtonText}>Add to Cart</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.addProductForm}>
                  <View style={styles.barcodeDisplay}>
                    <Ionicons
                      name="barcode-outline"
                      size={24}
                      color="#3b82f6"
                    />
                    <Text style={styles.barcodeText}>{barcode}</Text>
                  </View>

                  {existingProduct && (
                    <View style={styles.existingProductBanner}>
                      <Ionicons
                        name="information-circle"
                        size={20}
                        color="#3b82f6"
                      />
                      <Text style={styles.existingProductText}>
                        Product exists: {existingProduct.name}
                      </Text>
                    </View>
                  )}

                  {!existingProduct && (
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Product Name *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter product name"
                        value={formData.name}
                        onChangeText={(text) =>
                          setFormData({ ...formData, name: text })
                        }
                        autoCapitalize="words"
                      />
                    </View>
                  )}

                  <View style={styles.inputRow}>
                    <View
                      style={[
                        styles.inputContainer,
                        { flex: 1, marginRight: 8 },
                      ]}
                    >
                      <Text style={styles.inputLabel}>Price (₹) *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="0.00"
                        keyboardType="numeric"
                        value={formData.price}
                        onChangeText={(text) =>
                          setFormData({ ...formData, price: text })
                        }
                      />
                    </View>

                    <View
                      style={[
                        styles.inputContainer,
                        { flex: 1, marginLeft: 8 },
                      ]}
                    >
                      <Text style={styles.inputLabel}>Stock *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="0"
                        keyboardType="numeric"
                        value={formData.stock}
                        onChangeText={(text) =>
                          setFormData({ ...formData, stock: text })
                        }
                      />
                    </View>
                  </View>

                  {!existingProduct && (
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Description</Text>
                      <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Enter product description (optional)"
                        value={formData.description}
                        onChangeText={(text) =>
                          setFormData({ ...formData, description: text })
                        }
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                      />
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleAddSubmit}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="white"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.saveButtonText}>
                      {existingProduct ? "Update Stock" : "Save Product"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  permissionContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  permissionContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginTop: 24,
    marginBottom: 12,
    textAlign: "center",
  },
  permissionMessage: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: "#3b82f6",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  permissionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  addProductIconButton: {
    backgroundColor: "#eff6ff",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  cartContainer: {
    position: "relative",
  },
  cartIcon: {
    backgroundColor: "#f3f4f6",
    padding: 12,
    borderRadius: 12,
    position: "relative",
  },
  cartBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#ef4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  cartBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },

  actionButtonsContainer: {
    position: "absolute",
    bottom: 90,
    left: 120,
    right: 120,
  },
  actionButton: {
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  checkoutButton: {
    backgroundColor: "#10b981",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },

  cameraContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "space-between",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  scanArea: {
    alignItems: "center",
    marginTop: 100,
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: "white",
    borderRadius: 20,
    backgroundColor: "transparent",
  },
  scanInstruction: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
    fontWeight: "500",
  },
  cancelScanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignSelf: "center",
  },
  cancelScanText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },

  modalContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    flex: 1,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 24,
  },

  productDetails: {
    alignItems: "center",
  },
  productHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  productInfo: {
    marginLeft: 16,
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  productBarcode: {
    fontSize: 14,
    color: "#6b7280",
    fontFamily: "monospace",
  },
  productStats: {
    flexDirection: "row",
    width: "100%",
    marginBottom: 24,
    gap: 16,
  },
  statItem: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  confirmButton: {
    backgroundColor: "#10b981",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: "100%",
  },
  confirmButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },

  addProductForm: {
    width: "100%",
  },
  barcodeDisplay: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f8ff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  barcodeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3b82f6",
    marginLeft: 12,
    fontFamily: "monospace",
  },
  existingProductBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  existingProductText: {
    fontSize: 14,
    color: "#1e40af",
    marginLeft: 8,
    flex: 1,
    fontWeight: "500",
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#f9fafb",
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  saveButton: {
    backgroundColor: "#3b82f6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
