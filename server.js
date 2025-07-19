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
    const response = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?language=pt-BR&append_to_response=credits,videos`, {
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
    <style>
        .popup-youtube {
            display: inline-block;
            background: rgba(255, 0, 0, 0.8);
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            text-decoration: none;
            transition: all 0.3s ease;
        }
        .popup-youtube:hover {
            background: rgba(255, 0, 0, 1);
        }
        .duracao {
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 14px;
        }
        .infomovie {
            background: rgba(42, 42, 42, 0.9);
            padding: 20px;
            border-radius: 8px;
            margin-top: 20px;
        }
        .infomovie b {
            color: #E50914;
        }
    </style>
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
            <h1 class="text-4xl font-bold mb-8 text-center">${filme.nome}</h1>
            
            <!--POST TOP MOVIE-->
            <div id="movietop" class="mb-8">
              
              <!--not youtube iframes-->
              <div class="relative aspect-video rounded-lg overflow-hidden mb-4">
                <iframe allowfullscreen="" 
                        data-src="https://drive.google.com/file/d/${filme.driveId}/preview" 
                        src="https://drive.google.com/file/d/${filme.driveId}/preview"
                        frameborder="0" 
                        class="w-full h-full">
                  <span class="op">Assistir Online</span>
                </iframe>
              </div>
              <!--end not youtube iframes-->
              
              <!--Tool Bar Video Online-->
              <div id="video-toolbar" class="flex items-center justify-between bg-dark-gray p-4 rounded-lg">  
                <div class="flex items-center space-x-4">
                  <div class="flex items-center text-yellow-400">
                    <svg class="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                    <span class="text-white">${filme.nota || 'N/A'}</span>
                  </div>
                  <div class="duracao">
                    <span class="min">${filme.duracao || '120'} min</span>
                  </div>
                </div>
                
                <!--youtube iframes--> 
                <a class="popup-youtube" 
                   href="${filme.trailerUrl || '#'}" 
                   id="btn-trailer" 
                   title="trailer">
                  <span class="op">
                    <span class="indent">Trailer</span>
                  </span>
                </a>
                <!--end youtube iframes-->
              </div>
              <!--End Tool Bar Video Online-->
              
            </div>
            <!--END POST TOP MOVIE-->

            <!--KONTEN POST MOVIE-->
            <div class="postmovie grid md:grid-cols-4 gap-8">
              
              <div class="md:col-span-1">
                <img alt="${filme.nome}" 
                     class="w-full rounded-lg shadow-lg" 
                     src="${filme.poster}"/>
              </div>
              
              <div class="md:col-span-3">
                <h2 class="text-2xl font-bold mb-4">
                  <span class="text-netflix">Sinopse:</span>
                </h2>
                <p class="text-gray-300 leading-relaxed mb-6">
                  ${filme.sinopse}
                </p>
                
                <div class="infomovie">
                  <b>Atores:</b> ${filme.atores || 'Informação não disponível'}<br />
                  <b>Diretor:</b> ${filme.diretor || 'Informação não disponível'}<br />
                  <b>Lançamento:</b> ${filme.dataLancamento || filme.ano}<br />
                  <b>País:</b> ${filme.pais || 'Informação não disponível'}<br />  
                  <b>Visualizações:</b> ${filme.visualizacoes || Math.floor(Math.random() * 10000)}<br />
                  <b>Slogan:</b> ${filme.slogan || 'Uma experiência cinematográfica única'}<br />
                  <b>Classificação:</b> ${filme.classificacao || 'Livre'}<br />
                  <b>Idioma:</b> ${filme.idioma || 'Português, Inglês'}<br />
                  <b>Orçamento:</b> ${filme.orcamento || 'Não informado'}<br />
                  <b>Receita:</b> ${filme.receita || 'Não informado'}
                </div>
              </div>
              
            </div>
            <!--END KONTEN POST MOVIE-->
        </div>
    </main>

    <!-- Footer -->
    <footer class="bg-black bg-opacity-50 py-8">
        <div class="container mx-auto px-4 text-center">
            <p class="text-gray-400">© 2025 MovieCatalog. Dados fornecidos por TMDb.</p>
        </div>
    </footer>

    <script>
        // Script para popup do trailer
        document.addEventListener('DOMContentLoaded', function() {
            const trailerBtn = document.getElementById('btn-trailer');
            if (trailerBtn && trailerBtn.href !== '#') {
                trailerBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    // Aqui você pode implementar um modal ou popup para o trailer
                    window.open(this.href, 'trailer', 'width=800,height=600');
                });
            }
        });
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
      dataAdicao: new Date().toISOString(),
      // Campos adicionais para compatibilidade com estrutura Rave
      duracao: dadosTMDb.runtime || 120,
      dataLancamento: dadosTMDb.release_date ? new Date(dadosTMDb.release_date).toLocaleDateString('pt-BR') : 'Não informado',
      atores: dadosTMDb.credits?.cast?.slice(0, 5).map(actor => actor.name).join(', ') || 'Informação não disponível',
      diretor: dadosTMDb.credits?.crew?.find(person => person.job === 'Director')?.name || 'Informação não disponível',
      pais: dadosTMDb.production_countries?.[0]?.name || 'Informação não disponível',
      classificacao: dadosTMDb.adult ? '+18' : 'Livre',
      idioma: dadosTMDb.spoken_languages?.map(lang => lang.name).join(', ') || 'Português, Inglês',
      orcamento: dadosTMDb.budget ? `$ ${dadosTMDb.budget.toLocaleString('pt-BR')}` : 'Não informado',
      receita: dadosTMDb.revenue ? `$ ${dadosTMDb.revenue.toLocaleString('pt-BR')}` : 'Não informado',
      slogan: dadosTMDb.tagline || 'Uma experiência cinematográfica única',
      visualizacoes: Math.floor(Math.random() * 10000) + 1000,
      trailerUrl: dadosTMDb.videos?.results?.find(video => video.type === 'Trailer')?.key ? 
                  `https://www.youtube.com/watch?v=${dadosTMDb.videos.results.find(video => video.type === 'Trailer').key}` : 
                  null
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