import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

type SalesItem = {
  cart_id: string;
  custdtls: string;
  barcode: string;
  product_name: string;
  cart_amount: string;
  payment_mode: string;
  sales_dt: string;
};

type SalesData = {
  item_details: SalesItem[];
  total_amount: number;
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
  const [selectedDays, setSelectedDays] = useState(7);
  const [groupedCarts, setGroupedCarts] = useState<GroupedCart[]>([]);

  const dayOptions = [7, 15, 30, 60, 90];

  const fetchSalesReport = async (days: number) => {
    try {
      setLoading(true);
      const response = await fetch('https://erp-pos-backend.onrender.com/sales-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days }),
      });

      const data = await response.json();
      if (response.ok) {
        setSalesData(data);
        groupCartItems(data.item_details);
      }
    } catch (error) {
      console.error('Error fetching sales report:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupCartItems = (items: SalesItem[]) => {
    const grouped: { [key: string]: GroupedCart } = {};

    items.forEach(item => {
      if (!grouped[item.cart_id]) {
        const [customer, phone] = item.custdtls.split(' | ');
        grouped[item.cart_id] = {
          cart_id: item.cart_id,
          customer: customer || 'Unknown',
          phone: phone || 'N/A',
          items: [],
          total: parseFloat(item.cart_amount),
          payment_mode: item.payment_mode,
          date: new Date(item.sales_dt).toLocaleString(),
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
      case 'cash': return 'cash-outline';
      case 'card': return 'card-outline';
      case 'upi': return 'phone-portrait-outline';
      default: return 'wallet-outline';
    }
  };

  const renderCartItem = ({ item }: { item: GroupedCart }) => (
    <View style={styles.cartCard}>
      <View style={styles.cartHeader}>
        <View style={styles.cartIdContainer}>
          <Ionicons name="receipt-outline" size={20} color="#3b82f6" />
          <Text style={styles.cartId}>#{item.cart_id.split('_')[1]}</Text>
        </View>
        <View style={[styles.paymentBadge, { backgroundColor: getPaymentBadgeColor(item.payment_mode) }]}>
          <Ionicons name={getPaymentIcon(item.payment_mode)} size={14} color="white" />
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
            <Text style={styles.productName} numberOfLines={1}>{product.product_name}</Text>
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
      case 'cash': return '#10b981';
      case 'card': return '#3b82f6';
      case 'upi': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading sales history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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

      {/* Stats Card */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Ionicons name="trending-up" size={24} color="#10b981" />
          <View style={styles.statContent}>
            <Text style={styles.statLabel}>Total Sales</Text>
            <Text style={styles.statValue}>{formatCurrency(salesData?.total_amount || 0)}</Text>
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
                selectedDays === days && styles.filterButtonActive
              ]}
              onPress={() => setSelectedDays(days)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.filterButtonText,
                selectedDays === days && styles.filterButtonTextActive
              ]}>
                {days} Days
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Sales List */}
      {groupedCarts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No Sales Records</Text>
          <Text style={styles.emptySubtitle}>No transactions found for the selected period</Text>
        </View>
      ) : (
        <FlatList
          data={groupedCarts}
          renderItem={renderCartItem}
          keyExtractor={(item) => item.cart_id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },

  // Header
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTextContainer: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },

  // Stats Card
  statsCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    margin: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statContent: {
    marginLeft: 12,
    flex: 1,
  },
  statLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
  },

  // Filter
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  filterScroll: {
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterButtonTextActive: {
    color: 'white',
  },

  // List
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // Cart Card
  cartCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  cartIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
    fontFamily: 'monospace',
  },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  paymentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },

  // Customer Info
  customerInfo: {
    marginBottom: 12,
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  phoneText: {
    fontSize: 14,
    color: '#6b7280',
  },

  // Items
  itemsList: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  itemsHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  productName: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  productBarcode: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'monospace',
  },

  // Footer
  cartFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: '#6b7280',
  },
  cartTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
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
});