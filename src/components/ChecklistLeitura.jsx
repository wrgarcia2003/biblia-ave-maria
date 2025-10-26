import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, ArrowLeft, BookOpen, Calendar, Target, Search, Filter } from 'lucide-react';
import * as planosService from '../services/planosLeituraService';

const ChecklistLeitura = ({ usuario, planoAtivo, onVoltar, livros }) => {
  // Estados principais
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  const [capitulosChecklist, setCapitulosChecklist] = useState([]);
  const [capitulosLidos, setCapitulosLidos] = useState(new Set());
  
  // Estados para filtros e busca
  const [filtroLivro, setFiltroLivro] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos'); // 'todos', 'lidos', 'nao_lidos'
  const [busca, setBusca] = useState('');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  
  // Estados para agrupamento
  const [agrupadoPorLivro, setAgrupadoPorLivro] = useState({});
  const [estatisticas, setEstatisticas] = useState(null);

  // =====================================================
  // EFEITOS E CARREGAMENTO
  // =====================================================
  
  useEffect(() => {
    if (planoAtivo) {
      carregarChecklist();
    }
  }, [planoAtivo]);

  useEffect(() => {
    agruparCapitulos();
  }, [capitulosChecklist, capitulosLidos, filtroLivro, filtroStatus, busca]);

  const carregarChecklist = async () => {
    if (!planoAtivo || !usuario?.email) return;
    
    setCarregando(true);
    setErro(null);
    
    try {
      // Carregar checklist completo e capítulos já lidos
      const [checklist, lidos, stats] = await Promise.all([
        planosService.obterChecklistCompleto(usuario.email),
        planosService.obterCapitulosLidos(planoAtivo.id),
        planosService.obterEstatisticasPlano(planoAtivo.id)
      ]);
      
      setCapitulosChecklist(checklist);
      setCapitulosLidos(new Set(lidos.map(cap => `${cap.livro_id}-${cap.capitulo}`)));
      setEstatisticas(stats);
      
    } catch (error) {
      console.error('Erro ao carregar checklist:', error);
      setErro('Erro ao carregar checklist de leitura.');
    } finally {
      setCarregando(false);
    }
  };

  const agruparCapitulos = () => {
    let capitulosFiltrados = [...capitulosChecklist];
    
    // Aplicar filtros
    if (filtroLivro) {
      capitulosFiltrados = capitulosFiltrados.filter(cap => cap.livro_id === parseInt(filtroLivro));
    }
    
    if (filtroStatus !== 'todos') {
      capitulosFiltrados = capitulosFiltrados.filter(cap => {
        const lido = capitulosLidos.has(`${cap.livro_id}-${cap.capitulo}`);
        return filtroStatus === 'lidos' ? lido : !lido;
      });
    }
    
    if (busca) {
      const buscaLower = busca.toLowerCase();
      capitulosFiltrados = capitulosFiltrados.filter(cap => 
        cap.livro_nome.toLowerCase().includes(buscaLower) ||
        cap.capitulo.toString().includes(buscaLower)
      );
    }
    
    // Agrupar por livro
    const agrupado = capitulosFiltrados.reduce((acc, capitulo) => {
      const livroId = capitulo.livro_id;
      if (!acc[livroId]) {
        acc[livroId] = {
          livro: {
            id: livroId,
            nome: capitulo.livro_nome,
            total_capitulos: capitulo.total_capitulos_livro
          },
          capitulos: []
        };
      }
      acc[livroId].capitulos.push(capitulo);
      return acc;
    }, {});
    
    // Ordenar capítulos dentro de cada livro
    Object.values(agrupado).forEach(grupo => {
      grupo.capitulos.sort((a, b) => a.capitulo - b.capitulo);
    });
    
    setAgrupadoPorLivro(agrupado);
  };

  // =====================================================
  // FUNÇÕES DE INTERAÇÃO
  // =====================================================
  
  const handleMarcarCapitulo = async (livroId, capitulo, lido) => {
    const chave = `${livroId}-${capitulo}`;
    
    try {
      if (lido) {
        // Marcar como lido
        await planosService.marcarCapituloLido(usuario.email, planoAtivo.id, livroId, capitulo);
        setCapitulosLidos(prev => new Set([...prev, chave]));
      } else {
        // Desmarcar
        await planosService.desmarcarCapituloLido(usuario.email, planoAtivo.id, livroId, capitulo);
        setCapitulosLidos(prev => {
          const novo = new Set(prev);
          novo.delete(chave);
          return novo;
        });
      }
      
      // Atualizar estatísticas
      const novasStats = await planosService.obterEstatisticasPlano(planoAtivo.id);
      setEstatisticas(novasStats);
      
    } catch (error) {
      console.error('Erro ao marcar capítulo:', error);
      setErro('Erro ao atualizar status do capítulo.');
    }
  };

  const handleMarcarLivroCompleto = async (livroId, marcar) => {
    const grupo = agrupadoPorLivro[livroId];
    if (!grupo) return;
    
    setCarregando(true);
    try {
      for (const cap of grupo.capitulos) {
        await handleMarcarCapitulo(livroId, cap.capitulo, marcar);
      }
    } catch (error) {
      console.error('Erro ao marcar livro completo:', error);
      setErro('Erro ao marcar livro completo.');
    } finally {
      setCarregando(false);
    }
  };

  // =====================================================
  // FUNÇÕES AUXILIARES
  // =====================================================
  
  const calcularProgressoLivro = (livroId) => {
    const grupo = agrupadoPorLivro[livroId];
    if (!grupo) return 0;
    
    const lidos = grupo.capitulos.filter(cap => 
      capitulosLidos.has(`${cap.livro_id}-${cap.capitulo}`)
    ).length;
    
    return Math.round((lidos / grupo.capitulos.length) * 100);
  };

  const obterLivrosDisponiveis = () => {
    const livrosNoChecklist = new Set(capitulosChecklist.map(cap => cap.livro_id));
    return livros.filter(livro => livrosNoChecklist.has(livro.id));
  };

  // =====================================================
  // RENDERIZAÇÃO
  // =====================================================
  
  if (carregando && capitulosChecklist.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-amber-700">Carregando checklist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-amber-900">Checklist de Leitura</h2>
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

      {/* Estatísticas */}
      {estatisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {estatisticas.percentual_concluido}%
            </div>
            <div className="text-sm text-blue-800">Progresso Geral</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {estatisticas.capitulos_lidos}
            </div>
            <div className="text-sm text-green-800">Capítulos Lidos</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">
              {estatisticas.capitulos_restantes}
            </div>
            <div className="text-sm text-amber-800">Restantes</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Object.keys(agrupadoPorLivro).length}
            </div>
            <div className="text-sm text-purple-800">Livros no Plano</div>
          </div>
        </div>
      )}

      {/* Filtros e Busca */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-amber-900">Filtros</h3>
          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className="flex items-center gap-2 px-3 py-1 text-amber-700 hover:bg-amber-50 rounded"
          >
            <Filter size={16} />
            {mostrarFiltros ? 'Ocultar' : 'Mostrar'} Filtros
          </button>
        </div>

        {mostrarFiltros && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Busca */}
            <div>
              <label className="block text-sm font-medium text-amber-800 mb-1">Buscar:</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-3 text-amber-500" />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Nome do livro ou capítulo..."
                  className="w-full pl-10 pr-3 py-2 border border-amber-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filtro por Livro */}
            <div>
              <label className="block text-sm font-medium text-amber-800 mb-1">Livro:</label>
              <select
                value={filtroLivro}
                onChange={(e) => setFiltroLivro(e.target.value)}
                className="w-full p-2 border border-amber-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="">Todos os livros</option>
                {obterLivrosDisponiveis().map(livro => (
                  <option key={livro.id} value={livro.id}>
                    {livro.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Status */}
            <div>
              <label className="block text-sm font-medium text-amber-800 mb-1">Status:</label>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="w-full p-2 border border-amber-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="todos">Todos</option>
                <option value="lidos">Lidos</option>
                <option value="nao_lidos">Não Lidos</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Lista de Livros e Capítulos */}
      <div className="space-y-4">
        {Object.values(agrupadoPorLivro).map(grupo => {
          const progressoLivro = calcularProgressoLivro(grupo.livro.id);
          const todosLidos = grupo.capitulos.every(cap => 
            capitulosLidos.has(`${cap.livro_id}-${cap.capitulo}`)
          );
          
          return (
            <div key={grupo.livro.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Header do Livro */}
              <div className="bg-amber-50 border-b border-amber-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BookOpen size={20} className="text-amber-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-amber-900">
                        {grupo.livro.nome}
                      </h3>
                      <p className="text-sm text-amber-700">
                        {grupo.capitulos.length} capítulos no plano • {progressoLivro}% concluído
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Barra de Progresso */}
                    <div className="w-32 bg-amber-200 rounded-full h-2">
                      <div
                        className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progressoLivro}%` }}
                      ></div>
                    </div>
                    
                    {/* Botão Marcar Todos */}
                    <button
                      onClick={() => handleMarcarLivroCompleto(grupo.livro.id, !todosLidos)}
                      className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
                        todosLidos
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                      disabled={carregando}
                    >
                      {todosLidos ? '❌ Desmarcar Todos' : '📖 Marcar Todos'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Lista de Capítulos */}
              <div className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {grupo.capitulos.map(capitulo => {
                    const chave = `${capitulo.livro_id}-${capitulo.capitulo}`;
                    const lido = capitulosLidos.has(chave);
                    
                    return (
                      <button
                        key={chave}
                        onClick={() => handleMarcarCapitulo(capitulo.livro_id, capitulo.capitulo, !lido)}
                        className={`flex items-center gap-2 p-2 rounded border transition-all ${
                          lido
                            ? 'bg-green-50 border-green-300 text-green-800 hover:bg-green-100'
                            : 'bg-blue-50 border-blue-300 text-blue-800 hover:bg-blue-100'
                        }`}
                      >
                        {lido ? (
                          <CheckCircle size={16} className="text-green-600" />
                        ) : (
                          <Circle size={16} className="text-blue-400" />
                        )}
                        <span className="text-sm font-medium">
                          Cap. {capitulo.capitulo}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mensagem quando não há resultados */}
      {Object.keys(agrupadoPorLivro).length === 0 && !carregando && (
        <div className="text-center py-12">
          <BookOpen size={48} className="mx-auto text-amber-300 mb-4" />
          <h3 className="text-xl font-semibold text-amber-900 mb-2">
            Nenhum capítulo encontrado
          </h3>
          <p className="text-amber-700">
            Tente ajustar os filtros para ver mais resultados.
          </p>
        </div>
      )}
    </div>
  );
};

export default ChecklistLeitura;