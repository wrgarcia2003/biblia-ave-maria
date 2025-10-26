// =====================================================
// SERVIÇO PARA PLANOS DE LEITURA
// =====================================================

// Configuração do Supabase (reutilizando do App.jsx)
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

// Função auxiliar para fazer chamadas à API
const supabaseCall = async (endpoint, options = {}) => {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro na API: ${response.status} - ${errorText}`);
  }

  return response.json();
};

// Função auxiliar para chamar funções SQL
const callSqlFunction = async (functionName, params = {}) => {
  const url = `${SUPABASE_URL}/rest/v1/rpc/${functionName}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro na função SQL: ${response.status} - ${errorText}`);
  }

  return response.json();
};

// =====================================================
// FUNÇÕES PARA TIPOS DE PLANOS
// =====================================================

export const obterTiposPlanos = async () => {
  try {
    return await supabaseCall('tipos_planos_leitura?select=*&ativo=eq.true&order=duracao_dias');
  } catch (error) {
    console.error('Erro ao obter tipos de planos:', error);
    throw error;
  }
};

// =====================================================
// FUNÇÕES PARA PLANOS DO USUÁRIO
// =====================================================

export const obterPlanoAtivo = async (usuarioEmail) => {
  try {
    const planos = await supabaseCall(
      `planos_leitura_usuarios?select=*,tipos_planos_leitura(nome,duracao_dias),livros(nome)&usuario_email=eq.${usuarioEmail}&ativo=eq.true&order=created_at.desc&limit=1`
    );
    return planos.length > 0 ? planos[0] : null;
  } catch (error) {
    console.error('Erro ao obter plano ativo:', error);
    throw error;
  }
};

export const criarPlanoLeitura = async (usuarioEmail, tipoPlanoId, livroInicioId, capituloInicioNumero) => {
  try {
    const planoId = await callSqlFunction('criar_plano_leitura', {
      p_usuario_email: usuarioEmail,
      p_tipo_plano_id: tipoPlanoId,
      p_livro_inicio_id: livroInicioId,
      p_capitulo_inicio_numero: capituloInicioNumero
    });
    return planoId;
  } catch (error) {
    console.error('Erro ao criar plano de leitura:', error);
    throw error;
  }
};

export const pausarPlano = async (planoId, pausar = true) => {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/planos_leitura_usuarios?id=eq.${planoId}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        pausado: pausar,
        data_pausa: pausar ? new Date().toISOString().split('T')[0] : null,
        updated_at: new Date().toISOString()
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro na API: ${response.status} - ${errorText}`);
    }

    return true;
  } catch (error) {
    console.error('Erro ao pausar/retomar plano:', error);
    throw error;
  }
};

