import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { INITIAL_ACADEMIC_STATE } from "@/lib/unefa-pensum-seed";
import type {
  AcademicDatabaseState,
  AcademicTask,
  CorteConfig,
  ScheduleBlock,
  StudentConfig,
  Subject,
  SubTask,
  TaskAttachment,
} from "@/types/academic";

let tablesEnsured = false;

async function ensureStudyOsTables(): Promise<void> {
  if (tablesEnsured) return;

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS public.student_config (
      id TEXT PRIMARY KEY DEFAULT 'default_student',
      student_name TEXT NOT NULL DEFAULT 'Estudiante Ing. Sistemas',
      career TEXT NOT NULL DEFAULT 'Ingeniería de Sistemas',
      university TEXT NOT NULL DEFAULT 'UNEFA',
      sede TEXT NOT NULL DEFAULT 'Núcleo UNEFA',
      current_semester INTEGER NOT NULL DEFAULT 6,
      section_code TEXT NOT NULL DEFAULT '06S-2614-D1',
      weekly_comfort_hours DOUBLE PRECISION NOT NULL DEFAULT 14,
      default_target_grade DOUBLE PRECISION NOT NULL DEFAULT 15.0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS public.subjects (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      semester INTEGER NOT NULL DEFAULT 6,
      credits INTEGER NOT NULL DEFAULT 4,
      professor TEXT NOT NULL DEFAULT '',
      professor_contact TEXT NOT NULL DEFAULT '',
      section TEXT NOT NULL DEFAULT '06S-2614-D1',
      modality TEXT NOT NULL DEFAULT 'Presencial',
      color TEXT NOT NULL DEFAULT 'blue',
      target_grade DOUBLE PRECISION NOT NULL DEFAULT 15.0,
      general_notes TEXT NOT NULL DEFAULT '',
      cortes_config JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS public.schedule_blocks (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
      day_of_week INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      classroom TEXT NOT NULL DEFAULT 'Aula',
      session_type TEXT NOT NULL DEFAULT 'Teoría',
      notes TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS public.academic_tasks (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
      corte INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      task_type TEXT NOT NULL DEFAULT 'tarea',
      status TEXT NOT NULL DEFAULT 'pendiente',
      due_date TIMESTAMPTZ NOT NULL,
      weight_in_corte DOUBLE PRECISION NOT NULL DEFAULT 10.0,
      estimated_minutes INTEGER NOT NULL DEFAULT 120,
      logged_minutes INTEGER NOT NULL DEFAULT 0,
      energy_level TEXT NOT NULL DEFAULT 'media',
      flexibility_note TEXT NOT NULL DEFAULT '',
      grade_20 DOUBLE PRECISION,
      student_notes TEXT NOT NULL DEFAULT '',
      teacher_feedback TEXT NOT NULL DEFAULT '',
      improvement_points TEXT NOT NULL DEFAULT '',
      feedback_sentiment TEXT,
      attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
      subtasks JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  tablesEnsured = true;
}

async function persistFullStateToDb(
  state: AcademicDatabaseState
): Promise<void> {
  await ensureStudyOsTables();

  await prisma.$transaction(async (tx) => {
    // 1. Upsert config
    await tx.studentConfigRow.upsert({
      where: { id: "default_student" },
      create: {
        id: "default_student",
        studentName: state.config.studentName,
        career: state.config.career,
        university: state.config.university,
        sede: state.config.sede,
        currentSemester: state.config.currentSemester,
        sectionCode: state.config.sectionCode,
        weeklyComfortHours: state.config.weeklyComfortHours,
        defaultTargetGrade: state.config.defaultTargetGrade,
        updatedAt: new Date(),
      },
      update: {
        studentName: state.config.studentName,
        career: state.config.career,
        university: state.config.university,
        sede: state.config.sede,
        currentSemester: state.config.currentSemester,
        sectionCode: state.config.sectionCode,
        weeklyComfortHours: state.config.weeklyComfortHours,
        defaultTargetGrade: state.config.defaultTargetGrade,
        updatedAt: new Date(),
      },
    });

    // 2. Delete removed subjects (cascade deletes schedule & tasks)
    const subjectIds = state.subjects.map((s) => s.id);
    if (subjectIds.length > 0) {
      await tx.subjectRow.deleteMany({
        where: { id: { notIn: subjectIds } },
      });
    } else {
      await tx.subjectRow.deleteMany({});
    }

    // 3. Upsert subjects
    for (const s of state.subjects) {
      await tx.subjectRow.upsert({
        where: { id: s.id },
        create: {
          id: s.id,
          code: s.code,
          name: s.name,
          semester: s.semester,
          credits: s.credits,
          professor: s.professor || "",
          professorContact: s.professorContact || "",
          section: s.section || "",
          modality: s.modality || "Presencial",
          color: s.color || "blue",
          targetGrade: s.targetGrade ?? 15,
          generalNotes: s.generalNotes || "",
          cortesConfig: JSON.parse(JSON.stringify(s.cortesConfig ?? [])),
          createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
        },
        update: {
          code: s.code,
          name: s.name,
          semester: s.semester,
          credits: s.credits,
          professor: s.professor || "",
          professorContact: s.professorContact || "",
          section: s.section || "",
          modality: s.modality || "Presencial",
          color: s.color || "blue",
          targetGrade: s.targetGrade ?? 15,
          generalNotes: s.generalNotes || "",
          cortesConfig: JSON.parse(JSON.stringify(s.cortesConfig ?? [])),
        },
      });
    }

    // 4. Sync schedule blocks
    const validSchedule = state.schedule.filter((b) =>
      subjectIds.includes(b.subjectId)
    );
    const scheduleIds = validSchedule.map((b) => b.id);
    if (scheduleIds.length > 0) {
      await tx.scheduleBlockRow.deleteMany({
        where: { id: { notIn: scheduleIds } },
      });
    } else {
      await tx.scheduleBlockRow.deleteMany({});
    }

    for (const b of validSchedule) {
      await tx.scheduleBlockRow.upsert({
        where: { id: b.id },
        create: {
          id: b.id,
          subjectId: b.subjectId,
          dayOfWeek: b.dayOfWeek,
          startTime: b.startTime,
          endTime: b.endTime,
          classroom: b.classroom || "Aula",
          sessionType: b.sessionType || "Teoría",
          notes: b.notes || "",
        },
        update: {
          subjectId: b.subjectId,
          dayOfWeek: b.dayOfWeek,
          startTime: b.startTime,
          endTime: b.endTime,
          classroom: b.classroom || "Aula",
          sessionType: b.sessionType || "Teoría",
          notes: b.notes || "",
        },
      });
    }

    // 5. Sync academic tasks
    const validTasks = state.tasks.filter((t) =>
      subjectIds.includes(t.subjectId)
    );
    const taskIds = validTasks.map((t) => t.id);
    if (taskIds.length > 0) {
      await tx.academicTaskRow.deleteMany({
        where: { id: { notIn: taskIds } },
      });
    } else {
      await tx.academicTaskRow.deleteMany({});
    }

    for (const t of validTasks) {
      await tx.academicTaskRow.upsert({
        where: { id: t.id },
        create: {
          id: t.id,
          subjectId: t.subjectId,
          corte: t.corte,
          title: t.title,
          description: t.description || "",
          taskType: t.taskType || "tarea",
          status: t.status || "pendiente",
          dueDate: new Date(t.dueDate),
          weightInCorte: t.weightInCorte ?? 10,
          estimatedMinutes: t.estimatedMinutes ?? 120,
          loggedMinutes: t.loggedMinutes ?? 0,
          energyLevel: t.energyLevel || "media",
          flexibilityNote: t.flexibilityNote || "",
          grade20: t.grade20 ?? null,
          studentNotes: t.studentNotes || "",
          teacherFeedback: t.teacherFeedback || "",
          improvementPoints: t.improvementPoints || "",
          feedbackSentiment: t.feedbackSentiment ?? null,
          attachments: JSON.parse(JSON.stringify(t.attachments ?? [])),
          subtasks: JSON.parse(JSON.stringify(t.subtasks ?? [])),
          createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
          updatedAt: new Date(),
        },
        update: {
          subjectId: t.subjectId,
          corte: t.corte,
          title: t.title,
          description: t.description || "",
          taskType: t.taskType || "tarea",
          status: t.status || "pendiente",
          dueDate: new Date(t.dueDate),
          weightInCorte: t.weightInCorte ?? 10,
          estimatedMinutes: t.estimatedMinutes ?? 120,
          loggedMinutes: t.loggedMinutes ?? 0,
          energyLevel: t.energyLevel || "media",
          flexibilityNote: t.flexibilityNote || "",
          grade20: t.grade20 ?? null,
          studentNotes: t.studentNotes || "",
          teacherFeedback: t.teacherFeedback || "",
          improvementPoints: t.improvementPoints || "",
          feedbackSentiment: t.feedbackSentiment ?? null,
          attachments: JSON.parse(JSON.stringify(t.attachments ?? [])),
          subtasks: JSON.parse(JSON.stringify(t.subtasks ?? [])),
          updatedAt: new Date(),
        },
      });
    }
  });
}

export async function GET() {
  try {
    await ensureStudyOsTables();

    const existingConfig = await prisma.studentConfigRow.findUnique({
      where: { id: "default_student" },
    });
    const subjectCount = await prisma.subjectRow.count();

    // Si la base de datos está totalmente virgen, sembramos los datos iniciales de UNEFA
    if (!existingConfig && subjectCount === 0) {
      await persistFullStateToDb(INITIAL_ACADEMIC_STATE);
    }

    const [cfgRow, subjRows, schedRows, taskRows] = await Promise.all([
      prisma.studentConfigRow.findUnique({ where: { id: "default_student" } }),
      prisma.subjectRow.findMany({ orderBy: { createdAt: "asc" } }),
      prisma.scheduleBlockRow.findMany({ orderBy: { dayOfWeek: "asc" } }),
      prisma.academicTaskRow.findMany({ orderBy: { dueDate: "asc" } }),
    ]);

    const config: StudentConfig = cfgRow
      ? {
          studentName: cfgRow.studentName,
          career: cfgRow.career,
          university: cfgRow.university,
          sede: cfgRow.sede,
          currentSemester: cfgRow.currentSemester,
          sectionCode: cfgRow.sectionCode,
          weeklyComfortHours: cfgRow.weeklyComfortHours,
          defaultTargetGrade: cfgRow.defaultTargetGrade,
        }
      : INITIAL_ACADEMIC_STATE.config;

    const subjects: Subject[] = subjRows.map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      semester: row.semester,
      credits: row.credits,
      professor: row.professor,
      professorContact: row.professorContact,
      section: row.section,
      modality: row.modality as Subject["modality"],
      color: row.color as Subject["color"],
      targetGrade: row.targetGrade,
      generalNotes: row.generalNotes,
      cortesConfig: Array.isArray(row.cortesConfig)
        ? (row.cortesConfig as unknown as CorteConfig[])
        : [],
      createdAt: row.createdAt.toISOString(),
    }));

    const schedule: ScheduleBlock[] = schedRows.map((row) => ({
      id: row.id,
      subjectId: row.subjectId,
      dayOfWeek: row.dayOfWeek as 1 | 2 | 3 | 4 | 5 | 6,
      startTime: row.startTime,
      endTime: row.endTime,
      classroom: row.classroom,
      sessionType: row.sessionType as ScheduleBlock["sessionType"],
      notes: row.notes,
    }));

    const tasks: AcademicTask[] = taskRows.map((row) => ({
      id: row.id,
      subjectId: row.subjectId,
      corte: row.corte as 1 | 2 | 3 | 4,
      title: row.title,
      description: row.description,
      taskType: row.taskType as AcademicTask["taskType"],
      status: row.status as AcademicTask["status"],
      dueDate: row.dueDate.toISOString(),
      weightInCorte: row.weightInCorte,
      estimatedMinutes: row.estimatedMinutes,
      loggedMinutes: row.loggedMinutes,
      energyLevel: row.energyLevel as AcademicTask["energyLevel"],
      flexibilityNote: row.flexibilityNote,
      grade20: row.grade20,
      studentNotes: row.studentNotes,
      teacherFeedback: row.teacherFeedback,
      improvementPoints: row.improvementPoints,
      feedbackSentiment:
        (row.feedbackSentiment as AcademicTask["feedbackSentiment"]) ?? null,
      attachments: Array.isArray(row.attachments)
        ? (row.attachments as unknown as TaskAttachment[])
        : [],
      subtasks: Array.isArray(row.subtasks)
        ? (row.subtasks as unknown as SubTask[])
        : [],
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));

    const state: AcademicDatabaseState = {
      config,
      subjects,
      schedule,
      tasks,
    };

    return NextResponse.json({ ok: true, state });
  } catch (error) {
    console.error("[StudyOS DB GET Error]:", error);
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AcademicDatabaseState;
    if (!body || !Array.isArray(body.subjects) || !Array.isArray(body.tasks)) {
      return NextResponse.json(
        { ok: false, error: "Formato de estado inválido." },
        { status: 400 }
      );
    }

    await persistFullStateToDb(body);

    return NextResponse.json({
      ok: true,
      message: "Sincronizado con PostgreSQL / Supabase correctamente.",
    });
  } catch (error) {
    console.error("[StudyOS DB POST Error]:", error);
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 }
    );
  }
}
