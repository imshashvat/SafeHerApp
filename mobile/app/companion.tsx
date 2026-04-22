import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, fontSize, spacing, radius } from '../constants/theme';

const COMPANIONS_KEY = '@safeher_companions';

type CompanionRequest = {
  id: string;
  name: string;
  from: string;
  to: string;
  time: string;
  notes: string;
  timestamp: number;
};

export default function CompanionScreen() {
  const router = useRouter();
  const [requests, setRequests] = useState<CompanionRequest[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');

  // Load from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(COMPANIONS_KEY);
        if (raw) setRequests(JSON.parse(raw));
      } catch (err) {
        console.error('Failed to load companion requests', err);
      }
    })();
  }, []);

  const save = async (updated: CompanionRequest[]) => {
    setRequests(updated);
    try {
      await AsyncStorage.setItem(COMPANIONS_KEY, JSON.stringify(updated));
    } catch (err) { console.error('Failed to save', err); }
  };

  const addRequest = () => {
    if (!from.trim() || !to.trim()) {
      Alert.alert('Missing info', 'Please fill in From and To fields.');
      return;
    }
    const newReq: CompanionRequest = {
      id: Date.now().toString(),
      name: name.trim() || 'Anonymous',
      from: from.trim(),
      to: to.trim(),
      time: time.trim() || 'Flexible',
      notes: notes.trim(),
      timestamp: Date.now(),
    };
    save([newReq, ...requests]);
    setName(''); setFrom(''); setTo(''); setTime(''); setNotes('');
    setShowCreate(false);
  };

  const deleteRequest = (id: string) => {
    Alert.alert('Delete Request', 'Remove this companion request?', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => save(requests.filter(r => r.id !== id)) },
    ]);
  };

  function timeAgo(ts: number) {
    const diff = (Date.now() - ts) / 1000;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Travel Companion</Text>
          <Text style={styles.subtitle}>
            Find safe travel partners · {requests.length} requests
          </Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreate(!showCreate)}>
          <Ionicons name={showCreate ? 'close' : 'add'} size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Create form */}
        {showCreate && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Post a Companion Request</Text>
            <TextInput
              style={styles.input}
              placeholder="Your name (optional)"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="From (e.g. Noida Sector 62)"
              placeholderTextColor={colors.textMuted}
              value={from}
              onChangeText={setFrom}
            />
            <TextInput
              style={styles.input}
              placeholder="To (e.g. Connaught Place)"
              placeholderTextColor={colors.textMuted}
              value={to}
              onChangeText={setTo}
            />
            <TextInput
              style={styles.input}
              placeholder="Preferred time (e.g. Tomorrow 9am)"
              placeholderTextColor={colors.textMuted}
              value={time}
              onChangeText={setTime}
            />
            <TextInput
              style={[styles.input, { minHeight: 60, textAlignVertical: 'top' }]}
              placeholder="Any notes (optional)"
              placeholderTextColor={colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
            <TouchableOpacity style={styles.submitBtn} onPress={addRequest}>
              <Text style={styles.submitBtnText}>Post Request</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Requests list */}
        {requests.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No companion requests yet</Text>
            <Text style={styles.emptySub}>
              Post a request to find a safe travel partner{'\n'}for your next journey.
            </Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowCreate(true)}>
              <Text style={styles.emptyBtnText}>Create Request</Text>
            </TouchableOpacity>
          </View>
        ) : (
          requests.map((req) => (
            <View key={req.id} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{req.name.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.requestName}>{req.name}</Text>
                  <Text style={styles.requestTime}>{timeAgo(req.timestamp)}</Text>
                </View>
                <TouchableOpacity onPress={() => deleteRequest(req.id)}>
                  <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.routeRow}>
                <View style={styles.routePoint}>
                  <Ionicons name="location" size={14} color={colors.primary} />
                  <Text style={styles.routeText}>{req.from}</Text>
                </View>
                <Ionicons name="arrow-forward" size={12} color={colors.textMuted} style={{ marginHorizontal: 4 }} />
                <View style={styles.routePoint}>
                  <Ionicons name="flag" size={14} color={colors.accent} />
                  <Text style={styles.routeText}>{req.to}</Text>
                </View>
              </View>

              <View style={styles.timeRow}>
                <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                <Text style={styles.timeText}>{req.time}</Text>
              </View>

              {req.notes ? <Text style={styles.notes}>{req.notes}</Text> : null}
            </View>
          ))
        )}

        {/* Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>🔒 Safety Tips for Travel Companions</Text>
          <Text style={styles.infoText}>• Always meet in public, well-lit areas</Text>
          <Text style={styles.infoText}>• Share your travel plans with guardians</Text>
          <Text style={styles.infoText}>• Keep SafeHer SOS ready during travel</Text>
          <Text style={styles.infoText}>• Verify your companion's identity before travelling</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { padding: 4 },
  title: { color: colors.textPrimary, fontSize: fontSize.xl, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 1 },
  addBtn: {
    backgroundColor: colors.primary, borderRadius: radius.full,
    width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
  },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 60 },
  formCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.sm,
  },
  formTitle: { color: colors.textPrimary, fontSize: fontSize.md, fontWeight: '700' },
  input: {
    backgroundColor: colors.bgElevated, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    color: colors.textPrimary, fontSize: fontSize.md,
    padding: spacing.sm + 4,
  },
  submitBtn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    padding: spacing.md, alignItems: 'center',
  },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: fontSize.md },
  empty: { alignItems: 'center', paddingVertical: 60, gap: spacing.md },
  emptyTitle: { color: colors.textPrimary, fontSize: fontSize.xxl, fontWeight: '800' },
  emptySub: { color: colors.textMuted, fontSize: fontSize.md, textAlign: 'center', lineHeight: 22 },
  emptyBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: fontSize.md },
  requestCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.sm,
  },
  requestHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: fontSize.md },
  requestName: { color: colors.textPrimary, fontSize: fontSize.sm, fontWeight: '700' },
  requestTime: { color: colors.textMuted, fontSize: fontSize.xs },
  routeRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  routePoint: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  routeText: { color: colors.textSecondary, fontSize: fontSize.sm },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  timeText: { color: colors.textMuted, fontSize: fontSize.sm },
  notes: { color: colors.textSecondary, fontSize: fontSize.sm, fontStyle: 'italic', lineHeight: 20 },
  infoCard: {
    backgroundColor: 'rgba(124,58,237,0.08)', borderRadius: radius.md,
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.2)', padding: spacing.md, gap: spacing.xs,
  },
  infoTitle: { color: colors.accent, fontSize: fontSize.sm, fontWeight: '700' },
  infoText: { color: colors.textSecondary, fontSize: fontSize.xs, lineHeight: 18 },
});
