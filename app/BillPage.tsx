import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useNavigation } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useLayoutEffect, useRef } from "react";
import { Alert, Dimensions, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ViewShot from "react-native-view-shot";

const { width } = Dimensions.get('window');

export default function BillPage() {

  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);
  const { bill } = useLocalSearchParams<{ bill: string }>();
  const parsedBill = bill ? JSON.parse(bill) : null;
  const ViewShotRef = useRef<ViewShot | null>(null);

  if (!parsedBill) {
    return (
      <>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <View style={styles.emptyContainer}>
          <Ionicons name="document-outline" size={80} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No Bill Data</Text>
          <Text style={styles.emptySubtitle}>Unable to load invoice information</Text>
        </View>
      </>
    );
  }

  const shareBill = async () => {
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Sharing not available", "Sharing is not supported on this device.");
        return;
      }

      const uri = await ViewShotRef.current?.capture?.();
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
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      {/* Header */}
      <View style={styles.pageHeader}>
        <View style={styles.headerContent}>
          <Ionicons name="receipt-outline" size={28} color="#3b82f6" />
          <Text style={styles.pageTitle}>Invoice Generated</Text>
        </View>
        <Text style={styles.pageSubtitle}>Transaction completed successfully</Text>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <ViewShot ref={ViewShotRef} options={{ format: "png", quality: 1 }}>
          <View style={styles.billCard}>
            {/* Invoice Header */}
            <View style={styles.invoiceHeader}>
              <View style={styles.companyInfo}>
                <Text style={styles.companyName}>ERP POS System</Text>
                <Text style={styles.companyTagline}>Point of Sale Solution</Text>
              </View>
              <View style={styles.invoiceBadge}>
                <Text style={styles.invoiceText}>INVOICE</Text>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Customer Information */}
            <View style={styles.customerSection}>
              <Text style={styles.sectionTitle}>Customer Information</Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <View style={styles.infoIcon}>
                    <Ionicons name="person" size={16} color="#3b82f6" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Customer Name</Text>
                    <Text style={styles.infoValue}>{parsedBill.customerName}</Text>
                  </View>
                </View>

                <View style={styles.infoItem}>
                  <View style={styles.infoIcon}>
                    <Ionicons name="call" size={16} color="#10b981" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Phone Number</Text>
                    <Text style={styles.infoValue}>{parsedBill.customerPhone}</Text>
                  </View>
                </View>

                <View style={styles.infoItem}>
                  <View style={styles.infoIcon}>
                    <Ionicons name="card" size={16} color="#f59e0b" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Payment Method</Text>
                    <Text style={styles.infoValue}>{parsedBill.paymentMode}</Text>
                  </View>
                </View>

                <View style={styles.infoItem}>
                  <View style={styles.infoIcon}>
                    <Ionicons name="calendar" size={16} color="#8b5cf6" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Transaction Date</Text>
                    <Text style={styles.infoValue}>{parsedBill.date}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Items Section */}
            <View style={styles.itemsSection}>
              <Text style={styles.sectionTitle}>Items Purchased</Text>
              
              {parsedBill.items && parsedBill.items.length > 0 ? (
                <View style={styles.itemsList}>
                  {/* Table Header */}
                  <View style={styles.tableHeader}>
                    <Text style={styles.tableHeaderText}>Item</Text>
                    <Text style={styles.tableHeaderText}>Price</Text>
                  </View>
                  
                  {/* Items */}
                  {parsedBill.items.map((item: any, index: number) => (
                    <View key={index} style={[styles.itemRow, index % 2 === 0 && styles.itemRowEven]}>
                      <View style={styles.itemDetails}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemBarcode}>#{item.barcode}</Text>
                      </View>
                      <View style={styles.itemPriceContainer}>
                        <Text style={styles.itemPrice}>₹{item.price}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyItems}>
                  <Ionicons name="cube-outline" size={32} color="#d1d5db" />
                  <Text style={styles.emptyItemsText}>No items purchased</Text>
                </View>
              )}
            </View>

            {/* Total Section */}
            <View style={styles.totalSection}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>₹{parsedBill.totalAmount}</Text>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.invoiceFooter}>
              <Text style={styles.footerText}>Thank you for your business!</Text>
              <Text style={styles.footerSubtext}>Invoice generated by ERP POS System</Text>
            </View>
          </View>
        </ViewShot>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.shareButton} 
            onPress={shareBill}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="share-social" size={20} color="white" />
              <Text style={styles.shareButtonText}>Share Invoice</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f8fafc" 
  },
  
  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },

  // Page Header
  pageHeader: {
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginLeft: 12,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 40,
  },

  scrollContainer: {
    flex: 1,
  },

  // Bill Card
  billCard: { 
    backgroundColor: "white", 
    borderRadius: 16, 
    margin: 20,
    padding: 24,
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, 
    shadowRadius: 8, 
    elevation: 5 
  },

  // Invoice Header
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  companyTagline: {
    fontSize: 14,
    color: '#6b7280',
  },
  invoiceBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  invoiceText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },

  divider: {
    height: 2,
    backgroundColor: '#e5e7eb',
    marginBottom: 24,
  },

  // Customer Section
  customerSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '600',
  },

  // Items Section
  itemsSection: {
    marginBottom: 32,
  },
  itemsList: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
  },
  itemRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemRowEven: {
    backgroundColor: '#f9fafb',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: { 
    fontSize: 16, 
    fontWeight: "600",
    color: '#1f2937',
    marginBottom: 2,
  },
  itemBarcode: { 
    fontSize: 12, 
    color: "#6b7280",
    fontFamily: 'monospace',
  },
  itemPriceContainer: {
    alignItems: 'flex-end',
  },
  itemPrice: { 
    fontSize: 16, 
    fontWeight: "bold",
    color: '#059669',
  },

  emptyItems: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyItemsText: { 
    fontSize: 16, 
    color: "#9ca3af", 
    marginTop: 8,
  },

  // Total Section
  totalSection: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  totalRow: { 
    flexDirection: "row", 
    justifyContent: "space-between",
    alignItems: 'center',
  },
  totalLabel: { 
    fontSize: 20, 
    fontWeight: "bold",
    color: '#1f2937',
  },
  totalValue: { 
    fontSize: 24, 
    fontWeight: "bold", 
    color: "#059669" 
  },

  // Invoice Footer
  invoiceFooter: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#6b7280',
  },

  // Actions
  actionsContainer: { 
    paddingHorizontal: 20,
    marginTop: 8,
  },
  shareButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  shareButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  bottomSpacing: {
    height: 40,
  },
});