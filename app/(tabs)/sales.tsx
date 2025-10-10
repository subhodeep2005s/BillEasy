import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
// 192.168.0.103:8081

const { width } = Dimensions.get("window");
const apiUrl = process.env.EXPO_PUBLIC_API_URL;
if (!apiUrl) {
  console.error("API URL is not set. Please check your environment variables.");
  Alert.alert(
    "Configuration Error",
    "API URL is not set. Please check your environment variables."
  );
}

// const apiUrl = "http://192.168.0.103:8080";

type Product = {
  barcode: string;
  name: string;
  sales_count: string;
};

type ReportData = {
  total_amount: number;
  top5Products: Product[];
  least5Products: Product[];
  sellChartData: Array<{ name: string; sales: number }>;
};

export default function Sales() {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [selectedDays, setSelectedDays] = useState(30);
  const [chartType, setChartType] = useState<"bar" | "pie">("bar");

  const dayOptions = [1, 7, 15, 30, 60, 90];

  const fetchSalesReport = async (days: number) => {
    try {
      const token = await SecureStore.getItemAsync("accessToken");
      setLoading(true);
      const response = await fetch(`${apiUrl}/product/sales-report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ days }),
      });

      const data = await response.json();
      if (response.ok) {
        setReportData(data); // ✅ directly use API response
      }
    } catch (error) {
      console.error("Error fetching sales report:", error);
    } finally {
      setLoading(false);
    }
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
    return `₹${amount.toLocaleString()}`;
  };

  const getChartColors = () => [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
  ];

  const renderBarChart = () => {
    if (!reportData?.sellChartData) return null;

    const maxSales = Math.max(
      ...reportData.sellChartData.map((item) => item.sales)
    );

    return (
      <View style={styles.barChartContainer}>
        {reportData.sellChartData.map((item, index) => {
          const heightPercentage = (item.sales / maxSales) * 100;
          const colors = getChartColors();

          return (
            <View key={index} style={styles.barChartItem}>
              <View style={styles.barWrapper}>
                <Text style={styles.barValue}>{item.sales}</Text>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${heightPercentage}%`,
                      backgroundColor: colors[index % colors.length],
                    },
                  ]}
                />
              </View>
              <Text style={styles.barLabel} numberOfLines={2}>
                {item.name}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderPieChart = () => {
    if (!reportData?.sellChartData) return null;

    const total = reportData.sellChartData.reduce(
      (sum, item) => sum + item.sales,
      0
    );
    const colors = getChartColors();

    return (
      <View style={styles.pieChartContainer}>
        <View style={styles.pieChart}>
          {reportData.sellChartData.map((item, index) => {
            const percentage = (item.sales / total) * 100;
            return (
              <View
                key={index}
                style={[
                  styles.pieSegment,
                  {
                    backgroundColor: colors[index % colors.length],
                    height: percentage * 2,
                  },
                ]}
              />
            );
          })}
        </View>

        <View style={styles.pieLegend}>
          {reportData.sellChartData.map((item, index) => {
            const percentage = ((item.sales / total) * 100).toFixed(1);
            return (
              <View key={index} style={styles.legendItem}>
                <View
                  style={[
                    styles.legendColor,
                    { backgroundColor: colors[index % colors.length] },
                  ]}
                />
                <View style={styles.legendText}>
                  <Text style={styles.legendName}>{item.name}</Text>
                  <Text style={styles.legendValue}>
                    {item.sales} ({percentage}%)
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderProductList = (products: Product[], isTop: boolean) => {
    return (
      <View style={styles.productList}>
        {products.map((product, index) => (
          <View key={index} style={styles.productCard}>
            <View style={styles.productRank}>
              <Text style={styles.rankNumber}>#{index + 1}</Text>
            </View>
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={1}>
                {product.name}
              </Text>
              <Text style={styles.productBarcode}>#{product.barcode}</Text>
            </View>
            <View
              style={[
                styles.salesBadge,
                { backgroundColor: isTop ? "#10b981" : "#ef4444" },
              ]}
            >
              <Ionicons
                name={isTop ? "trending-up" : "trending-down"}
                size={16}
                color="white"
              />
              <Text style={styles.salesCount}>{product.sales_count}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading sales report...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="analytics-outline" size={28} color="#3b82f6" />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Sales Analytics</Text>
            <Text style={styles.headerSubtitle}>Performance insights</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Total Revenue Card */}
        <View style={styles.revenueCard}>
          <View style={styles.revenueIcon}>
            <Ionicons name="cash" size={32} color="#10b981" />
          </View>
          <View style={styles.revenueContent}>
            <Text style={styles.revenueLabel}>Total Revenue</Text>
            <Text style={styles.revenueValue}>
              {formatCurrency(reportData?.total_amount || 0)}
            </Text>
            <Text style={styles.revenuePeriod}>Last {selectedDays} days</Text>
          </View>
        </View>

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

        {/* Chart Section */}
        <View style={styles.chartSection}>
          <View style={styles.chartHeader}>
            <Text style={styles.sectionTitle}>Sales Overview</Text>
            <View style={styles.chartTypeToggle}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  chartType === "bar" && styles.toggleButtonActive,
                ]}
                onPress={() => setChartType("bar")}
              >
                <Ionicons
                  name="bar-chart"
                  size={20}
                  color={chartType === "bar" ? "white" : "#6b7280"}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  chartType === "pie" && styles.toggleButtonActive,
                ]}
                onPress={() => setChartType("pie")}
              >
                <Ionicons
                  name="pie-chart"
                  size={20}
                  color={chartType === "pie" ? "white" : "#6b7280"}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.chartCard}>
            {chartType === "bar" ? renderBarChart() : renderPieChart()}
          </View>
        </View>

        {/* Top Selling Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trophy" size={24} color="#10b981" />
            <Text style={styles.sectionTitle}>Top 5 Products</Text>
          </View>
          {reportData?.top5Products && reportData.top5Products.length > 0 ? (
            renderProductList(reportData.top5Products, true)
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No data available</Text>
            </View>
          )}
        </View>

        {/* Least Selling Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="alert-circle" size={24} color="#ef4444" />
            <Text style={styles.sectionTitle}>Least Selling Products</Text>
          </View>
          {reportData?.least5Products &&
          reportData.least5Products.length > 0 ? (
            renderProductList(reportData.least5Products, false)
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No data available</Text>
            </View>
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  // Loading
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

  // Header
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

  scrollView: {
    flex: 1,
  },

  // Revenue Card
  revenueCard: {
    flexDirection: "row",
    backgroundColor: "white",
    margin: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  revenueIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#d1fae5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  revenueContent: {
    flex: 1,
    justifyContent: "center",
  },
  revenueLabel: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  revenueValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#059669",
    marginTop: 4,
  },
  revenuePeriod: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },

  // Filter
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
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

  // Chart Section
  chartSection: {
    marginBottom: 24,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  chartTypeToggle: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 8,
    padding: 4,
    gap: 4,
  },
  toggleButton: {
    padding: 8,
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: "#3b82f6",
  },
  chartCard: {
    backgroundColor: "white",
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  // Bar Chart
  barChartContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: 200,
    paddingTop: 20,
  },
  barChartItem: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 4,
  },
  barWrapper: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: 8,
  },
  bar: {
    width: "100%",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    minHeight: 20,
  },
  barValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  barLabel: {
    fontSize: 11,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 4,
  },

  // Pie Chart
  pieChartContainer: {
    alignItems: "center",
  },
  pieChart: {
    width: 180,
    height: 180,
    borderRadius: 90,
    overflow: "hidden",
    marginBottom: 24,
  },
  pieSegment: {
    width: "100%",
  },
  pieLegend: {
    width: "100%",
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
  legendText: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  legendName: {
    fontSize: 14,
    color: "#1f2937",
    fontWeight: "500",
  },
  legendValue: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "600",
  },

  // Section
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },

  // Product List
  productList: {
    gap: 12,
  },
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 2,
  },
  productBarcode: {
    fontSize: 12,
    color: "#6b7280",
    fontFamily: "monospace",
  },
  salesBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  salesCount: {
    fontSize: 14,
    fontWeight: "bold",
    color: "white",
  },

  // Empty State
  emptyState: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#9ca3af",
  },

  bottomSpacing: {
    height: 40,
  },
});
