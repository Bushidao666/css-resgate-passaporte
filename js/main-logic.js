document.documentElement.lang = 'pt-BR'; // Confirma o idioma

document.addEventListener('DOMContentLoaded', () => {
    // Animações com Intersection Observer (mantido como no original)
    const useReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!useReducedMotion && 'IntersectionObserver' in window) {
        const observerOptions = { root: null, rootMargin: '0px 0px -12% 0px', threshold: 0.1 };
        const observerCallback = (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        };
        const intersectionObserver = new IntersectionObserver(observerCallback, observerOptions);
        const elementsToAnimate = document.querySelectorAll('[data-animate]');
        elementsToAnimate.forEach(el => intersectionObserver.observe(el));
    } else {
        document.querySelectorAll('[data-animate]').forEach(el => el.classList.add('is-visible'));
    }

    // Atualiza o ano no footer (mantido)
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) { yearSpan.textContent = new Date().getFullYear(); }

    // Máscara de telefone com iMask - Garantir que a biblioteca esteja carregada
    setTimeout(() => {
        const phoneInput = document.getElementById('telefone');
        if (phoneInput && typeof IMask !== 'undefined') {
            try {
                IMask(phoneInput, { mask: '(00) 00000-0000' });
            } catch (e) {
                console.error("IMask Error:", e);
            }
        } else if (phoneInput && typeof IMask === 'undefined') {
            console.warn("IMask library not loaded or failed. Phone masking disabled.");
        }
    }, 500); // Pequeno atraso para garantir que IMask esteja carregado
    
    // Sistema de Tabs para benefícios
    const initTabs = () => {
        const tabButtons = document.querySelectorAll('.benefit-tab');
        const tabContents = document.querySelectorAll('.benefit-tab-content');
        
        if (tabButtons.length === 0 || tabContents.length === 0) return;
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove classe active de todas as tabs
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Adiciona classe active à tab clicada
                button.classList.add('active');
                
                // Ativa o conteúdo correspondente
                const targetId = `${button.dataset.target}-content`;
                const targetContent = document.getElementById(targetId);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            });
        });
    };
    
    // Links de rolagem suave
    const initSmoothScroll = () => {
        const smoothScrollLinks = document.querySelectorAll('a[href^="#"]');
        smoothScrollLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const targetId = link.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    e.preventDefault();
                    const offsetTop = targetElement.getBoundingClientRect().top + window.pageYOffset;
                    
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            });
        });
    };
    
    // Inicializa todas as funcionalidades
    initTabs();
    initSmoothScroll();

    // Lógica para label flutuante (mantido e verificado)
    const formGroups = document.querySelectorAll('.capture-form .form-group');
    formGroups.forEach(group => {
        const input = group.querySelector('input, select');
        if (input) {
            const checkValue = () => {
                let hasValue = false;
                // Trata select e input de forma diferente para placeholder/valor inicial
                if (input.tagName === 'SELECT') {
                     // Considera valor selecionado se não for o valor vazio/disabled inicial
                    hasValue = input.value !== "" && input.value !== null && input.selectedIndex > 0;
                } else {
                    hasValue = input.value.trim() !== "";
                }
                group.classList.toggle('has-value', hasValue);
            };

            input.addEventListener('input', checkValue);
            input.addEventListener('change', checkValue); // Importante para select
            input.addEventListener('focus', () => group.classList.add('is-focused'));
            input.addEventListener('blur', () => { group.classList.remove('is-focused'); checkValue(); });

            // Verifica o valor inicial ao carregar a página (importante para autofill)
             setTimeout(checkValue, 50); // Delay para browser autofill
             checkValue(); // Checa imediatamente também
        }
    });

    // Lógica de submissão do formulário - corrigido
    const form = document.getElementById('capture-form');
    const submitButton = document.getElementById('cta-submit-button');
    const buttonTextSpan = submitButton ? submitButton.querySelector('.button-text') : null;
    const formStatus = document.getElementById('form-status');

    console.log("Form elements:", { form, submitButton, buttonTextSpan, formStatus });

    if (form && submitButton && buttonTextSpan && formStatus) {
        // Certifique-se de que o botão não esteja desabilitado inicialmente
        submitButton.disabled = false;
        submitButton.classList.remove('is-loading');
        
        const webhookUrl = 'https://dozeroao100k.up.railway.app/webhook/resgate-passaporte'; // Substitua se necessário
        const redirectUrl = 'https://dozeroa100k.com.br/obrigado-passaporte/'; // Substitua se necessário
        
        form.addEventListener('submit', async (event) => {
            console.log("Form submission triggered");
            event.preventDefault();
            form.classList.remove('was-validated'); // Limpa validação anterior
            formStatus.style.display = 'none';
            formStatus.className = '';
            formStatus.textContent = '';

            // Validação HTML5 nativa
            if (!form.checkValidity()) {
                 form.reportValidity(); // Mostra balões de erro do navegador
                 form.classList.add('was-validated'); // Adiciona classe para estilização de erro customizada

                 const firstInvalid = form.querySelector(':invalid');
                 let errorMsg = 'Ops! Verifique os campos destacados em vermelho.';
                  if(firstInvalid) {
                      const fieldLabel = form.querySelector(`label[for='${firstInvalid.id}']`);
                      const fieldName = fieldLabel ? fieldLabel.textContent.replace(':', '').trim() : 'o campo inválido';
                      errorMsg = `Por favor, verifique o campo "${fieldName}".`;
                      firstInvalid.focus(); // Foca no primeiro campo inválido
                  }

                 formStatus.textContent = errorMsg;
                 formStatus.className = 'error';
                 formStatus.style.display = 'block';
                 return; // Interrompe o envio
            }

            // !!! INÍCIO DA INTEGRAÇÃO COM FB CONVERSIONS API !!!
            if (typeof triggerLeadEvent === 'function') {
              const leadFormData = {
                nome: document.getElementById('nome').value,
                email: document.getElementById('email').value,
                telefone: document.getElementById('telefone').value,
                faturamento: document.getElementById('faturamento').value
              };
              try {
                 await triggerLeadEvent(leadFormData); // Chama a função do fb-conversions-api.js
                 if (typeof FBConversionsDebug !== 'undefined' && FBConversionsDebug.enabled) {
                    FBConversionsDebug.info('Evento Lead (FB CAPI/Pixel) disparado com sucesso a partir do main-logic.js');
                 }
              } catch (leadEventError) {
                 if (typeof FBConversionsDebug !== 'undefined' && FBConversionsDebug.enabled) {
                    FBConversionsDebug.error('Erro ao disparar evento Lead (FB CAPI/Pixel) a partir do main-logic.js', leadEventError);
                 }
              }
            } else {
              if (typeof FBConversionsDebug !== 'undefined' && FBConversionsDebug.enabled) {
                FBConversionsDebug.warn('Função triggerLeadEvent (fb-conversions-api.js) não encontrada. O evento Lead da CAPI pode não ter sido disparado.');
              }
            }
            // !!! FIM DA INTEGRAÇÃO COM FB CONVERSIONS API !!!

            // Desabilita botão e mostra loading
            submitButton.disabled = true;
            submitButton.classList.add('is-loading');
            const originalButtonText = buttonTextSpan.textContent;
            buttonTextSpan.textContent = 'Enviando...';

            const formData = new FormData(form);
            const data = {};
            formData.forEach((value, key) => { data[key] = String(value).trim(); });

            try {
                console.log("Enviando dados:", data);
                
                // Log para depuração
                console.log("Enviando para webhook:", webhookUrl);
                
                const response = await fetch(webhookUrl, {
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify(data),
                    mode: 'cors', // Permitir CORS para endpoints externos
                    credentials: 'same-origin'
                });
                
                console.log("Resposta recebida:", response);

                if (response.ok) {
                    formStatus.textContent = 'Sucesso! Seu acesso está a caminho. Redirecionando...';
                    formStatus.className = 'success';
                    formStatus.style.display = 'block';
                    form.reset(); // Limpa o formulário
                    form.classList.remove('was-validated');
                    // Reseta estado visual dos labels flutuantes
                    formGroups.forEach(group => {
                       group.classList.remove('has-value', 'is-focused');
                    });

                    // --- RASTREAMENTO (Exemplos - Substitua pelos seus IDs/Eventos) ---
                    // Facebook Pixel Lead Event
                    try { if(typeof fbq === 'function') fbq('track', 'Lead'); } catch(e) { console.warn('FBQ Lead track error', e)}
                    // Google Ads Conversion Event (Exemplo - Use seu Conversion ID e Label)
                    // try { if(typeof gtag === 'function') gtag('event', 'conversion', {'send_to': 'AW-CONVERSION_ID/CONVERSION_LABEL'}); } catch(e) { console.warn('GTAG Lead track error', e)}
                    // --------------------------------------------------------------------

                    // Redireciona após um pequeno delay
                    setTimeout(() => {
                        try { window.location.href = redirectUrl; }
                        catch(e){
                          console.error("Redirect failed:", e);
                          // Fallback se o redirecionamento falhar
                          formStatus.textContent = `Sucesso! Acesse seu material em: ${redirectUrl}`;
                          submitButton.style.display = 'none'; // Esconde botão se redirecionamento falhar
                        }
                    }, 1800); // Delay de 1.8 segundos

                } else {
                    // Tratamento de erro da API
                    let errorMessage = `Erro ao enviar (${response.status}). Tente novamente ou contate o suporte.`;
                    try {
                         const errorData = await response.json();
                         if (errorData && errorData.message) { errorMessage = `Erro: ${errorData.message}`; }
                     } catch (jsonError) { /* Mantém mensagem genérica se não conseguir ler JSON */ }
                    formStatus.textContent = errorMessage;
                    formStatus.className = 'error';
                    formStatus.style.display = 'block';
                    submitButton.disabled = false;
                    submitButton.classList.remove('is-loading');
                    buttonTextSpan.textContent = originalButtonText;
                }
            } catch (error) {
                // Tratamento de erro de rede/fetch
                console.error("Fetch Error:", error);
                
                // Fornecer informações mais detalhadas sobre o erro
                let errorMessage = 'Falha na conexão. Verifique sua internet e tente novamente.';
                
                // Tratar cors e outros erros comuns
                if (error.name === 'TypeError' && error.message.includes('NetworkError')) {
                    errorMessage = 'Erro de rede ao tentar enviar. Pode ser um problema de CORS ou com o servidor.';
                    
                    // Oferecer uma alternativa manual
                    console.log("Dados do formulário para envio manual:", data);
                    errorMessage += ' Tente novamente em alguns instantes.';
                }
                
                formStatus.textContent = errorMessage;
                formStatus.className = 'error';
                formStatus.style.display = 'block';
                submitButton.disabled = false;
                submitButton.classList.remove('is-loading');
                buttonTextSpan.textContent = originalButtonText;
            }
        });
    } else {
        console.error("Elementos essenciais do formulário não encontrados (form, submit button, status div). Submissão indisponível.");
    }
}); 