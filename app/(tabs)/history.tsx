import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle, G, Text as SvgText } from "react-native-svg";

const { width } = Dimensions.get("window");

type SalesItem = {
  cart_id: string;
  customer_details: string;
  barcode: string;
  product_name: string;
  cart_amount: string;
  payment_mode: string;
  sales_date: string;
};

type SalesData = {
  item_details: SalesItem[];
  total_amount: number;
  top5Products: Array<{ barcode: string; name: string; sales_count: string }>;
  sellChartData: Array<{ name: string; sales: number }>;
};

type GroupedCart = {
  cart_id: string;
  customer: string;
  phone: string;
  items: SalesItem[];
  total: number;
  payment_mode: string;
  date: string;
};

export default function History() {
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [selectedDays, setSelectedDays] = useState(30);
  const [groupedCarts, setGroupedCarts] = useState<GroupedCart[]>([]);

  const dayOptions = [7, 15, 30, 60, 90];

  const fetchSalesReport = async (days: number) => {
    try {
      const token = await SecureStore.getItemAsync("accessToken");
      if (!token) {
        throw new Error("No access token found");
      }
      setLoading(true);
      const response = await fetch(
        "https://erp-pos-backend.onrender.com/product/sales-report",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ days }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSalesData(data);
        groupCartItems(data.item_details);
      }
    } catch (error) {
      console.error("Error fetching sales report:", error);
    } finally {
      setLoading(false);
    }
  };

  const groupCartItems = (items: SalesItem[]) => {
    const grouped: { [key: string]: GroupedCart } = {};

    items.forEach((item) => {
      if (!grouped[item.cart_id]) {
        const [customer, phone] = item.customer_details.split(" | ");
        grouped[item.cart_id] = {
          cart_id: item.cart_id,
          customer: customer || "Unknown",
          phone: phone || "N/A",
          items: [],
          total: parseFloat(item.cart_amount),
          payment_mode: item.payment_mode,
          date: new Date(item.sales_date).toLocaleString(),
        };
      }
      grouped[item.cart_id].items.push(item);
    });

    setGroupedCarts(Object.values(grouped));
  };

  useEffect(() => {
    fetchSalesReport(selectedDays);
  }, [selectedDays]);

  useFocusEffect(
    useCallback(() => {
      fetchSalesReport(selectedDays);
    }, [selectedDays])
  );

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const getPaymentIcon = (mode: string) => {
    switch (mode.toLowerCase()) {
      case "cash":
        return "cash-outline";
      case "card":
        return "card-outline";
      case "upi":
        return "phone-portrait-outline";
      default:
        return "wallet-outline";
    }
  };

  const getChartColors = () => [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
  ];

  const renderPieChart = () => {
    if (!salesData?.sellChartData || salesData.sellChartData.length === 0) {
      return null;
    }

    const total = salesData.sellChartData.reduce(
      (sum, item) => sum + item.sales,
      0
    );
    const colors = getChartColors();
    const radius = 80;
    const strokeWidth = 40;
    const center = 100;
    const circumference = 2 * Math.PI * radius;

    let currentAngle = -90;

    return (
      <View style={styles.pieChartSection}>
        <Text style={styles.chartTitle}>Top Products Distribution</Text>

        <View style={styles.pieChartContainer}>
          <Svg width={200} height={200}>
            <G rotation={0} origin={`${center}, ${center}`}>
              {salesData.sellChartData.map((item, index) => {
                const percentage = (item.sales / total) * 100;
                const angle = (percentage / 100) * 360;
                const strokeDasharray = `${
                  (percentage / 100) * circumference
                } ${circumference}`;

                const rotation = currentAngle;
                currentAngle += angle;

                return (
                  <Circle
                    key={index}
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={colors[index % colors.length]}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={0}
                    rotation={rotation}
                    origin={`${center}, ${center}`}
                  />
                );
              })}
            </G>
            <SvgText
              x={center}
              y={center - 10}
              fontSize="20"
              fontWeight="bold"
              fill="#1f2937"
              textAnchor="middle"
            >
              {total}
            </SvgText>
            <SvgText
              x={center}
              y={center + 10}
              fontSize="12"
              fill="#6b7280"
              textAnchor="middle"
            >
              Total Sales
            </SvgText>
          </Svg>

          <View style={styles.pieLegend}>
            {salesData.sellChartData.map((item, index) => {
              const percentage = ((item.sales / total) * 100).toFixed(1);
              return (
                <View key={index} style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendColor,
                      { backgroundColor: colors[index % colors.length] },
                    ]}
                  />
                  <View style={styles.legendTextContainer}>
                    <Text style={styles.legendName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.legendValue}>
                      {item.sales} ({percentage}%)
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  const renderCartItem = ({ item }: { item: GroupedCart }) => (
    <View style={styles.cartCard}>
      <View style={styles.cartHeader}>
        <View style={styles.cartIdContainer}>
          <Ionicons name="receipt-outline" size={20} color="#3b82f6" />
          <Text style={styles.cartId}>#{item.cart_id.split("_")[1]}</Text>
        </View>
        <View
          style={[
            styles.paymentBadge,
            { backgroundColor: getPaymentBadgeColor(item.payment_mode) },
          ]}
        >
          <Ionicons
            name={getPaymentIcon(item.payment_mode)}
            size={14}
            color="white"
          />
          <Text style={styles.paymentBadgeText}>{item.payment_mode}</Text>
        </View>
      </View>

      <View style={styles.customerInfo}>
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={16} color="#6b7280" />
          <Text style={styles.customerName}>{item.customer}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={16} color="#6b7280" />
          <Text style={styles.phoneText}>{item.phone}</Text>
        </View>
      </View>

      <View style={styles.itemsList}>
        <Text style={styles.itemsHeader}>Items ({item.items.length})</Text>
        {item.items.map((product, index) => (
          <View key={index} style={styles.productRow}>
            <Text style={styles.productName} numberOfLines={1}>
              {product.product_name}
            </Text>
            <Text style={styles.productBarcode}>#{product.barcode}</Text>
          </View>
        ))}
      </View>

      <View style={styles.cartFooter}>
        <View style={styles.dateContainer}>
          <Ionicons name="calendar-outline" size={14} color="#6b7280" />
          <Text style={styles.dateText}>{item.date}</Text>
        </View>
        <Text style={styles.cartTotal}>{formatCurrency(item.total)}</Text>
      </View>
    </View>
  );

  const getPaymentBadgeColor = (mode: string) => {
    switch (mode.toLowerCase()) {
      case "cash":
        return "#10b981";
      case "card":
        return "#3b82f6";
      case "upi":
        return "#f59e0b";
      default:
        return "#6b7280";
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading sales history...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="time-outline" size={28} color="#3b82f6" />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Sales History</Text>
            <Text style={styles.headerSubtitle}>Transaction records</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Ionicons name="trending-up" size={24} color="#10b981" />
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Total Sales</Text>
              <Text style={styles.statValue}>
                {formatCurrency(salesData?.total_amount || 0)}
              </Text>
            </View>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="cart" size={24} color="#3b82f6" />
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Transactions</Text>
              <Text style={styles.statValue}>{groupedCarts.length}</Text>
            </View>
          </View>
        </View>

        {/* Pie Chart */}
        {renderPieChart()}

        {/* Days Filter */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Time Period</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {dayOptions.map((days) => (
              <TouchableOpacity
                key={days}
                style={[
                  styles.filterButton,
                  selectedDays === days && styles.filterButtonActive,
                ]}
                onPress={() => setSelectedDays(days)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedDays === days && styles.filterButtonTextActive,
                  ]}
                >
                  {days} Days
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Sales List */}
        <View style={styles.salesListContainer}>
          {groupedCarts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="document-text-outline"
                size={64}
                color="#d1d5db"
              />
              <Text style={styles.emptyTitle}>No Sales Records</Text>
              <Text style={styles.emptySubtitle}>
                No transactions found for the selected period
              </Text>
            </View>
          ) : (
            groupedCarts.map((cart) => (
              <View key={cart.cart_id}>{renderCartItem({ item: cart })}</View>
            ))
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6b7280",
  },

  header: {
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTextContainer: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1f2937",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },

  statsCard: {
    flexDirection: "row",
    backgroundColor: "white",
    margin: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  statContent: {
    marginLeft: 12,
    flex: 1,
  },
  statLabel: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: "#e5e7eb",
    marginHorizontal: 16,
  },

  pieChartSection: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 20,
    textAlign: "center",
  },
  pieChartContainer: {
    alignItems: "center",
  },
  pieLegend: {
    width: "100%",
    marginTop: 24,
    gap: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 12,
  },
  legendTextContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  legendName: {
    fontSize: 14,
    color: "#1f2937",
    fontWeight: "500",
    flex: 1,
    marginRight: 8,
  },
  legendValue: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "600",
  },

  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  filterScroll: {
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  filterButtonActive: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  filterButtonTextActive: {
    color: "white",
  },

  salesListContainer: {
    paddingHorizontal: 20,
  },

  cartCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  cartIdContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  cartId: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    marginLeft: 8,
    fontFamily: "monospace",
  },
  paymentBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  paymentBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
  },

  customerInfo: {
    marginBottom: 12,
    gap: 6,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  customerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    flex: 1,
  },
  phoneText: {
    fontSize: 14,
    color: "#6b7280",
  },

  itemsList: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  itemsHeader: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 8,
  },
  productRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  productName: {
    fontSize: 14,
    color: "#1f2937",
    fontWeight: "500",
    flex: 1,
    marginRight: 8,
  },
  productBarcode: {
    fontSize: 12,
    color: "#6b7280",
    fontFamily: "monospace",
  },

  cartFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: "#6b7280",
  },
  cartTotal: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#059669",
  },

  emptyContainer: {
    paddingVertical: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },

  bottomSpacing: {
    height: 100,
  },
});
