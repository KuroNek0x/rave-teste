const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configurações da API TMDb
const TMDB_API_KEY = '8331b7c22582c64b1364ab6eb6459690';
const TMDB_BEARER_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4MzMxYjdjMjI1ODJjNjRiMTM2NGFiNmViNjQ1OTY5MCIsIm5iZiI6MTc0MTA0MjkzNi45NTEsInN1YiI6IjY3YzYzNGY4YTMyNzdhYjRhMWU3OTkyNyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ._UErJzRLao_apXvcbop7U1AIrztPN0h4fult0aan2jE';

// Função para buscar dados do filme na API TMDb
async function buscarFilmeTMDb(movieId) {
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?language=pt-BR`, {
      headers: {
        'Authorization': `Bearer ${TMDB_BEARER_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro na API TMDb: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar filme no TMDb:', error);
    throw error;
  }
}

// Função para extrair ID do Google Drive
function extrairIdDrive(linkDrive) {
  // Aceita vários formatos de link do Google Drive
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9-_]+)/,
    /id=([a-zA-Z0-9-_]+)/,
    /\/d\/([a-zA-Z0-9-_]+)/
  ];
  
  for (const pattern of patterns) {
    const match = linkDrive.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  // Se não encontrar padrão, assume que já é o ID
  return linkDrive;
}

// Função para ler arquivo JSON
async function lerFilmes() {
  try {
    const data = await fs.readFile('filmes.json', 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Função para salvar filmes no JSON
async function salvarFilmes(filmes) {
  await fs.writeFile('filmes.json', JSON.stringify(filmes, null, 2));
}

// Função para gerar página HTML do filme
async function gerarPaginaFilme(filme) {
  const templateHTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${filme.nome}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        netflix: '#E50914',
                        dark: '#141414',
                        'dark-gray': '#2a2a2a'
                    }
                }
            }
        }
    </script>
