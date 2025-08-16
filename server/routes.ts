import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStudentSchema, insertAttendanceSchema } from "@shared/schema";
import { z } from "zod";

// Extend Express Request interface to include session
declare module 'express-session' {
  interface SessionData {
    userId: string;
    userRole: 'admin' | 'teacher';
  }
}

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

const attendanceSearchSchema = z.object({
  qrCode: z.string(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      const user = await storage.validateUser(username, password);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Store user session (simple implementation)
      req.session.userId = user.id;
      req.session.userRole = user.role;
      
      res.json({ user: { id: user.id, username: user.username, role: user.role } });
    } catch (error) {
      res.status(400).json({ message: "Invalid request" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    res.json({ user: { id: user.id, username: user.username, role: user.role } });
  });

  // Middleware for authentication
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.session.userId || req.session.userRole !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  };

  // Students endpoints
  app.get("/api/students", requireAuth, async (req, res) => {
    try {
      const { search, class: className, isActive } = req.query;
      const filters: any = {};
      
      if (search) filters.search = search as string;
      if (className) filters.class = className as string;
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      
      const students = await storage.getStudents(filters);
      res.json(students);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.get("/api/students/:id", requireAuth, async (req, res) => {
    try {
      const student = await storage.getStudent(req.params.id);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch student" });
    }
  });

  app.post("/api/students", requireAdmin, async (req, res) => {
    try {
      const studentData = insertStudentSchema.parse(req.body);
      
      // Check if NIS already exists
      const existingStudent = await storage.getStudentByNis(studentData.nis);
      if (existingStudent) {
        return res.status(400).json({ message: "NIS already exists" });
      }
      
      const student = await storage.createStudent(studentData);
      res.status(201).json(student);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid student data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create student" });
    }
  });

  app.put("/api/students/:id", requireAdmin, async (req, res) => {
    try {
      const updateData = insertStudentSchema.partial().parse(req.body);
      const student = await storage.updateStudent(req.params.id, updateData);
      res.json(student);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid student data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update student" });
    }
  });

  app.delete("/api/students/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteStudent(req.params.id);
      res.json({ message: "Student deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete student" });
    }
  });

  // QR Code lookup
  app.post("/api/students/search-by-qr", requireAuth, async (req, res) => {
    try {
      const { qrCode } = attendanceSearchSchema.parse(req.body);
      const student = await storage.getStudentByQrCode(qrCode);
      
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      res.json(student);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid QR code" });
      }
      res.status(500).json({ message: "Failed to search student" });
    }
  });

  // Attendance endpoints
  app.get("/api/attendance", requireAuth, async (req, res) => {
    try {
      const { studentId, date, startDate, endDate, status, class: className } = req.query;
      const filters: any = {};
      
      if (studentId) filters.studentId = studentId as string;
      if (date) filters.date = new Date(date as string);
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (status) filters.status = status as string;
      if (className) filters.class = className as string;
      
      const records = await storage.getAttendanceRecords(filters);
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendance records" });
    }
  });

  app.post("/api/attendance", requireAuth, async (req, res) => {
    try {
      const attendanceData = insertAttendanceSchema.parse({
        ...req.body,
        recordedBy: req.session.userId,
        date: new Date(),
        time: new Date(),
      });
      
      const record = await storage.createAttendanceRecord(attendanceData);
      res.status(201).json(record);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid attendance data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create attendance record" });
    }
  });

  app.put("/api/attendance/:id", requireAuth, async (req, res) => {
    try {
      const updateData = insertAttendanceSchema.partial().parse(req.body);
      const record = await storage.updateAttendanceRecord(req.params.id, updateData);
      res.json(record);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid attendance data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update attendance record" });
    }
  });

  // Statistics endpoints
  app.get("/api/stats/dashboard", requireAuth, async (req, res) => {
    try {
      const date = req.query.date ? new Date(req.query.date as string) : new Date();
      const stats = await storage.getAttendanceStats(date);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Reports endpoints
  app.get("/api/reports/attendance", requireAuth, async (req, res) => {
    try {
      const { startDate, endDate, class: className } = req.query;
      const filters: any = {};
      
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (className) filters.class = className as string;
      
      const report = await storage.getStudentAttendanceReport(filters);
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate attendance report" });
    }
  });

  // CSV Export endpoint
  app.get("/api/export/attendance-csv", requireAuth, async (req, res) => {
    try {
      const { startDate, endDate, class: className } = req.query;
      const filters: any = {};
      
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (className) filters.class = className as string;
      
      const records = await storage.getAttendanceRecords(filters);
      
      // Generate CSV content
      const csvHeader = "Tanggal,Waktu,Nama Siswa,NIS,Kelas,Status,Keterangan\n";
      const csvRows = records.map(record => {
        const date = record.date.toLocaleDateString('id-ID');
        const time = record.time.toLocaleTimeString('id-ID');
        const name = `"${record.student.name}"`;
        const nis = record.student.nis;
        const className = `"${record.student.class}"`;
        const status = record.status;
        const notes = `"${record.notes || ''}"`;
        
        return `${date},${time},${name},${nis},${className},${status},${notes}`;
      }).join('\n');
      
      const csvContent = csvHeader + csvRows;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=attendance-report.csv');
      res.send(csvContent);
    } catch (error) {
      res.status(500).json({ message: "Failed to export CSV" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
