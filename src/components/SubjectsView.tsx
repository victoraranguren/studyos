'use client';

import React from 'react';
import { useAcademic } from '@/context/AcademicContext';
import { CorteNumber, Subject } from '@/types/academic';
import {
  calculateSubjectGradeSummary,
  DAYS_OF_WEEK,
} from '@/lib/calculations';
import { SUBJECT_COLOR_STYLES } from '@/lib/theme';
import {
  BookOpen,
  Calendar,
  Edit3,
  Mail,
  Plus,
  User,
} from 'lucide-react';

interface SubjectsViewProps {
  onOpenNewSubject: () => void;
  onEditSubject: (subject: Subject) => void;
  onOpenNewTask: (subjectId: string, corte?: CorteNumber) => void;
}

export function SubjectsView({
  onOpenNewSubject,
  onEditSubject,
  onOpenNewTask,
}: SubjectsViewProps) {
  const { state } = useAcademic();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-400" />
            Materias Inscritas · Ingeniería de Sistemas UNEFA
          </h3>
          <p className="text-sm text-muted mt-0.5">
            {state.subjects.length} asignaturas activas ·{' '}
            {state.subjects.reduce((acc, s) => acc + s.credits, 0)} Unidades de
            Crédito (UC) en total
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewSubject}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white flex items-center gap-1.5 shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          Inscribir Materia UNEFA
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {state.subjects.map((subject) => {
          const colorStyle = SUBJECT_COLOR_STYLES[subject.color];
          const summary = calculateSubjectGradeSummary(subject, state.tasks);
          const subjectBlocks = state.schedule.filter(
            (b) => b.subjectId === subject.id
          );
          const subjectTasks = state.tasks.filter(
            (t) => t.subjectId === subject.id
          );
          const pendingTasks = subjectTasks.filter(
            (t) => t.status === 'pendiente' || t.status === 'en_progreso'
          );

          return (
            <div
              key={subject.id}
              className="rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between overflow-hidden shadow-lg"
            >
              <div>
                {/* Franja superior de color */}
                <div className={`h-2 w-full ${colorStyle.solid}`} />

                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-md text-sm font-mono font-bold border ${colorStyle.badge}`}
                        >
                          {subject.code}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-sm font-semibold bg-slate-800 text-white">
                          {subject.credits} UC · Sem. {subject.semester}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-sm bg-slate-950 text-white border border-slate-800">
                          {subject.modality}
                        </span>
                      </div>
                      <h4 className="text-lg font-bold text-white mt-2">
                        {subject.name}
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => onEditSubject(subject)}
                      className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-white hover:text-white border border-slate-800"
                      title="Editar Materia"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Sección (y Profesor solo si se especificó) */}
                  <div className="space-y-1 text-base text-white bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                    <div className="flex items-center justify-between gap-2">
                      {subject.professor ? (
                        <span className="flex items-center gap-1.5 text-white font-medium">
                          <User className="w-3.5 h-3.5 text-blue-400" />
                          {subject.professor}
                        </span>
                      ) : (
                        <span className="text-sm text-muted">
                          Semestre {subject.semester} · {subject.modality}
                        </span>
                      )}
                      <span className="font-mono text-sm sm:text-base text-white">
                        Sec: {subject.section}
                      </span>
                    </div>
                    {subject.professorContact && (
                      <div className="flex items-center gap-1.5 text-sm text-white">
                        <Mail className="w-3.5 h-3.5 text-white" />
                        {subject.professorContact}
                      </div>
                    )}
                  </div>

                  {/* Horarios de esta materia */}
                  <div className="space-y-1.5">
                    <div className="text-sm font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                      Horario Asignado ({subjectBlocks.length})
                    </div>
                    {subjectBlocks.length === 0 ? (
                      <p className="text-sm text-muted italic">
                        Sin bloques en el horario aún.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {subjectBlocks.map((b) => {
                          const dName =
                            DAYS_OF_WEEK.find((d) => d.value === b.dayOfWeek)
                              ?.short || '';
                          return (
                            <span
                              key={b.id}
                              className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-base text-white"
                            >
                              <strong>{dName}</strong> {b.startTime}–{b.endTime}{' '}
                              ({b.classroom})
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Resumen de los 4 Cortes de 25% */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-base">
                      <span className="text-sm font-semibold uppercase tracking-wider text-muted">
                        Puntuación 4 Cortes (25% = 5 pts c/u)
                      </span>
                      <span className="font-bold text-emerald-400">
                        {summary.totalEarnedPoints20.toFixed(2)} / 20 pts
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                      {summary.cortes.map((c) => (
                        <div
                          key={c.corte}
                          className="p-2 rounded-xl bg-slate-950 border border-slate-800"
                        >
                          <div className="text-base font-bold text-white">
                            C{c.corte} (25%)
                          </div>
                          <div className="text-base font-extrabold text-white mt-0.5">
                            {c.earnedPoints20.toFixed(2)}
                            <span className="text-base text-white font-normal">
                              /5
                            </span>
                          </div>
                          <div className="text-base text-emerald-400">
                            {c.averageGrade20 !== null
                              ? `${c.averageGrade20}/20`
                              : '--'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {subject.generalNotes && (
                    <p className="text-sm text-muted bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                      {subject.generalNotes}
                    </p>
                  )}
                </div>
              </div>

              <div className="px-5 py-3.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
                <span className="text-base text-white">
                  <strong className="text-white">{pendingTasks.length}</strong>{' '}
                  tareas por entregar
                </span>
                <button
                  type="button"
                  onClick={() => onOpenNewTask(subject.id, 2)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-blue-300 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agregar Tarea
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
