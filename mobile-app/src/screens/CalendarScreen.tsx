import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, addDays, subDays, isSameDay, parseISO } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { useReminders, useMedicines, useChores, useMedicineLogs } from '../hooks/useData';

const BURNT_ORANGE = '#D2691E';

export default function CalendarScreen() {
  const { familyId } = useAuth();
  const { data: reminders = [], refetch: refetchReminders } = useReminders(familyId);
  const { data: medicines = [], refetch: refetchMeds } = useMedicines(familyId);
  const { data: medicineLogs = [] } = useMedicineLogs(familyId);
  const { data: chores = [], refetch: refetchChores } = useChores(familyId);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchReminders(), refetchMeds(), refetchChores()]);
    setRefreshing(false);
  };

  const goToPrevDay = () => setSelectedDate(subDays(selectedDate, 1));
  const goToNextDay = () => setSelectedDate(addDays(selectedDate, 1));
  const goToToday = () => setSelectedDate(new Date());

  const getEventsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const events: any[] = [];

    reminders.forEach((r: any) => {
      if (r.isActive && isSameDay(parseISO(r.startTime), date)) {
        events.push({
          id: r.id,
          type: 'reminder',
          title: r.title,
          time: format(parseISO(r.startTime), 'h:mm a'),
          icon: 'notifications',
          color: '#8b5cf6',
        });
      }
    });

    medicines.filter((m: any) => m.active).forEach((m: any) => {
      const times = m.schedule?.times || [];
      const loggedTimes = medicineLogs
        .filter((l: any) => l.medicineId === m.id && isSameDay(parseISO(l.takenAt), date))
        .map((l: any) => l.scheduledTime);
      
      times.forEach((time: string) => {
        events.push({
          id: `${m.id}-${time}`,
          type: 'medicine',
          title: m.name,
          time: time,
          icon: 'medkit',
          color: loggedTimes.includes(time) ? '#22c55e' : BURNT_ORANGE,
          completed: loggedTimes.includes(time),
        });
      });
    });

    chores.filter((c: any) => c.dueDate === dateStr).forEach((c: any) => {
      events.push({
        id: c.id,
        type: 'chore',
        title: c.title,
        time: 'All day',
        icon: 'checkbox',
        color: c.status === 'COMPLETED' ? '#22c55e' : '#f59e0b',
        completed: c.status === 'COMPLETED',
      });
    });

    return events.sort((a, b) => a.time.localeCompare(b.time));
  };

  const selectedEvents = getEventsForDate(selectedDate);
  const isToday = isSameDay(selectedDate, new Date());

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BURNT_ORANGE} />}
    >
      <View style={styles.header}>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => {}}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.dateNav}>
        <TouchableOpacity style={styles.navButton} onPress={goToPrevDay}>
          <Ionicons name="chevron-back" size={24} color={BURNT_ORANGE} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.dateDisplay} onPress={goToToday}>
          <Text style={styles.dateText}>{format(selectedDate, 'EEEE')}</Text>
          <Text style={styles.fullDateText}>{format(selectedDate, 'MMMM d, yyyy')}</Text>
          {isToday && <View style={styles.todayBadge}><Text style={styles.todayText}>Today</Text></View>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} onPress={goToNextDay}>
          <Ionicons name="chevron-forward" size={24} color={BURNT_ORANGE} />
        </TouchableOpacity>
      </View>

      <View style={styles.eventsSection}>
        {selectedEvents.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>No events for this day</Text>
          </View>
        ) : (
          selectedEvents.map((event) => (
            <View key={event.id} style={styles.eventCard}>
              <View style={[styles.eventIcon, { backgroundColor: event.color }]}>
                <Ionicons name={event.icon as any} size={20} color="#fff" />
              </View>
              <View style={styles.eventContent}>
                <Text style={[styles.eventTitle, event.completed && styles.eventCompleted]}>
                  {event.title}
                </Text>
                <View style={styles.eventMeta}>
                  <Ionicons name="time-outline" size={12} color="#6b7280" />
                  <Text style={styles.eventTime}>{event.time}</Text>
                  <View style={[styles.eventTypeBadge, { backgroundColor: `${event.color}20` }]}>
                    <Text style={[styles.eventTypeText, { color: event.color }]}>{event.type}</Text>
                  </View>
                </View>
              </View>
              {event.completed && (
                <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: BURNT_ORANGE,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  cancelButtonText: {
    color: BURNT_ORANGE,
    fontSize: 14,
    fontWeight: '500',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: BURNT_ORANGE,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(210,105,30,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateDisplay: {
    alignItems: 'center',
  },
  dateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  fullDateText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  todayBadge: {
    marginTop: 4,
    backgroundColor: BURNT_ORANGE,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  todayText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  eventsSection: {
    padding: 16,
  },
  eventCard: {
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
  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventContent: {
    marginLeft: 12,
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  eventCompleted: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  eventTime: {
    fontSize: 13,
    color: '#6b7280',
    marginRight: 8,
  },
  eventTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  eventTypeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  emptyCard: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
});
