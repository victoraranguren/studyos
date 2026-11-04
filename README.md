# UNEFA StudyOS — Gestor Académico (Ingeniería de Sistemas)

Sistema web en **Next.js (App Router + TypeScript + Tailwind CSS)** diseñado a medida para gestionar materias, horarios, los **4 cortes de 25% c/u (escala 0–20 pts UNEFA)**, plazos de entrega con **estimación de tiempo sin rigidez**, calculador de notas con simulación de progresión, enlaces/archivos de cada trabajo y bitácora de feedback del profesor.

## Requisitos Implementados

1. **Materias (Asignaturas UNEFA)**:
   - Catálogo integrado del Pensum de **Ingeniería de Sistemas UNEFA** para autocompletar en 1 clic o crear materias personalizadas (código, semestre, UC, sección, modalidad, profesor, contacto y meta de calificación).
2. **Horarios Semanales (Lunes a Sábado)**:
   - Grilla por días y horas con aula/laboratorio, tipo de sesión (`Teoría`, `Práctica`, `Laboratorio`, `Defensa`) y **detector automático de choques de horario**.
3. **Puntuación por 4 Cortes de 25% c/u (Escala 0 a 20 pts)**:
   - Cada corte equivale al **25%** de la definitiva (**5.00 puntos máximos** por corte).
   - Soporta tanto cálculo ponderado por las actividades de cada corte (ej. Taller 10% + Parcial 15% = 25%) como **nota directa manual del corte**.
4. **Planner de Plazos de Entrega**:
   - Vista por **Plazos de Entrega (Timeline)** y vista **Tablero Kanban** (`Pendiente`, `En Progreso`, `Entregado`, `Calificado`), con subtareas/checklists y filtros por materia, corte y nivel de energía.
5. **Previsión de Estimación de Tiempo y Recomendación de Tiempos SIN RIGIDEZ**:
   - Motor de ritmo flexible (`getFlexibleTimeRecommendation`) que sugiere **3 ritmos adaptables** (*Ritmo Suave*, *Bloques de Enfoque* y *Micro-paso de 15 min para romper inercia*) según los días restantes y tu nivel de energía (`Ligera`, `Media`, `Enfoque Profundo`), más presupuesto semanal de horas cómodas.
6. **Calculador de Notas con Progresión**:
   - Calcula puntos asegurados en mano sobre 20, cuántos puntos y qué promedio necesitas en los cortes restantes para aprobar con **10.0 pts** o alcanzar tu **meta personal**, e incluye **Simulador Interactivo con Sliders ("¿Qué pasa si...?")** y curva de progresión acumulada tras cada corte.
7. **Linkear Archivos / Links de cada Trabajo**:
   - Vincula repositorios de **GitHub**, documentos de **Google Drive/Docs**, **PDFs**, **Figma/UML**, enlaces web o **archivos locales adjuntos** en cada tarea y consúltalos desde el repositorio central.
8. **Dejar Nota y Feedback del Profesor**:
   - Registra la nota sobre 20 pts, observaciones recibidas del profesor, tono de la corrección y **puntos de mejora accionables** para el próximo corte.

## Cómo Ejecutar

```bash
npm run dev
```

## Cómo Conectar a Supabase (cuando tengas el `.env`)

1. Copia [`.env.example`](file:///home/victor/Dev/sandbox/self-apps/.env.example) a `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Ejecuta el script SQL ubicado en [`supabase/schema.sql`](file:///home/victor/Dev/sandbox/self-apps/supabase/schema.sql) en el **SQL Editor** de tu proyecto en Supabase.
3. Coloca tu `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en `.env.local` y cambia `NEXT_PUBLIC_STORAGE_MODE="supabase"`.
4. Desde el botón **"En Memoria (Local)"** arriba a la derecha en la interfaz, haz clic en **"Sincronizar Memoria → Supabase"** para subir todos tus datos actuales directamente a la nube.
