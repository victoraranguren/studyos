import type { Metadata } from 'next';
import './globals.css';
import { AcademicProvider } from '@/context/AcademicContext';

export const metadata: Metadata = {
  title: 'UNEFA StudyOS · Gestor Académico Ing. de Sistemas',
  description:
    'Sistema integral para gestionar materias, horarios, 4 cortes de 25% c/u, planner de plazos con estimación de tiempo sin rigidez, calculador de notas con progresión, links/archivos y feedback docente.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className="antialiased selection:bg-blue-500 selection:text-white">
        <AcademicProvider>{children}</AcademicProvider>
      </body>
    </html>
  );
}
