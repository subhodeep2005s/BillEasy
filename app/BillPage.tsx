import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useRef } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ViewShot from "react-native-view-shot"; // ✅ correct typing

export default function BillPage() {
  const { bill } = useLocalSearchParams<{ bill: string }>();
  const parsedBill = bill ? JSON.parse(bill) : null;
  const ViewShotRef = useRef<ViewShot | null>(null); // ✅ explicitly typed ref

  if (!parsedBill) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>No bill data available</Text>
      </SafeAreaView>
    );
  }

  // Capture bill and share
  const shareBill = async () => {
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Sharing not available", "Sharing is not supported on this device.");
        return;
      }

      const uri = await ViewShotRef.current?.capture?.(); // ✅ optional chaining
      if (!uri) {
        Alert.alert("Error", "Failed to capture invoice.");
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: "Share Invoice",
      });
    } catch (error) {
      console.error("Error sharing bill:", error);
      Alert.alert("Error", "Failed to share bill.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <ViewShot ref={ViewShotRef} options={{ format: "png", quality: 1 }}>
          <View style={styles.billCard}>
            {/* Header */}
            <Text style={styles.header}>Invoice</Text>

            <View style={styles.section}>
              <Text style={styles.label}>Customer:</Text>
              <Text style={styles.value}>{parsedBill.customerName}</Text>
            </View>
            <View style={styles.section}>
              <Text style={styles.label}>Phone:</Text>
              <Text style={styles.value}>{parsedBill.customerPhone}</Text>
            </View>
            <View style={styles.section}>
              <Text style={styles.label}>Payment:</Text>
              <Text style={styles.value}>{parsedBill.paymentMode}</Text>
            </View>
            <View style={styles.section}>
              <Text style={styles.label}>Date:</Text>
              <Text style={styles.value}>{parsedBill.date}</Text>
            </View>

            {/* Items */}
            <Text style={styles.subHeader}>Items</Text>
            {parsedBill.items && parsedBill.items.length > 0 ? (
              parsedBill.items.map((item: any, index: number) => (
                <View key={index} style={styles.itemRow}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>${item.price}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyItems}>No items</Text>
            )}

            {/* Total */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${parsedBill.totalAmount}</Text>
            </View>
          </View>
        </ViewShot>

        {/* Share button only */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={shareBill}>
            <Ionicons name="share-social-outline" size={20} color="#fff" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  billCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    margin: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: { fontSize: 28, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  subHeader: { fontSize: 20, fontWeight: "600", marginTop: 20, marginBottom: 10 },
  section: { flexDirection: "row", marginBottom: 8 },
  label: { fontWeight: "bold", width: 100 },
  value: { flex: 1 },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  itemName: { fontSize: 16 },
  itemPrice: { fontSize: 16, fontWeight: "600" },
  emptyItems: { fontSize: 16, color: "#888", marginVertical: 10 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 2,
    borderColor: "#000",
  },
  totalLabel: { fontSize: 18, fontWeight: "bold" },
  totalValue: { fontSize: 18, fontWeight: "bold", color: "#28a745" },
  actions: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 40,
  },
  actionBtn: {
    flexDirection: "row",
    backgroundColor: "#007bff",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  actionText: { color: "#fff", fontWeight: "600", marginLeft: 8 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
