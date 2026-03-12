/**
 * @file app/(app)/support.tsx
 * @description Support Desk & Admin Ticketing System adapted for North Studio.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  MessageSquare,
  Plus,
  ChevronRight,
  Search,
  Send,
  LifeBuoy,
  ChevronLeft,
  ShieldAlert,
  CheckCircle2,
  Zap,
  Shield,
  ShieldCheck,
  ChevronDown,
  Lock,
  Trash2,
  Clock,
  User,
} from 'lucide-react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  Layout,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { useUserStore } from '@/store/useUserStore';
import { GlassCard } from '@/components/ui/GlassCard';
import { NORTH_THEME } from '@/constants/theme';

const { width } = Dimensions.get('window');

type TicketStatus =
  | 'open'
  | 'underreview'
  | 'in_progress'
  | 'resolved'
  | 'closed';
type TicketPriority = 'low' | 'medium' | 'high';
type UserRole = 'MEMBER' | 'PREMIUM' | 'SUPPORT' | 'MODERATOR' | 'ADMIN';

interface TicketUI {
  id: string;
  subject: string;
  category: string;
  status: TicketStatus;
  priority: TicketPriority;
  created_at: string;
  user_id: string;
  user?: {
    full_name: string;
    role: UserRole;
    avatar_url?: string;
    email: string;
  };
  messages?: MessageUI[];
}

interface MessageUI {
  id: string;
  message: string;
  created_at: string;
  is_internal: boolean;
  user_id: string;
  author?: { full_name: string; role: UserRole; avatar_url?: string };
}

// --- HELPER: ROLE UI ---
const getRoleColor = (role: UserRole | undefined) => {
  switch (role) {
    case 'ADMIN':
      return '#EF4444';
    case 'MODERATOR':
      return '#F59E0B';
    case 'SUPPORT':
      return '#10B981';
    case 'PREMIUM':
      return NORTH_THEME.colors.accent.cyan;
    default:
      return NORTH_THEME.colors.accent.purple; // Member
  }
};

const RoleBadge = ({ role }: { role: UserRole }) => {
  const color = getRoleColor(role);
  let Icon = User;
  let label = 'MEMBER';

  if (role === 'ADMIN') {
    Icon = ShieldAlert;
    label = 'ADMIN';
  } else if (role === 'MODERATOR') {
    Icon = ShieldCheck;
    label = 'MOD';
  } else if (role === 'SUPPORT') {
    Icon = Shield;
    label = 'STAFF';
  } else if (role === 'PREMIUM') {
    Icon = Zap;
    label = 'PRO';
  }

  return (
    <View
      style={[
        styles.roleBadge,
        { backgroundColor: `${color}15`, borderColor: `${color}40` },
      ]}
    >
      <Icon size={10} color={color} />
      <Text style={[styles.roleText, { color }]}>{label}</Text>
    </View>
  );
};

export default function SupportScreen() {
  const { session } = useAuthStore();
  const { profile } = useUserStore();

  const realRole = (profile?.role as UserRole) || 'MEMBER';
  const isStaff = ['ADMIN', 'MODERATOR', 'SUPPORT'].includes(realRole);
  const isAdmin = realRole === 'ADMIN';

  // --- STATE ---
  const [activeTab, setActiveTab] = useState<
    'my_tickets' | 'queue' | 'all_tickets'
  >(isStaff ? 'queue' : 'my_tickets');
  const [tickets, setTickets] = useState<TicketUI[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<TicketUI[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketUI | null>(null);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'detail' | 'create'>(
    'list',
  );
  const [statusModalVisible, setStatusModalVisible] = useState(false);

  // Forms
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Technical Issue');
  const [newInitialMsg, setNewInitialMsg] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  // --- DATA LOADING ---
  const loadData = useCallback(async () => {
    if (!session?.user) return;
    setLoading(true);
    try {
      let query = supabase
        .from('tickets')
        .select(
          `*, user:profiles!tickets_user_id_fkey (full_name, email, role, avatar_url)`,
        );

      if (!isStaff) {
        query = query.eq('user_id', session.user.id);
      } else {
        if (activeTab === 'my_tickets')
          query = query.eq('user_id', session.user.id);
        else if (activeTab === 'queue')
          query = query.in('status', ['open', 'in_progress', 'underreview']);
      }

      const { data, error } = await query.order('created_at', {
        ascending: false,
      });
      if (error) throw error;

      let safeData: TicketUI[] = (data || []).map((t: any) => ({
        ...t,
        user: t.user || { full_name: 'Unknown', role: 'MEMBER' },
      }));

      // Premium & VIP sorting for staff queue
      if (activeTab === 'queue') {
        safeData = safeData.sort((a, b) => {
          const scoreA = a.user?.role === 'PREMIUM' ? 1 : 0;
          const scoreB = b.user?.role === 'PREMIUM' ? 1 : 0;
          if (scoreA !== scoreB) return scoreB - scoreA;
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        });
      }

      setTickets(safeData);
      setFilteredTickets(safeData);
    } catch (e: any) {
      console.error('Load Error:', e);
    } finally {
      setLoading(false);
    }
  }, [session, activeTab, isStaff]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!searchQuery.trim()) setFilteredTickets(tickets);
    else {
      const lower = searchQuery.toLowerCase();
      setFilteredTickets(
        tickets.filter(
          (t) =>
            t.subject.toLowerCase().includes(lower) ||
            t.id.toLowerCase().includes(lower),
        ),
      );
    }
  }, [searchQuery, tickets]);

  const loadTicketDetails = async (ticket: TicketUI) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setSelectedTicket(ticket);
    setViewMode('detail');

    try {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select(
          `*, author:profiles!ticket_messages_user_id_fkey (full_name, role, avatar_url)`,
        )
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const transformedMessages: MessageUI[] = (data || [])
        .filter((msg) => isStaff || !msg.is_internal)
        .map((msg: any) => ({
          ...msg,
          author: msg.author
            ? { ...msg.author, avatar_url: msg.author.avatar_url || undefined }
            : undefined,
        }));

      setSelectedTicket((prev) =>
        prev ? { ...prev, messages: transformedMessages } : null,
      );
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        500,
      );
    } catch (e) {
      console.error(e);
    }
  };

  // --- ACTIONS ---
  const handleSendMessage = async (isInternal: boolean = false) => {
    const content = isInternal ? internalNote : newMessage;
    if (!content.trim() || !selectedTicket || !session) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('ticket_messages').insert({
        ticket_id: selectedTicket.id,
        user_id: session.user.id,
        message: content,
        is_internal: isInternal,
      });

      if (error) throw error;
      if (isInternal) setInternalNote('');
      else setNewMessage('');
      if (Platform.OS !== 'web')
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await loadTicketDetails(selectedTicket);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!newTitle.trim() || !newInitialMsg.trim()) return;
    setIsSubmitting(true);
    try {
      const { data: ticket, error: tErr } = await supabase
        .from('tickets')
        .insert({
          user_id: session!.user.id,
          subject: newTitle,
          category: newCategory,
          status: 'open',
        })
        .select()
        .single();

      if (tErr) throw tErr;

      const { error: mErr } = await supabase.from('ticket_messages').insert({
        ticket_id: ticket.id,
        user_id: session!.user.id,
        message: newInitialMsg,
        is_internal: false,
      });

      if (mErr) throw mErr;

      setNewTitle('');
      setNewInitialMsg('');
      setViewMode('list');
      loadData();
      if (Platform.OS !== 'web')
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!selectedTicket) return;
    const { error } = await supabase
      .from('tickets')
      .update({ status: newStatus })
      .eq('id', selectedTicket.id);
    if (error) return Alert.alert('Update Failed', error.message);
    setSelectedTicket((prev) => (prev ? { ...prev, status: newStatus } : null));
    loadData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return NORTH_THEME.colors.accent.cyan;
      case 'in_progress':
        return '#F59E0B';
      case 'underreview':
        return NORTH_THEME.colors.accent.pink;
      case 'resolved':
        return '#10B981';
      case 'closed':
        return '#64748B';
      default:
        return '#64748B';
    }
  };

  // --- RENDERERS ---
  const renderTicketItem = ({
    item,
    index,
  }: {
    item: TicketUI;
    index: number;
  }) => {
    const statusColor = getStatusColor(item.status);

    return (
      <Animated.View entering={FadeInUp.delay(index * 100).springify()}>
        <GlassCard intensity="medium" style={styles.ticketCard}>
          <TouchableOpacity onPress={() => loadTicketDetails(item)}>
            <View style={styles.ticketCardTop}>
              <View style={{ flex: 1 }}>
                <View style={styles.ticketUserRow}>
                  <RoleBadge role={item.user?.role || 'MEMBER'} />
                  <Text style={styles.ticketUserName}>
                    {item.user?.full_name}
                  </Text>
                </View>
                <View style={styles.ticketSubjectRow}>
                  <MessageSquare
                    size={16}
                    color={NORTH_THEME.colors.accent.purple}
                    style={{ opacity: 0.8 }}
                  />
                  <Text style={styles.ticketTitle} numberOfLines={1}>
                    {item.subject}
                  </Text>
                </View>
                <Text style={styles.ticketSub}>
                  #{item.id.slice(0, 8)} • {item.category}
                </Text>
              </View>
              <ChevronRight size={18} color="#64748B" opacity={0.5} />
            </View>

            <View style={styles.ticketCardBottom}>
              <View
                style={[
                  styles.statusBadge,
                  {
                    borderColor: statusColor,
                    backgroundColor: statusColor + '15',
                  },
                ]}
              >
                <View
                  style={[styles.statusDot, { backgroundColor: statusColor }]}
                />
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {item.status.toUpperCase()}
                </Text>
              </View>
              <View style={styles.ticketDateRow}>
                <Clock size={12} color="#64748B" />
                <Text style={styles.ticketDate}>
                  {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </GlassCard>
      </Animated.View>
    );
  };

  const renderChatMessage = ({
    item,
    index,
  }: {
    item: MessageUI;
    index: number;
  }) => {
    const isMe = item.user_id === session?.user.id;
    const isInternal = item.is_internal;
    const roleColor = getRoleColor(item.author?.role);

    // North Studio Glass Bubble Styling
    const bubbleBg = isMe
      ? `${NORTH_THEME.colors.accent.purple}40`
      : isInternal
        ? 'rgba(245, 158, 11, 0.15)'
        : 'rgba(255,255,255,0.05)';
    const bubbleBorder = isMe
      ? NORTH_THEME.colors.accent.purple
      : isInternal
        ? 'rgba(245, 158, 11, 0.3)'
        : 'rgba(255,255,255,0.1)';

    return (
      <Animated.View
        entering={FadeInUp.delay(index * 50)}
        style={[
          styles.msgRow,
          isMe
            ? { justifyContent: 'flex-end' }
            : { justifyContent: 'flex-start' },
        ]}
      >
        {!isMe && (
          <View style={{ marginRight: 10, alignItems: 'center' }}>
            {item.author?.avatar_url ? (
              <Image
                source={{ uri: item.author.avatar_url }}
                style={styles.chatAvatar}
              />
            ) : (
              <View
                style={[
                  styles.chatAvatarPlaceholder,
                  { backgroundColor: roleColor + '40', borderColor: roleColor },
                ]}
              >
                <Text style={{ color: roleColor, fontWeight: '900' }}>
                  {item.author?.full_name?.[0] || '?'}
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={{ maxWidth: '78%' }}>
          {item.author && (
            <View
              style={[
                styles.msgHeader,
                { justifyContent: isMe ? 'flex-end' : 'flex-start' },
              ]}
            >
              {!isMe && (
                <Text style={styles.msgAuthorName}>
                  {item.author.full_name}
                </Text>
              )}
              <RoleBadge role={item.author.role} />
              {isMe && (
                <Text style={[styles.msgAuthorName, { marginLeft: 6 }]}>
                  You
                </Text>
              )}
            </View>
          )}

          <BlurView
            intensity={20}
            tint="dark"
            style={[
              styles.msgBubble,
              {
                backgroundColor: bubbleBg,
                borderColor: bubbleBorder,
                borderBottomRightRadius: isMe ? 4 : 20,
                borderBottomLeftRadius: isMe ? 20 : 4,
              },
            ]}
          >
            {isInternal && (
              <Text style={styles.internalLabel}>INTERNAL NOTE</Text>
            )}
            <Text style={[styles.msgText, isInternal && { color: '#FCD34D' }]}>
              {item.message}
            </Text>
          </BlurView>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#050508', '#0A0D14']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          {/* LIST VIEW */}
          {viewMode === 'list' && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={loading}
                  onRefresh={loadData}
                  tintColor="#00F0FF"
                />
              }
            >
              <Animated.View
                entering={FadeInDown}
                style={styles.headerContainer}
              >
                <View>
                  <Text style={styles.headerTitle}>Support Center</Text>
                  <Text style={styles.headerSub}>
                    {isStaff ? 'Studio Command Queue' : 'We are here to help'}
                  </Text>
                </View>
                {(!isStaff || activeTab === 'my_tickets') && (
                  <TouchableOpacity
                    style={styles.createBtn}
                    onPress={() => setViewMode('create')}
                  >
                    <LinearGradient
                      colors={[
                        NORTH_THEME.colors.accent.purple,
                        NORTH_THEME.colors.accent.cyan,
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
                    <Plus size={18} color="#FFF" />
                    <Text style={styles.createBtnText}>New Ticket</Text>
                  </TouchableOpacity>
                )}
              </Animated.View>

              <View style={styles.tabContainer}>
                {isStaff && (
                  <>
                    <TouchableOpacity
                      onPress={() => setActiveTab('queue')}
                      style={[
                        styles.tabBtn,
                        activeTab === 'queue' && styles.tabBtnActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.tabText,
                          activeTab === 'queue' && styles.tabTextActive,
                        ]}
                      >
                        Queue
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setActiveTab('all_tickets')}
                      style={[
                        styles.tabBtn,
                        activeTab === 'all_tickets' && styles.tabBtnActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.tabText,
                          activeTab === 'all_tickets' && styles.tabTextActive,
                        ]}
                      >
                        All Tickets
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
                <TouchableOpacity
                  onPress={() => setActiveTab('my_tickets')}
                  style={[
                    styles.tabBtn,
                    activeTab === 'my_tickets' && styles.tabBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === 'my_tickets' && styles.tabTextActive,
                    ]}
                  >
                    My Tickets
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.searchBarContainer}>
                <View style={styles.searchBar}>
                  <Search size={18} color="#64748B" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search tickets..."
                    placeholderTextColor="#64748B"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
              </View>

              {loading ? (
                <ActivityIndicator color="#00F0FF" style={{ marginTop: 40 }} />
              ) : (
                <FlatList
                  data={filteredTickets}
                  renderItem={renderTicketItem}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  contentContainerStyle={{
                    paddingHorizontal: 20,
                    paddingBottom: 100,
                  }}
                  ListEmptyComponent={
                    <Text style={styles.emptyText}>
                      No tickets found in this view.
                    </Text>
                  }
                />
              )}
            </ScrollView>
          )}

          {/* DETAIL VIEW */}
          {viewMode === 'detail' && selectedTicket && (
            <View style={{ flex: 1 }}>
              <GlassCard intensity="medium" style={styles.chatHeader}>
                <TouchableOpacity
                  onPress={() => setViewMode('list')}
                  style={styles.backBtn}
                >
                  <ChevronLeft size={24} color="#FFF" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={styles.chatTitle} numberOfLines={1}>
                    {selectedTicket.subject}
                  </Text>
                  <Text style={styles.chatSub}>
                    Opened by{' '}
                    <Text style={{ color: '#FFF', fontWeight: 'bold' }}>
                      {selectedTicket.user?.full_name}
                    </Text>
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => isStaff && setStatusModalVisible(true)}
                  style={[
                    styles.statusBadge,
                    {
                      borderColor: getStatusColor(selectedTicket.status),
                      backgroundColor: 'rgba(0,0,0,0.5)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(selectedTicket.status) },
                    ]}
                  >
                    {selectedTicket.status.toUpperCase()}
                  </Text>
                  {isStaff && (
                    <ChevronDown
                      size={14}
                      color={getStatusColor(selectedTicket.status)}
                      style={{ marginLeft: 4 }}
                    />
                  )}
                </TouchableOpacity>
              </GlassCard>

              <FlatList
                ref={flatListRef}
                data={selectedTicket.messages}
                renderItem={renderChatMessage}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.chatContent}
              />

              <GlassCard intensity="heavy" style={styles.inputArea}>
                {isStaff && (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={styles.internalHeading}>
                      INTERNAL NOTE (STAFF ONLY)
                    </Text>
                    <View style={styles.internalInputContainer}>
                      <TextInput
                        style={styles.internalInput}
                        placeholder="Add private note..."
                        placeholderTextColor="#64748B"
                        value={internalNote}
                        onChangeText={setInternalNote}
                      />
                      <TouchableOpacity
                        onPress={() => handleSendMessage(true)}
                        style={styles.internalSendBtn}
                      >
                        <Lock size={16} color="#F59E0B" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TextInput
                    style={styles.chatInput}
                    placeholder="Type a reply..."
                    placeholderTextColor="#64748B"
                    value={newMessage}
                    onChangeText={setNewMessage}
                    multiline
                  />
                  <TouchableOpacity
                    style={[
                      styles.sendBtn,
                      !newMessage.trim() && { opacity: 0.5 },
                    ]}
                    onPress={() => handleSendMessage(false)}
                    disabled={!newMessage.trim()}
                  >
                    <Send size={18} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </GlassCard>
            </View>
          )}

          {/* CREATE VIEW */}
          {viewMode === 'create' && (
            <ScrollView style={{ flex: 1, padding: 20 }}>
              <TouchableOpacity
                onPress={() => setViewMode('list')}
                style={{
                  marginBottom: 20,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <ChevronLeft size={24} color="#FFF" />
                <Text
                  style={{ color: '#FFF', fontSize: 16, fontWeight: '700' }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <Text
                style={{
                  color: '#FFF',
                  fontSize: 28,
                  fontWeight: '900',
                  marginBottom: 20,
                }}
              >
                Open Request
              </Text>

              <GlassCard
                intensity="medium"
                style={{ padding: 20, borderRadius: 24 }}
              >
                <Text style={styles.formLabel}>SUBJECT</Text>
                <TextInput
                  style={styles.createInput}
                  placeholder="e.g. Render failed to export"
                  placeholderTextColor="#64748B"
                  value={newTitle}
                  onChangeText={setNewTitle}
                />

                <Text style={[styles.formLabel, { marginTop: 20 }]}>
                  CATEGORY
                </Text>
                <View
                  style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}
                >
                  {['Technical Issue', 'Billing', 'Feature Request'].map(
                    (cat) => (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => setNewCategory(cat)}
                        style={[
                          styles.categoryChip,
                          newCategory === cat && {
                            borderColor: NORTH_THEME.colors.accent.purple,
                            backgroundColor: `${NORTH_THEME.colors.accent.purple}20`,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color: '#FFF',
                            fontSize: 12,
                            fontWeight: 'bold',
                          }}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ),
                  )}
                </View>

                <Text style={[styles.formLabel, { marginTop: 20 }]}>
                  DESCRIPTION
                </Text>
                <TextInput
                  style={[
                    styles.createInput,
                    { height: 120, textAlignVertical: 'top' },
                  ]}
                  placeholder="Provide details..."
                  placeholderTextColor="#64748B"
                  value={newInitialMsg}
                  onChangeText={setNewInitialMsg}
                  multiline
                />

                <TouchableOpacity
                  style={[
                    styles.submitTicketBtn,
                    isSubmitting && { opacity: 0.7 },
                  ]}
                  onPress={handleCreateTicket}
                  disabled={isSubmitting}
                >
                  <LinearGradient
                    colors={[
                      NORTH_THEME.colors.accent.purple,
                      NORTH_THEME.colors.accent.cyan,
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text
                      style={{ color: '#FFF', fontWeight: '900', fontSize: 16 }}
                    >
                      SUBMIT TICKET
                    </Text>
                  )}
                </TouchableOpacity>
              </GlassCard>
            </ScrollView>
          )}

          {/* STATUS MODAL (STAFF) */}
          <Modal visible={statusModalVisible} transparent animationType="fade">
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setStatusModalVisible(false)}
              style={styles.modalOverlay}
            >
              <View style={styles.modalContent}>
                <Text
                  style={{
                    color: '#FFF',
                    fontSize: 18,
                    fontWeight: '900',
                    marginBottom: 20,
                    textAlign: 'center',
                  }}
                >
                  Update Ticket
                </Text>
                {[
                  'open',
                  'in_progress',
                  'underreview',
                  'resolved',
                  'closed',
                ].map((status) => (
                  <TouchableOpacity
                    key={status}
                    onPress={() => handleStatusChange(status as TicketStatus)}
                    style={styles.modalOption}
                  >
                    <Text
                      style={{
                        color: '#FFF',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                      }}
                    >
                      {status}
                    </Text>
                    {selectedTicket?.status === status && (
                      <CheckCircle2
                        color={NORTH_THEME.colors.accent.cyan}
                        size={20}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </Modal>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050508' },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  headerSub: { color: '#64748B', fontSize: 14, fontWeight: '600' },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 100,
    gap: 8,
    overflow: 'hidden',
  },
  createBtnText: { color: '#FFF', fontWeight: '800', fontSize: 14 },

  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20,
  },
  tabBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabBtnActive: {
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderColor: 'rgba(0, 240, 255, 0.3)',
  },
  tabText: { color: '#64748B', fontWeight: '700', fontSize: 13 },
  tabTextActive: { color: '#00F0FF' },

  searchBarContainer: { paddingHorizontal: 20, marginBottom: 20 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  searchInput: { flex: 1, marginLeft: 12, color: '#FFF', fontSize: 15 },
  emptyText: {
    color: '#64748B',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },

  ticketCard: { marginBottom: 12, padding: 16, borderRadius: 24 },
  ticketCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  ticketUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  ticketUserName: { color: '#94A3B8', fontSize: 12, fontWeight: 'bold' },
  ticketSubjectRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ticketTitle: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 16,
    marginBottom: 4,
  },
  ticketSub: {
    color: '#64748B',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  ticketCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  ticketDateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ticketDate: { color: '#64748B', fontSize: 12, fontWeight: '600' },

  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  roleText: {
    fontSize: 9,
    fontWeight: '900',
    marginLeft: 4,
    letterSpacing: 0.5,
  },

  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    gap: 12,
    borderRadius: 0,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatTitle: { color: '#FFF', fontWeight: '900', fontSize: 16 },
  chatSub: { color: '#94A3B8', fontSize: 12, marginTop: 2 },

  chatContent: { padding: 20, paddingBottom: 40 },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 20,
    gap: 12,
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  chatAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  msgHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  msgAuthorName: { color: '#94A3B8', fontSize: 11, fontWeight: 'bold' },
  msgBubble: { paddingHorizontal: 18, paddingVertical: 14, borderWidth: 1 },
  internalLabel: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '900',
    marginBottom: 6,
  },
  msgText: { fontSize: 15, lineHeight: 22, color: '#FFF' },

  inputArea: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 0,
  },
  internalHeading: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '900',
    marginBottom: 8,
  },
  internalInputContainer: { flexDirection: 'row', gap: 10 },
  internalInput: {
    flex: 1,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    color: '#FCD34D',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  internalSendBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  chatInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
    color: '#FFF',
    maxHeight: 120,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    fontSize: 15,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: NORTH_THEME.colors.accent.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },

  formLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 8,
    letterSpacing: 1,
  },
  createInput: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 16,
    color: '#FFF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    fontSize: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  submitTicketBtn: {
    marginTop: 40,
    height: 60,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#0A0D14',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalOption: {
    padding: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
