import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import confetti from 'canvas-confetti';
import { 
  UserIcon, 
  UploadIcon, 
  TrashIcon, 
  LogOutIcon, 
  SettingsIcon, 
  ShieldIcon,
  BriefcaseIcon,
  CameraIcon,
  BellIcon,
  CheckCircleIcon,
  PartyPopperIcon,
  ArrowLeftIcon,
  ChevronRightIcon,
  HomeIcon
} from 'lucide-react';

interface Client {
  id: string;
  name: string;
  logo_url: string;
}

type Tab = 'info' | 'clients' | 'settings';

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<'pt' | 'en'>('pt');
  
  // Profile State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Clients State
  const [clients, setClients] = useState<Client[]>([]);
  const [newClientName, setNewClientName] = useState('');
  const [uploadingClientLogo, setUploadingClientLogo] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // Fetch Data
  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.full_name || '');
      setEmail(user.email || '');
      setAvatarUrl(user.user_metadata?.avatar_url || null);
      fetchClients();
    }
  }, [user]);

  // Check for Welcome query param
  useEffect(() => {
    if (searchParams.get('welcome') === 'true') {
        setShowWelcomeModal(true);
        // Clear param
        setSearchParams(params => {
            params.delete('welcome');
            return params;
        });

        // Trigger confetti
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function() {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
    }
  }, []);

  const fetchClients = async () => {
    const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
    if (data) setClients(data);
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName, avatar_url: avatarUrl }
    });
    setLoading(false);
    if (!error) {
      alert('Perfil atualizado com sucesso!');
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingAvatar(true);
      if (!event.target.files || event.target.files.length === 0) return;
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user?.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setAvatarUrl(data.publicUrl);
    } catch (error) {
      alert('Erro ao fazer upload da imagem!');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleClientLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>, clientName: string) => {
    try {
      if (!clientName) {
        alert('Digite o nome do cliente primeiro');
        return;
      }
      setUploadingClientLogo(true);
      if (!event.target.files || event.target.files.length === 0) return;
      
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('client-logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('client-logos').getPublicUrl(filePath);

      const { data: clientData, error: dbError } = await supabase.from('clients').insert({
        user_id: user?.id,
        name: clientName,
        logo_url: urlData.publicUrl
      }).select().single();

      if (dbError) throw dbError;
      
      setClients([clientData, ...clients]);
      setNewClientName('');
    } catch (error) {
      alert('Erro ao salvar cliente');
      console.error(error);
    } finally {
      setUploadingClientLogo(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
        const { error } = await supabase.rpc('delete_user');
        if (error) throw error;
        
        await signOut();
        navigate('/login');
    } catch (error: any) {
        alert('Erro ao deletar conta: ' + (error.message || 'Erro desconhecido'));
        setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans">
      <Header 
        language="pt" 
        setLanguage={() => {}} 
      />

      <div className="max-w-[1400px] mx-auto pt-8 pb-12 px-6 flex flex-col md:flex-row gap-8 lg:gap-12 min-h-[calc(100vh-80px)]">
        
        {/* SIDEBAR */}
        <div className="w-full md:w-64 shrink-0 flex flex-col">
          <div className="mb-8 pl-4">
             <Link to="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium mb-4 group">
                 <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                 Voltar para o Editor
             </Link>
             <h2 className="text-xl font-bold">Perfil do Usuário</h2>
          </div>
          
          <nav className="flex-1 space-y-2">
            <button 
              onClick={() => setActiveTab('info')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'info' ? 'text-primary bg-primary/5 border-r-2 border-primary' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
            >
              <UserIcon className="w-5 h-5" />
              Informações
            </button>
            <button 
              onClick={() => setActiveTab('clients')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'clients' ? 'text-primary bg-primary/5 border-r-2 border-primary' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
            >
              <BriefcaseIcon className="w-5 h-5" />
              Meus Clientes
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'settings' ? 'text-primary bg-primary/5 border-r-2 border-primary' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
            >
              <SettingsIcon className="w-5 h-5" />
              Configurações
            </button>
          </nav>

          <button 
            onClick={handleLogout}
            className="mt-auto flex items-center gap-4 px-4 py-3 text-red-500 hover:text-red-400 hover:bg-red-500/5 rounded-lg text-sm font-medium transition-colors"
          >
            <LogOutIcon className="w-5 h-5" />
            Sair
          </button>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 bg-[#18181b] border border-white/5 rounded-3xl p-8 lg:p-12 shadow-2xl relative overflow-hidden flex flex-col">
             {/* Decorative Gradient Top */}
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-purple-600/50"></div>

             {/* Breadcrumb */}
             <div className="flex items-center gap-2 text-sm text-zinc-500 mb-8 font-medium">
                <Link to="/" className="hover:text-white transition-colors flex items-center gap-1">
                    <HomeIcon className="w-4 h-4" />
                    Home
                </Link>
                <ChevronRightIcon className="w-4 h-4 opacity-50" />
                <span className="text-zinc-300">Perfil</span>
                <ChevronRightIcon className="w-4 h-4 opacity-50" />
                <span className="text-primary capitalize">
                    {activeTab === 'info' && 'Informações'}
                    {activeTab === 'clients' && 'Clientes'}
                    {activeTab === 'settings' && 'Configurações'}
                </span>
             </div>

             {/* TAB: INFO */}
             {activeTab === 'info' && (
               <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex flex-col items-center mb-12">
                     <div className="relative group">
                        <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-primary to-purple-500">
                             <div className="w-full h-full rounded-full bg-[#18181b] overflow-hidden relative">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-600">
                                        <UserIcon className="w-12 h-12" />
                                    </div>
                                )}
                             </div>
                        </div>
                        <label className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full cursor-pointer hover:bg-pink-600 transition-colors shadow-lg border-4 border-[#18181b]">
                           <CameraIcon className="w-4 h-4" />
                           <input 
                              type="file" 
                              accept="image/*"
                              onChange={handleAvatarUpload}
                              disabled={uploadingAvatar}
                              className="hidden"
                           />
                        </label>
                        {uploadingAvatar && (
                           <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                               <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                           </div>
                        )}
                     </div>
                     <h2 className="mt-4 text-2xl font-bold">{fullName || 'Usuário'}</h2>
                     <p className="text-zinc-500 text-sm">{user?.email}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Nome de Exibição / Apelido</label>
                          <input 
                              type="text" 
                              value={fullName.split(' ')[0]} 
                              disabled
                              className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-700/50 rounded-xl text-zinc-400 cursor-not-allowed"
                          />
                      </div>
                      <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Nome Completo</label>
                          <input 
                              type="text" 
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-white"
                              placeholder="Seu nome completo"
                          />
                      </div>
                      <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Email</label>
                          <input 
                              type="email" 
                              value={email}
                              disabled
                              className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-700/50 rounded-xl text-zinc-400 cursor-not-allowed"
                          />
                      </div>
                       {/* Placeholder fields to match layout */}
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Telefone (Opcional)</label>
                          <input 
                              type="tel" 
                              placeholder="(00) 00000-0000"
                              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-white"
                          />
                      </div>
                  </div>

                  <div className="mt-12 flex justify-center">
                      <button 
                          onClick={handleUpdateProfile}
                          disabled={loading}
                          className="px-12 py-3 bg-gradient-to-r from-primary to-purple-600 rounded-xl font-bold text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100"
                      >
                          {loading ? 'Salvando...' : 'Salvar Alterações'}
                      </button>
                  </div>
               </div>
             )}

             {/* TAB: CLIENTS */}
             {activeTab === 'clients' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between mb-8">
                       <div>
                          <h3 className="text-2xl font-bold">Gerenciar Clientes</h3>
                          <p className="text-zinc-400 text-sm mt-1">Adicione logos para usar em seus projetos.</p>
                       </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 mb-8 bg-zinc-900/50 p-6 rounded-2xl border border-white/5">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Nome do Cliente</label>
                            <input 
                              type="text" 
                              value={newClientName}
                              onChange={(e) => setNewClientName(e.target.value)}
                              placeholder="Ex: Google, Apple..."
                              className="w-full px-4 py-3 bg-black/20 border border-zinc-700 rounded-xl focus:border-primary outline-none"
                            />
                        </div>
                        <div className="flex flex-col justify-end">
                            <div className="relative">
                              <button className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-black hover:bg-zinc-200 rounded-xl font-bold text-sm transition-colors w-full whitespace-nowrap">
                                  {uploadingClientLogo ? 'Enviando...' : (
                                    <>
                                      <UploadIcon className="w-4 h-4" />
                                      Upload Logo
                                    </>
                                  )}
                              </button>
                              <input 
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleClientLogoUpload(e, newClientName)}
                                  disabled={!newClientName || uploadingClientLogo}
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                              />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {clients.length === 0 && (
                            <div className="col-span-full text-center py-12 text-zinc-700 italic border-2 border-dashed border-white/5 rounded-2xl">
                                Nenhuma logo adicionada ainda.
                            </div>
                        )}
                        {clients.map(client => (
                            <div key={client.id} className="relative group bg-zinc-900 rounded-2xl p-6 border border-white/5 flex flex-col items-center gap-4 hover:border-white/20 transition-all">
                                <div className="w-20 h-20 flex items-center justify-center p-3 bg-white/5 rounded-xl overflow-hidden">
                                  <img src={client.logo_url} alt={client.name} className="w-full h-full object-contain" />
                                </div>
                                <span className="text-sm font-bold truncate w-full text-center">{client.name}</span>
                                <button 
                                  onClick={async () => {
                                      if(confirm('Remover este cliente?')) {
                                          await supabase.from('clients').delete().eq('id', client.id);
                                          setClients(clients.filter(c => c.id !== client.id));
                                      }
                                  }}
                                  className="absolute top-2 right-2 p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                  title="Excluir"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
             )}

            {/* TAB: SETTINGS */}
             {activeTab === 'settings' && (
                <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h3 className="text-2xl font-bold mb-8">Configurações da Conta</h3>

                     <div className="border border-red-500/20 bg-red-500/5 rounded-2xl p-6 md:p-8">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-red-500/10 rounded-xl text-red-500">
                                <ShieldIcon className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-lg font-bold text-white mb-1">Zona de Perigo</h4>
                                <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                                    Deletar sua conta é uma ação irreversível. Todos os seus projetos, imagens e dados serão perdidos permanentemente.
                                </p>
                                <button 
                                  onClick={() => setShowDeleteConfirm(true)}
                                  className="px-6 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg font-bold transition-all text-sm shadow-lg shadow-red-900/20"
                                >
                                  Deletar minha conta
                                </button>
                            </div>
                        </div>
                     </div>
                </div>
             )}

        </div>
      </div>

      {/* Welcome Modal */}
      {showWelcomeModal && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-500">
             <div className="bg-[#18181b] border border-primary/30 p-8 rounded-3xl max-w-lg w-full relative overflow-hidden shadow-2xl shadow-primary/20">
                 {/* Background decoration */}
                 <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl"></div>
                 <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl"></div>

                 <div className="relative z-10 text-center">
                     <div className="w-20 h-20 bg-gradient-to-tr from-primary to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/30 animate-in zoom-in duration-700 delay-150">
                         <PartyPopperIcon className="w-10 h-10 text-white" />
                     </div>

                     <h2 className="text-3xl font-black text-white mb-4 animate-in slide-in-from-bottom-4 duration-700 delay-200">
                         Bem-vindo ao Time! 🚀
                     </h2>
                     
                     <p className="text-zinc-300 mb-8 leading-relaxed animate-in slide-in-from-bottom-4 duration-700 delay-300">
                         Sua conta foi verificada com sucesso. Agora você tem acesso total para criar carrosséis incríveis.
                         <br/><br/>
                         Por favor, complete seu perfil abaixo para personalizar sua experiência.
                     </p>

                     <button 
                        onClick={() => setShowWelcomeModal(false)}
                        className="w-full py-4 bg-white text-black rounded-xl font-bold text-lg hover:bg-zinc-200 transition-all transform hover:scale-[1.02] shadow-xl animate-in slide-in-from-bottom-4 duration-700 delay-400"
                     >
                        Vamos começar!
                     </button>
                 </div>
             </div>
         </div>
      )}

      {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="bg-[#18181b] border border-red-500/30 p-6 rounded-2xl max-w-md w-full animate-in zoom-in-95 duration-200 shadow-2xl">
                 <h3 className="text-2xl font-bold text-white mb-2">Tem certeza?</h3>
                 <p className="text-zinc-400 mb-6">Esta ação não pode ser desfeita. Isso excluirá permanentemente sua conta e removerá seus dados de nossos servidores.</p>
                 <div className="flex justify-end gap-3">
                    <button 
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleDeleteAccount}
                      className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-lg"
                    >
                      Sim, deletar minha conta
                    </button>
                 </div>
              </div>
           </div>
        )}
    </div>
  );
}
