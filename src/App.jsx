import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Book, ChevronLeft, Volume2, Settings, Upload, Lock, LogOut, User } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// =====================================================
// CONFIGURAÇÃO DO SUPABASE
// =====================================================
// OPÇÃO 1: Usando variáveis de ambiente (.env) - RECOMENDADO
const SUPABASE_URL  = process.env.REACT_APP_SUPABASE_URL || '';
const SUPABASE_KEY  = process.env.REACT_APP_SUPABASE_ANON_KEY || '';


// Verificar se as credenciais estão configuradas
if (!SUPABASE_URL  || !SUPABASE_KEY ) {
  console.error('⚠️ Configure REACT_APP_SUPABASE_URL e REACT_APP_SUPABASE_ANON_KEY no arquivo .env');
}

const supabase = {
  from: (table) => ({
    select: (columns = '*') => ({
      eq: (column, value) => ({
        order: (orderBy) => ({
          async execute() {
            const url = `${SUPABASE_URL}/rest/v1/${table}?select=${columns}&${column}=eq.${value}&order=${orderBy}`;
            const res = await fetch(url, {
              headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
              }
            });
            return { data: await res.json(), error: null };
          }
        }),
        async single() {
          const url = `${SUPABASE_URL}/rest/v1/${table}?select=${columns}&${column}=eq.${value}`;
          const res = await fetch(url, {
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`
            }
          });
          const data = await res.json();
          return { data: data[0], error: null };
        }
      }),
      order: (orderBy) => ({
        async execute() {
          const url = `${SUPABASE_URL}/rest/v1/${table}?select=${columns}&order=${orderBy}`;
          const res = await fetch(url, {
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`
            }
          });
          return { data: await res.json(), error: null };
        }
      })
    }),
    update: (values) => ({
      match: (conditions) => ({
        async execute() {
          let url = `${SUPABASE_URL}/rest/v1/${table}?`;
          Object.entries(conditions).forEach(([key, val]) => {
            url += `${key}=eq.${val}&`;
          });
          const res = await fetch(url, {
            method: 'PATCH',
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify(values)
          });
          return { error: null };
        }
      }),
      eq: (column, value) => ({
        async execute() {
          const url = `${SUPABASE_URL}/rest/v1/${table}?${column}=eq.${value}`;
          const res = await fetch(url, {
            method: 'PATCH',
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify(values)
          });
          return { error: null };
        }
      })
    }),
    async insert(values) {
      const url = `${SUPABASE_URL}/rest/v1/${table}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(values)
      });
      return { error: null };
    }
  }),
  storage: {
    from: (bucket) => ({
      async upload(path, file, options) {
        const url = `${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          },
          body: file
        });
        return { data: { path }, error: null };
      },
      getPublicUrl(path) {
        return {
          data: {
            publicUrl: `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`
          }
        };
      }
    })
  }
};

export default function BibliaAveMariaApp() {
  const [tela, setTela] = useState('login');
  const [usuario, setUsuario] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [livros, setLivros] = useState([]);
  const [livroSelecionado, setLivroSelecionado] = useState(null);
  const [capitulos, setCapitulos] = useState([]);
  const [capituloAtual, setCapituloAtual] = useState(null);
  const [versiculos, setVersiculos] = useState([]);
  const [tocando, setTocando] = useState(false);
  const [tempoAtual, setTempoAtual] = useState(0);
  const [duracao, setDuracao] = useState(0);
  const [versiculoAtivo, setVersiculoAtivo] = useState(0);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  const [velocidade, setVelocidade] = useState(1.0);
  
  // Admin states
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processando, setProcessando] = useState(false);
  
  const audioRef = useRef(null);
  const versiculosContainerRef = useRef(null);

  // =====================================================
  // AUTENTICAÇÃO SIMPLES
  // =====================================================
  const handleLogin = async (email, senha) => {
    setErro(null);
    setCarregando(true);
    
    try {
      if (email === 'admin@biblia.com' && senha === 'admin123') {
        setUsuario({ email, nome: 'Administrador' });
        setIsAdmin(true);
        await carregarLivros();
        setTela('menu');
      } else if (email && senha) {
        setUsuario({ email, nome: 'Usuário' });
        setIsAdmin(false);
        await carregarLivros();
        setTela('livros');
      } else {
        setErro('Credenciais inválidas');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      setErro('Erro ao fazer login. Verifique suas credenciais do Supabase.');
    } finally {
      setCarregando(false);
    }
  };

  const handleLogout = () => {
    setUsuario(null);
    setIsAdmin(false);
    setTela('login');
  };

  // =====================================================
  // SINCRONIZAÇÃO MELHORADA COM AUTO-SCROLL
  // =====================================================
  useEffect(() => {
    if (versiculos.length > 0 && duracao > 0 && tocando) {
      const comTimestamps = versiculos.some(v => v.tempo_inicio !== null && v.tempo_inicio !== undefined);
      
      let novoIndice = versiculoAtivo;
      
      if (comTimestamps) {
        // Usar timestamps reais - busca pelo versículo correto
        for (let i = 0; i < versiculos.length; i++) {
          const inicio = parseFloat(versiculos[i].tempo_inicio) || 0;
          const proximoInicio = i < versiculos.length - 1 ? parseFloat(versiculos[i + 1].tempo_inicio) : duracao;
          
          // Verifica se o tempo atual está dentro do intervalo do versículo
          if (tempoAtual >= inicio && tempoAtual < proximoInicio) {
            novoIndice = i;
            break;
          }
        }
      } else {
        // Distribuição proporcional
        const porcentagem = tempoAtual / duracao;
        novoIndice = Math.floor(porcentagem * versiculos.length);
        if (novoIndice >= versiculos.length) {
          novoIndice = versiculos.length - 1;
        }
      }
      
      if (novoIndice !== versiculoAtivo) {
        setVersiculoAtivo(novoIndice);
        
        // Auto-scroll - posiciona o versículo no topo com margem
        setTimeout(() => {
          const elemento = document.getElementById(`versiculo-${novoIndice}`);
          if (elemento && versiculosContainerRef.current) {
            const container = versiculosContainerRef.current;
            const elementoRect = elemento.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            const scrollTop = container.scrollTop;
            const offset = elementoRect.top - containerRect.top + scrollTop - 20;
            
            container.scrollTo({
              top: offset,
              behavior: 'smooth'
            });
          }
        }, 50);
      }
    }
  }, [tempoAtual, versiculos, duracao, tocando]);

  // =====================================================
  // FUNÇÕES DE BUSCA NO SUPABASE
  // =====================================================
  const carregarLivros = async () => {
    setCarregando(true);
    setErro(null);
    
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/livros?select=*&order=ordem`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });
      
      const data = await res.json();
      setLivros(data || []);
      
      if (data && data.length === 0) {
        setErro('Nenhum livro encontrado. Execute o schema SQL primeiro!');
      }
    } catch (error) {
      console.error('Erro ao carregar livros:', error);
      setErro(`Erro ao carregar livros: ${error.message}`);
    } finally {
      setCarregando(false);
    }
  };

  const carregarCapitulos = async (livroId) => {
    setCarregando(true);
    setErro(null);
    
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/capitulos?select=*&livro_id=eq.${livroId}&order=numero`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });
      
      const data = await res.json();
      setCapitulos(data || []);
    } catch (error) {
      console.error('Erro ao carregar capítulos:', error);
      setErro('Erro ao carregar capítulos.');
    } finally {
      setCarregando(false);
    }
  };

  const carregarCapitulo = async (capituloId) => {
    setCarregando(true);
    setErro(null);
    
    try {
      const capRes = await fetch(`${SUPABASE_URL}/rest/v1/capitulos?select=*,livros!inner(nome,nome_abreviado)&id=eq.${capituloId}`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });
      
      const capData = await capRes.json();
      
      const versRes = await fetch(`${SUPABASE_URL}/rest/v1/versiculos?select=*&capitulo_id=eq.${capituloId}&order=numero`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });
      
      const versData = await versRes.json();
      
      setCapituloAtual(capData[0]);
      setVersiculos(versData || []);
      setTocando(false);
      setTempoAtual(0);
      setVersiculoAtivo(0);
      
      if (!capData[0].audio_url) {
        setErro('⚠️ Este capítulo ainda não tem áudio disponível.');
      }
      
    } catch (error) {
      console.error('Erro ao carregar capítulo:', error);
      setErro(`Erro ao carregar capítulo: ${error.message}`);
    } finally {
      setCarregando(false);
    }
  };

  // =====================================================
  // FUNÇÕES DO PLAYER
  // =====================================================
  const handlePlayPause = () => {
    if (audioRef.current) {
      if (tocando) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => {
          console.error('Erro ao reproduzir:', e);
          setErro('Erro ao reproduzir áudio.');
        });
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setTempoAtual(audioRef.current.currentTime);
      setDuracao(audioRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duracao;
    
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setTempoAtual(newTime);
    }
  };

  const handleVelocidade = (novaVelocidade) => {
    setVelocidade(novaVelocidade);
    if (audioRef.current) {
      audioRef.current.playbackRate = novaVelocidade;
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // =====================================================
  // FUNÇÕES ADMINISTRATIVAS
  // =====================================================
  const handleUploadAudio = async (e, livroNome, capituloNum) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessando(true);
    setUploadProgress(0);

    try {
      const fileName = `${livroNome.toLowerCase().replace(/\s/g, '_')}_cap${capituloNum}.mp3`;
      
      const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/audios-biblia/${fileName}`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: file
      });

      setUploadProgress(50);

      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/audios-biblia/${fileName}`;

      const audio = new Audio();
      audio.src = URL.createObjectURL(file);
      
      await new Promise((resolve) => {
        audio.onloadedmetadata = () => resolve();
      });

      const duracaoAudio = audio.duration;

      setUploadProgress(75);

      await fetch(`${SUPABASE_URL}/rest/v1/capitulos?livro_id=eq.${livroSelecionado.id}&numero=eq.${capituloNum}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          audio_url: publicUrl,
          audio_duracao_segundos: Math.round(duracaoAudio),
          audio_tamanho_bytes: file.size
        })
      });

      setUploadProgress(100);
      alert('✅ Áudio enviado e configurado com sucesso!');
      
      await carregarCapitulos(livroSelecionado.id);

    } catch (error) {
      console.error('Erro no upload:', error);
      alert('❌ Erro ao enviar áudio: ' + error.message);
    } finally {
      setProcessando(false);
      setUploadProgress(0);
    }
  };

  const handleImportarVersiculos = async (e, capituloId) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessando(true);

    try {
      const texto = await file.text();
      const linhas = texto.split('\n').filter(l => l.trim());
      
      const versiculosParaInserir = linhas.map((linha) => {
        const match = linha.match(/^(\d+)\.\s*(.+)$/);
        if (match) {
          return {
            capitulo_id: capituloId,
            numero: parseInt(match[1]),
            texto: match[2].trim(),
            tempo_inicio: null,
            tempo_fim: null
          };
        }
        return null;
      }).filter(v => v !== null);

      await fetch(`${SUPABASE_URL}/rest/v1/versiculos`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(versiculosParaInserir)
      });

      alert(`✅ ${versiculosParaInserir.length} versículos importados!`);
      
    } catch (error) {
      console.error('Erro ao importar:', error);
      alert('❌ Erro ao importar versículos: ' + error.message);
    } finally {
      setProcessando(false);
    }
  };

  const calcularTimestampsAutomaticos = async (capituloId) => {
    if (!confirm('Isso vai calcular os timestamps automaticamente. Deseja continuar?')) {
      return;
    }
    
    setProcessando(true);

    try {
      // Buscar capítulo
      const capRes = await fetch(`${SUPABASE_URL}/rest/v1/capitulos?select=audio_duracao_segundos&id=eq.${capituloId}`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });
      
      if (!capRes.ok) {
        throw new Error('Erro ao buscar capítulo');
      }
      
      const cap = await capRes.json();

      // Buscar versículos
      const versRes = await fetch(`${SUPABASE_URL}/rest/v1/versiculos?select=id,numero&capitulo_id=eq.${capituloId}&order=numero`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });
      
      if (!versRes.ok) {
        throw new Error('Erro ao buscar versículos');
      }
      
      const vers = await versRes.json();

      if (!cap[0] || !vers || vers.length === 0) {
        throw new Error('Capítulo sem áudio ou sem versículos');
      }

      const duracaoTotal = cap[0].audio_duracao_segundos;
      
      if (!duracaoTotal || duracaoTotal <= 0) {
        throw new Error('Duração do áudio inválida. Faça upload do áudio primeiro.');
      }
      
      const tempoPorVersiculo = duracaoTotal / vers.length;

      console.log(`Calculando timestamps: ${vers.length} versículos, ${duracaoTotal}s total, ${tempoPorVersiculo.toFixed(2)}s por versículo`);

      // Atualizar timestamps - um por vez para garantir que salve
      let sucessos = 0;
      for (let i = 0; i < vers.length; i++) {
        const v = vers[i];
        const tempoInicio = (tempoPorVersiculo * i);
        const tempoFim = (tempoPorVersiculo * (i + 1));
        
        const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/versiculos?id=eq.${v.id}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            tempo_inicio: parseFloat(tempoInicio.toFixed(2)),
            tempo_fim: parseFloat(tempoFim.toFixed(2))
          })
        });
        
        if (updateRes.ok) {
          sucessos++;
          console.log(`Versículo ${v.numero}: ${tempoInicio.toFixed(2)}s - ${tempoFim.toFixed(2)}s ✓`);
        } else {
          const error = await updateRes.text();
          console.error(`Erro ao atualizar versículo ${v.numero}:`, error);
        }
      }

      if (sucessos === vers.length) {
        alert(`✅ Timestamps calculados com sucesso!\n\n${sucessos} versículos atualizados\nCada versículo tem ~${tempoPorVersiculo.toFixed(1)} segundos`);
      } else {
        alert(`⚠️ Parcialmente concluído: ${sucessos}/${vers.length} versículos atualizados.\n\nVerifique o console para mais detalhes.`);
      }
      
    } catch (error) {
      console.error('Erro ao calcular timestamps:', error);
      alert('❌ Erro: ' + error.message + '\n\nVerifique:\n1. Se o áudio foi enviado\n2. Se os versículos foram importados\n3. As credenciais do Supabase');
    } finally {
      setProcessando(false);
    }
  };

  // =====================================================
  // RENDERIZAÇÃO - TELA DE LOGIN
  // =====================================================
  if (tela === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <Book className="w-16 h-16 text-amber-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-amber-900">Bíblia Ave Maria</h1>
            <p className="text-amber-600 mt-2">Versão com Áudio</p>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            setErro(null);
            const formData = new FormData(e.target);
            const email = formData.get('email');
            const senha = formData.get('senha');
            handleLogin(email, senha);
          }}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  placeholder="seu@email.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
                <input
                  type="password"
                  name="senha"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={carregando}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {carregando ? 'Entrando...' : 'Entrar'}
              </button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-amber-50 rounded-lg text-sm">
            <p className="font-semibold text-amber-900 mb-2">🔑 Credenciais de teste:</p>
            <p className="text-amber-700">Admin: admin@biblia.com / admin123</p>
            <p className="text-amber-700">Usuário: qualquer email e senha</p>
          </div>

          {erro && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {erro}
            </div>
          )}
        </div>
      </div>
    );
  }

  // =====================================================
  // MENU ADMINISTRATIVO
  // =====================================================
  if (tela === 'menu' && isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-amber-900">Painel Administrativo</h1>
              <p className="text-amber-600">Olá, {usuario?.nome}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => {
                setTela('livros');
                carregarLivros();
              }}
              className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
            >
              <Book className="w-12 h-12 text-amber-600 mb-4" />
              <h2 className="text-xl font-bold text-amber-900 mb-2">Visualizar Bíblia</h2>
              <p className="text-gray-600">Ler e ouvir os capítulos</p>
            </button>

            <button
              onClick={() => setTela('admin-upload')}
              className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
            >
              <Upload className="w-12 h-12 text-green-600 mb-4" />
              <h2 className="text-xl font-bold text-amber-900 mb-2">Gerenciar Conteúdo</h2>
              <p className="text-gray-600">Upload de áudios e textos</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // PAINEL DE UPLOAD (ADMIN)
  // =====================================================
  if (tela === 'admin-upload' && isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="max-w-4xl mx-auto p-6">
          <button
            onClick={() => setTela('menu')}
            className="flex items-center gap-2 text-amber-700 hover:text-amber-900 mb-6"
          >
            <ChevronLeft className="w-5 h-5" />
            Voltar ao menu
          </button>

          <h1 className="text-2xl font-bold text-amber-900 mb-6">Gerenciar Conteúdo</h1>

          {!livroSelecionado && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800 font-semibold mb-2">📖 Como usar:</p>
              <ol className="list-decimal ml-5 text-sm text-blue-700 space-y-1">
                <li>Selecione um livro abaixo</li>
                <li>Faça upload do áudio MP3 para cada capítulo</li>
                <li>Importe os versículos em formato TXT (formato: "1. Texto do versículo")</li>
                <li>Clique em "Auto Timestamps" para calcular automaticamente a sincronização</li>
              </ol>
            </div>
          )}

          {carregando ? (
            <div className="text-center text-amber-700">Carregando...</div>
          ) : (
            <div className="space-y-6">
              {livros.slice(0, 3).map(livro => (
                <div key={livro.id} className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-amber-900 mb-4">{livro.nome}</h2>
                  
                  <button
                    onClick={async () => {
                      setLivroSelecionado(livro);
                      await carregarCapitulos(livro.id);
                    }}
                    className={`text-sm px-4 py-2 rounded-lg transition-colors ${
                      livroSelecionado?.id === livro.id 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                    }`}
                  >
                    {livroSelecionado?.id === livro.id ? '✓ Selecionado' : 'Selecionar'}
                  </button>

                  {livroSelecionado?.id === livro.id && capitulos.length > 0 && (
                    <div className="mt-4 grid gap-3">
                      {capitulos.slice(0, 5).map(cap => (
                        <div key={cap.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold">Capítulo {cap.numero}</span>
                            <span className={`text-xs px-2 py-1 rounded ${cap.audio_url ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                              {cap.audio_url ? '✓ Áudio OK' : 'Sem áudio'}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 mt-2">
                            <label className="cursor-pointer">
                              <div className="bg-blue-100 text-blue-700 px-3 py-2 rounded text-xs text-center hover:bg-blue-200">
                                📁 Áudio
                              </div>
                              <input
                                type="file"
                                accept="audio/*"
                                className="hidden"
                                onChange={(e) => handleUploadAudio(e, livro.nome, cap.numero)}
                                disabled={processando}
                              />
                            </label>

                            <label className="cursor-pointer">
                              <div className="bg-purple-100 text-purple-700 px-3 py-2 rounded text-xs text-center hover:bg-purple-200">
                                📝 Texto
                              </div>
                              <input
                                type="file"
                                accept=".txt"
                                className="hidden"
                                onChange={(e) => handleImportarVersiculos(e, cap.id)}
                                disabled={processando}
                              />
                            </label>

                            {cap.audio_url && (
                              <button
                                onClick={() => calcularTimestampsAutomaticos(cap.id)}
                                className="bg-green-100 text-green-700 px-3 py-2 rounded text-xs hover:bg-green-200"
                                disabled={processando}
                              >
                                ⏱️ Sync
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {processando && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                <p className="text-center font-semibold mb-4">Processando...</p>
                {uploadProgress > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-amber-600 h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =====================================================
  // TELA: Lista de Livros
  // =====================================================
  if (tela === 'livros') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="max-w-2xl mx-auto p-6">
          <div className="flex justify-between items-center mb-8">
            <div className="text-center flex-1">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Book className="w-10 h-10 text-amber-700" />
                <h1 className="text-3xl font-bold text-amber-900">Bíblia Ave Maria</h1>
              </div>
              <p className="text-amber-700">Versão Católica com Áudio</p>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 text-sm"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>

          {isAdmin && (
            <button
              onClick={() => setTela('menu')}
              className="w-full mb-4 bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200 flex items-center justify-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Painel Administrativo
            </button>
          )}

          <div className="space-y-6">
            {livros.filter(l => l.testamento === 'AT').length > 0 && (
              <>
                <h2 className="text-xl font-semibold text-amber-800">Antigo Testamento</h2>
                <div className="space-y-3">
                  {livros.filter(l => l.testamento === 'AT').map(livro => (
                    <button
                      key={livro.id}
                      onClick={async () => {
                        setLivroSelecionado(livro);
                        await carregarCapitulos(livro.id);
                        setTela('capitulos');
                      }}
                      className="w-full bg-white hover:bg-amber-50 p-4 rounded-xl shadow-sm border border-amber-100 transition-all hover:shadow-md text-left"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-amber-900">{livro.nome}</span>
                        <span className="text-sm text-amber-600">{livro.total_capitulos} cap.</span>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {livros.filter(l => l.testamento === 'NT').length > 0 && (
              <>
                <h2 className="text-xl font-semibold text-amber-800 mt-8">Novo Testamento</h2>
                <div className="space-y-3">
                  {livros.filter(l => l.testamento === 'NT').map(livro => (
                    <button
                      key={livro.id}
                      onClick={async () => {
                        setLivroSelecionado(livro);
                        await carregarCapitulos(livro.id);
                        setTela('capitulos');
                      }}
                      className="w-full bg-white hover:bg-amber-50 p-4 rounded-xl shadow-sm border border-amber-100 transition-all hover:shadow-md text-left"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-amber-900">{livro.nome}</span>
                        <span className="text-sm text-amber-600">{livro.total_capitulos} cap.</span>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // TELA: Lista de Capítulos
  // =====================================================
  if (tela === 'capitulos' && livroSelecionado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="max-w-2xl mx-auto p-6">
          <button
            onClick={() => setTela('livros')}
            className="flex items-center gap-2 text-amber-700 hover:text-amber-900 mb-6"
          >
            <ChevronLeft className="w-5 h-5" />
            Voltar aos livros
          </button>

          <h1 className="text-2xl font-bold text-amber-900 mb-6">{livroSelecionado.nome}</h1>

          {carregando ? (
            <div className="text-center text-amber-700">Carregando capítulos...</div>
          ) : capitulos.length === 0 ? (
            <div className="text-center text-amber-700">Nenhum capítulo encontrado.</div>
          ) : (
            <div className="grid grid-cols-5 gap-3">
              {capitulos.map(cap => (
                <button
                  key={cap.id}
                  onClick={async () => {
                    await carregarCapitulo(cap.id);
                    setTela('player');
                  }}
                  className={`p-4 rounded-lg shadow-sm border transition-all font-semibold ${
                    cap.audio_url
                      ? 'bg-white hover:bg-amber-100 border-amber-100 hover:shadow-md text-amber-900'
                      : 'bg-gray-100 border-gray-200 text-gray-500'
                  }`}
                  title={cap.audio_url ? 'Áudio disponível' : 'Sem áudio ainda'}
                >
                  {cap.numero}
                  {cap.audio_url && <span className="ml-1 text-green-600">🎵</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // =====================================================
  // TELA: Player
  // =====================================================
  if (tela === 'player' && capituloAtual) {
    const livroNome = capituloAtual.livros?.nome || capituloAtual.livros?.[0]?.nome || 'Carregando...';
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="max-w-4xl mx-auto p-6">
          <button
            onClick={() => setTela('capitulos')}
            className="flex items-center gap-2 text-amber-700 hover:text-amber-900 mb-6"
          >
            <ChevronLeft className="w-5 h-5" />
            Voltar aos capítulos
          </button>

          <div className="bg-white rounded-t-2xl p-6 shadow-lg border-b border-amber-100">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-amber-900">
                {livroNome} - Capítulo {capituloAtual.numero}
              </h1>
              
              {capituloAtual.audio_url && (
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-amber-600" />
                  <select
                    value={velocidade}
                    onChange={(e) => handleVelocidade(parseFloat(e.target.value))}
                    className="bg-amber-50 border border-amber-200 rounded px-2 py-1 text-sm text-amber-900"
                  >
                    <option value="0.75">0.75x</option>
                    <option value="1.0">1.0x</option>
                    <option value="1.25">1.25x</option>
                    <option value="1.5">1.5x</option>
                    <option value="2.0">2.0x</option>
                  </select>
                </div>
              )}
            </div>
            
            {versiculos.length > 0 && (
              <p className="text-sm text-amber-600 mt-2">
                {versiculos.length} versículos
              </p>
            )}
          </div>

          <div 
            ref={versiculosContainerRef}
            className="bg-white p-6 max-h-96 overflow-y-auto"
          >
            {carregando ? (
              <div className="text-center text-amber-700">Carregando versículos...</div>
            ) : versiculos.length === 0 ? (
              <div className="text-center text-amber-700">
                Nenhum versículo encontrado. Execute o SQL de importação!
              </div>
            ) : (
              versiculos.map((versiculo, index) => (
                <p
                  key={versiculo.id}
                  id={`versiculo-${index}`}
                  className={`mb-4 text-lg leading-relaxed transition-all duration-300 ${
                    index === versiculoAtivo
                      ? 'bg-amber-100 -mx-4 px-4 py-2 rounded-lg font-medium text-amber-900 scale-[1.01]'
                      : 'text-gray-700'
                  }`}
                >
                  <sup className="font-bold text-amber-600 mr-2">{versiculo.numero}</sup>
                  {versiculo.texto}
                </p>
              ))
            )}
          </div>

          <div className="bg-white rounded-b-2xl p-6 shadow-lg">
            {!capituloAtual.audio_url ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <p className="text-yellow-800 font-semibold mb-2">⚠️ Áudio não disponível</p>
                <p className="text-sm text-yellow-700">
                  Faça upload do áudio no painel administrativo.
                </p>
              </div>
            ) : (
              <>
                <audio
                  ref={audioRef}
                  src={capituloAtual.audio_url}
                  onTimeUpdate={handleTimeUpdate}
                  onPlay={() => setTocando(true)}
                  onPause={() => setTocando(false)}
                  onEnded={() => setTocando(false)}
                  onLoadedMetadata={(e) => {
                    e.target.playbackRate = velocidade;
                  }}
                  onError={(e) => {
                    console.error('Erro no áudio:', e);
                    setErro('❌ Erro ao carregar áudio.');
                  }}
                />

                {erro && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
                    {erro}
                  </div>
                )}

                <div className="mb-6">
                  <div
                    onClick={handleSeek}
                    className="h-2 bg-amber-200 rounded-full cursor-pointer overflow-hidden"
                  >
                    <div
                      className="h-full bg-amber-600 transition-all"
                      style={{ width: `${(tempoAtual / duracao) * 100 || 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-amber-700 mt-2">
                    <span>{formatTime(tempoAtual)}</span>
                    <span className="text-xs text-amber-600">
                      Versículo {versiculoAtivo + 1} de {versiculos.length}
                    </span>
                    <span>{formatTime(duracao)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-8">
                  <button 
                    className="p-3 hover:bg-amber-100 rounded-full transition-colors"
                    onClick={() => audioRef.current && (audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10))}
                    title="Voltar 10 segundos"
                  >
                    <SkipBack className="w-6 h-6 text-amber-700" />
                  </button>

                  <button
                    onClick={handlePlayPause}
                    className="p-5 bg-amber-600 hover:bg-amber-700 rounded-full transition-colors shadow-lg"
                    title={tocando ? 'Pausar' : 'Reproduzir'}
                  >
                    {tocando ? (
                      <Pause className="w-8 h-8 text-white" fill="white" />
                    ) : (
                      <Play className="w-8 h-8 text-white" fill="white" />
                    )}
                  </button>

                  <button 
                    className="p-3 hover:bg-amber-100 rounded-full transition-colors"
                    onClick={() => audioRef.current && (audioRef.current.currentTime = Math.min(duracao, audioRef.current.currentTime + 10))}
                    title="Avançar 10 segundos"
                  >
                    <SkipForward className="w-6 h-6 text-amber-700" />
                  </button>
                </div>

                <div className="mt-4 text-center text-xs text-amber-600">
                  <p>Velocidade: {velocidade}x | {capituloAtual.audio_tamanho_bytes ? `${(capituloAtual.audio_tamanho_bytes / 1024 / 1024).toFixed(1)} MB` : ''}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}