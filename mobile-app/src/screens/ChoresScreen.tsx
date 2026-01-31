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
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { useChores, useCreateChore, useUpdateChore, useFamilyMembers } from '../hooks/useData';

const BURNT_ORANGE = '#D2691E';

export default function ChoresScreen() {
  const { familyId, user } = useAuth();
  const { data: chores = [], isLoading, refetch } = useChores(familyId);
  const { data: members = [] } = useFamilyMembers(familyId);
  const createChore = useCreateChore(familyId);
  const updateChore = useUpdateChore(familyId);

  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [choreForm, setChoreForm] = useState({
    title: '',
    assignedTo: '',
    points: '10',
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleAddChore = async () => {
    if (!choreForm.title.trim()) return;

    try {
      await createChore.mutateAsync({
        title: choreForm.title,
        assignedTo: choreForm.assignedTo || null,
        dueDate: format(new Date(), 'yyyy-MM-dd'),
        points: parseInt(choreForm.points) || 10,
        status: 'PENDING',
      });
      setChoreForm({ title: '', assignedTo: '', points: '10' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to add chore', error);
    }
  };

  const handleToggleComplete = async (chore: any) => {
    const newStatus = chore.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      await updateChore.mutateAsync({
        id: chore.id,
        data: { status: newStatus },
      });
    } catch (error) {
      console.error('Failed to update chore', error);
    }
  };

  const currentUser = members.find((m: any) => m.id === user?.id);
  const isParent = currentUser && !currentUser.isChild;
  const childMembers = members.filter((m: any) => m.isChild);

  const pendingChores = chores.filter((c: any) => c.status !== 'COMPLETED');
  const completedChores = chores.filter((c: any) => c.status === 'COMPLETED');

  const leaderboard = childMembers
    .map((child: any) => ({
      ...child,
      points: chores
        .filter((c: any) => c.assignedTo === child.id && c.status === 'COMPLETED')
        .reduce((sum: number, c: any) => sum + (c.points || 0), 0),
    }))
    .sort((a: any, b: any) => b.points - a.points);

  const getMemberName = (id: string) => {
    const member = members.find((m: any) => m.id === id);
    return member?.name || 'Unassigned';
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BURNT_ORANGE} />}
    >
      <View style={styles.header}>
        <View style={styles.headerButtons}>
          {isParent && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddForm(true)}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.cancelButton} onPress={() => {}}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>

      {leaderboard.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Leaderboard</Text>
          {leaderboard.map((child: any, index: number) => (
            <View key={child.id} style={styles.leaderboardItem}>
              <View style={[styles.leaderboardRank, index === 0 && styles.firstPlace]}>
                <Text style={styles.rankText}>{index + 1}</Text>
              </View>
              <Text style={styles.leaderboardName}>{child.name}</Text>
              <Text style={styles.leaderboardPoints}>{child.points} pts</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pending ({pendingChores.length})</Text>
        {pendingChores.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="checkmark-circle" size={32} color="#22c55e" />
            <Text style={styles.emptyText}>No pending chores!</Text>
          </View>
        ) : (
          pendingChores.map((chore: any) => (
            <TouchableOpacity
              key={chore.id}
              style={styles.choreCard}
              onPress={() => handleToggleComplete(chore)}
            >
              <Ionicons name="square-outline" size={24} color={BURNT_ORANGE} />
              <View style={styles.choreContent}>
                <Text style={styles.choreTitle}>{chore.title}</Text>
                <Text style={styles.choreSubtitle}>
                  {getMemberName(chore.assignedTo)} • {chore.points} pts
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Completed ({completedChores.length})</Text>
        {completedChores.slice(0, 5).map((chore: any) => (
          <TouchableOpacity
            key={chore.id}
            style={styles.choreCard}
            onPress={() => handleToggleComplete(chore)}
          >
            <Ionicons name="checkbox" size={24} color="#22c55e" />
            <View style={styles.choreContent}>
              <Text style={[styles.choreTitle, styles.completedTitle]}>
                {chore.title}
              </Text>
              <Text style={styles.choreSubtitle}>
                {getMemberName(chore.assignedTo)} • {chore.points} pts
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <Modal visible={showAddForm} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Chore</Text>

            <Text style={styles.label}>Chore Title</Text>
            <TextInput
              style={styles.input}
              value={choreForm.title}
              onChangeText={(v) => setChoreForm({ ...choreForm, title: v })}
              placeholder="e.g., Clean bedroom"
              placeholderTextColor="#9ca3af"
            />

            <Text style={styles.label}>Assign To</Text>
            <View style={styles.assignOptions}>
              <TouchableOpacity
                style={[
                  styles.assignOption,
                  !choreForm.assignedTo && styles.assignOptionSelected,
                ]}
                onPress={() => setChoreForm({ ...choreForm, assignedTo: '' })}
              >
                <Text
                  style={[
                    styles.assignOptionText,
                    !choreForm.assignedTo && styles.assignOptionTextSelected,
                  ]}
                >
                  Anyone
                </Text>
              </TouchableOpacity>
              {childMembers.map((child: any) => (
                <TouchableOpacity
                  key={child.id}
                  style={[
                    styles.assignOption,
                    choreForm.assignedTo === child.id && styles.assignOptionSelected,
                  ]}
                  onPress={() => setChoreForm({ ...choreForm, assignedTo: child.id })}
                >
                  <Text
                    style={[
                      styles.assignOptionText,
                      choreForm.assignedTo === child.id && styles.assignOptionTextSelected,
                    ]}
                  >
                    {child.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Points</Text>
            <TextInput
              style={styles.input}
              value={choreForm.points}
              onChangeText={(v) => setChoreForm({ ...choreForm, points: v })}
              keyboardType="numeric"
              placeholderTextColor="#9ca3af"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowAddForm(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleAddChore}
              >
                <Text style={styles.submitButtonText}>Add</Text>
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
  section: {
    padding: 16,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  leaderboardRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#9ca3af',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  firstPlace: {
    backgroundColor: '#fbbf24',
  },
  rankText: {
    fontWeight: 'bold',
    color: '#fff',
  },
  leaderboardName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  leaderboardPoints: {
    fontSize: 16,
    fontWeight: 'bold',
    color: BURNT_ORANGE,
  },
  emptyCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
  },
  choreCard: {
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
  choreContent: {
    marginLeft: 12,
    flex: 1,
  },
  choreTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  choreSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
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
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: BURNT_ORANGE,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  assignOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  assignOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  assignOptionSelected: {
    backgroundColor: BURNT_ORANGE,
    borderColor: BURNT_ORANGE,
  },
  assignOptionText: {
    color: '#374151',
  },
  assignOptionTextSelected: {
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
  },
  modalCancelButton: {
    padding: 12,
  },
  modalCancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: BURNT_ORANGE,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
