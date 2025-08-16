import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["admin", "teacher"]);
export const attendanceStatusEnum = pgEnum("attendance_status", ["present", "late", "sick", "permission", "absent"]);
export const genderEnum = pgEnum("gender", ["L", "P"]);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default("teacher"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Students table
export const students = pgTable("students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nis: text("nis").notNull().unique(),
  name: text("name").notNull(),
  class: text("class").notNull(),
  gender: genderEnum("gender").notNull(),
  birthDate: timestamp("birth_date"),
  address: text("address"),
  qrCode: text("qr_code").notNull().unique(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Attendance records table
export const attendanceRecords = pgTable("attendance_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => students.id).notNull(),
  date: timestamp("date").notNull(),
  time: timestamp("time").notNull(),
  status: attendanceStatusEnum("status").notNull(),
  notes: text("notes"),
  recordedBy: varchar("recorded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const studentsRelations = relations(students, ({ many }) => ({
  attendanceRecords: many(attendanceRecords),
}));

export const attendanceRecordsRelations = relations(attendanceRecords, ({ one }) => ({
  student: one(students, {
    fields: [attendanceRecords.studentId],
    references: [students.id],
  }),
  recordedBy: one(users, {
    fields: [attendanceRecords.recordedBy],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  attendanceRecords: many(attendanceRecords),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  qrCode: true,
  createdAt: true,
});

export const insertAttendanceSchema = createInsertSchema(attendanceRecords).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;

// Extended types for joined data
export type StudentWithAttendance = Student & {
  attendanceRecords: AttendanceRecord[];
};

export type AttendanceWithStudent = AttendanceRecord & {
  student: Student;
  recordedBy?: User;
};
