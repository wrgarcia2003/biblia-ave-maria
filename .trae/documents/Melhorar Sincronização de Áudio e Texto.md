**Diagnóstico**
- Reprodução usa `<audio>` com `onTimeUpdate` em `src/App.jsx:1848` e atualiza `tempoAtual` em `src/App.jsx:486–488`.
- Destaque de texto calcula `versiculoAtivo` com `tempoAjustado = tempoAtual + delaySync` em `src/App.jsx:316` e mapeia para `tempo_inicio/tempo_fim`.
- Timestamps automáticos são gerados de forma uniforme/proporcional em `src/App.jsx:1116–1217`, o que tende a desincronizar quando o ritmo da locução varia.

**Objetivo**
- Garantir que o versículo destacado acompanhe fielmente a fala do MP3, sem drift perceptível e com atualização suave.

**Ajustes Rápidos (baixo risco)**
- Substituir `onTimeUpdate` por loop de sincronização com `requestAnimationFrame` lendo `audioRef.current.currentTime`:
  - Manter `tempoAtual` em um `ref` e só fazer `setTempoAtual` em intervalos reduzidos (p.ex. 10–15 fps) ou quando o índice mudar.
  - Usar o relógio do elemento de mídia como fonte da verdade para evitar drift de timers.
- Recalcular `versiculoAtivo` de forma eficiente:
  - Pré‑computar array de `inicios` e usar busca binária para encontrar o índice com base em `currentTime + delaySync`.
  - Atualizar apenas quando cruzar limites de início/fim para reduzir jitter.
- Persistir `delaySync` por capítulo (offset global), evitando ajustar toda vez:
  - Salvar em `capitulo` e aplicar ao carregar o áudio.

**Melhoria de Qualidade dos Timestamps (médio/alto impacto)**
- Gerar timestamps precisos via alinhamento forçado (STT com timestamps):
  - Usar `Whisper`/`whisper-timestamped` para obter tempos por palavra/frase do áudio em PT‑BR.
  - Agrupar tokens pelas fronteiras dos versículos e gravar `tempo_inicio/tempo_fim` no Supabase.
  - Tratar diferenças de texto (pontuação/acentos) com normalização antes do alinhamento.
- Alternativa WebVTT:
  - Exportar os tempos de versículo para um arquivo `.vtt` com cues por versículo.
  - Anexar `<track kind="metadata" src="...">` ao `<audio>` e usar `textTracks[0].oncuechange` para dirigir `versiculoAtivo` (o motor de mídia gerencia o tempo, reduzindo drift).

**UI para Calibração Manual (fallback confiável)**
- Adicionar modo de gravação de marcas:
  - Atalhos: "definir início do versículo atual" captura `audio.currentTime` e avança.
  - Controles de nudge (±100 ms) por versículo para ajustes finos.
  - Botão de salvar que atualiza `tempo_inicio/tempo_fim` no banco.

**Integração no Código (pontos de troca)**
- Loop de sync: substituir `onTimeUpdate` em `src/App.jsx:1848` por efeito que inicia/paralisa o RAF em `onPlay/onPause/onEnded`.
- Cálculo de índice: criar utilitário de busca binária e usar no efeito de sync (substitui lógica atual em `src/App.jsx:316–362`).
- Persistência de `delaySync`: adicionar leitura/escrita ao carregar/salvar capítulo.
- WebVTT (opcional): adicionar `<track>` ao `<audio>` e handler de `oncuechange` mapeando cue → índice.

**Validação**
- Testar com 3 capítulos: curto, médio, longo; medir drift após 1, 5 e 15 minutos.
- Verificar suavidade do auto‑scroll e estabilidade de `versiculoAtivo` (sem piscar).
- Garantir que ajuste de velocidade (`playbackRate`) mantém sincronização baseada no clock do `<audio>`.

**Riscos e Mitigação**
- STT pode não casar 100% com o texto; mitigar com normalização e UI de nudge.
- WebVTT requer publicar/servir o `.vtt`; mitigar gerando a partir do próprio banco.
- Perfomance: limitar re‑renders usando `refs` e atualizações somente quando o índice muda.

Confirma se podemos seguir com: (1) loop de sync por `requestAnimationFrame` + busca binária e persistência de `delaySync`; (2) pipeline de alinhamento com Whisper para refinar os timestamps; e (3) opção WebVTT/`TextTrack` para robustez.