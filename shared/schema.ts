import { sql } from "drizzle-orm";
import { pgTable, text, varchar, uuid, timestamp, boolean, integer, jsonb, date, primaryKey, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 150 }).unique(),
  phone: varchar("phone", { length: 20 }),
  loginType: varchar("login_type", { length: 20 }).notNull().default("PASSWORD"),
  pinHash: varchar("pin_hash", { length: 255 }),
  password: text("password"),
  age: integer("age"),
  isChild: boolean("is_child").default(false),
  emailVerified: boolean("email_verified").default(false),
  status: varchar("status", { length: 20 }).default("ACTIVE"),
  avatar: text("avatar"),
  chorePoints: integer("chore_points").default(0),
  securityQuestion1: varchar("security_question_1", { length: 255 }),
  securityAnswer1: varchar("security_answer_1", { length: 255 }),
  securityQuestion2: varchar("security_question_2", { length: 255 }),
  securityAnswer2: varchar("security_answer_2", { length: 255 }),
  createdAt: timestamp("created_at").default(sql`NOW()`),
});

export const families = pgTable("families", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  createdBy: uuid("created_by").references(() => users.id),
  timezone: varchar("timezone", { length: 50 }),
  settings: jsonb("settings"),
  createdAt: timestamp("created_at").default(sql`NOW()`),
});

export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 30 }).unique().notNull(),
});

export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).unique().notNull(),
  description: text("description"),
});

export const rolePermissions = pgTable("role_permissions", {
  roleId: integer("role_id").references(() => roles.id, { onDelete: "cascade" }).notNull(),
  permissionId: integer("permission_id").references(() => permissions.id, { onDelete: "cascade" }).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.roleId, table.permissionId] }),
}));

export const familyMembers = pgTable("family_members", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  familyId: uuid("family_id").references(() => families.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  roleId: integer("role_id").references(() => roles.id),
  joinedAt: timestamp("joined_at").default(sql`NOW()`),
  status: varchar("status", { length: 20 }).default("ACTIVE"),
});

export const memberPermissions = pgTable("member_permissions", {
  familyMemberId: uuid("family_member_id").references(() => familyMembers.id, { onDelete: "cascade" }).notNull(),
  permissionId: integer("permission_id").references(() => permissions.id, { onDelete: "cascade" }).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.familyMemberId, table.permissionId] }),
}));

export const chores = pgTable("chores", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  familyId: uuid("family_id").references(() => families.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  assignedTo: uuid("assigned_to").references(() => users.id),
  dueDate: date("due_date"),
  dueTime: varchar("due_time", { length: 10 }),
  repeatType: varchar("repeat_type", { length: 20 }),
  status: varchar("status", { length: 20 }).default("PENDING"),
  points: integer("points").default(5),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").default(sql`NOW()`),
});

export const groceryItems = pgTable("grocery_items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  familyId: uuid("family_id").references(() => families.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  quantity: varchar("quantity", { length: 50 }),
  category: varchar("category", { length: 50 }),
  store: varchar("store", { length: 100 }),
  notes: text("notes"),
  status: varchar("status", { length: 20 }).default("NEEDED"),
  purchaseCount: integer("purchase_count").default(0),
  addedBy: uuid("added_by").references(() => users.id),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
});

export const groceryEssentials = pgTable("grocery_essentials", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  familyId: uuid("family_id").references(() => families.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  category: varchar("category", { length: 50 }),
  createdAt: timestamp("created_at").default(sql`NOW()`),
});

export const groceryStores = pgTable("grocery_stores", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  familyId: uuid("family_id").references(() => families.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").default(sql`NOW()`),
});

export const groceryBuyAgain = pgTable("grocery_buy_again", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  familyId: uuid("family_id").references(() => families.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  category: varchar("category", { length: 50 }),
  store: varchar("store", { length: 100 }),
  quantity: varchar("quantity", { length: 50 }),
  purchaseCount: integer("purchase_count").default(1),
  lastPurchased: timestamp("last_purchased").default(sql`NOW()`),
});

export const medicines = pgTable("medicines", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  familyId: uuid("family_id").references(() => families.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  dosage: varchar("dosage", { length: 50 }),
  schedule: jsonb("schedule"),
  assignedTo: uuid("assigned_to").references(() => users.id),
  active: boolean("active").default(true),
  inventory: integer("inventory").default(0),
  startDate: date("start_date"),
  endDate: date("end_date"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").default(sql`NOW()`),
});

export const medicineLogs = pgTable("medicine_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  familyId: uuid("family_id").references(() => families.id, { onDelete: "cascade" }).notNull(),
  medicineId: uuid("medicine_id").references(() => medicines.id, { onDelete: "cascade" }).notNull(),
  takenBy: uuid("taken_by").references(() => users.id),
  markedBy: uuid("marked_by").references(() => users.id),
  takenAt: timestamp("taken_at").notNull(),
  scheduledTime: varchar("scheduled_time", { length: 10 }),
  status: varchar("status", { length: 20 }).default("TAKEN"),
});

