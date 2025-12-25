import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, MailCheck } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [success, setSuccess] = useState(false)

  const navigate = useNavigate()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validação básica
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/profile?welcome=true`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b] text-white">
        <div className="max-w-md w-full p-8 bg-[#18181b] rounded-2xl border border-white/10 shadow-2xl text-center">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20">
            <MailCheck className="w-8 h-8 text-green-500" />
          </div>
          
          <h2 className="text-3xl font-bold mb-4">Verifique seu email</h2>
          
          <div className="space-y-4 text-zinc-400 mb-8">
            <p>
              Enviamos um link de confirmação para:
              <br />
              <span className="text-white font-medium">{email}</span>
            </p>
            <p className="text-sm">
              Clique no link enviado para ativar sua conta e liberar seu acesso aos 3 carrosséis gratuitos! 🎁
            </p>
          </div>

          <div className="space-y-3">
             <Link 
              to="/login"
              className="block w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition-colors"
             >
                Fazer Login
             </Link>
             <button 
                onClick={() => setSuccess(false)}
                className="text-sm text-zinc-500 hover:text-zinc-300 hover:underline"
             >
                Voltar
             </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] text-white">
      <div className="max-w-md w-full space-y-8 p-8 bg-[#18181b] rounded-2xl border border-white/10 shadow-2xl">
        <div>
          <h2 className="text-3xl font-bold text-center">
            Criar conta
          </h2>
          <p className="mt-2 text-center text-sm text-zinc-400">
            Ganhe 3 carrosséis grátis ao se cadastrar! 🎁
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-400">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400">
              Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Mínimo de 6 caracteres
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 font-medium transition-colors"
          >
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <div className="text-center text-sm">
          <span className="text-zinc-500">Já tem conta? </span>
          <Link to="/login" className="text-purple-400 hover:text-purple-300 hover:underline">
            Fazer login
          </Link>
        </div>
      </div>
    </div>
  )
}
