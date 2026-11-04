import {
  AcademicTask,
  CorteNumber,
  ScheduleBlock,
  Subject,
} from '@/types/academic';

export interface CorteBreakdown {
  corte: CorteNumber;
  maxPercent: 25; // Siempre 25% por corte
  maxPoints20: 5; // 25% de 20 pts = 5.00 pts máximos por corte
  evaluatedPercent: number; // Cuánto del 25% ya tiene nota (0 a 25)
  configuredPercent: number; // Cuánto del 25% tiene tareas creadas (0 a 25+)
  earnedPoints20: number; // Puntos netos ganados sobre los 5.00 pts del corte (0 a 5)
  averageGrade20: number | null; // Equivalente en escala 0 a 20 de lo evaluado en este corte
  isManual: boolean;
  isComplete: boolean; // Si ya se evaluó el 25% completo o tiene nota manual
  tasksCount: number;
  gradedTasksCount: number;
  teacherFeedback: string;
  studentNotes: string;
}

export type ProgressionStatus =
  | 'aprobada_meta' // Ya superó la meta con los puntos acumulados
  | 'aprobada' // Ya tiene >= 10.0 pts asegurados en mano
  | 'excelente' // Proyección actual >= meta
  | 'en_camino' // Necesita <= 14.5/20 en lo que resta para aprobar/meta
  | 'atencion' // Necesita entre 14.6 y 17.5/20 en lo que resta
  | 'riesgo'; // Necesita > 17.5/20 en lo que resta para alcanzar el objetivo

export interface SubjectGradeSummary {
  subjectId: string;
  cortes: [CorteBreakdown, CorteBreakdown, CorteBreakdown, CorteBreakdown];
  totalEarnedPoints20: number; // Puntos ya asegurados en el bolsillo (0 a 20)
  totalEvaluatedPercent: number; // % de la materia ya calificado (0 a 100)
  remainingPercent: number; // % de la materia por calificar (100 - totalEvaluatedPercent)
  remainingMaxPoints20: number; // Puntos aún en juego sobre 20
  currentProjectedGrade20: number | null; // Nota proyectada si mantiene el mismo rendimiento (0 a 20)
  // Metas de progresión
  pointsNeededToPass10: number; // Cuántos puntos netos faltan para llegar a 10.00
  pointsNeededToPass95: number; // Cuántos puntos netos faltan para llegar a 9.50 (redondeo a 10)
  pointsNeededForTarget: number; // Cuántos puntos netos faltan para llegar a subject.targetGrade
  neededGrade20ToPass10: number | null; // Nota promedio (sobre 20) requerida en lo que falta para sacar 10.0
  neededGrade20ForTarget: number | null; // Nota promedio (sobre 20) requerida en lo que falta para alcanzar la meta
  status: ProgressionStatus;
  statusLabel: string;
  statusAdvice: string;
}

