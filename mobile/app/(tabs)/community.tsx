import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, fontSize, spacing, radius } from '../../constants/theme';

const POSTS_KEY = '@safeher_posts';

type Post = {
  id: string;
  author: string;
  content: string;
  tag: string;
  timestamp: number;
  likes: number;
};

const TAGS = ['Safety Tip', 'Incident Alert', 'Safe Zone', 'Travel Partner', 'Support'];
const TAG_COLORS: Record<string, string> = {
  'Safety Tip': colors.success,
  'Incident Alert': colors.danger,
  'Safe Zone': colors.accent,
  'Travel Partner': colors.primary,
  'Support': colors.warning,
};

const SAMPLE_POSTS: Post[] = [
  {
    id: '1', author: 'Priya M.', tag: 'Safety Tip',
    content: 'Avoid the underpass near Sector 18 after 9pm — very poorly lit.',
    timestamp: Date.now() - 3600000, likes: 14,
  },
  {
    id: '2', author: 'Ananya K.', tag: 'Safe Zone',
    content: 'The 24/7 pharmacy on MG Road is always open and has security cameras — great safe spot.',
    timestamp: Date.now() - 7200000, likes: 28,
  },
  {
    id: '3', author: 'Sneha R.', tag: 'Travel Partner',
    content: 'Looking for a travel companion from Noida to Connaught Place tomorrow morning ~9am. DM me!',
    timestamp: Date.now() - 1800000, likes: 6,
  },
];

function timeAgo(ts: number) {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function CommunityScreen() {
  const [posts, setPosts] = useState<Post[]>(SAMPLE_POSTS);
  const [showCompose, setShowCompose] = useState(false);
  const [content, setContent] = useState('');
  const [selectedTag, setSelectedTag] = useState(TAGS[0]);
  const [authorName, setAuthorName] = useState('');
  const [filter, setFilter] = useState<string | null>(null);

  const addPost = () => {
    if (!content.trim()) return;
    const newPost: Post = {
      id: Date.now().toString(),
      author: authorName.trim() || 'Anonymous',
      content: content.trim(),
      tag: selectedTag,
      timestamp: Date.now(),
      likes: 0,
    };
    setPosts([newPost, ...posts]);
    setContent(''); setShowCompose(false);
  };

  const likePost = (id: string) => {
    setPosts(posts.map((p) => p.id === id ? { ...p, likes: p.likes + 1 } : p));
  };

  const filtered = filter ? posts.filter((p) => p.tag === filter) : posts;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Community</Text>
          <Text style={styles.subtitle}>Women-only safety network</Text>
        </View>
        <TouchableOpacity
          style={styles.composeBtn}
          onPress={() => setShowCompose(!showCompose)}
        >
          <Ionicons name={showCompose ? 'close' : 'create-outline'} size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Compose */}
        {showCompose && (
          <View style={styles.compose}>
            <TextInput
              style={styles.input}
              placeholder="Your name (optional)"
              placeholderTextColor={colors.textMuted}
              value={authorName}
              onChangeText={setAuthorName}
            />
            <TextInput
              style={[styles.input, styles.inputMulti]}
              placeholder="Share a safety tip, alert, or find travel companions..."
              placeholderTextColor={colors.textMuted}
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={4}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsScroll}>
              {TAGS.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.tag, { borderColor: TAG_COLORS[t] + '88' },
                    selectedTag === t && { backgroundColor: TAG_COLORS[t] + '22' }]}
                  onPress={() => setSelectedTag(t)}
                >
                  <Text style={[styles.tagText, { color: TAG_COLORS[t] }]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.postBtn} onPress={addPost}>
              <Text style={styles.postBtnText}>Post</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}>
          <TouchableOpacity
            style={[styles.filterChip, filter === null && styles.filterChipActive]}
            onPress={() => setFilter(null)}
          >
            <Text style={[styles.filterText, filter === null && styles.filterTextActive]}>All</Text>
          </TouchableOpacity>
          {TAGS.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.filterChip, filter === t && { backgroundColor: TAG_COLORS[t] + '22', borderColor: TAG_COLORS[t] }]}
              onPress={() => setFilter(filter === t ? null : t)}
            >
              <Text style={[styles.filterText, filter === t && { color: TAG_COLORS[t] }]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Posts */}
        <View style={styles.posts}>
          {filtered.map((post) => (
            <View key={post.id} style={styles.postCard}>
              <View style={styles.postHeader}>
                <View style={styles.postAvatar}>
                  <Text style={styles.postAvatarText}>{post.author.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.postAuthor}>{post.author}</Text>
                  <Text style={styles.postTime}>{timeAgo(post.timestamp)}</Text>
                </View>
                <View style={[styles.postTag, { backgroundColor: TAG_COLORS[post.tag] + '22', borderColor: TAG_COLORS[post.tag] + '55' }]}>
                  <Text style={[styles.postTagText, { color: TAG_COLORS[post.tag] }]}>{post.tag}</Text>
                </View>
              </View>
              <Text style={styles.postContent}>{post.content}</Text>
              <TouchableOpacity style={styles.likeRow} onPress={() => likePost(post.id)}>
                <Ionicons name="heart-outline" size={16} color={colors.primary} />
                <Text style={styles.likeCount}>{post.likes}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md,
  },
  title: { color: colors.textPrimary, fontSize: fontSize.xxl, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: fontSize.sm },
  composeBtn: {
    backgroundColor: colors.primary, borderRadius: radius.full,
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
  },
  compose: {
    marginHorizontal: spacing.lg, backgroundColor: colors.bgCard,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, gap: spacing.sm, marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.bgElevated, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    color: colors.textPrimary, fontSize: fontSize.md,
    padding: spacing.sm + 4,
  },
  inputMulti: { minHeight: 90, textAlignVertical: 'top' },
  tagsScroll: { marginVertical: spacing.xs },
  tag: {
    marginRight: spacing.xs, paddingHorizontal: spacing.sm, paddingVertical: 5,
    borderRadius: radius.full, borderWidth: 1, borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  tagText: { fontSize: fontSize.xs, fontWeight: '600' },
  postBtn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    padding: spacing.md, alignItems: 'center',
  },
  postBtnText: { color: '#fff', fontWeight: '700', fontSize: fontSize.md },
  filterScroll: { marginBottom: spacing.sm },
  filterContent: { paddingHorizontal: spacing.lg, gap: spacing.xs },
  filterChip: {
    paddingHorizontal: spacing.md, paddingVertical: 6,
    borderRadius: radius.full, backgroundColor: colors.bgCard,
    borderWidth: 1, borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.primaryGlow, borderColor: colors.primary },
  filterText: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '600' },
  filterTextActive: { color: colors.primary },
  posts: { padding: spacing.lg, paddingTop: 0, gap: spacing.md, paddingBottom: 60 },
  postCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.sm,
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  postAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  postAvatarText: { color: '#fff', fontWeight: '800', fontSize: fontSize.md },
  postAuthor: { color: colors.textPrimary, fontSize: fontSize.sm, fontWeight: '700' },
  postTime: { color: colors.textMuted, fontSize: fontSize.xs },
  postTag: {
    paddingHorizontal: spacing.xs + 2, paddingVertical: 3,
    borderRadius: radius.full, borderWidth: 1,
  },
  postTagText: { fontSize: 10, fontWeight: '700' },
  postContent: { color: colors.textSecondary, fontSize: fontSize.md, lineHeight: 22 },
  likeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  likeCount: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '600' },
});
