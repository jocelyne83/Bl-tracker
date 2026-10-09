'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Heart, Lock, Mail, Eye, EyeOff, ArrowRight, Sparkles, Check } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg('Correo o contraseña incorrectos. Inténtalo de nuevo.');
      setLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#e0e7ff] via-[#f5f3ff] to-[#fce7f3] flex items-center justify-center p-4 relative overflow-hidden select-none">
      
      {/* Logos e Ilustraciones Laterales (Decoración Visual) */}
      
      {/* Esquina Superior Izquierda: Logo BL Tracker */}
      <div className="absolute top-8 left-8 flex items-center gap-2">
        <div className="p-2 bg-[#d9539f] rounded-2xl shadow-md text-white">
          <Heart className="w-5 h-5 fill-white" />
        </div>
        <span className="text-xl font-black text-[#1e1e38]">
          BL <span className="text-[#8b5cf6]">Tracker</span>
        </span>
      </div>

      {/* Frase Izquierda */}
      <div className="hidden lg:block absolute left-12 top-1/3 -rotate-6 max-w-xs space-y-1">
        <p className="text-2xl font-black italic text-[#8b5cf6] leading-snug">
          Tu pasión, <br />
          <span className="text-3xl text-[#d9539f]">en un solo lugar ♡</span>
        </p>
        <div className="w-32 h-1 bg-gradient-to-r from-[#d9539f] to-transparent rounded-full" />
      </div>

      {/* Frase Derecha */}
      <div className="hidden lg:block absolute right-12 bottom-1/3 rotate-3 max-w-xs text-right space-y-1">
        <p className="text-2xl font-black italic text-[#8b5cf6] leading-snug">
          Historias <br />
          <span className="text-3xl text-[#d9539f]">que te hacen sentir ♡</span>
        </p>
        <div className="w-32 h-1 bg-gradient-to-l from-[#d9539f] to-transparent rounded-full ml-auto" />
      </div>

      {/* Destellos Suaves de Fondo */}
      <div className="absolute top-1/4 left-1/4 text-[#c084fc]/40 text-3xl animate-pulse">✦</div>
      <div className="absolute bottom-1/4 right-1/4 text-[#f472b6]/40 text-3xl animate-pulse">✦</div>

      {/* TARJETA CENTRAL DE LOGIN */}
      <div className="relative z-10 bg-white/70 backdrop-blur-xl border border-white/80 rounded-3xl w-full max-w-md p-8 sm:p-10 shadow-2xl shadow-purple-500/10 space-y-6">
        
        {/* Encabezado e Ícono */}
        <div className="text-center space-y-2">
          <div className="relative inline-flex p-4 bg-gradient-to-tr from-[#ec4899] to-[#c084fc] rounded-3xl text-white shadow-lg shadow-pink-500/30 mb-1">
            <Heart className="w-8 h-8 fill-white" />
            <span className="absolute -top-1 -right-1 bg-emerald-400 text-slate-900 rounded-full p-1 border-2 border-white">
              <Check className="w-3 h-3 stroke-[3]" />
            </span>
          </div>

          <h1 className="text-3xl font-black text-[#1e1e38] tracking-tight">
            BL <span className="text-[#a855f7]">Tracker</span>
          </h1>
          <p className="text-[#64748b] text-xs font-semibold">
            Acceso privado para administración
          </p>
        </div>

        {/* Mensaje de Error */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs p-3 rounded-2xl text-center font-bold">
            {errorMsg}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleLogin} className="space-y-4">
          
          {/* Campo Correo Electronico */}
          <div>
            <label className="block text-xs font-bold text-[#1e1e38] mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#8b5cf6] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu-correo@ejemplo.com"
                className="w-full bg-[#eef2ff] hover:bg-[#e0e7ff] focus:bg-white text-[#1e1e38] placeholder-slate-400 border border-indigo-100 rounded-2xl pl-11 pr-4 py-3 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#a855f7]"
              />
            </div>
          </div>

          {/* Campo Contraseña */}
          <div>
            <label className="block text-xs font-bold text-[#1e1e38] mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#8b5cf6] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#eef2ff] hover:bg-[#e0e7ff] focus:bg-white text-[#1e1e38] placeholder-slate-400 border border-indigo-100 rounded-2xl pl-11 pr-11 py-3 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#a855f7]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#8b5cf6] transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Botón Iniciar Sesión */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#d9539f] via-[#c084fc] to-[#a855f7] hover:opacity-95 text-white font-black py-3.5 rounded-2xl text-sm transition-all shadow-lg shadow-pink-500/25 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
          >
            {loading ? (
              <span>Iniciando sesión...</span>
            ) : (
              <>
                <span>Iniciar Sesión</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}