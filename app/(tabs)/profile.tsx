import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Profile() {
  const router = useRouter();
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [queryModalVisible, setQueryModalVisible] = useState(false);
  const [callbackModalVisible, setCallbackModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [feedbackForm, setFeedbackForm] = useState({
    name: "",
    email: "",
    rating: 0,
    message: "",
  });

  const [queryForm, setQueryForm] = useState({
    name: "",
    email: "",
    subject: "",
    query: "",
  });

  const [callbackForm, setCallbackForm] = useState({
    name: "",
    phone: "",
    preferredTime: "",
  });

  const [paymentForm, setPaymentForm] = useState({
    cardNumber: "",
    cardName: "",
    expiryDate: "",
    cvv: "",
  });

  const shopInfo = {
    name: "Subhodeep's Grocery Store",
    owner: "Subhodeep Kumar",
    type: "Grocery & Retail",
    address: "123 Main Street, Kolkata, West Bengal",
    phone: "8597722752",
    email: "subhodeep2005s@zohomail.com",
  };

  const subscriptionInfo = {
    plan: "₹199 / month",
    expiry: "25 Oct 2025",
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await SecureStore.deleteItemAsync("accessToken");
          router.replace("/(auth)/signIn");
        },
      },
    ]);
  };

  const handleFeedbackSubmit = () => {
    if (!feedbackForm.name || !feedbackForm.email || !feedbackForm.message) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    if (feedbackForm.rating === 0) {
      Alert.alert("Error", "Please select a rating");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setFeedbackModalVisible(false);
      Alert.alert(
        "Thank You!",
        "Your feedback has been submitted successfully"
      );
      setFeedbackForm({ name: "", email: "", rating: 0, message: "" });
    }, 1500);
  };

  const handleQuerySubmit = () => {
    if (
      !queryForm.name ||
      !queryForm.email ||
      !queryForm.subject ||
      !queryForm.query
    ) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setQueryModalVisible(false);
      Alert.alert("Query Submitted", "We'll get back to you within 24 hours");
      setQueryForm({ name: "", email: "", subject: "", query: "" });
    }, 1500);
  };

  const handleCallbackRequest = () => {
    if (!callbackForm.name || !callbackForm.phone) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setCallbackModalVisible(false);
      Alert.alert("Request Received", "We'll call you back soon!");
      setCallbackForm({ name: "", phone: "", preferredTime: "" });
    }, 1500);
  };

  const handlePayment = () => {
    if (
      !paymentForm.cardNumber ||
      !paymentForm.cardName ||
      !paymentForm.expiryDate ||
      !paymentForm.cvv
    ) {
      Alert.alert("Error", "Please fill all payment details");
      return;
    }

    if (paymentForm.cardNumber.length !== 16) {
      Alert.alert("Error", "Invalid card number");
      return;
    }

    if (paymentForm.cvv.length !== 3) {
      Alert.alert("Error", "Invalid CVV");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setPaymentModalVisible(false);
      Alert.alert(
        "Payment Successful!",
        "Your subscription has been renewed successfully"
      );
      setPaymentForm({ cardNumber: "", cardName: "", expiryDate: "", cvv: "" });
    }, 2000);
  };

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, "");
    const chunks = cleaned.match(/.{1,4}/g);
    return chunks ? chunks.join(" ") : cleaned;
  };

  const openWhatsApp = () =>
    Linking.openURL(`whatsapp://send?phone=918597722752`);
  const openEmail = (email: string) => Linking.openURL(`mailto:${email}`);
  const openDialer = (phone: string) => Linking.openURL(`tel:${phone}`);

  const renderStars = (rating: number, onPress?: (star: number) => void) => (
    <View style={styles.starsContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => onPress && onPress(star)}
          disabled={!onPress}
        >
          <Ionicons
            name={star <= rating ? "star" : "star-outline"}
            size={30}
            color={star <= rating ? "#f59e0b" : "#d1d5db"}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="storefront" size={48} color="#3b82f6" />
            </View>
          </View>
          <Text style={styles.shopName}>{shopInfo.name}</Text>
          <Text style={styles.shopOwner}>{shopInfo.owner}</Text>
          <View style={styles.shopTypeBadge}>
            <Ionicons name="basket" size={16} color="#10b981" />
            <Text style={styles.shopTypeText}>{shopInfo.type}</Text>
          </View>
        </View>

        {/* Shop Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shop Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <Ionicons name="location" size={20} color="#3b82f6" />
              <Text style={styles.infoText}>{shopInfo.address}</Text>
            </View>
            <TouchableOpacity
              style={styles.infoItem}
              onPress={() => openDialer(shopInfo.phone)}
            >
              <Ionicons name="call" size={20} color="#10b981" />
              <Text style={styles.infoText}>{shopInfo.phone}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.infoItem}
              onPress={() => openEmail(shopInfo.email)}
            >
              <Ionicons name="mail" size={20} color="#f59e0b" />
              <Text style={styles.infoText}>{shopInfo.email}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Subscription Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription Details</Text>
          <View style={styles.subscriptionCard}>
            <View style={styles.subscriptionRow}>
              <Ionicons name="card" size={24} color="#3b82f6" />
              <View style={{ flex: 1 }}>
                <Text style={styles.subscriptionPlan}>
                  {subscriptionInfo.plan}
                </Text>
                <Text style={styles.subscriptionSubtitle}>Current Plan</Text>
              </View>
            </View>

            <View style={styles.subscriptionRow}>
              <Ionicons name="calendar" size={24} color="#10b981" />
              <View style={{ flex: 1 }}>
                <Text style={styles.subscriptionExpiry}>
                  Expires on {subscriptionInfo.expiry}
                </Text>
                <Text style={styles.subscriptionSubtitle}>
                  Renew before expiry
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.manageSubButton}
              onPress={() => setPaymentModalVisible(true)}
            >
              <Text style={styles.manageSubText}>Manage Subscription</Text>
              <Ionicons name="chevron-forward" size={18} color="#3b82f6" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Support & Feedback */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support & Feedback</Text>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setFeedbackModalVisible(true)}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="star" size={24} color="#f59e0b" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Give Feedback</Text>
              <Text style={styles.actionSubtitle}>
                Share your experience with us
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setQueryModalVisible(true)}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="help-circle" size={24} color="#3b82f6" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Raise a Query</Text>
              <Text style={styles.actionSubtitle}>
                Get help with any issues
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setCallbackModalVisible(true)}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="call" size={24} color="#10b981" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Request Callback</Text>
              <Text style={styles.actionSubtitle}>
                We'll call you back soon
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Quick Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Contact</Text>
          <View style={styles.contactGrid}>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={openWhatsApp}
            >
              <Ionicons name="logo-whatsapp" size={26} color="#25D366" />
              <Text style={styles.contactButtonText}>WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => openDialer("8597722752")}
            >
              <Ionicons name="call" size={26} color="#3b82f6" />
              <Text style={styles.contactButtonText}>Call Us</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => openEmail("subhodeep2005s@zohomail.com")}
            >
              <Ionicons name="mail" size={26} color="#ef4444" />
              <Text style={styles.contactButtonText}>Email</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => openDialer("8975447778")}
            >
              <Ionicons name="headset" size={26} color="#f59e0b" />
              <Text style={styles.contactButtonText}>Support</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Additional Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Contacts</Text>
          <TouchableOpacity
            style={styles.emailCard}
            onPress={() => openEmail("rajesh81704@gmail.com")}
          >
            <Ionicons name="mail-open" size={20} color="#3b82f6" />
            <Text style={styles.emailText}>rajesh81704@gmail.com</Text>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={20} color="white" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Feedback Modal */}
      <Modal
        visible={feedbackModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFeedbackModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share Your Feedback</Text>
              <TouchableOpacity onPress={() => setFeedbackModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Rate Your Experience</Text>
              {renderStars(feedbackForm.rating, (star) =>
                setFeedbackForm({ ...feedbackForm, rating: star })
              )}

              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                value={feedbackForm.name}
                onChangeText={(text) =>
                  setFeedbackForm({ ...feedbackForm, name: text })
                }
              />

              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                keyboardType="email-address"
                value={feedbackForm.email}
                onChangeText={(text) =>
                  setFeedbackForm({ ...feedbackForm, email: text })
                }
              />

              <Text style={styles.label}>Message *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Share your thoughts..."
                multiline
                numberOfLines={4}
                value={feedbackForm.message}
                onChangeText={(text) =>
                  setFeedbackForm({ ...feedbackForm, message: text })
                }
              />

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleFeedbackSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit Feedback</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Query Modal */}
      <Modal
        visible={queryModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setQueryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Raise a Query</Text>
              <TouchableOpacity onPress={() => setQueryModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                value={queryForm.name}
                onChangeText={(text) =>
                  setQueryForm({ ...queryForm, name: text })
                }
              />

              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                keyboardType="email-address"
                value={queryForm.email}
                onChangeText={(text) =>
                  setQueryForm({ ...queryForm, email: text })
                }
              />

              <Text style={styles.label}>Subject *</Text>
              <TextInput
                style={styles.input}
                placeholder="Query subject"
                value={queryForm.subject}
                onChangeText={(text) =>
                  setQueryForm({ ...queryForm, subject: text })
                }
              />

              <Text style={styles.label}>Your Query *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe your query in detail..."
                multiline
                numberOfLines={4}
                value={queryForm.query}
                onChangeText={(text) =>
                  setQueryForm({ ...queryForm, query: text })
                }
              />

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleQuerySubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit Query</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Callback Modal */}
      <Modal
        visible={callbackModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCallbackModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Callback</Text>
              <TouchableOpacity onPress={() => setCallbackModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                value={callbackForm.name}
                onChangeText={(text) =>
                  setCallbackForm({ ...callbackForm, name: text })
                }
              />

              <Text style={styles.label}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
                maxLength={10}
                value={callbackForm.phone}
                onChangeText={(text) =>
                  setCallbackForm({ ...callbackForm, phone: text })
                }
              />

              <Text style={styles.label}>Preferred Time (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Morning 10-12 AM"
                value={callbackForm.preferredTime}
                onChangeText={(text) =>
                  setCallbackForm({ ...callbackForm, preferredTime: text })
                }
              />

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleCallbackRequest}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.submitButtonText}>Request Callback</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Payment Modal */}
      <Modal
        visible={paymentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Subscription Payment</Text>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.paymentHeader}>
                <Ionicons name="card" size={32} color="#3b82f6" />
                <Text style={styles.paymentAmount}>₹199.00</Text>
                <Text style={styles.paymentDescription}>
                  Monthly Subscription
                </Text>
              </View>

              <Text style={styles.label}>Card Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="1234 5678 9012 3456"
                keyboardType="number-pad"
                maxLength={19}
                value={formatCardNumber(paymentForm.cardNumber)}
                onChangeText={(text) =>
                  setPaymentForm({
                    ...paymentForm,
                    cardNumber: text.replace(/\s/g, ""),
                  })
                }
              />

              <Text style={styles.label}>Cardholder Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Name on card"
                value={paymentForm.cardName}
                onChangeText={(text) =>
                  setPaymentForm({ ...paymentForm, cardName: text })
                }
              />

              <View style={styles.rowInputs}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.label}>Expiry Date *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="MM/YY"
                    keyboardType="number-pad"
                    maxLength={5}
                    value={paymentForm.expiryDate}
                    onChangeText={(text) => {
                      let formatted = text.replace(/\D/g, "");
                      if (formatted.length >= 2) {
                        formatted =
                          formatted.slice(0, 2) + "/" + formatted.slice(2, 4);
                      }
                      setPaymentForm({ ...paymentForm, expiryDate: formatted });
                    }}
                  />
                </View>

                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.label}>CVV *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="123"
                    keyboardType="number-pad"
                    maxLength={3}
                    secureTextEntry
                    value={paymentForm.cvv}
                    onChangeText={(text) =>
                      setPaymentForm({ ...paymentForm, cvv: text })
                    }
                  />
                </View>
              </View>

              <View style={styles.secureNote}>
                <Ionicons name="shield-checkmark" size={20} color="#10b981" />
                <Text style={styles.secureText}>
                  Your payment information is secure
                </Text>
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handlePayment}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="lock-closed" size={18} color="white" />
                    <Text style={styles.submitButtonText}>Pay ₹199</Text>
                  </>
                )}
              </TouchableOpacity>

              <Text style={styles.paymentNote}>
                By proceeding, you agree to our Terms & Conditions
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#1f2937" },
  profileCard: {
    backgroundColor: "white",
    margin: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: { marginBottom: 16 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#3b82f6",
  },
  shopName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  shopOwner: { fontSize: 16, color: "#6b7280", marginBottom: 12 },
  shopTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d1fae5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  shopTypeText: { fontSize: 14, color: "#059669", fontWeight: "600" },
  section: { marginBottom: 24, paddingHorizontal: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 10,
  },
  infoText: { fontSize: 14, color: "#374151", flex: 1 },
  subscriptionCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  subscriptionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  subscriptionPlan: { fontSize: 16, fontWeight: "700", color: "#1f2937" },
  subscriptionExpiry: { fontSize: 15, fontWeight: "600", color: "#059669" },
  subscriptionSubtitle: { fontSize: 13, color: "#6b7280" },
  manageSubButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eff6ff",
    paddingVertical: 12,
    borderRadius: 10,
  },
  manageSubText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#3b82f6",
    marginRight: 6,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#f9fafb",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  actionContent: { flex: 1 },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 2,
  },
  actionSubtitle: { fontSize: 13, color: "#6b7280" },
  contactGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  contactButton: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "white",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  contactButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    marginTop: 6,
  },
  emailCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emailText: { fontSize: 14, color: "#374151", flex: 1 },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ef4444",
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#ef4444",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  logoutButtonText: { color: "white", fontSize: 16, fontWeight: "600" },
  bottomSpacing: { height: 100 },
  starsContainer: { flexDirection: "row", gap: 8, marginBottom: 16 },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: "#1f2937",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    flexDirection: "row",
    gap: 8,
    shadowColor: "#3b82f6",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },

  // Payment Modal Styles
  paymentHeader: {
    alignItems: "center",
    paddingVertical: 20,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  paymentAmount: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1f2937",
    marginTop: 12,
  },
  paymentDescription: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  rowInputs: {
    flexDirection: "row",
    marginTop: 8,
  },
  secureNote: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d1fae5",
    padding: 12,
    borderRadius: 10,
    marginTop: 16,
    gap: 8,
  },
  secureText: {
    fontSize: 13,
    color: "#059669",
    fontWeight: "500",
  },
  paymentNote: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 16,
  },
});
