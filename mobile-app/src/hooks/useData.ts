import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useFamilyMembers(familyId: string | null) {
  return useQuery({
    queryKey: ['members', familyId],
    queryFn: () => api.getFamilyMembers(familyId!),
    enabled: !!familyId,
  });
}

export function useReminders(familyId: string | null) {
  return useQuery({
    queryKey: ['reminders', familyId],
    queryFn: () => api.getReminders(familyId!),
    enabled: !!familyId,
  });
}

export function useCreateReminder(familyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.createReminder(familyId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders', familyId] });
    },
  });
}

export function useMedicines(familyId: string | null) {
  return useQuery({
    queryKey: ['medicines', familyId],
    queryFn: () => api.getMedicines(familyId!),
    enabled: !!familyId,
  });
}

export function useCreateMedicine(familyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.createMedicine(familyId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicines', familyId] });
    },
  });
}

export function useMedicineLogs(familyId: string | null) {
  return useQuery({
    queryKey: ['medicineLogs', familyId],
    queryFn: () => api.getMedicineLogs(familyId!),
    enabled: !!familyId,
  });
}

export function useCreateMedicineLog(familyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.createMedicineLog(familyId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicineLogs', familyId] });
      queryClient.invalidateQueries({ queryKey: ['medicines', familyId] });
    },
  });
}

export function useChores(familyId: string | null) {
  return useQuery({
    queryKey: ['chores', familyId],
    queryFn: () => api.getChores(familyId!),
    enabled: !!familyId,
  });
}

export function useCreateChore(familyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.createChore(familyId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chores', familyId] });
    },
  });
}

export function useUpdateChore(familyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateChore(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chores', familyId] });
    },
  });
}

export function useGroceryItems(familyId: string | null) {
  return useQuery({
    queryKey: ['groceryItems', familyId],
    queryFn: () => api.getGroceryItems(familyId!),
    enabled: !!familyId,
  });
}

export function useCreateGroceryItem(familyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.createGroceryItem(familyId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groceryItems', familyId] });
    },
  });
}

export function useUpdateGroceryItem(familyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateGroceryItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groceryItems', familyId] });
    },
  });
}

export function useDeleteGroceryItem(familyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteGroceryItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groceryItems', familyId] });
    },
  });
}
