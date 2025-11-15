import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Book, ChevronLeft, ChevronDown, Settings, Upload, LogOut } from 'lucide-react';

// Importar componentes dos planos de leitura
import PlanosLeitura from './components/PlanosLeitura';
import ChecklistLeitura from './components/ChecklistLeitura';
import ProgressoLeitura from './components/ProgressoLeitura';


// =====================================================
// CONFIGURAÇÃO DO SUPABASE (usando fetch direto)
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
          await fetch(url, {
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
          await fetch(url, {
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
      await fetch(url, {
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
        await fetch(url, {
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
  const [delaySync, setDelaySync] = useState(0);
  
  // Estado para controlar se o capítulo atual está marcado como lido
  const [capituloLido, setCapituloLido] = useState(false);
  const [mensagem, setMensagem] = useState('');
  
  // Estado de busca e acordeões para lista de livros (mobile-friendly)
  const [filtroLivro, setFiltroLivro] = useState('');
  const [mostrarAT, setMostrarAT] = useState(false);
  const [mostrarNT, setMostrarNT] = useState(false);
  
  // Estado para o plano ativo do usuário
  const [planoAtivo, setPlanoAtivo] = useState(null);
  
  // Admin states
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processando, setProcessando] = useState(false);
  const [capituloFocado, setCapituloFocado] = useState(null);
  const [livroAbertoId, setLivroAbertoId] = useState(null);
  
  const audioRef = useRef(null);
  const versiculosContainerRef = useRef(null);
  const capituloFocoRef = useRef(null);
  const tempoAtualRef = useRef(0);
  const rafIdRef = useRef(null);
  const lastUiUpdateRef = useRef(0);
  const startsRef = useRef([]);

  useEffect(() => {
    if (capituloFocado && capituloFocoRef.current) {
      try {
        capituloFocoRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch (_) {
        // Ignorar falhas de scroll em ambientes sem DOM
      }
    }
  }, [capituloFocado]);

  useEffect(() => {
    if (versiculos && versiculos.length > 0) {
      startsRef.current = versiculos.map(v => parseFloat(v.tempo_inicio) || 0);
    } else {
      startsRef.current = [];
    }
  }, [versiculos]);

  useEffect(() => {
    if (capituloAtual && capituloAtual.id) {
      localStorage.setItem(`delaySync:${capituloAtual.id}`, String(delaySync));
    }
  }, [capituloAtual, delaySync]);

  useEffect(() => {
    if (versiculos && versiculos.length > 0) {
      startsRef.current = versiculos.map(v => parseFloat(v.tempo_inicio) || 0);
    } else {
      startsRef.current = [];
    }
  }, [versiculos]);

// =====================================================
// AUTENTICAÇÃO COM TABELA DE USUÁRIOS (SUPABASE)
// =====================================================
const handleLogin = async (email, senha) => {
  setErro(null);
  setCarregando(true);
  
  try {
    // 1. Buscar o usuário na tabela 'usuarios_app'
    // ATENÇÃO: A busca por senha em texto simples é insegura.
    // Em produção, use a autenticação nativa do Supabase (auth.signInWithPassword)
    // ou uma coluna de hash de senha (ex: bcrypt) no seu backend.
    // O objeto 'supabase' customizado só suporta um '.eq()', então vamos usar o filtro
    // de URL diretamente, que o .eq() deve estar gerando nos bastidores.
    // No entanto, como o .eq() customizado só aceita um par, vamos usar a função execute
    // para buscar todos os usuários com o email e depois filtrar a senha localmente
    // ou modificar a implementação do .eq() para aceitar mais de um filtro.
    
    // Opção 1: Modificar a chamada para usar o filtro de URL diretamente,
    // se o objeto 'supabase' customizado suportar a sintaxe de filtro de URL.
    // Pela implementação, o .eq() customizado só aceita um par de coluna/valor.
    
    // Opção 2: Usar a chamada `fetch` diretamente para construir a URL com múltiplos filtros.
    // A implementação customizada do `supabase` não permite múltiplos `.eq()`.
    // Vamos usar a função `execute` com um filtro, e adicionar o segundo filtro manualmente na URL.
    
    // Revertendo para a busca por email e filtrando a senha localmente,
    // ou, melhor, ajustando para usar a sintaxe de filtro de URL que o Supabase REST API suporta.
    
    // A implementação customizada do `supabase` é muito limitada.
    // O método `select` não retorna um objeto que permita encadear múltiplos `.eq()`.
    // A única forma de resolver isso sem reescrever todo o objeto `supabase` customizado
    // é buscar por um filtro e depois filtrar localmente, ou usar a sintaxe de filtro de URL
    // diretamente na chamada `fetch` (que é o que o objeto customizado faz).
    
    // Vamos tentar buscar por email e senha, mas usando a implementação customizada
    // que só permite um filtro. O erro é na segunda chamada `.eq()`.
    // A implementação do `supabase` customizado é:
    // .eq(column, value) => ({ order, single })
    // O objeto retornado não tem `.eq()` novamente.
    
    // A solução mais limpa é buscar por email e depois verificar a senha localmente.
    // Isso é menos eficiente, mas funciona com a implementação customizada limitada.
    // Alternativamente, podemos usar a função `execute` e construir a URL manualmente
    // para incluir os dois filtros, mas a função `execute` customizada não é exposta
    // diretamente após o `.eq()` sem `.order()`.
    
    // Vamos usar a função `single` no email, e depois verificar a senha.
    const { data: usuarioData, error: usuarioError } = await supabase
      .from('usuarios_app')
      .select('*')
      .eq('email', email)
      .single();
      
    if (usuarioError || !usuarioData || usuarioData.senha !== senha) {
      setErro('Credenciais inválidas ou usuário não encontrado.');
      return;
    }
    // Se a senha for verificada localmente, o restante do código é o mesmo.
    
    // O código original era:
    /*
    const { data: usuarioData, error: usuarioError } = await supabase
      .from('usuarios_app')
      .select('*')
      .eq('email', email)
      .eq('senha', senha) 
      .single();
      
    if (usuarioError || !usuarioData) {
      setErro('Credenciais inválidas ou usuário não encontrado.');
      return;
    }
    */
      
    if (usuarioError || !usuarioData) {
      setErro('Credenciais inválidas ou usuário não encontrado.');
      return;
    }
    
    // 2. Definir o estado do usuário e o nível de acesso
    const isAdminUser = usuarioData.role === 'admin';
    
    setUsuario({ email: usuarioData.email, nome: usuarioData.nome || 'Usuário' });
    setIsAdmin(isAdminUser);
    await carregarLivros();
    
    // 3. Carregar plano ativo do usuário
    try {
      const planosService = await import('./services/planosLeituraService');
      const plano = await planosService.obterPlanoAtivo(usuarioData.email);
      setPlanoAtivo(plano);
    } catch (error) {
      console.error('Erro ao carregar plano ativo:', error);
    }
    
    // 4. Redirecionar com base no nível de acesso
    if (isAdminUser) {
      setTela('menu'); // Tela de administração
    } else {
      setTela('livros'); // Tela padrão para usuários
    }
    
  } catch (error) {
    console.error('Erro no login:', error);
    setErro('Erro ao fazer login. Verifique suas credenciais e conexão com o Supabase.');
  } finally {
    setCarregando(false);
  }
};

  const handleLogout = () => {
    setUsuario(null);
    setIsAdmin(false);
    setPlanoAtivo(null);
    setTela('login');
  };

  // =====================================================
  // SINCRONIZAÇÃO MELHORADA COM AUTO-SCROLL E DELAY
  // =====================================================
  useEffect(() => {
    const binarySearchIndex = (t) => {
      const n = startsRef.current.length;
      if (n === 0 || !duracao) return 0;
      let lo = 0, hi = n - 1, ans = 0;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (t >= startsRef.current[mid]) {
          ans = mid;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }
      const nextStart = ans < n - 1 ? startsRef.current[ans + 1] : duracao;
      if (t >= nextStart) return Math.min(ans + 1, n - 1);
      return ans;
    };

    const tick = (ts) => {
      if (!audioRef.current) return;
      const now = audioRef.current.currentTime || 0;
      tempoAtualRef.current = now;
      const tAdj = now + delaySync;
      let idx;
      if (startsRef.current.length > 0) {
        idx = binarySearchIndex(tAdj);
      } else if (duracao > 0 && versiculos.length > 0) {
        const p = tAdj / duracao;
        idx = Math.max(0, Math.min(versiculos.length - 1, Math.floor(p * versiculos.length)));
      } else {
        idx = 0;
      }
      if (idx !== versiculoAtivo) {
        setVersiculoAtivo(idx);
        setTimeout(() => {
          const el = document.getElementById(`versiculo-${idx}`);
          if (el && versiculosContainerRef.current) {
            const c = versiculosContainerRef.current;
            const er = el.getBoundingClientRect();
            const cr = c.getBoundingClientRect();
            const st = c.scrollTop;
            const offset = er.top - cr.top + st - 20;
            c.scrollTo({ top: offset, behavior: 'smooth' });
          }
        }, 50);
      }
      const nowMs = performance.now();
      if (nowMs - lastUiUpdateRef.current > 66) {
        setTempoAtual(now);
        lastUiUpdateRef.current = nowMs;
      }
      rafIdRef.current = requestAnimationFrame(tick);
    };

    if (tocando) {
      lastUiUpdateRef.current = performance.now();
      rafIdRef.current = requestAnimationFrame(tick);
      return () => {
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      };
    } else {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    }
  }, [tocando, delaySync, versiculos, duracao, versiculoAtivo]);

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
      const saved = localStorage.getItem(`delaySync:${capituloId}`);
      setDelaySync(saved ? parseFloat(saved) || 0 : 0);

      // Verificar acessibilidade do áudio (HEAD) para evitar erros silenciosos
      if (capData[0]?.audio_url) {
        try {
          const headRes = await fetch(capData[0].audio_url, { method: 'HEAD' });
          if (!headRes.ok) {
            console.warn('Áudio não acessível no Storage:', headRes.status, headRes.statusText);
            setErro('⚠️ Áudio não acessível no Storage. Verifique se o arquivo existe e se o bucket "audios-biblia" está público.');
          }
        } catch (headErr) {
          console.error('Erro ao verificar acessibilidade do áudio:', headErr);
          setErro('❌ Erro ao acessar o áudio. Verifique a URL e a configuração do Storage público.');
        }
      }
      
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
  // FUNÇÕES PARA MARCAR CAPÍTULO COMO LIDO
  // =====================================================
  
  // Função para marcar capítulo como lido no player
  const handleMarcarCapituloLidoPlayer = async () => {
    if (!capituloAtual || !usuario || !planoAtivo) {
      setErro('É necessário ter um plano ativo para marcar capítulos como lidos.');
      setTimeout(() => setErro(''), 3000);
      return;
    }
    
    try {
      setCarregando(true);
      
      // Importar o serviço dinamicamente se necessário
      const planosService = await import('./services/planosLeituraService');
      
      if (!capituloLido) {
        // Marcar como lido
        await planosService.marcarCapituloLido(
          planoAtivo.id, // Usando o ID do plano ativo
          capituloAtual.livro_id,
          capituloAtual.numero,
          true
        );
        setMensagem('✅ Capítulo marcado como lido!');
      } else {
        // Desmarcar
        await planosService.desmarcarCapituloLido(
          planoAtivo.id, // Usando o ID do plano ativo
          capituloAtual.livro_id,
          capituloAtual.numero
        );
        setMensagem('📖 Capítulo desmarcado.');
      }
      
      // Verificar o status real do capítulo após a operação
      await verificarCapituloLido();
      
      // Limpar mensagem após 3 segundos
      setTimeout(() => setMensagem(''), 3000);
      
    } catch (error) {
      console.error('Erro ao marcar capítulo:', error);
      setErro('Erro ao marcar capítulo como lido.');
      setTimeout(() => setErro(''), 3000);
    } finally {
      setCarregando(false);
    }
  };

  // Função para verificar se o capítulo atual está lido
  const verificarCapituloLido = React.useCallback(async () => {
    if (!capituloAtual || !usuario || !planoAtivo) return;

    try {
      const planosService = await import('./services/planosLeituraService');
      const capitulosLidos = await planosService.obterCapitulosLidos(planoAtivo.id);

      // Procurar o capítulo atual nos capítulos lidos
      const capituloLido = capitulosLidos.find(cap =>
        cap.livro_id === capituloAtual.livro_id &&
        cap.capitulo_numero === capituloAtual.numero &&
        cap.lido === true
      );

      setCapituloLido(!!capituloLido);
    } catch (error) {
      console.error('Erro ao verificar status do capítulo:', error);
    }
  }, [capituloAtual, usuario, planoAtivo]);

  // Verificar status do capítulo quando ele mudar
  useEffect(() => {
    if (capituloAtual && usuario && planoAtivo && tela === 'player') {
      verificarCapituloLido();
    }
  }, [capituloAtual, usuario, planoAtivo, tela, verificarCapituloLido]);

  // Função para navegar para o capítulo anterior
  const handleCapituloAnterior = async () => {
    if (!capituloAtual || !livroSelecionado) return;
    
    try {
      setCarregando(true);
      
      // Encontrar o capítulo anterior no livro atual
      const capituloAtualIndex = capitulos.findIndex(cap => cap.id === capituloAtual.id);
      
      if (capituloAtualIndex > 0) {
        // Há capítulo anterior no mesmo livro
        const capituloAnterior = capitulos[capituloAtualIndex - 1];
        await carregarCapitulo(capituloAnterior.id);
        setMensagem(`📖 Navegando para Capítulo ${capituloAnterior.numero}`);
      } else {
        // Primeiro capítulo do livro, tentar ir para o livro anterior
        const livroAtualIndex = livros.findIndex(l => l.id === livroSelecionado.id);
        
        if (livroAtualIndex > 0) {
          const livroAnterior = livros[livroAtualIndex - 1];
          setLivroSelecionado(livroAnterior);
          
          // Carregar capítulos do livro anterior
          await carregarCapitulos(livroAnterior.id);
          
          // Aguardar um pouco para garantir que os capítulos foram carregados
          setTimeout(async () => {
            // Carregar o último capítulo do livro anterior
            const response = await fetch(`${SUPABASE_URL}/rest/v1/capitulos?livro_id=eq.${livroAnterior.id}&select=*,livros(nome)&order=numero.desc&limit=1`, {
              headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
              }
            });
            
            if (response.ok) {
              const [ultimoCapitulo] = await response.json();
              if (ultimoCapitulo) {
                await carregarCapitulo(ultimoCapitulo.id);
                setMensagem(`📖 Navegando para ${livroAnterior.nome} - Capítulo ${ultimoCapitulo.numero}`);
              }
            }
          }, 500);
        } else {
          // Primeiro capítulo da Bíblia
          setMensagem('📖 Você já está no início da Bíblia!');
        }
      }
      
      // Limpar mensagem após 3 segundos
      setTimeout(() => setMensagem(''), 3000);
      
    } catch (error) {
      console.error('Erro ao navegar para capítulo anterior:', error);
      setErro('Erro ao navegar para o capítulo anterior.');
      setTimeout(() => setErro(''), 3000);
    } finally {
      setCarregando(false);
    }
  };

  // Função para navegar para o próximo capítulo
  const handleProximoCapitulo = async () => {
    if (!capituloAtual || !livroSelecionado) return;
    
    try {
      setCarregando(true);
      
      // Encontrar o próximo capítulo no livro atual
      const capituloAtualIndex = capitulos.findIndex(cap => cap.id === capituloAtual.id);
      
      if (capituloAtualIndex < capitulos.length - 1) {
        // Há próximo capítulo no mesmo livro
        const proximoCapitulo = capitulos[capituloAtualIndex + 1];
        await carregarCapitulo(proximoCapitulo.id);
        setMensagem(`📖 Navegando para Capítulo ${proximoCapitulo.numero}`);
      } else {
        // Último capítulo do livro, tentar ir para o próximo livro
        const livroAtualIndex = livros.findIndex(l => l.id === livroSelecionado.id);
        
        if (livroAtualIndex < livros.length - 1) {
          const proximoLivro = livros[livroAtualIndex + 1];
          setLivroSelecionado(proximoLivro);
          
          // Carregar capítulos do próximo livro
          await carregarCapitulos(proximoLivro.id);
          
          // Aguardar um pouco para garantir que os capítulos foram carregados
          setTimeout(async () => {
            // Carregar o primeiro capítulo do próximo livro
            const response = await fetch(`${SUPABASE_URL}/rest/v1/capitulos?livro_id=eq.${proximoLivro.id}&numero=eq.1&select=*,livros(nome)`, {
              headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
              }
            });
            
            if (response.ok) {
              const [primeiroCapitulo] = await response.json();
              if (primeiroCapitulo) {
                await carregarCapitulo(primeiroCapitulo.id);
                setMensagem(`📖 Navegando para ${proximoLivro.nome} - Capítulo 1`);
              }
            }
          }, 500);
        } else {
          // Último capítulo da Bíblia
          setMensagem('🎉 Parabéns! Você chegou ao final da Bíblia!');
        }
      }
      
      // Limpar mensagem após 3 segundos
      setTimeout(() => setMensagem(''), 3000);
      
    } catch (error) {
      console.error('Erro ao navegar para próximo capítulo:', error);
      setErro('Erro ao navegar para o próximo capítulo.');
      setTimeout(() => setErro(''), 3000);
    } finally {
      setCarregando(false);
    }
  };

  // Carregar plano ativo quando necessário
  useEffect(() => {
    const carregarPlanoAtivo = async () => {
      if (usuario && !planoAtivo) {
        try {
          const planosService = await import('./services/planosLeituraService');
          const plano = await planosService.obterPlanoAtivo(usuario.email);
          if (plano) {
            setPlanoAtivo(plano);
            console.log('Plano ativo carregado:', plano);
          }
        } catch (error) {
          console.error('Erro ao carregar plano ativo:', error);
        }
      }
    };

    carregarPlanoAtivo();
  }, [usuario, planoAtivo]);

  // =====================================================
  // FUNÇÕES ADMINISTRATIVAS
  // =====================================================
  const handleUploadAudio = async (e, livroNome, capituloNum) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessando(true);
    setUploadProgress(0);

    try {
      // Normalizar nome do arquivo - remover acentos e espaços
      const nomeLivroNormalizado = livroNome
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .toLowerCase()
        .replace(/\s+/g, '_') // Substitui espaços por underline
        .replace(/[^a-z0-9_]/g, ''); // Remove caracteres especiais
      
      const fileName = `${nomeLivroNormalizado}_cap${capituloNum}.mp3`;
      
      console.log('Enviando arquivo:', fileName);
      
      setUploadProgress(25);

      // Upload do áudio para Storage
      const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/audios-biblia/${fileName}`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': file.type || 'audio/mpeg',
          'x-upsert': 'true' // Permite substituir arquivo existente
        },
        body: file
      });

      if (!uploadRes.ok) {
        const errorText = await uploadRes.text();
        console.error('Erro no upload:', errorText);
        throw new Error(`Erro no upload: ${uploadRes.status} - ${errorText}`);
      }

      setUploadProgress(50);

      // URL pública do arquivo
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/audios-biblia/${fileName}`;
      
      console.log('Áudio enviado! URL:', publicUrl);

      // Detectar duração do áudio
      const audio = new Audio();
      audio.src = URL.createObjectURL(file);
      
      await new Promise((resolve, reject) => {
        audio.onloadedmetadata = () => resolve();
        audio.onerror = () => reject(new Error('Erro ao carregar metadados do áudio'));
        setTimeout(() => reject(new Error('Timeout ao carregar áudio')), 10000);
      });

      const duracaoAudio = Math.round(audio.duration);

      setUploadProgress(75);

      console.log('Duração detectada:', duracaoAudio, 'segundos');

      // Atualizar banco de dados
      const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/capitulos?livro_id=eq.${livroSelecionado.id}&numero=eq.${capituloNum}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          audio_url: publicUrl,
          audio_duracao_segundos: duracaoAudio,
          audio_tamanho_bytes: file.size
        })
      });

      if (!updateRes.ok) {
        const errorText = await updateRes.text();
        console.error('Erro ao atualizar banco:', errorText);
        throw new Error('Erro ao atualizar banco de dados');
      }

      setUploadProgress(100);
      
      console.log('✅ Áudio configurado com sucesso!');
      alert(`✅ Áudio enviado com sucesso!\n\nArquivo: ${fileName}\nDuração: ${duracaoAudio}s\nTamanho: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
      
      // Recarregar capítulos
      await carregarCapitulos(livroSelecionado.id);

      setTimeout(() => {
        try {
          const alvoCap = capitulos.find(c => c.numero === capituloNum);
          if (alvoCap) {
            const el = document.getElementById(`cap-${alvoCap.id}`);
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        } catch (_) {}
      }, 0);

    } catch (error) {
      console.error('Erro no upload:', error);
      alert(`❌ Erro ao enviar áudio: ${error.message}\n\nVerifique:\n1. Se o bucket "audios-biblia" existe\n2. Se é público\n3. Se as credenciais estão corretas`);
    } finally {
      setProcessando(false);
      setUploadProgress(0);
    }
  };

  const handleImportarVersiculos = async (e, capituloId) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessando(true);
    setCapituloFocado(capituloId);

    try {
      console.log('Iniciando importação de versículos para capítulo:', capituloId);
      
      const texto = await file.text();
      const linhas = texto.split('\n').filter(l => l.trim());
      
      console.log('Linhas encontradas no arquivo:', linhas.length);
      console.log('Primeiras 5 linhas do arquivo:', linhas.slice(0, 5));
      console.log('Últimas 5 linhas do arquivo:', linhas.slice(-5));
      console.log('Todas as linhas do arquivo:', linhas);
      
      const versiculosParaInserir = linhas.map((linha, index) => {
        // Limpar caracteres de quebra de linha (incluindo \r e \n)
        const linhaLimpa = linha.replace(/[\r\n]+$/, '').trim();
        
        // Suporte para diferentes formatos:
        // "1. Texto do versículo"
        // "1 Texto do versículo" 
        // "Versículo 1: Texto"
        const match = linhaLimpa.match(/^(\d+)[.:\s]+(.+)$/) || linhaLimpa.match(/^Versículo\s+(\d+)[:\s]+(.+)$/i);
        if (match) {
          const versiculo = {
            capitulo_id: parseInt(capituloId),
            numero: parseInt(match[1]),
            texto: match[2].trim(),
            tempo_inicio: null,
            tempo_fim: null
          };
          console.log(`Processando linha ${index + 1}: "${linhaLimpa}" -> Versículo ${versiculo.numero}`);
          return versiculo;
        } else if (linhaLimpa.trim()) {
          console.warn(`Linha ${index + 1} não reconhecida: "${linhaLimpa}"`);
        }
        return null;
      }).filter(v => v !== null);

      console.log('Versículos processados:', versiculosParaInserir.length);
      console.log('Detalhes dos versículos processados:', versiculosParaInserir);

      if (versiculosParaInserir.length === 0) {
        alert('❌ Nenhum versículo válido encontrado no arquivo.\n\nFormato esperado:\n1. Texto do versículo\n2. Outro versículo\n...');
        return;
      }

      // Primeiro, verificar se já existem versículos para este capítulo
      console.log('Verificando versículos existentes...');
      console.log('URL da requisição:', `${SUPABASE_URL}/rest/v1/versiculos?select=numero&capitulo_id=eq.${capituloId}`);
      console.log('Headers da requisição:', {
        'apikey': SUPABASE_KEY ? 'Configurado' : 'NÃO CONFIGURADO',
        'Authorization': SUPABASE_KEY ? 'Configurado' : 'NÃO CONFIGURADO'
      });
      
      const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/versiculos?select=numero&capitulo_id=eq.${capituloId}`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Status da resposta:', checkRes.status);
      console.log('Headers da resposta:', Object.fromEntries(checkRes.headers.entries()));

      if (checkRes.ok) {
        const existentes = await checkRes.json();
        console.log('Versículos existentes encontrados:', existentes.length);
        
        if (existentes.length > 0) {
          const confirmar = window.confirm(`⚠️ Já existem ${existentes.length} versículos neste capítulo.\n\nDeseja substituí-los pelos novos versículos?`);
          if (confirmar) {
            console.log('Deletando versículos existentes...');
            // Deletar versículos existentes
            const deleteRes = await fetch(`${SUPABASE_URL}/rest/v1/versiculos?capitulo_id=eq.${capituloId}`, {
              method: 'DELETE',
              headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'X-User-Email': usuario?.email || '',
                'X-User-Role': isAdmin ? 'admin' : 'user'
              }
            });
            
            console.log('Status da deleção:', deleteRes.status);
            
            if (!deleteRes.ok) {
              const errorText = await deleteRes.text();
              console.error('Erro ao deletar versículos existentes:', errorText);
              
              // Se for erro de RLS, tentar com uma abordagem diferente
              if (deleteRes.status === 403 || errorText.includes('RLS') || errorText.includes('policy')) {
                console.log('Erro de RLS detectado. Tentando deleção individual...');
                
                // Buscar todos os IDs dos versículos para deletar individualmente
                const versesToDeleteRes = await fetch(`${SUPABASE_URL}/rest/v1/versiculos?select=id&capitulo_id=eq.${capituloId}`, {
                  headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                  }
                });
                
                if (versesToDeleteRes.ok) {
                  const versesToDelete = await versesToDeleteRes.json();
                  console.log(`Tentando deletar ${versesToDelete.length} versículos individualmente...`);
                  
                  let deletedCount = 0;
                  for (const verse of versesToDelete) {
                    const individualDeleteRes = await fetch(`${SUPABASE_URL}/rest/v1/versiculos?id=eq.${verse.id}`, {
                      method: 'DELETE',
                      headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`,
                        'Content-Type': 'application/json',
                        'X-User-Email': usuario?.email || '',
                        'X-User-Role': isAdmin ? 'admin' : 'user'
                      }
                    });
                    
                    if (individualDeleteRes.ok) {
                      deletedCount++;
                    } else {
                      console.error(`Erro ao deletar versículo ${verse.id}:`, await individualDeleteRes.text());
                    }
                  }
                  
                  console.log(`Deletados ${deletedCount} de ${versesToDelete.length} versículos`);
                  
                  if (deletedCount === 0) {
                    throw new Error(`Não foi possível deletar nenhum versículo. Verifique as políticas RLS no Supabase.\n\nSugestão: Execute as políticas alternativas do arquivo supabase-rls-policies.sql`);
                  }
                } else {
                  throw new Error(`Erro ao deletar versículos existentes: ${deleteRes.status} - ${errorText}\n\nSugestão: Verifique as políticas RLS no Supabase`);
                }
              } else {
                throw new Error(`Erro ao deletar versículos existentes: ${deleteRes.status} - ${errorText}`);
              }
            }
            
            // Verificar se a deleção foi bem-sucedida
            const verifyDeleteRes = await fetch(`${SUPABASE_URL}/rest/v1/versiculos?select=numero&capitulo_id=eq.${capituloId}`, {
              headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
              }
            });
            
            if (verifyDeleteRes.ok) {
              const remainingVerses = await verifyDeleteRes.json();
              if (remainingVerses.length > 0) {
                console.error('Ainda existem versículos após deleção:', remainingVerses.length);
                throw new Error(`Falha na deleção: ainda existem ${remainingVerses.length} versículos no capítulo`);
              }
            }
            
            console.log('Versículos existentes removidos com sucesso');
          } else {
            console.log('Usuário cancelou a substituição');
            return;
          }
        }
      } else {
        const errorText = await checkRes.text().catch(() => 'Erro desconhecido');
        console.error('Erro ao verificar versículos existentes:', {
          status: checkRes.status,
          statusText: checkRes.statusText,
          error: errorText
        });
        
        // Se for erro de rede (ERR_ABORTED), tentar continuar mesmo assim
        if (checkRes.status === 0) {
          console.warn('Erro de rede detectado. Continuando com a inserção...');
        } else {
          console.warn('Não foi possível verificar versículos existentes:', checkRes.status);
          // Perguntar ao usuário se quer continuar mesmo assim
          const continuar = window.confirm(`⚠️ Não foi possível verificar se já existem versículos neste capítulo (Erro ${checkRes.status}).\n\nDeseja continuar mesmo assim? Isso pode causar duplicatas.`);
          if (!continuar) {
            return;
          }
        }
      }

      // Inserir novos versículos
      console.log('Inserindo versículos...');
      console.log('Array de versículos para inserir:', JSON.stringify(versiculosParaInserir, null, 2));
      
      const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/versiculos`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
          // Headers customizados para identificar o usuário admin
          'X-User-Email': usuario?.email || '',
          'X-User-Role': isAdmin ? 'admin' : 'user'
        },
        body: JSON.stringify(versiculosParaInserir)
      });

      if (!insertRes.ok) {
        const errorText = await insertRes.text();
        let errorData = null;
        
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          // Se não conseguir fazer parse, usar o texto como está
        }
        
        console.error('Erro na inserção:', errorData || errorText);
        
        // Verificar se é erro de RLS
        if (insertRes.status === 403 || errorText.includes('RLS') || errorText.includes('policy')) {
          throw new Error('Erro de permissão (RLS). Verifique as políticas de segurança no Supabase para a tabela "versiculos".');
        } else if (insertRes.status === 409 || (errorData && errorData.code === '23505')) {
          // Erro de chave duplicada - isso não deveria acontecer se a deleção funcionou
          console.error('Erro de chave duplicada detectado. Tentando verificar estado atual...');
          
          // Verificar novamente se existem versículos
          const recheckRes = await fetch(`${SUPABASE_URL}/rest/v1/versiculos?select=numero&capitulo_id=eq.${capituloId}`, {
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`
            }
          });
          
          if (recheckRes.ok) {
            const stillExisting = await recheckRes.json();
            if (stillExisting.length > 0) {
              throw new Error(`Ainda existem ${stillExisting.length} versículos no capítulo. A deleção anterior pode não ter funcionado completamente. Tente novamente.`);
            }
          }
          
          throw new Error('Erro de chave duplicada inesperado. Verifique se não há conflitos de numeração nos versículos.');
        } else {
          throw new Error(`Erro HTTP ${insertRes.status}: ${errorData?.message || errorText}`);
        }
      }

      const resultados = await insertRes.json();
      console.log('Versículos inseridos com sucesso:', resultados);
      console.log('Quantidade de versículos retornados:', resultados.length);
      console.log('Detalhes dos versículos inseridos:', JSON.stringify(resultados, null, 2));

      alert(`✅ ${versiculosParaInserir.length} versículos importados com sucesso!\n\nCapítulo: ${capituloId}\nVersículos: ${versiculosParaInserir[0]?.numero} - ${versiculosParaInserir[versiculosParaInserir.length - 1]?.numero}`);
      
    } catch (error) {
      console.error('Erro ao importar versículos:', error);
      
      let mensagemErro = 'Erro ao importar versículos: ' + error.message;
      
      if (error.message.includes('RLS') || error.message.includes('policy')) {
        mensagemErro += '\n\n🔧 SOLUÇÃO:\n1. Acesse o painel do Supabase\n2. Vá em Authentication > Policies\n3. Verifique se existe uma política para INSERT na tabela "versiculos"\n4. Se não existir, crie uma política que permita INSERT para usuários autenticados';
      }
      
      alert('❌ ' + mensagemErro);
    } finally {
      setProcessando(false);
    }
  };

  const calcularTimestampsAutomaticos = async (capituloId) => {
    const opcao = prompt(
      'Escolha o método de sincronização:\n\n' +
      '1 - Divisão uniforme (todos versículos com mesmo tempo)\n' +
      '2 - Proporcional ao tamanho do texto (mais preciso)\n\n' +
      'Digite 1 ou 2:'
    );
    
    if (!opcao || (opcao !== '1' && opcao !== '2')) {
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

      // Buscar versículos com texto
      const versRes = await fetch(`${SUPABASE_URL}/rest/v1/versiculos?select=id,numero,texto&capitulo_id=eq.${capituloId}&order=numero`, {
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

      let tempos = [];
      
      if (opcao === '1') {
        // Método 1: Divisão uniforme
        const tempoPorVersiculo = duracaoTotal / vers.length;
        tempos = vers.map((v, i) => ({
          id: v.id,
          numero: v.numero,
          inicio: tempoPorVersiculo * i,
          fim: tempoPorVersiculo * (i + 1)
        }));
        console.log('Método: Divisão uniforme -', tempoPorVersiculo.toFixed(2), 's por versículo');
      } else {
        // Método 2: Proporcional ao tamanho do texto
        const tamanhos = vers.map(v => v.texto?.length || 50);
        const tamanhoTotal = tamanhos.reduce((a, b) => a + b, 0);
        
        let tempoAcumulado = 0;
        tempos = vers.map((v, i) => {
          const proporcao = tamanhos[i] / tamanhoTotal;
          const duracaoVers = duracaoTotal * proporcao;
          const inicio = tempoAcumulado;
          const fim = tempoAcumulado + duracaoVers;
          tempoAcumulado = fim;
          
          return {
            id: v.id,
            numero: v.numero,
            inicio: inicio,
            fim: fim
          };
        });
        console.log('Método: Proporcional ao texto - baseado em', tamanhoTotal, 'caracteres');
      }

      // Atualizar timestamps
      let sucessos = 0;
      for (const t of tempos) {
        const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/versiculos?id=eq.${t.id}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            tempo_inicio: parseFloat(t.inicio.toFixed(2)),
            tempo_fim: parseFloat(t.fim.toFixed(2))
          })
        });
        
        if (updateRes.ok) {
          sucessos++;
          console.log(`Versículo ${t.numero}: ${t.inicio.toFixed(2)}s - ${t.fim.toFixed(2)}s (${(t.fim - t.inicio).toFixed(1)}s) ✓`);
        } else {
          const error = await updateRes.text();
          console.error(`Erro ao atualizar versículo ${t.numero}:`, error);
        }
      }

      if (sucessos === vers.length) {
        alert(`✅ Timestamps calculados com sucesso!\n\n${sucessos} versículos atualizados\nMétodo: ${opcao === '1' ? 'Uniforme' : 'Proporcional ao texto'}\n\n⚠️ IMPORTANTE:\nSe a sincronização não ficou perfeita, você precisará ajustar manualmente os timestamps no banco de dados, ouvindo o áudio e anotando os tempos exatos.`);
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
        <div className="max-w-4xl mx-auto p-6 pb-24 md:pb-0">
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
        <div className="max-w-4xl mx-auto p-6 pb-32 md:pb-6">
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
              {livros.map(livro => (
                <div key={livro.id} className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-amber-900 mb-4">{livro.nome}</h2>
                  
                  <button
                    onClick={async () => {
                      if (livroAbertoId === livro.id) {
                        setCapituloFocado(null);
                        setCapitulos([]);
                        setLivroAbertoId(null);
                      } else {
                        setLivroSelecionado(livro);
                        setLivroAbertoId(livro.id);
                        await carregarCapitulos(livro.id);
                      }
                    }}
                    className={`text-sm px-4 py-2 rounded-lg transition-colors ${
                      livroAbertoId === livro.id 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                    }`}
                  >
                    {livroAbertoId === livro.id ? '✓ Selecionado' : 'Selecionar'}
                  </button>

                  {livroAbertoId === livro.id && capitulos.length > 0 && (
                    <div className="mt-4">
                      {capituloFocado ? (
                        <div ref={capituloFocoRef}>
                          <div className="flex items-center justify-between mb-3 sticky top-0 bg-white py-2 z-20 shadow-sm border-b">
                            <div className="text-sm text-amber-800">
                              {livro.nome} • Capítulo {capitulos.find(c => c.id === capituloFocado)?.numero}
                            </div>
                            <button
                              onClick={() => {
                                const alvo = capituloFocado;
                                setCapituloFocado(null);
                                setTimeout(() => {
                                  try {
                                    const el = document.getElementById(`cap-${alvo}`);
                                    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  } catch (_) {}
                                }, 0);
                              }}
                              className="px-3 py-1 rounded-lg bg-amber-100 text-amber-800 text-xs hover:bg-amber-200 shadow-sm"
                            >
                              Voltar
                            </button>
                          </div>
                          {capitulos.filter(c => c.id === capituloFocado).map(cap => (
                            <div key={cap.id} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold">Capítulo {cap.numero}</span>
                                <span className={`text-xs px-2 py-1 rounded ${cap.audio_url ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                  {cap.audio_url ? '✓ Áudio OK' : 'Sem áudio'}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-3 mt-2">
                                <label className="cursor-pointer">
                                  <div className="bg-blue-100 text-blue-700 px-4 py-3 rounded text-sm text-center hover:bg-blue-200 min-h-[44px] font-medium">
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
                                  <div className="bg-purple-100 text-purple-700 px-4 py-3 rounded text-sm text-center hover:bg-purple-200 min-h-[44px] font-medium">
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
                                    className="bg-green-100 text-green-700 px-4 py-3 rounded text-sm hover:bg-green-200 min-h-[44px] font-medium"
                                    disabled={processando}
                                  >
                                    ⏱️ Sync
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="grid gap-3">
                          {capitulos.map(cap => (
                            <div key={cap.id} id={`cap-${cap.id}`} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold">Capítulo {cap.numero}</span>
                                <span className={`text-xs px-2 py-1 rounded ${cap.audio_url ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                  {cap.audio_url ? '✓ Áudio OK' : 'Sem áudio'}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-3 mt-2">
                                <label className="cursor-pointer">
                                  <div className="bg-blue-100 text-blue-700 px-4 py-3 rounded text-sm text-center hover:bg-blue-200 min-h-[44px] font-medium">
                                    📁 Áudio
                                  </div>
                                  <input
                                    type="file"
                                    accept="audio/*"
                                    className="hidden"
                                    onChange={(e) => { setCapituloFocado(cap.id); handleUploadAudio(e, livro.nome, cap.numero); }}
                                    disabled={processando}
                                  />
                                </label>
                                <label className="cursor-pointer">
                                  <div className="bg-purple-100 text-purple-700 px-4 py-3 rounded text-sm text-center hover:bg-purple-200 min-h-[44px] font-medium">
                                    📝 Texto
                                  </div>
                                  <input
                                    type="file"
                                    accept=".txt"
                                    className="hidden"
                                    onChange={(e) => { setCapituloFocado(cap.id); handleImportarVersiculos(e, cap.id); }}
                                    disabled={processando}
                                  />
                                </label>
                                {cap.audio_url && (
                                  <button
                                    onClick={() => { setCapituloFocado(cap.id); calcularTimestampsAutomaticos(cap.id); }}
                                    className="bg-green-100 text-green-700 px-4 py-3 rounded text-sm hover:bg-green-200 min-h-[44px] font-medium"
                                    disabled={processando}
                                  >
                                    ⏱️ Sync
                                  </button>
                                )}
                              </div>
                              <div className="mt-2 text-right">
                                <button
                                  onClick={() => setCapituloFocado(cap.id)}
                                  className="text-xs px-2 py-1 rounded bg-amber-50 text-amber-800 hover:bg-amber-100"
                                >
                                  Abrir
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
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

          {/* Botão para Planos de Leitura */}
          <button
            onClick={() => setTela('planos-leitura')}
            className="w-full mb-4 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 flex items-center justify-center gap-2"
          >
            <Book className="w-4 h-4" />
            Planos de Leitura
          </button>

          <div className="space-y-6">
            {/* Busca por livro */}
            <div className="sticky top-0 bg-amber-50 py-3 z-10">
              <input
                type="text"
                value={filtroLivro}
                onChange={(e) => setFiltroLivro(e.target.value)}
                placeholder="Buscar livro..."
                className="w-full px-4 py-2 rounded-lg border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white shadow-sm"
              />
            </div>

            {/* Antigo Testamento */}
            {livros.filter(l => l.testamento === 'AT').length > 0 && (
              <div>
                <button
                  onClick={() => setMostrarAT(v => !v)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200"
                >
                  <span className="font-semibold">Antigo Testamento</span>
                  <span className="flex items-center gap-2 text-sm">
                    {livros.filter(l => l.testamento === 'AT').length} livros
                    <ChevronDown className={`w-4 h-4 transition-transform ${mostrarAT ? 'rotate-180' : ''}`} />
                  </span>
                </button>
                {mostrarAT && (
                  <div className="space-y-3 mt-3 max-h-96 overflow-y-auto pr-1">
                    {livros
                      .filter(l => l.testamento === 'AT')
                      .filter(l => !filtroLivro || l.nome.toLowerCase().includes(filtroLivro.toLowerCase()))
                      .map(livro => (
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
                    {livros
                      .filter(l => l.testamento === 'AT')
                      .filter(l => !filtroLivro || l.nome.toLowerCase().includes(filtroLivro.toLowerCase()))
                      .length === 0 && (
                        <div className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3">
                          Nenhum livro encontrado.
                        </div>
                      )}
                  </div>
                )}
              </div>
            )}

            {/* Novo Testamento */}
            {livros.filter(l => l.testamento === 'NT').length > 0 && (
              <div>
                <button
                  onClick={() => setMostrarNT(v => !v)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200"
                >
                  <span className="font-semibold">Novo Testamento</span>
                  <span className="flex items-center gap-2 text-sm">
                    {livros.filter(l => l.testamento === 'NT').length} livros
                    <ChevronDown className={`w-4 h-4 transition-transform ${mostrarNT ? 'rotate-180' : ''}`} />
                  </span>
                </button>
                {mostrarNT && (
                  <div className="space-y-3 mt-3 max-h-96 overflow-y-auto pr-1">
                    {livros
                      .filter(l => l.testamento === 'NT')
                      .filter(l => !filtroLivro || l.nome.toLowerCase().includes(filtroLivro.toLowerCase()))
                      .map(livro => (
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
                    {livros
                      .filter(l => l.testamento === 'NT')
                      .filter(l => !filtroLivro || l.nome.toLowerCase().includes(filtroLivro.toLowerCase()))
                      .length === 0 && (
                        <div className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3">
                          Nenhum livro encontrado.
                        </div>
                      )}
                  </div>
                )}
              </div>
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
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-amber-900 mb-2">
                {livroNome} - Capítulo {capituloAtual.numero}
              </h1>
              
              {versiculos.length > 0 && (
                <p className="text-sm text-amber-600">
                  {versiculos.length} versículos
                </p>
              )}
            </div>
            
            {false && capituloAtual.audio_url && (<div />)}
            
            {delaySync !== 0 && (
              <div className="mt-2 text-xs text-center">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold">
                  💡 {delaySync > 0 ? 'Legenda adiantada' : 'Legenda atrasada'} em {Math.abs(delaySync)}s
                </span>
              </div>
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
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center mb-4">
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
                  crossOrigin="anonymous"
                  preload="metadata"
                  onPlay={() => setTocando(true)}
                  onPause={() => setTocando(false)}
                  onEnded={() => setTocando(false)}
                  onLoadedMetadata={(e) => {
                    setDuracao(e.target.duration || 0);
                    e.target.playbackRate = velocidade;
                    console.log('Áudio carregado, velocidade definida para:', velocidade);
                  }}
                  onCanPlay={(e) => {
                    setDuracao(e.target.duration || 0);
                    e.target.playbackRate = velocidade;
                    console.log('Áudio pronto para reproduzir, velocidade definida para:', velocidade);
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

                <div className="hidden md:flex items-center justify-center gap-8">
                  <button 
                    className="p-3 hover:bg-amber-100 rounded-full transition-colors"
                    onClick={() => audioRef.current && (audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10))}
                    title="Voltar 10 segundos"
                  >
                    <SkipBack className="w-8 h-8 text-amber-800" />
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
                    <SkipForward className="w-8 h-8 text-amber-800" />
                  </button>
                </div>

                {/* Rodapé fixo de controles (mobile) */}
                {capituloAtual.audio_url && (
                  <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-amber-200 shadow-[0_-2px_8px_rgba(0,0,0,0.06)] md:static md:rounded-lg md:mt-6">
                    <div className="max-w-4xl mx-auto p-3 md:p-4 flex flex-wrap items-center gap-3">
                      <div className="flex md:hidden items-center justify-center gap-8 w-full">
                        <button 
                          className="p-4 hover:bg-amber-100 rounded-full transition-colors min-h-[44px]"
                          onClick={() => audioRef.current && (audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10))}
                          title="Voltar 10 segundos"
                        >
                          <SkipBack className="w-8 h-8 text-amber-800" />
                        </button>

                        <button
                          onClick={handlePlayPause}
                          className="p-5 bg-amber-600 hover:bg-amber-700 rounded-full transition-colors shadow-lg min-h-[48px]"
                          title={tocando ? 'Pausar' : 'Reproduzir'}
                        >
                          {tocando ? (
                            <Pause className="w-8 h-8 text-white" fill="white" />
                          ) : (
                            <Play className="w-8 h-8 text-white" fill="white" />
                          )}
                        </button>

                        <button 
                          className="p-4 hover:bg-amber-100 rounded-full transition-colors min-h-[44px]"
                          onClick={() => audioRef.current && (audioRef.current.currentTime = Math.min(duracao, audioRef.current.currentTime + 10))}
                          title="Avançar 10 segundos"
                        >
                          <SkipForward className="w-8 h-8 text-amber-800" />
                        </button>
                        
                        {/* Botão Marcar como Lido no mobile */}
                        <button
                          onClick={handleMarcarCapituloLidoPlayer}
                          disabled={carregando}
                          className={`p-4 rounded-full transition-colors min-h-[44px] ${
                            capituloLido
                              ? 'bg-green-600 hover:bg-green-700'
                              : 'bg-blue-600 hover:bg-blue-700'
                          } ${carregando ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={capituloLido ? 'Capítulo Lido' : 'Marcar como Lido'}
                        >
                          {carregando ? (
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : capituloLido ? (
                            <span className="text-white text-xl">✓</span>
                          ) : (
                            <span className="text-white text-xl">📖</span>
                          )}
                        </button>
                      </div>
                      {/* Controle de velocidade */}
                      <div className="flex items-center gap-2">
                        <Settings className="w-5 h-5 text-amber-600" />
                        <label className="text-xs font-semibold text-amber-700">Velocidade:</label>
                        <select
                          value={velocidade.toString()}
                          onChange={(e) => handleVelocidade(parseFloat(e.target.value))}
                          className="bg-white border border-amber-300 rounded px-2 py-1 text-sm text-amber-900"
                        >
                          <option value="0.75">0.75x</option>
                          <option value="1">1.0x</option>
                          <option value="1.25">1.25x</option>
                          <option value="1.5">1.5x</option>
                          <option value="2">2.0x</option>
                        </select>
                      </div>

                      {/* Controle de delay de sincronização */}
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-xs font-semibold text-amber-700">Sincronização:</span>
                        <button
                          onClick={() => setDelaySync(d => Math.round((d - 0.5) * 10) / 10)}
                          className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded font-bold text-sm"
                          title="Atrasar legenda (clique se ela está adiantada)"
                        >
                          ← Atrasar
                        </button>
                        <span className="text-base font-mono font-bold text-amber-900 min-w-[4rem] text-center bg-white px-3 py-1 rounded border border-amber-300">
                          {delaySync > 0 ? '+' : ''}{delaySync.toFixed(1)}s
                        </span>
                        <button
                          onClick={() => setDelaySync(d => Math.round((d + 0.5) * 10) / 10)}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded font-bold text-sm"
                          title="Adiantar legenda (clique se ela está atrasada)"
                        >
                          Adiantar →
                        </button>
                        <button
                          onClick={() => setDelaySync(0)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded font-bold text-sm"
                          title="Resetar para sincronização original"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Botões de ação */}
                <div className="mt-6 flex flex-col gap-3">
                  {/* Botões de navegação */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleCapituloAnterior}
                      disabled={carregando}
                      className={`flex-1 px-3 py-2 rounded-lg font-medium text-white text-sm transition-all duration-200 bg-amber-600 hover:bg-amber-700 shadow-md ${
                        carregando ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                      }`}
                    >
                      <span className="flex items-center gap-1 justify-center">
                        ⏮️ Anterior
                      </span>
                    </button>
                    
                    <button
                      onClick={handleProximoCapitulo}
                      disabled={carregando}
                      className={`flex-1 px-3 py-2 rounded-lg font-medium text-white text-sm transition-all duration-200 bg-amber-600 hover:bg-amber-700 shadow-md ${
                        carregando ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                      }`}
                    >
                      <span className="flex items-center gap-1 justify-center">
                        ⏭️ Próximo
                      </span>
                    </button>
                  </div>
                  
                  {/* Mensagem de feedback */}
                  {mensagem && (
                    <div className="mt-3 p-2 bg-green-100 border border-green-300 rounded-lg text-green-800 text-sm">
                      {mensagem}
                    </div>
                  )}
                </div>
              </>
            )}
            
            {/* Botão marcar como lido - sempre visível */}
            <div className="mt-6 mb-4">
              <button
                onClick={handleMarcarCapituloLidoPlayer}
                disabled={carregando}
                className={`w-full px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
                  capituloLido
                    ? 'bg-green-600 hover:bg-green-700 shadow-lg'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-lg'
                } ${carregando ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
              >
                {carregando ? (
                  <span className="flex items-center gap-2 justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processando...
                  </span>
                ) : capituloLido ? (
                  <span className="flex items-center gap-2 justify-center">
                    ✅ Capítulo Lido
                  </span>
                ) : (
                  <span className="flex items-center gap-2 justify-center">
                    📖 Marcar como Lido
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Tela de Planos de Leitura
  if (tela === 'planos-leitura') {
    return (
      <PlanosLeitura 
        usuario={usuario}
        livros={livros}
        onVoltar={() => setTela('livros')}
        onCarregarCapitulos={carregarCapitulos}
        onNavigateToChecklist={() => setTela('checklist-leitura')}
        onNavigateToProgress={() => setTela('progresso-leitura')}
      />
    );
  }

  // Tela de Checklist de Leitura
  if (tela === 'checklist-leitura') {
    return (
      <ChecklistLeitura 
        usuario={usuario}
        planoAtivo={planoAtivo}
        livros={livros}
        onVoltar={() => setTela('planos-leitura')}
      />
    );
  }

  // Tela de Progresso de Leitura
  if (tela === 'progresso-leitura') {
    return (
      <ProgressoLeitura 
        usuario={usuario}
        planoAtivo={planoAtivo}
        onVoltar={() => setTela('planos-leitura')}
      />
    );
  }

  return null;
}
