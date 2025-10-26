import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, TrendingUp, Clock, Target, BookOpen, CheckCircle, AlertCircle } from 'lucide-react';
import * as planosService from '../services/planosLeituraService';

const ProgressoLeitura = ({ usuario, planoAtivo, onVoltar }) => {
  // Estados principais
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  const [dadosProgresso, setDadosProgresso] = useState(null);
  const [historicoSemanal, setHistoricoSemanal] = useState([]);
  const [metasDiarias, setMetasDiarias] = useState([]);
  const [estatisticasDetalhadas, setEstatisticasDetalhadas] = useState(null);

  // Estados para visualização
  const [periodoSelecionado, setPeriodoSelecionado] = useState('7'); // 7, 14, 30 dias
  const [tipoGrafico, setTipoGrafico] = useState('barras'); // 'barras', 'linha'

  // =====================================================
  // EFEITOS E CARREGAMENTO
  // =====================================================
  
  useEffect(() => {
    if (planoAtivo) {
      carregarDadosProgresso();
    }
  }, [planoAtivo, periodoSelecionado]);

  const carregarDadosProgresso = async () => {
    if (!planoAtivo || !usuario?.email) return;
    
    setCarregando(true);
    setErro(null);
    
    try {
      // Carregar todos os dados de progresso em paralelo
      const [progresso, historico, metas, estatisticas] = await Promise.all([
        planosService.obterProgressoDetalhado(planoAtivo.id),
        planosService.obterHistoricoProgresso(planoAtivo.id, parseInt(periodoSelecionado)),
        planosService.obterMetasDiarias(planoAtivo.id, parseInt(periodoSelecionado)),
        planosService.obterEstatisticasDetalhadas(planoAtivo.id)
      ]);
      
      setDadosProgresso(progresso);
      setHistoricoSemanal(historico);
      setMetasDiarias(metas);
      setEstatisticasDetalhadas(estatisticas);
      
    } catch (error) {
      console.error('Erro ao carregar dados de progresso:', error);
      setErro('Erro ao carregar dados de progresso.');
    } finally {
      setCarregando(false);
    }
  };

  // =====================================================
  // FUNÇÕES AUXILIARES
  // =====================================================
  
  const calcularVelocidadeLeitura = () => {
    if (!dadosProgresso || !dadosProgresso.dias_decorridos) return 0;
    return Math.round((dadosProgresso.capitulos_lidos / dadosProgresso.dias_decorridos) * 100) / 100;
  };

  const calcularTempoRestanteEstimado = () => {
    const velocidade = calcularVelocidadeLeitura();
    if (!velocidade || !dadosProgresso) return null;
    
    const capitulosRestantes = dadosProgresso.capitulos_totais - dadosProgresso.capitulos_lidos;
    const diasEstimados = Math.ceil(capitulosRestantes / velocidade);
    
    return {
      dias: diasEstimados,
      dataEstimada: new Date(Date.now() + diasEstimados * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')
    };
  };

  const obterCorStatus = (percentual) => {
    if (percentual >= 100) return 'text-green-600 bg-green-100';
    if (percentual >= 80) return 'text-blue-600 bg-blue-100';
    if (percentual >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const formatarData = (data) => {
    return new Date(data).toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit' 
    });
  };

  // =====================================================
  // COMPONENTES DE GRÁFICO SIMPLES
  // =====================================================
  
  const GraficoBarras = ({ dados, altura = 200 }) => {
    if (!dados || dados.length === 0) return null;
    
    const maxValor = Math.max(...dados.map(d => Math.max(d.lidos, d.meta)));
    
    return (
      <div className="flex items-end justify-between gap-1" style={{ height: altura }}>
        {dados.map((item, index) => {
          const alturaLidos = (item.lidos / maxValor) * (altura - 40);
          const alturaMeta = (item.meta / maxValor) * (altura - 40);
          
          return (
            <div key={index} className="flex flex-col items-center gap-1 flex-1">
              <div className="flex items-end gap-1 w-full justify-center">
                {/* Barra da Meta */}
                <div
                  className="bg-amber-200 rounded-t min-w-[8px] max-w-[16px] flex-1"
                  style={{ height: Math.max(alturaMeta, 4) }}
                  title={`Meta: ${item.meta}`}
                ></div>
                {/* Barra dos Lidos */}
                <div
                  className={`rounded-t min-w-[8px] max-w-[16px] flex-1 ${
                    item.lidos >= item.meta ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ height: Math.max(alturaLidos, 4) }}
                  title={`Lidos: ${item.lidos}`}
                ></div>
              </div>
              <div className="text-xs text-gray-600 text-center">
                {formatarData(item.data)}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const GraficoLinha = ({ dados, altura = 200 }) => {
    if (!dados || dados.length === 0) return null;
    
    const maxValor = Math.max(...dados.map(d => Math.max(d.lidos, d.meta)));
    const largura = 300;
    const pontos = dados.map((item, index) => ({
      x: (index / (dados.length - 1)) * largura,
      yLidos: altura - 40 - (item.lidos / maxValor) * (altura - 40),
      yMeta: altura - 40 - (item.meta / maxValor) * (altura - 40),
      ...item
    }));
    
    const linhaMeta = pontos.map(p => `${p.x},${p.yMeta}`).join(' ');
    const linhaLidos = pontos.map(p => `${p.x},${p.yLidos}`).join(' ');
    
    return (
      <div className="relative">
        <svg width={largura} height={altura} className="overflow-visible">
          {/* Linha da Meta */}
          <polyline
            points={linhaMeta}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
          {/* Linha dos Lidos */}
          <polyline
            points={linhaLidos}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
          />
          {/* Pontos */}
          {pontos.map((ponto, index) => (
            <g key={index}>
              <circle
                cx={ponto.x}
                cy={ponto.yLidos}
                r="4"
                fill="#3b82f6"
                className="hover:r-6 transition-all cursor-pointer"
                title={`${formatarData(ponto.data)}: ${ponto.lidos} capítulos`}
              />
            </g>
          ))}
        </svg>
        
        {/* Labels do eixo X */}
        <div className="flex justify-between mt-2">
          {dados.map((item, index) => (
            <div key={index} className="text-xs text-gray-600">
              {index % Math.ceil(dados.length / 5) === 0 ? formatarData(item.data) : ''}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // =====================================================
  // RENDERIZAÇÃO
  // =====================================================
  
  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-amber-700">Carregando dados de progresso...</p>
        </div>
      </div>
    );
  }

  const velocidadeLeitura = calcularVelocidadeLeitura();
  const tempoEstimado = calcularTempoRestanteEstimado();

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-amber-900">Progresso de Leitura</h2>
          <p className="text-amber-700">
            Plano: {planoAtivo?.tipos_planos_leitura?.nome}
          </p>
        </div>
        <button
          onClick={onVoltar}
          className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors"
        >
          <ArrowLeft size={20} />
          Voltar
        </button>
      </div>

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

      {/* Estatísticas Principais */}
      {dadosProgresso && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target size={20} className="text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {dadosProgresso.percentual_concluido}%
                </div>
                <div className="text-sm text-blue-800">Progresso Geral</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle size={20} className="text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {dadosProgresso.capitulos_lidos}
                </div>
                <div className="text-sm text-green-800">Capítulos Lidos</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <TrendingUp size={20} className="text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-600">
                  {velocidadeLeitura}
                </div>
                <div className="text-sm text-amber-800">Cap./Dia (Média)</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock size={20} className="text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {dadosProgresso.dias_restantes}
                </div>
                <div className="text-sm text-purple-800">Dias Restantes</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status de Atraso */}
      {dadosProgresso?.esta_atrasado && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <AlertCircle size={20} className="text-red-600" />
            <div>
              <div className="font-medium text-red-800">
                Plano em Atraso
              </div>
              <div className="text-sm text-red-700">
                Você está {dadosProgresso.dias_atraso} dias atrasado. 
                {tempoEstimado && (
                  <span> Conclusão estimada: {tempoEstimado.dataEstimada}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controles do Gráfico */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-amber-800 mb-1">Período:</label>
              <select
                value={periodoSelecionado}
                onChange={(e) => setPeriodoSelecionado(e.target.value)}
                className="px-3 py-1 border border-amber-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="7">Últimos 7 dias</option>
                <option value="14">Últimos 14 dias</option>
                <option value="30">Últimos 30 dias</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-amber-800 mb-1">Visualização:</label>
              <select
                value={tipoGrafico}
                onChange={(e) => setTipoGrafico(e.target.value)}
                className="px-3 py-1 border border-amber-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="barras">Barras</option>
                <option value="linha">Linha</option>
              </select>
            </div>
          </div>

          {/* Legenda */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span>Capítulos Lidos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-amber-200 rounded"></div>
              <span>Meta Diária</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de Progresso */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold text-amber-900 mb-4">
          Progresso dos Últimos {periodoSelecionado} Dias
        </h3>
        
        {metasDiarias && metasDiarias.length > 0 ? (
          <div className="overflow-x-auto">
            {tipoGrafico === 'barras' ? (
              <GraficoBarras dados={metasDiarias} />
            ) : (
              <GraficoLinha dados={metasDiarias} />
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-amber-600">
            Dados insuficientes para exibir o gráfico
          </div>
        )}
      </div>

      {/* Estatísticas Detalhadas */}
      {estatisticasDetalhadas && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Resumo por Livro */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-amber-900 mb-4 flex items-center gap-2">
              <BookOpen size={20} />
              Progresso por Livro
            </h3>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {estatisticasDetalhadas.progresso_por_livro?.map(livro => (
                <div key={livro.livro_id} className="flex items-center justify-between p-3 bg-amber-50 rounded">
                  <div>
                    <div className="font-medium text-amber-900">{livro.livro_nome}</div>
                    <div className="text-sm text-amber-700">
                      {livro.capitulos_lidos} de {livro.total_capitulos} capítulos
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium px-2 py-1 rounded ${obterCorStatus(livro.percentual)}`}>
                      {livro.percentual}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Métricas de Performance */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-amber-900 mb-4 flex items-center gap-2">
              <TrendingUp size={20} />
              Métricas de Performance
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                <span className="text-blue-800">Melhor dia:</span>
                <span className="font-medium text-blue-900">
                  {estatisticasDetalhadas.melhor_dia?.capitulos || 0} capítulos
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                <span className="text-green-800">Sequência atual:</span>
                <span className="font-medium text-green-900">
                  {estatisticasDetalhadas.sequencia_dias || 0} dias
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                <span className="text-purple-800">Maior sequência:</span>
                <span className="font-medium text-purple-900">
                  {estatisticasDetalhadas.maior_sequencia || 0} dias
                </span>
              </div>
              
              {tempoEstimado && (
                <div className="flex justify-between items-center p-3 bg-amber-50 rounded">
                  <span className="text-amber-800">Conclusão estimada:</span>
                  <span className="font-medium text-amber-900">
                    {tempoEstimado.dataEstimada}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressoLeitura;