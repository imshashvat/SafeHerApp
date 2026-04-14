import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { HELPLINES } from '../constants/helplines';
import { quickCall } from '../services/alertService';
import { colors, fontSize, spacing, radius } from '../constants/theme';

const TIPS = [
  {
    category: 'Self Defense',
    icon: '🥋',
    items: [
      'Aim for eyes, nose, throat, and knees — most vulnerable points.',
      'Use your elbow — it\'s stronger than a punch in close range.',
      'A firm "STOP! FIRE! HELP!" shout attracts more attention than "Help!".',
      'Keep your keys between your fingers when walking alone at night.',
      'Trust your gut — leave any situation that feels unsafe immediately.',
    ],
  },
  {
    category: 'Travel Safety',
    icon: '🚗',
    items: [
      'Always share your live location with a trusted person before solo travel.',
      'Verify cab/auto details — screenshot and send to a guardian.',
      'Sit behind the driver, not the front seat.',
      'Keep at least 20% phone battery before stepping out.',
      'Know the nearest police station and hospital on your route.',
    ],
  },
  {
    category: 'Legal Rights',
    icon: '⚖️',
    items: [
      'You have the right to file FIR at any police station regardless of jurisdiction.',
      'Molestation in public is an offense under IPC 354 — file a complaint.',
      'Your name cannot be published in a rape case — you have the right to anonymity.',
      'Zero FIR: File at any station; it transfers to the relevant station.',
      'Domestic violence: Protection Orders under DV Act 2005 are your right.',
    ],
  },
  {
    category: 'Digital Safety',
    icon: '🔒',
    items: [
      'Regularly review which apps have access to your location.',
      'Use a strong PIN code, not a pattern lock.',
      'Report cyberstalking at cybercrime.gov.in or call 1930.',
      'Avoid sharing live location on social media publicly.',
      'Enable Find My Device to locate/wipe phone if stolen.',
    ],
  },
];

export default function SafetyHubScreen() {
  const router = useRouter();
  const [expanded, setExpanded] = React.useState<string | null>(null);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Safety Hub</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Emergency strip */}
        <TouchableOpacity
          style={styles.emergencyStrip}
          onPress={() => quickCall('112')}
        >
          <Ionicons name="alert-circle" size={24} color="#fff" />
          <Text style={styles.emergencyText}>Emergency? Call 112 Now</Text>
          <Ionicons name="call" size={22} color="#fff" />
        </TouchableOpacity>

        {/* Helplines */}
        <Text style={styles.sectionLabel}>HELPLINES</Text>
        <View style={styles.helplinesGrid}>
          {HELPLINES.map((h) => (
            <TouchableOpacity
              key={h.number}
              style={styles.helplineCard}
              onPress={() => quickCall(h.number)}
              activeOpacity={0.75}
            >
              <Ionicons name="call" size={20} color={colors.primary} />
              <Text style={styles.helplineNum}>{h.number}</Text>
              <Text style={styles.helplineName}>{h.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Safety tips accordion */}
        <Text style={styles.sectionLabel}>SAFETY TIPS & LEGAL RIGHTS</Text>
        {TIPS.map((section) => (
          <View key={section.category} style={styles.accordion}>
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => setExpanded(expanded === section.category ? null : section.category)}
              activeOpacity={0.8}
            >
              <Text style={styles.accordionEmoji}>{section.icon}</Text>
              <Text style={styles.accordionTitle}>{section.category}</Text>
              <Ionicons
                name={expanded === section.category ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.textMuted}
              />
            </TouchableOpacity>
            {expanded === section.category && (
              <View style={styles.accordionBody}>
                {section.items.map((tip, i) => (
                  <View key={i} style={styles.tipRow}>
                    <Text style={styles.tipBullet}>{i + 1}</Text>
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        {/* Nearby resources */}
        <Text style={styles.sectionLabel}>NEARBY RESOURCES</Text>
        <View style={styles.resourcesCard}>
          {[
            { label: 'Nearest Police Station', icon: 'shield', query: 'police+station+near+me' },
            { label: 'Nearest Hospital', icon: 'medical', query: 'hospital+near+me' },
            { label: 'Women\'s Shelter', icon: 'home', query: 'women+shelter+near+me' },
            { label: 'Safe Spots Near Me', icon: 'location', query: 'pharmacy+24+hours+near+me' },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.resourceRow}
              onPress={() => Linking.openURL(`https://maps.google.com/?q=${item.query}`)}
            >
              <View style={styles.resourceIcon}>
                <Ionicons name={item.icon as any} size={18} color={colors.accent} />
              </View>
              <Text style={styles.resourceLabel}>{item.label}</Text>
              <Ionicons name="open-outline" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
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
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 60 },
  emergencyStrip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.sosRed, borderRadius: radius.lg, padding: spacing.md + 4,
  },
  emergencyText: { flex: 1, color: '#fff', fontSize: fontSize.lg, fontWeight: '800', marginLeft: spacing.sm },
  sectionLabel: {
    color: colors.textMuted, fontSize: fontSize.xs,
    fontWeight: '700', letterSpacing: 2,
  },
  helplinesGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm,
  },
  helplineCard: {
    width: '47%', backgroundColor: colors.bgCard, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, alignItems: 'center', gap: 4,
  },
  helplineNum: { color: colors.primary, fontSize: fontSize.xl, fontWeight: '900' },
  helplineName: { color: colors.textMuted, fontSize: 10, textAlign: 'center' },
  accordion: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm,
  },
  accordionEmoji: { fontSize: 22 },
  accordionTitle: { flex: 1, color: colors.textPrimary, fontSize: fontSize.md, fontWeight: '700' },
  accordionBody: { padding: spacing.md, paddingTop: 0, gap: spacing.sm },
  tipRow: { flexDirection: 'row', gap: spacing.sm },
  tipBullet: {
    color: colors.primary, fontWeight: '800', fontSize: fontSize.sm,
    minWidth: 18,
  },
  tipText: { flex: 1, color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 20 },
  resourcesCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  resourceRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  resourceIcon: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: colors.accentGlow, alignItems: 'center', justifyContent: 'center',
  },
  resourceLabel: { flex: 1, color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: '600' },
});
