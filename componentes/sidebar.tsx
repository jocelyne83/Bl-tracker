'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Tv, 
  Calendar, 
  CheckSquare, 
  LogOut, 
  Menu, 
  X, 
  Heart 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const MENU_ITEMS = [
  { name: 'Dashboard', path: '/', icon: Home },
  { name: 'Mi Lista BL', path: '/series', icon: Tv },
  { name: 'Próximos Estrenos', path: '/releases', icon: Calendar },
  { name: 'Mis Tareas', path: '/tasks', icon: CheckSquare },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <>
      {/* BARRA SUPERIOR PARA MÓVILES (Solo visible en pantallas pequeñas < md) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#1b203e] text-white flex items-center justify-between px-4 z-40 shadow-md">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#d9539f] rounded-xl text-white">
            <Heart className="w-4 h-4 fill-white" />
          </div>
          <span className="font-extrabold text-base tracking-tight">
            BL <span className="text-[#a855f7]">Tracker</span>
          </span>
        </div>

        {/* Botón Hamburguesa */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-slate-200 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          aria-label="Abrir menú"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* OVERLAY PARA MÓVIL (Fondo oscuro transparente para cerrar menú al tocar afuera) */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="md:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40"
        />
      )}

      {/* MENÚ SIDEBAR (Desplegable en Móvil / Fijo en Escritorio) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 bg-[#1b203e] text-white flex flex-col justify-between p-6 z-50 transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-8">
          {/* Header del Menú en Escritorio */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[#d9539f] rounded-2xl text-white shadow-md">
                <Heart className="w-5 h-5 fill-white" />
              </div>
              <span className="text-xl font-black tracking-tight">
                BL <span className="text-[#a855f7]">Tracker</span>
              </span>
            </div>

            {/* Cerrar en móvil */}
            <button
              onClick={() => setIsOpen(false)}
              className="md:hidden p-1 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Lista de Navegación */}
          <nav className="space-y-2">
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#d9539f] to-[#a855f7] text-white shadow-md shadow-pink-500/20'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Pie de Menú: Salir */}
        <div className="pt-6 border-t border-white/10 space-y-4">
          <p className="text-xs font-black italic text-pink-400/80 px-2 rotate-[-2deg]">
            Pequeños objetivos, grandes historias ♡
          </p>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-300 hover:text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}