</head>
<body class="bg-dark text-white min-h-screen">
    <!-- Header -->
    <header class="bg-black bg-opacity-90 fixed w-full top-0 z-50 backdrop-blur-sm">
        <div class="container mx-auto px-4 py-4">
            <div class="flex items-center justify-between">
                <a href="/" class="text-netflix text-2xl font-bold">MovieCatalog</a>
                <a href="/" class="bg-netflix text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                    ← Voltar ao Catálogo
                </a>
            </div>
        </div>
    </header>

    <!-- Conteúdo Principal -->
    <main class="pt-24 pb-12">
        <div class="container mx-auto px-4">
            <!-- Hero Section -->
            <div class="grid md:grid-cols-3 gap-8 mb-12">
                <!-- Poster -->
                <div class="md:col-span-1">
                    <div class="sticky top-28">
                        <img src="${filme.poster}" 
                             alt="${filme.nome}" 
                             class="w-full rounded-lg shadow-2xl hover:scale-105 transition-transform duration-300">
                    </div>
                </div>
                
                <!-- Informações -->
                <div class="md:col-span-2 space-y-6">
                    <div>
                        <h1 class="text-4xl md:text-6xl font-bold mb-4 text-white">${filme.nome}</h1>
                        <div class="flex items-center space-x-4 mb-6">
                            <span class="bg-netflix text-white px-3 py-1 rounded-full text-sm font-semibold">
                                ${filme.ano}
                            </span>
                            <div class="flex items-center text-yellow-400">
                                <svg class="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                </svg>
                                <span class="text-white">${filme.nota || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Sinopse -->
                    <div class="bg-dark-gray rounded-lg p-6">
                        <h2 class="text-2xl font-bold mb-4">Sinopse</h2>
                        <p class="text-gray-300 leading-relaxed text-lg">${filme.sinopse}</p>
                    </div>
                    
                    <!-- Player -->
                    <div class="bg-dark-gray rounded-lg p-6">
                        <h2 class="text-2xl font-bold mb-4">Assistir Filme</h2>
                        
                        <!-- Capa Horizontal -->
                        <div class="relative mb-4">
                            <img src="${filme.capaHorizontal}" 
                                 alt="Capa de ${filme.nome}" 
                                 class="w-full h-48 md:h-64 lg:h-80 object-cover rounded-lg">
                            <div class="absolute inset-0 bg-black bg-opacity-40 rounded-lg flex items-center justify-center">
                                <button onclick="iniciarVideo()" class="bg-netflix text-white px-8 py-4 rounded-full hover:bg-red-700 transition-colors flex items-center space-x-2 text-lg font-semibold">
                                    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                                    </svg>
                                    <span>Assistir Filme</span>
                                </button>
                            </div>
                        </div>
                        
                        <!-- Player (inicialmente oculto) -->
                        <div id="video-player" class="aspect-video rounded-lg overflow-hidden hidden">
                            <iframe src="https://drive.google.com/file/d/${filme.driveId}/preview" 
                                    width="100%" 
                                    height="100%" 
                                    allow="autoplay" 
                                    allowfullscreen
                                    class="w-full h-full">
                            </iframe>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <!-- Footer -->
    <footer class="bg-black bg-opacity-50 py-8">
        <div class="container mx-auto px-4 text-center">
            <p class="text-gray-400">© 2025 MovieCatalog. Dados fornecidos por TMDb.</p>
        </div>
    </footer>

    <script>
        function iniciarVideo() {
            const capa = document.querySelector('.relative.mb-4');
            const player = document.getElementById('video-player');
            
            capa.style.display = 'none';
            player.classList.remove('hidden');
        }
    </script>
</body>
</html>`;

  await fs.writeFile(`public/${filme.slug}.html`, templateHTML);
}

// Rota de login
app.post('/api/login', (req, res) => {
  const { usuario, senha } = req.body;
  
  if (usuario === 'admin' && senha === '3186') {
    res.json({ success: true, message: 'Login realizado com sucesso!' });
  } else {
    res.status(401).json({ success: false, message: 'Credenciais inválidas!' });
  }
});

// Rota para listar filmes
app.get('/api/filmes', async (req, res) => {
  try {
    const filmes = await lerFilmes();
    res.json(filmes);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar filmes' });
  }
});

// Rota para adicionar filme
app.post('/api/filmes', async (req, res) => {
  try {
    const { nome, slug, linkDrive, tmdbId } = req.body;
    
    // Buscar dados do filme na API TMDb
    const dadosTMDb = await buscarFilmeTMDb(tmdbId);
    
    // Extrair ID do Google Drive
    const driveId = extrairIdDrive(linkDrive);
    
    const novoFilme = {
      id: Date.now(),
      nome,
      slug,
      linkDrive,
      driveId,
      tmdbId,
      poster: `https://image.tmdb.org/t/p/w500${dadosTMDb.poster_path}`,
      capaHorizontal: `https://image.tmdb.org/t/p/w1280${dadosTMDb.backdrop_path}`,
      sinopse: dadosTMDb.overview || 'Sinopse não disponível.',
      ano: new Date(dadosTMDb.release_date).getFullYear(),
      nota: dadosTMDb.vote_average ? dadosTMDb.vote_average.toFixed(1) : 'N/A',
      dataAdicao: new Date().toISOString()
    };
    
    // Ler filmes existentes
    const filmes = await lerFilmes();
    filmes.push(novoFilme);
    
    // Salvar no JSON
    await salvarFilmes(filmes);
    
    // Gerar página HTML do filme
    await gerarPaginaFilme(novoFilme);
    
    res.json({ success: true, filme: novoFilme });
  } catch (error) {
    console.error('Erro ao adicionar filme:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao adicionar filme',
      error: error.message 
    });
  }
});

// Rota para remover filme
app.delete('/api/filmes/:id', async (req, res) => {
  try {
    const filmId = parseInt(req.params.id);
    const filmes = await lerFilmes();
    const filmeIndex = filmes.findIndex(f => f.id === filmId);
    
    if (filmeIndex === -1) {
      return res.status(404).json({ success: false, message: 'Filme não encontrado' });
    }
    
    const filme = filmes[filmeIndex];
    
    // Remover arquivo HTML
    try {
      await fs.unlink(`public/${filme.slug}.html`);
    } catch (error) {
      console.log('Arquivo HTML não encontrado para remoção');
    }
    
    // Remover do array
    filmes.splice(filmeIndex, 1);
    
    // Salvar alterações
    await salvarFilmes(filmes);
    
    res.json({ success: true, message: 'Filme removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover filme:', error);
    res.status(500).json({ success: false, message: 'Erro ao remover filme' });
  }
});

// Inicializar servidor
app.listen(PORT, () => {
  console.log(`🎬 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📁 Painel Admin: http://localhost:${PORT}/admin.html`);
});