export function calculateCorteBreakdown(
  subject: Subject,
  corteNum: CorteNumber,
  subjectTasks: AcademicTask[]
): CorteBreakdown {
  const corteCfg = subject.cortesConfig.find((c) => c.corte === corteNum) ?? {
    corte: corteNum,
    useManualGrade: false,
    manualGrade20: null,
    teacherCorteFeedback: '',
    studentCorteNotes: '',
    isClosed: false,
  };

  const corteTasks = subjectTasks.filter((t) => t.corte === corteNum);
  const configuredPercent = corteTasks.reduce(
    (acc, t) => acc + Number(t.weightInCorte || 0),
    0
  );

  // Si usa nota directa manual en el corte
  if (corteCfg.useManualGrade && corteCfg.manualGrade20 !== null) {
    const clampedGrade = Math.min(20, Math.max(0, Number(corteCfg.manualGrade20)));
    const earnedPoints20 = (clampedGrade / 20) * 5; // 5 puntos máx por corte
    return {
      corte: corteNum,
      maxPercent: 25,
      maxPoints20: 5,
      evaluatedPercent: 25,
      configuredPercent: Math.max(25, configuredPercent),
      earnedPoints20: Number(earnedPoints20.toFixed(2)),
      averageGrade20: Number(clampedGrade.toFixed(2)),
      isManual: true,
      isComplete: true,
      tasksCount: corteTasks.length,
      gradedTasksCount: corteTasks.filter((t) => t.grade20 !== null).length,
      teacherFeedback: corteCfg.teacherCorteFeedback,
      studentNotes: corteCfg.studentCorteNotes,
    };
  }

  // Modo calculado por las tareas/evaluaciones del corte
  const gradedTasks = corteTasks.filter(
    (t) => t.grade20 !== null && t.grade20 !== undefined
  );

  let evaluatedPercent = 0;
  let earnedPoints20 = 0;

  for (const task of gradedTasks) {
    const w = Math.max(0, Number(task.weightInCorte || 0));
    const g = Math.min(20, Math.max(0, Number(task.grade20 ?? 0)));
    evaluatedPercent += w;
    // Cada 1% de la materia equivale a 0.20 puntos en la escala de 20.
    // Por tanto: puntos ganados = (g / 20) * (w / 100) * 20 = (g * w) / 100
    earnedPoints20 += (g * w) / 100;
  }

  // Limitamos por seguridad el máximo de un corte a 25% y 5.00 pts
  const cappedEvaluatedPercent = Math.min(25, evaluatedPercent);
  const cappedEarnedPoints20 = Math.min(5, earnedPoints20);

  const averageGrade20 =
    evaluatedPercent > 0
      ? Number(((earnedPoints20 / evaluatedPercent) * 100).toFixed(2))
      : null;

  return {
    corte: corteNum,
    maxPercent: 25,
    maxPoints20: 5,
    evaluatedPercent: Number(cappedEvaluatedPercent.toFixed(2)),
    configuredPercent: Number(configuredPercent.toFixed(2)),
    earnedPoints20: Number(cappedEarnedPoints20.toFixed(2)),
    averageGrade20,
    isManual: false,
    isComplete: cappedEvaluatedPercent >= 25 || corteCfg.isClosed,
    tasksCount: corteTasks.length,
    gradedTasksCount: gradedTasks.length,
    teacherFeedback: corteCfg.teacherCorteFeedback,
    studentNotes: corteCfg.studentCorteNotes,
  };
}

