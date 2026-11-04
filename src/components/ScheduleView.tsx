'use client';

import React, { useMemo, useState } from 'react';
import { useAcademic } from '@/context/AcademicContext';
import { ScheduleBlock, SessionType } from '@/types/academic';
import {
  DAYS_OF_WEEK,
  detectScheduleConflicts,
  timeStringToMinutes,
} from '@/lib/calculations';
import { SUBJECT_COLOR_STYLES } from '@/lib/theme';
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  Edit3,
  MapPin,
  Plus,
  Trash2,
  User,
  X,
} from 'lucide-react';

interface ScheduleViewProps {
  onOpenNewSubject?: () => void;
}

export function ScheduleView({ onOpenNewSubject }: ScheduleViewProps) {
  const {
    state,
    addScheduleBlock,
    updateScheduleBlock,
    deleteScheduleBlock,
  } = useAcademic();

  const [subjectId, setSubjectId] = useState(state.subjects[0]?.id || '');
  const [dayOfWeek, setDayOfWeek] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [startTime, setStartTime] = useState('07:30');
  const [endTime, setEndTime] = useState('09:45');
  const [classroom, setClassroom] = useState('Aula 304');
  const [sessionType, setSessionType] = useState<SessionType>('Teoría');
  const [notes, setNotes] = useState('');
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: 'ok' | 'error';
    text: string;
  } | null>(null);
  const [mobileDayFilter, setMobileDayFilter] = useState<number | 'all'>('all');

  // Garantizar siempre un subjectId válido cuando existan materias inscritas
  const effectiveSubjectId =
    subjectId && state.subjects.some((s) => s.id === subjectId)
      ? subjectId
      : state.subjects[0]?.id || '';

  const subjectMap = useMemo(
    () => new Map(state.subjects.map((s) => [s.id, s])),
    [state.subjects]
  );

  const conflicts = useMemo(
    () => detectScheduleConflicts(state.schedule),
    [state.schedule]
  );

  const showNotice = (type: 'ok' | 'error', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => {
      setFeedbackMsg((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  };

  const handleStartEdit = (block: ScheduleBlock) => {
    setEditingBlockId(block.id);
    setSubjectId(block.subjectId);
    setDayOfWeek(block.dayOfWeek);
    setStartTime(block.startTime);
    setEndTime(block.endTime);
    setClassroom(block.classroom);
    setSessionType(block.sessionType);
    setNotes(block.notes || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingBlockId(null);
    setNotes('');
  };

  const handleSelectDayForNewBlock = (day: 1 | 2 | 3 | 4 | 5 | 6) => {
    setDayOfWeek(day);
    if (state.subjects.length === 0 && onOpenNewSubject) {
      onOpenNewSubject();
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveSubjectId) {
      showNotice(
        'error',
        'Primero debes inscribir al menos una materia para poder asignarle horario.'
      );
      return;
    }

    if (timeStringToMinutes(endTime) <= timeStringToMinutes(startTime)) {
      showNotice(
        'error',
        'La hora de salida debe ser posterior a la hora de inicio.'
      );
      return;
    }

    const payload = {
      subjectId: effectiveSubjectId,
      dayOfWeek,
      startTime,
      endTime,
      classroom: classroom.trim() || 'Aula por asignar',
      sessionType,
      notes: notes.trim(),
    };

    if (editingBlockId) {
      updateScheduleBlock(editingBlockId, payload);
      setEditingBlockId(null);
      showNotice('ok', 'Bloque de horario actualizado correctamente.');
    } else {
      addScheduleBlock(payload);
      showNotice('ok', 'Bloque añadido al horario semanal.');
    }
    setNotes('');
  };

  // Calcular horas semanales de clase
  const totalClassMinutes = state.schedule.reduce((acc, b) => {
    const diff =
      timeStringToMinutes(b.endTime) - timeStringToMinutes(b.startTime);
    return acc + Math.max(0, diff);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Aviso si aún no hay materias inscritas */}
      {state.subjects.length === 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-base font-bold text-white">
                Inscribe al menos una materia para armar tu horario
              </h4>
              <p className="text-sm text-muted mt-0.5">
                Selecciona tus asignaturas del Pensum UNEFA 2010 y luego añade aquí sus bloques de clase.
              </p>
            </div>
          </div>
          {onOpenNewSubject && (
            <button
              type="button"
              onClick={onOpenNewSubject}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-bold text-white flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Inscribir Materia UNEFA
            </button>
          )}
        </div>
      )}

      {/* Mensaje de confirmación o validación */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between gap-2 text-sm font-semibold ${
            feedbackMsg.type === 'ok'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'ok' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="p-1 rounded hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Alerta si hay choques de horario */}
      {conflicts.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-base font-bold text-rose-200">
              ¡Atención! Se detectaron {conflicts.length} choque(s) de horario
            </h4>
            {conflicts.map((c, idx) => {
              const sA = subjectMap.get(c.blockA.subjectId);
              const sB = subjectMap.get(c.blockB.subjectId);
              const dayName =
                DAYS_OF_WEEK.find((d) => d.value === c.dayOfWeek)?.label || '';
              return (
                <p key={idx} className="text-base text-rose-300">
                  • <strong>{dayName}</strong>: {sA?.name} ({c.blockA.startTime}–
                  {c.blockA.endTime}) se solapa con {sB?.name} (
                  {c.blockB.startTime}–{c.blockB.endTime}).
                </p>
              );
            })}
          </div>
        </div>
      )}

      {/* Formulario rápido para agregar o editar bloque de horario */}
      <form
        onSubmit={handleAddBlock}
        className={`p-5 rounded-2xl bg-slate-900 border space-y-4 transition-colors ${
          editingBlockId ? 'border-blue-500/60' : 'border-slate-800'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">
              {editingBlockId
                ? 'Editar Bloque del Horario Semanal'
                : 'Agregar Bloque al Horario Semanal UNEFA'}
            </h3>
          </div>
          <span className="text-base text-white">
            Total en aula:{' '}
            <strong className="text-white">
              {(totalClassMinutes / 60).toFixed(1)} horas/semana
            </strong>{' '}
            ({state.schedule.length} bloques)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="lg:col-span-2">
            <label className="block text-sm text-muted mb-1">
              Materia
            </label>
            <select
              value={effectiveSubjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              disabled={state.subjects.length === 0}
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-base text-white disabled:opacity-60"
            >
              {state.subjects.length === 0 ? (
                <option value="">-- Sin materias inscritas --</option>
              ) : (
                state.subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} · {s.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm text-muted mb-1">Día</label>
            <select
              value={dayOfWeek}
              onChange={(e) =>
                setDayOfWeek(Number(e.target.value) as 1 | 2 | 3 | 4 | 5 | 6)
              }
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-base text-white"
            >
              {DAYS_OF_WEEK.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm text-muted mb-1">
                Inicio
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-2.5 py-2 text-base text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1">
                Fin
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-2.5 py-2 text-base text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-muted mb-1">
              Aula / Laboratorio
            </label>
            <input
              type="text"
              placeholder="Lab. Computación 2"
              value={classroom}
              onChange={(e) => setClassroom(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-base text-white"
            />
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-sm text-muted mb-1">
                Tipo
              </label>
              <select
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value as SessionType)}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-2.5 py-2 text-base text-white"
              >
                <option value="Teoría">Teoría</option>
                <option value="Práctica">Práctica</option>
                <option value="Laboratorio">Laboratorio</option>
                <option value="Defensa">Defensa</option>
              </select>
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white flex items-center gap-1 shrink-0"
            >
              <Plus className="w-4 h-4" />
              {editingBlockId ? 'Guardar' : 'Añadir'}
            </button>
            {editingBlockId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-white shrink-0"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>

        {/* Nota opcional del bloque */}
        <div className="pt-1">
          <input
            type="text"
            placeholder="Nota opcional del bloque (ej: Traer bata de laboratorio, edificio B piso 2...)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white placeholder-white/60"
          />
        </div>
      </form>

      {/* Selector Rápido de Día (Mobile-First: permite filtrar un día en el teléfono sin hacer scroll largo) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 xl:hidden">
        <button
          type="button"
          onClick={() => setMobileDayFilter('all')}
          className={`px-3.5 py-2 rounded-xl text-sm font-bold shrink-0 border transition-colors ${
            mobileDayFilter === 'all'
              ? 'bg-blue-600 text-white border-blue-500'
              : 'bg-slate-900 text-muted border-slate-800 hover:text-white'
          }`}
        >
          Todos los días
        </button>
        {DAYS_OF_WEEK.map((d) => (
          <button
            key={d.value}
            type="button"
            onClick={() => setMobileDayFilter(d.value)}
            className={`px-3.5 py-2 rounded-xl text-sm font-bold shrink-0 border transition-colors ${
              mobileDayFilter === d.value
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-slate-900 text-muted border-slate-800 hover:text-white'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Grilla Semanal Lunes a Sábado (3 columnas amplias en desktop para evitar textos aplastados) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DAYS_OF_WEEK.filter(
          (day) => mobileDayFilter === 'all' || day.value === mobileDayFilter
        ).map((day) => {
          const dayBlocks = state.schedule
            .filter((b) => b.dayOfWeek === day.value)
            .sort(
              (a, b) =>
                timeStringToMinutes(a.startTime) -
                timeStringToMinutes(b.startTime)
            );

          return (
            <div
              key={day.value}
              className="rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col overflow-hidden"
            >
              <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2">
                <span className="text-base font-bold text-white truncate">
                  {day.label}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-white font-semibold whitespace-nowrap">
                    {dayBlocks.length}{' '}
                    {dayBlocks.length === 1 ? 'bloque' : 'bloques'}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleSelectDayForNewBlock(
                        day.value as 1 | 2 | 3 | 4 | 5 | 6
                      )
                    }
                    title={`Agregar clase el ${day.label}`}
                    className="p-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/35 border border-blue-500/30 text-blue-300"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-3 space-y-3 flex-1">
                {dayBlocks.length === 0 ? (
                  <button
                    type="button"
                    onClick={() =>
                      handleSelectDayForNewBlock(
                        day.value as 1 | 2 | 3 | 4 | 5 | 6
                      )
                    }
                    className="w-full h-32 rounded-xl border border-dashed border-slate-800/80 hover:border-blue-500/40 hover:bg-slate-950/50 transition-colors flex flex-col items-center justify-center gap-1.5 text-sm text-muted hover:text-white text-center px-3"
                  >
                    <span>Día libre de clases presenciales</span>
                    <span className="text-xs font-semibold text-blue-400">
                      + Toca para seleccionar {day.label} arriba
                    </span>
                  </button>
                ) : (
                  dayBlocks.map((block: ScheduleBlock) => {
                    const subj = subjectMap.get(block.subjectId);
                    const colorStyle =
                      SUBJECT_COLOR_STYLES[subj?.color || 'blue'];

                    return (
                      <div
                        key={block.id}
                        className={`p-3.5 rounded-xl border ${colorStyle.bg} ${colorStyle.border} space-y-2 relative group transition-all`}
                      >
                        <div className="flex items-center justify-between gap-2 pr-14">
                          <span className="inline-flex items-center gap-1 text-base font-extrabold text-white">
                            <Clock className="w-3.5 h-3.5 text-blue-400" />
                            {block.startTime} – {block.endTime}
                          </span>
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-950/70 text-white border border-white/10">
                            {block.sessionType}
                          </span>
                        </div>

                        <div>
                          <div className="text-sm font-mono text-white/90">
                            {subj?.code}
                          </div>
                          <div className="text-base font-bold text-white leading-snug">
                            {subj?.name || 'Materia eliminada'}
                          </div>
                        </div>

                        <div className="space-y-1 pt-1 border-t border-white/10 text-sm text-white">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="truncate">{block.classroom}</span>
                          </div>
                          {subj?.professor && (
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-white shrink-0" />
                              <span className="truncate">{subj.professor}</span>
                            </div>
                          )}
                          {block.notes && (
                            <div className="text-sm text-white italic pt-0.5">
                              “{block.notes}”
                            </div>
                          )}
                        </div>

                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(block)}
                            aria-label="Editar bloque de horario"
                            className="p-1.5 rounded-lg bg-slate-950/90 text-white hover:text-blue-400 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteScheduleBlock(block.id)}
                            aria-label="Eliminar bloque de horario"
                            className="p-1.5 rounded-lg bg-slate-950/90 text-white hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
