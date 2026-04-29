import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { HELPLINES } from '../constants/helplines';
import { quickCall } from '../services/alertService';
import { fontSize, spacing, radius } from '../constants/theme';
import { useAppTheme } from '../contexts/ThemeContext';

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
  const { colors } = useAppTheme();
  const [expanded, setExpanded] = React.useState<string | null>(null);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Safety Hub</Text>
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
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>HELPLINES</Text>
        <View style={styles.helplinesGrid}>
          {HELPLINES.map((h) => (
            <TouchableOpacity
              key={h.number}
              style={[styles.helplineCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
              onPress={() => quickCall(h.number)}
              activeOpacity={0.75}
            >
              <Ionicons name="call" size={20} color={colors.primary} />
              <Text style={[styles.helplineNum, { color: colors.primary }]}>{h.number}</Text>
              <Text style={[styles.helplineName, { color: colors.textMuted }]}>{h.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Safety tips accordion */}
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>SAFETY TIPS & LEGAL RIGHTS</Text>
        {TIPS.map((section) => (
          <View key={section.category} style={[styles.accordion, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => setExpanded(expanded === section.category ? null : section.category)}
              activeOpacity={0.8}
            >
              <Text style={styles.accordionEmoji}>{section.icon}</Text>
              <Text style={[styles.accordionTitle, { color: colors.textPrimary }]}>{section.category}</Text>
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
                    <Text style={[styles.tipBullet, { color: colors.primary }]}>{i + 1}</Text>
                    <Text style={[styles.tipText, { color: colors.textSecondary }]}>{tip}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        {/* Nearby resources */}
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>NEARBY RESOURCES</Text>
        <View style={[styles.resourcesCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          {[
            { label: 'Nearest Police Station', icon: 'shield', query: 'police+station+near+me' },
            { label: 'Nearest Hospital', icon: 'medical', query: 'hospital+near+me' },
            { label: "Women's Shelter", icon: 'home', query: 'women+shelter+near+me' },
            { label: 'Safe Spots Near Me', icon: 'location', query: 'pharmacy+24+hours+near+me' },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.resourceRow, { borderBottomColor: colors.border }]}
              onPress={() => Linking.openURL(`https://www.openstreetmap.org/search?query=${item.query}`)}
            >
              <View style={[styles.resourceIcon, { backgroundColor: colors.accentGlow }]}>
                <Ionicons name={item.icon as any} size={18} color={colors.accent} />
              </View>
              <Text style={[styles.resourceLabel, { color: colors.textSecondary }]}>{item.label}</Text>
              <Ionicons name="open-outline" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backBtn: { marginRight: spacing.sm, padding: 4 },
  title: { fontSize: fontSize.xl, fontWeight: '700' },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 60 },
  emergencyStrip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#ff1744', borderRadius: radius.lg, padding: spacing.md + 4,
  },
  emergencyText: { flex: 1, color: '#fff', fontSize: fontSize.lg, fontWeight: '800', marginLeft: spacing.sm },
  sectionLabel: { fontSize: fontSize.xs, fontWeight: '700', letterSpacing: 2 },
  helplinesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  helplineCard: {
    width: '47%', borderRadius: radius.lg,
    borderWidth: 1, padding: spacing.md, alignItems: 'center', gap: 4,
  },
  helplineNum: { fontSize: fontSize.xl, fontWeight: '900' },
  helplineName: { fontSize: 10, textAlign: 'center' },
  accordion: { borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
  accordionHeader: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm },
  accordionEmoji: { fontSize: 22 },
  accordionTitle: { flex: 1, fontSize: fontSize.md, fontWeight: '700' },
  accordionBody: { padding: spacing.md, paddingTop: 0, gap: spacing.sm },
  tipRow: { flexDirection: 'row', gap: spacing.sm },
  tipBullet: { fontWeight: '800', fontSize: fontSize.sm, minWidth: 18 },
  tipText: { flex: 1, fontSize: fontSize.sm, lineHeight: 20 },
  resourcesCard: { borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
  resourceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderBottomWidth: 1 },
  resourceIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  resourceLabel: { flex: 1, fontSize: fontSize.sm, fontWeight: '600' },
});
