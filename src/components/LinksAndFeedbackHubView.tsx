'use client';

import React, { useMemo, useState } from 'react';
import { useAcademic } from '@/context/AcademicContext';
import {
  AcademicTask,
  AttachmentType,
} from '@/types/academic';
import {
  ATTACHMENT_TYPE_META,
  FEEDBACK_SENTIMENT_META,
  SUBJECT_COLOR_STYLES,
} from '@/lib/theme';
import {
  ExternalLink,
  FolderGit2,
  Link2,
  MessageSquareQuote,
  Plus,
  Search,
  Sparkles,
  Upload,
} from 'lucide-react';

interface LinksAndFeedbackHubViewProps {
  onEditTask: (task: AcademicTask) => void;
}

export function LinksAndFeedbackHubView({
  onEditTask,
}: LinksAndFeedbackHubViewProps) {
  const { state, addAttachment, updateTask } = useAcademic();

  const [subTab, setSubTab] = useState<'feedback' | 'links'>('feedback');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');

  // Formulario rápido para anexar un link a una tarea existente
  const [quickTaskId, setQuickTaskId] = useState(state.tasks[0]?.id || '');
  const effectiveQuickTaskId =
    quickTaskId && state.tasks.some((t) => t.id === quickTaskId)
      ? quickTaskId
      : state.tasks[0]?.id || '';
  const [quickTitle, setQuickTitle] = useState('');
  const [quickUrl, setQuickUrl] = useState('');
  const [quickType, setQuickType] = useState<AttachmentType>('github');

  const subjectMap = useMemo(
    () => new Map(state.subjects.map((s) => [s.id, s])),
    [state.subjects]
  );

  // Todas las tareas filtradas
  const filteredTasks = useMemo(() => {
    return state.tasks.filter((t) => {
      if (selectedSubject !== 'all' && t.subjectId !== selectedSubject)
        return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchFb = t.teacherFeedback.toLowerCase().includes(q);
        const matchNotes = t.studentNotes.toLowerCase().includes(q);
        const matchAtt = t.attachments.some((a) =>
          a.title.toLowerCase().includes(q)
        );
        return matchTitle || matchFb || matchNotes || matchAtt;
      }
      return true;
    });
  }, [state.tasks, selectedSubject, searchQuery]);

  // Todos los links/archivos aplanados
  const allAttachments = useMemo(() => {
    const list: {
      task: AcademicTask;
      attachment: AcademicTask['attachments'][number];
    }[] = [];
    for (const t of filteredTasks) {
      for (const a of t.attachments) {
        list.push({ task: t, attachment: a });
      }
    }
    return list;
  }, [filteredTasks]);

  const handleQuickAddAttachment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveQuickTaskId || !quickTitle.trim() || !quickUrl.trim()) return;
    addAttachment(effectiveQuickTaskId, {
      title: quickTitle.trim(),
      url: quickUrl.trim(),
      type: quickType,
    });
    setQuickTitle('');
    setQuickUrl('');
  };

  const handleQuickLocalFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !effectiveQuickTaskId) return;
    const objectUrl = URL.createObjectURL(file);
    const sizeKB = Math.round(file.size / 1024);
    addAttachment(effectiveQuickTaskId, {
      title: file.name,
      url: objectUrl,
      type: file.name.endsWith('.pdf') ? 'pdf' : 'file',
      fileName: file.name,
      fileSize: `${sizeKB} KB`,
    });
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Selector superior: Bitácora de Notas y Feedback Docente vs Repositorio de Archivos y Links */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setSubTab('feedback')}
            className={`px-4 py-2 rounded-lg text-base font-bold flex items-center gap-2 transition-colors ${
              subTab === 'feedback'
                ? 'bg-blue-600 text-white'
                : 'text-white hover:text-white'
            }`}
          >
            <MessageSquareQuote className="w-4 h-4" />
            Notas y Feedback del Profesor
          </button>
          <button
            type="button"
            onClick={() => setSubTab('links')}
            className={`px-4 py-2 rounded-lg text-base font-bold flex items-center gap-2 transition-colors ${
              subTab === 'links'
                ? 'bg-blue-600 text-white'
                : 'text-white hover:text-white'
            }`}
          >
            <Link2 className="w-4 h-4" />
            Archivos y Links de Trabajos ({allAttachments.length})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-xl justify-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-white absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar trabajo, corrección del profesor o link..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-9 pr-3 py-2 text-base text-white placeholder-white/70"
            />
          </div>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-base text-white"
          >
            <option value="all">Todas las Materias</option>
            {state.subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} · {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {subTab === 'feedback' ? (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-base font-bold text-white">
                Bitácora de Notas y Feedback del Profesor por Trabajo
              </h3>
              <p className="text-sm text-muted mt-0.5">
                Registra aquí la nota sobre 20 puntos, las observaciones que te dio el profesor en cada revisión y qué puntos debes aplicar en la siguiente entrega para asegurar los 5 puntos del próximo corte.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredTasks.map((task) => {
              const subj = subjectMap.get(task.subjectId);
              const colorStyle =
                SUBJECT_COLOR_STYLES[subj?.color || 'blue'];
              const netPts =
                task.grade20 !== null
                  ? ((task.grade20 * task.weightInCorte) / 100).toFixed(2)
                  : null;

              return (
                <div
                  key={task.id}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {subj && (
                          <span
                            className={`px-2.5 py-0.5 rounded-md text-sm font-bold border ${colorStyle.badge}`}
                          >
                            {subj.code} · {subj.name}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-md text-sm font-semibold bg-slate-800 text-white">
                          Corte {task.corte} ({task.weightInCorte}%)
                        </span>
                      </div>

                      {/* Input directo rápido de nota sobre 20 pts */}
                      <div className="flex items-center gap-2">
                        <span className="text-base text-white">Nota:</span>
                        <input
                          type="number"
                          min={0}
                          max={20}
                          step={0.1}
                          placeholder="--"
                          value={task.grade20 ?? ''}
                          onChange={(e) => {
                            const val =
                              e.target.value === ''
                                ? null
                                : Math.min(
                                    20,
                                    Math.max(0, Number(e.target.value))
                                  );
                            updateTask(task.id, {
                              grade20: val,
                              status: val !== null ? 'calificado' : task.status,
                            });
                          }}
                          className="w-16 rounded-lg bg-slate-950 border border-slate-700 px-2 py-1 text-base font-extrabold text-center text-emerald-400"
                        />
                        <span className="text-base text-white">/ 20</span>
                        {netPts && (
                          <span className="text-base font-bold text-emerald-400">
                            (+{netPts} pts)
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-white">
                        {task.title}
                      </h4>
                      {subj?.professor && (
                        <p className="text-sm text-muted">
                          Prof. {subj.professor}
                        </p>
                      )}
                    </div>

                    {/* Edición directa de Feedback del Profesor y Nota personal */}
                    <div className="space-y-2">
                      <div>
                        <label className="block text-base font-semibold text-amber-300 mb-1">
                          Feedback / Corrección del Profesor:
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Escribe aquí lo que dijo o corrigió el profesor..."
                          value={task.teacherFeedback}
                          onChange={(e) =>
                            updateTask(task.id, {
                              teacherFeedback: e.target.value,
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-base text-white placeholder-white/70 focus:border-amber-500/50 focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-base font-semibold text-emerald-300 mb-1">
                            Acción de mejora para el próximo corte:
                          </label>
                          <input
                            type="text"
                            placeholder="Ej: Incluir métricas en RNF..."
                            value={task.improvementPoints}
                            onChange={(e) =>
                              updateTask(task.id, {
                                improvementPoints: e.target.value,
                              })
                            }
                            className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-1.5 text-base text-white placeholder-white/70"
                          />
                        </div>
                        <div>
                          <label className="block text-base font-semibold text-muted mb-1">
                            Mi nota personal sobre el trabajo:
                          </label>
                          <input
                            type="text"
                            placeholder="Apuntes propios..."
                            value={task.studentNotes}
                            onChange={(e) =>
                              updateTask(task.id, {
                                studentNotes: e.target.value,
                              })
                            }
                            className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-1.5 text-base text-white placeholder-white/70"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-base">
                    <div className="flex items-center gap-2">
                      {task.feedbackSentiment && (
                        <span
                          className={`px-2 py-0.5 rounded text-sm font-semibold border ${
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
                      <span className="text-white">
                        {task.attachments.length} archivo(s)/link(s)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onEditTask(task)}
                      className="text-blue-400 hover:text-blue-300 font-semibold"
                    >
                      Abrir ficha completa →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* REPOSITORIO CENTRAL DE ARCHIVOS Y LINKS DE CADA TRABAJO */
        <div className="space-y-6">
          {/* Formulario rápido para vincular archivo o link a cualquier tarea */}
          <form
            onSubmit={handleQuickAddAttachment}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4"
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-blue-400" />
                Linkear Nuevo Archivo o Enlace a un Trabajo
              </h3>
              <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-sm font-semibold text-emerald-300 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                Subir Archivo Local Directo
                <input
                  type="file"
                  className="hidden"
                  onChange={handleQuickLocalFile}
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
              <div className="lg:col-span-4">
                <label className="block text-sm text-muted mb-1">
                  Trabajo / Evaluación Destino
                </label>
                <select
                  value={effectiveQuickTaskId}
                  onChange={(e) => setQuickTaskId(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-base text-white"
                >
                  {state.tasks.map((t) => {
                    const s = subjectMap.get(t.subjectId);
                    return (
                      <option key={t.id} value={t.id}>
                        [C{t.corte} · {s?.code}] {t.title}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm text-muted mb-1">
                  Tipo
                </label>
                <select
                  value={quickType}
                  onChange={(e) =>
                    setQuickType(e.target.value as AttachmentType)
                  }
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-base text-white"
                >
                  {(Object.keys(ATTACHMENT_TYPE_META) as AttachmentType[]).map(
                    (k) => (
                      <option key={k} value={k}>
                        {ATTACHMENT_TYPE_META[k].label}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="lg:col-span-3">
                <label className="block text-sm text-muted mb-1">
                  Nombre del Archivo / Link
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Repo GitHub / Informe PDF"
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-base text-white"
                />
              </div>

              <div className="lg:col-span-3 flex items-end gap-2">
                <div className="flex-1">
                  <label className="block text-sm text-muted mb-1">
                    URL o Ruta
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="https://..."
                    value={quickUrl}
                    onChange={(e) => setQuickUrl(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-base text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Linkear
                </button>
              </div>
            </div>
          </form>

          {/* Tarjetas de todos los archivos y links por trabajo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allAttachments.map(({ task, attachment }) => {
              const subj = subjectMap.get(task.subjectId);
              const colorStyle =
                SUBJECT_COLOR_STYLES[subj?.color || 'blue'];
              const attMeta = ATTACHMENT_TYPE_META[attachment.type];

              return (
                <div
                  key={attachment.id}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-sm font-bold border ${attMeta.colorClass}`}
                      >
                        {attMeta.label}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-sm font-bold border ${colorStyle.badge}`}
                      >
                        {subj?.code} · Corte {task.corte}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-white">
                        {attachment.title}
                      </h4>
                      <p className="text-sm text-muted mt-0.5 line-clamp-1">
                        Trabajo: {task.title}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-base">
                    <button
                      type="button"
                      onClick={() => onEditTask(task)}
                      className="text-white hover:text-white"
                    >
                      Ver tarea
                    </button>
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-semibold"
                    >
                      Abrir recurso
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
