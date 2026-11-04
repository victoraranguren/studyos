'use client';

import React, { useMemo, useState } from 'react';
import { useAcademic } from '@/context/AcademicContext';
import {
  AcademicTask,
  CorteNumber,
  Subject,
} from '@/types/academic';
import {
  calculateSubjectGradeSummary,
  formatMinutesHuman,
  getFlexibleTimeRecommendation,
} from '@/lib/calculations';
import { SUBJECT_COLOR_STYLES } from '@/lib/theme';
import { PlannerView } from '@/components/PlannerView';
import { GradesProgressionView } from '@/components/GradesProgressionView';
import { ScheduleView } from '@/components/ScheduleView';
import { SubjectsView } from '@/components/SubjectsView';
import { LinksAndFeedbackHubView } from '@/components/LinksAndFeedbackHubView';
import { TaskModal } from '@/components/TaskModal';
import { SubjectModal } from '@/components/SubjectModal';
import { DatabaseStatusModal } from '@/components/DatabaseStatusModal';
import {
  Award,
  BookOpen,
  Calculator,
  Calendar,
  Clock,
  Database,
  ExternalLink,
  GraduationCap,
  LayoutDashboard,
  Link2,
  ListChecks,
  MessageSquareQuote,
  Moon,
  Plus,
  Sparkles,
  Sun,
} from 'lucide-react';

type ActiveSection =
  | 'resumen'
  | 'planner'
  | 'cortes'
  | 'horarios'
  | 'materias'
  | 'recursos';