export function calculateSubjectGradeSummary(
  subject: Subject,
  allTasks: AcademicTask[]
): SubjectGradeSummary {
  const subjectTasks = allTasks.filter((t) => t.subjectId === subject.id);

  const c1 = calculateCorteBreakdown(subject, 1, subjectTasks);
  const c2 = calculateCorteBreakdown(subject, 2, subjectTasks);
  const c3 = calculateCorteBreakdown(subject, 3, subjectTasks);
  const c4 = calculateCorteBreakdown(subject, 4, subjectTasks);
  const cortes: [CorteBreakdown, CorteBreakdown, CorteBreakdown, CorteBreakdown] = [
    c1,
    c2,
    c3,
    c4,
  ];

  const totalEarnedPoints20 = Number(
    cortes.reduce((sum, c) => sum + c.earnedPoints20, 0).toFixed(2)
  );
  const totalEvaluatedPercent = Number(
    Math.min(100, cortes.reduce((sum, c) => sum + c.evaluatedPercent, 0)).toFixed(2)
  );
  const remainingPercent = Number(Math.max(0, 100 - totalEvaluatedPercent).toFixed(2));
  const remainingMaxPoints20 = Number(((remainingPercent / 100) * 20).toFixed(2));

  const currentProjectedGrade20 =
    totalEvaluatedPercent > 0
      ? Number(((totalEarnedPoints20 / totalEvaluatedPercent) * 100).toFixed(2))
      : null;

  const pointsNeededToPass10 = Number(
    Math.max(0, 10.0 - totalEarnedPoints20).toFixed(2)
  );
  const pointsNeededToPass95 = Number(
    Math.max(0, 9.5 - totalEarnedPoints20).toFixed(2)
  );
  const pointsNeededForTarget = Number(
    Math.max(0, subject.targetGrade - totalEarnedPoints20).toFixed(2)
  );

  const neededGrade20ToPass10 =
    remainingPercent > 0
      ? Number(
          Math.max(0, (pointsNeededToPass10 / remainingMaxPoints20) * 20).toFixed(1)
        )
      : pointsNeededToPass10 <= 0
      ? 0
      : null;

  const neededGrade20ForTarget =
    remainingPercent > 0
      ? Number(
          Math.max(0, (pointsNeededForTarget / remainingMaxPoints20) * 20).toFixed(1)
        )
      : pointsNeededForTarget <= 0
      ? 0
      : null;

  let status: ProgressionStatus = 'en_camino';
  let statusLabel = 'En buen ritmo';
  let statusAdvice = '';

  if (totalEarnedPoints20 >= subject.targetGrade) {
    status = 'aprobada_meta';
    statusLabel = '¡Meta alcanzada!';
    statusAdvice = `Ya aseguraste ${totalEarnedPoints20} pts sobre 20 y superaste tu meta de ${subject.targetGrade} pts.`;
  } else if (totalEarnedPoints20 >= 10) {
    status = 'aprobada';
    statusLabel = 'Materia aprobada (≥10 pts)';
    statusAdvice = `Ya tienes ${totalEarnedPoints20}/20 pts seguros. Necesitas promediar ${neededGrade20ForTarget ?? 0}/20 en el ${remainingPercent}% restante para tu meta de ${subject.targetGrade} pts.`;
  } else if (
    currentProjectedGrade20 !== null &&
    currentProjectedGrade20 >= subject.targetGrade
  ) {
    status = 'excelente';
    statusLabel = 'Proyección sobresaliente';
    statusAdvice = `Tu ritmo actual proyecta ${currentProjectedGrade20}/20. Solo necesitas promediar ${neededGrade20ToPass10}/20 en lo que resta para aprobar con 10 pts.`;
  } else if ((neededGrade20ToPass10 ?? 10) <= 13.5) {
    status = 'en_camino';
    statusLabel = 'En camino seguro';
    statusAdvice = `Te faltan ${pointsNeededToPass10} pts para aprobar (promediar ${neededGrade20ToPass10}/20 en el ${remainingPercent}% restante).`;
  } else if ((neededGrade20ToPass10 ?? 10) <= 17) {
    status = 'atencion';
    statusLabel = 'Requiere enfoque';
    statusAdvice = `Para aprobar necesitas promediar ${neededGrade20ToPass10}/20 en el ${remainingPercent}% restante. Prioriza las próximas entregas de esta materia.`;
  } else {
    status = 'riesgo';
    statusLabel = 'Alerta de rendimiento';
    statusAdvice = `Necesitas ${pointsNeededToPass10} pts de los ${remainingMaxPoints20} pts restantes. Habla con el profesor y asegura cada actividad del corte actual.`;
  }

  return {
    subjectId: subject.id,
    cortes,
    totalEarnedPoints20,
    totalEvaluatedPercent,
    remainingPercent,
    remainingMaxPoints20,
    currentProjectedGrade20,
    pointsNeededToPass10,
    pointsNeededToPass95,
    pointsNeededForTarget,
    neededGrade20ToPass10,
    neededGrade20ForTarget,
    status,
    statusLabel,
    statusAdvice,
  };
}

// ============================================================================
// MOTOR DE PREVISIÓN DE TIEMPO Y RECOMENDACIÓN DE TIEMPOS SIN RIGIDEZ
// ============================================================================

export interface FlexiblePacingOption {
  id: 'suave' | 'bloques' | 'micro';
  title: string;
  badge: string;
  description: string;
  minutesPerSession: number;
  sessionsCount: number;
}

