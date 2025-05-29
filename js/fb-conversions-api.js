// ==============================================
// FACEBOOK CONVERSIONS API INTEGRATION SCRIPT
// ==============================================

// ==============================================
// UTILITÁRIOS BASE
// ==============================================
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return undefined;
}

function setCookie(name, value, days = 365) {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function getExternalId() {
  let externalId = getCookie('fb_external_id');
  if (!externalId) {
    externalId = generateUUID();
    setCookie('fb_external_id', externalId, 365);
  }
  return externalId;
}

function getUrlParameters() {
  const params = {};
  const urlParams = new URLSearchParams(window.location.search);
  for (const [key, value] of urlParams) {
    params[key] = value;
  }
  return params;
}

function getFbclid() {
  const urlParams = getUrlParameters();
  return urlParams.fbclid || undefined;
}

// ==============================================
// INICIALIZAÇÃO E CONFIGURAÇÃO
// ==============================================
const API_BASE_URL = 'https://mornatti-conversions-api.up.railway.app'; // API no mesmo domínio.
const FACEBOOK_CONVERSIONS_CONFIG = {
  currency: 'BRL',
  debugMode: true, 
};

let globalUserData = {
  external_id: getExternalId(),
  fbp: getCookie('_fbp'),
  fbc: getCookie('_fbc') || getFbclid(),
  em: undefined,
  ph: undefined,
  fn: undefined,
  ln: undefined,
  faturamento: undefined,
};

function updateUserData(newData) {
  Object.assign(globalUserData, newData);
  localStorage.setItem('fb_user_data', JSON.stringify(globalUserData));
}

function loadUserData() {
  try {
    const stored = localStorage.getItem('fb_user_data');
    if (stored) {
      const data = JSON.parse(stored);
      data.fbc = getCookie('_fbc') || getFbclid() || data.fbc;
      data.fbp = getCookie('_fbp') || data.fbp;
      data.external_id = data.external_id || getExternalId(); // Ensure external_id is always populated
      Object.assign(globalUserData, data);
    }
  } catch (error) {
    console.error('FB CAPI: Erro ao carregar dados do usuário do localStorage:', error);
  }
}

function debugLog(message, data) {
  if (FACEBOOK_CONVERSIONS_CONFIG.debugMode) {
    console.log(`[FB CAPI] ${message}`, data !== undefined ? data : '');
  }
}

// ==============================================
// DEBUGGING E MONITORAMENTO (Avançado)
// ==============================================
const FBConversionsDebug = {
  enabled: FACEBOOK_CONVERSIONS_CONFIG.debugMode,
  log: function(level, message, data) {
    if (!this.enabled) return;
    const timestamp = new Date().toISOString();
    const prefix = `[FB CAPI ${level.toUpperCase()}] ${timestamp}`;
    switch(level) {
      case 'info': console.info(prefix, message, data !== undefined ? data : ''); break;
      case 'warn': console.warn(prefix, message, data !== undefined ? data : ''); break;
      case 'error': console.error(prefix, message, data !== undefined ? data : ''); break;
      default: console.log(prefix, message, data !== undefined ? data : '');
    }
  },
  info: function(message, data) { this.log('info', message, data); },
  warn: function(message, data) { this.log('warn', message, data); },
  error: function(message, data) { this.log('error', message, data); },
  showUserData: function() { 
    if (!this.enabled) { console.log("Debug mode is off. Call FBConversionsDebug.enableDebug() to see data."); return;}
    console.table(globalUserData); 
  },
  enableDebug: function() {
    FACEBOOK_CONVERSIONS_CONFIG.debugMode = true;
    this.enabled = true;
    console.log("%c🚀 Facebook Conversions API Debug Mode ATIVADO Manualmente", "background: #4267B2; color: white; padding: 10px; border-radius: 5px; font-weight: bold;");
  },
  disableDebug: function() {
    FACEBOOK_CONVERSIONS_CONFIG.debugMode = false;
    this.enabled = false;
    console.log("%c🛑 Facebook Conversions API Debug Mode DESATIVADO Manualmente", "background: #ff4d4d; color: white; padding: 10px; border-radius: 5px; font-weight: bold;");
  },
  testAPI: async function() {
    if (!this.enabled) { console.log("Debug mode is off. Call FBConversionsDebug.enableDebug() to test API."); return;}
    this.info('Testando conectividade com a API (endpoint /api/track/ping)...');
    try {
      // Assumindo que sua API tem um endpoint de PING em /api/track/ping ou similar
      // Se não, este teste falhará ou precisará ser ajustado.
      const response = await fetch(`${API_BASE_URL}/api/track/ping`, { method: 'POST', body: JSON.stringify({test: "ping"}) });
      if (response.ok) {
        const result = await response.json();
        this.info('API Ping Test bem-sucedido!', result);
        return true;
      } else {
        this.error('API Ping Test retornou erro', { status: response.status, statusText: response.statusText });
        try{
            const errorBody = await response.text();
            this.error('Corpo da resposta do erro do Ping Test:', errorBody);
        } catch(e){}
        return false;
      }
    } catch (error) {
      this.error('Erro de rede ao testar API Ping Test', error);
      return false;
    }
  }
};
window.FBConversionsDebug = FBConversionsDebug; // Expor para o console global

function validateConfiguration() {
  const issues = [];
  if (!globalUserData.external_id) issues.push('external_id não foi gerado/carregado.');
  
  if (FACEBOOK_CONVERSIONS_CONFIG.debugMode) {
      if (!globalUserData.fbp && !globalUserData.fbc) {
        FBConversionsDebug.warn('Nenhum identificador do Facebook (_fbp/_fbc) encontrado inicialmente. Isso é normal na primeira visita ou se os cookies foram limpos. O Pixel deve defini-los. Verifique se o Pixel está inicializado ANTES deste script.');
      }
      if (API_BASE_URL === 'https://sua-api-id.up.railway.app' || API_BASE_URL === 'COLOQUE_A_URL_DA_SUA_API_AQUI') {
        FBConversionsDebug.warn('API_BASE_URL parece ser um placeholder. Configure-a corretamente se sua API não estiver no mesmo domínio.');
      }
  }

  if (issues.length > 0) {
    FBConversionsDebug.error('Problemas CRÍTICOS de configuração detectados. Eventos podem não ser rastreados corretamente:', issues);
  } else {
    FBConversionsDebug.info('Configuração básica da CAPI validada com sucesso.');
  }
}

// ==============================================
// FUNÇÃO DE ENVIO DUAL (PIXEL + CAPI)
// ==============================================
async function sendDualEvent(eventName, pixelParams, capiPayloadBuilder) {
  const eventId = generateUUID();
  
  if (typeof fbq !== 'undefined') {
    fbq('track', eventName, pixelParams, { eventID: eventId });
    debugLog(`Pixel ${eventName} enviado`, { eventId, pixelData: pixelParams });
  } else {
    FBConversionsDebug.warn(`fbq (Facebook Pixel) não definido. Evento Pixel ${eventName} não enviado.`);
  }
  
  const capiPayload = capiPayloadBuilder(eventId);
  // Assegurar que userData no payload CAPI não tenha campos nulos ou arrays vazios
  if (capiPayload.userData) {
      Object.keys(capiPayload.userData).forEach(key => {
        const value = capiPayload.userData[key];
        if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) {
          delete capiPayload.userData[key];
        }
      });
  }
  
  let endpoint;
  switch(eventName.toLowerCase()) { //toLowerCase para robustez
    case 'pageview': endpoint = 'pageview'; break;
    case 'viewcontent': endpoint = 'viewcontent'; break;
    case 'initiatecheckout': endpoint = 'initiatecheckout'; break;
    case 'lead': endpoint = 'lead'; break;
    // Adicione outros eventos padrões ou customizados aqui
    // case 'purchase': endpoint = 'purchase'; break; 
    // case 'addtocart': endpoint = 'addtocart'; break;
    default:
      FBConversionsDebug.warn(`Evento CAPI "${eventName}" não possui um endpoint mapeado em sendDualEvent. Enviando para /api/track/custom com eventName como parâmetro.`);
      // Fallback para um endpoint genérico de evento customizado se necessário, ou simplesmente não enviar.
      // Para este exemplo, vamos assumir que um endpoint customizado não existe e não enviar.
      // endpoint = `custom?event_name=${encodeURIComponent(eventName)}`; 
      // Ajuste: Não enviar se não mapeado para evitar erros.
      console.warn(`Evento CAPI "${eventName}" não mapeado e não será enviado pela CAPI.`);
      return; 
  }
  
  if (endpoint) {
    try {
      debugLog(`Enviando CAPI ${eventName}`, { endpoint: `${API_BASE_URL}/api/track/${endpoint}`, payload: capiPayload });
      const response = await fetch(`${API_BASE_URL}/api/track/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(capiPayload)
      });
      const result = await response.json();
      if (response.ok && result.success) { // Verificar result.success se a API o retornar
        FBConversionsDebug.info(`CAPI ${eventName} enviado com sucesso!`, { eventId, fbtrace_id: result.fbtrace_id, diagnostics: result.diagnostics, response: result });
      } else {
        FBConversionsDebug.error(`Erro no CAPI ${eventName}`, { status: response.status, errorData: result, payload: capiPayload });
      }
    } catch (error) {
      FBConversionsDebug.error(`Erro de REDE ao enviar CAPI ${eventName}`, { error, payload: capiPayload });
    }
  }
}

// ==============================================
// EVENT HANDLERS ESPECÍFICOS
// ==============================================

// --- PageView Event ---
async function sendCapiPageViewOnly(eventIdOverride) { // Renomeado para evitar conflito se sendPageViewEvent for usado para dual
  const eventId = eventIdOverride || generateUUID();
  const urlParameters = getUrlParameters();
  
  if (getFbclid()) { // Atualiza fbc se fbclid estiver na URL
    globalUserData.fbc = getFbclid();
    updateUserData({ fbc: getFbclid() });
  }

  const payload = {
    eventId: eventId,
    userData: {
      external_id: globalUserData.external_id ? [globalUserData.external_id] : undefined,
      em: globalUserData.em ? [globalUserData.em] : undefined,
      ph: globalUserData.ph ? [globalUserData.ph] : undefined,
      fn: globalUserData.fn ? [globalUserData.fn] : undefined,
      ln: globalUserData.ln ? [globalUserData.ln] : undefined,
      fbc: globalUserData.fbc || undefined,
      fbp: globalUserData.fbp || undefined,
    },
    eventSourceUrl: window.location.href,
    urlParameters: urlParameters,
    actionSource: 'website'
  };

  Object.keys(payload.userData).forEach(key => {
    if (payload.userData[key] === undefined || (Array.isArray(payload.userData[key]) && payload.userData[key].length === 0)) {
      delete payload.userData[key];
    }
  });

  try {
    debugLog('Enviando PageView (CAPI Only)', payload);
    const response = await fetch(`${API_BASE_URL}/api/track/pageview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (response.ok && result.success) {
      FBConversionsDebug.info('PageView (CAPI Only) enviado com sucesso', { eventId, fbtrace_id: result.fbtrace_id, diagnostics: result.diagnostics });
    } else {
      FBConversionsDebug.error('Erro no PageView (CAPI Only)', { status: response.status, errorData: result, payload });
    }
  } catch (error) {
    FBConversionsDebug.error('Erro de REDE ao enviar PageView (CAPI Only)', { error, payload });
  }
}

// --- ViewContent Event (CTA Section) ---
async function triggerViewContentForCTA() {
  debugLog('Disparando ViewContent para CTA');
  const productData = {
    name: 'Passaporte Aceleração CTA',
    category: 'Landing Page CTA',
    id: 'passaporte_cta_view',
    price: 0,
  };

  const pixelParams = {
    content_name: productData.name,
    content_ids: [productData.id],
    content_category: productData.category,
    content_type: 'product', // O Pixel espera content_type para ViewContent
    value: productData.price,
    currency: FACEBOOK_CONVERSIONS_CONFIG.currency
  };

  const capiPayloadBuilder = (eventId) => ({
    eventId: eventId,
    userData: { ...globalUserData }, // Passa uma cópia dos dados globais
    customData: {
      content_name: productData.name,
      content_category: productData.category,
      content_ids: [productData.id],
      content_type: 'product',
      contents: [{ id: productData.id, quantity: 1, item_price: productData.price }],
      value: productData.price,
      currency: FACEBOOK_CONVERSIONS_CONFIG.currency,
      num_items: 1
    },
    eventSourceUrl: window.location.href,
    urlParameters: getUrlParameters(),
    actionSource: 'website'
  });

  await sendDualEvent('ViewContent', pixelParams, capiPayloadBuilder);
}

// --- Lead Event (Form Submission) ---
async function triggerLeadEvent(formData) {
  // 1. Processar dados do formulário e atualizar globalUserData
  const fullName = formData.nome.trim();
  const nameParts = fullName.split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ') || firstName;

  const piiData = {
    em: formData.email.trim().toLowerCase(),
    ph: formData.telefone.replace(/\D/g, ''),
    fn: firstName,
    ln: lastName,
    faturamento: formData.faturamento,
  };
  updateUserData(piiData); // Atualiza globalUserData e localStorage
  debugLog('Dados do usuário atualizados (pré-Lead)', globalUserData);

  // 2. Preparar e enviar evento Lead
  const leadContentName = 'Lead Passaporte Aceleração';
  const pixelParams = { // Pixel espera 'content_name' para o evento Lead
    content_name: leadContentName,
    currency: FACEBOOK_CONVERSIONS_CONFIG.currency, // opcional, mas bom ter
    // value: 0 // opcional
  };

  const capiPayloadBuilder = (eventId) => ({
    eventId: eventId,
    userData: { ...globalUserData }, // Usa os dados atualizados
    customData: {
      content_name: leadContentName,
      content_category: 'Lead',
      lead_source: 'website_form',
      form_name: 'capture-form',
      faturamento_medio_mensal: globalUserData.faturamento, // Incluindo o faturamento
      // value e currency podem ser omitidos ou definidos. Ex: value: 0 para lead gratuito.
    },
    eventSourceUrl: window.location.href,
    urlParameters: getUrlParameters(),
    actionSource: 'website'
  });

  await sendDualEvent('Lead', pixelParams, capiPayloadBuilder);
}


// ==============================================
// INICIALIZAÇÃO E EVENT LISTENERS GLOBAIS
// ==============================================
document.addEventListener('DOMContentLoaded', function() {
  loadUserData(); // Carrega dados do usuário do localStorage
  debugLog('FB CAPI Script Inicializado. UserData carregado:', globalUserData);
  if (FACEBOOK_CONVERSIONS_CONFIG.debugMode) {
    console.log('%c🚀 Facebook Conversions API Debug Mode Ativo (js/fb-conversions-api.js)', 'background: #4267B2; color: white; padding: 10px; border-radius: 5px; font-weight: bold;');
    console.log('Use FBConversionsDebug.showUserData() ou FBConversionsDebug.enableDebug() no console para ver dados/logs.');
  }
  setTimeout(validateConfiguration, 500); // Valida configuração após um breve delay

  // PageView CAPI (Pixel PageView já está no <head>)
  // Adia um pouco para garantir que fbp/fbc do Pixel estejam disponíveis
  window.addEventListener('load', function() {
      setTimeout(async () => {
          // Atualiza fbp e fbc dos cookies caso o Pixel os tenha definido/atualizado
          globalUserData.fbp = getCookie('_fbp') || globalUserData.fbp;
          globalUserData.fbc = getCookie('_fbc') || getFbclid() || globalUserData.fbc; // Prioriza fbclid da URL atual
          updateUserData({}); // Para salvar fbp/fbc atualizados no localStorage
          debugLog('Dados de usuário atualizados com _fbp/_fbc antes do PageView CAPI', globalUserData);
          await sendCapiPageViewOnly();
      }, 700); // Aumentado o delay para segurança
  });

  // ViewContent para a seção CTA
  const ctaSection = document.getElementById('resgate');
  let viewContentForCTASent = false;
  if (ctaSection) {
    const observerOptions = { root: null, rootMargin: '0px', threshold: 0.5 };
    const observerCallback = (entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !viewContentForCTASent) {
          debugLog('CTA Section (#resgate) está visível, disparando ViewContent.');
          triggerViewContentForCTA();
          viewContentForCTASent = true;
          observer.unobserve(entry.target);
        }
      });
    };
    const ctaObserver = new IntersectionObserver(observerCallback, observerOptions);
    ctaObserver.observe(ctaSection);
  } else {
    FBConversionsDebug.warn("Seção CTA com id 'resgate' não encontrada para o evento ViewContent.");
  }

  // Lead Event no submit do formulário
  // A lógica de submissão principal (incluindo fetch para webhook) está em main-logic.js
  // Aqui, adicionamos um listener que se integra a essa lógica existente.
  // Idealmente, main-logic.js chamaria uma função daqui após a validação bem-sucedida.
  // Por ora, vamos adicionar um listener que dispara ANTES da submissão principal,
  // confiando que a validação em main-logic.js impedirá o envio se o form for inválido.

  const leadForm = document.getElementById('capture-form');
  if (leadForm) {
      // Este listener será para capturar os dados e enviar o evento Lead ANTES da submissão principal
      // que é gerenciada por main-logic.js (que faz o POST para o Webhook e redirecionamento).
      // A função triggerLeadEvent será chamada a partir do main-logic.js

      // O addEventListener para 'submit' em main-logic.js já existe.
      // Precisamos modificar main-logic.js para chamar triggerLeadEvent.
      // Como não posso editar main-logic.js diretamente agora, vou deixar um placeholder
      // e um comentário sobre como integrar.

      // **NOTA PARA INTEGRAÇÃO MANUAL em js/main-logic.js:**
      // Dentro do event listener de 'submit' do 'capture-form' em js/main-logic.js,
      // APÓS a validação bem-sucedida e ANTES do fetch para o webhookUrl,
      // adicione a chamada para a função de evento Lead da CAPI:
      //
      // Exemplo de como ficaria em main-logic.js:
      //
      // if (!form.checkValidity()) {
      //   // ... (código de tratamento de erro de validação) ...
      //   return;
      // }
      //
      // // !!! INÍCIO DA MODIFICAÇÃO SUGERIDA !!!
      // if (typeof triggerLeadEvent === 'function') {
      //   const leadFormData = {
      //     nome: document.getElementById('nome').value,
      //     email: document.getElementById('email').value,
      //     telefone: document.getElementById('telefone').value,
      //     faturamento: document.getElementById('faturamento').value
      //   };
      //   try {
      //      await triggerLeadEvent(leadFormData); // Chama a função do fb-conversions-api.js
      //      FBConversionsDebug.info('Evento Lead CAPI/Pixel disparado com sucesso via main-logic.js');
      //   } catch (leadEventError) {
      //      FBConversionsDebug.error('Erro ao disparar evento Lead CAPI/Pixel via main-logic.js', leadEventError);
      //   }
      // } else {
      //   FBConversionsDebug.warn('Função triggerLeadEvent não encontrada. O evento Lead da CAPI pode não ter sido disparado.');
      // }
      // // !!! FIM DA MODIFICAÇÃO SUGERIDA !!!
      //
      // // Desabilita botão e mostra loading
      // submitButton.disabled = true;
      // // ... (resto do código de submissão do formulário em main-logic.js) ...

      debugLog("Listener para Lead event no 'capture-form' configurado. A chamada efetiva a triggerLeadEvent deve ser feita a partir de main-logic.js.");

  } else {
    FBConversionsDebug.warn("Formulário com id 'capture-form' não encontrado para o evento Lead.");
  }
}); 