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
  CalendarDays,
  Clock,
  MapPin,
  Plus,
  Trash2,
  User,
} from 'lucide-react';

export function ScheduleView() {
  const { state, addScheduleBlock, deleteScheduleBlock } = useAcademic();

  const [subjectId, setSubjectId] = useState(state.subjects[0]?.id || '');
  const [dayOfWeek, setDayOfWeek] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [startTime, setStartTime] = useState('07:30');
  const [endTime, setEndTime] = useState('09:45');
  const [classroom, setClassroom] = useState('Aula 304');
  const [sessionType, setSessionType] = useState<SessionType>('Teoría');
  const [notes, setNotes] = useState('');
  const [mobileDayFilter, setMobileDayFilter] = useState<number | 'all'>('all');

  const subjectMap = useMemo(
    () => new Map(state.subjects.map((s) => [s.id, s])),
    [state.subjects]
  );

  const conflicts = useMemo(
    () => detectScheduleConflicts(state.schedule),
    [state.schedule]
  );

  const handleAddBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId) return;
    addScheduleBlock({
      subjectId,
      dayOfWeek,
      startTime,
      endTime,
      classroom: classroom.trim() || 'Aula',
      sessionType,
      notes: notes.trim(),
    });
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

      {/* Formulario rápido para agregar bloque de horario */}
      <form
        onSubmit={handleAddBlock}
        className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">
              Agregar Bloque al Horario Semanal UNEFA
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
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-base text-white"
            >
              {state.subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} · {s.name}
                </option>
              ))}
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
              Añadir
            </button>
          </div>
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

      {/* Grilla Semanal Lunes a Sábado */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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
              <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <span className="text-base font-bold text-white">
                  {day.label}
                </span>
                <span className="text-base px-2 py-0.5 rounded-full bg-slate-800 text-white font-semibold">
                  {dayBlocks.length}{' '}
                  {dayBlocks.length === 1 ? 'bloque' : 'bloques'}
                </span>
              </div>

              <div className="p-3 space-y-3 flex-1">
                {dayBlocks.length === 0 ? (
                  <div className="h-32 rounded-xl border border-dashed border-slate-800/80 flex items-center justify-center text-base text-white text-center px-3">
                    Día libre de clases presenciales (Ideal para bloques de estudio flexible)
                  </div>
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
                        <div className="flex items-center justify-between gap-1">
                          <span className="inline-flex items-center gap-1 text-base font-extrabold text-white">
                            <Clock className="w-3.5 h-3.5 text-blue-400" />
                            {block.startTime} – {block.endTime}
                          </span>
                          <span className="px-2 py-0.5 rounded text-sm font-bold bg-slate-950/70 text-white border border-white/10">
                            {block.sessionType}
                          </span>
                        </div>

                        <div>
                          <div className="text-base font-mono text-white">
                            {subj?.code}
                          </div>
                          <div className="text-base font-bold text-white leading-snug">
                            {subj?.name || 'Materia eliminada'}
                          </div>
                        </div>

                        <div className="space-y-1 pt-1 border-t border-white/10 text-base text-white">
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
                            <div className="text-base text-white italic pt-0.5">
                              “{block.notes}”
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => deleteScheduleBlock(block.id)}
                          aria-label="Eliminar bloque de horario"
                          className="absolute top-2.5 right-2.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 p-1.5 rounded-lg bg-slate-950/90 text-white hover:text-rose-400 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
