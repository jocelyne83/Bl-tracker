'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LayoutDashboard, Tv, Calendar, CheckSquare, Heart, PanelLeftClose, PanelLeft, LogOut, UserCheck } from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Mi Lista BL', href: '/series', icon: Tv },
  { name: 'Próximos Estrenos', href: '/releases', icon: Calendar },
  { name: 'Mis Tareas', href: '/tasks', icon: CheckSquare },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    async function getUserData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || 'Abigail');
      }
    }
    getUserData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
    }
    router.push('/login');
    router.refresh();
  };

  return (
    <aside
      className={`bg-[#1b203e] text-white h-screen sticky top-0 p-4 flex flex-col justify-between transition-all duration-300 relative z-30 select-none shrink-0 ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      <div>
        {/* Encabezado Principal */}
        <div className={`flex items-center mb-8 px-2 ${isOpen ? 'justify-between' : 'justify-center'}`}>
          {isOpen && (
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-gradient-to-tr from-[#d9539f] to-[#b654c6] rounded-2xl shadow-md">
                <Heart className="w-5 h-5 text-white fill-white" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-1">
                BL <span className="text-[#8288d9]">Tracker</span>
              </h1>
            </div>
          )}

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-slate-400 hover:text-white bg-[#262d53] hover:bg-[#2d3663] rounded-xl transition-colors"
          >
            {isOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* Menú de Navegación Estilo Píldora */}
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all relative ${
                  isActive
                    ? 'bg-gradient-to-r from-[#d9539f] to-[#c56088] text-white shadow-lg shadow-[#d9539f]/25'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                } ${!isOpen ? 'justify-center' : ''}`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {isOpen && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bloque Inferior con Frase y Tarjeta de Usuario */}
      <div className="space-y-6 pt-6">
        
        {/* Mensaje Decorativo Visual */}
        {isOpen && (
          <div className="px-3 relative overflow-hidden py-2">
            <p className="text-xl font-extrabold italic text-transparent bg-clip-text bg-gradient-to-r from-[#8288d9] via-[#d9539f] to-pink-300 -rotate-3 leading-tight">
              Más BL, <br />
              <span className="text-2xl">más felicidad ♡</span>
            </p>
            
            {/* Adorno Neón Fondo */}
            <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-[#d9539f]/20 rounded-full blur-xl pointer-events-none" />
          </div>
        )}

        {/* Tarjeta de Sesión / Avatar y Cierre de Sesión */}
        <div className="bg-[#242b50] border border-[#313a68] p-3 rounded-3xl space-y-3">
          {isOpen && userEmail && (
            <div className="flex items-center gap-3 px-1">
              <div className="w-10 h-10 bg-[#171b33] rounded-full flex items-center justify-center font-extrabold text-white text-base border border-white/10 shrink-0">
                {userEmail.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Activo
                </p>
                <p className="text-xs text-white truncate font-bold">{userEmail.split('@')[0]}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-300 hover:text-white hover:bg-rose-500/20 transition-all ${
              !isOpen ? 'justify-center' : ''
            }`}
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {isOpen && <span>Cerrar Sesión</span>}
          </button>
        </div>

      </div>
    </aside>
  );
}