export const reminders = pgTable("reminders", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  familyId: uuid("family_id").references(() => families.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 30 }).notNull(),
  referenceId: uuid("reference_id"),
  schedule: jsonb("schedule").notNull(),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  timezone: varchar("timezone", { length: 50 }),
  createdBy: uuid("created_by").references(() => users.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
});

export const reminderTargets = pgTable("reminder_targets", {
  reminderId: uuid("reminder_id").references(() => reminders.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.reminderId, table.userId] }),
}));

export const reminderLogs = pgTable("reminder_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  reminderId: uuid("reminder_id").references(() => reminders.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id),
  scheduledAt: timestamp("scheduled_at").notNull(),
  deliveredAt: timestamp("delivered_at"),
  status: varchar("status", { length: 20 }),
  errorMessage: text("error_message"),
});

export const sessions = pgTable("session", {
  sid: varchar("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire", { precision: 6 }).notNull(),
});

export const emailVerifications = pgTable("email_verifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: varchar("token", { length: 100 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").default(sql`NOW()`),
});

export const notificationSettings = pgTable("notification_settings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  familyId: uuid("family_id").references(() => families.id, { onDelete: "cascade" }).notNull(),
  medicationsEnabled: boolean("medications_enabled").default(true),
  medicationsMinutes: integer("medications_minutes").default(15),
  choresEnabled: boolean("chores_enabled").default(true),
  choresMinutes: integer("chores_minutes").default(30),
  remindersEnabled: boolean("reminders_enabled").default(true),
  remindersMinutes: integer("reminders_minutes").default(15),
  groceriesEnabled: boolean("groceries_enabled").default(false),
  calendarEnabled: boolean("calendar_enabled").default(true),
  calendarMinutes: integer("calendar_minutes").default(15),
  pushEnabled: boolean("push_enabled").default(false),
  pushSubscription: jsonb("push_subscription"),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertFamilySchema = createInsertSchema(families).omit({ id: true, createdAt: true });
export const insertRoleSchema = createInsertSchema(roles).omit({ id: true });
export const insertPermissionSchema = createInsertSchema(permissions).omit({ id: true });
export const insertFamilyMemberSchema = createInsertSchema(familyMembers).omit({ id: true, joinedAt: true });
export const insertChoreSchema = createInsertSchema(chores).omit({ id: true, createdAt: true });
export const insertGroceryItemSchema = createInsertSchema(groceryItems).omit({ id: true, updatedAt: true });
export const insertGroceryEssentialSchema = createInsertSchema(groceryEssentials).omit({ id: true, createdAt: true });
export const insertGroceryStoreSchema = createInsertSchema(groceryStores).omit({ id: true, createdAt: true });
export const insertGroceryBuyAgainSchema = createInsertSchema(groceryBuyAgain).omit({ id: true, lastPurchased: true });
export const insertMedicineSchema = createInsertSchema(medicines).omit({ id: true, createdAt: true });
export const insertMedicineLogSchema = createInsertSchema(medicineLogs).omit({ id: true });
export const insertReminderSchema = createInsertSchema(reminders).omit({ id: true, createdAt: true, updatedAt: true });
export const insertNotificationSettingsSchema = createInsertSchema(notificationSettings).omit({ id: true, createdAt: true, updatedAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertFamily = z.infer<typeof insertFamilySchema>;
export type Family = typeof families.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type Permission = typeof permissions.$inferSelect;
export type InsertFamilyMember = z.infer<typeof insertFamilyMemberSchema>;
export type FamilyMember = typeof familyMembers.$inferSelect;
export type InsertChore = z.infer<typeof insertChoreSchema>;
export type Chore = typeof chores.$inferSelect;
export type InsertGroceryItem = z.infer<typeof insertGroceryItemSchema>;
export type GroceryItem = typeof groceryItems.$inferSelect;
export type InsertGroceryEssential = z.infer<typeof insertGroceryEssentialSchema>;
export type GroceryEssential = typeof groceryEssentials.$inferSelect;
export type InsertGroceryStore = z.infer<typeof insertGroceryStoreSchema>;
export type GroceryStore = typeof groceryStores.$inferSelect;
export type InsertGroceryBuyAgain = z.infer<typeof insertGroceryBuyAgainSchema>;
export type GroceryBuyAgain = typeof groceryBuyAgain.$inferSelect;
export type InsertMedicine = z.infer<typeof insertMedicineSchema>;
export type Medicine = typeof medicines.$inferSelect;
export type InsertMedicineLog = z.infer<typeof insertMedicineLogSchema>;
export type MedicineLog = typeof medicineLogs.$inferSelect;
export type InsertReminder = z.infer<typeof insertReminderSchema>;
export type Reminder = typeof reminders.$inferSelect;
export type InsertNotificationSettings = z.infer<typeof insertNotificationSettingsSchema>;
export type NotificationSettings = typeof notificationSettings.$inferSelect;