export const finalizarPlano = async (planoId) => {
  try {
    const url = `${SUPABASE_URL}/rest/v1/planos_leitura_usuarios?id=eq.${planoId}`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        ativo: false,
        data_conclusao: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro na API: ${response.status} - ${errorText}`);
    }

    return true;
  } catch (error) {
    console.error('Erro ao finalizar plano:', error);
    throw error;
  }
};

// =====================================================
// FUNÇÕES PARA PROGRESSO E STATUS
// =====================================================

export const obterStatusPlano = async (usuarioEmail) => {
  try {
    const status = await callSqlFunction('obter_status_plano_usuario', {
      p_usuario_email: usuarioEmail
    });
    return status.length > 0 ? status[0] : null;
  } catch (error) {
    console.error('Erro ao obter status do plano:', error);
    throw error;
  }
};

export const obterProgressoDiario = async (planoId, dataInicio = null, dataFim = null) => {
  try {
    let query = `progresso_leitura_diario?select=*&plano_id=eq.${planoId}&order=data_leitura`;
    
    if (dataInicio) {
      query += `&data_leitura=gte.${dataInicio}`;
    }
    if (dataFim) {
      query += `&data_leitura=lte.${dataFim}`;
    }
    
    return await supabaseCall(query);
  } catch (error) {
    console.error('Erro ao obter progresso diário:', error);
    throw error;
  }
};

export const obterCapitulosHoje = async (planoId) => {
  try {
    const hoje = new Date().toISOString().split('T')[0];
    const progresso = await supabaseCall(
      `progresso_leitura_diario?select=*&plano_id=eq.${planoId}&data_leitura=eq.${hoje}`
    );
    return progresso.length > 0 ? progresso[0] : null;
  } catch (error) {
    console.error('Erro ao obter capítulos de hoje:', error);
    throw error;
  }
};

// =====================================================
// FUNÇÕES PARA CHECKLIST DE CAPÍTULOS
// =====================================================

export const obterChecklistCapitulos = async (planoId, livroId = null) => {
  try {
    let query = `capitulos_lidos_usuarios?select=*,livros(nome)&plano_id=eq.${planoId}&order=data_programada,livro_id,capitulo_numero`;
    
    if (livroId) {
      query += `&livro_id=eq.${livroId}`;
    }
    
    return await supabaseCall(query);
  } catch (error) {
    console.error('Erro ao obter checklist de capítulos:', error);
    throw error;
  }
};

export const marcarCapituloLido = async (planoId, livroId, capituloNumero, lido = true) => {
  try {
    const resultado = await callSqlFunction('marcar_capitulo_lido', {
      p_plano_id: planoId,
      p_livro_id: livroId,
      p_capitulo_numero: capituloNumero,
      p_lido: lido
    });
    return resultado;
  } catch (error) {
    console.error('Erro ao marcar capítulo como lido:', error);
    throw error;
  }
};

export const obterCapitulosLidos = async (planoId, dataInicio = null, dataFim = null) => {
  try {
    let query = `capitulos_lidos_usuarios?select=*,livros(nome)&plano_id=eq.${planoId}&lido=eq.true&order=data_leitura.desc`;
    
    if (dataInicio) {
      query += `&data_leitura=gte.${dataInicio}`;
    }
    if (dataFim) {
      query += `&data_leitura=lte.${dataFim}`;
    }
    
    return await supabaseCall(query);
  } catch (error) {
    console.error('Erro ao obter capítulos lidos:', error);
    throw error;
  }
};

// =====================================================
// FUNÇÕES PARA ESTATÍSTICAS
// =====================================================

export const obterEstatisticasPlano = async (planoId) => {
  try {
    const [progresso, checklist] = await Promise.all([
      supabaseCall(`progresso_leitura_diario?select=*&plano_id=eq.${planoId}`),
      supabaseCall(`capitulos_lidos_usuarios?select=*&plano_id=eq.${planoId}`)
    ]);

    const totalDias = progresso.length;
    const diasConcluidos = progresso.filter(p => p.concluido).length;
    const totalCapitulos = checklist.length;
    const capitulosLidos = checklist.filter(c => c.lido).length;
    const diasAtrasados = progresso.filter(p => p.atrasado).length;

    return {
      totalDias,
      diasConcluidos,
      totalCapitulos,
      capitulosLidos,
      diasAtrasados,
      percentualDias: totalDias > 0 ? Math.round((diasConcluidos / totalDias) * 100) : 0,
      percentualCapitulos: totalCapitulos > 0 ? Math.round((capitulosLidos / totalCapitulos) * 100) : 0,
      mediaCapitulosPorDia: totalDias > 0 ? Math.round(totalCapitulos / totalDias * 100) / 100 : 0
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas do plano:', error);
    throw error;
  }
};

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

export const calcularCapitulosRestantes = async (livroInicioId, capituloInicioNumero) => {
  try {
    const total = await callSqlFunction('total_capitulos_a_partir_de', {
      livro_inicio_id: livroInicioId,
      capitulo_inicio_numero: capituloInicioNumero
    });
    return total;
  } catch (error) {
    console.error('Erro ao calcular capítulos restantes:', error);
    throw error;
  }
};

export const obterDistribuicaoCapitulos = async (livroInicioId, capituloInicioNumero, duracaoDias) => {
  try {
    const distribuicao = await callSqlFunction('distribuir_capitulos_por_dias', {
      livro_inicio_id: livroInicioId,
      capitulo_inicio_numero: capituloInicioNumero,
      duracao_dias: duracaoDias
    });
    return distribuicao;
  } catch (error) {
    console.error('Erro ao obter distribuição de capítulos:', error);
    throw error;
  }
};

// =====================================================
// VALIDAÇÕES
// =====================================================

export const validarPontoInicio = async (livroId, capituloNumero) => {
  try {
    const capitulos = await supabaseCall(
      `capitulos?select=numero&livro_id=eq.${livroId}&numero=eq.${capituloNumero}`
    );
    return capitulos.length > 0;
  } catch (error) {
    console.error('Erro ao validar ponto de início:', error);
    return false;
  }
};

export const verificarPlanoExistente = async (usuarioEmail) => {
  try {
    const planos = await supabaseCall(
      `planos_leitura_usuarios?select=id&usuario_email=eq.${usuarioEmail}&ativo=eq.true`
    );
    return planos.length > 0;
  } catch (error) {
    console.error('Erro ao verificar plano existente:', error);
    return false;
  }
};

// =====================================================
// FUNÇÕES ADICIONAIS PARA PROGRESSO DETALHADO
// =====================================================

export const obterHistoricoProgresso = async (usuarioEmail, dias = 30) => {
  try {
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - dias);
    
    const historico = await supabaseCall(
      `progresso_leitura_diario?select=*&usuario_email=eq.${usuarioEmail}&data_leitura=gte.${dataInicio.toISOString().split('T')[0]}&order=data_leitura.asc`
    );
    
    return historico;
  } catch (error) {
    console.error('Erro ao obter histórico de progresso:', error);
    return [];
  }
};

export const obterMetasDiarias = async (usuarioEmail) => {
  try {
    const plano = await obterPlanoAtivo(usuarioEmail);
    if (!plano) return null;
    
    const estatisticas = await obterEstatisticasPlano(usuarioEmail);
    const diasRestantes = Math.ceil((new Date(plano.data_fim) - new Date()) / (1000 * 60 * 60 * 24));
    
    return {
      capitulosPorDia: Math.ceil(estatisticas.capitulosRestantes / Math.max(diasRestantes, 1)),
      diasRestantes,
      metaOriginal: plano.capitulos_por_dia
    };
  } catch (error) {
    console.error('Erro ao obter metas diárias:', error);
    return null;
  }
};

export const obterEstatisticasDetalhadas = async (usuarioEmail) => {
  try {
    const [plano, historico, estatisticas] = await Promise.all([
      obterPlanoAtivo(usuarioEmail),
      obterHistoricoProgresso(usuarioEmail, 7), // Últimos 7 dias
      obterEstatisticasPlano(usuarioEmail)
    ]);
    
    if (!plano) return null;
    
    // Calcular velocidade de leitura (capítulos por dia)
    const capitulosUltimos7Dias = historico.reduce((total, dia) => total + dia.capitulos_lidos, 0);
    const velocidadeLeitura = capitulosUltimos7Dias / 7;
    
    // Calcular tempo estimado para conclusão
    const diasParaConcluir = estatisticas.capitulosRestantes / Math.max(velocidadeLeitura, 0.1);
    const dataEstimadaConclusao = new Date();
    dataEstimadaConclusao.setDate(dataEstimadaConclusao.getDate() + Math.ceil(diasParaConcluir));
    
    // Calcular consistência (dias com leitura nos últimos 7 dias)
    const diasComLeitura = historico.filter(dia => dia.capitulos_lidos > 0).length;
    const consistencia = (diasComLeitura / 7) * 100;
    
    return {
      velocidadeLeitura: Math.round(velocidadeLeitura * 10) / 10,
      dataEstimadaConclusao: dataEstimadaConclusao.toISOString().split('T')[0],
      consistencia: Math.round(consistencia),
      diasConsecutivos: calcularDiasConsecutivos(historico),
      melhorSemana: Math.max(...historico.map(dia => dia.capitulos_lidos)),
      mediaCapitulosPorDia: Math.round((capitulosUltimos7Dias / 7) * 10) / 10
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas detalhadas:', error);
    return null;
  }
};

// Função auxiliar para calcular dias consecutivos de leitura
const calcularDiasConsecutivos = (historico) => {
  let consecutivos = 0;
  let maxConsecutivos = 0;
  
  // Ordenar por data decrescente para começar do mais recente
  const historicoOrdenado = [...historico].reverse();
  
  for (const dia of historicoOrdenado) {
    if (dia.capitulos_lidos > 0) {
      consecutivos++;
      maxConsecutivos = Math.max(maxConsecutivos, consecutivos);
    } else {
      consecutivos = 0;
    }
  }
  
  return maxConsecutivos;
};

// =====================================================
// FUNÇÕES ADICIONAIS PARA CHECKLIST
// =====================================================

export const obterChecklistCompleto = async (usuarioEmail) => {
  try {
    const plano = await obterPlanoAtivo(usuarioEmail);
    if (!plano) return [];
    
    // Obter todos os capítulos do plano
    const capitulos = await callSqlFunction('obter_capitulos_a_partir_de', {
      livro_inicio_id: plano.livro_inicio_id,
      capitulo_inicio_numero: plano.capitulo_inicio_numero
    });
    
    // Verificar se há capítulos disponíveis
    if (!capitulos || capitulos.length === 0) {
      console.warn('Nenhum capítulo encontrado para o plano. Verifique se os capítulos foram adicionados ao banco de dados.');
      return [];
    }
    
    // Obter capítulos já lidos
    const capitulosLidos = await obterCapitulosLidos(plano.id);
    const idsLidos = new Set(capitulosLidos.map(c => `${c.livro_id}-${c.capitulo_numero}`));
    
    // Combinar informações
    return capitulos.map(cap => ({
      ...cap,
      lido: idsLidos.has(`${cap.livro_id}-${cap.capitulo_numero}`)
    }));
  } catch (error) {
    console.error('Erro ao obter checklist completo:', error);
    return [];
  }
};

export const desmarcarCapituloLido = async (planoId, livroId, capituloNumero) => {
  try {
    // Usar a função SQL para desmarcar (marcar como false)
    const resultado = await callSqlFunction('marcar_capitulo_lido', {
      p_plano_id: planoId,
      p_livro_id: livroId,
      p_capitulo_numero: capituloNumero,
      p_lido: false
    });
    return resultado;
  } catch (error) {
    console.error('Erro ao desmarcar capítulo como lido:', error);
    throw error;
  }
};

export const obterProgressoDetalhado = async (usuarioEmail) => {
  try {
    const [plano, estatisticas, historico] = await Promise.all([
      obterPlanoAtivo(usuarioEmail),
      obterEstatisticasPlano(usuarioEmail),
      obterHistoricoProgresso(usuarioEmail, 30)
    ]);
    
    if (!plano) return null;
    
    const diasDecorridos = Math.ceil((new Date() - new Date(plano.data_inicio)) / (1000 * 60 * 60 * 24));
    const diasTotais = Math.ceil((new Date(plano.data_fim) - new Date(plano.data_inicio)) / (1000 * 60 * 60 * 24));
    
    return {
      plano,
      estatisticas,
      historico,
      diasDecorridos,
      diasTotais,
      porcentagemTempo: Math.round((diasDecorridos / diasTotais) * 100),
      porcentagemLeitura: Math.round((estatisticas.capitulosLidos / estatisticas.totalCapitulos) * 100),
      emDia: estatisticas.capitulosLidos >= (diasDecorridos * plano.capitulos_por_dia)
    };
  } catch (error) {
    console.error('Erro ao obter progresso detalhado:', error);
    return null;
  }
};