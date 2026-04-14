import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, fontSize, spacing, radius } from '../constants/theme';

type CompanionProfile = {
  id: string;
  name: string;
  from: string;
  to: string;
  date: string;
  time: string;
  interests: string[];
  verified: boolean;
};

const INTERESTS = ['Work Commute', 'Late Night', 'Shopping', 'Hospital Visit', 'College', 'Airport', 'Other'];

const SAMPLE_COMPANIONS: CompanionProfile[] = [
  {
    id: '1', name: 'Ananya S.', from: 'Noida Sector 62', to: 'Connaught Place',
    date: 'Tomorrow', time: '9:00 AM', verified: true,
    interests: ['Work Commute', 'Metro'],
  },
  {
    id: '2', name: 'Divya K.', from: 'Dwarka Sector 21', to: 'Lajpat Nagar',
    date: 'Today', time: '6:30 PM', verified: true,
    interests: ['Shopping', 'Evening'],
  },
  {
    id: '3', name: 'Meera P.', from: 'Gurgaon Cyber Hub', to: 'IGI Airport',
    date: 'Apr 16', time: '4:00 AM', verified: false,
    interests: ['Airport', 'Late Night'],
  },
];

export default function CompanionScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'find' | 'post'>('find');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [companions] = useState<CompanionProfile[]>(SAMPLE_COMPANIONS);

  const toggleInterest = (i: string) => {
    setSelectedInterests((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
    );
  };

  const handleConnect = (name: string) => {
    Alert.alert(
      'Connect Request',
      `Send a travel companion request to ${name}?\n\nYour profile will be shared with her for verification.`,
      [{ text: 'Cancel' }, { text: 'Send Request', style: 'default' }]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Travel Companion</Text>
      </View>

      {/* Verified note */}
      <View style={styles.verifiedNote}>
        <Ionicons name="shield-checkmark" size={16} color={colors.success} />
        <Text style={styles.verifiedText}>Women-only · Identity verified users shown first</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'find' && styles.tabActive]}
          onPress={() => setActiveTab('find')}
        >
          <Text style={[styles.tabText, activeTab === 'find' && styles.tabTextActive]}>Find Companion</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'post' && styles.tabActive]}
          onPress={() => setActiveTab('post')}
        >
          <Text style={[styles.tabText, activeTab === 'post' && styles.tabTextActive]}>Post Request</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'find' ? (
          <>
            {/* Search filters */}
            <View style={styles.searchCard}>
              <TextInput style={styles.input} placeholder="From (area / landmark)" placeholderTextColor={colors.textMuted}
                value={from} onChangeText={setFrom} />
              <TextInput style={styles.input} placeholder="To (destination)" placeholderTextColor={colors.textMuted}
                value={to} onChangeText={setTo} />
              <TouchableOpacity style={styles.searchBtn}>
                <Ionicons name="search" size={18} color="#fff" />
                <Text style={styles.searchBtnText}>Find Companions</Text>
              </TouchableOpacity>
            </View>

            {/* Results */}
            {companions.map((c) => (
              <View key={c.id} style={styles.companionCard}>
                <View style={styles.companionHeader}>
                  <View style={styles.companionAvatar}>
                    <Text style={styles.companionAvatarText}>{c.name.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                      <Text style={styles.companionName}>{c.name}</Text>
                      {c.verified && (
                        <View style={styles.vBadge}>
                          <Ionicons name="shield-checkmark" size={12} color={colors.success} />
                          <Text style={styles.vBadgeText}>Verified</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.routeText}>
                      {c.from} → {c.to}
                    </Text>
                    <Text style={styles.timeText}>{c.date} · {c.time}</Text>
                  </View>
                </View>
                <View style={styles.interestRow}>
                  {c.interests.map((i) => (
                    <View key={i} style={styles.interestChip}>
                      <Text style={styles.interestText}>{i}</Text>
                    </View>
                  ))}
                </View>
                <TouchableOpacity style={styles.connectBtn} onPress={() => handleConnect(c.name)}>
                  <Text style={styles.connectBtnText}>Connect</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        ) : (
          <View style={styles.postCard}>
            <Text style={styles.postTitle}>Post a Companion Request</Text>
            <Text style={styles.postSub}>Other verified women in your route can connect with you</Text>
            <TextInput style={styles.input} placeholder="From (area / landmark)" placeholderTextColor={colors.textMuted}
              value={from} onChangeText={setFrom} />
            <TextInput style={styles.input} placeholder="To (destination)" placeholderTextColor={colors.textMuted}
              value={to} onChangeText={setTo} />
            <Text style={styles.fieldLabel}>TRAVEL PURPOSE</Text>
            <View style={styles.interestGrid}>
              {INTERESTS.map((i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.interestChip, selectedInterests.includes(i) && styles.interestChipActive]}
                  onPress={() => toggleInterest(i)}
                >
                  <Text style={[styles.interestText, selectedInterests.includes(i) && styles.interestTextActive]}>{i}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.postBtn} onPress={() => Alert.alert('Posted!', 'Your companion request has been posted.')}>
              <Ionicons name="send" size={18} color="#fff" />
              <Text style={styles.postBtnText}>Post Request</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { marginRight: spacing.sm, padding: 4 },
  title: { color: colors.textPrimary, fontSize: fontSize.xl, fontWeight: '700' },
  verifiedNote: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    marginHorizontal: spacing.lg, marginVertical: spacing.xs,
    backgroundColor: colors.successGlow, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: 6,
    borderWidth: 1, borderColor: colors.success + '33', alignSelf: 'flex-start',
  },
  verifiedText: { color: colors.success, fontSize: fontSize.xs, fontWeight: '600' },
  tabs: {
    flexDirection: 'row', marginHorizontal: spacing.lg, marginVertical: spacing.sm,
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: 4,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radius.md },
  tabActive: { backgroundColor: colors.primaryGlow },
  tabText: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600' },
  tabTextActive: { color: colors.primary },
  content: { padding: spacing.lg, paddingBottom: 60, gap: spacing.md },
  searchCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.sm,
  },
  input: {
    backgroundColor: colors.bgElevated, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    color: colors.textPrimary, fontSize: fontSize.md, padding: spacing.md,
  },
  searchBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md,
  },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: fontSize.md },
  companionCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.sm,
  },
  companionHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  companionAvatar: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  companionAvatarText: { color: '#fff', fontSize: fontSize.xl, fontWeight: '800' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  companionName: { color: colors.textPrimary, fontSize: fontSize.md, fontWeight: '700' },
  vBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: colors.successGlow, borderRadius: radius.full,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  vBadgeText: { color: colors.success, fontSize: 10, fontWeight: '700' },
  routeText: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 2 },
  timeText: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
  interestRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  interestGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  interestChip: {
    paddingHorizontal: spacing.sm, paddingVertical: 5, borderRadius: radius.full,
    backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border,
  },
  interestChipActive: { backgroundColor: colors.primaryGlow, borderColor: colors.primary },
  interestText: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '600' },
  interestTextActive: { color: colors.primary },
  connectBtn: {
    backgroundColor: colors.accent, borderRadius: radius.md, padding: spacing.sm, alignItems: 'center',
  },
  connectBtnText: { color: '#fff', fontWeight: '700', fontSize: fontSize.sm },
  postCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: spacing.md,
  },
  postTitle: { color: colors.textPrimary, fontSize: fontSize.xl, fontWeight: '800' },
  postSub: { color: colors.textMuted, fontSize: fontSize.sm },
  fieldLabel: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '700', letterSpacing: 2 },
  postBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md,
  },
  postBtnText: { color: '#fff', fontWeight: '700', fontSize: fontSize.md },
});
