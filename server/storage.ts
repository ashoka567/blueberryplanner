import { 
  users, families, roles, permissions, rolePermissions, familyMembers, 
  chores, groceryItems, groceryEssentials, groceryStores, groceryBuyAgain,
  medicines, medicineLogs, reminders, reminderTargets, emailVerifications, notificationSettings,
  type User, type InsertUser, type Family, type InsertFamily,
  type Role, type Permission, type FamilyMember, type InsertFamilyMember,
  type Chore, type InsertChore, type GroceryItem, type InsertGroceryItem,
  type GroceryEssential, type InsertGroceryEssential,
  type GroceryStore, type InsertGroceryStore,
  type GroceryBuyAgain, type InsertGroceryBuyAgain,
  type Medicine, type InsertMedicine, type MedicineLog, type InsertMedicineLog,
  type Reminder, type InsertReminder, type NotificationSettings, type InsertNotificationSettings
} from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  getUsersByFamily(familyId: string): Promise<User[]>;
  getUserFamily(userId: string): Promise<FamilyMember | undefined>;

  getFamily(id: string): Promise<Family | undefined>;
  createFamily(family: InsertFamily): Promise<Family>;
  getFamilies(): Promise<Family[]>;

  getRoles(): Promise<Role[]>;
  getPermissions(): Promise<Permission[]>;

  getFamilyMembers(familyId: string): Promise<FamilyMember[]>;
  addFamilyMember(member: InsertFamilyMember): Promise<FamilyMember>;

  getChores(familyId: string): Promise<Chore[]>;
  getChore(id: string): Promise<Chore | undefined>;
  createChore(chore: InsertChore): Promise<Chore>;
  updateChore(id: string, updates: Partial<Chore>): Promise<Chore | undefined>;
  deleteChore(id: string): Promise<void>;

  getGroceryItems(familyId: string): Promise<GroceryItem[]>;
  createGroceryItem(item: InsertGroceryItem): Promise<GroceryItem>;
  updateGroceryItem(id: string, updates: Partial<GroceryItem>): Promise<GroceryItem | undefined>;
  deleteGroceryItem(id: string): Promise<void>;
  
  getGroceryEssentials(familyId: string): Promise<GroceryEssential[]>;
  createGroceryEssential(essential: InsertGroceryEssential): Promise<GroceryEssential>;
  deleteGroceryEssential(id: string): Promise<void>;
  
  getGroceryStores(familyId: string): Promise<GroceryStore[]>;
  createGroceryStore(store: InsertGroceryStore): Promise<GroceryStore>;
  deleteGroceryStore(id: string): Promise<void>;
  
  getGroceryBuyAgain(familyId: string): Promise<GroceryBuyAgain[]>;
  createGroceryBuyAgain(item: InsertGroceryBuyAgain): Promise<GroceryBuyAgain>;
  updateGroceryBuyAgain(id: string, updates: Partial<GroceryBuyAgain>): Promise<GroceryBuyAgain | undefined>;
  deleteGroceryBuyAgain(id: string): Promise<void>;

  getMedicines(familyId: string): Promise<Medicine[]>;
  createMedicine(medicine: InsertMedicine): Promise<Medicine>;
  updateMedicine(id: string, updates: Partial<Medicine>): Promise<Medicine | undefined>;
  deleteMedicine(id: string): Promise<void>;

  getMedicineLogs(familyId: string): Promise<MedicineLog[]>;
  createMedicineLog(log: InsertMedicineLog): Promise<MedicineLog>;

  getReminders(familyId: string): Promise<Reminder[]>;
  createReminder(reminder: InsertReminder): Promise<Reminder>;
  updateReminder(id: string, updates: Partial<Reminder>): Promise<Reminder | undefined>;
  deleteReminder(id: string): Promise<void>;
  getReminderTargets(reminderId: string): Promise<string[]>;
  setReminderTargets(reminderId: string, userIds: string[]): Promise<void>;
  getRemindersByUser(familyId: string, userId: string): Promise<Reminder[]>;

  createEmailVerification(userId: string, token: string, expiresAt: Date): Promise<void>;
  getEmailVerification(token: string): Promise<{ userId: string; verified: boolean; expiresAt: Date } | undefined>;
  markEmailVerified(token: string): Promise<void>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  getKidsByFamily(familyId: string): Promise<User[]>;
  getUserByPinHash(familyId: string, pinHash: string): Promise<User | undefined>;

  getNotificationSettings(userId: string, familyId: string): Promise<NotificationSettings | undefined>;
  upsertNotificationSettings(settings: InsertNotificationSettings): Promise<NotificationSettings>;

  seedDefaultData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUsersByFamily(familyId: string): Promise<User[]> {
    const members = await db.select().from(familyMembers).where(eq(familyMembers.familyId, familyId));
    const userIds = members.map(m => m.userId);
    if (userIds.length === 0) return [];
    const result = await db.select().from(users);
    return result.filter(u => userIds.includes(u.id));
  }

  async getUserFamily(userId: string): Promise<FamilyMember | undefined> {
    const result = await db.select().from(familyMembers).where(eq(familyMembers.userId, userId));
    return result[0];
  }

  async getFamily(id: string): Promise<Family | undefined> {
    const result = await db.select().from(families).where(eq(families.id, id));
    return result[0];
  }

  async createFamily(family: InsertFamily): Promise<Family> {
    const result = await db.insert(families).values(family).returning();
    return result[0];
  }

  async getFamilies(): Promise<Family[]> {
    return await db.select().from(families);
  }

  async getRoles(): Promise<Role[]> {
    return await db.select().from(roles);
  }

  async getPermissions(): Promise<Permission[]> {
    return await db.select().from(permissions);
  }

  async getFamilyMembers(familyId: string): Promise<FamilyMember[]> {
    return await db.select().from(familyMembers).where(eq(familyMembers.familyId, familyId));
  }

  async addFamilyMember(member: InsertFamilyMember): Promise<FamilyMember> {
    const result = await db.insert(familyMembers).values(member).returning();
    return result[0];
  }

  async getChores(familyId: string): Promise<Chore[]> {
    return await db.select().from(chores).where(eq(chores.familyId, familyId));
  }

  async getChore(id: string): Promise<Chore | undefined> {
    const result = await db.select().from(chores).where(eq(chores.id, id));
    return result[0];
  }

  async createChore(chore: InsertChore): Promise<Chore> {
    const result = await db.insert(chores).values(chore).returning();
    return result[0];
  }

  async updateChore(id: string, updates: Partial<Chore>): Promise<Chore | undefined> {
    const result = await db.update(chores).set(updates).where(eq(chores.id, id)).returning();
    return result[0];
  }

  async deleteChore(id: string): Promise<void> {
    await db.delete(chores).where(eq(chores.id, id));
  }

  async getGroceryItems(familyId: string): Promise<GroceryItem[]> {
    return await db.select().from(groceryItems).where(eq(groceryItems.familyId, familyId));
  }

  async createGroceryItem(item: InsertGroceryItem): Promise<GroceryItem> {
    const result = await db.insert(groceryItems).values(item).returning();
    return result[0];
  }

  async updateGroceryItem(id: string, updates: Partial<GroceryItem>): Promise<GroceryItem | undefined> {
    const result = await db.update(groceryItems).set(updates).where(eq(groceryItems.id, id)).returning();
    return result[0];
  }

  async deleteGroceryItem(id: string): Promise<void> {
    await db.delete(groceryItems).where(eq(groceryItems.id, id));
  }

  async getGroceryEssentials(familyId: string): Promise<GroceryEssential[]> {
    return await db.select().from(groceryEssentials).where(eq(groceryEssentials.familyId, familyId));
  }

  async createGroceryEssential(essential: InsertGroceryEssential): Promise<GroceryEssential> {
    const result = await db.insert(groceryEssentials).values(essential).returning();
    return result[0];
  }

  async deleteGroceryEssential(id: string): Promise<void> {
    await db.delete(groceryEssentials).where(eq(groceryEssentials.id, id));
  }

  async getGroceryStores(familyId: string): Promise<GroceryStore[]> {
    return await db.select().from(groceryStores).where(eq(groceryStores.familyId, familyId));
  }

  async createGroceryStore(store: InsertGroceryStore): Promise<GroceryStore> {
    const result = await db.insert(groceryStores).values(store).returning();
    return result[0];
  }

  async deleteGroceryStore(id: string): Promise<void> {
    await db.delete(groceryStores).where(eq(groceryStores.id, id));
  }

  async getGroceryBuyAgain(familyId: string): Promise<GroceryBuyAgain[]> {
    return await db.select().from(groceryBuyAgain).where(eq(groceryBuyAgain.familyId, familyId));
  }

  async createGroceryBuyAgain(item: InsertGroceryBuyAgain): Promise<GroceryBuyAgain> {
    const result = await db.insert(groceryBuyAgain).values(item).returning();
    return result[0];
  }

  async updateGroceryBuyAgain(id: string, updates: Partial<GroceryBuyAgain>): Promise<GroceryBuyAgain | undefined> {
    const result = await db.update(groceryBuyAgain).set(updates).where(eq(groceryBuyAgain.id, id)).returning();
    return result[0];
  }

  async deleteGroceryBuyAgain(id: string): Promise<void> {
    await db.delete(groceryBuyAgain).where(eq(groceryBuyAgain.id, id));
  }

  async getMedicines(familyId: string): Promise<Medicine[]> {
    return await db.select().from(medicines).where(eq(medicines.familyId, familyId));
  }

  async createMedicine(medicine: InsertMedicine): Promise<Medicine> {
    const result = await db.insert(medicines).values(medicine).returning();
    return result[0];
  }

  async updateMedicine(id: string, updates: Partial<Medicine>): Promise<Medicine | undefined> {
    const result = await db.update(medicines).set(updates).where(eq(medicines.id, id)).returning();
    return result[0];
  }

  async deleteMedicine(id: string): Promise<void> {
    await db.delete(medicines).where(eq(medicines.id, id));
  }

  async getMedicineLogs(familyId: string): Promise<MedicineLog[]> {
    return await db.select().from(medicineLogs).where(eq(medicineLogs.familyId, familyId));
  }

  async createMedicineLog(log: InsertMedicineLog): Promise<MedicineLog> {
    const result = await db.insert(medicineLogs).values(log).returning();
    return result[0];
  }

  async getReminders(familyId: string): Promise<Reminder[]> {
    return await db.select().from(reminders).where(eq(reminders.familyId, familyId));
  }

  async createReminder(reminder: InsertReminder): Promise<Reminder> {
    const result = await db.insert(reminders).values(reminder).returning();
    return result[0];
  }

  async updateReminder(id: string, updates: Partial<Reminder>): Promise<Reminder | undefined> {
    const result = await db.update(reminders).set(updates).where(eq(reminders.id, id)).returning();
    return result[0];
  }

  async deleteReminder(id: string): Promise<void> {
    await db.delete(reminders).where(eq(reminders.id, id));
  }

  async getReminderTargets(reminderId: string): Promise<string[]> {
    const targets = await db.select().from(reminderTargets).where(eq(reminderTargets.reminderId, reminderId));
    return targets.map(t => t.userId);
  }

  async setReminderTargets(reminderId: string, userIds: string[]): Promise<void> {
    await db.delete(reminderTargets).where(eq(reminderTargets.reminderId, reminderId));
    if (userIds.length > 0) {
      await db.insert(reminderTargets).values(
        userIds.map(userId => ({ reminderId, userId }))
      );
    }
  }

  async getRemindersByUser(familyId: string, userId: string): Promise<Reminder[]> {
    const allReminders = await this.getReminders(familyId);
    const userTargets = await db.select().from(reminderTargets).where(eq(reminderTargets.userId, userId));
    const targetReminderIds = new Set(userTargets.map(t => t.reminderId));
    return allReminders.filter(r => targetReminderIds.has(r.id));
  }

  async seedDefaultData(): Promise<void> {
    const existingRoles = await db.select().from(roles);
    if (existingRoles.length === 0) {
      await db.insert(roles).values([
        { name: "SUPER_ADMIN" },
        { name: "ADMIN" },
        { name: "MEMBER" },
        { name: "CHILD" },
        { name: "VIEW_ONLY" },
      ]);
    }

    const existingPermissions = await db.select().from(permissions);
    if (existingPermissions.length === 0) {
      await db.insert(permissions).values([
        { code: "CAN_MANAGE_MEMBERS", description: "Can add/remove family members" },
        { code: "CAN_ADD_CHORES", description: "Can create chores" },
        { code: "CAN_MARK_CHORES", description: "Can mark chores as complete" },
        { code: "CAN_ADD_GROCERIES", description: "Can add grocery items" },
        { code: "CAN_MANAGE_MEDICINES", description: "Can manage medicines" },
        { code: "CAN_VIEW_MEDICINE_LOGS", description: "Can view medicine logs" },
        { code: "CAN_CREATE_REMINDERS", description: "Can create reminders" },
      ]);
    }

    const existingFamilies = await db.select().from(families);
    if (existingFamilies.length === 0) {
      const demoFamily = await db.insert(families).values({
        name: "Demo Family",
        timezone: "America/New_York",
        settings: { allowKidsToEditGroceries: false, requireMedicineConfirmation: true },
      }).returning();

      const demoUsers = await db.insert(users).values([
        { name: "Sarah", email: "sarah@demo.com", loginType: "PASSWORD", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah", isChild: false },
        { name: "Mike", email: "mike@demo.com", loginType: "PASSWORD", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike", isChild: false },
        { name: "Leo", email: null, loginType: "NONE", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Leo", isChild: true, age: 12 },
        { name: "Mia", email: null, loginType: "NONE", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mia", isChild: true, age: 8 },
      ]).returning();

      const allRoles = await db.select().from(roles);
      const adminRole = allRoles.find(r => r.name === "ADMIN");
      const childRole = allRoles.find(r => r.name === "CHILD");

      for (const user of demoUsers) {
        await db.insert(familyMembers).values({
          familyId: demoFamily[0].id,
          userId: user.id,
          roleId: user.isChild ? childRole?.id : adminRole?.id,
        });
      }

      const today = new Date().toISOString().split('T')[0];
      await db.insert(chores).values([
        { familyId: demoFamily[0].id, title: "Empty Dishwasher", assignedTo: demoUsers[2].id, dueDate: today, points: 5, status: "PENDING" },
        { familyId: demoFamily[0].id, title: "Walk the Dog", assignedTo: demoUsers[3].id, dueDate: today, points: 10, status: "COMPLETED" },
        { familyId: demoFamily[0].id, title: "Take out Trash", assignedTo: demoUsers[1].id, dueDate: today, points: 5, status: "PENDING" },
      ]);

      await db.insert(groceryItems).values([
        { familyId: demoFamily[0].id, name: "Milk", category: "Dairy", addedBy: demoUsers[0].id, status: "PENDING" },
        { familyId: demoFamily[0].id, name: "Bananas", category: "Produce", addedBy: demoUsers[2].id, status: "CHECKED" },
        { familyId: demoFamily[0].id, name: "Cereal", category: "Pantry", addedBy: demoUsers[1].id, status: "PENDING" },
        { familyId: demoFamily[0].id, name: "Chicken Breast", category: "Meat", addedBy: demoUsers[0].id, status: "PENDING" },
      ]);

      await db.insert(medicines).values([
        { familyId: demoFamily[0].id, name: "Amoxicillin", dosage: "500mg", schedule: { type: "DAILY", times: ["08:00", "20:00"] }, assignedTo: demoUsers[2].id, inventory: 14 },
        { familyId: demoFamily[0].id, name: "Vitamin D", dosage: "1000IU", schedule: { type: "DAILY", times: ["09:00"] }, assignedTo: demoUsers[0].id, inventory: 45 },
      ]);

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      await db.insert(reminders).values([
        { 
          familyId: demoFamily[0].id, 
          title: "Soccer Practice", 
          type: "School",
          schedule: { type: "ONCE" },
          startTime: new Date(todayStart.getTime() + 16 * 60 * 60 * 1000),
          endTime: new Date(todayStart.getTime() + 17.5 * 60 * 60 * 1000),
        },
        { 
          familyId: demoFamily[0].id, 
          title: "Dentist Appointment", 
          type: "Medical",
          schedule: { type: "ONCE" },
          startTime: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000),
          endTime: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000),
        },
        { 
          familyId: demoFamily[0].id, 
          title: "Family Movie Night", 
          type: "Family",
          schedule: { type: "ONCE" },
          startTime: new Date(todayStart.getTime() + 2 * 24 * 60 * 60 * 1000 + 19 * 60 * 60 * 1000),
          endTime: new Date(todayStart.getTime() + 2 * 24 * 60 * 60 * 1000 + 22 * 60 * 60 * 1000),
        },
      ]);
    }
  }

  async createEmailVerification(userId: string, token: string, expiresAt: Date): Promise<void> {
    await db.insert(emailVerifications).values({ userId, token, expiresAt });
  }

  async getEmailVerification(token: string): Promise<{ userId: string; verified: boolean; expiresAt: Date } | undefined> {
    const result = await db.select().from(emailVerifications).where(eq(emailVerifications.token, token));
    if (!result[0]) return undefined;
    return {
      userId: result[0].userId,
      verified: result[0].verified ?? false,
      expiresAt: result[0].expiresAt
    };
  }

  async markEmailVerified(token: string): Promise<void> {
    const verification = await this.getEmailVerification(token);
    if (verification) {
      await db.update(emailVerifications).set({ verified: true }).where(eq(emailVerifications.token, token));
      await db.update(users).set({ emailVerified: true }).where(eq(users.id, verification.userId));
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }

  async updateUserPoints(id: string, points: number): Promise<void> {
    await db.update(users).set({ chorePoints: points }).where(eq(users.id, id));
  }

  async getKidsByFamily(familyId: string): Promise<User[]> {
    const members = await db.select().from(familyMembers).where(eq(familyMembers.familyId, familyId));
    const userIds = members.map(m => m.userId);
    if (userIds.length === 0) return [];
    const allUsers = await db.select().from(users);
    return allUsers.filter(u => userIds.includes(u.id) && u.isChild);
  }

  async getUserByPinHash(familyId: string, pinHash: string): Promise<User | undefined> {
    const kids = await this.getKidsByFamily(familyId);
    return kids.find(k => k.pinHash === pinHash);
  }

  async getNotificationSettings(userId: string, familyId: string): Promise<NotificationSettings | undefined> {
    const result = await db.select().from(notificationSettings).where(
      and(eq(notificationSettings.userId, userId), eq(notificationSettings.familyId, familyId))
    );
    return result[0];
  }

  async upsertNotificationSettings(settings: InsertNotificationSettings): Promise<NotificationSettings> {
    const existing = await this.getNotificationSettings(settings.userId, settings.familyId);
    if (existing) {
      const result = await db.update(notificationSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(notificationSettings.id, existing.id))
        .returning();
      return result[0];
    }
    const result = await db.insert(notificationSettings).values(settings).returning();
    return result[0];
  }
}

export const storage = new DatabaseStorage();
