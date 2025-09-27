import Ionicons from "@expo/vector-icons/Ionicons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Link, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Modal from "react-native-modal";
import ProductsList from "./components/ProductsList";

type Product = {
  _id?: string;
  barcode: string;
  name: string;
  price: number;
  stock: number;
  category?: string;
};

export default function App() {
  const router = useRouter(); // ✅ for navigation
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [isScanningCheckout, setIsScanningCheckout] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [isModalVisible, setModalVisible] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    stock: "",
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "https://erp-pos-backend.onrender.com/products/all"
      );
      const data = await response.json();
      if (Array.isArray(data)) setProducts(data);
      else setProducts([]);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to use the camera
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ✅ Add Product Scanning
  const handleAddBarcodeScanned = ({ data }: { data: string }) => {
    setIsScanning(false); // close camera
    setBarcode(data);
    setModalVisible(true); // open modal for product form
  };

  // ✅ Checkout Scanning
  const handleCheckoutBarcodeScanned = ({ data }: { data: string }) => {
    const product = products.find((p) => p.barcode === data);
    if (product) {
      setScannedProduct(product);
      setBarcode(data);
      setIsScanningCheckout(false);
      setModalVisible(true); // open modal for "Sell"
    } else {
      Alert.alert("Error", "Product not found");
      setIsScanningCheckout(false);
    }
  };

  // ✅ Add Product Submit
  const handleAddSubmit = async () => {
    try {
      const response = await fetch(
        "https://erp-pos-backend.onrender.com/add-product",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            barcode,
            name: formData.name,
            price: Number(formData.price),
            quantity: Number(formData.stock),
          }),
        }
      );

      const result = await response.json();
      if (response.ok) {
        Alert.alert("Success", result.message || "Product added!");
        fetchProducts();
      } else {
        Alert.alert("Error", result.message || "Failed to add product");
      }
    } catch (error) {
      console.error("Add product error:", error);
      Alert.alert("Error", "Failed to add product");
    } finally {
      setModalVisible(false);
      setFormData({ name: "", price: "", stock: "" });
      setBarcode("");
    }
  };

  // ✅ Checkout Submit
  const handleSell = async () => {
    if (!barcode) return;

    try {
      const response = await fetch(
        "https://erp-pos-backend.onrender.com/checkout",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ barcode }),
        }
      );
      const result = await response.json();

      if (response.ok) {
        Alert.alert("Success", result.message || "Product sold!");
        fetchProducts();
      } else {
        Alert.alert("Error", result.message || "Failed to checkout product");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      Alert.alert("Error", "Failed to checkout product");
    } finally {
      setModalVisible(false);
      setScannedProduct(null);
      setBarcode("");
    }
  };

  return (
    <View style={styles.container}>
      {/* ✅ Cart Icon in Top-Left */}
      <TouchableOpacity style={styles.cartIcon}>
        <Link href="./cart">
          <Ionicons name="cart-outline" size={28} color="black" />
        </Link>
      </TouchableOpacity>

      <ProductsList products={products} loading={loading} />

      {!isScanning && !isScanningCheckout && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => setIsScanning(true)}
          >
            <Ionicons name="barcode-outline" size={28} color="white" />
            <Text style={styles.scanText}>Add Product</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={() => setIsScanningCheckout(true)}
          >
            <Ionicons name="scan" size={28} color="white" />
            <Text style={styles.scanText}>Checkout</Text>
          </TouchableOpacity>
        </View>
      )}

      {isScanning && (
        <View style={{ flex: 1 }}>
          <CameraView
            style={StyleSheet.absoluteFill}
            onBarcodeScanned={handleAddBarcodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ["qr", "ean13", "code128"] }}
          />
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setIsScanning(false)}
          >
            <Ionicons name="close" size={28} color="white" />
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {isScanningCheckout && (
        <View style={{ flex: 1 }}>
          <CameraView
            style={StyleSheet.absoluteFill}
            onBarcodeScanned={handleCheckoutBarcodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ["qr", "ean13", "code128"] }}
          />
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setIsScanningCheckout(false)}
          >
            <Ionicons name="close" size={28} color="white" />
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal (used for both Add and Checkout) */}
      <Modal
        isVisible={isModalVisible}
        onBackdropPress={() => setModalVisible(false)}
      >
        <View style={styles.modalContent}>
          {scannedProduct ? (
            <>
              <Text style={styles.modalTitle}>Confirm Sale</Text>
              <Text style={styles.label}>Name: {scannedProduct.name}</Text>
              <Text style={styles.label}>Barcode: {scannedProduct.barcode}</Text>
              <Text style={styles.label}>Price: {scannedProduct.price}</Text>
              <Text style={styles.label}>Stock: {scannedProduct.stock}</Text>
              <TouchableOpacity style={styles.sellButton} onPress={handleSell}>
                <Text style={styles.sellText}>Sell</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.modalTitle}>Add Product</Text>
              <Text style={styles.label}>Barcode: {barcode}</Text>
              <TextInput
                style={styles.input}
                placeholder="Name"
                value={formData.name}
                onChangeText={(text) =>
                  setFormData({ ...formData, name: text })
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Price"
                keyboardType="numeric"
                value={formData.price}
                onChangeText={(text) =>
                  setFormData({ ...formData, price: text })
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Stock"
                keyboardType="numeric"
                value={formData.stock}
                onChangeText={(text) =>
                  setFormData({ ...formData, stock: text })
                }
              />
              <TouchableOpacity
                style={styles.sellButton}
                onPress={handleAddSubmit}
              >
                <Text style={styles.sellText}>Save Product</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  cartIcon: {
    position: "absolute",
    top: 50,
    right: 40,
    zIndex: 10,
    backgroundColor: "white",
    padding: 8,
    borderRadius: 50,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  message: { fontSize: 16, marginBottom: 12, textAlign: "center" },
  button: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 8,
    alignSelf: "center",
  },
  buttonText: { color: "white", fontSize: 16 },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
  },
  scanButton: {
    backgroundColor: "#007bff",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
  },
  checkoutButton: {
    backgroundColor: "#28a745",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
  },
  scanText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  camera: { flex: 1, width: "100%" },
  cancelButton: {
    position: "absolute",
    top: 50,
    left: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  cancelText: {
    color: "white",
    fontSize: 16,
    marginLeft: 6,
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 16 },
  label: { fontSize: 16, marginVertical: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginVertical: 6,
  },
  sellButton: {
    backgroundColor: "#28a745",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
    marginTop: 16,
    alignItems: "center",
  },
  sellText: { color: "white", fontSize: 18, fontWeight: "bold" },
});
