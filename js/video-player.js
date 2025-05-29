document.addEventListener('DOMContentLoaded', function() {
    const video = document.getElementById('hero-video');
    const playBtn = document.getElementById('play-btn');
    const progressBar = document.querySelector('.progress-complete');
    const videoTime = document.querySelector('.video-time');
    
    // Esconder o botão de play e overlay quando o vídeo iniciar
    playBtn.addEventListener('click', function() {
        if (video.paused) {
            video.play()
            .then(() => {
                playBtn.style.display = 'none';
                document.querySelector('.video-thumbnail-overlay').style.display = 'none';
            })
            .catch(err => {
                console.error('Erro ao reproduzir vídeo:', err);
                // Manter os controles visíveis em caso de erro
            });
        } else {
            video.pause();
            playBtn.style.display = 'flex';
            document.querySelector('.video-thumbnail-overlay').style.display = 'block';
        }
    });
    
    // Mostrar o botão de play quando o vídeo parar
    video.addEventListener('pause', function() {
        playBtn.style.display = 'flex';
    });
    
    // Atualizar a barra de progresso durante a reprodução
    video.addEventListener('timeupdate', function() {
        const progress = (video.currentTime / video.duration) * 100;
        progressBar.style.width = progress + '%';
        
        // Atualizar o tempo exibido
        const minutes = Math.floor(video.currentTime / 60);
        const seconds = Math.floor(video.currentTime % 60);
        videoTime.textContent = minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
    });
    
    // Reiniciar o vídeo quando terminar
    video.addEventListener('ended', function() {
        video.currentTime = 0;
        playBtn.style.display = 'flex';
        document.querySelector('.video-thumbnail-overlay').style.display = 'block';
        progressBar.style.width = '0%';
        videoTime.textContent = '0:00';
    });
    
    // Corrigir o problema inicial da barra de progresso
    progressBar.style.width = '0%';
    
    // Permitir clicar diretamente no vídeo para pausar/reproduzir
    video.addEventListener('click', function() {
        if (video.paused) {
            video.play();
            playBtn.style.display = 'none';
            document.querySelector('.video-thumbnail-overlay').style.display = 'none';
        } else {
            video.pause();
            playBtn.style.display = 'flex';
            document.querySelector('.video-thumbnail-overlay').style.display = 'block';
        }
    });
}); 