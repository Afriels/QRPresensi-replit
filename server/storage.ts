import {
  students,
  attendanceRecords,
  users,
  type User,
  type InsertUser,
  type Student,
  type InsertStudent,
  type AttendanceRecord,
  type InsertAttendance,
  type StudentWithAttendance,
  type AttendanceWithStudent,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, sql, ilike, or } from "drizzle-orm";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  validateUser(username: string, password: string): Promise<User | null>;

  // Student operations
  getStudent(id: string): Promise<Student | undefined>;
  getStudentByNis(nis: string): Promise<Student | undefined>;
  getStudentByQrCode(qrCode: string): Promise<Student | undefined>;
  getStudents(filters?: { search?: string; class?: string; isActive?: boolean }): Promise<Student[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: string, student: Partial<InsertStudent>): Promise<Student>;
  deleteStudent(id: string): Promise<void>;
  
  // Attendance operations
  getAttendanceRecord(id: string): Promise<AttendanceWithStudent | undefined>;
  getAttendanceRecords(filters?: {
    studentId?: string;
    date?: Date;
    startDate?: Date;
    endDate?: Date;
    status?: string;
    class?: string;
  }): Promise<AttendanceWithStudent[]>;
  createAttendanceRecord(attendance: InsertAttendance): Promise<AttendanceRecord>;
  updateAttendanceRecord(id: string, attendance: Partial<InsertAttendance>): Promise<AttendanceRecord>;
  
  // Statistics
  getAttendanceStats(date?: Date): Promise<{
    totalStudents: number;
    presentToday: number;
    lateToday: number;
    absentToday: number;
    sickToday: number;
    permissionToday: number;
  }>;
  
  getStudentAttendanceReport(filters?: {
    startDate?: Date;
    endDate?: Date;
    class?: string;
  }): Promise<Array<{
    student: Student;
    present: number;
    late: number;
    sick: number;
    permission: number;
    absent: number;
    percentage: number;
  }>>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        password: hashedPassword,
      })
      .returning();
    return user;
  }

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  // Student operations
  async getStudent(id: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student;
  }

  async getStudentByNis(nis: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.nis, nis));
    return student;
  }

  async getStudentByQrCode(qrCode: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.qrCode, qrCode));
    return student;
  }

  async getStudents(filters?: { search?: string; class?: string; isActive?: boolean }): Promise<Student[]> {
    let query = db.select().from(students);
    
    const conditions = [];
    
    if (filters?.search) {
      conditions.push(
        or(
          ilike(students.name, `%${filters.search}%`),
          ilike(students.nis, `%${filters.search}%`)
        )
      );
    }
    
    if (filters?.class) {
      conditions.push(eq(students.class, filters.class));
    }
    
    if (filters?.isActive !== undefined) {
      conditions.push(eq(students.isActive, filters.isActive));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(students.name);
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const qrCode = `STD_${insertStudent.nis}`;
    const [student] = await db
      .insert(students)
      .values({
        ...insertStudent,
        qrCode,
      })
      .returning();
    return student;
  }

  async updateStudent(id: string, updateData: Partial<InsertStudent>): Promise<Student> {
    const [student] = await db
      .update(students)
      .set(updateData)
      .where(eq(students.id, id))
      .returning();
    return student;
  }

  async deleteStudent(id: string): Promise<void> {
    await db.delete(students).where(eq(students.id, id));
  }

  // Attendance operations
  async getAttendanceRecord(id: string): Promise<AttendanceWithStudent | undefined> {
    const [record] = await db
      .select({
        id: attendanceRecords.id,
        studentId: attendanceRecords.studentId,
        date: attendanceRecords.date,
        time: attendanceRecords.time,
        status: attendanceRecords.status,
        notes: attendanceRecords.notes,
        recordedBy: attendanceRecords.recordedBy,
        createdAt: attendanceRecords.createdAt,
        student: students,
      })
      .from(attendanceRecords)
      .innerJoin(students, eq(attendanceRecords.studentId, students.id))
      .where(eq(attendanceRecords.id, id));
    
    return record as AttendanceWithStudent;
  }

  async getAttendanceRecords(filters?: {
    studentId?: string;
    date?: Date;
    startDate?: Date;
    endDate?: Date;
    status?: string;
    class?: string;
  }): Promise<AttendanceWithStudent[]> {
    let query = db
      .select({
        id: attendanceRecords.id,
        studentId: attendanceRecords.studentId,
        date: attendanceRecords.date,
        time: attendanceRecords.time,
        status: attendanceRecords.status,
        notes: attendanceRecords.notes,
        recordedBy: attendanceRecords.recordedBy,
        createdAt: attendanceRecords.createdAt,
        student: students,
      })
      .from(attendanceRecords)
      .innerJoin(students, eq(attendanceRecords.studentId, students.id));

    const conditions = [];

    if (filters?.studentId) {
      conditions.push(eq(attendanceRecords.studentId, filters.studentId));
    }

    if (filters?.date) {
      const startOfDay = new Date(filters.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(filters.date);
      endOfDay.setHours(23, 59, 59, 999);
      
      conditions.push(
        and(
          gte(attendanceRecords.date, startOfDay),
          lte(attendanceRecords.date, endOfDay)
        )
      );
    }

    if (filters?.startDate) {
      conditions.push(gte(attendanceRecords.date, filters.startDate));
    }

    if (filters?.endDate) {
      conditions.push(lte(attendanceRecords.date, filters.endDate));
    }

    if (filters?.status) {
      conditions.push(eq(attendanceRecords.status, filters.status as any));
    }

    if (filters?.class) {
      conditions.push(eq(students.class, filters.class));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.orderBy(desc(attendanceRecords.time));
    return results as AttendanceWithStudent[];
  }

  async createAttendanceRecord(insertAttendance: InsertAttendance): Promise<AttendanceRecord> {
    const [record] = await db
      .insert(attendanceRecords)
      .values(insertAttendance)
      .returning();
    return record;
  }

  async updateAttendanceRecord(id: string, updateData: Partial<InsertAttendance>): Promise<AttendanceRecord> {
    const [record] = await db
      .update(attendanceRecords)
      .set(updateData)
      .where(eq(attendanceRecords.id, id))
      .returning();
    return record;
  }

  // Statistics
  async getAttendanceStats(date: Date = new Date()): Promise<{
    totalStudents: number;
    presentToday: number;
    lateToday: number;
    absentToday: number;
    sickToday: number;
    permissionToday: number;
  }> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const [totalStudentsResult] = await db
      .select({ count: sql<number>`count(*)`.as('count') })
      .from(students)
      .where(eq(students.isActive, true));

    const todayAttendance = await db
      .select({
        status: attendanceRecords.status,
        count: sql<number>`count(*)`.as('count'),
      })
      .from(attendanceRecords)
      .where(
        and(
          gte(attendanceRecords.date, startOfDay),
          lte(attendanceRecords.date, endOfDay)
        )
      )
      .groupBy(attendanceRecords.status);

    const stats = {
      totalStudents: totalStudentsResult.count,
      presentToday: 0,
      lateToday: 0,
      absentToday: 0,
      sickToday: 0,
      permissionToday: 0,
    };

    todayAttendance.forEach((item) => {
      switch (item.status) {
        case 'present':
          stats.presentToday = item.count;
          break;
        case 'late':
          stats.lateToday = item.count;
          break;
        case 'absent':
          stats.absentToday = item.count;
          break;
        case 'sick':
          stats.sickToday = item.count;
          break;
        case 'permission':
          stats.permissionToday = item.count;
          break;
      }
    });

    return stats;
  }

  async getStudentAttendanceReport(filters?: {
    startDate?: Date;
    endDate?: Date;
    class?: string;
  }): Promise<Array<{
    student: Student;
    present: number;
    late: number;
    sick: number;
    permission: number;
    absent: number;
    percentage: number;
  }>> {
    const conditions = [eq(students.isActive, true)];
    
    if (filters?.class) {
      conditions.push(eq(students.class, filters.class));
    }
    
    let studentsQuery = db.select().from(students);
    if (conditions.length > 0) {
      studentsQuery = studentsQuery.where(and(...conditions));
    }

    const allStudents = await studentsQuery;
    const report = [];

    for (const student of allStudents) {
      const conditions = [eq(attendanceRecords.studentId, student.id)];

      if (filters?.startDate) {
        conditions.push(gte(attendanceRecords.date, filters.startDate));
      }

      if (filters?.endDate) {
        conditions.push(lte(attendanceRecords.date, filters.endDate));
      }

      const attendanceData = await db
        .select({
          status: attendanceRecords.status,
          count: sql<number>`count(*)`.as('count'),
        })
        .from(attendanceRecords)
        .where(and(...conditions))
        .groupBy(attendanceRecords.status);

      const stats = {
        present: 0,
        late: 0,
        sick: 0,
        permission: 0,
        absent: 0,
      };

      attendanceData.forEach((item) => {
        switch (item.status) {
          case 'present':
            stats.present = item.count;
            break;
          case 'late':
            stats.late = item.count;
            break;
          case 'sick':
            stats.sick = item.count;
            break;
          case 'permission':
            stats.permission = item.count;
            break;
          case 'absent':
            stats.absent = item.count;
            break;
        }
      });

      const totalDays = stats.present + stats.late + stats.sick + stats.permission + stats.absent;
      const attendedDays = stats.present + stats.late;
      const percentage = totalDays > 0 ? (attendedDays / totalDays) * 100 : 0;

      report.push({
        student,
        ...stats,
        percentage: Math.round(percentage * 10) / 10,
      });
    }

    return report;
  }
}

export const storage = new DatabaseStorage();