export interface FlexibleTimeRecommendation {
  remainingMinutes: number;
  completionPercent: number;
  daysUntilDue: number;
  hoursUntilDue: number;
  bufferLevel: 'completada' | 'holgado' | 'equilibrado' | 'ajustado' | 'vencida';
  bufferLabel: string;
  empathyMessage: string;
  nextMicroStep: string;
  options: FlexiblePacingOption[];
}

export function getFlexibleTimeRecommendation(
  task: AcademicTask
): FlexibleTimeRecommendation {
  const est = Math.max(15, Number(task.estimatedMinutes || 60));
  const logged = Math.max(0, Number(task.loggedMinutes || 0));
  const remainingMinutes =
    task.status === 'calificado' || task.status === 'entregado'
      ? 0
      : Math.max(0, est - logged);

  const completionPercent =
    task.status === 'calificado' || task.status === 'entregado'
      ? 100
      : Math.min(100, Math.round((logged / est) * 100));

  const now = new Date();
  const due = new Date(task.dueDate);
  const diffMs = due.getTime() - now.getTime();
  const hoursUntilDue = Math.round(diffMs / (1000 * 60 * 60));
  const daysUntilDue = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const pendingSubtask = task.subtasks.find((st) => !st.completed);
  const nextMicroStep = pendingSubtask
    ? `Avanzar solo en: "${pendingSubtask.title}" durante 15 min.`
    : task.flexibilityNote
    ? task.flexibilityNote
    : 'Abrir el documento/proyecto 15 minutos y dejar lista la estructura inicial sin buscar perfección.';

  if (remainingMinutes === 0) {
    return {
      remainingMinutes: 0,
      completionPercent: 100,
      daysUntilDue,
      hoursUntilDue,
      bufferLevel: 'completada',
      bufferLabel: 'Tiempo cubierto',
      empathyMessage: '¡Excelente! Ya cubriste el tiempo estimado para este trabajo.',
      nextMicroStep: 'Verificar que todos los links/archivos estén adjuntos antes de cerrar.',
      options: [],
    };
  }

  const effectiveDays = Math.max(1, daysUntilDue);
  const dailyAvgMinutes = Math.ceil(remainingMinutes / effectiveDays);

  let bufferLevel: FlexibleTimeRecommendation['bufferLevel'] = 'equilibrado';
  let bufferLabel = 'Ritmo cómodo';
  let empathyMessage = '';

  if (diffMs < 0) {
    bufferLevel = 'vencida';
    bufferLabel = 'Plazo cumplido · Priorizar cierre';
    empathyMessage = `Quedan ~${formatMinutesHuman(remainingMinutes)} de trabajo estimado. Concéntrate en una versión funcional entregable sin perfeccionismo.`;
  } else if (daysUntilDue >= 5 && dailyAvgMinutes <= 35) {
    bufferLevel = 'holgado';
    bufferLabel = 'Holgura amplia · Cero estrés';
    empathyMessage = `Tienes ${daysUntilDue} días de margen para ${formatMinutesHuman(remainingMinutes)} restantes. Puedes avanzar a tu propio ritmo en ratos libres.`;
  } else if (daysUntilDue >= 2 && dailyAvgMinutes <= 65) {
    bufferLevel = 'equilibrado';
    bufferLabel = 'Buen margen flexible';
    empathyMessage = `Faltan ${daysUntilDue} días y ~${formatMinutesHuman(remainingMinutes)}. Elige cualquiera de estos 3 ritmos según tu energía de hoy:`;
  } else {
    bufferLevel = 'ajustado';
    bufferLabel = 'Recta final · Bloques enfocados';
    empathyMessage = `Entrega cercana (${daysUntilDue <= 1 ? 'en menos de 24h' : `en ${daysUntilDue} días`}). Divide los ${formatMinutesHuman(remainingMinutes)} restantes en bloques cortos con descansos.`;
  }

  // Construimos las 3 recomendaciones de tiempos SIN RIGIDEZ
  const gentleDays = Math.max(1, Math.min(effectiveDays, Math.ceil(remainingMinutes / 30)));
  const gentleMinutes = Math.max(15, Math.ceil(remainingMinutes / gentleDays / 5) * 5);

  const focusSessions = Math.max(1, Math.ceil(remainingMinutes / 60));
  const focusMinutes = Math.max(25, Math.ceil(remainingMinutes / focusSessions / 5) * 5);

  const options: FlexiblePacingOption[] = [
    {
      id: 'suave',
      title: 'Ritmo Suave (Sin presión)',
      badge: `${gentleDays} ${gentleDays === 1 ? 'día' : 'días libres'} · ~${gentleMinutes} min`,
      description: `Dedica ~${gentleMinutes} min en ${gentleDays} momentos cualesquiera de aquí a la entrega. Si un día estás cansado, lo mueves al siguiente sin culpa.`,
      minutesPerSession: gentleMinutes,
      sessionsCount: gentleDays,
    },
    {
      id: 'bloques',
      title: 'Por Bloques de Enfoque',
      badge: `${focusSessions} ${focusSessions === 1 ? 'bloque' : 'bloques'} de ${formatMinutesHuman(focusMinutes)}`,
      description: `Ideal si prefieres concentrarte de una vez: haz ${focusSessions} ${focusSessions === 1 ? 'sesión' : 'sesiones'} de ${formatMinutesHuman(focusMinutes)} cuando tengas mejor ánimo (${task.energyLevel === 'alta' ? 'preferiblemente en la mañana o fresco' : 'en cualquier tarde libre'}).`,
      minutesPerSession: focusMinutes,
      sessionsCount: focusSessions,
    },
    {
      id: 'micro',
      title: 'Romper Inercia Hoy (15 min)',
      badge: 'Solo 15 min ahora',
      description: nextMicroStep,
      minutesPerSession: 15,
      sessionsCount: 1,
    },
  ];

  return {
    remainingMinutes,
    completionPercent,
    daysUntilDue,
    hoursUntilDue,
    bufferLevel,
    bufferLabel,
    empathyMessage,
    nextMicroStep,
    options,
  };
}

