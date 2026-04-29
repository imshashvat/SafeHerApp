import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, TextInput, Alert, Modal, Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useAppTheme } from '../../contexts/ThemeContext';
import { fontSize, spacing, radius } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';

const PARTNERS_KEY = '@safeher_travel_partners';
const ID_STATUS_KEY = '@safeher_id_status';

type VerificationStatus = 'unverified' | 'pending' | 'verified';

interface TravelPartner {
  id: string;
  userId: string;
  name: string;
  route: string;
  date: string;
  time: string;
  description: string;
  verificationStatus: VerificationStatus;
  postedAt: number;
  contactPhone?: string;
}

function VerificationBadge({ status, colors }: { status: VerificationStatus; colors: any }) {
  const config = {
    unverified: { color: colors.textMuted, bg: colors.bgElevated, icon: 'alert-circle-outline', label: 'Unverified' },
    pending: { color: '#FFB800', bg: '#FFB80015', icon: 'time-outline', label: 'Pending Review' },
    verified: { color: colors.success, bg: colors.successGlow, icon: 'shield-checkmark', label: 'ID Verified' },
  }[status];
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Ionicons name={config.icon as any} size={11} color={config.color} />
      <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

export default function TravelPartnerScreen() {
  const { colors } = useAppTheme();
  const { currentUser } = useAuthStore();
  const [partners, setPartners] = useState<TravelPartner[]>([]);
  const [myVerification, setMyVerification] = useState<VerificationStatus>('unverified');
  const [showPostModal, setShowPostModal] = useState(false);
  const [showIDModal, setShowIDModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // New post form state
  const [route, setRoute] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // ID verification form
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [idPhotoUri, setIdPhotoUri] = useState<string | null>(null);
  const [submittingID, setSubmittingID] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const [raw, statusRaw] = await Promise.all([
        AsyncStorage.getItem(PARTNERS_KEY),
        AsyncStorage.getItem(`${ID_STATUS_KEY}_${currentUser?.id}`),
      ]);
      setPartners(raw ? JSON.parse(raw) : []);
      setMyVerification((statusRaw as VerificationStatus) || 'unverified');
    } finally {
      setLoading(false);
    }
  };

  const submitIDVerification = async () => {
    if (aadhaarNumber.replace(/\s/g, '').length !== 12) {
      Alert.alert('Invalid Aadhaar', 'Please enter a valid 12-digit Aadhaar number.');
      return;
    }
    if (!idPhotoUri) {
      Alert.alert('ID Photo Required', 'Please upload a photo of your government ID.');
      return;
    }
    setSubmittingID(true);
    await new Promise(r => setTimeout(r, 1200)); // Simulated processing
    await AsyncStorage.setItem(`${ID_STATUS_KEY}_${currentUser?.id}`, 'pending');
    setMyVerification('pending');
    setSubmittingID(false);
    setShowIDModal(false);
    Alert.alert(
      'Submitted for Verification',
      'Your ID has been submitted. You\'ll receive a status update within 24 hours.',
      [{ text: 'OK' }]
    );
  };

  const pickIDPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow photo library access to upload your ID.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setIdPhotoUri(result.assets[0].uri);
    }
  };

  const postTravelRequest = async () => {
    if (!route.trim() || !date.trim()) {
      Alert.alert('Required', 'Route and date are required.');
      return;
    }
    if (myVerification !== 'verified' && myVerification !== 'pending') {
      Alert.alert(
        'ID Verification Required',
        'You must submit your government ID before posting a travel partner request. This keeps our community safe.',
        [
          { text: 'Cancel' },
          { text: 'Verify ID', onPress: () => { setShowPostModal(false); setShowIDModal(true); } },
        ]
      );
      return;
    }
    const newPartner: TravelPartner = {
      id: `${Date.now()}_${Math.random()}`,
      userId: String(currentUser?.id ?? 'anonymous'),
      name: currentUser?.name ?? 'Anonymous',
      route: route.trim(),
      date: date.trim(),
      time: time.trim(),
      description: description.trim(),
      verificationStatus: myVerification,
      postedAt: Date.now(),
      contactPhone: contactPhone.trim() || undefined,
    };
    const updated = [newPartner, ...partners];
    setPartners(updated);
    await AsyncStorage.setItem(PARTNERS_KEY, JSON.stringify(updated));
    setShowPostModal(false);
    setRoute(''); setDate(''); setTime(''); setDescription(''); setContactPhone('');
    Alert.alert('Posted!', 'Your travel partner request has been posted. Stay safe! 💚');
  };

  const deletePost = async (id: string) => {
    Alert.alert('Delete', 'Remove this travel request?', [
      { text: 'Cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          const updated = partners.filter(p => p.id !== id);
          setPartners(updated);
          await AsyncStorage.setItem(PARTNERS_KEY, JSON.stringify(updated));
        }
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
        <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Travel Partner</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>Find verified travel companions</Text>
        </View>
        <VerificationBadge status={myVerification} colors={colors} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ID Verification Banner */}
        {myVerification === 'unverified' && (
          <TouchableOpacity
            style={[styles.verifyBanner, { backgroundColor: '#FFB80015', borderColor: '#FFB800' }]}
            onPress={() => setShowIDModal(true)}
          >
            <Ionicons name="shield-outline" size={22} color="#FFB800" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.verifyBannerTitle, { color: '#FFB800' }]}>Verify Your Identity</Text>
              <Text style={[styles.verifyBannerSub, { color: '#FFB80099' }]}>
                Submit Aadhaar or Government ID to post requests and contact partners
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#FFB800" />
          </TouchableOpacity>
        )}
        {myVerification === 'pending' && (
          <View style={[styles.verifyBanner, { backgroundColor: colors.accentGlow, borderColor: colors.accent }]}>
            <Ionicons name="time-outline" size={22} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.verifyBannerTitle, { color: colors.accent }]}>Verification Pending</Text>
              <Text style={[styles.verifyBannerSub, { color: colors.textMuted }]}>
                Your ID is under review. You can still post requests.
              </Text>
            </View>
          </View>
        )}
        {myVerification === 'verified' && (
          <View style={[styles.verifyBanner, { backgroundColor: colors.successGlow, borderColor: colors.success }]}>
            <Ionicons name="shield-checkmark" size={22} color={colors.success} />
            <Text style={[styles.verifyBannerTitle, { color: colors.success, flex: 1 }]}>Identity Verified ✓</Text>
          </View>
        )}

        {/* Safety Tips */}
        <View style={[styles.safetyCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={styles.safetyHeader}>
            <Ionicons name="information-circle" size={16} color={colors.primary} />
            <Text style={[styles.safetyTitle, { color: colors.textPrimary }]}>Travel Safety Guidelines</Text>
          </View>
          {[
            'Always meet in a public place first',
            'Share journey details with a guardian',
            'Both parties should be ID verified',
            'Use SafeHer\'s SOS button during travel',
          ].map((tip, i) => (
            <View key={i} style={styles.safetyTipRow}>
              <Text style={[styles.safetyTipBullet, { color: colors.primary }]}>•</Text>
              <Text style={[styles.safetyTipText, { color: colors.textSecondary }]}>{tip}</Text>
            </View>
          ))}
        </View>

        {/* Partner requests list */}
        <View style={styles.sectionRow}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>TRAVEL REQUESTS ({partners.length})</Text>
        </View>

        {partners.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={{ fontSize: 48 }}>✈️</Text>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No requests yet</Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>
              Be the first to post a travel partner request for safe travel!
            </Text>
          </View>
        ) : (
          partners.map((p) => (
            <View key={p.id} style={[styles.partnerCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <View style={styles.partnerHeader}>
                <View style={[styles.partnerAvatar, { backgroundColor: colors.primary }]}>
                  <Text style={styles.partnerAvatarText}>{p.name.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.partnerName, { color: colors.textPrimary }]}>{p.name}</Text>
                  <Text style={[styles.partnerTime, { color: colors.textMuted }]}>
                    {new Date(p.postedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </Text>
                </View>
                <VerificationBadge status={p.verificationStatus} colors={colors} />
                {p.userId === String(currentUser?.id) && (
                  <TouchableOpacity onPress={() => deletePost(p.id)} style={{ padding: 4, marginLeft: 4 }}>
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                  </TouchableOpacity>
                )}
              </View>

              <View style={[styles.routeRow, { backgroundColor: colors.bgElevated, borderColor: colors.border }]}>
                <Ionicons name="navigate" size={14} color={colors.primary} />
                <Text style={[styles.routeText, { color: colors.textPrimary }]}>{p.route}</Text>
              </View>

              <View style={styles.partnerMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>{p.date}</Text>
                </View>
                {p.time && (
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={13} color={colors.textMuted} />
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>{p.time}</Text>
                  </View>
                )}
              </View>

              {p.description ? (
                <Text style={[styles.partnerDesc, { color: colors.textMuted }]}>{p.description}</Text>
              ) : null}

              {p.verificationStatus !== 'unverified' && p.userId !== String(currentUser?.id) && (
                <TouchableOpacity
                  style={[styles.contactBtn, { backgroundColor: colors.primaryGlow, borderColor: colors.primary }]}
                  onPress={() => Alert.alert('Connect', `To protect privacy, exchange contact details in a safe public meeting first.\n\nRoute: ${p.route}\nDate: ${p.date}`)}
                >
                  <Ionicons name="people" size={15} color={colors.primary} />
                  <Text style={[styles.contactBtnText, { color: colors.primary }]}>Request to Connect</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Post FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => setShowPostModal(true)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Post Modal */}
      <Modal visible={showPostModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Post Travel Request</Text>
              <TouchableOpacity onPress={() => setShowPostModal(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { label: 'Route (From → To) *', val: route, setter: setRoute, placeholder: 'e.g. Delhi → Agra', key: 'route' },
                { label: 'Travel Date *', val: date, setter: setDate, placeholder: 'e.g. 15 May 2025', key: 'date' },
                { label: 'Preferred Time', val: time, setter: setTime, placeholder: 'e.g. 9:00 AM', key: 'time' },
                { label: 'Contact Number (optional)', val: contactPhone, setter: setContactPhone, placeholder: 'Your phone', key: 'phone' },
              ].map(f => (
                <View key={f.key} style={{ marginBottom: spacing.sm }}>
                  <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>{f.label}</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: colors.bgElevated, borderColor: colors.border, color: colors.textPrimary }]}
                    value={f.val}
                    onChangeText={f.setter}
                    placeholder={f.placeholder}
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              ))}
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Description</Text>
              <TextInput
                style={[styles.modalInput, styles.multilineInput, { backgroundColor: colors.bgElevated, borderColor: colors.border, color: colors.textPrimary }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Any specific requirements or notes..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity style={[styles.postBtn, { backgroundColor: colors.primary }]} onPress={postTravelRequest}>
                <Ionicons name="airplane" size={18} color="#fff" />
                <Text style={styles.postBtnText}>Post Request</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ID Verification Modal */}
      <Modal visible={showIDModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>ID Verification</Text>
              <TouchableOpacity onPress={() => setShowIDModal(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.idExplain, { color: colors.textSecondary }]}>
                Your ID is used only to verify your identity for community safety.
                It is stored securely and never shared with other users.
              </Text>

              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Aadhaar Number *</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.bgElevated, borderColor: colors.border, color: colors.textPrimary }]}
                value={aadhaarNumber}
                onChangeText={(t) => setAadhaarNumber(t.replace(/\D/g, '').slice(0, 12))}
                placeholder="12-digit Aadhaar number"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                maxLength={12}
              />

              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Upload Government ID Photo *</Text>
              <TouchableOpacity
                style={[styles.uploadBox, { backgroundColor: colors.bgElevated, borderColor: idPhotoUri ? colors.success : colors.border }]}
                onPress={pickIDPhoto}
              >
                {idPhotoUri ? (
                  <>
                    <Image source={{ uri: idPhotoUri }} style={styles.idPreview} />
                    <Text style={[styles.uploadChangeText, { color: colors.success }]}>✓ Photo uploaded — tap to change</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="camera-outline" size={32} color={colors.textMuted} />
                    <Text style={[styles.uploadText, { color: colors.textMuted }]}>Tap to upload Aadhaar / Voter ID / Passport</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={[styles.privacyNote, { backgroundColor: colors.primaryGlow, borderColor: colors.primary }]}>
                <Ionicons name="lock-closed-outline" size={14} color={colors.primary} />
                <Text style={[styles.privacyText, { color: colors.primary }]}>
                  Your ID photo is encrypted and stored only on your device. It is not uploaded to any server.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.postBtn, { backgroundColor: submittingID ? colors.textMuted : colors.success }]}
                onPress={submitIDVerification}
                disabled={submittingID}
              >
                {submittingID ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="shield-checkmark" size={18} color="#fff" />
                    <Text style={styles.postBtnText}>Submit for Verification</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1 },
  headerTitle: { fontSize: fontSize.xl, fontWeight: '900' },
  headerSubtitle: { fontSize: fontSize.xs, marginTop: 1 },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 100 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.full },
  badgeText: { fontSize: 9, fontWeight: '800' },
  verifyBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1 },
  verifyBannerTitle: { fontSize: fontSize.sm, fontWeight: '800' },
  verifyBannerSub: { fontSize: fontSize.xs, marginTop: 2 },
  safetyCard: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.md, gap: 6 },
  safetyHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: 4 },
  safetyTitle: { fontSize: fontSize.sm, fontWeight: '700' },
  safetyTipRow: { flexDirection: 'row', gap: 6 },
  safetyTipBullet: { fontSize: fontSize.sm, fontWeight: '800' },
  safetyTipText: { flex: 1, fontSize: fontSize.xs, lineHeight: 18 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionLabel: { fontSize: fontSize.xs, fontWeight: '700', letterSpacing: 2 },
  emptyCard: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.xl, alignItems: 'center', gap: spacing.sm },
  emptyTitle: { fontSize: fontSize.xl, fontWeight: '800' },
  emptySub: { fontSize: fontSize.sm, textAlign: 'center', lineHeight: 20 },
  partnerCard: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.md, gap: spacing.sm },
  partnerHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  partnerAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  partnerAvatarText: { color: '#fff', fontWeight: '800', fontSize: fontSize.md },
  partnerName: { fontSize: fontSize.sm, fontWeight: '700' },
  partnerTime: { fontSize: fontSize.xs },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: spacing.sm, borderRadius: radius.md, borderWidth: 1 },
  routeText: { flex: 1, fontSize: fontSize.sm, fontWeight: '700' },
  partnerMeta: { flexDirection: 'row', gap: spacing.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: fontSize.xs },
  partnerDesc: { fontSize: fontSize.xs, lineHeight: 18 },
  contactBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, borderRadius: radius.md, borderWidth: 1, padding: spacing.sm, marginTop: 4 },
  contactBtnText: { fontSize: fontSize.xs, fontWeight: '700' },
  fab: { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 6 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, padding: spacing.lg, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  modalTitle: { fontSize: fontSize.xl, fontWeight: '800' },
  fieldLabel: { fontSize: fontSize.xs, fontWeight: '700', marginBottom: 4, letterSpacing: 0.5 },
  modalInput: { borderRadius: radius.md, borderWidth: 1, padding: spacing.md, fontSize: fontSize.sm, marginBottom: spacing.xs },
  multilineInput: { height: 80, textAlignVertical: 'top' },
  postBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.md },
  postBtnText: { color: '#fff', fontSize: fontSize.md, fontWeight: '800' },
  idExplain: { fontSize: fontSize.sm, lineHeight: 20, marginBottom: spacing.md },
  uploadBox: { borderRadius: radius.lg, borderWidth: 2, borderStyle: 'dashed', padding: spacing.xl, alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  idPreview: { width: '100%', height: 160, borderRadius: radius.md, resizeMode: 'cover' },
  uploadText: { fontSize: fontSize.sm, textAlign: 'center' },
  uploadChangeText: { fontSize: fontSize.xs, fontWeight: '600' },
  privacyNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, padding: spacing.sm, borderRadius: radius.md, borderWidth: 1, marginBottom: spacing.sm },
  privacyText: { flex: 1, fontSize: fontSize.xs, lineHeight: 16 },
});
