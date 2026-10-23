'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Tv, Calendar, Heart, ArrowRight, Play, BellRing, Sparkles, Clock, ChevronLeft, ChevronRight, Flame } from 'lucide-react';

interface Series {
  id: string;
  title: string;
  country: string;
  status: string;
  rating: number;
  poster_url: string;
  notes: string;
}

interface UpcomingRelease {
  id: string;
  title: string;
  country: string;
  release_date: string;
  platform: string;
  poster_url?: string;
  reminder_notes: string;
  is_released: boolean;
}

const DAYS_MAP = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({ total: 0, watching: 0, upcoming: 0 });
  const [watchingList, setWatchingList] = useState<Series[]>([]);
  const [todayBroadcasts, setTodayBroadcasts] = useState<Series[]>([]);
  const [currentDayName, setCurrentDayName] = useState('');
  
  const [recentlyPremieredReleases, setRecentlyPremieredReleases] = useState<UpcomingRelease[]>([]);
  const [nextRelease, setNextRelease] = useState<UpcomingRelease | null>(null);
  const [loading, setLoading] = useState(true);

  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }

      // Detectar el día actual de la semana en español
      const todayIndex = new Date().getDay();
      const dayName = DAYS_MAP[todayIndex];
      setCurrentDayName(dayName);

      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const todayISO = `${year}-${month}-${day}`;

      const { data: autoReleases } = await supabase
        .from('upcoming_releases')
        .select('*')
        .eq('is_released', false)
        .lte('release_date', todayISO);

      if (autoReleases && autoReleases.length > 0) {
        for (const item of autoReleases) {
          await supabase
            .from('upcoming_releases')
            .update({ is_released: true })
            .eq('id', item.id);
        }
      }

      const { count: totalSeries } = await supabase.from('series').select('*', { count: 'exact', head: true });
      const { count: watchingCount } = await supabase.from('series').select('*', { count: 'exact', head: true }).eq('status', 'Viendo');
      const { count: upcomingCount } = await supabase.from('upcoming_releases').select('*', { count: 'exact', head: true }).eq('is_released', false);

      setStats({
        total: totalSeries || 0,
        watching: watchingCount || 0,
        upcoming: upcomingCount || 0,
      });

      const { data: watchingData } = await supabase
        .from('series')
        .select('*')
        .eq('status', 'Viendo')
        .order('created_at', { ascending: false });
      
      if (watchingData) {
        setWatchingList(watchingData as Series[]);

        // Filtrar series que se transmiten hoy según su nota de día de emisión
        const broadcastingToday = (watchingData as Series[]).filter((item) => {
          return item.notes && item.notes.includes(`📅 Día de emisión: ${dayName}`);
        });
        setTodayBroadcasts(broadcastingToday);
      }

      const { data: premieredData } = await supabase
        .from('upcoming_releases')
        .select('*')
        .eq('is_released', true)
        .order('release_date', { ascending: false });

      if (premieredData) {
        setRecentlyPremieredReleases(premieredData as UpcomingRelease[]);
      }

      const { data: nextReleaseData } = await supabase
        .from('upcoming_releases')
        .select('*')
        .eq('is_released', false)
        .gt('release_date', todayISO)
        .order('release_date', { ascending: true })
        .limit(1)
        .maybeSingle();

      setNextRelease(nextReleaseData ? (nextReleaseData as UpcomingRelease) : null);

      setLoading(false);
    }

    loadDashboardData();
  }, [router]);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-500 text-sm font-medium">Sincronizando estrenos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Encabezado */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-[#20274c] via-[#5b63be] to-[#8288d9] bg-clip-text text-transparent">
          Dashboard General
        </h1>
        <p className="text-[#64748b] text-xs sm:text-sm mt-1 font-medium">Resumen de tu biblioteca BL y próximos lanzamientos.</p>
      </div>

      {/* 🚀 BANNER DINÁMICO DE ACCESO RÁPIDO: HOY SE TRANSMITE */}
      {todayBroadcasts.length > 0 && (
        <div className="bg-gradient-to-r from-[#d9539f] to-[#a855f7] p-5 rounded-3xl text-white shadow-lg shadow-pink-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl text-white">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full text-white">
                ¡Hoy es {currentDayName}! 🔥
              </span>
              <h2 className="text-lg font-black mt-1">
                ¡Nuevos capítulos de emisión hoy!
              </h2>
              <p className="text-xs text-white/90">
                Tienes {todayBroadcasts.length} serie(s) programada(s) para hoy en tu lista.
              </p>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto max-w-full pb-1">
            {todayBroadcasts.map((series) => (
              <div key={series.id} className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/20 flex items-center gap-2 shrink-0">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-800">
                  {series.poster_url ? (
                    <img src={series.poster_url} alt={series.title} className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <div>
                  <p className="text-xs font-bold truncate max-w-[120px]">{series.title}</p>
                  <span className="text-[9px] text-pink-200">¡Disponible hoy!</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tarjetas de Estadísticas (Acomodo responsivo en grid compacto) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Link 
          href="/series" 
          className="bg-[#5b63be] p-4 sm:p-6 rounded-2xl sm:rounded-3xl flex items-center justify-between text-white shadow-lg shadow-[#5b63be]/20 hover:scale-[1.02] transition-transform"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl sm:rounded-2xl text-white">
              <Tv className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-200">Total en Biblioteca</p>
              <p className="text-2xl sm:text-4xl font-extrabold mt-0.5">{stats.total}</p>
            </div>
          </div>
          <div className="p-2 bg-white/20 rounded-full text-white">
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        <Link 
          href="/series" 
          className="bg-[#c56088] p-4 sm:p-6 rounded-2xl sm:rounded-3xl flex items-center justify-between text-white shadow-lg shadow-[#c56088]/20 hover:scale-[1.02] transition-transform"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl sm:rounded-2xl text-white">
              <Heart className="w-5 h-5 sm:w-6 sm:h-6 fill-white" />
            </div>
            <div>
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-rose-100">Viendo Actualmente</p>
              <p className="text-2xl sm:text-4xl font-extrabold mt-0.5">{stats.watching}</p>
            </div>
          </div>
          <div className="p-2 bg-white/20 rounded-full text-white">
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        <Link 
          href="/releases" 
          className="bg-[#4878a4] p-4 sm:p-6 rounded-2xl sm:rounded-3xl flex items-center justify-between text-white shadow-lg shadow-[#4878a4]/20 hover:scale-[1.02] transition-transform"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl sm:rounded-2xl text-white">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-blue-100">Próximos Estrenos</p>
              <p className="text-2xl sm:text-4xl font-extrabold mt-0.5">{stats.upcoming}</p>
            </div>
          </div>
          <div className="p-2 bg-white/20 rounded-full text-white">
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
      </div>

      {/* Disposición Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Izquierda: Continuar Viendo (Convertido en Carrusel Horizontal) */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg sm:text-xl font-bold text-[#1e1e38] flex items-center gap-2">
              <span className="p-1.5 bg-[#d9539f] text-white rounded-full">
                <Play className="w-3.5 h-3.5 fill-white" />
              </span> 
              Continuar Viendo
            </h2>
            <Link href="/series" className="text-xs text-[#5b63be] hover:text-[#484f9e] flex items-center gap-1 font-bold">
              Ver todas <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {watchingList.length === 0 ? (
            <div className="bg-[#f3f4fa] rounded-2xl p-8 text-center text-slate-500 text-xs sm:text-sm">
              No tienes series en estado "Viendo" en este momento.
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-slate-200">
              {watchingList.map((item) => {
                const cleanNote = item.notes ? item.notes.split('\n\n[IMAGEN_NOTA]:')[0] : '';

                return (
                  <div 
                    key={item.id} 
                    className="snap-start shrink-0 w-64 sm:w-72 bg-[#f8fafc] rounded-2xl p-3 flex flex-col justify-between border border-slate-100 shadow-xs"
                  >
                    <div>
                      <div className="relative h-44 sm:h-48 bg-slate-200 rounded-xl overflow-hidden mb-3">
                        {item.poster_url ? (
                          <img src={item.poster_url} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">Sin Póster</div>
                        )}
                        <span className="absolute top-2 left-2 bg-[#1b203e]/80 backdrop-blur-md text-[10px] px-2 py-0.5 rounded-full text-white font-semibold">
                          {item.country}
                        </span>
                      </div>

                      <h3 className="font-bold text-[#1e1e38] text-sm line-clamp-1">{item.title}</h3>
                      {cleanNote && (
                        <p className="text-[11px] text-slate-600 mt-1.5 line-clamp-2 bg-white p-2 rounded-lg border border-slate-200/50">
                          💡 {cleanNote}
                        </p>
                      )}
                    </div>

                    <Link
                      href="/series"
                      className="mt-3 w-full py-2 bg-[#d9539f] hover:bg-[#c4448c] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                    >
                      <Play className="w-3 h-3 fill-white" /> Ver detalles
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Derecha: 1. Próximo Estreno Futuro + 2. Estrenadas Recientemente */}
        <div className="space-y-6">
          
          {/* 1. Tarjeta Oscura: Próximo Estreno Inminente */}
          <div className="bg-[#1b203e] text-white p-5 rounded-3xl shadow-md border border-[#2d3561] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1 bg-[#d9539f]/20 text-[#d9539f] rounded-lg">
                  <BellRing className="w-3.5 h-3.5 animate-bounce" />
                </span>
                <span className="text-[11px] font-extrabold text-pink-300 uppercase tracking-wider">¡Próximo Estreno!</span>
              </div>
              <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded-full text-slate-300 font-bold">
                Muy pronto
              </span>
            </div>

            {nextRelease ? (
              <div className="space-y-2.5">
                <div className="flex gap-3 bg-white/5 p-2.5 rounded-2xl border border-white/10 items-center">
                  <div className="w-14 h-16 bg-slate-800 rounded-xl overflow-hidden shrink-0 border border-white/10">
                    {nextRelease.poster_url ? (
                      <img src={nextRelease.poster_url} alt={nextRelease.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[9px] text-slate-400">Sin Póster</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <span className="text-[9px] font-semibold text-[#5b63be] bg-[#5b63be]/20 px-2 py-0.5 rounded-md">
                      {nextRelease.country}
                    </span>
                    <h4 className="font-bold text-white text-xs truncate mt-0.5">{nextRelease.title}</h4>
                    <p className="text-[11px] text-slate-300">📺 {nextRelease.platform}</p>
                  </div>
                </div>

                <div className="bg-[#262c50] border border-[#353d6e] p-2 rounded-xl text-center">
                  <p className="text-[10px] text-slate-200 font-medium">
                    🗓️ Estreno: <span className="font-bold text-white">
                      {nextRelease.release_date 
                        ? new Date(nextRelease.release_date).toLocaleDateString('es-ES', { dateStyle: 'medium' })
                        : 'Por anunciar'}
                    </span>
                  </p>
                </div>

                <Link 
                  href="/releases" 
                  className="w-full flex items-center justify-center gap-1.5 bg-[#d9539f] hover:bg-[#c4448c] text-white py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
                >
                  Ver todos los lanzamientos <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="text-center py-4 space-y-1">
                <Sparkles className="w-5 h-5 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-400 font-medium">No hay estrenos inminentes pendientes.</p>
              </div>
            )}
          </div>

          {/* 2. Tarjeta Abajo: Series Estrenadas Recientemente */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-[#1e1e38] flex items-center gap-1.5">
                <span className="p-1 bg-[#5b63be] text-white rounded-full">
                  <Clock className="w-3 h-3" />
                </span>
                Estrenadas recientemente
              </h3>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => scrollCarousel('left')}
                  className="p-1 bg-[#f3f4fa] hover:bg-[#e2e6f3] text-slate-600 rounded-full transition-colors"
                  title="Anterior"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => scrollCarousel('right')}
                  className="p-1 bg-[#f3f4fa] hover:bg-[#e2e6f3] text-slate-600 rounded-full transition-colors"
                  title="Siguiente"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {recentlyPremieredReleases.length === 0 ? (
              <div className="bg-[#f3f4fa] rounded-2xl p-4 text-center text-slate-400 text-xs">
                Aún no hay estrenos marcados como lanzados.
              </div>
            ) : (
              <div 
                ref={carouselRef}
                className="flex gap-3 overflow-x-auto pb-1 scrollbar-none scroll-smooth"
              >
                {recentlyPremieredReleases.map((item) => (
                  <div 
                    key={item.id} 
                    className="min-w-[170px] max-w-[170px] bg-[#f3f4fa] rounded-2xl p-2.5 flex flex-col justify-between border border-slate-100 shrink-0 shadow-2xs hover:shadow-md transition-shadow"
                  >
                    <div>
                      <div className="relative h-32 bg-slate-200 rounded-xl overflow-hidden mb-2">
                        {item.poster_url ? (
                          <img src={item.poster_url} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px]">Sin Póster</div>
                        )}
                        <span className="absolute top-1.5 left-1.5 bg-[#d9539f] text-white text-[9px] px-2 py-0.5 rounded-full font-bold">
                          {item.country}
                        </span>
                      </div>

                      <h4 className="font-bold text-[#1e1e38] text-xs line-clamp-1">{item.title}</h4>
                    </div>

                    <div className="pt-2 mt-1 border-t border-slate-200/60">
                      <span className="text-[10px] font-bold text-[#5b63be] bg-[#5b63be]/10 px-2 py-0.5 rounded-full block text-center">
                        Ya se estrenó
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}