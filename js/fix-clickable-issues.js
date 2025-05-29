// Função para corrigir botões não clicáveis
function fixClickableIssues() {
    console.log("Verificando e corrigindo problemas de clique...");
    const submitBtn = document.getElementById('cta-submit-button');
    
    if (submitBtn) {
        // Remova qualquer transformação que possa estar causando problemas
        submitBtn.style.transform = 'none';
        submitBtn.style.zIndex = '999';
        submitBtn.style.position = 'relative';
        submitBtn.style.pointerEvents = 'auto';
        submitBtn.style.cursor = 'pointer';
        
        // Adicionar um handler de clique direto ao botão
        submitBtn.onclick = function(e) {
            console.log("Botão clicado diretamente!");
            e.preventDefault();
            const form = document.getElementById('capture-form');
            if (form) {
                console.log("Enviando formulário...");
                form.dispatchEvent(new Event('submit'));
            }
        };
        
        console.log("Botão ajustado para ser clicável:", submitBtn);
    }
}

// Execute logo após carregamento da página
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(fixClickableIssues, 100);
} else {
    document.addEventListener('DOMContentLoaded', fixClickableIssues);
} 