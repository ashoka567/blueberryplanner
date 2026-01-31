import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, isToday, parseISO } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { useMedicines, useMedicineLogs, useChores, useReminders, useCreateReminder } from '../hooks/useData';

const BURNT_ORANGE = '#D2691E';

export default function DashboardScreen() {
  const { user, familyId, logout } = useAuth();
  const { data: medicines = [], isLoading: medsLoading, refetch: refetchMeds } = useMedicines(familyId);
  const { data: medicineLogs = [] } = useMedicineLogs(familyId);
  const { data: chores = [], isLoading: choresLoading, refetch: refetchChores } = useChores(familyId);
  const { data: reminders = [], isLoading: remindersLoading, refetch: refetchReminders } = useReminders(familyId);
  const createReminder = useCreateReminder(familyId);

  const [refreshing, setRefreshing] = useState(false);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [reminderTitle, setReminderTitle] = useState('');

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchMeds(), refetchChores(), refetchReminders()]);
    setRefreshing(false);
  };

  const handleAddReminder = async () => {
    if (!reminderTitle.trim()) return;

    try {
      await createReminder.mutateAsync({
        title: reminderTitle,
        type: 'Custom',
        schedule: { type: 'ONCE' },
        startTime: new Date().toISOString(),
      });
      setReminderTitle('');
      setShowAddReminder(false);
    } catch (error) {
      console.error('Failed to add reminder', error);
    }
  };

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  const todayChores = chores.filter((c: any) => c.dueDate === todayStr && c.status !== 'COMPLETED');
  const pendingMeds = medicines.filter((m: any) => {
    if (!m.active) return false;
    const times = m.schedule?.times || [];
    const loggedTimes = medicineLogs
      .filter((l: any) => l.medicineId === m.id && isToday(parseISO(l.takenAt)))
      .map((l: any) => l.scheduledTime);
    return times.some((t: string) => !loggedTimes.includes(t));
  });

  const upcomingReminders = reminders.filter((r: any) => {
    if (!r.isActive) return false;
    const startTime = new Date(r.startTime);
    return startTime >= today;
  }).slice(0, 3);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BURNT_ORANGE} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name}!</Text>
          <Text style={styles.date}>{format(today, 'EEEE, MMMM d')}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color={BURNT_ORANGE} />
        </TouchableOpacity>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.quickAction}
          onPress={() => setShowAddReminder(true)}
        >
          <Ionicons name="add-circle" size={32} color={BURNT_ORANGE} />
          <Text style={styles.quickActionText}>Add Reminder</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Medications Today</Text>
        {pendingMeds.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="checkmark-circle" size={32} color="#22c55e" />
            <Text style={styles.emptyText}>All medications taken!</Text>
          </View>
        ) : (
          pendingMeds.map((med: any) => (
            <View key={med.id} style={styles.card}>
              <View style={[styles.cardIcon, { backgroundColor: BURNT_ORANGE }]}>
                <Ionicons name="medkit" size={20} color="#fff" />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{med.name}</Text>
                <Text style={styles.cardSubtitle}>
                  {(med.schedule?.times || []).join(', ')}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Chores</Text>
        {todayChores.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="checkmark-circle" size={32} color="#22c55e" />
            <Text style={styles.emptyText}>No pending chores!</Text>
          </View>
        ) : (
          todayChores.map((chore: any) => (
            <View key={chore.id} style={styles.card}>
              <View style={[styles.cardIcon, { backgroundColor: '#f59e0b' }]}>
                <Ionicons name="checkbox-outline" size={20} color="#fff" />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{chore.title}</Text>
                <Text style={styles.cardSubtitle}>{chore.points} points</Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Reminders</Text>
        {upcomingReminders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No upcoming reminders</Text>
          </View>
        ) : (
          upcomingReminders.map((reminder: any) => (
            <View key={reminder.id} style={styles.card}>
              <View style={[styles.cardIcon, { backgroundColor: '#8b5cf6' }]}>
                <Ionicons name="notifications" size={20} color="#fff" />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{reminder.title}</Text>
                <Text style={styles.cardSubtitle}>
                  {format(new Date(reminder.startTime), 'MMM d, h:mm a')}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      <Modal visible={showAddReminder} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Reminder</Text>
            <TextInput
              style={styles.modalInput}
              value={reminderTitle}
              onChangeText={setReminderTitle}
              placeholder="Reminder title"
              placeholderTextColor="#9ca3af"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowAddReminder(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalAddButton}
                onPress={handleAddReminder}
              >
                <Text style={styles.modalAddText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: BURNT_ORANGE,
  },
  date: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
  },
  quickActions: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'center',
  },
  quickAction: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionText: {
    marginTop: 8,
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: BURNT_ORANGE,
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    marginLeft: 12,
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  emptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: BURNT_ORANGE,
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelButton: {
    padding: 12,
  },
  modalCancelText: {
    color: '#6b7280',
    fontSize: 16,
  },
  modalAddButton: {
    backgroundColor: BURNT_ORANGE,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  modalAddText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
