import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, SafeAreaView, Alert, Modal, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useAppTheme } from '../../contexts/ThemeContext';
import { fontSize, spacing, radius } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import LeafletMapView from '../../components/LeafletMapView';

const POSTS_KEY = '@safeher_community_posts';

type PostTag = 'Incident Alert' | 'Safe Zone' | 'Safety Tip' | 'Support';

const TAG_CONFIG: Record<PostTag, { color: string; icon: string }> = {
  'Incident Alert': { color: '#FF3366', icon: '🚨' },
  'Safe Zone': { color: '#00D4AA', icon: '🟢' },
  'Safety Tip': { color: '#8B5CF6', icon: '💡' },
  'Support': { color: '#F59E0B', icon: '💛' },
};

interface CommunityPost {
  id: string;
  author: string;
  content: string;
  tag: PostTag;
  timestamp: number;
  likes: number;
  likedByMe: boolean;
  location?: string;     // Human-readable area name
  lat?: number;
  lng?: number;
}

function timeAgo(ts: number): string {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

async function fetchAreaName(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=12`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'SafeHer/1.0' } }
    );
    const data = await res.json() as { address?: Record<string, string> };
    const addr = data.address ?? {};
    const area = addr.suburb ?? addr.neighbourhood ?? addr.city_district ?? addr.county ?? addr.city ?? '';
    const city = addr.city ?? addr.town ?? addr.state_district ?? '';
    return area && city && area !== city ? `${area}, ${city}` : area || city || 'Nearby';
  } catch {
    return 'Nearby';
  }
}

export default function CommunityScreen() {
  const { colors } = useAppTheme();
  const { currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'feed' | 'map'>('feed');
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);

  // Compose state
  const [content, setContent] = useState('');
  const [selectedTag, setSelectedTag] = useState<PostTag>('Safety Tip');
  const [submitting, setSubmitting] = useState(false);
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const raw = await AsyncStorage.getItem(POSTS_KEY);
      let loaded: CommunityPost[] = raw ? JSON.parse(raw) : [];

      // Seed demo Indian city incidents on first launch so map shows dots
      if (loaded.length === 0) {
        const SEED: CommunityPost[] = [
          { id: 'seed_1', author: 'SafeHer Community', content: 'Poorly lit lane near Connaught Place metro exit. Avoid after 9pm, use main road.', tag: 'Incident Alert', timestamp: Date.now() - 3600000, likes: 12, likedByMe: false, location: 'Connaught Place, Delhi', lat: 28.6315, lng: 77.2167 },
          { id: 'seed_2', author: 'SafeHer Community', content: 'Bandra station area — safe zone with police patrolling till midnight.', tag: 'Safe Zone', timestamp: Date.now() - 7200000, likes: 28, likedByMe: false, location: 'Bandra, Mumbai', lat: 19.0596, lng: 72.8376 },
          { id: 'seed_3', author: 'SafeHer Community', content: 'Tip: PhonePe Circle app shows verified cabs. Always cross-check before boarding.', tag: 'Safety Tip', timestamp: Date.now() - 14400000, likes: 45, likedByMe: false, location: 'Koramangala, Bangalore', lat: 12.9352, lng: 77.6245 },
          { id: 'seed_4', author: 'SafeHer Community', content: 'Incident reported near Hitech City bus stop late evening. Travel in groups.', tag: 'Incident Alert', timestamp: Date.now() - 86400000, likes: 17, likedByMe: false, location: 'Hitech City, Hyderabad', lat: 17.4471, lng: 78.3780 },
          { id: 'seed_5', author: 'SafeHer Community', content: 'Park Street area has women police officers deployed on weekends. Safe for dining.', tag: 'Safe Zone', timestamp: Date.now() - 172800000, likes: 31, likedByMe: false, location: 'Park Street, Kolkata', lat: 22.5525, lng: 88.3534 },
          { id: 'seed_6', author: 'SafeHer Community', content: 'Auto-rickshaws in T.Nagar demanding extra fare after midnight. Use Ola/Uber.', tag: 'Safety Tip', timestamp: Date.now() - 259200000, likes: 22, likedByMe: false, location: 'T.Nagar, Chennai', lat: 13.0418, lng: 80.2341 },
          { id: 'seed_7', author: 'SafeHer Community', content: 'Stray harassment reported near Sector 18 market. Avoid parking garage at night.', tag: 'Incident Alert', timestamp: Date.now() - 345600000, likes: 9, likedByMe: false, location: 'Sector 18, Noida', lat: 28.5675, lng: 77.3211 },
          { id: 'seed_8', author: 'SafeHer Community', content: 'Support group for survivors meets every Sunday 5pm at WCD office, Aundh.', tag: 'Support', timestamp: Date.now() - 432000000, likes: 54, likedByMe: false, location: 'Aundh, Pune', lat: 18.5590, lng: 73.8080 },
        ];
        loaded = SEED;
        await AsyncStorage.setItem(POSTS_KEY, JSON.stringify(SEED));
      }

      setPosts(loaded);
    } finally {
      setLoading(false);
    }
  };


  const save = async (updated: CommunityPost[]) => {
    await AsyncStorage.setItem(POSTS_KEY, JSON.stringify(updated));
  };

  const fetchMyLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return null;
      // Use cached location instantly, fall back to Low accuracy (fast)
      let loc = await Location.getLastKnownPositionAsync({ maxAge: 120_000 });
      if (!loc) loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      return loc ? { lat: loc.coords.latitude, lng: loc.coords.longitude } : null;
    } catch { return null; }
  };


  const submitPost = async () => {
    if (!content.trim()) { Alert.alert('Empty', 'Please write something.'); return; }
    setSubmitting(true);
    try {
      const loc = await fetchMyLocation();
      setMyLocation(loc);
      const areaName = loc ? await fetchAreaName(loc.lat, loc.lng) : undefined;

      const post: CommunityPost = {
        id: `${Date.now()}_${Math.random()}`,
        author: currentUser?.name || 'SafeHer User',
        content: content.trim(),
        tag: selectedTag,
        timestamp: Date.now(),
        likes: 0,
        likedByMe: false,
        location: areaName,
        lat: loc?.lat,
        lng: loc?.lng,
      };
      const updated = [post, ...posts];
      setPosts(updated);
      await save(updated);
      setContent('');
      setShowCompose(false);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLike = useCallback(async (id: string) => {
    const updated = posts.map(p =>
      p.id === id
        ? { ...p, likes: p.likedByMe ? p.likes - 1 : p.likes + 1, likedByMe: !p.likedByMe }
        : p
    );
    setPosts(updated);
    await save(updated);
  }, [posts]);

  const deletePost = useCallback(async (id: string) => {
    Alert.alert('Delete', 'Remove this post?', [
      { text: 'Cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          const updated = posts.filter(p => p.id !== id);
          setPosts(updated);
          await save(updated);
        }
      },
    ]);
  }, [posts]);

  // Map markers — only posts with coordinates
  const mapPosts = posts.filter(p => p.lat && p.lng);
  const mapCenter = myLocation
    ? [myLocation.lat, myLocation.lng] as [number, number]
    : mapPosts.length > 0 ? [mapPosts[0].lat!, mapPosts[0].lng!] as [number, number] : [20.5937, 78.9629] as [number, number];

  const renderPost = ({ item }: { item: CommunityPost }) => {
    const tagCfg = TAG_CONFIG[item.tag];
    const isOwn = item.author === (currentUser?.name || 'SafeHer User');
    return (
      <View style={[styles.postCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <View style={styles.postHeader}>
          <View style={[styles.postAvatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.postAvatarText}>{item.author.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.postAuthor, { color: colors.textPrimary }]}>{item.author}</Text>
            <View style={styles.postMeta}>
              <Text style={[styles.postTime, { color: colors.textMuted }]}>{timeAgo(item.timestamp)}</Text>
              {item.location && (
                <>
                  <Text style={[styles.postMetaDot, { color: colors.textMuted }]}>·</Text>
                  <Ionicons name="location-outline" size={10} color={colors.textMuted} />
                  <Text style={[styles.postLocation, { color: colors.textMuted }]}>{item.location}</Text>
                </>
              )}
            </View>
          </View>
          <View style={[styles.postTag, { backgroundColor: `${tagCfg.color}18` }]}>
            <Text style={styles.postTagEmoji}>{tagCfg.icon}</Text>
            <Text style={[styles.postTagText, { color: tagCfg.color }]}>{item.tag}</Text>
          </View>
          {isOwn && (
            <TouchableOpacity onPress={() => deletePost(item.id)} style={{ padding: 4 }}>
              <Ionicons name="trash-outline" size={15} color={colors.danger} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={[styles.postContent, { color: colors.textSecondary }]}>{item.content}</Text>
        <View style={[styles.postFooter, { borderTopColor: colors.border }]}>
          <TouchableOpacity style={styles.likeBtn} onPress={() => toggleLike(item.id)}>
            <Ionicons name={item.likedByMe ? 'heart' : 'heart-outline'} size={16} color={item.likedByMe ? '#FF3366' : colors.textMuted} />
            <Text style={[styles.likeCount, { color: item.likedByMe ? '#FF3366' : colors.textMuted }]}>{item.likes}</Text>
          </TouchableOpacity>
          {item.lat && item.lng && (
            <View style={styles.gpsTag}>
              <Ionicons name="navigate" size={10} color={tagCfg.color} />
              <Text style={[styles.gpsTagText, { color: tagCfg.color }]}>GPS tagged</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Community</Text>
        <TouchableOpacity
          style={[styles.composeBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowCompose(true)}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.composeBtnText}>Post</Text>
        </TouchableOpacity>
      </View>

      {/* Sub-tabs */}
      <View style={[styles.subTabs, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
        {(['feed', 'map'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.subTab, activeTab === tab && [styles.subTabActive, { borderBottomColor: colors.primary }]]}
            onPress={() => {
              setActiveTab(tab);
              if (tab === 'map' && !myLocation) fetchMyLocation().then(setMyLocation);
            }}
          >
            <Ionicons
              name={tab === 'feed' ? 'newspaper-outline' : 'map-outline'}
              size={14}
              color={activeTab === tab ? colors.primary : colors.textMuted}
            />
            <Text style={[styles.subTabText, { color: activeTab === tab ? colors.primary : colors.textMuted }]}>
              {tab === 'feed' ? 'Feed' : 'Safety Map'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Feed Tab */}
      {activeTab === 'feed' && (
        loading ? (
          <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />
        ) : (
          <FlatList
            data={posts}
            keyExtractor={p => p.id}
            renderItem={renderPost}
            contentContainerStyle={[styles.feedContent, posts.length === 0 && styles.feedEmpty]}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={{ fontSize: 48 }}>🌸</Text>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Be the First to Post!</Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                  Share safety tips, incident alerts, or words of support.{'\n'}Your post gets GPS-tagged automatically.
                </Text>
              </View>
            }
          />
        )
      )}

      {/* Safety Map Tab */}
      {activeTab === 'map' && (
        <View style={{ flex: 1 }}>
          {mapPosts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 48 }}>🗺️</Text>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No mapped posts yet</Text>
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                Posts with GPS coordinates will appear as pins on this map.
              </Text>
            </View>
          ) : (
            <>
              <LeafletMapView
                style={{ flex: 1 }}
                center={mapCenter}
                zoom={12}
                userLat={myLocation?.lat}
                userLng={myLocation?.lng}
                markers={mapPosts.map(p => ({
                  lat: p.lat!,
                  lng: p.lng!,
                  color: TAG_CONFIG[p.tag].color,
                  popup: `${TAG_CONFIG[p.tag].icon} ${p.tag}: ${p.content.substring(0, 80)}${p.content.length > 80 ? '…' : ''}`,
                }))}
              />
              <View style={[styles.mapLegend, { backgroundColor: colors.bgCard + 'EE', borderColor: colors.border }]}>
                {(Object.entries(TAG_CONFIG) as [PostTag, { color: string; icon: string }][]).map(([tag, cfg]) => (
                  <View key={tag} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: cfg.color }]} />
                    <Text style={[styles.legendText, { color: colors.textMuted }]}>{tag}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>
      )}

      {/* Compose Modal */}
      <Modal visible={showCompose} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalSheet, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>New Post</Text>
                <TouchableOpacity onPress={() => setShowCompose(false)}>
                  <Ionicons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Tag selector */}
              <View style={styles.tagsRow}>
                {(Object.keys(TAG_CONFIG) as PostTag[]).map(tag => (
                  <TouchableOpacity
                    key={tag}
                    style={[
                      styles.tagChip,
                      { backgroundColor: colors.bgElevated, borderColor: colors.border },
                      selectedTag === tag && { backgroundColor: `${TAG_CONFIG[tag].color}20`, borderColor: TAG_CONFIG[tag].color },
                    ]}
                    onPress={() => setSelectedTag(tag)}
                  >
                    <Text style={styles.tagChipEmoji}>{TAG_CONFIG[tag].icon}</Text>
                    <Text style={[styles.tagChipText, { color: selectedTag === tag ? TAG_CONFIG[tag].color : colors.textMuted }]}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={[styles.composeInput, { backgroundColor: colors.bgElevated, borderColor: colors.border, color: colors.textPrimary }]}
                value={content}
                onChangeText={setContent}
                placeholder={
                  selectedTag === 'Incident Alert' ? "Describe the incident — location, type, what happened..."
                  : selectedTag === 'Safe Zone' ? "Why is this area safe? Any facilities, lighting, etc..."
                  : selectedTag === 'Safety Tip' ? "Share a tip to help others stay safe..."
                  : "Share a message of support with the community..."
                }
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={5}
                autoFocus
              />

              <View style={[styles.locationNote, { backgroundColor: colors.primaryGlow }]}>
                <Ionicons name="location" size={13} color={colors.primary} />
                <Text style={[styles.locationNoteText, { color: colors.primary }]}>
                  Your approximate location will be attached to this post
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: TAG_CONFIG[selectedTag].color, opacity: submitting ? 0.7 : 1 }]}
                onPress={submitPost}
                disabled={submitting}
              >
                {submitting
                  ? <ActivityIndicator color="#fff" />
                  : <><Ionicons name="send" size={16} color="#fff" /><Text style={styles.submitBtnText}>Share with Community</Text></>
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1 },
  headerTitle: { fontSize: fontSize.xxl, fontWeight: '900' },
  composeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.full },
  composeBtnText: { color: '#fff', fontWeight: '700', fontSize: fontSize.sm },
  subTabs: { flexDirection: 'row', borderBottomWidth: 1 },
  subTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: spacing.sm, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  subTabActive: {},
  subTabText: { fontSize: fontSize.sm, fontWeight: '700' },
  feedContent: { padding: spacing.md, paddingBottom: 80 },
  feedEmpty: { flex: 1 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  emptyTitle: { fontSize: fontSize.xl, fontWeight: '800', textAlign: 'center' },
  emptySub: { fontSize: fontSize.sm, textAlign: 'center', lineHeight: 22 },
  postCard: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.md, gap: spacing.sm },
  postHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  postAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  postAvatarText: { color: '#fff', fontWeight: '800', fontSize: fontSize.md },
  postMeta: { flexDirection: 'row', alignItems: 'center', gap: 3, flexWrap: 'wrap' },
  postAuthor: { fontSize: fontSize.sm, fontWeight: '700' },
  postTime: { fontSize: fontSize.xs },
  postMetaDot: { fontSize: fontSize.xs },
  postLocation: { fontSize: fontSize.xs },
  postTag: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: radius.full },
  postTagEmoji: { fontSize: 10 },
  postTagText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  postContent: { fontSize: fontSize.sm, lineHeight: 20 },
  postFooter: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingTop: spacing.xs, borderTopWidth: 1 },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  likeCount: { fontSize: fontSize.xs, fontWeight: '600' },
  gpsTag: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 'auto' },
  gpsTagText: { fontSize: 9, fontWeight: '700' },
  mapLegend: { position: 'absolute', bottom: 16, left: 12, right: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: spacing.sm, borderRadius: radius.md, borderWidth: 1 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 9, fontWeight: '600' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, padding: spacing.lg, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  modalTitle: { fontSize: fontSize.xl, fontWeight: '800' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  tagChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1 },
  tagChipEmoji: { fontSize: 13 },
  tagChipText: { fontSize: fontSize.xs, fontWeight: '700' },
  composeInput: { borderRadius: radius.md, borderWidth: 1, padding: spacing.md, fontSize: fontSize.sm, minHeight: 110, textAlignVertical: 'top', marginBottom: spacing.sm },
  locationNote: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: spacing.sm, borderRadius: radius.sm, marginBottom: spacing.sm },
  locationNoteText: { fontSize: fontSize.xs, fontWeight: '600' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.lg, padding: spacing.md },
  submitBtnText: { color: '#fff', fontSize: fontSize.md, fontWeight: '800' },
});
