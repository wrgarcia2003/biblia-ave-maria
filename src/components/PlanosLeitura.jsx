import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Play, ArrowLeft, CheckCircle, Clock, Target } from 'lucide-react';
import * as planosService from '../services/planosLeituraService';

const PlanosLeitura = ({ usuario, livros, onVoltar, onCarregarCapitulos }) => {
  // Estados principais
  const [tela, setTela] = useState('dashboard'); // 'dashboard', 'criar', 'progresso', 'checklist'
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  
  // Estados para criação de plano
  const [tiposPlanos, setTiposPlanos] = useState([]);
  const [planoSelecionado, setPlanoSelecionado] = useState(null);
  const [livroInicio, setLivroInicio] = useState(null);
  const [capituloInicio, setCapituloInicio] = useState(1);
  
  
  // Estados para plano ativo
  const [planoAtivo, setPlanoAtivo] = useState(null);
  const [statusPlano, setStatusPlano] = useState(null);
  const [capitulosHoje, setCapitulosHoje] = useState(null);
  const [capitulosLidos, setCapitulosLidos] = useState(new Set());
  
  // =====================================================
  // EFEITOS E CARREGAMENTO INICIAL
  // =====================================================
  
  const carregarDadosIniciais = useCallback(async () => {
    if (!usuario?.email) return;
    
    setCarregando(true);
    setErro(null);
    
    try {
      const [tipos, plano] = await Promise.all([
        planosService.obterTiposPlanos(),
        planosService.obterPlanoAtivo(usuario.email)
      ]);
      
      setTiposPlanos(tipos);
      setPlanoAtivo(plano);
      
      if (plano) {
        const [status, hoje, checklist] = await Promise.all([
          planosService.obterStatusPlano(usuario.email),
          planosService.obterCapitulosHoje(plano.id),
          planosService.obterChecklistCompleto(usuario.email)
        ]);
        
        setStatusPlano(status);
        setCapitulosHoje(hoje);
        
        if (checklist && checklist.capitulos) {
          const capitulosLidosSet = new Set();
          checklist.capitulos.forEach(cap => {
            if (cap.lido) {
              capitulosLidosSet.add(`${cap.livro_id}-${cap.capitulo_numero}`);
            }
          });
          setCapitulosLidos(capitulosLidosSet);
        }
      }
      
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
      setErro('Erro ao carregar dados dos planos de leitura.');
    } finally {
      setCarregando(false);
    }
  }, [usuario?.email]);

  useEffect(() => {
    carregarDadosIniciais();
  }, [carregarDadosIniciais]);

  

  // =====================================================
  // FUNÇÕES PARA CRIAÇÃO DE PLANO
  // =====================================================
  
  const handleSelecionarLivro = async (livro) => {
    setLivroInicio(livro);
    setCapituloInicio(1);
    
    try {
      // Carregar capítulos do livro selecionado
      await onCarregarCapitulos(livro.id);
    } catch (error) {
      console.error('Erro ao carregar capítulos:', error);
      setErro('Erro ao carregar capítulos do livro selecionado.');
    }
  };

  const calcularPrevisao = () => {
    if (!planoSelecionado || !livroInicio || !capituloInicio) return null;
    
    // Calcular capítulos restantes (aproximação)
    const livroIndex = livros.findIndex(l => l.id === livroInicio.id);
    let capitulosRestantes = 0;
    
    // Capítulos restantes do livro atual
    capitulosRestantes += (livroInicio.total_capitulos - capituloInicio + 1);
    
    // Capítulos dos livros seguintes
    for (let i = livroIndex + 1; i < livros.length; i++) {
      capitulosRestantes += livros[i].total_capitulos;
    }
    
    const capitulosPorDia = capitulosRestantes / planoSelecionado.duracao_dias;
    const dataFim = new Date();
    dataFim.setDate(dataFim.getDate() + planoSelecionado.duracao_dias);
    
    return {
      capitulosRestantes,
      capitulosPorDia: Math.round(capitulosPorDia * 100) / 100,
      dataFim: dataFim.toLocaleDateString('pt-BR')
    };
  };

  const handleCriarPlano = async () => {
    if (!planoSelecionado || !livroInicio || !capituloInicio) {
      setErro('Por favor, selecione um tipo de plano, livro e capítulo de início.');
      return;
    }
    
    setCarregando(true);
    setErro(null);
    
    try {
      // Verificar se já existe um plano ativo
      const planoExistente = await planosService.verificarPlanoExistente(usuario.email);
      
      if (planoExistente) {
        setErro('Você já possui um plano de leitura ativo. Finalize ou pause o atual antes de criar um novo.');
        return;
      }
      
      // Validar ponto de início
      const pontoValido = await planosService.validarPontoInicio(livroInicio.id, capituloInicio);
      
      if (!pontoValido) {
        setErro('Ponto de início inválido. Verifique o livro e capítulo selecionados.');
        return;
      }
      
      // Criar o plano
      const planoId = await planosService.criarPlanoLeitura(
        usuario.email,
        planoSelecionado.id,
        livroInicio.id,
        capituloInicio
      );
      
      if (planoId) {
        // Recarregar dados e voltar ao dashboard
        await carregarDadosIniciais();
        setTela('dashboard');
      }
      
    } catch (error) {
      console.error('Erro ao criar plano:', error);
      setErro('Erro ao criar plano de leitura. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  // =====================================================
  // FUNÇÕES PARA GERENCIAR PLANO ATIVO
  // =====================================================
  
  const handlePausarPlano = async () => {
    if (!planoAtivo) return;
    
    setCarregando(true);
    try {
      await planosService.pausarPlano(planoAtivo.id, !planoAtivo.pausado);
      await carregarDadosIniciais();
    } catch (error) {
      console.error('Erro ao pausar/retomar plano:', error);
      setErro('Erro ao pausar/retomar plano.');
    } finally {
      setCarregando(false);
    }
  };

  const handleFinalizarPlano = async () => {
    if (!planoAtivo) return;
    
    const confirmar = window.confirm('Tem certeza que deseja finalizar este plano de leitura?');
    if (!confirmar) return;
    
    setCarregando(true);
    try {
      await planosService.finalizarPlano(planoAtivo.id);
      await carregarDadosIniciais();
    } catch (error) {
      console.error('Erro ao finalizar plano:', error);
      setErro('Erro ao finalizar plano.');
    } finally {
      setCarregando(false);
    }
  };

  // =====================================================
  // FUNÇÕES PARA MARCAR CAPÍTULOS COMO LIDOS
  // =====================================================
  
  const handleMarcarCapituloLido = async (livroId, capituloNumero) => {
    if (!planoAtivo) return;
    
    setCarregando(true);
    try {
      // Verificar se o capítulo já está lido
      const capituloKey = `${livroId}-${capituloNumero}`;
      const estaLido = capitulosLidos.has(capituloKey);
      

      
      if (estaLido) {
        // Se está lido, desmarcar
        await planosService.desmarcarCapituloLido(planoAtivo.id, livroId, capituloNumero);
      } else {
        // Se não está lido, marcar
        await planosService.marcarCapituloLido(planoAtivo.id, livroId, capituloNumero, true);
      }
      
      // Recarregar dados para atualizar o status
      await carregarDadosIniciais();
      
      // Mostrar feedback visual
      // TODO: Adicionar toast ou notificação de sucesso
      
    } catch (error) {
      console.error('Erro ao marcar/desmarcar capítulo:', error);
      setErro('Erro ao marcar/desmarcar capítulo.');
    } finally {
      setCarregando(false);
    }
  };

  // =====================================================
  // RENDERIZAÇÃO - DASHBOARD
  // =====================================================
  
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-amber-900">Planos de Leitura</h2>
        <button
          onClick={onVoltar}
          className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors"
        >
          <ArrowLeft size={20} />
          Voltar
        </button>
      </div>

      {/* Plano Ativo */}
      {planoAtivo ? (
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-amber-500">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-amber-900">
                Plano Ativo: {planoAtivo.tipos_planos_leitura?.nome}
              </h3>
              <p className="text-sm text-amber-700 mt-1">
                Registrado em: {new Date(planoAtivo.created_at || planoAtivo.data_inicio).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePausarPlano}
                className={`px-3 py-1 rounded text-sm ${
                  planoAtivo.pausado 
                    ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                    : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                }`}
                disabled={carregando}
              >
                {planoAtivo.pausado ? 'Retomar' : 'Pausar'}
              </button>
              <button
                onClick={handleFinalizarPlano}
                className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200"
                disabled={carregando}
              >
                Finalizar
              </button>
            </div>
          </div>

          {statusPlano && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-blue-50 rounded">
                <div className="text-2xl font-bold text-blue-600">
                  {statusPlano.percentual_concluido}%
                </div>
                <div className="text-sm text-blue-800">Progresso</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded">
                <div className="text-2xl font-bold text-green-600">
                  {statusPlano.capitulos_lidos}
                </div>
                <div className="text-sm text-green-800">Capítulos Lidos</div>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded">
                <div className="text-2xl font-bold text-amber-600">
                  {statusPlano.dias_restantes}
                </div>
                <div className="text-sm text-amber-800">Dias Restantes</div>
              </div>
            </div>
          )}

          {/* Status de atraso */}
          {statusPlano?.esta_atrasado && (
            <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
              <div className="flex items-center gap-2 text-red-800">
                <Clock size={16} />
                <span className="font-medium">
                  Você está {statusPlano.dias_atraso > 0 ? `${statusPlano.dias_atraso} dias` : ''} atrasado no plano
                </span>
              </div>
            </div>
          )}

          {/* Capítulos de hoje */}
          {capitulosHoje && capitulosHoje.capitulos_programados && (
            <div className="bg-amber-50 border border-amber-200 rounded p-4">
              <h4 className="font-medium text-amber-900 mb-2 flex items-center gap-2">
                <Target size={16} />
                Leitura de Hoje
              </h4>
              <div className="space-y-1">
                {(() => {
                  try {
                    let capitulos = [];
                    if (capitulosHoje?.capitulos_programados) {
                      // Se já é um array, usa diretamente
                      if (Array.isArray(capitulosHoje.capitulos_programados)) {
                        capitulos = capitulosHoje.capitulos_programados;
                      }
                      // Se é uma string, tenta fazer parse
                      else if (typeof capitulosHoje.capitulos_programados === 'string') {
                        capitulos = JSON.parse(capitulosHoje.capitulos_programados);
                      }
                      // Se é um objeto, usa diretamente
                      else if (typeof capitulosHoje.capitulos_programados === 'object') {
                        capitulos = [capitulosHoje.capitulos_programados];
                      }
                    }
                    return capitulos.map((cap, index) => {
                      // Usar sempre o mesmo padrão de chave que é usado no carregamento
                      const capituloNumero = cap.capitulo_numero || cap.capitulo;
                      const capituloKey = `${cap.livro_id}-${capituloNumero}`;
                      const estaLido = capitulosLidos.has(capituloKey);
                      
                      return (
                        <div key={index} className="flex items-center justify-between p-3 bg-white rounded border border-amber-200 hover:bg-amber-25 transition-colors">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-amber-900">
                              {cap.livro_nome} - Capítulo {capituloNumero}
                            </div>
                          </div>
                          <button
                            onClick={() => handleMarcarCapituloLido(cap.livro_id, capituloNumero)}
                            className={`flex items-center gap-2 px-3 py-1 rounded transition-colors text-sm font-semibold ${
                              estaLido 
                                ? 'bg-green-600 text-white hover:bg-green-700' 
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                            disabled={carregando}
                          >
                            {estaLido ? (
                              <CheckCircle size={14} />
                            ) : (
                              <BookOpen size={14} />
                            )}
                            {estaLido ? '✅ Lido' : '📖 Marcar como Lido'}
                          </button>
                        </div>
                      );
                    });
                  } catch (error) {
                    console.error('Erro ao processar capítulos programados:', error);
                    return (
                      <div className="text-sm text-red-600">
                        Erro ao carregar capítulos de hoje
                      </div>
                    );
                  }
                })()}
              </div>
            </div>
          )}


        </div>
      ) : (
        /* Sem plano ativo */
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <BookOpen size={48} className="mx-auto text-amber-500 mb-4" />
          <h3 className="text-xl font-semibold text-amber-900 mb-2">
            Nenhum Plano de Leitura Ativo
          </h3>
          <p className="text-amber-700 mb-6">
            Crie um plano personalizado para organizar sua leitura da Bíblia
          </p>
          <button
            onClick={() => setTela('criar')}
            className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors mx-auto"
          >
            <Play size={20} />
            Criar Plano de Leitura
          </button>
        </div>
      )}
    </div>
  );

  // =====================================================
  // RENDERIZAÇÃO - CRIAR PLANO
  // =====================================================
  
  const renderCriarPlano = () => {
    const previsao = calcularPrevisao();
    
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-amber-900">Criar Plano de Leitura</h2>
          <button
            onClick={() => setTela('dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors"
          >
            <ArrowLeft size={20} />
            Voltar
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuração do Plano */}
          <div className="space-y-6">
            {/* Tipo de Plano */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-amber-900 mb-4">1. Escolha a Duração</h3>
              <div className="space-y-3">
                {(tiposPlanos || []).map(tipo => (
                  <label key={tipo.id} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-amber-50">
                    <input
                      type="radio"
                      name="tipoPlano"
                      value={tipo.id}
                      checked={planoSelecionado?.id === tipo.id}
                      onChange={() => setPlanoSelecionado(tipo)}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium text-amber-900">{tipo.nome}</div>
                      <div className="text-sm text-amber-700">
                        {tipo.duracao_dias} dias • {tipo.descricao}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Ponto de Início */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-amber-900 mb-4">2. Escolha o Ponto de Início</h3>
              
              {/* Seleção de Livro */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-amber-800 mb-2">Livro:</label>
                <select
                  value={livroInicio?.id || ''}
                  onChange={(e) => {
                    const livro = livros.find(l => l.id === parseInt(e.target.value));
                    if (livro) handleSelecionarLivro(livro);
                  }}
                  className="w-full p-3 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="">Selecione um livro...</option>
                  {(livros || []).map(livro => (
                    <option key={livro.id} value={livro.id}>
                      {livro.nome} ({livro.total_capitulos} capítulos)
                    </option>
                  ))}
                </select>
              </div>

              {/* Seleção de Capítulo */}
              {livroInicio && (
                <div>
                  <label className="block text-sm font-medium text-amber-800 mb-2">Capítulo:</label>
                  <select
                    value={capituloInicio}
                    onChange={(e) => setCapituloInicio(parseInt(e.target.value))}
                    className="w-full p-3 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    {livroInicio?.total_capitulos ? Array.from({ length: livroInicio.total_capitulos }, (_, i) => i + 1).map(num => (
                      <option key={num} value={num}>Capítulo {num}</option>
                    )) : null}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Previsão e Confirmação */}
          <div className="space-y-6">
            {/* Previsão */}
            {previsao && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-amber-900 mb-4">Previsão do Plano</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-amber-700">Capítulos restantes:</span>
                    <span className="font-medium text-amber-900">{previsao.capitulosRestantes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-700">Capítulos por dia:</span>
                    <span className="font-medium text-amber-900">{previsao.capitulosPorDia}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-700">Data prevista de conclusão:</span>
                    <span className="font-medium text-amber-900">{previsao.dataFim}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Botão de Criar */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <button
                onClick={handleCriarPlano}
                disabled={!planoSelecionado || !livroInicio || !capituloInicio || carregando}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {carregando ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Criando...
                  </>
                ) : (
                  <>
                    <Play size={20} />
                    Criar Plano de Leitura
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // =====================================================
  // RENDERIZAÇÃO PRINCIPAL
  // =====================================================
  
  if (carregando && tela === 'dashboard') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-amber-700">Carregando planos de leitura...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Mensagem de Erro */}
      {erro && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="text-red-800">{erro}</div>
          <button
            onClick={() => setErro(null)}
            className="mt-2 text-sm text-red-600 hover:text-red-800"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Renderização condicional baseada na tela */}
      {tela === 'dashboard' && renderDashboard()}
      {tela === 'criar' && renderCriarPlano()}
    </div>
  );
};

export default PlanosLeitura;