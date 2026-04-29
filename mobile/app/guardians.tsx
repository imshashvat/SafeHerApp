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
import { useGuardianStore, Guardian } from '../store/guardianStore';
import { quickCall } from '../services/alertService';
import { fontSize, spacing, radius } from '../constants/theme';
import { useAppTheme } from '../contexts/ThemeContext';

type RelationType = 'Mother' | 'Father' | 'Sister' | 'Brother' | 'Friend' | 'Partner' | 'Other';
const RELATIONS: RelationType[] = ['Mother', 'Father', 'Sister', 'Brother', 'Friend', 'Partner', 'Other'];


function AddGuardianForm({ onAdd, colors }: { onAdd: () => void; colors: any }) {
  const { addGuardian, guardians } = useGuardianStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [relation, setRelation] = useState<RelationType>('Friend');

  const handleAdd = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Required', 'Name and phone are required.');
      return;
    }
    await addGuardian({
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
    <View style={[styles.form, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      <Text style={[styles.formTitle, { color: colors.textPrimary }]}>Add Guardian</Text>
      <TextInput style={[styles.input, { backgroundColor: colors.bgElevated, borderColor: colors.border, color: colors.textPrimary }]} placeholder="Full Name *" placeholderTextColor={colors.textMuted} value={name} onChangeText={setName} />
      <TextInput style={[styles.input, { backgroundColor: colors.bgElevated, borderColor: colors.border, color: colors.textPrimary }]} placeholder="Phone Number *" placeholderTextColor={colors.textMuted} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <TextInput style={[styles.input, { backgroundColor: colors.bgElevated, borderColor: colors.border, color: colors.textPrimary }]} placeholder="Email (for email alerts)" placeholderTextColor={colors.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <View style={styles.relations}>
        {RELATIONS.map((r) => (
          <TouchableOpacity key={r} style={[styles.relationChip, { backgroundColor: colors.bgElevated, borderColor: colors.border }, relation === r && { backgroundColor: colors.primaryGlow, borderColor: colors.primary }]} onPress={() => setRelation(r)}>
            <Text style={[styles.relationText, { color: colors.textMuted }, relation === r && { color: colors.primary }]}>{r}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={handleAdd} activeOpacity={0.8}>
        <Ionicons name="person-add" size={18} color="#fff" />
        <Text style={styles.addBtnText}>Add Guardian</Text>
      </TouchableOpacity>
    </View>
  );
}

function GuardianCard({ guardian, colors }: { guardian: Guardian; colors: any }) {
  const { removeGuardian, updateGuardian } = useGuardianStore();
  const [editing, setEditing] = useState(false);
  const [eName,     setEName]     = useState(guardian.name);
  const [ePhone,    setEPhone]    = useState(guardian.phone);
  const [eEmail,    setEEmail]    = useState(guardian.email ?? '');
  const [eRelation, setERelation] = useState<RelationType>((guardian.relation as RelationType) ?? 'Friend');

  const saveEdit = async () => {
    if (!eName.trim() || !ePhone.trim()) {
      Alert.alert('Required', 'Name and phone are required.');
      return;
    }
    await updateGuardian(guardian.id, {
      name: eName.trim(), phone: ePhone.trim(),
      email: eEmail.trim(), relation: eRelation,
    });
    setEditing(false);
  };

  if (editing) {
    return (
      <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.primary }]}>
        <Text style={[styles.cardName, { color: colors.primary, marginBottom: 8 }]}>Edit Guardian</Text>
        <TextInput style={[styles.editInput, { backgroundColor: colors.bgElevated, borderColor: colors.border, color: colors.textPrimary }]} value={eName}  onChangeText={setEName}  placeholder="Name *"  placeholderTextColor={colors.textMuted} />
        <TextInput style={[styles.editInput, { backgroundColor: colors.bgElevated, borderColor: colors.border, color: colors.textPrimary }]} value={ePhone} onChangeText={setEPhone} placeholder="Phone *" placeholderTextColor={colors.textMuted} keyboardType="phone-pad" />
        <TextInput style={[styles.editInput, { backgroundColor: colors.bgElevated, borderColor: colors.border, color: colors.textPrimary }]} value={eEmail} onChangeText={setEEmail} placeholder="Email" placeholderTextColor={colors.textMuted} keyboardType="email-address" autoCapitalize="none" />
        <View style={styles.relations}>
          {RELATIONS.map(r => (
            <TouchableOpacity key={r} style={[styles.relationChip, { backgroundColor: colors.bgElevated, borderColor: colors.border }, eRelation === r && { backgroundColor: colors.primaryGlow, borderColor: colors.primary }]} onPress={() => setERelation(r)}>
              <Text style={[styles.relationText, { color: colors.textMuted }, eRelation === r && { color: colors.primary }]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          <TouchableOpacity style={[styles.iconBtn, { flex: 1, backgroundColor: colors.bgElevated, borderColor: colors.border }]} onPress={() => setEditing(false)}>
            <Ionicons name="close" size={18} color={colors.textMuted} />
            <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '600' }}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconBtn, { flex: 2, backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={saveEdit}>
            <Ionicons name="checkmark" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      <View style={[styles.cardAvatar, { backgroundColor: colors.accent }]}>
        <Text style={styles.cardAvatarText}>{guardian.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.cardInfo}>
        <Text style={[styles.cardName, { color: colors.textPrimary }]}>{guardian.name}</Text>
        <Text style={[styles.cardSub,  { color: colors.textMuted }]}>{guardian.relation} · {guardian.phone}</Text>
        {guardian.email ? <Text style={[styles.cardEmail, { color: colors.textMuted }]}>{guardian.email}</Text> : null}
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity onPress={() => setEditing(true)} style={[styles.iconBtn, { backgroundColor: colors.bgElevated, borderColor: colors.border }]}>
          <Ionicons name="create-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => quickCall(guardian.phone)} style={[styles.iconBtn, { backgroundColor: colors.bgElevated, borderColor: colors.border }]}>
          <Ionicons name="call" size={20} color={colors.success} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Alert.alert('Remove', `Remove ${guardian.name}?`, [{ text: 'Cancel' }, { text: 'Remove', style: 'destructive', onPress: () => removeGuardian(guardian.id) }])} style={[styles.iconBtn, { backgroundColor: colors.bgElevated, borderColor: colors.border }]}>
          <Ionicons name="trash-outline" size={20} color={colors.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function GuardiansScreen() {
  const router = useRouter();
  const { guardians } = useGuardianStore();
  const { colors } = useAppTheme();
  const [showForm, setShowForm] = useState(false);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>My Guardians</Text>
        <TouchableOpacity onPress={() => setShowForm(!showForm)} style={[styles.plusBtn, { backgroundColor: colors.primary }]}>
          <Ionicons name={showForm ? 'close' : 'add'} size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={guardians}
        keyExtractor={(g) => g.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            {showForm && <AddGuardianForm onAdd={() => setShowForm(false)} colors={colors} />}
            {guardians.length === 0 && !showForm && (
              <View style={styles.empty}>
                <Ionicons name="people-outline" size={64} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No guardians added yet</Text>
                <Text style={[styles.emptySubText, { color: colors.textMuted }]}>Add emergency contacts who will receive SOS alerts</Text>
                <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: colors.primary }]} onPress={() => setShowForm(true)}>
                  <Text style={styles.emptyBtnText}>Add First Guardian</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        }
        renderItem={({ item }) => <GuardianCard guardian={item} colors={colors} />}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1 },
  backBtn: { marginRight: spacing.sm, padding: 4 },
  title: { flex: 1, fontSize: fontSize.xl, fontWeight: '700' },
  plusBtn: { borderRadius: radius.full, width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing.lg, paddingBottom: 60 },
  form: { borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, marginBottom: spacing.lg },
  formTitle: { fontSize: fontSize.lg, fontWeight: '700', marginBottom: spacing.md },
  input: { borderRadius: radius.md, borderWidth: 1, fontSize: fontSize.md, padding: spacing.md, marginBottom: spacing.sm },
  relations: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  relationChip: { paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1 },
  relationChipActive: {},
  relationText: { fontSize: fontSize.xs, fontWeight: '600' },
  relationTextActive: {},
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.md, padding: spacing.md },
  addBtnText: { color: '#fff', fontSize: fontSize.md, fontWeight: '700' },
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.lg, borderWidth: 1, padding: spacing.md, gap: spacing.md },
  cardAvatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  cardAvatarText: { color: '#fff', fontSize: fontSize.xl, fontWeight: '800' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: fontSize.md, fontWeight: '700' },
  cardSub: { fontSize: fontSize.sm, marginTop: 2 },
  cardEmail: { fontSize: fontSize.xs, marginTop: 1 },
  cardActions: { flexDirection: 'row', gap: spacing.xs },
  iconBtn: { padding: spacing.sm, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  editInput: { borderRadius: radius.md, borderWidth: 1, fontSize: fontSize.md, padding: spacing.sm, marginBottom: spacing.xs },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: fontSize.xl, fontWeight: '700', marginTop: spacing.lg },
  emptySubText: { fontSize: fontSize.sm, textAlign: 'center', marginTop: spacing.sm, paddingHorizontal: spacing.xl },
  emptyBtn: { marginTop: spacing.xl, borderRadius: radius.full, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: fontSize.md },
});
