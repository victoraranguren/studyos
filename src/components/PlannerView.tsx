'use client';

import React, { useMemo, useState } from 'react';
import { useAcademic } from '@/context/AcademicContext';
import {
  AcademicTask,
  CorteNumber,
  TaskStatus,
} from '@/types/academic';
import {
  formatMinutesHuman,
  getFlexibleTimeRecommendation,
} from '@/lib/calculations';
import {
  ATTACHMENT_TYPE_META,
  ENERGY_LEVEL_META,
  FEEDBACK_SENTIMENT_META,
  SUBJECT_COLOR_STYLES,
  TASK_STATUS_META,
  TASK_TYPE_LABELS,
} from '@/lib/theme';
import {
  BatteryCharging,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Filter,
  Kanban,
  Layers,
  Link2,
  ListTodo,
  MessageSquareQuote,
  Plus,
  Sparkles,
  Timer,
} from 'lucide-react';

interface PlannerViewProps {
  onOpenNewTask: (subjectId?: string, corte?: CorteNumber) => void;
  onEditTask: (task: AcademicTask) => void;
}

export function PlannerView({ onOpenNewTask, onEditTask }: PlannerViewProps) {
  const {
    state,
    updateTaskStatus,
    logTaskTime,
    toggleSubtask,
    updateConfig,
  } = useAcademic();

  const [viewMode, setViewMode] = useState<'timeline' | 'kanban'>('timeline');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterCorte, setFilterCorte] = useState<string>('all');
  const [filterEnergy, setFilterEnergy] = useState<string>('all');
  const [expandedPacingTaskId, setExpandedPacingTaskId] = useState<
    string | null
  >(null);

  const subjectMap = useMemo(() => {
    const map = new Map(state.subjects.map((s) => [s.id, s]));
    return map;
  }, [state.subjects]);

  const filteredTasks = useMemo(() => {
    return state.tasks
      .filter((t) => {
        if (filterSubject !== 'all' && t.subjectId !== filterSubject)
          return false;
        if (filterCorte !== 'all' && t.corte !== Number(filterCorte))
          return false;
        if (filterEnergy !== 'all' && t.energyLevel !== filterEnergy)
          return false;
        return true;
      })
      .sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      );
  }, [state.tasks, filterSubject, filterCorte, filterEnergy]);

  // Cálculos del Asesor Semanal de Tiempo sin Rigidez
  const weeklyAnalysis = useMemo(() => {
    const activeTasks = state.tasks.filter(
      (t) => t.status === 'pendiente' || t.status === 'en_progreso'
    );
    const now = new Date();
    const in7Days = new Date();
    in7Days.setDate(now.getDate() + 7);

    const dueThisWeek = activeTasks.filter(
      (t) => new Date(t.dueDate).getTime() <= in7Days.getTime()
    );

    const remainingMinutesThisWeek = dueThisWeek.reduce(
      (sum, t) =>
        sum + Math.max(0, (t.estimatedMinutes || 60) - (t.loggedMinutes || 0)),
      0
    );

    const totalRemainingMinutesAll = activeTasks.reduce(
      (sum, t) =>
        sum + Math.max(0, (t.estimatedMinutes || 60) - (t.loggedMinutes || 0)),
      0
    );

    const comfortMinutes = (state.config.weeklyComfortHours || 14) * 60;
    const loadRatio =
      comfortMinutes > 0
        ? Math.round((remainingMinutesThisWeek / comfortMinutes) * 100)
        : 0;

    // Sugerencias inteligentes según energía actual del estudiante
    const lowEnergyPick = activeTasks.find((t) => t.energyLevel === 'ligera');
    const highPriorityPick = [...activeTasks].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    )[0];

    return {
      activeCount: activeTasks.length,
      dueThisWeekCount: dueThisWeek.length,
      remainingMinutesThisWeek,
      totalRemainingMinutesAll,
      comfortMinutes,
      loadRatio,
      lowEnergyPick,
      highPriorityPick,
    };
  }, [state.tasks, state.config.weeklyComfortHours]);

  const renderTaskCard = (task: AcademicTask) => {
    const subj = subjectMap.get(task.subjectId);
    const colorStyle =
      SUBJECT_COLOR_STYLES[subj?.color || 'blue'];
    const statusMeta = TASK_STATUS_META[task.status];
    const energyMeta = ENERGY_LEVEL_META[task.energyLevel];
    const rec = getFlexibleTimeRecommendation(task);
    const isExpanded = expandedPacingTaskId === task.id;
    const completedSubtasks = task.subtasks.filter((s) => s.completed).length;

    return (
      <div
        key={task.id}
        className="rounded-2xl bg-slate-900/95 border border-slate-800 hover:border-slate-700/90 transition-all p-5 flex flex-col justify-between gap-4 shadow-md"
      >
        <div className="space-y-3">
          {/* Top badges: Materia, Corte, Peso %, Estado */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {subj && (
                <span
                  className={`px-2.5 py-0.5 rounded-md text-sm font-bold border ${colorStyle.badge}`}
                >
                  {subj.code} · {subj.name}
                </span>
              )}
              <span className="px-2 py-0.5 rounded-md text-sm font-bold bg-slate-800 text-white border border-slate-700">
                Corte {task.corte} ({task.weightInCorte}% ={' '}
                {((task.weightInCorte / 100) * 20).toFixed(1)} pts)
              </span>
              <span
                className={`px-2 py-0.5 rounded-md text-sm font-medium border ${energyMeta.badgeClass}`}
              >
                {energyMeta.label}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={task.status}
                onChange={(e) =>
                  updateTaskStatus(task.id, e.target.value as TaskStatus)
                }
                aria-label="Cambiar estado de la tarea"
                className={`rounded-lg px-2.5 py-1 text-sm font-semibold border cursor-pointer ${statusMeta.badgeClass}`}
              >
                {(Object.keys(TASK_STATUS_META) as TaskStatus[]).map((st) => (
                  <option
                    key={st}
                    value={st}
                    className="bg-slate-900 text-white"
                  >
                    {TASK_STATUS_META[st].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Título y Descripción */}
          <div>
            <div className="flex items-start justify-between gap-3">
              <button
                type="button"
                onClick={() => onEditTask(task)}
                className="text-left group"
              >
                <h4 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                  {task.title}
                </h4>
              </button>

              {task.grade20 !== null && (
                <div className="px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-right shrink-0">
                  <div className="text-base font-extrabold text-emerald-300">
                    {task.grade20} / 20 pts
                  </div>
                  <div className="text-base text-emerald-400/90">
                    +{((task.grade20 * task.weightInCorte) / 100).toFixed(2)}{' '}
                    pts al C{task.corte}
                  </div>
                </div>
              )}
            </div>

            {task.description && (
              <p className="text-sm text-muted mt-1 leading-relaxed">
                {task.description}
              </p>
            )}
          </div>

          {/* Plazo de Entrega y Previsión de Tiempo Sin Rigidez */}
          <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800/90 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-base">
              <div className="flex items-center gap-2 text-white">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>
                  Entrega:{' '}
                  <strong className="text-white">
                    {new Date(task.dueDate).toLocaleDateString('es-VE', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </strong>
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-sm font-semibold ${
                    rec.bufferLevel === 'completada'
                      ? 'bg-emerald-500/15 text-emerald-300'
                      : rec.bufferLevel === 'holgado'
                      ? 'bg-teal-500/15 text-teal-300'
                      : rec.bufferLevel === 'equilibrado'
                      ? 'bg-blue-500/15 text-blue-300'
                      : rec.bufferLevel === 'ajustado'
                      ? 'bg-amber-500/15 text-amber-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {rec.bufferLabel}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-white">
                  Invertido:{' '}
                  <strong className="text-emerald-400">
                    {formatMinutesHuman(task.loggedMinutes)}
                  </strong>{' '}
                  / {formatMinutesHuman(task.estimatedMinutes)} est.
                </span>
              </div>
            </div>

            {/* Barra de progreso de tiempo */}
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all"
                style={{ width: `${rec.completionPercent}%` }}
              />
            </div>

            {/* Botones de registro rápido de tiempo sin rigidez + Ver recomendaciones */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-base text-white mr-1">
                  Sumar avance:
                </span>
                {[15, 30, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => logTaskTime(task.id, mins)}
                    className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-emerald-500/20 border border-slate-800 hover:border-emerald-500/40 text-sm font-semibold text-white hover:text-emerald-300 transition-colors"
                  >
                    +{mins === 60 ? '1h' : `${mins}m`}
                  </button>
                ))}
              </div>

              {rec.options.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setExpandedPacingTaskId(isExpanded ? null : task.id)
                  }
                  className="text-base font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {isExpanded
                    ? 'Ocultar ritmos sugeridos'
                    : `Ver 3 ritmos sin rigidez (faltan ${formatMinutesHuman(
                        rec.remainingMinutes
                      )})`}
                </button>
              )}
            </div>

            {/* Panel desplegable con las 3 Recomendaciones de Tiempo Sin Rigidez */}
            {isExpanded && rec.options.length > 0 && (
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <p className="text-sm text-muted">{rec.empathyMessage}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {rec.options.map((opt) => (
                    <div
                      key={opt.id}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800/90 space-y-1"
                    >
                      <div className="text-base font-bold text-white">
                        {opt.title}
                      </div>
                      <span className="inline-block px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 text-base font-semibold">
                        {opt.badge}
                      </span>
                      <p className="text-sm text-muted leading-snug">
                        {opt.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Subtareas / Checklist */}
          {task.subtasks.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-base text-white">
                <span>
                  Pasos del trabajo ({completedSubtasks}/{task.subtasks.length})
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {task.subtasks.map((st) => (
                  <label
                    key={st.id}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800/70 text-base text-white cursor-pointer hover:border-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={st.completed}
                      onChange={() => toggleSubtask(task.id, st.id)}
                      className="rounded border-slate-600 text-blue-500"
                    />
                    <span
                      className={
                        st.completed
                          ? 'line-through text-white truncate'
                          : 'truncate'
                      }
                    >
                      {st.title}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Archivos y Links Vinculados */}
          {task.attachments.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-base text-white flex items-center gap-1">
                <Link2 className="w-3.5 h-3.5 text-blue-400" />
                Archivos/Links:
              </span>
              {task.attachments.map((att) => {
                const attMeta = ATTACHMENT_TYPE_META[att.type];
                return (
                  <a
                    key={att.id}
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-base font-medium border hover:opacity-90 transition-opacity ${attMeta.colorClass}`}
                  >
                    <span className="truncate max-w-[180px]">{att.title}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                );
              })}
            </div>
          )}

          {/* Feedback del Profesor y Notas del Estudiante */}
          {(task.teacherFeedback || task.studentNotes || task.improvementPoints) && (
            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-1.5 text-base">
              {task.teacherFeedback && (
                <div className="flex items-start gap-2">
                  <MessageSquareQuote className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-amber-300">
                        Feedback del Profesor:
                      </strong>
                      {task.feedbackSentiment && (
                        <span
                          className={`px-2 py-0.2 rounded text-base font-semibold border ${
                            FEEDBACK_SENTIMENT_META[task.feedbackSentiment]
                              .badgeClass
                          }`}
                        >
                          {
                            FEEDBACK_SENTIMENT_META[task.feedbackSentiment]
                              .label
                          }
                        </span>
                      )}
                    </div>
                    <p className="text-muted mt-0.5">
                      {task.teacherFeedback}
                    </p>
                  </div>
                </div>
              )}
              {task.improvementPoints && (
                <div className="text-emerald-300/90 pl-6">
                  <strong>Para mejorar:</strong> {task.improvementPoints}
                </div>
              )}
              {task.studentNotes && (
                <div className="text-white pl-6">
                  <strong>Mi nota:</strong> {task.studentNotes}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer de la tarjeta */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-base">
          <span className="text-white">
            {TASK_TYPE_LABELS[task.taskType]}
          </span>
          <button
            type="button"
            onClick={() => onEditTask(task)}
            className="text-blue-400 hover:text-blue-300 font-semibold"
          >
            Editar detalles / Links / Nota →
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* BANNER SUPERIOR: ASESOR DE TIEMPO FLEXIBLE SIN RIGIDEZ */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-blue-500/30 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-blue-400">
              <Sparkles className="w-4 h-4" />
              Previsión y Recomendación de Tiempos sin Rigidez
            </div>
            <h3 className="text-lg font-bold text-white">
              Planifica por energía y bloques flexibles, no con horarios rígidos
            </h3>
            <p className="text-sm text-muted max-w-2xl">
              En los próximos 7 días tienes{' '}
              <strong className="text-white">
                {weeklyAnalysis.dueThisWeekCount} entregas
              </strong>{' '}
              que requieren aproximadamente{' '}
              <strong className="text-emerald-400">
                {formatMinutesHuman(weeklyAnalysis.remainingMinutesThisWeek)}
              </strong>{' '}
              de dedicación efectiva.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center gap-4">
            <div>
              <label className="block text-sm text-muted">
                Tu ritmo semanal cómodo (horas libres):
              </label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="range"
                  min={4}
                  max={35}
                  step={1}
                  value={state.config.weeklyComfortHours}
                  onChange={(e) =>
                    updateConfig({
                      weeklyComfortHours: Number(e.target.value),
                    })
                  }
                  className="w-28 accent-blue-500"
                />
                <span className="text-base font-bold text-blue-400">
                  {state.config.weeklyComfortHours}h / sem
                </span>
              </div>
            </div>
            <div className="border-l border-slate-800 pl-4 text-right">
              <div className="text-base text-white">Ocupación 7 días</div>
              <div
                className={`text-base font-extrabold ${
                  weeklyAnalysis.loadRatio <= 75
                    ? 'text-emerald-400'
                    : weeklyAnalysis.loadRatio <= 100
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {weeklyAnalysis.loadRatio}%
              </div>
            </div>
          </div>
        </div>

        {/* Recomendaciones rápidas según cuánta energía o tiempo tengas HOY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 flex items-start gap-3">
            <Timer className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-base font-bold text-white">
                ¿Solo tienes 15–20 minutos hoy?
              </div>
              <p className="text-sm text-muted mt-0.5">
                {weeklyAnalysis.highPriorityPick
                  ? `Avanza el primer micro-paso de "${weeklyAnalysis.highPriorityPick.title}" y suma +15m sin presión.`
                  : '¡Tienes todas las entregas al día!'}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 flex items-start gap-3">
            <BatteryCharging className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-base font-bold text-white">
                ¿Estás cansado después de clases en la UNEFA?
              </div>
              <p className="text-sm text-muted mt-0.5">
                {weeklyAnalysis.lowEnergyPick
                  ? `Elige una actividad de Energía Ligera: "${weeklyAnalysis.lowEnergyPick.title}".`
                  : 'Dedica 20 min a ordenar links/archivos o repasar apuntes.'}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 flex items-start gap-3">
            <Layers className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-base font-bold text-white">
                Tiempo total pendiente en el semestre
              </div>
              <p className="text-sm text-muted mt-0.5">
                {formatMinutesHuman(weeklyAnalysis.totalRemainingMinutesAll)} en{' '}
                {weeklyAnalysis.activeCount} actividades activas (~
                {Math.ceil(weeklyAnalysis.totalRemainingMinutesAll / 60 / 5)}h por
                día hábil si lo distribuyes en 1 semana).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* BARRA DE FILTROS Y CAMBIO DE VISTA (Mobile-First) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <div className="hidden lg:flex items-center gap-1.5 text-base font-semibold text-white mr-1">
            <Filter className="w-4 h-4 text-blue-400" />
            Filtrar:
          </div>

          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="w-full sm:w-auto rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-base text-white"
          >
            <option value="all">Todas las Materias</option>
            {state.subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} · {s.name}
              </option>
            ))}
          </select>

          <select
            value={filterCorte}
            onChange={(e) => setFilterCorte(e.target.value)}
            className="w-full sm:w-auto rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-base text-white"
          >
            <option value="all">Todos los Cortes (I - IV)</option>
            <option value="1">Corte I (25%)</option>
            <option value="2">Corte II (25%)</option>
            <option value="3">Corte III (25%)</option>
            <option value="4">Corte IV (25%)</option>
          </select>

          <select
            value={filterEnergy}
            onChange={(e) => setFilterEnergy(e.target.value)}
            className="w-full sm:w-auto rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-base text-white"
          >
            <option value="all">Cualquier Nivel de Energía</option>
            <option value="ligera">Energía Ligera</option>
            <option value="media">Energía Media</option>
            <option value="alta">Enfoque Profundo</option>
          </select>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 w-full lg:w-auto">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 ${
                viewMode === 'timeline'
                  ? 'bg-blue-600 text-white'
                  : 'text-white hover:text-white'
              }`}
            >
              <ListTodo className="w-3.5 h-3.5" />
              Por Plazos
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 ${
                viewMode === 'kanban'
                  ? 'bg-blue-600 text-white'
                  : 'text-white hover:text-white'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              Kanban
            </button>
          </div>

          <button
            type="button"
            onClick={() => onOpenNewTask()}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white flex items-center gap-1.5 shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            Nueva Tarea
          </button>
        </div>
      </div>

      {/* CONTENIDO DEL PLANNER */}
      {viewMode === 'timeline' ? (
        <div className="space-y-6">
          {/* Pendientes y En Progreso ordenadas por plazo de entrega */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              Próximos Plazos de Entrega (
              {
                filteredTasks.filter(
                  (t) => t.status === 'pendiente' || t.status === 'en_progreso'
                ).length
              }
              )
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredTasks
                .filter(
                  (t) => t.status === 'pendiente' || t.status === 'en_progreso'
                )
                .map(renderTaskCard)}
            </div>
          </div>

          {/* Entregadas y Calificadas */}
          <div className="space-y-3 pt-4 border-t border-slate-800/80">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Trabajos Entregados y Calificados con Feedback (
              {
                filteredTasks.filter(
                  (t) => t.status === 'entregado' || t.status === 'calificado'
                ).length
              }
              )
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredTasks
                .filter(
                  (t) => t.status === 'entregado' || t.status === 'calificado'
                )
                .map(renderTaskCard)}
            </div>
          </div>
        </div>
      ) : (
        /* VISTA KANBAN */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {(
            ['pendiente', 'en_progreso', 'entregado', 'calificado'] as TaskStatus[]
          ).map((colStatus) => {
            const colTasks = filteredTasks.filter(
              (t) => t.status === colStatus
            );
            const meta = TASK_STATUS_META[colStatus];
            return (
              <div
                key={colStatus}
                className="rounded-2xl bg-slate-900/60 border border-slate-800 p-3.5 space-y-3"
              >
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${meta.dotClass}`}
                    />
                    <span className="text-sm font-bold uppercase tracking-wider text-muted">
                      {meta.label}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-base font-bold text-white">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {colTasks.map(renderTaskCard)}
                  {colTasks.length === 0 && (
                    <div className="p-6 rounded-xl border border-dashed border-slate-800 text-center text-base text-white">
                      Sin tareas en {meta.label.toLowerCase()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
