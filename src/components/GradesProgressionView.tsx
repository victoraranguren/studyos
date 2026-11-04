'use client';

import React, { useState } from 'react';
import { useAcademic } from '@/context/AcademicContext';
import {
  AcademicTask,
  CorteNumber,
  Subject,
} from '@/types/academic';
import {
  calculateSubjectGradeSummary,
} from '@/lib/calculations';
import { SUBJECT_COLOR_STYLES, TASK_TYPE_LABELS } from '@/lib/theme';
import {
  Award,
  ChevronDown,
  ChevronUp,
  Edit3,
  MessageSquareQuote,
  Plus,
  Sliders,
  Target,
  TrendingUp,
} from 'lucide-react';

interface GradesProgressionViewProps {
  onOpenNewTask: (subjectId: string, corte: CorteNumber) => void;
  onEditTask: (task: AcademicTask) => void;
  onEditSubject: (subject: Subject) => void;
}

export function GradesProgressionView({
  onOpenNewTask,
  onEditTask,
  onEditSubject,
}: GradesProgressionViewProps) {
  const { state, updateCorteConfig } = useAcademic();

  const [selectedSimulatorSubjectId, setSelectedSimulatorSubjectId] =
    useState<string>(state.subjects[0]?.id || '');

  // Estado para el simulador interactivo "Qué pasa si..." por corte (escala 0 a 20)
  const [simSliders, setSimSliders] = useState<Record<string, [number, number, number, number]>>({});
  const [expandedCorteFeedback, setExpandedCorteFeedback] = useState<string | null>(null);

  const summaries = state.subjects.map((subj) => ({
    subject: subj,
    summary: calculateSubjectGradeSummary(subj, state.tasks),
  }));

  // Cálculo de Índice Académico Ponderado por Unidades de Crédito (UC)
  const totalCredits = summaries.reduce((acc, s) => acc + s.subject.credits, 0);
  const weightedSumProjected = summaries.reduce((acc, s) => {
    const grade = s.summary.currentProjectedGrade20 ?? s.subject.targetGrade;
    return acc + grade * s.subject.credits;
  }, 0);
  const weightedIndex20 =
    totalCredits > 0 ? (weightedSumProjected / totalCredits).toFixed(2) : '0.00';

  const activeSimSubj =
    summaries.find((s) => s.subject.id === selectedSimulatorSubjectId) ||
    summaries[0];

  const getSimValues = (subjId: string): [number, number, number, number] => {
    if (simSliders[subjId]) return simSliders[subjId];
    const found = summaries.find((s) => s.subject.id === subjId);
    if (!found) return [15, 15, 15, 15];
    return [
      found.summary.cortes[0].averageGrade20 ?? found.subject.targetGrade,
      found.summary.cortes[1].averageGrade20 ?? found.subject.targetGrade,
      found.summary.cortes[2].averageGrade20 ?? found.subject.targetGrade,
      found.summary.cortes[3].averageGrade20 ?? found.subject.targetGrade,
    ];
  };

  const handleSliderChange = (
    subjId: string,
    corteIndex: 0 | 1 | 2 | 3,
    val: number
  ) => {
    const current = getSimValues(subjId);
    const next: [number, number, number, number] = [...current] as [
      number,
      number,
      number,
      number,
    ];
    next[corteIndex] = val;
    setSimSliders((prev) => ({ ...prev, [subjId]: next }));
  };

  return (
    <div className="space-y-8">
      {/* Resumen Global del Semestre y Escala UNEFA */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold uppercase tracking-wider text-muted">
              Índice Ponderado Proyectado
            </span>
            <Award className="w-5 h-5 text-blue-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {weightedIndex20}
            </span>
            <span className="text-base font-semibold text-white">/ 20 pts</span>
          </div>
          <p className="text-sm text-muted mt-2">
            Ponderado según {totalCredits} Unidades de Crédito (UC) inscritas
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold uppercase tracking-wider text-muted">
              Regla de los 4 Cortes UNEFA
            </span>
            <Target className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            {[1, 2, 3, 4].map((c) => (
              <div
                key={c}
                className="p-2 rounded-xl bg-slate-950 border border-slate-800"
              >
                <div className="text-base font-bold text-blue-400">
                  Corte {c}
                </div>
                <div className="text-base font-extrabold text-white">25%</div>
                <div className="text-base text-white">5.0 pts</div>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted mt-2">
            Mínimo aprobatorio: <strong className="text-emerald-400">10.0 / 20 pts</strong> (50%)
          </p>
        </div>

        <div className="md:col-span-2 p-5 rounded-2xl bg-gradient-to-br from-blue-600/15 via-indigo-600/10 to-slate-900 border border-blue-500/30 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider text-blue-300">
                <TrendingUp className="w-4 h-4" />
                Diagnóstico de Progresión Académica
              </span>
              <h3 className="text-base font-bold text-white mt-1">
                ¿Cómo vas respecto a tus metas del semestre?
              </h3>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <div className="text-base text-white">En Meta / Sobresaliente</div>
              <div className="text-lg font-bold text-emerald-400 mt-0.5">
                {
                  summaries.filter(
                    (s) =>
                      s.summary.status === 'aprobada_meta' ||
                      s.summary.status === 'aprobada' ||
                      s.summary.status === 'excelente'
                  ).length
                }{' '}
                materias
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <div className="text-base text-white">En Camino Seguro</div>
              <div className="text-lg font-bold text-blue-400 mt-0.5">
                {
                  summaries.filter((s) => s.summary.status === 'en_camino')
                    .length
                }{' '}
                materias
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <div className="text-base text-white">Priorizar en Corte Actual</div>
              <div className="text-lg font-bold text-amber-400 mt-0.5">
                {
                  summaries.filter(
                    (s) =>
                      s.summary.status === 'atencion' ||
                      s.summary.status === 'riesgo'
                  ).length
                }{' '}
                materias
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SIMULADOR INTERACTIVO DE PROGRESIÓN ("QUÉ PASA SI...") */}
      {activeSimSubj && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Simulador Interactivo de Progresión (4 Cortes de 25% c/u)
                </h3>
                <p className="text-sm text-muted">
                  Mueve las barras de cada corte para proyectar tu nota definitiva sobre 20 puntos sin alterar tus notas reales.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-base font-semibold text-white">
                Materia a simular:
              </label>
              <select
                value={activeSimSubj.subject.id}
                onChange={(e) => setSelectedSimulatorSubjectId(e.target.value)}
                className="rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2 text-sm font-semibold text-white"
              >
                {state.subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} · {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(() => {
            const subj = activeSimSubj.subject;
            const realSum = activeSimSubj.summary;
            const simGrades = getSimValues(subj.id);
            const simPointsPerCorte = simGrades.map((g) =>
              Number(((g / 20) * 5).toFixed(2))
            );
            const cumulativeProgression = [
              simPointsPerCorte[0],
              Number((simPointsPerCorte[0] + simPointsPerCorte[1]).toFixed(2)),
              Number(
                (
                  simPointsPerCorte[0] +
                  simPointsPerCorte[1] +
                  simPointsPerCorte[2]
                ).toFixed(2)
              ),
              Number(
                (
                  simPointsPerCorte[0] +
                  simPointsPerCorte[1] +
                  simPointsPerCorte[2] +
                  simPointsPerCorte[3]
                ).toFixed(2)
              ),
            ];
            const finalSimulated20 = cumulativeProgression[3];
            const passes10 = finalSimulated20 >= 9.5;
            const hitsTarget = finalSimulated20 >= subj.targetGrade;

            return (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Sliders de los 4 cortes */}
                <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {([0, 1, 2, 3] as const).map((idx) => {
                    const corteNum = (idx + 1) as CorteNumber;
                    const realCorte = realSum.cortes[idx];
                    const simG = simGrades[idx];
                    const simPts = simPointsPerCorte[idx];

                    return (
                      <div
                        key={corteNum}
                        className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-base font-bold text-white">
                            Corte {corteNum} (25%)
                          </span>
                          <span className="text-base px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-white">
                            Real:{' '}
                            {realCorte.averageGrade20 !== null
                              ? `${realCorte.averageGrade20}/20 (${realCorte.earnedPoints20} pts)`
                              : 'Por evaluar'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min={0}
                            max={20}
                            step={0.5}
                            value={simG}
                            onChange={(e) =>
                              handleSliderChange(
                                subj.id,
                                idx,
                                Number(e.target.value)
                              )
                            }
                            className="flex-1 accent-indigo-500"
                          />
                          <div className="text-right min-w-[76px]">
                            <div className="text-base font-extrabold text-indigo-300">
                              {simG.toFixed(1)} / 20
                            </div>
                            <div className="text-base text-emerald-400 font-semibold">
                              +{simPts.toFixed(2)} / 5 pts
                            </div>
                          </div>
                        </div>

                        <div className="text-base text-white flex justify-between">
                          <span>Acumulado al C{corteNum}:</span>
                          <strong className="text-white">
                            {cumulativeProgression[idx]} / {corteNum * 5}.00 pts
                          </strong>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Gráfico de barras de progresión acumulativa y resultado */}
                <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold uppercase tracking-wider text-muted">
                        Definitiva Simulada (C1+C2+C3+C4)
                      </div>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span
                          className={`text-3xl font-extrabold ${
                            hitsTarget
                              ? 'text-emerald-400'
                              : passes10
                              ? 'text-blue-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {finalSimulated20.toFixed(2)}
                        </span>
                        <span className="text-base text-white">
                          / 20.00 pts (Meta: {subj.targetGrade} pts)
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setSimSliders((prev) => {
                          const copy = { ...prev };
                          delete copy[subj.id];
                          return copy;
                        })
                      }
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-base text-white border border-slate-800"
                    >
                      Restaurar reales
                    </button>
                  </div>

                  {/* Barra de escalera de progresión corte a corte */}
                  <div className="space-y-2 pt-1">
                    <div className="text-base font-semibold text-white flex justify-between">
                      <span>Curva de Progresión Acumulada (0 → 20 pts)</span>
                      <span className="text-emerald-400">Mín. Aprobatorio: 10 pts</span>
                    </div>
                    <div className="grid grid-cols-4 gap-3 items-end h-28 pt-4 px-2 bg-slate-900/60 rounded-xl border border-slate-800/80 relative">
                      {/* Línea punteada de 10 puntos (50% de altura) */}
                      <div
                        className="absolute left-0 right-0 border-t border-dashed border-emerald-500/40 pointer-events-none"
                        style={{ bottom: '50%' }}
                        title="10.0 pts - Nota mínima aprobatoria UNEFA"
                      />
                      {cumulativeProgression.map((cumPts, i) => {
                        const heightPct = Math.min(100, Math.max(8, (cumPts / 20) * 100));
                        return (
                          <div
                            key={i}
                            className="flex flex-col items-center justify-end h-full gap-1 z-10"
                          >
                            <span className="text-base font-bold text-white">
                              {cumPts.toFixed(1)}
                            </span>
                            <div
                              className={`w-full rounded-t-lg transition-all ${
                                cumPts >= subj.targetGrade
                                  ? 'bg-emerald-500'
                                  : cumPts >= 10
                                  ? 'bg-blue-500'
                                  : 'bg-indigo-500/80'
                              }`}
                              style={{ height: `${heightPct}%` }}
                            />
                            <span className="text-base font-semibold text-white pb-1">
                              Tras C{i + 1}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <p className="text-sm text-muted bg-slate-900 p-3 rounded-xl border border-slate-800">
                    {realSum.statusAdvice}
                  </p>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* DETALLE POR MATERIA Y SUS 4 CORTES DE 25% C/U */}
      <div className="space-y-6">
        {summaries.map(({ subject, summary }) => {
          const colorStyle = SUBJECT_COLOR_STYLES[subject.color];
          const subjectTasks = state.tasks.filter(
            (t) => t.subjectId === subject.id
          );

          return (
            <div
              key={subject.id}
              className="rounded-2xl bg-slate-900/95 border border-slate-800 overflow-hidden shadow-lg"
            >
              {/* Cabecera de la Materia */}
              <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-950/40">
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-3 h-12 rounded-full ${colorStyle.solid} shrink-0 mt-0.5`}
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-sm font-mono font-bold border ${colorStyle.badge}`}
                      >
                        {subject.code}
                      </span>
                      <h3 className="text-lg font-bold text-white">
                        {subject.name}
                      </h3>
                      <span className="text-base text-white font-medium">
                        ({subject.credits} UC · {subject.professor})
                      </span>
                    </div>
                    <p className="text-sm text-muted mt-1">
                      {summary.statusAdvice}
                    </p>
                  </div>
                </div>

                {/* Indicadores numéricos de la materia (Mobile-First: apilados a ancho completo en móvil) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                  <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-right">
                    <div className="text-base uppercase tracking-wider text-muted">
                      Acumulado Asegurado
                    </div>
                    <div className="text-base font-extrabold text-emerald-400">
                      {summary.totalEarnedPoints20.toFixed(2)}{' '}
                      <span className="text-base font-normal text-white">
                        / 20 pts ({summary.totalEvaluatedPercent}% eval.)
                      </span>
                    </div>
                  </div>

                  <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-right">
                    <div className="text-base uppercase tracking-wider text-muted">
                      Falta para Aprobar (10 pts)
                    </div>
                    <div className="text-base font-extrabold text-blue-400">
                      {summary.pointsNeededToPass10 <= 0 ? (
                        <span className="text-emerald-400">¡Aprobada!</span>
                      ) : (
                        <>
                          +{summary.pointsNeededToPass10} pts{' '}
                          <span className="text-base font-normal text-white">
                            (prom. {summary.neededGrade20ToPass10 ?? 0}/20)
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-right">
                    <div className="text-base uppercase tracking-wider text-muted flex items-center gap-1">
                      Meta ({subject.targetGrade}/20)
                    </div>
                    <div className="text-base font-extrabold text-indigo-300">
                      {summary.pointsNeededForTarget <= 0 ? (
                        <span className="text-emerald-400">¡Lograda!</span>
                      ) : (
                        <>
                          +{summary.pointsNeededForTarget} pts{' '}
                          <span className="text-base font-normal text-white">
                            (prom. {summary.neededGrade20ForTarget ?? 0}/20)
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onEditSubject(subject)}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white"
                    title="Editar Materia y Meta"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Barra Visual de Progreso de los 20 Puntos (4 Segmentos de 5.00 pts = 25% c/u) */}
              <div className="px-5 py-3 bg-slate-950/70 border-b border-slate-800/80">
                <div className="flex items-center justify-between text-base mb-1.5">
                  <span className="text-white font-medium">
                    Barra de Progresión de los 4 Cortes (Cada bloque = 25% = 5.00 pts)
                  </span>
                  <span className="text-white font-semibold">
                    Proyección al ritmo actual:{' '}
                    <strong className="text-white">
                      {summary.currentProjectedGrade20 !== null
                        ? `${summary.currentProjectedGrade20} / 20`
                        : 'Sin notas aún'}
                    </strong>
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {summary.cortes.map((c) => {
                    const fillPct = Math.min(
                      100,
                      Math.round((c.earnedPoints20 / 5) * 100)
                    );
                    const evalPct = Math.min(
                      100,
                      Math.round((c.evaluatedPercent / 25) * 100)
                    );
                    return (
                      <div key={c.corte} className="space-y-1">
                        <div className="h-3 rounded-full bg-slate-800 overflow-hidden relative">
                          {/* Porcentaje ya evaluado en gris claro */}
                          <div
                            className="h-full bg-slate-700/70 absolute left-0 top-0"
                            style={{ width: `${evalPct}%` }}
                          />
                          {/* Puntos ganados reales */}
                          <div
                            className={`h-full ${colorStyle.solid} relative transition-all`}
                            style={{ width: `${fillPct}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-base text-white">
                          <span>Corte {c.corte} (25%)</span>
                          <span className="font-semibold text-white">
                            {c.earnedPoints20.toFixed(2)} / 5.00 pts
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tarjetas de los 4 Cortes (25% c/u) */}
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {summary.cortes.map((corteInfo) => {
                  const corteCfg = subject.cortesConfig.find(
                    (cfg) => cfg.corte === corteInfo.corte
                  );
                  const corteTasks = subjectTasks.filter(
                    (t) => t.corte === corteInfo.corte
                  );
                  const feedbackKey = `${subject.id}-c${corteInfo.corte}`;
                  const isFeedbackOpen = expandedCorteFeedback === feedbackKey;

                  return (
                    <div
                      key={corteInfo.corte}
                      className="rounded-xl bg-slate-950 border border-slate-800/90 flex flex-col justify-between p-4 space-y-3"
                    >
                      <div className="space-y-2.5">
                        {/* Tope del Corte */}
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                          <div>
                            <span className="text-base font-extrabold uppercase tracking-wider text-muted">
                              Corte {corteInfo.corte} · 25%
                            </span>
                            <div className="text-base text-white">
                              Máximo: 5.00 pts sobre 20
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-base font-extrabold text-emerald-400">
                              {corteInfo.earnedPoints20.toFixed(2)} / 5.00 pts
                            </div>
                            <div className="text-base text-white">
                              {corteInfo.averageGrade20 !== null
                                ? `Nota: ${corteInfo.averageGrade20}/20`
                                : 'Pendiente'}
                            </div>
                          </div>
                        </div>

                        {/* Opción de Nota Directa Manual del Corte vs Por Tareas */}
                        <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80 space-y-2">
                          <div className="flex items-center justify-between text-base">
                            <label className="flex items-center gap-1.5 text-white cursor-pointer font-medium">
                              <input
                                type="checkbox"
                                checked={Boolean(corteCfg?.useManualGrade)}
                                onChange={(e) =>
                                  updateCorteConfig(
                                    subject.id,
                                    corteInfo.corte,
                                    {
                                      useManualGrade: e.target.checked,
                                      manualGrade20:
                                        corteCfg?.manualGrade20 ??
                                        corteInfo.averageGrade20 ??
                                        15,
                                    }
                                  )
                                }
                                className="rounded border-slate-700 text-blue-500"
                              />
                              Nota directa del corte
                            </label>
                            <span className="text-white">
                              {corteInfo.evaluatedPercent}% / 25% eval.
                            </span>
                          </div>

                          {corteCfg?.useManualGrade && (
                            <div className="flex items-center justify-between gap-2 pt-1">
                              <span className="text-base text-blue-300">
                                Nota C{corteInfo.corte} (0-20):
                              </span>
                              <input
                                type="number"
                                min={0}
                                max={20}
                                step={0.1}
                                value={corteCfg.manualGrade20 ?? ''}
                                onChange={(e) =>
                                  updateCorteConfig(
                                    subject.id,
                                    corteInfo.corte,
                                    {
                                      manualGrade20:
                                        e.target.value === ''
                                          ? null
                                          : Math.min(
                                              20,
                                              Math.max(0, Number(e.target.value))
                                            ),
                                    }
                                  )
                                }
                                className="w-20 rounded-lg bg-slate-950 border border-blue-500/40 px-2 py-1 text-base font-bold text-center text-white"
                              />
                            </div>
                          )}
                        </div>

                        {/* Lista de Evaluaciones / Tareas de este Corte */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-base text-white">
                            <span>Actividades ({corteTasks.length})</span>
                            <span>Peso / Nota</span>
                          </div>

                          {corteTasks.length === 0 ? (
                            <div className="py-3 text-center text-base text-white border border-dashed border-slate-800 rounded-lg">
                              Sin actividades registradas en C{corteInfo.corte}
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              {corteTasks.map((task) => {
                                const ptsEarned =
                                  task.grade20 !== null
                                    ? ((task.grade20 * task.weightInCorte) / 100).toFixed(2)
                                    : null;
                                return (
                                  <button
                                    key={task.id}
                                    type="button"
                                    onClick={() => onEditTask(task)}
                                    className="w-full text-left p-2 rounded-lg bg-slate-900 hover:bg-slate-800/90 border border-slate-800/80 transition-colors flex items-center justify-between gap-2"
                                  >
                                    <div className="min-w-0">
                                      <div className="text-base font-medium text-white truncate">
                                        {task.title}
                                      </div>
                                      <div className="text-base text-white">
                                        {TASK_TYPE_LABELS[task.taskType]} ·{' '}
                                        {task.weightInCorte}% (
                                        {((task.weightInCorte / 100) * 20).toFixed(1)}{' '}
                                        pts)
                                      </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                      {task.grade20 !== null ? (
                                        <>
                                          <div className="text-base font-bold text-emerald-400">
                                            {task.grade20}/20
                                          </div>
                                          <div className="text-base text-white">
                                            +{ptsEarned} pts
                                          </div>
                                        </>
                                      ) : (
                                        <span className="px-2 py-0.5 rounded bg-slate-800 text-base text-white">
                                          Calificar
                                        </span>
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Acciones de Corte: Agregar Actividad y Feedback del Profesor en el Corte */}
                      <div className="pt-2 border-t border-slate-800/80 space-y-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              onOpenNewTask(subject.id, corteInfo.corte)
                            }
                            className="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-sm font-semibold text-blue-400 border border-slate-800 flex items-center justify-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Evaluación C{corteInfo.corte}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedCorteFeedback(
                                isFeedbackOpen ? null : feedbackKey
                              )
                            }
                            className={`p-1.5 rounded-lg border text-base flex items-center gap-1 ${
                              corteInfo.teacherFeedback
                                ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                                : 'bg-slate-900 border-slate-800 text-white hover:text-white'
                            }`}
                            title="Feedback y Nota del Profesor del Corte"
                          >
                            <MessageSquareQuote className="w-3.5 h-3.5" />
                            {isFeedbackOpen ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        {corteInfo.teacherFeedback && !isFeedbackOpen && (
                          <p className="text-base text-amber-200/90 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 line-clamp-2">
                            <strong>Prof:</strong> {corteInfo.teacherFeedback}
                          </p>
                        )}

                        {isFeedbackOpen && (
                          <div className="space-y-2 pt-1">
                            <label className="block text-base font-semibold uppercase text-muted">
                              Feedback del Profesor en el Corte {corteInfo.corte}:
                            </label>
                            <textarea
                              rows={2}
                              placeholder="Observaciones del profesor al cerrar este corte..."
                              value={corteCfg?.teacherCorteFeedback || ''}
                              onChange={(e) =>
                                updateCorteConfig(subject.id, corteInfo.corte, {
                                  teacherCorteFeedback: e.target.value,
                                })
                              }
                              className="w-full rounded-lg bg-slate-900 border border-slate-700 p-2 text-base text-white"
                            />
                          </div>
                        )}
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
  );
}
