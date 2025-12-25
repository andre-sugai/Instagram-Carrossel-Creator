import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XIcon } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#18181b] p-8 rounded-2xl border border-white/10 shadow-2xl max-w-sm w-full m-4 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
        >
          <XIcon className="w-5 h-5" />
        </button>

        <h3 className="text-2xl font-bold mb-2 text-white text-center">
          Crie sua conta
        </h3>
        <p className="text-zinc-400 mb-8 text-center text-sm">
          Para usar a Inteligência Artificial e salvar seus projetos, você precisa estar logado.
        </p>

        <div className="flex flex-col gap-3">
          <button 
            onClick={() => navigate('/signup')}
            className="w-full py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors shadow-lg shadow-purple-900/20"
          >
            Criar Conta Grátis
          </button>
          
          <button 
            onClick={() => navigate('/login')}
            className="w-full py-3 bg-zinc-800 text-white font-medium rounded-xl hover:bg-zinc-700 transition-colors border border-zinc-700"
          >
            Já tenho conta
          </button>
        </div>
      </div>
    </div>
  );
}
