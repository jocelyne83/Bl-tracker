'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckSquare } from 'lucide-react';

interface SeriesItem {
  id: string;
  title: string;
  country: string;
  type?: string;
  poster_url?: string;
  notes?: string;
  status: string;
  current_episode?: number;
  total_episodes?: number;
  release_date?: string;
  created_at?: string;
}

interface ProjectedEpisode {
  seriesId: string;
  title: string;
  episodeNumber: number;
  totalEpisodes: number;
  date: Date;
  dayName: string;
}

const DAYS_CONFIG: { [key: string]: { name: string; bg: string; text: string; badgeBg: string } } = {
  Lunes: { name: 'Lunes', bg: 'bg-[#84b034]', text: 'text-white', badgeBg: 'bg-[#84b034]' },
  Martes: { name: 'Martes', bg: 'bg-[#4372b7]', text: 'text-white', badgeBg: 'bg-[#4372b7]' },
  Miércoles: { name: 'Miércoles', bg: 'bg-[#c23d57]', text: 'text-white', badgeBg: 'bg-[#c23d57]' },
  Jueves: { name: 'Jueves', bg: 'bg-[#e5b324]', text: 'text-white', badgeBg: 'bg-[#e5b324]' },
  Viernes: { name: 'Viernes', bg: 'bg-[#81559b]', text: 'text-white', badgeBg: 'bg-[#81559b]' },
  Sábado: { name: 'Sábado', bg: 'bg-[#e67e22]', text: 'text-white', badgeBg: 'bg-[#e67e22]' },
  Domingo: { name: 'Domingo', bg: 'bg-[#16a085]', text: 'text-white', badgeBg: 'bg-[#16a085]' },
};

const DAY_NAMES_ORDER = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const JS_DAY_TO_NAME: { [key: number]: string } = {
  1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 0: 'Domingo',
};

