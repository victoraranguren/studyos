'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  AcademicTask,
  AttachmentType,
  CorteNumber,
  EnergyLevel,
  FeedbackSentiment,
  SubTask,
  TaskAttachment,
  TaskStatus,
  TaskType,
} from '@/types/academic';
import { useAcademic } from '@/context/AcademicContext';
import {
  ATTACHMENT_TYPE_META,
  ENERGY_LEVEL_META,
  FEEDBACK_SENTIMENT_META,
  TASK_STATUS_META,
  TASK_TYPE_LABELS,
} from '@/lib/theme';
import {
  formatMinutesHuman,
  getFlexibleTimeRecommendation,
} from '@/lib/calculations';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  GraduationCap,
  Link2,
  MessageSquareQuote,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTask: AcademicTask | null;
  defaultSubjectId?: string;
  defaultCorte?: CorteNumber;
}

export function TaskModal({
  isOpen,
  onClose,
  editingTask,
  defaultSubjectId,
  defaultCorte = 2,
}: TaskModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { state, addTask, updateTask, deleteTask } = useAcademic();

  const [activeTab, setActiveTab] = useState<
    'general' | 'tiempo' | 'archivos' | 'feedback'
  >('general');

  const getDefaultDueDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 4);
    d.setHours(23, 59, 0, 0);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}T23:59`;
  };

  // Form states initialized from editingTask or defaults
  const [subjectId, setSubjectId] = useState<string>(
    editingTask?.subjectId ?? (defaultSubjectId || state.subjects[0]?.id || '')
  );
  const [corte, setCorte] = useState<CorteNumber>(
    editingTask?.corte ?? defaultCorte
  );
  const [title, setTitle] = useState(editingTask?.title ?? '');
  const [description, setDescription] = useState(
    editingTask?.description ?? ''
  );
  const [taskType, setTaskType] = useState<TaskType>(
    editingTask?.taskType ?? 'tarea'
  );
  const [status, setStatus] = useState<TaskStatus>(
    editingTask?.status ?? 'pendiente'
  );
  const [dueDate, setDueDate] = useState(
    editingTask ? editingTask.dueDate.slice(0, 16) : getDefaultDueDate()
  );
  const [weightInCorte, setWeightInCorte] = useState<number>(
    editingTask?.weightInCorte ?? 10
  );

  // Flexible Time Estimation
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(
    editingTask?.estimatedMinutes ?? 120
  );
  const [loggedMinutes, setLoggedMinutes] = useState<number>(
    editingTask?.loggedMinutes ?? 0
  );
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>(
    editingTask?.energyLevel ?? 'media'
  );
  const [flexibilityNote, setFlexibilityNote] = useState<string>(
    editingTask?.flexibilityNote ?? ''
  );

  // Grades & Professor Feedback
  const [grade20Input, setGrade20Input] = useState<string>(
    editingTask?.grade20 !== null && editingTask?.grade20 !== undefined
      ? String(editingTask.grade20)
      : ''
  );
  const [studentNotes, setStudentNotes] = useState<string>(
    editingTask?.studentNotes ?? ''
  );
  const [teacherFeedback, setTeacherFeedback] = useState<string>(
    editingTask?.teacherFeedback ?? ''
  );
  const [improvementPoints, setImprovementPoints] = useState<string>(
    editingTask?.improvementPoints ?? ''
  );
  const [feedbackSentiment, setFeedbackSentiment] =
    useState<FeedbackSentiment | null>(editingTask?.feedbackSentiment ?? null);

  // Subtasks & Attachments
  const [subtasks, setSubtasks] = useState<SubTask[]>(
    editingTask?.subtasks ?? []
  );
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [attachments, setAttachments] = useState<TaskAttachment[]>(
    editingTask?.attachments ?? []
  );
  const [attTitle, setAttTitle] = useState('');
  const [attUrl, setAttUrl] = useState('');
  const [attType, setAttType] = useState<AttachmentType>('github');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  // Calcular cuánto porcentaje ya está ocupado en ese corte de esa materia
  const otherTasksInSameCorteWeight = state.tasks
    .filter(
      (t) =>
        t.subjectId === subjectId &&
        t.corte === corte &&
        t.id !== editingTask?.id
    )
    .reduce((acc, t) => acc + Number(t.weightInCorte || 0), 0);

  const totalCorteConfigured = otherTasksInSameCorteWeight + Number(weightInCorte || 0);
  const maxPointsOfThisTask = Number(((weightInCorte / 100) * 20).toFixed(2));
  const parsedGrade20 =
    grade20Input.trim() === ''
      ? null
      : Math.min(20, Math.max(0, Number(grade20Input)));
  const earnedPointsNet =
    parsedGrade20 !== null
      ? Number(((parsedGrade20 * weightInCorte) / 100).toFixed(2))
      : null;

  // Preview de recomendación flexible en vivo
  const previewRecommendation = getFlexibleTimeRecommendation({
    id: editingTask?.id || 'preview',
    subjectId,
    corte,
    title: title || 'Nueva tarea',
    description,
    taskType,
    status,
    dueDate: dueDate || new Date().toISOString(),
    weightInCorte,
    estimatedMinutes,
    loggedMinutes,
    energyLevel,
    flexibilityNote,
    grade20: parsedGrade20,
    studentNotes,
    teacherFeedback,
    improvementPoints,
    feedbackSentiment,
    attachments,
    subtasks,
    createdAt: '',
    updatedAt: '',
  });

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks((prev) => [
      ...prev,
      {
        id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        title: newSubtaskTitle.trim(),
        completed: false,
      },
    ]);
    setNewSubtaskTitle('');
  };

  const handleAddAttachmentLink = () => {
    if (!attTitle.trim() || !attUrl.trim()) return;
    setAttachments((prev) => [
      ...prev,
      {
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        title: attTitle.trim(),
        url: attUrl.trim(),
        type: attType,
        addedAt: new Date().toISOString(),
      },
    ]);
    setAttTitle('');
    setAttUrl('');
  };

  const handleLocalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeKB = Math.round(file.size / 1024);
    const sizeLabel =
      sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;

    // Si el archivo es pequeño (< 1.5MB) guardamos dataURL o ObjectURL para abrirlo directo en memoria
    const objectUrl = URL.createObjectURL(file);
    setAttachments((prev) => [
      ...prev,
      {
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        title: file.name,
        url: objectUrl,
        type: file.name.endsWith('.pdf') ? 'pdf' : 'file',
        fileName: file.name,
        fileSize: sizeLabel,
        addedAt: new Date().toISOString(),
      },
    ]);
    e.target.value = '';
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !subjectId) return;

    const finalStatus: TaskStatus =
      parsedGrade20 !== null && status !== 'calificado' ? 'calificado' : status;

    const payload = {
      subjectId,
      corte,
      title: title.trim(),
      description: description.trim(),
      taskType,
      status: finalStatus,
      dueDate: dueDate || new Date().toISOString(),
      weightInCorte: Number(weightInCorte) || 10,
      estimatedMinutes: Math.max(10, Number(estimatedMinutes) || 60),
      loggedMinutes: Math.max(0, Number(loggedMinutes) || 0),
      energyLevel,
      flexibilityNote: flexibilityNote.trim(),
      grade20: parsedGrade20,
      studentNotes: studentNotes.trim(),
      teacherFeedback: teacherFeedback.trim(),
      improvementPoints: improvementPoints.trim(),
      feedbackSentiment,
      attachments,
      subtasks,
    };

    if (editingTask) {
      updateTask(editingTask.id, payload);
    } else {
      addTask(payload);
    }
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="task-modal-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      className="w-full max-w-full sm:max-w-3xl rounded-t-2xl sm:rounded-2xl bg-slate-900 border border-slate-700/80 text-white shadow-2xl p-0 backdrop:bg-slate-950/80 backdrop:backdrop-blur-xs mb-0 mt-auto sm:m-auto"
    >
      <form onSubmit={handleSave} className="flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/95 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 id="task-modal-title" className="text-lg font-bold text-white">
                {editingTask
                  ? 'Editar Trabajo / Evaluación'
                  : 'Nueva Tarea o Evaluación UNEFA'}
              </h2>
              <p className="text-sm text-muted">
                Corte {corte} (25% = 5.0 pts máx) · Estimación flexible · Links y Feedback Docente
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-2 rounded-lg text-white hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs inside Modal */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 gap-1 overflow-x-auto">
          {[
            { id: 'general', label: '1. Datos y Corte (25%)', icon: BookOpen },
            {
              id: 'tiempo',
              label: '2. Tiempo sin Rigidez',
              icon: Clock,
            },
            {
              id: 'archivos',
              label: `3. Archivos y Links (${attachments.length})`,
              icon: Link2,
            },
            {
              id: 'feedback',
              label: '4. Nota y Feedback Profesor',
              icon: MessageSquareQuote,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setActiveTab(
                    tab.id as 'general' | 'tiempo' | 'archivos' | 'feedback'
                  )
                }
                className={`flex items-center gap-2 px-3.5 py-3 text-base font-medium border-b-2 whitespace-nowrap transition-colors ${
                  active
                    ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                    : 'border-transparent text-white hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold uppercase tracking-wider text-muted mb-1.5">
                    Materia (Asignatura) *
                  </label>
                  <select
                    required
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-base text-white focus:border-blue-500 focus:outline-none"
                  >
                    {state.subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} · {s.name} ({s.credits} UC)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold uppercase tracking-wider text-muted mb-1.5">
                    Corte Evaluativo (25% c/u) *
                  </label>
                  <div className="grid grid-cols-4 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    {([1, 2, 3, 4] as CorteNumber[]).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCorte(c)}
                        className={`py-2 rounded-lg text-base font-bold transition-all ${
                          corte === c
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-white hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        C{c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold uppercase tracking-wider text-muted mb-1.5">
                  Título de la Tarea, Proyecto o Evaluación *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Laboratorio SQL Normalización 3FN / Parcial Corte II..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-base text-white placeholder-white/70 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold uppercase tracking-wider text-muted mb-1.5">
                    Tipo de Actividad
                  </label>
                  <select
                    value={taskType}
                    onChange={(e) => setTaskType(e.target.value as TaskType)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-base text-white focus:border-blue-500 focus:outline-none"
                  >
                    {(Object.keys(TASK_TYPE_LABELS) as TaskType[]).map((t) => (
                      <option key={t} value={t}>
                        {TASK_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold uppercase tracking-wider text-muted mb-1.5">
                    Estado Actual
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-base text-white focus:border-blue-500 focus:outline-none"
                  >
                    {(Object.keys(TASK_STATUS_META) as TaskStatus[]).map((st) => (
                      <option key={st} value={st}>
                        {TASK_STATUS_META[st].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold uppercase tracking-wider text-muted mb-1.5">
                    Plazo de Entrega (Fecha/Hora)
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2.5 text-base text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Ponderación dentro del Corte de 25% */}
              <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-base font-semibold text-white">
                      Ponderación en el Corte {corte} (Máx 25% por corte = 5.00 pts)
                    </span>
                    <p className="text-sm text-muted">
                      Esta evaluación vale{' '}
                      <strong className="text-blue-400">{weightInCorte}%</strong> de la
                      materia ={' '}
                      <strong className="text-emerald-400">
                        {maxPointsOfThisTask} pts
                      </strong>{' '}
                      de los 20 puntos totales.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {[5, 10, 12.5, 15, 20, 25].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setWeightInCorte(preset)}
                        className={`px-2.5 py-1 rounded-lg text-sm font-semibold border transition-colors ${
                          weightInCorte === preset
                            ? 'bg-blue-600/30 border-blue-500 text-blue-200'
                            : 'bg-slate-900 border-slate-700 text-white hover:text-white'
                        }`}
                      >
                        {preset}%
                      </button>
                    ))}
                    <input
                      type="number"
                      min={1}
                      max={25}
                      step={0.5}
                      value={weightInCorte}
                      onChange={(e) =>
                        setWeightInCorte(
                          Math.min(25, Math.max(0, Number(e.target.value)))
                        )
                      }
                      className="w-16 rounded-lg bg-slate-900 border border-slate-700 px-2 py-1 text-base text-center text-white"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-base pt-1">
                  <span className="text-white">
                    Ocupación del Corte {corte}:{' '}
                    <strong
                      className={
                        totalCorteConfigured > 25
                          ? 'text-amber-400'
                          : 'text-white'
                      }
                    >
                      {totalCorteConfigured}% / 25%
                    </strong>
                  </span>
                  {totalCorteConfigured > 25 && (
                    <span className="text-amber-400 font-medium">
                      Aviso: Las actividades de este corte suman más de 25% ({totalCorteConfigured}%).
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold uppercase tracking-wider text-muted mb-1.5">
                  Descripción / Pautas del Trabajo
                </label>
                <textarea
                  rows={2}
                  placeholder="Instrucciones de la evaluación, normas IEEE/APA, capítulos que entran en el parcial..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2 text-base text-white placeholder-white/70 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Subtasks / Checklist para dividir el trabajo */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold uppercase tracking-wider text-muted">
                  Sub-pasos / Checklist del Trabajo (Opcional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Agregar paso pequeño (ej. Diseñar tabla SQL, Hacer portada UNEFA...)"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubtask();
                      }
                    }}
                    className="flex-1 rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2 text-base text-white placeholder-white/70 focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubtask}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-white flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    Añadir
                  </button>
                </div>
                {subtasks.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {subtasks.map((st) => (
                      <div
                        key={st.id}
                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-950 border border-slate-800/80"
                      >
                        <label className="flex items-center gap-2.5 text-base text-white cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={st.completed}
                            onChange={() =>
                              setSubtasks((prev) =>
                                prev.map((item) =>
                                  item.id === st.id
                                    ? { ...item, completed: !item.completed }
                                    : item
                                )
                              )
                            }
                            className="rounded border-slate-600 text-blue-500 focus:ring-blue-500"
                          />
                          <span
                            className={
                              st.completed ? 'line-through text-white' : ''
                            }
                          >
                            {st.title}
                          </span>
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setSubtasks((prev) =>
                              prev.filter((item) => item.id !== st.id)
                            )
                          }
                          className="text-white hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'tiempo' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/25">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      Previsión de Tiempo y Recomendación sin Rigidez
                    </h3>
                    <p className="text-sm text-muted mt-0.5">
                      No te imponemos horarios fijos que generan estrés si surge un imprevisto.
                      Calculamos opciones flexibles según tu energía y los días hasta la entrega.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <label className="block text-sm font-semibold uppercase tracking-wider text-muted">
                    Tiempo Total Estimado para Realizarla
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={15}
                      max={2400}
                      step={15}
                      value={estimatedMinutes}
                      onChange={(e) =>
                        setEstimatedMinutes(Math.max(15, Number(e.target.value)))
                      }
                      className="w-24 rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-base font-bold text-white"
                    />
                    <span className="text-base text-white">
                      minutos ({formatMinutesHuman(estimatedMinutes)})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: '45m', mins: 45 },
                      { label: '1h 30m', mins: 90 },
                      { label: '2h', mins: 120 },
                      { label: '3h', mins: 180 },
                      { label: '4h', mins: 240 },
                      { label: '6h', mins: 360 },
                    ].map((preset) => (
                      <button
                        key={preset.mins}
                        type="button"
                        onClick={() => setEstimatedMinutes(preset.mins)}
                        className={`px-2.5 py-1 rounded-lg text-base font-medium border ${
                          estimatedMinutes === preset.mins
                            ? 'bg-blue-600/30 border-blue-500 text-blue-200'
                            : 'bg-slate-900 border-slate-800 text-white hover:text-white'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <label className="block text-sm font-semibold uppercase tracking-wider text-muted">
                    Tiempo Ya Dedicado (Progreso Libre)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={2400}
                      step={15}
                      value={loggedMinutes}
                      onChange={(e) =>
                        setLoggedMinutes(Math.max(0, Number(e.target.value)))
                      }
                      className="w-24 rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-base font-bold text-emerald-400"
                    />
                    <span className="text-base text-white">
                      minutos ({formatMinutesHuman(loggedMinutes)} invertidos)
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[15, 30, 45, 60].map((add) => (
                      <button
                        key={add}
                        type="button"
                        onClick={() => setLoggedMinutes((prev) => prev + add)}
                        className="px-2.5 py-1 rounded-lg text-base font-medium bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25"
                      >
                        +{add}m
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setLoggedMinutes(0)}
                      className="px-2.5 py-1 rounded-lg text-base text-white hover:text-white bg-slate-900 border border-slate-800"
                    >
                      Reiniciar
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold uppercase tracking-wider text-muted mb-2">
                  Nivel de Energía / Carga Mental Requerida
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {(Object.keys(ENERGY_LEVEL_META) as EnergyLevel[]).map(
                    (lvl) => {
                      const meta = ENERGY_LEVEL_META[lvl];
                      const active = energyLevel === lvl;
                      return (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setEnergyLevel(lvl)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            active
                              ? `${meta.badgeClass} ring-2 ring-blue-500/40`
                              : 'bg-slate-950 border-slate-800 text-white hover:border-slate-700'
                          }`}
                        >
                          <div className="text-base font-bold">{meta.label}</div>
                          <div className="text-base opacity-80 mt-0.5 leading-snug">
                            {meta.hint}
                          </div>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold uppercase tracking-wider text-muted mb-1.5">
                  Tu Estrategia Flexible (Sin Rigidez)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Hacer los diagramas escuchando música un martes en la tarde y redactar conclusiones el jueves..."
                  value={flexibilityNote}
                  onChange={(e) => setFlexibilityNote(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-base text-white placeholder-white/70 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Recomendaciones generadas en tiempo real */}
              {previewRecommendation.options.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold uppercase tracking-wider text-muted">
                      Ritmos Sugeridos (Elige el que mejor se adapte a tu semana)
                    </span>
                    <span className="text-base font-semibold text-blue-400">
                      Restan {formatMinutesHuman(previewRecommendation.remainingMinutes)}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {previewRecommendation.options.map((opt) => (
                      <div
                        key={opt.id}
                        className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-base font-bold text-white">
                              {opt.title}
                            </span>
                          </div>
                          <span className="inline-block px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-300 text-base font-semibold mb-1.5">
                            {opt.badge}
                          </span>
                          <p className="text-sm text-muted leading-relaxed">
                            {opt.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'archivos' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-blue-400" />
                  Vincular Link de Trabajo (GitHub, Drive, PDF, Figma, Colab...)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm text-muted mb-1">
                      Tipo de Recurso
                    </label>
                    <select
                      value={attType}
                      onChange={(e) =>
                        setAttType(e.target.value as AttachmentType)
                      }
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-base text-white"
                    >
                      {(
                        Object.keys(ATTACHMENT_TYPE_META) as AttachmentType[]
                      ).map((k) => (
                        <option key={k} value={k}>
                          {ATTACHMENT_TYPE_META[k].label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm text-muted mb-1">
                      Título del Archivo o Enlace
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Repositorio GitHub / Informe IEEE 830 en Google Docs"
                      value={attTitle}
                      onChange={(e) => setAttTitle(e.target.value)}
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-base text-white"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://github.com/... o https://drive.google.com/..."
                    value={attUrl}
                    onChange={(e) => setAttUrl(e.target.value)}
                    className="flex-1 rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-base text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddAttachmentLink}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    Vincular Link
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
                  <span className="text-base text-white">
                    ¿Tienes un PDF, código o imagen en tu computadora?
                  </span>
                  <label className="cursor-pointer px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-white flex items-center gap-2 border border-slate-700">
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    Adjuntar Archivo Local
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleLocalFileUpload}
                    />
                  </label>
                </div>
              </div>

              {/* Lista de archivos/links vinculados */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted">
                  Recursos Vinculados a este Trabajo ({attachments.length})
                </h4>
                {attachments.length === 0 ? (
                  <div className="p-6 rounded-xl border border-dashed border-slate-800 text-center text-base text-white">
                    Aún no has vinculado enlaces ni archivos a esta tarea.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {attachments.map((att) => {
                      const meta = ATTACHMENT_TYPE_META[att.type];
                      return (
                        <div
                          key={att.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={`px-2.5 py-1 rounded-lg text-sm font-semibold border shrink-0 ${meta.colorClass}`}
                            >
                              {meta.label}
                            </span>
                            <div className="min-w-0">
                              <div className="text-base font-medium text-white truncate">
                                {att.title}
                              </div>
                              <div className="text-base text-white truncate">
                                {att.fileSize ? `${att.fileSize} · ` : ''}
                                {att.url}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-blue-400"
                              title="Abrir enlace/archivo"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                            <button
                              type="button"
                              onClick={() =>
                                setAttachments((prev) =>
                                  prev.filter((item) => item.id !== att.id)
                                )
                              }
                              className="p-2 rounded-lg bg-slate-900 hover:bg-rose-500/20 text-white hover:text-rose-400"
                              title="Desvincular"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'feedback' && (
            <div className="space-y-4">
              {/* Calificación sobre 20 pts */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <label className="block text-sm font-semibold uppercase tracking-wider text-muted">
                      Calificación Obtenida (Escala UNEFA 0 a 20 pts)
                    </label>
                    <p className="text-sm text-muted mt-0.5">
                      Deja vacío si aún no ha sido calificada por el profesor.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={0}
                      max={20}
                      step={0.1}
                      placeholder="Sin nota"
                      value={grade20Input}
                      onChange={(e) => setGrade20Input(e.target.value)}
                      className="w-28 rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-base font-bold text-center text-emerald-400 placeholder-white/70 focus:border-emerald-500 focus:outline-none"
                    />
                    <span className="text-base font-semibold text-white">
                      / 20 pts
                    </span>
                  </div>
                </div>

                {earnedPointsNet !== null && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between text-base">
                    <span className="text-emerald-200">
                      Aporte neto al Corte {corte} ({weightInCorte}% de la materia):
                    </span>
                    <strong className="text-emerald-300 text-base">
                      +{earnedPointsNet} pts de {maxPointsOfThisTask} pts posibles
                    </strong>
                  </div>
                )}
              </div>

              {/* Valoración del Feedback */}
              <div>
                <label className="block text-sm font-semibold uppercase tracking-wider text-muted mb-2">
                  Resultado / Tono de la Revisión del Profesor
                </label>
                <div className="flex flex-wrap gap-2">
                  {(
                    Object.keys(FEEDBACK_SENTIMENT_META) as FeedbackSentiment[]
                  ).map((sent) => {
                    const meta = FEEDBACK_SENTIMENT_META[sent];
                    const selected = feedbackSentiment === sent;
                    return (
                      <button
                        key={sent}
                        type="button"
                        onClick={() =>
                          setFeedbackSentiment(selected ? null : sent)
                        }
                        className={`px-3 py-1.5 rounded-xl text-sm font-semibold border transition-all ${
                          selected
                            ? `${meta.badgeClass} ring-2 ring-white/20`
                            : 'bg-slate-950 border-slate-800 text-white hover:text-white'
                        }`}
                      >
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold uppercase tracking-wider text-muted mb-1.5">
                  Feedback y Observaciones del Profesor
                </label>
                <textarea
                  rows={3}
                  placeholder="¿Qué comentó el profesor al revisar o defender el trabajo? (Ej: Falta normalizar la tabla Detalle_Factura, mejorar justificación técnica...)"
                  value={teacherFeedback}
                  onChange={(e) => setTeacherFeedback(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-base text-white placeholder-white/70 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold uppercase tracking-wider text-muted mb-1.5">
                  Puntos Clave a Mejorar para el Próximo Corte / Trabajo
                </label>
                <input
                  type="text"
                  placeholder="Ej: Incluir siempre restricciones de no negatividad / Verificar dirección de flechas UML..."
                  value={improvementPoints}
                  onChange={(e) => setImprovementPoints(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-base text-white placeholder-white/70 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold uppercase tracking-wider text-muted mb-1.5">
                  Mis Notas Personales / Apuntes de la Entrega
                </label>
                <textarea
                  rows={2}
                  placeholder="Apuntes propios sobre cómo resolviste el trabajo, dudas o recordatorios..."
                  value={studentNotes}
                  onChange={(e) => setStudentNotes(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2 text-base text-white placeholder-white/70 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/95">
          {editingTask ? (
            <button
              type="button"
              onClick={() => {
                deleteTask(editingTask.id);
                onClose();
              }}
              className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-sm font-semibold text-rose-300 flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar Tarea
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {editingTask ? 'Guardar Cambios' : 'Crear Tarea'}
            </button>
          </div>
        </div>
      </form>
    </dialog>
  );
}