export function StudyOSApp() {
  const {
    state,
    isHydrated,
    theme,
    toggleTheme,
    storageMode,
    isSupabaseReady,
  } = useAcademic();

  const [activeSection, setActiveSection] = useState<ActiveSection>('resumen');

  // Modales
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<AcademicTask | null>(null);
  const [defaultModalSubjectId, setDefaultModalSubjectId] = useState<
    string | undefined
  >(undefined);
  const [defaultModalCorte, setDefaultModalCorte] = useState<CorteNumber>(2);

  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const [isDbModalOpen, setIsDbModalOpen] = useState(false);

  const handleOpenNewTask = (
    subjectId?: string,
    corte: CorteNumber = 2
  ) => {
    setEditingTask(null);
    setDefaultModalSubjectId(subjectId);
    setDefaultModalCorte(corte);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: AcademicTask) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleOpenNewSubject = () => {
    setEditingSubject(null);
    setIsSubjectModalOpen(true);
  };

  const handleEditSubject = (subject: Subject) => {
    setEditingSubject(subject);
    setIsSubjectModalOpen(true);
  };

  // Estadísticas rápidas para el Dashboard Resumen
  const dashboardStats = useMemo(() => {
    const summaries = state.subjects.map((s) => ({
      subject: s,
      summary: calculateSubjectGradeSummary(s, state.tasks),
    }));

    const pendingTasks = state.tasks
      .filter((t) => t.status === 'pendiente' || t.status === 'en_progreso')
      .sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      );

    const remainingTotalMinutes = pendingTasks.reduce(
      (sum, t) =>
        sum + Math.max(0, (t.estimatedMinutes || 60) - (t.loggedMinutes || 0)),
      0
    );

    const totalAttachments = state.tasks.reduce(
      (sum, t) => sum + t.attachments.length,
      0
    );

    const tasksWithTeacherFeedback = state.tasks.filter(
      (t) => t.teacherFeedback && t.teacherFeedback.trim().length > 0
    );

    const totalCredits = summaries.reduce(
      (acc, s) => acc + s.subject.credits,
      0
    );
    const weightedPoints = summaries.reduce(
      (acc, s) =>
        acc +
        (s.summary.currentProjectedGrade20 ?? s.subject.targetGrade) *
          s.subject.credits,
      0
    );
    const gpa20 =
      totalCredits > 0 ? (weightedPoints / totalCredits).toFixed(2) : '0.00';

    return {
      summaries,
      pendingTasks,
      remainingTotalMinutes,
      totalAttachments,
      tasksWithTeacherFeedback,
      gpa20,
      totalCredits,
    };
  }, [state.subjects, state.tasks]);

  const navItems: {
    id: ActiveSection;
    label: string;
    shortLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
  }[] = [
    {
      id: 'resumen',
      label: 'Resumen General',
      shortLabel: 'Resumen',
      icon: LayoutDashboard,
    },
    {
      id: 'planner',
      label: 'Planner y Tiempos sin Rigidez',
      shortLabel: 'Planner',
      icon: ListChecks,
      badge: dashboardStats.pendingTasks.length,
    },
    {
      id: 'cortes',
      label: '4 Cortes (25%) y Progresión',
      shortLabel: '4 Cortes / Notas',
      icon: Calculator,
    },
    {
      id: 'horarios',
      label: 'Horario Semanal',
      shortLabel: 'Horarios',
      icon: Calendar,
      badge: state.schedule.length,
    },
    {
      id: 'materias',
      label: 'Materias UNEFA',
      shortLabel: 'Materias',
      icon: BookOpen,
      badge: state.subjects.length,
    },
    {
      id: 'recursos',
      label: 'Links y Feedback Profesor',
      shortLabel: 'Links / Feedback',
      icon: MessageSquareQuote,
      badge: dashboardStats.totalAttachments,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* TOPBAR INSTITUCIONAL UNEFA ING. SISTEMAS (Mobile-First) */}
      <header className="sticky top-0 z-30 border-b border-slate-800/90 bg-slate-950/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-600/25 border border-blue-400/30 shrink-0">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white truncate">
                  UNEFA StudyOS
                </h1>
                <span className="px-2 py-0.5 rounded-full text-sm font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Ing. Sistemas
                </span>
              </div>
              <p className="text-sm text-muted truncate">
                {state.config.studentName} · Sem.{' '}
                {state.config.currentSemester} ·{' '}
                <span className="font-mono text-white">
                  {state.config.sectionCode}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {/* Botón Selector de Tema Claro / Tema Oscuro */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-sm font-semibold text-white flex items-center gap-2 transition-colors"
              title={
                theme === 'dark'
                  ? 'Cambiar a Tema Claro'
                  : 'Cambiar a Tema Oscuro'
              }
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden lg:inline">Tema Claro</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-blue-400" />
                  <span className="hidden lg:inline">Tema Oscuro</span>
                </>
              )}
            </button>

            {/* Botón de Estado En Memoria / Supabase */}
            <button
              type="button"
              onClick={() => setIsDbModalOpen(true)}
              className="p-2.5 sm:px-3 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-sm font-semibold text-white flex items-center gap-2 transition-colors"
              title="Configurar Memoria o Conectar a Supabase (.env)"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isSupabaseReady ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <Database className="w-4 h-4 text-blue-400" />
              <span className="hidden lg:inline">
                {storageMode === 'memory'
                  ? isHydrated
                    ? 'En Memoria'
                    : 'Cargando...'
                  : 'Supabase'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleOpenNewSubject}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sm font-semibold text-white flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Materia</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenNewTask()}
              className="flex-1 sm:flex-initial justify-center px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm sm:text-base font-bold text-white flex items-center gap-1.5 shadow-lg shadow-blue-600/25"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Tarea</span>
            </button>
          </div>
        </div>

        {/* BARRA DE NAVEGACIÓN DESKTOP (Oculta en móvil porque móvil usa Bottom Tab Bar) */}
        <div className="hidden md:flex max-w-7xl mx-auto px-4 sm:px-6 items-center gap-1 overflow-x-auto border-t border-slate-900">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                className={`px-3.5 py-3 text-base font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
                  active
                    ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                    : 'border-transparent text-muted hover:text-white hover:bg-slate-900/40'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-sm ${
                      active
                        ? 'bg-blue-500/25 text-blue-200'
                        : 'bg-slate-800 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL (Mobile-first padding + espacio inferior para barra móvil) */}
      <main className="max-w-7xl w-full mx-auto px-3.5 sm:px-6 py-4 sm:py-6 pb-24 md:pb-8 flex-1">
        {activeSection === 'resumen' && (
          <div className="space-y-6">
            {/* Tarjetas KPI de Resumen */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                type="button"
                onClick={() => setActiveSection('materias')}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/40 text-left transition-all space-y-2"
              >
                <div className="flex items-center justify-between text-sm font-semibold uppercase tracking-wider text-muted">
                  <span>Materias Inscritas</span>
                  <BookOpen className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl font-extrabold text-white">
                  {state.subjects.length} Materias
                </div>
                <div className="text-base text-white">
                  {dashboardStats.totalCredits} Unidades de Crédito (UC) ·{' '}
                  {state.schedule.length} bloques horarios
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection('cortes')}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-left transition-all space-y-2"
              >
                <div className="flex items-center justify-between text-sm font-semibold uppercase tracking-wider text-muted">
                  <span>Proyección 4 Cortes (25% c/u)</span>
                  <Award className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-extrabold text-emerald-400">
                  {dashboardStats.gpa20}{' '}
                  <span className="text-base font-normal text-white">
                    / 20 pts
                  </span>
                </div>
                <div className="text-base text-white">
                  Índice ponderado proyectado · Mínimo UNEFA: 10.0 pts
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection('planner')}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-left transition-all space-y-2"
              >
                <div className="flex items-center justify-between text-sm font-semibold uppercase tracking-wider text-muted">
                  <span>Tiempo Estimado Sin Rigidez</span>
                  <Clock className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-2xl font-extrabold text-white">
                  {formatMinutesHuman(dashboardStats.remainingTotalMinutes)}
                </div>
                <div className="text-base text-white">
                  En {dashboardStats.pendingTasks.length} entregas activas ·
                  Ritmo cómodo: {state.config.weeklyComfortHours}h/sem
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection('recursos')}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-left transition-all space-y-2"
              >
                <div className="flex items-center justify-between text-sm font-semibold uppercase tracking-wider text-muted">
                  <span>Links y Feedback Docente</span>
                  <MessageSquareQuote className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-extrabold text-amber-300">
                  {dashboardStats.totalAttachments} Links ·{' '}
                  {dashboardStats.tasksWithTeacherFeedback.length} Feedbacks
                </div>
                <div className="text-base text-white">
                  Repositorios, PDFs y correcciones de cada profesor
                </div>
              </button>
            </div>

            {/* Grid Principal del Resumen: 75% (9/12) Estado de los 4 Cortes y 25% (3/12) Próximas Entregas */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Columna Izquierda (75%): Estado de los 4 Cortes (25% c/u) y Progresión */}
              <div className="lg:col-span-9 p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-blue-400" />
                      Puntuación por 4 Cortes (25% = 5.0 pts c/u) y Progresión
                    </h2>
                    <p className="text-sm text-muted">
                      Haz clic en cualquier materia para simular notas o desglosar sus 4 cortes
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveSection('cortes')}
                    className="text-base font-semibold text-blue-400 hover:text-blue-300"
                  >
                    Abrir Calculador Completo →
                  </button>
                </div>

                <div className="space-y-3">
                  {dashboardStats.summaries.map(({ subject, summary }) => {
                    const colorStyle = SUBJECT_COLOR_STYLES[subject.color];
                    return (
                      <div
                        key={subject.id}
                        className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 space-y-2.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-sm font-mono font-bold border ${colorStyle.badge}`}
                            >
                              {subject.code}
                            </span>
                            <span className="text-base font-bold text-white">
                              {subject.name}
                            </span>
                          </div>
                          <div className="text-base">
                            <span className="text-white">Acumulado: </span>
                            <strong className="text-emerald-400 text-base">
                              {summary.totalEarnedPoints20.toFixed(2)} / 20 pts
                            </strong>
                            <span className="text-white ml-1.5">
                              (Faltan +{summary.pointsNeededToPass10} pts para 10)
                            </span>
                          </div>
                        </div>

                        {/* 4 Bloques de 25% (Mobile-First: 2x2 en teléfono, 4 en línea desde sm) */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {summary.cortes.map((c) => {
                            const pct = Math.min(
                              100,
                              Math.round((c.earnedPoints20 / 5) * 100)
                            );
                            return (
                              <div
                                key={c.corte}
                                className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 space-y-1"
                              >
                                <div className="flex items-center justify-between text-base">
                                  <span className="font-bold text-white">
                                    Corte {c.corte} (25%)
                                  </span>
                                  <span className="text-emerald-400 font-bold">
                                    {c.earnedPoints20.toFixed(2)}/5
                                  </span>
                                </div>
                                <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                  <div
                                    className={`h-full ${colorStyle.solid}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <div className="text-base text-white flex justify-between">
                                  <span>
                                    {c.averageGrade20 !== null
                                      ? `${c.averageGrade20}/20`
                                      : 'Sin nota'}
                                  </span>
                                  <span>{c.evaluatedPercent}%/25%</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Columna Derecha (25% del ancho total): Próximas Entregas con Ritmo Sin Rigidez */}
              <div className="lg:col-span-3 space-y-5">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                        Próximas Entregas (Ritmo sin Rigidez)
                      </h2>
                      <p className="text-sm text-muted mt-0.5">
                        Recomendaciones flexibles según días y energía
                      </p>
                    </div>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => setActiveSection('planner')}
                      className="text-sm font-semibold text-blue-400 hover:text-blue-300"
                    >
                      Ver todas en el Planner →
                    </button>
                  </div>

                  <div className="space-y-3">
                    {dashboardStats.pendingTasks.slice(0, 4).map((task) => {
                      const subj = state.subjects.find(
                        (s) => s.id === task.subjectId
                      );
                      const rec = getFlexibleTimeRecommendation(task);
                      return (
                        <div
                          key={task.id}
                          className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-base font-bold text-blue-400">
                              {subj?.code} · Corte {task.corte} (
                              {task.weightInCorte}%)
                            </span>
                            <span className="text-base text-white">
                              {rec.daysUntilDue <= 0
                                ? 'Vence hoy'
                                : `En ${rec.daysUntilDue} días`}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleEditTask(task)}
                            className="text-left block"
                          >
                            <h4 className="text-base font-bold text-white hover:text-blue-400">
                              {task.title}
                            </h4>
                          </button>

                          {rec.options[0] && (
                            <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-base text-indigo-200 flex items-start gap-2">
                              <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                              <div>
                                <strong>Sugerencia sin rigidez:</strong>{' '}
                                {rec.options[0].badge} —{' '}
                                {rec.options[0].description}
                              </div>
                            </div>
                          )}

                          {task.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {task.attachments.map((att) => (
                                <a
                                  key={att.id}
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-base text-blue-300 hover:text-white"
                                >
                                  <Link2 className="w-3 h-3" />
                                  {att.title}
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Últimos Feedbacks del Profesor */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <MessageSquareQuote className="w-4 h-4 text-amber-400" />
                      Últimos Feedbacks y Correcciones del Profesor
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveSection('recursos')}
                      className="text-base text-blue-400 hover:text-blue-300 font-semibold"
                    >
                      Bitácora completa →
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {dashboardStats.tasksWithTeacherFeedback
                      .slice(0, 3)
                      .map((t) => {
                        const subj = state.subjects.find(
                          (s) => s.id === t.subjectId
                        );
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => handleEditTask(t)}
                            className="w-full text-left p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/30 space-y-1"
                          >
                            <div className="flex items-center justify-between text-base">
                              <span className="font-bold text-amber-300">
                                {subj?.name} (Corte {t.corte})
                              </span>
                              {t.grade20 !== null && (
                                <span className="font-extrabold text-emerald-400">
                                  Nota: {t.grade20}/20
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted line-clamp-2">
                              “{t.teacherFeedback}”
                            </p>
                            {t.improvementPoints && (
                              <p className="text-base text-emerald-400/90">
                                → Mejorar: {t.improvementPoints}
                              </p>
                            )}
                          </button>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'planner' && (
          <PlannerView
            onOpenNewTask={handleOpenNewTask}
            onEditTask={handleEditTask}
          />
        )}

        {activeSection === 'cortes' && (
          <GradesProgressionView
            onOpenNewTask={handleOpenNewTask}
            onEditTask={handleEditTask}
            onEditSubject={handleEditSubject}
          />
        )}

        {activeSection === 'horarios' && <ScheduleView />}

        {activeSection === 'materias' && (
          <SubjectsView
            onOpenNewSubject={handleOpenNewSubject}
            onEditSubject={handleEditSubject}
            onOpenNewTask={handleOpenNewTask}
          />
        )}

        {activeSection === 'recursos' && (
          <LinksAndFeedbackHubView onEditTask={handleEditTask} />
        )}
      </main>

      {/* BARRA DE NAVEGACIÓN INFERIOR MOBILE-FIRST (Solo en móviles < md) */}
      <nav
        aria-label="Navegación principal móvil"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-1.5 py-1.5 grid grid-cols-6 gap-1"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSection(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-sm font-semibold transition-all ${
                active
                  ? 'bg-blue-600/20 text-blue-400'
                  : 'text-muted hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5 shrink-0" />
              <span className="truncate max-w-full">{item.shortLabel.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>

      {/* Modales Nativos Accesibles (<dialog>) */}
      <TaskModal
        key={`task-modal-${editingTask?.id ?? 'new'}-${defaultModalSubjectId ?? ''}-${defaultModalCorte}-${isTaskModalOpen}`}
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        editingTask={editingTask}
        defaultSubjectId={defaultModalSubjectId}
        defaultCorte={defaultModalCorte}
      />

      <SubjectModal
        key={`subj-modal-${editingSubject?.id ?? 'new'}-${isSubjectModalOpen}`}
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        editingSubject={editingSubject}
      />

      <DatabaseStatusModal
        key={`db-modal-${isDbModalOpen}`}
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
      />
    </div>
  );
}
