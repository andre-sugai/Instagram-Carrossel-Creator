import React from 'react';
import { XIcon, CheckCircle2, Sparkles, Zap, Trophy, CreditCard } from 'lucide-react';

interface PricingPlan {
  id: string;
  name: string;
  price: string;
  credits: string;
  description: string;
  features: string[];
  isPopular?: boolean;
  icon: React.ReactNode;
  color: string;
}

const PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 'R$ 29,90',
    credits: '10 Créditos',
    description: 'Perfeito para quem está começando.',
    features: [
      'Geração de texto com IA',
      'Até 10 carrosséis únicos',
      'Download em alta qualidade',
      'Suporte via e-mail'
    ],
    icon: <Zap className="w-5 h-5" />,
    color: 'from-blue-500 to-cyan-400'
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'R$ 99,90',
    credits: '50 Créditos',
    description: 'O melhor custo-benefício para criadores.',
    features: [
      'Tudo do Starter',
      'Geração de imagens com IA',
      'Edição avançada de slides',
      'Suporte prioritário 24/7',
      'Novos estilos antecipados'
    ],
    isPopular: true,
    icon: <Trophy className="w-5 h-5" />,
    color: 'from-purple-600 to-pink-500'
  },
  {
    id: 'enterprise',
    name: 'Unlimited',
    price: 'R$ 299,00',
    credits: 'Acesso Ilimitado',
    description: 'Para agências e power users.',
    features: [
      'Créditos ilimitados/mês',
      'Remoção total de marca d\'água',
      'Exportação para Figma/Canva',
      'Gerente de conta dedicado',
      'API access'
    ],
    icon: <Sparkles className="w-5 h-5" />,
    color: 'from-amber-500 to-orange-400'
  }
];

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div 
        className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-zinc-900/90 border border-white/10 rounded-3xl shadow-2xl shadow-purple-500/20 animate-in zoom-in-95 slide-in-from-bottom-5 duration-500"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all z-10"
        >
          <XIcon className="w-6 h-6" />
        </button>

        <div className="p-8 sm:p-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              Escolha seu plano
            </h2>
            <p className="text-zinc-400 max-w-lg mx-auto">
              Ganhe poderes extras com inteligência artificial e crie carrosséis que convertem em segundos.
            </p>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <div 
                key={plan.id}
                className={`group relative flex flex-col p-8 rounded-3xl border transition-all duration-500 hover:scale-[1.02] ${
                  plan.isPopular 
                    ? 'bg-gradient-to-b from-white/10 to-transparent border-purple-500/50 shadow-xl shadow-purple-500/10' 
                    : 'bg-white/5 border-white/5 hover:border-white/20'
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-purple-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-purple-500/40">
                    Mais Popular
                  </div>
                )}

                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center text-white mb-6 group-hover:rotate-6 transition-transform duration-500`}>
                  {plan.icon}
                </div>

                <div className="mb-8">
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/60 transition-all">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-2xl font-black text-white">{plan.price}</span>
                  </div>
                  <div className={`text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r ${plan.color}`}>
                    {plan.credits}
                  </div>
                </div>

                <p className="text-sm text-zinc-400 mb-8 leading-relaxed">
                  {plan.description}
                </p>

                <div className="flex-grow space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className={`w-5 h-5 shrink-0 ${plan.isPopular ? 'text-purple-400' : 'text-zinc-500'}`} />
                      <span className="text-sm text-zinc-300">{feature}</span>
                    </div>
                  ))}
                </div>

                <button 
                  className={`w-full py-4 rounded-2xl font-black text-sm transition-all duration-300 flex items-center justify-center gap-2 group/btn ${
                    plan.isPopular
                      ? 'bg-purple-500 hover:bg-purple-400 text-white shadow-lg shadow-purple-500/25'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  <CreditCard className="w-4 h-4 transition-transform group-hover/btn:scale-110" />
                  Garantir Agora
                </button>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-xs text-zinc-500 flex items-center justify-center gap-2">
              <Sparkles className="w-3 h-3" /> 
              Pagamento seguro via Stripe. Liberação instantânea de créditos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingModal;
