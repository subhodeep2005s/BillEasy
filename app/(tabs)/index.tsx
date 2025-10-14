import { apiUrl } from "@/config";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Link, useFocusEffect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Modal from "react-native-modal";
import { SafeAreaView } from "react-native-safe-area-context";
import ProductsList from "../_components/ProductsList";
import SearchBar from "../_components/SearchBar";

const { width } = Dimensions.get("window");

type Product = {
  _id?: string;
  barcode: string;
  name: string;
  price: number | string;
  stock: number | string;
  category?: string;
  description?: string;
  createdAt?: string;
  productImage?: string;
  brand?: string;
};

if (!apiUrl) {
  console.error("API URL is not set. Please check your environment variables.");
}

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [isScanningCheckout, setIsScanningCheckout] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [isModalVisible, setModalVisible] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [existingProduct, setExistingProduct] = useState<Product | null>(null);
  const [fabAnimation] = useState(new Animated.Value(0));

  const [productForm, setProductForm] = useState({
    name: "",
    price: "",
    stock: "",
    description: "",
    category: "",
    brand: "",
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  // Animate FAB on mount
  useEffect(() => {
    Animated.spring(fabAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  }, []);

  const updateProductForm = (field: string, value: string) => {
    setProductForm((prev) => ({ ...prev, [field]: value }));
  };

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

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setFilteredProducts(products);
      return;
    }

    const lowercaseQuery = query.toLowerCase();
    const filtered = products.filter(
      (product) =>
        product.name.toLowerCase().includes(lowercaseQuery) ||
        product.barcode.includes(query)
    );

    setFilteredProducts(filtered);
  };

  const fetchProducts = async () => {
    try {
      const token = await SecureStore.getItemAsync("accessToken");

      if (!token) {
        console.log("No access token found");
        Alert.alert("Authentication Error", "Please login again");
        setLoading(false);
        return;
      }

      setLoading(true);

      const response = await fetch(`${apiUrl}/product/show-product/*`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (response.ok && Array.isArray(result.products)) {
        const normalizedProducts = result.products.map((product: any) => ({
          ...product,
          price:
            typeof product.price === "string"
              ? parseFloat(product.price)
              : product.price,
          stock:
            typeof product.stock === "string"
              ? parseInt(product.stock, 10)
              : product.stock,
        }));

        const sortedProducts = normalizedProducts.sort(
          (a: Product, b: Product) => {
            if (a.createdAt && b.createdAt) {
              return (
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
              );
            } else if (a._id && b._id) {
              return b._id.localeCompare(a._id);
            } else {
              return b.name.localeCompare(a.name);
            }
          }
        );

        setProducts(sortedProducts);
        setFilteredProducts(sortedProducts);
      } else {
        setProducts([]);
        setFilteredProducts([]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      Alert.alert("Error", "Failed to fetch products. Please try again.");
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      const token = await SecureStore.getItemAsync("accessToken");

      if (token) {
        await fetchProducts();
      } else {
        setLoading(false);
      }

      await loadCartCount();
    };

    initializeApp();
  }, []);

  const handleAddToCart = async (product: Product) => {
    try {
      const token = await SecureStore.getItemAsync("accessToken");
      if (!token) {
        Alert.alert("Authentication Error", "Please login again");
        return;
      }

      const response = await fetch(`${apiUrl}/product/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ barcode: product.barcode }),
      });

      console.log(product.barcode);

      const result = await response.json();

      if (response.ok) {
        const storedCart = await AsyncStorage.getItem("cart");
        let cart = storedCart ? JSON.parse(storedCart) : [];

        cart.push({
          barcode: product.barcode,
          name: product.name,
          price: product.price,
        });

        await AsyncStorage.setItem("cart", JSON.stringify(cart));
        setCartItemCount(cart.length);

        Alert.alert("✓ Added to Cart", `${product.name} added successfully!`, [
          { text: "OK", style: "default" },
        ]);
        await fetchProducts();
      } else {
        Alert.alert("Error", result.message || "Failed to add to cart");
      }
    } catch (error) {
      console.error("Add to cart error:", error);
      Alert.alert("Network Error", "Failed to connect to server");
    }
  };

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer} edges={["top"]}>
        <StatusBar style="dark" backgroundColor="#ffffff" />
        <View style={styles.permissionContent}>
          <View style={styles.permissionIconContainer}>
            <Ionicons name="camera-outline" size={80} color="#3b82f6" />
          </View>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionMessage}>
            We need camera permission to scan product barcodes for quick
            inventory management
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
            activeOpacity={0.8}
          >
            <Ionicons name="camera" size={22} color="white" />
            <Text style={styles.permissionButtonText}>Grant Camera Access</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleAddBarcodeScanned = async ({ data }: { data: string }) => {
    setIsScanning(false);
    setBarcode(data);

    const product = products.find((p) => p.barcode === data);
    if (product) {
      setExistingProduct(product);
      setProductForm({
        name: product.name,
        price: product.price.toString(),
        stock: "",
        description: product.description || "",
        category: product.category || "",
        brand: product.brand || "",
      });
    } else {
      setExistingProduct(null);
      setProductForm({
        name: "",
        price: "",
        stock: "",
        description: "",
        category: "",
        brand: "",
      });
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
      if (!productForm.price.trim() || !productForm.stock.trim()) {
        Alert.alert("Validation Error", "Please fill price and stock fields");
        return;
      }

      try {
        const token = await SecureStore.getItemAsync("accessToken");

        if (!token) {
          Alert.alert("Authentication Error", "Please login again");
          return;
        }

        const requestBody = {
          barcode: barcode,
          name: existingProduct.name,
          price: parseFloat(productForm.price),
          quantity: parseInt(productForm.stock, 10),
          productImage:
            existingProduct.productImage || "https://via.placeholder.com/150",
          category: existingProduct.category || "General",
          brand: existingProduct.brand || "Generic",
        };

        const response = await fetch(`${apiUrl}/product/add-product`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        });

        const result = await response.json();

        if (response.ok) {
          Alert.alert("Success", "Product stock updated successfully!");
          await fetchProducts();
        } else {
          Alert.alert("Error", result.message || "Failed to update product");
        }
      } catch (error) {
        console.error("Update error:", error);
        Alert.alert("Network Error", "Failed to connect to server");
      } finally {
        resetModal();
      }
    } else {
      if (
        !productForm.name.trim() ||
        !productForm.price.trim() ||
        !productForm.stock.trim()
      ) {
        Alert.alert("Validation Error", "Please fill all required fields");
        return;
      }

      try {
        const token = await SecureStore.getItemAsync("accessToken");

        if (!token) {
          Alert.alert("Authentication Error", "Please login again");
          return;
        }

        const requestBody = {
          barcode: barcode,
          name: productForm.name.trim(),
          price: parseFloat(productForm.price),
          quantity: parseInt(productForm.stock, 10),
          productImage: "https://via.placeholder.com/150",
          category: productForm.category?.trim() || "General",
          brand: productForm.brand?.trim() || "Generic",
        };

        const response = await fetch(`${apiUrl}/product/add-product`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        });

        const result = await response.json();

        if (response.ok) {
          Alert.alert(
            "Success",
            result.message || "Product added successfully!"
          );
          await fetchProducts();
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
      if (!token) {
        Alert.alert("Authentication Error", "Please login again");
        return;
      }

      const response = await fetch(`${apiUrl}/product/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ barcode }),
      });
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
        await fetchProducts();
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
    setProductForm({
      name: "",
      price: "",
      stock: "",
      description: "",
      category: "",
      brand: "",
    });
  };

  const fabScale = fabAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="dark" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <Ionicons name="storefront" size={28} color="#3b82f6" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>ERP POS</Text>
            <Text style={styles.headerSubtitle}>Inventory System</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.addProductIconButton}
            onPress={() => setIsScanning(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle" size={26} color="#3b82f6" />
          </TouchableOpacity>

          <Link href="./cart" asChild>
            <TouchableOpacity style={styles.cartButton} activeOpacity={0.7}>
              <Ionicons name="cart" size={24} color="#1f2937" />
              {cartItemCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>
                    {cartItemCount > 99 ? "99+" : cartItemCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </Link>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Search products by name or barcode..."
        />
      </View>

      {/* Products List */}
      <ProductsList
        products={searchQuery.trim() ? filteredProducts : products}
        loading={loading}
        onAddToCart={handleAddToCart}
      />

      {/* Floating Scan Button */}
      {!isScanning && !isScanningCheckout && (
        <Animated.View
          style={[styles.fabContainer, { transform: [{ scale: fabScale }] }]}
        >
          <TouchableOpacity
            style={styles.fab}
            onPress={() => setIsScanningCheckout(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="scan" size={30} color="white" />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Camera Scanner */}
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
            <View style={styles.scanHeader}>
              <Text style={styles.scanTitle}>
                {isScanning ? "Add Product" : "Scan to Cart"}
              </Text>
              <Text style={styles.scanSubtitle}>
                {isScanning
                  ? "Scan barcode to add new product"
                  : "Scan product barcode to add to cart"}
              </Text>
            </View>

            <View style={styles.scanArea}>
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.cornerTopLeft]} />
                <View style={[styles.corner, styles.cornerTopRight]} />
                <View style={[styles.corner, styles.cornerBottomLeft]} />
                <View style={[styles.corner, styles.cornerBottomRight]} />
              </View>
            </View>

            <TouchableOpacity
              style={styles.cancelScanButton}
              onPress={() => {
                setIsScanning(false);
                setIsScanningCheckout(false);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="close-circle" size={24} color="white" />
              <Text style={styles.cancelScanText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Product Modal */}
      <Modal
        isVisible={isModalVisible}
        onBackdropPress={resetModal}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        backdropOpacity={0.6}
        style={styles.modal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalIconContainer}>
                  <Ionicons
                    name={
                      scannedProduct
                        ? "cart"
                        : existingProduct
                        ? "refresh"
                        : "add-circle"
                    }
                    size={24}
                    color="#3b82f6"
                  />
                </View>
                <Text style={styles.modalTitle}>
                  {scannedProduct
                    ? "Add to Cart"
                    : existingProduct
                    ? "Update Stock"
                    : "New Product"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={resetModal}
                style={styles.modalCloseButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={26} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              {scannedProduct ? (
                <View style={styles.productDetails}>
                  <View style={styles.productCard}>
                    <View style={styles.productHeader}>
                      <View style={styles.productIconLarge}>
                        <Ionicons name="cube" size={36} color="#3b82f6" />
                      </View>
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
                      <View style={styles.statCard}>
                        <Ionicons name="pricetag" size={20} color="#10b981" />
                        <Text style={styles.statLabel}>Price</Text>
                        <Text style={styles.statValue}>
                          ₹{scannedProduct.price}
                        </Text>
                      </View>
                      <View style={styles.statCard}>
                        <Ionicons name="layers" size={20} color="#3b82f6" />
                        <Text style={styles.statLabel}>Stock</Text>
                        <Text style={styles.statValue}>
                          {scannedProduct.stock}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={handleSell}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="cart" size={22} color="white" />
                    <Text style={styles.confirmButtonText}>Add to Cart</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.addProductForm}>
                  <View style={styles.barcodeDisplay}>
                    <Ionicons name="barcode" size={28} color="#3b82f6" />
                    <View style={styles.barcodeInfo}>
                      <Text style={styles.barcodeLabel}>Barcode</Text>
                      <Text style={styles.barcodeText}>{barcode}</Text>
                    </View>
                  </View>

                  {existingProduct && (
                    <View style={styles.existingProductBanner}>
                      <Ionicons
                        name="information-circle"
                        size={22}
                        color="#3b82f6"
                      />
                      <View style={styles.bannerContent}>
                        <Text style={styles.bannerTitle}>Product Found</Text>
                        <Text style={styles.bannerText}>
                          {existingProduct.name}
                        </Text>
                      </View>
                    </View>
                  )}

                  {!existingProduct && (
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>
                        Product Name <Text style={styles.required}>*</Text>
                      </Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter product name"
                        placeholderTextColor="#9ca3af"
                        value={productForm.name}
                        onChangeText={(text) => updateProductForm("name", text)}
                        autoCapitalize="words"
                      />
                    </View>
                  )}

                  <View style={styles.inputRow}>
                    <View style={styles.inputHalf}>
                      <Text style={styles.inputLabel}>
                        Price (₹) <Text style={styles.required}>*</Text>
                      </Text>
                      <TextInput
                        style={styles.input}
                        placeholder="0.00"
                        placeholderTextColor="#9ca3af"
                        keyboardType="decimal-pad"
                        value={productForm.price}
                        onChangeText={(text) =>
                          updateProductForm("price", text)
                        }
                      />
                    </View>

                    <View style={styles.inputHalf}>
                      <Text style={styles.inputLabel}>
                        Stock <Text style={styles.required}>*</Text>
                      </Text>
                      <TextInput
                        style={styles.input}
                        placeholder="0"
                        placeholderTextColor="#9ca3af"
                        keyboardType="number-pad"
                        value={productForm.stock}
                        onChangeText={(text) =>
                          updateProductForm("stock", text)
                        }
                      />
                    </View>
                  </View>

                  {!existingProduct && (
                    <>
                      <View style={styles.inputRow}>
                        <View style={styles.inputHalf}>
                          <Text style={styles.inputLabel}>Category</Text>
                          <TextInput
                            style={styles.input}
                            placeholder="e.g., Electronics"
                            placeholderTextColor="#9ca3af"
                            value={productForm.category}
                            onChangeText={(text) =>
                              updateProductForm("category", text)
                            }
                          />
                        </View>

                        <View style={styles.inputHalf}>
                          <Text style={styles.inputLabel}>Brand</Text>
                          <TextInput
                            style={styles.input}
                            placeholder="e.g., Samsung"
                            placeholderTextColor="#9ca3af"
                            value={productForm.brand}
                            onChangeText={(text) =>
                              updateProductForm("brand", text)
                            }
                          />
                        </View>
                      </View>

                      <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>
                          Description (Optional)
                        </Text>
                        <TextInput
                          style={[styles.input, styles.textArea]}
                          placeholder="Enter product description..."
                          placeholderTextColor="#9ca3af"
                          value={productForm.description}
                          onChangeText={(text) =>
                            updateProductForm("description", text)
                          }
                          multiline
                          numberOfLines={4}
                          textAlignVertical="top"
                        />
                      </View>
                    </>
                  )}

                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleAddSubmit}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="checkmark-circle" size={22} color="white" />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  // Permission Screen
  permissionContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  permissionContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  permissionIconContainer: {
    width: 140,
    height: 140,
    backgroundColor: "#eff6ff",
    borderRadius: 70,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
    borderWidth: 3,
    borderColor: "#bfdbfe",
  },
  permissionTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 12,
    textAlign: "center",
  },
  permissionMessage: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  permissionButton: {
    backgroundColor: "#3b82f6",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    gap: 10,
  },
  permissionButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "700",
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoContainer: {
    width: 48,
    height: 48,
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTextContainer: {
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
    fontWeight: "500",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  addProductIconButton: {
    padding: 8,
  },
  cartButton: {
    position: "relative",
    backgroundColor: "#f3f4f6",
    padding: 12,
    borderRadius: 12,
  },
  cartBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#ef4444",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  cartBadgeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "700",
  },

  // Search
  searchContainer: {
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },

  // FAB
  fabContainer: {
    position: "absolute",
    bottom: 70,
    left: "41%",
    transform: [{ translateX: -50 }],
    zIndex: 100,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#10b981",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },

  // Camera
  cameraContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: "#000",
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "space-between",
  },
  scanHeader: {
    paddingTop: 60,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  scanTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "white",
    marginBottom: 8,
  },
  scanSubtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
  },
  scanArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  scanFrame: {
    width: 280,
    height: 280,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: "#10b981",
    borderWidth: 4,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopLeftRadius: 12,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderTopRightRadius: 12,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomLeftRadius: 12,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomRightRadius: 12,
  },
  cancelScanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginHorizontal: 40,
    marginBottom: 60,
    gap: 10,
  },
  cancelScanText: {
    color: "white",
    fontSize: 17,
    fontWeight: "700",
  },

  // Modal
  modal: {
    margin: 0,
    justifyContent: "flex-end",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  modalIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },

  // Product Details (for checkout)
  productDetails: {
    gap: 20,
  },
  productCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  productHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 16,
  },
  productIconLarge: {
    width: 60,
    height: 60,
    backgroundColor: "#eff6ff",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 6,
    lineHeight: 24,
  },
  productBarcode: {
    fontSize: 14,
    color: "#6b7280",
    fontFamily: "monospace",
  },
  productStats: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    gap: 8,
  },
  statLabel: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "600",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  confirmButton: {
    backgroundColor: "#10b981",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 16,
    gap: 10,
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  confirmButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "700",
  },

  // Add Product Form
  addProductForm: {
    gap: 20,
  },
  barcodeDisplay: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    padding: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#bfdbfe",
    gap: 16,
  },
  barcodeInfo: {
    flex: 1,
  },
  barcodeLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600",
    marginBottom: 4,
  },
  barcodeText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#3b82f6",
    fontFamily: "monospace",
  },
  existingProductBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#eff6ff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    gap: 12,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e40af",
    marginBottom: 4,
  },
  bannerText: {
    fontSize: 15,
    color: "#3b82f6",
    fontWeight: "600",
  },
  inputContainer: {
    gap: 8,
  },
  inputRow: {
    flexDirection: "row",
    gap: 12,
  },
  inputHalf: {
    flex: 1,
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  required: {
    color: "#ef4444",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1f2937",
    backgroundColor: "#f9fafb",
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
    textAlignVertical: "top",
  },
  saveButton: {
    backgroundColor: "#3b82f6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 16,
    gap: 10,
    marginTop: 8,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "700",
  },
});
