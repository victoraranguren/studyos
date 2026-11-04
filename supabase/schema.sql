-- ============================================================================
-- UNEFA StudyOS - Esquema SQL para Supabase (PostgreSQL)
-- Carrera: Ingeniería de Sistemas - UNEFA
-- ============================================================================
-- Instrucciones:
-- 1. Abre el SQL Editor en tu dashboard de Supabase
-- 2. Pega y ejecuta este script completo
-- 3. Configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local
-- ============================================================================

create extension if not exists "uuid-ossp";

-- 1. Tabla de Configuración del Estudiante
create table if not exists public.student_config (
  id text primary key default 'default_student',
  student_name text not null default 'Estudiante Ing. Sistemas',
  career text not null default 'Ingeniería de Sistemas',
  university text not null default 'UNEFA',
  sede text not null default 'Núcleo UNEFA',
  current_semester integer not null default 6,
  section_code text not null default '06S-2614-D1',
  weekly_comfort_hours numeric(5,2) not null default 14,
  default_target_grade numeric(4,2) not null default 15.0,
  updated_at timestamptz not null default now()
);

-- 2. Tabla de Materias (Asignaturas)
create table if not exists public.subjects (
  id text primary key,
  code text not null,
  name text not null,
  semester integer not null default 6,
  credits integer not null default 4,
  professor text not null default '',
  professor_contact text default '',
  section text default '06S-2614-D1',
  modality text not null default 'Presencial',
  color text not null default 'blue',
  target_grade numeric(4,2) not null default 15.0,
  general_notes text default '',
  cortes_config jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- 3. Tabla de Bloques de Horario Semanal
create table if not exists public.schedule_blocks (
  id text primary key,
  subject_id text not null references public.subjects(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 1 and 6), -- 1=Lunes ... 6=Sábado
  start_time text not null, -- formato "07:30"
  end_time text not null,   -- formato "09:45"
  classroom text not null default 'Aula',
  session_type text not null default 'Teoría', -- Teoría | Práctica | Laboratorio | Defensa
  notes text default '',
  created_at timestamptz not null default now()
);

-- 4. Tabla de Tareas, Evaluaciones y Trabajos (con Links, Estimación Flexible y Feedback del Profesor)
create table if not exists public.academic_tasks (
  id text primary key,
  subject_id text not null references public.subjects(id) on delete cascade,
  corte integer not null check (corte between 1 and 4), -- 4 Cortes de 25% c/u
  title text not null,
  description text default '',
  task_type text not null default 'tarea', -- tarea | proyecto | parcial | laboratorio | exposicion | informe | taller
  status text not null default 'pendiente', -- pendiente | en_progreso | entregado | calificado
  due_date timestamptz not null,
  weight_in_corte numeric(5,2) not null default 10.0, -- % sobre el 100% de la materia (cada corte suma 25%)
  estimated_minutes integer not null default 120,
  logged_minutes integer not null default 0,
  energy_level text not null default 'media', -- ligera | media | alta
  flexibility_note text default '',
  grade_20 numeric(4,2), -- Nota sobre 20 puntos (null si aún no está calificada)
  student_notes text default '',
  teacher_feedback text default '',
  improvement_points text default '',
  feedback_sentiment text, -- excelente | bueno | con_observaciones | corregir
  attachments jsonb not null default '[]'::jsonb, -- Array de archivos/links vinculados
  subtasks jsonb not null default '[]'::jsonb,    -- Checklist interno de la tarea
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Políticas RLS abiertas para uso personal con anon_key (ajustables si agregas Auth después)
alter table public.student_config enable row level security;
alter table public.subjects enable row level security;
alter table public.schedule_blocks enable row level security;
alter table public.academic_tasks enable row level security;

create policy "Allow all access to student_config" on public.student_config for all using (true) with check (true);
create policy "Allow all access to subjects" on public.subjects for all using (true) with check (true);
create policy "Allow all access to schedule_blocks" on public.schedule_blocks for all using (true) with check (true);
create policy "Allow all access to academic_tasks" on public.academic_tasks for all using (true) with check (true);