export default function CalendarPage() {
  const [seriesList, setSeriesList] = useState<SeriesItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  const [visibleDays, setVisibleDays] = useState<{ [key: string]: boolean }>({
    Lunes: true, Martes: true, Miércoles: true, Jueves: true, Viernes: true, Sábado: true, Domingo: true,
  });

  useEffect(() => {
    setCurrentDate(new Date());

    async function fetchCalendarData() {
      setLoading(true);
      const { data, error } = await supabase.from('series').select('*');

      if (!error && data) {
        setSeriesList(data as SeriesItem[]);
      }
      setLoading(false);
    }

    fetchCalendarData();
  }, []);

  const toggleDayVisibility = (day: string) => {
    setVisibleDays((prev) => ({ ...prev, [day]: !prev[day] }));
  };

  const prevMonth = () => {
    if (!currentDate) return;
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    if (!currentDate) return;
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  if (loading || !currentDate) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-500 text-sm font-medium">Cargando calendario mensual...</p>
      </div>
    );
  }

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  let startingDayIndex = firstDayOfMonth.getDay() - 1;
  if (startingDayIndex === -1) startingDayIndex = 6;

  const totalDaysInMonth = lastDayOfMonth.getDate();
  const monthName = currentDate.toLocaleString('es-ES', { month: 'long' });

  // Algoritmo de proyección basado en Fecha de Estreno
  const getAllProjectedEpisodes = (): ProjectedEpisode[] => {
    const projected: ProjectedEpisode[] = [];

    seriesList.forEach((series) => {
      // Omitir si es película O si ya está Terminada/Completada
      if (series.type === 'Película' || series.status === 'Terminada' || series.status === 'Terminado' || series.status === 'Completado') {
        return;
      }

      const matchDay = series.notes?.match(/📅 Día de emisión: ([^\n]+)/);
      const assignedDay = matchDay ? matchDay[1].trim() : 'Por definir';

      if (assignedDay === 'Por definir') return;

      const targetDayJsIndex = Object.keys(JS_DAY_TO_NAME).find(
        (key) => JS_DAY_TO_NAME[Number(key)] === assignedDay
      );

      if (targetDayJsIndex === undefined) return;
      const targetDayNum = Number(targetDayJsIndex);

      // Si existe fecha de estreno, la usaremos como punto de partida exacto para el Cap 1
      let startDate: Date;
      if (series.release_date) {
        // Parsear YYYY-MM-DD sin desfasamiento de zona horaria
        const [y, m, d] = series.release_date.split('-').map(Number);
        startDate = new Date(y, m - 1, d);
      } else if (series.created_at) {
        startDate = new Date(series.created_at);
      } else {
        startDate = new Date(year, 0, 1);
      }

      // Ajustar al día correcto de transmisión si la fecha no coincide
      let currentEpDate = new Date(startDate);
      while (currentEpDate.getDay() !== targetDayNum) {
        currentEpDate.setDate(currentEpDate.getDate() + 1);
      }

      const totalEps = series.total_episodes || 12;

      // Generar los episodios
      for (let ep = 1; ep <= totalEps; ep++) {
        projected.push({
          seriesId: series.id,
          title: series.title,
          episodeNumber: ep,
          totalEpisodes: totalEps,
          date: new Date(currentEpDate),
          dayName: assignedDay,
        });

        currentEpDate.setDate(currentEpDate.getDate() + 7);
      }
    });

    return projected;
  };

  const allProjectedEpisodes = getAllProjectedEpisodes();

  const getEpisodesForCell = (cellDate: Date) => {
    return allProjectedEpisodes.filter((ep) => {
      const isSameDay =
        ep.date.getDate() === cellDate.getDate() &&
        ep.date.getMonth() === cellDate.getMonth() &&
        ep.date.getFullYear() === cellDate.getFullYear();

      const isVisible = visibleDays[ep.dayName];
      return isSameDay && isVisible;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-[#1e1e38] flex items-center gap-2">
          Calendario <span className="text-[#5b63be]">de Capítulos</span> <CalendarIcon className="w-6 h-6 sm:w-7 sm:h-7 text-[#5b63be]" />
        </h1>
        <p className="text-[#64748b] text-xs sm:text-sm mt-1 font-medium">Proyección basada en fecha de estreno oficial.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="w-full lg:w-64 bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/60 shadow-sm shrink-0 space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="font-extrabold text-[#1e1e38] text-sm flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-[#5b63be]" /> Sub-calendar
            </h3>
            <p className="text-[11px] text-slate-400">Filtrar días de transmisión</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-1 gap-2">
            {DAY_NAMES_ORDER.map((day) => {
              const config = DAYS_CONFIG[day];
              const isChecked = visibleDays[day];

              return (
                <button
                  key={day}
                  onClick={() => toggleDayVisibility(day)}
                  className={`w-full flex items-center justify-between p-2 sm:p-2.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                    config.bg
                  } ${config.text} ${!isChecked ? 'opacity-30 grayscale-[50%]' : 'hover:brightness-105'}`}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <input type="checkbox" checked={isChecked} readOnly className="rounded border-white/40 text-[#5b63be] focus:ring-0 cursor-pointer pointer-events-none" />
                    <span className="truncate">{day}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 w-full bg-white rounded-3xl p-3 sm:p-6 border border-slate-200/60 shadow-sm space-y-4 overflow-hidden">
          <div className="flex flex-row items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-1.5">
              <button onClick={prevMonth} className="p-1.5 sm:p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={nextMonth} className="p-1.5 sm:p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl"><ChevronRight className="w-4 h-4" /></button>
              <button onClick={goToToday} className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-[#f3f4fa] text-[#5b63be] text-xs font-bold rounded-xl">Hoy</button>
            </div>

            <h2 className="text-base sm:text-xl font-black text-[#1e1e38] capitalize">
              {monthName} <span className="text-[#5b63be]">{year}</span>
            </h2>
          </div>

          <div className="overflow-x-auto pb-2">
            <div className="min-w-[650px]">
              <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-500 mb-2">
                {DAY_NAMES_ORDER.map((day) => (<div key={day} className="py-1.5 bg-slate-50 rounded-xl border border-slate-100">{day}</div>))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: startingDayIndex }).map((_, index) => (
                  <div key={`empty-${index}`} className="min-h-[105px] bg-slate-50/50 rounded-xl p-1 border border-slate-100 opacity-40" />
                ))}

                {Array.from({ length: totalDaysInMonth }).map((_, index) => {
                  const dayNumber = index + 1;
                  const currentCellDate = new Date(year, month, dayNumber);
                  
                  let dayIndex = currentCellDate.getDay() - 1;
                  if (dayIndex === -1) dayIndex = 6;
                  const dayName = DAY_NAMES_ORDER[dayIndex];

                  const dayConfig = DAYS_CONFIG[dayName];
                  const episodesForDay = getEpisodesForCell(currentCellDate);
                  const isToday = new Date().toDateString() === currentCellDate.toDateString();

                  return (
                    <div
                      key={dayNumber}
                      className={`min-h-[110px] rounded-2xl p-1.5 border transition-all flex flex-col justify-start ${
                        isToday ? 'bg-amber-50/60 border-amber-300 ring-2 ring-amber-400/30' : 'bg-white border-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-[10px] sm:text-xs font-black px-1.5 py-0.5 rounded-full ${isToday ? 'bg-amber-500 text-white' : 'text-slate-700 bg-slate-100'}`}>
                          {dayNumber}
                        </span>
                      </div>

                      <div className="space-y-1 overflow-y-auto max-h-[85px] scrollbar-none">
                        {episodesForDay.map((ep, idx) => (
                          <div
                            key={`${ep.seriesId}-${ep.episodeNumber}-${idx}`}
                            className={`${dayConfig.badgeBg} text-white text-[9px] sm:text-[10px] font-extrabold px-1.5 py-1 rounded-lg truncate flex items-center justify-between gap-1`}
                            title={`${ep.title} - Cap ${ep.episodeNumber}`}
                          >
                            <span className="truncate">{ep.title}</span>
                            <span className="bg-black/20 px-1 rounded text-[8px] shrink-0">C.{ep.episodeNumber}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}