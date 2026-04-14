import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useGuardianStore, Guardian } from '../../store/guardianStore';
import { quickCall } from '../../services/alertService';
import { colors, fontSize, spacing, radius } from '../../constants/theme';

type RelationType = 'Mother' | 'Father' | 'Sister' | 'Brother' | 'Friend' | 'Partner' | 'Other';
const RELATIONS: RelationType[] = ['Mother', 'Father', 'Sister', 'Brother', 'Friend', 'Partner', 'Other'];

function AddGuardianForm({ onAdd }: { onAdd: () => void }) {
  const { addGuardian, guardians } = useGuardianStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [relation, setRelation] = useState<RelationType>('Friend');

  const handleAdd = () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Required', 'Name and phone are required.');
      return;
    }
    addGuardian({
      id: Date.now().toString(),
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      relation,
      priority: guardians.length + 1,
    });
    setName(''); setPhone(''); setEmail('');
    onAdd();
  };

  return (
    <View style={styles.form}>
      <Text style={styles.formTitle}>Add Guardian</Text>
      <TextInput
        style={styles.input}
        placeholder="Full Name *"
        placeholderTextColor={colors.textMuted}
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Phone Number *"
        placeholderTextColor={colors.textMuted}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Email (for email alerts)"
        placeholderTextColor={colors.textMuted}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {/* Relation picker */}
      <View style={styles.relations}>
        {RELATIONS.map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.relationChip, relation === r && styles.relationChipActive]}
            onPress={() => setRelation(r)}
          >
            <Text style={[styles.relationText, relation === r && styles.relationTextActive]}>
              {r}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.addBtn} onPress={handleAdd} activeOpacity={0.8}>
        <Ionicons name="person-add" size={18} color="#fff" />
        <Text style={styles.addBtnText}>Add Guardian</Text>
      </TouchableOpacity>
    </View>
  );
}

function GuardianCard({ guardian }: { guardian: Guardian }) {
  const { removeGuardian } = useGuardianStore();
  return (
    <View style={styles.card}>
      <View style={styles.cardAvatar}>
        <Text style={styles.cardAvatarText}>{guardian.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{guardian.name}</Text>
        <Text style={styles.cardSub}>{guardian.relation} · {guardian.phone}</Text>
        {guardian.email ? <Text style={styles.cardEmail}>{guardian.email}</Text> : null}
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity onPress={() => quickCall(guardian.phone)} style={styles.iconBtn}>
          <Ionicons name="call" size={20} color={colors.success} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => Alert.alert('Remove', `Remove ${guardian.name}?`, [
            { text: 'Cancel' },
            { text: 'Remove', style: 'destructive', onPress: () => removeGuardian(guardian.id) },
          ])}
          style={styles.iconBtn}
        >
          <Ionicons name="trash-outline" size={20} color={colors.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function GuardiansScreen() {
  const router = useRouter();
  const { guardians } = useGuardianStore();
  const [showForm, setShowForm] = useState(false);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>My Guardians</Text>
        <TouchableOpacity onPress={() => setShowForm(!showForm)} style={styles.plusBtn}>
          <Ionicons name={showForm ? 'close' : 'add'} size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={guardians}
        keyExtractor={(g) => g.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            {showForm && <AddGuardianForm onAdd={() => setShowForm(false)} />}
            {guardians.length === 0 && !showForm && (
              <View style={styles.empty}>
                <Ionicons name="people-outline" size={64} color={colors.textMuted} />
                <Text style={styles.emptyText}>No guardians added yet</Text>
                <Text style={styles.emptySubText}>
                  Add emergency contacts who will receive SOS alerts
                </Text>
                <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowForm(true)}>
                  <Text style={styles.emptyBtnText}>Add First Guardian</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        }
        renderItem={({ item }) => <GuardianCard guardian={item} />}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { marginRight: spacing.sm, padding: 4 },
  title: { flex: 1, color: colors.textPrimary, fontSize: fontSize.xl, fontWeight: '700' },
  plusBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { padding: spacing.lg, paddingBottom: 60 },
  form: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  formTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontSize: fontSize.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  relations: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  relationChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  relationChipActive: { backgroundColor: colors.primaryGlow, borderColor: colors.primary },
  relationText: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '600' },
  relationTextActive: { color: colors.primary },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  addBtnText: { color: '#fff', fontSize: fontSize.md, fontWeight: '700' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  cardAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardAvatarText: { color: '#fff', fontSize: fontSize.xl, fontWeight: '800' },
  cardInfo: { flex: 1 },
  cardName: { color: colors.textPrimary, fontSize: fontSize.md, fontWeight: '700' },
  cardSub: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 2 },
  cardEmail: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 1 },
  cardActions: { flexDirection: 'row', gap: spacing.xs },
  iconBtn: {
    padding: spacing.sm,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: colors.textSecondary, fontSize: fontSize.xl, fontWeight: '700', marginTop: spacing.lg },
  emptySubText: { color: colors.textMuted, fontSize: fontSize.sm, textAlign: 'center', marginTop: spacing.sm, paddingHorizontal: spacing.xl },
  emptyBtn: {
    marginTop: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: fontSize.md },
});
