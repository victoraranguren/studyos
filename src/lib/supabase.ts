import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  AcademicDatabaseState,
  AcademicTask,
  ScheduleBlock,
  StudentConfig,
  Subject,
} from '@/types/academic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const storageModeEnv = process.env.NEXT_PUBLIC_STORAGE_MODE || 'memory';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('tu-proyecto.supabase.co') &&
    !supabaseAnonKey.includes('tu-anon-key')
);

export const defaultStorageMode: 'memory' | 'supabase' =
  storageModeEnv === 'supabase' && isSupabaseConfigured ? 'supabase' : 'memory';

let clientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!clientInstance) {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return clientInstance;
}

// ============================================================================
// MAPPERS ENTRE MODELO EN MEMORIA Y TABLAS SQL DE SUPABASE
// ============================================================================

export async function fetchAllFromSupabase(): Promise<AcademicDatabaseState | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const [cfgRes, subjRes, schedRes, taskRes] = await Promise.all([
    supabase.from('student_config').select('*').eq('id', 'default_student').maybeSingle(),
    supabase.from('subjects').select('*').order('created_at', { ascending: true }),
    supabase.from('schedule_blocks').select('*').order('day_of_week', { ascending: true }),
    supabase.from('academic_tasks').select('*').order('due_date', { ascending: true }),
  ]);

  if (subjRes.error || schedRes.error || taskRes.error) {
    console.warn('Error consultando Supabase:', subjRes.error || schedRes.error || taskRes.error);
    return null;
  }

  const config: StudentConfig = cfgRes.data
    ? {
        studentName: cfgRes.data.student_name,
        career: cfgRes.data.career,
        university: cfgRes.data.university,
        sede: cfgRes.data.sede,
        currentSemester: Number(cfgRes.data.current_semester),
        sectionCode: cfgRes.data.section_code,
        weeklyComfortHours: Number(cfgRes.data.weekly_comfort_hours),
        defaultTargetGrade: Number(cfgRes.data.default_target_grade),
      }
    : {
        studentName: 'Estudiante Ing. Sistemas',
        career: 'Ingeniería de Sistemas',
        university: 'UNEFA',
        sede: 'Núcleo UNEFA',
        currentSemester: 6,
        sectionCode: '06S-2614-D1',
        weeklyComfortHours: 14,
        defaultTargetGrade: 16,
      };

  const subjects: Subject[] = (subjRes.data || []).map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    semester: Number(row.semester),
    credits: Number(row.credits),
    professor: row.professor || '',
    professorContact: row.professor_contact || '',
    section: row.section || '',
    modality: row.modality || 'Presencial',
    color: row.color || 'blue',
    targetGrade: Number(row.target_grade ?? 15),
    generalNotes: row.general_notes || '',
    cortesConfig: Array.isArray(row.cortes_config) ? row.cortes_config : [],
    createdAt: row.created_at || new Date().toISOString(),
  }));

  const schedule: ScheduleBlock[] = (schedRes.data || []).map((row) => ({
    id: row.id,
    subjectId: row.subject_id,
    dayOfWeek: Number(row.day_of_week) as 1 | 2 | 3 | 4 | 5 | 6,
    startTime: row.start_time,
    endTime: row.end_time,
    classroom: row.classroom || '',
    sessionType: row.session_type || 'Teoría',
    notes: row.notes || '',
  }));

  const tasks: AcademicTask[] = (taskRes.data || []).map((row) => ({
    id: row.id,
    subjectId: row.subject_id,
    corte: Number(row.corte) as 1 | 2 | 3 | 4,
    title: row.title,
    description: row.description || '',
    taskType: row.task_type || 'tarea',
    status: row.status || 'pendiente',
    dueDate: row.due_date,
    weightInCorte: Number(row.weight_in_corte ?? 10),
    estimatedMinutes: Number(row.estimated_minutes ?? 120),
    loggedMinutes: Number(row.logged_minutes ?? 0),
    energyLevel: row.energy_level || 'media',
    flexibilityNote: row.flexibility_note || '',
    grade20: row.grade_20 !== null && row.grade_20 !== undefined ? Number(row.grade_20) : null,
    studentNotes: row.student_notes || '',
    teacherFeedback: row.teacher_feedback || '',
    improvementPoints: row.improvement_points || '',
    feedbackSentiment: row.feedback_sentiment || null,
    attachments: Array.isArray(row.attachments) ? row.attachments : [],
    subtasks: Array.isArray(row.subtasks) ? row.subtasks : [],
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  }));

  return { config, subjects, schedule, tasks };
}

export async function syncStateToSupabase(
  state: AcademicDatabaseState
): Promise<{ ok: boolean; message: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      ok: false,
      message:
        'Supabase aún no está configurado en .env.local (NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY).',
    };
  }

  try {
    // 1. Upsert config
    const { error: cfgErr } = await supabase.from('student_config').upsert({
      id: 'default_student',
      student_name: state.config.studentName,
      career: state.config.career,
      university: state.config.university,
      sede: state.config.sede,
      current_semester: state.config.currentSemester,
      section_code: state.config.sectionCode,
      weekly_comfort_hours: state.config.weeklyComfortHours,
      default_target_grade: state.config.defaultTargetGrade,
      updated_at: new Date().toISOString(),
    });
    if (cfgErr) throw cfgErr;

    // 2. Upsert subjects
    if (state.subjects.length > 0) {
      const { error: subjErr } = await supabase.from('subjects').upsert(
        state.subjects.map((s) => ({
          id: s.id,
          code: s.code,
          name: s.name,
          semester: s.semester,
          credits: s.credits,
          professor: s.professor,
          professor_contact: s.professorContact || '',
          section: s.section,
          modality: s.modality,
          color: s.color,
          target_grade: s.targetGrade,
          general_notes: s.generalNotes,
          cortes_config: s.cortesConfig,
        }))
      );
      if (subjErr) throw subjErr;
    }

    // 3. Upsert schedule
    if (state.schedule.length > 0) {
      const { error: schedErr } = await supabase.from('schedule_blocks').upsert(
        state.schedule.map((b) => ({
          id: b.id,
          subject_id: b.subjectId,
          day_of_week: b.dayOfWeek,
          start_time: b.startTime,
          end_time: b.endTime,
          classroom: b.classroom,
          session_type: b.sessionType,
          notes: b.notes || '',
        }))
      );
      if (schedErr) throw schedErr;
    }

    // 4. Upsert tasks
    if (state.tasks.length > 0) {
      const { error: taskErr } = await supabase.from('academic_tasks').upsert(
        state.tasks.map((t) => ({
          id: t.id,
          subject_id: t.subjectId,
          corte: t.corte,
          title: t.title,
          description: t.description,
          task_type: t.taskType,
          status: t.status,
          due_date: new Date(t.dueDate).toISOString(),
          weight_in_corte: t.weightInCorte,
          estimated_minutes: t.estimatedMinutes,
          logged_minutes: t.loggedMinutes,
          energy_level: t.energyLevel,
          flexibility_note: t.flexibilityNote,
          grade_20: t.grade20,
          student_notes: t.studentNotes,
          teacher_feedback: t.teacherFeedback,
          improvement_points: t.improvementPoints,
          feedback_sentiment: t.feedbackSentiment,
          attachments: t.attachments,
          subtasks: t.subtasks,
          updated_at: new Date().toISOString(),
        }))
      );
      if (taskErr) throw taskErr;
    }

    return {
      ok: true,
      message: '¡Datos en memoria sincronizados exitosamente con Supabase!',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido sincronizando con Supabase';
    return { ok: false, message: msg };
  }
}
