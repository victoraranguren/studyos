import {
  AttachmentType,
  EnergyLevel,
  FeedbackSentiment,
  SubjectColor,
  TaskStatus,
  TaskType,
} from '@/types/academic';

export const SUBJECT_COLOR_STYLES: Record<
  SubjectColor,
  {
    bg: string;
    border: string;
    text: string;
    badge: string;
    solid: string;
    ring: string;
    label: string;
  }
> = {
  blue: {
    bg: 'bg-blue-500/15',
    border: 'border-blue-500/40',
    text: 'text-white',
    badge: 'bg-blue-600/30 text-white border-blue-400/50',
    solid: 'bg-blue-500',
    ring: 'ring-blue-500/50',
    label: 'Azul Institucional',
  },
  emerald: {
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/40',
    text: 'text-white',
    badge: 'bg-emerald-600/30 text-white border-emerald-400/50',
    solid: 'bg-emerald-500',
    ring: 'ring-emerald-500/50',
    label: 'Esmeralda (BD/Datos)',
  },
  violet: {
    bg: 'bg-violet-500/15',
    border: 'border-violet-500/40',
    text: 'text-white',
    badge: 'bg-violet-600/30 text-white border-violet-400/50',
    solid: 'bg-violet-500',
    ring: 'ring-violet-500/50',
    label: 'Violeta (Matemática/IO)',
  },
  amber: {
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/40',
    text: 'text-white',
    badge: 'bg-amber-600/30 text-white border-amber-400/50',
    solid: 'bg-amber-500',
    ring: 'ring-amber-500/50',
    label: 'Ámbar (Sistemas/SO)',
  },
  rose: {
    bg: 'bg-rose-500/15',
    border: 'border-rose-500/40',
    text: 'text-white',
    badge: 'bg-rose-600/30 text-white border-rose-400/50',
    solid: 'bg-rose-500',
    ring: 'ring-rose-500/50',
    label: 'Carmesí (Defensa/DIN)',
  },
  cyan: {
    bg: 'bg-cyan-500/15',
    border: 'border-cyan-500/40',
    text: 'text-white',
    badge: 'bg-cyan-600/30 text-white border-cyan-400/50',
    solid: 'bg-cyan-500',
    ring: 'ring-cyan-500/50',
    label: 'Cian (Hardware/Arq)',
  },
  indigo: {
    bg: 'bg-indigo-500/15',
    border: 'border-indigo-500/40',
    text: 'text-white',
    badge: 'bg-indigo-600/30 text-white border-indigo-400/50',
    solid: 'bg-indigo-500',
    ring: 'ring-indigo-500/50',
    label: 'Índigo (Redes)',
  },
  orange: {
    bg: 'bg-orange-500/15',
    border: 'border-orange-500/40',
    text: 'text-white',
    badge: 'bg-orange-600/30 text-white border-orange-400/50',
    solid: 'bg-orange-500',
    ring: 'ring-orange-500/50',
    label: 'Naranja (Gerencia)',
  },
};

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  tarea: 'Tarea / Guía',
  proyecto: 'Proyecto / Código',
  parcial: 'Parcial / Examen',
  laboratorio: 'Laboratorio Práctico',
  exposicion: 'Exposición / Defensa',
  informe: 'Informe / Ensayo IEEE',
  taller: 'Taller Evaluado',
};

export const TASK_STATUS_META: Record<
  TaskStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  pendiente: {
    label: 'Pendiente',
    badgeClass: 'bg-slate-800 text-white border-slate-600',
    dotClass: 'bg-white',
  },
  en_progreso: {
    label: 'En Progreso',
    badgeClass: 'bg-sky-600/30 text-white border-sky-400/50',
    dotClass: 'bg-sky-400',
  },
  entregado: {
    label: 'Entregado',
    badgeClass: 'bg-indigo-600/30 text-white border-indigo-400/50',
    dotClass: 'bg-indigo-400',
  },
  calificado: {
    label: 'Calificado',
    badgeClass: 'bg-emerald-600/30 text-white border-emerald-400/50',
    dotClass: 'bg-emerald-400',
  },
};

export const ENERGY_LEVEL_META: Record<
  EnergyLevel,
  { label: string; hint: string; badgeClass: string }
> = {
  ligera: {
    label: 'Energía Ligera',
    hint: 'Ideal para tardes cansadas (lectura, formato, láminas)',
    badgeClass: 'bg-teal-600/30 text-white border-teal-400/50',
  },
  media: {
    label: 'Energía Media',
    hint: 'Requiere atención moderada (investigación, ejercicios, diagramas)',
    badgeClass: 'bg-amber-600/30 text-white border-amber-400/50',
  },
  alta: {
    label: 'Enfoque Profundo',
    hint: 'Mejor con mente fresca (programación, parcial, tablas Simplex, SQL)',
    badgeClass: 'bg-rose-600/30 text-white border-rose-400/50',
  },
};

export const ATTACHMENT_TYPE_META: Record<
  AttachmentType,
  { label: string; colorClass: string }
> = {
  github: {
    label: 'GitHub / Repo',
    colorClass: 'bg-slate-800 text-white border-slate-600',
  },
  drive: {
    label: 'Google Drive / Docs',
    colorClass: 'bg-blue-600/30 text-white border-blue-400/50',
  },
  pdf: {
    label: 'Documento PDF / Láminas',
    colorClass: 'bg-rose-600/30 text-white border-rose-400/50',
  },
  figma: {
    label: 'Figma / Diagrama UML',
    colorClass: 'bg-purple-600/30 text-white border-purple-400/50',
  },
  file: {
    label: 'Archivo Local Adjunto',
    colorClass: 'bg-emerald-600/30 text-white border-emerald-400/50',
  },
  link: {
    label: 'Enlace / Referencia Web',
    colorClass: 'bg-cyan-600/30 text-white border-cyan-400/50',
  },
};

export const FEEDBACK_SENTIMENT_META: Record<
  FeedbackSentiment,
  { label: string; badgeClass: string }
> = {
  excelente: {
    label: 'Destacado / Excelente',
    badgeClass: 'bg-emerald-600/30 text-white border-emerald-400/50',
  },
  bueno: {
    label: 'Buen Trabajo',
    badgeClass: 'bg-sky-600/30 text-white border-sky-400/50',
  },
  con_observaciones: {
    label: 'Con Observaciones',
    badgeClass: 'bg-amber-600/30 text-white border-amber-400/50',
  },
  corregir: {
    label: 'Importante Corregir',
    badgeClass: 'bg-rose-600/30 text-white border-rose-400/50',
  },
};
