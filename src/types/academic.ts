export type CorteNumber = 1 | 2 | 3 | 4;

export type SubjectColor =
  | 'blue'
  | 'emerald'
  | 'violet'
  | 'amber'
  | 'rose'
  | 'cyan'
  | 'indigo'
  | 'orange';

export type ModalityType = 'Presencial' | 'Semipresencial' | 'Virtual';

export type SessionType = 'Teoría' | 'Práctica' | 'Laboratorio' | 'Defensa';

export type TaskType =
  | 'tarea'
  | 'proyecto'
  | 'parcial'
  | 'laboratorio'
  | 'exposicion'
  | 'informe'
  | 'taller';

export type TaskStatus = 'pendiente' | 'en_progreso' | 'entregado' | 'calificado';

export type EnergyLevel = 'ligera' | 'media' | 'alta';

export type AttachmentType = 'github' | 'drive' | 'pdf' | 'figma' | 'file' | 'link';

export type FeedbackSentiment =
  | 'excelente'
  | 'bueno'
  | 'con_observaciones'
  | 'corregir';

export interface TaskAttachment {
  id: string;
  title: string;
  url: string;
  type: AttachmentType;
  fileName?: string;
  fileSize?: string;
  addedAt: string;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface CorteConfig {
  corte: CorteNumber; // 1, 2, 3 o 4 (cada uno vale 25% = 5.00 pts máx en escala 1-20)
  /**
   * Si el estudiante quiere colocar directamente la nota final del corte (0-20)
   * sin depender únicamente del promedio ponderado de tareas individuales:
   */
  useManualGrade: boolean;
  manualGrade20: number | null; // 0 a 20
  teacherCorteFeedback: string; // Feedback general del profesor en este corte
  studentCorteNotes: string; // Reflexión/nota del estudiante en este corte
  isClosed: boolean; // Si el corte ya cerró oficialmente
}

export interface Subject {
  id: string;
  code: string; // Ej: SYC-32225
  name: string; // Ej: Ingeniería del Software I
  semester: number; // 1 al 9
  credits: number; // UC (Unidades de Crédito, ej: 4)
  professor: string;
  professorContact?: string;
  section: string; // Ej: 06S-2614-D1
  modality: ModalityType;
  color: SubjectColor;
  targetGrade: number; // Meta personal sobre 20 (ej: 15.0, mínimo aprobatorio UNEFA = 10.0)
  generalNotes: string;
  cortesConfig: CorteConfig[]; // 4 cortes de 25% c/u
  createdAt: string;
}

export interface ScheduleBlock {
  id: string;
  subjectId: string;
  dayOfWeek: 1 | 2 | 3 | 4 | 5 | 6; // 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado
  startTime: string; // "07:30"
  endTime: string; // "09:45"
  classroom: string; // Ej: "Lab. Computación 2" o "Aula 304"
  sessionType: SessionType;
  notes?: string;
}

export interface AcademicTask {
  id: string;
  subjectId: string;
  corte: CorteNumber; // 1, 2, 3 o 4
  title: string;
  description: string;
  taskType: TaskType;
  status: TaskStatus;
  dueDate: string; // ISO string (YYYY-MM-DDTHH:mm)
  /**
   * Peso porcentual sobre el 100% de la materia (cada corte tiene un máximo de 25%).
   * Ejemplo: Un taller de 10% + un parcial de 15% = 25% del Corte I.
   * En puntos sobre 20: (weightInCorte / 100) * 20 = puntos máximos que aporta (ej. 10% = 2.0 pts).
   */
  weightInCorte: number;
  // Previsión de estimación de tiempo y recomendación de tiempos sin rigidez
  estimatedMinutes: number; // Tiempo total estimado en minutos (ej. 180 = 3h)
  loggedMinutes: number; // Tiempo ya invertido sin rigidez
  energyLevel: EnergyLevel; // Carga mental: ligera, media, alta
  flexibilityNote: string; // Estrategia sugerida o nota de ritmo flexible
  // Calificación y Feedback del Profesor
  grade20: number | null; // Nota obtenida en escala 0 a 20 (null si no ha sido evaluada)
  studentNotes: string; // Nota personal del estudiante sobre este trabajo
  teacherFeedback: string; // Feedback dejado por el profesor
  improvementPoints: string; // Qué mejorar para el próximo trabajo/corte
  feedbackSentiment: FeedbackSentiment | null;
  // Archivos y links vinculados
  attachments: TaskAttachment[];
  subtasks: SubTask[];
  createdAt: string;
  updatedAt: string;
}

export interface StudentConfig {
  studentName: string;
  career: string;
  university: string;
  sede: string;
  currentSemester: number;
  sectionCode: string;
  weeklyComfortHours: number; // Horas por semana que el estudiante siente cómodas para dedicar a tareas
  defaultTargetGrade: number; // Meta sobre 20 puntos (ej: 15)
}

export interface AcademicDatabaseState {
  config: StudentConfig;
  subjects: Subject[];
  schedule: ScheduleBlock[];
  tasks: AcademicTask[];
}
