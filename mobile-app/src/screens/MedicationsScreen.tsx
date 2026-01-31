import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  TextInput,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, isToday, parseISO, isBefore, startOfDay } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { useMedicines, useMedicineLogs, useCreateMedicine, useCreateMedicineLog, useDeleteMedicine } from '../hooks/useData';

const BURNT_ORANGE = '#D2691E';
const BURNT_ORANGE_LIGHT = '#E8954C';

export default function MedicationsScreen() {
  const { familyId } = useAuth();
  const { data: medicines = [], isLoading, refetch } = useMedicines(familyId);
  const { data: medicineLogs = [] } = useMedicineLogs(familyId);
  const createMedicine = useCreateMedicine(familyId);
  const createLog = useCreateMedicineLog(familyId);
  const deleteMedicine = useDeleteMedicine(familyId);

  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [medForm, setMedForm] = useState({
    name: '',
    quantity: '',
    morning: false,
    afternoon: false,
    evening: false,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleAddMedicine = async () => {
    if (!medForm.name.trim()) return;

    const times: string[] = [];
    if (medForm.morning) times.push('08:00');
    if (medForm.afternoon) times.push('14:00');
    if (medForm.evening) times.push('20:00');

    if (times.length === 0) times.push('08:00');

    try {
      await createMedicine.mutateAsync({
        name: medForm.name,
        schedule: { type: 'DAILY', times },
        inventory: parseInt(medForm.quantity) || 0,
        active: true,
      });
      setMedForm({ name: '', quantity: '', morning: false, afternoon: false, evening: false });
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to add medication', error);
    }
  };

  const handleDeleteMedicine = async (id: string) => {
    try {
      await deleteMedicine.mutateAsync(id);
    } catch (error) {
      console.error('Failed to delete medication', error);
    }
  };

  const handleMarkTaken = async (medicineId: string, scheduledTime: string) => {
    try {
      await createLog.mutateAsync({
        medicineId,
        scheduledTime,
        status: 'TAKEN',
        takenAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to log medication', error);
    }
  };

  const getTimeLabel = (time: string) => {
    if (time === '08:00') return 'Morning';
    if (time === '14:00') return 'Afternoon';
    if (time === '20:00') return 'Evening';
    return time;
  };

  const activeMedicines = medicines.filter((m: any) => m.active);

  const todayStats = useMemo(() => {
    let total = 0;
    let taken = 0;
    activeMedicines.forEach((med: any) => {
      const times = med.schedule?.times || [];
      total += times.length;
      const todayLogs = medicineLogs.filter(
        (l: any) => l.medicineId === med.id && isToday(parseISO(l.takenAt))
      );
      taken += todayLogs.length;
    });
    return { total, taken, percentage: total > 0 ? Math.round((taken / total) * 100) : 0 };
  }, [activeMedicines, medicineLogs]);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BURNT_ORANGE} />}
    >
      <View style={styles.header}>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddForm(!showAddForm)}
          >
            <Ionicons name={showAddForm ? "close" : "add"} size={18} color="#fff" />
            <Text style={styles.addButtonText}>{showAddForm ? 'Cancel' : 'Add'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={() => {}}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>

      {todayStats.total > 0 && (
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Today's Status</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${todayStats.percentage}%` }]} />
            </View>
            <Text style={styles.statsText}>{todayStats.taken}/{todayStats.total} taken</Text>
          </View>
        </View>
      )}

      {showAddForm && (
        <View style={styles.formCard}>
          <View style={styles.formRow}>
            <TextInput
              style={styles.nameInput}
              value={medForm.name}
              onChangeText={(v) => setMedForm({ ...medForm, name: v })}
              placeholder="Medicine name"
              placeholderTextColor="#9ca3af"
            />
            <TextInput
              style={styles.qtyInput}
              value={medForm.quantity}
              onChangeText={(v) => setMedForm({ ...medForm, quantity: v })}
              placeholder="Qty"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.timeRow}>
            <TouchableOpacity
              style={[styles.timeChip, medForm.morning && styles.timeChipActive]}
              onPress={() => setMedForm({ ...medForm, morning: !medForm.morning })}
            >
              <Text style={[styles.timeChipText, medForm.morning && styles.timeChipTextActive]}>Morning</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.timeChip, medForm.afternoon && styles.timeChipActive]}
              onPress={() => setMedForm({ ...medForm, afternoon: !medForm.afternoon })}
            >
              <Text style={[styles.timeChipText, medForm.afternoon && styles.timeChipTextActive]}>Afternoon</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.timeChip, medForm.evening && styles.timeChipActive]}
              onPress={() => setMedForm({ ...medForm, evening: !medForm.evening })}
            >
              <Text style={[styles.timeChipText, medForm.evening && styles.timeChipTextActive]}>Evening</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.submitButton} onPress={handleAddMedicine}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.submitButtonText}>Add Medicine</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.listSection}>
        {activeMedicines.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="medkit-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>No medications added yet</Text>
          </View>
        ) : (
          activeMedicines.map((med: any) => {
            const times = med.schedule?.times || [];
            const todayLogs = medicineLogs.filter(
              (l: any) => l.medicineId === med.id && isToday(parseISO(l.takenAt))
            );
            const loggedTimes = todayLogs.map((l: any) => l.scheduledTime);

            return (
              <View key={med.id} style={styles.medicineCard}>
                <View style={styles.medicineHeader}>
                  <View style={styles.medicineInfo}>
                    <Text style={styles.medicineName}>{med.name}</Text>
                    {med.inventory > 0 && (
                      <Text style={styles.inventory}>{med.inventory} left</Text>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteMedicine(med.id)}>
                    <Ionicons name="trash-outline" size={20} color="#9ca3af" />
                  </TouchableOpacity>
                </View>

                <View style={styles.timesContainer}>
                  {times.map((time: string) => {
                    const taken = loggedTimes.includes(time);
                    return (
                      <TouchableOpacity
                        key={time}
                        style={[styles.timeButton, taken && styles.timeButtonTaken]}
                        onPress={() => !taken && handleMarkTaken(med.id, time)}
                        disabled={taken}
                      >
                        <Ionicons
                          name={taken ? 'checkmark-circle' : 'ellipse-outline'}
                          size={18}
                          color={taken ? '#fff' : BURNT_ORANGE}
                        />
                        <Text style={[styles.timeText, taken && styles.timeTextTaken]}>
                          {getTimeLabel(time)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
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
    paddingVertical: 8,
    borderRadius: 6,
  },
  cancelButtonText: {
    color: BURNT_ORANGE,
    fontSize: 14,
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: BURNT_ORANGE,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  statsCard: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 4,
  },
  statsText: {
    fontSize: 14,
    fontWeight: '600',
    color: BURNT_ORANGE,
  },
  formCard: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  nameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  qtyInput: {
    width: 70,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    textAlign: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  timeChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  timeChipActive: {
    backgroundColor: BURNT_ORANGE,
    borderColor: BURNT_ORANGE,
  },
  timeChipText: {
    fontSize: 12,
    color: '#6b7280',
  },
  timeChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: BURNT_ORANGE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listSection: {
    padding: 16,
    paddingTop: 8,
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  medicineCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  medicineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  medicineInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  inventory: {
    fontSize: 12,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  timesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BURNT_ORANGE,
    gap: 6,
  },
  timeButtonTaken: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  timeText: {
    fontSize: 13,
    color: BURNT_ORANGE,
    fontWeight: '500',
  },
  timeTextTaken: {
    color: '#fff',
  },
});
