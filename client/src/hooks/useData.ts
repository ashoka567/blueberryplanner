import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api';
import { Family, User, Chore, GroceryItem, Medicine, Reminder, MedicineLog } from '@/lib/types';
import type { GroceryEssential, GroceryStore, GroceryBuyAgain } from '@/lib/api';

export function useAuthUser() {
  return useQuery({
    queryKey: ['authUser'],
    queryFn: api.getMe,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useFamilies() {
  return useQuery<Family[]>({
    queryKey: ['families'],
    queryFn: api.getFamilies,
  });
}

export function useCurrentFamily() {
  const { data: families } = useFamilies();
  return families?.[0];
}

export function useFamilyMembers(familyId: string | undefined) {
  return useQuery<User[]>({
    queryKey: ['familyMembers', familyId],
    queryFn: () => api.getFamilyMembers(familyId!),
    enabled: !!familyId,
  });
}

export function useUsers() {
  return useQuery<User[]>({
    queryKey: ['users'],
    queryFn: api.getUsers,
  });
}

export function useChores(familyId: string | undefined) {
  return useQuery<Chore[]>({
    queryKey: ['chores', familyId],
    queryFn: () => api.getChores(familyId!),
    enabled: !!familyId,
  });
}

export function useCreateChore(familyId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chore: Partial<Chore>) => api.createChore(familyId!, chore),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chores', familyId] });
    },
  });
}

export function useUpdateChore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Chore> }) => 
      api.updateChore(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chores'] });
    },
  });
}

export function useDeleteChore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteChore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chores'] });
    },
  });
}

export function useGroceryItems(familyId: string | undefined) {
  return useQuery<GroceryItem[]>({
    queryKey: ['groceries', familyId],
    queryFn: () => api.getGroceryItems(familyId!),
    enabled: !!familyId,
  });
}

export function useCreateGroceryItem(familyId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (item: Partial<GroceryItem>) => api.createGroceryItem(familyId!, item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groceries', familyId] });
    },
  });
}

export function useUpdateGroceryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<GroceryItem> }) => 
      api.updateGroceryItem(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groceries'] });
    },
  });
}

export function useDeleteGroceryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteGroceryItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groceries'] });
    },
  });
}

export function useMedicines(familyId: string | undefined) {
  return useQuery<Medicine[]>({
    queryKey: ['medicines', familyId],
    queryFn: () => api.getMedicines(familyId!),
    enabled: !!familyId,
  });
}

export function useCreateMedicine(familyId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (medicine: Partial<Medicine>) => api.createMedicine(familyId!, medicine),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicines', familyId] });
    },
  });
}

export function useUpdateMedicine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Medicine> }) => 
      api.updateMedicine(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicines'] });
    },
  });
}

export function useDeleteMedicine(familyId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteMedicine(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicines', familyId] });
    },
  });
}

export function useReminders(familyId: string | undefined) {
  return useQuery<Reminder[]>({
    queryKey: ['reminders', familyId],
    queryFn: () => api.getReminders(familyId!),
    enabled: !!familyId,
  });
}

export function useCreateReminder(familyId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reminder: Partial<Reminder>) => api.createReminder(familyId!, reminder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders', familyId] });
    },
  });
}

export function useUpdateReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Reminder> }) => 
      api.updateReminder(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
}

export function useDeleteReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteReminder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
}

export function useMedicineLogs(familyId: string | undefined) {
  return useQuery<MedicineLog[]>({
    queryKey: ['medicineLogs', familyId],
    queryFn: () => api.getMedicineLogs(familyId!),
    enabled: !!familyId,
  });
}

export function useCreateMedicineLog(familyId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (log: { medicineId: string; takenAt: Date; scheduledTime?: string }) => 
      api.createMedicineLog(familyId!, log),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicineLogs', familyId] });
      queryClient.invalidateQueries({ queryKey: ['medicines', familyId] });
    },
  });
}

export function useGroceryEssentials(familyId: string | undefined) {
  return useQuery<GroceryEssential[]>({
    queryKey: ['groceryEssentials', familyId],
    queryFn: () => api.getGroceryEssentials(familyId!),
    enabled: !!familyId,
  });
}

export function useCreateGroceryEssential(familyId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (essential: Partial<GroceryEssential>) => api.createGroceryEssential(familyId!, essential),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groceryEssentials', familyId] });
    },
  });
}

export function useDeleteGroceryEssential(familyId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteGroceryEssential(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groceryEssentials', familyId] });
    },
  });
}

export function useGroceryStores(familyId: string | undefined) {
  return useQuery<GroceryStore[]>({
    queryKey: ['groceryStores', familyId],
    queryFn: () => api.getGroceryStores(familyId!),
    enabled: !!familyId,
  });
}

export function useCreateGroceryStore(familyId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (store: Partial<GroceryStore>) => api.createGroceryStore(familyId!, store),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groceryStores', familyId] });
    },
  });
}

export function useDeleteGroceryStore(familyId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteGroceryStore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groceryStores', familyId] });
    },
  });
}

export function useGroceryBuyAgain(familyId: string | undefined) {
  return useQuery<GroceryBuyAgain[]>({
    queryKey: ['groceryBuyAgain', familyId],
    queryFn: () => api.getGroceryBuyAgain(familyId!),
    enabled: !!familyId,
  });
}

export function useCreateGroceryBuyAgain(familyId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (item: Partial<GroceryBuyAgain>) => api.createGroceryBuyAgain(familyId!, item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groceryBuyAgain', familyId] });
    },
  });
}

export function useUpdateGroceryBuyAgain(familyId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<GroceryBuyAgain> }) => 
      api.updateGroceryBuyAgain(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groceryBuyAgain', familyId] });
    },
  });
}

export function useDeleteGroceryBuyAgain(familyId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteGroceryBuyAgain(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groceryBuyAgain', familyId] });
    },
  });
}