export function formatMinutesHuman(totalMinutes: number): string {
  const mins = Math.max(0, Math.round(totalMinutes));
  if (mins === 0) return '0 min';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// ============================================================================
// DETECTOR DE CONFLICTOS DE HORARIO Y CLASE EN VIVO
// ============================================================================

export function timeStringToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map((n) => parseInt(n, 10) || 0);
  return h * 60 + m;
}

export interface ScheduleConflict {
  blockA: ScheduleBlock;
  blockB: ScheduleBlock;
  dayOfWeek: number;
}

export function detectScheduleConflicts(
  blocks: ScheduleBlock[]
): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];
  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      const a = blocks[i];
      const b = blocks[j];
      if (a.dayOfWeek !== b.dayOfWeek) continue;
      const startA = timeStringToMinutes(a.startTime);
      const endA = timeStringToMinutes(a.endTime);
      const startB = timeStringToMinutes(b.startTime);
      const endB = timeStringToMinutes(b.endTime);
      if (startA < endB && startB < endA) {
        conflicts.push({ blockA: a, blockB: b, dayOfWeek: a.dayOfWeek });
      }
    }
  }
  return conflicts;
}

export const DAYS_OF_WEEK: { value: 1 | 2 | 3 | 4 | 5 | 6; label: string; short: string }[] = [
  { value: 1, label: 'Lunes', short: 'Lun' },
  { value: 2, label: 'Martes', short: 'Mar' },
  { value: 3, label: 'Miércoles', short: 'Mié' },
  { value: 4, label: 'Jueves', short: 'Jue' },
  { value: 5, label: 'Viernes', short: 'Vie' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
];
