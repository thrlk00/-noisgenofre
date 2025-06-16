// === Configuração inicial do canvas e contexto de desenho ===
const canvas = document.getElementById("gameCanvas");
const contexto = canvas.getContext("2d");

// === Variáveis de controle de jogo ===
let quadros = 0;
let tubosPassados = 0;
let pontuacaoTubos = 0;
const TUBOS_ATE_CHEFAO = 10;
let cutsceneImagemCarregada = false;
let mortePorChefao = false;
let vidaJamal = 12;
let vidaChefao = 30;
let jogoRodando = false;
let cutscenePodeAvancar = false;
let gravidadeSuspensa = false;


// === Definição dos estados possíveis do jogo ===
const estados = {
  PRONTO: 0,
  TUBOS: 1,
  CHEFAO: 2,
  DERROTA: 3,
  VITORIA: 4,
  CUTSCENE_INICIO: 5,
  CUTSCENE_BOSS: 6,
  CUTSCENE_VITORIA: 7
};

let estadoAtual = estados.PRONTO;

// === Cutscenes (sequências de imagens entre fases) ===
let cutsceneIndex = 0;
const imagensCutsceneInicio = ["img/cutscene1.png", "img/cutscene2.png", "img/cutscene3.png"];
const imagensCutsceneBoss = ["img/cutscene4.png"];
const imagensCutsceneVictoria = ["img/cutscene5.png"];

// === Recursos de áudio e imagem ===
const musicaFundo = new Audio("music/musicajogo.mp3");
musicaFundo.loop = true;
musicaFundo.volume = 0.5;

const imagemCutscene = new Image();
const imagemFundo = new Image();
imagemFundo.src = "img/bg-battle.png";
const imagemChefao = new Image();
imagemChefao.src = "img/boss-open.png";
const imagemTubo = new Image();
imagemTubo.src = "img/tubo-cigarro.png";
const imagemJamal = new Image();
imagemJamal.src = "img/jamal.png";
const imagemTelaMorteBoss = new Image();
imagemTelaMorteBoss.src = "img/telamorteboss.png";
const imagemMenu = new Image();
imagemMenu.src = "img/menu.png";


const somCaiu = new Audio("sounds/efeitos_caiu.wav");
const somHit = new Audio("sounds/efeitos_hit.wav");
const somPonto = new Audio("sounds/efeitos_ponto.wav");
const somPulo = new Audio("sounds/efeitos_pulo.wav");

// === Objeto que representa o jogador (Jamal) ===
const jamal = {
  x: 80,
  y: 200,
  largura: 32,
  altura: 32,
  gravidade: 0.35,
  velocidade: 30,
  pulo: -6.2,

  pular() {
    this.velocidade = this.pulo;
  },

  atualizar() {
    if (gravidadeSuspensa) return;
    this.velocidade += this.gravidade;
    this.y += this.velocidade;
    // Verifica se caiu no chão (perdeu)
    if ((estadoAtual === estados.TUBOS || estadoAtual === estados.CHEFAO) && this.y + this.altura >= canvas.height) {
      if (estadoAtual === estados.CHEFAO) mortePorChefao = true;
      estadoAtual = estados.DERROTA;
      pararMusicaFundo();
    }
    // Limita Jamal para não ultrapassar o topo da tela
    if (this.y <= 0) {
      this.y = 0;
      this.velocidade = 0;
    }
  },

  desenhar() {
    contexto.drawImage(imagemJamal, this.x, this.y, this.largura, this.altura);
  },

  reiniciar() {
    this.y = 200;
    this.velocidade = 0;
    pontuacaoTubos = 0;
    vidaJamal = 4;
    vidaChefao = 15;
  }
};

// === Controle de música de fundo ===
function pararMusicaFundo() {
  musicaFundo.pause();
  musicaFundo.currentTime = 0;
}

function gerenciarMusica() {
  if (
    estadoAtual === estados.CUTSCENE_INICIO ||
    estadoAtual === estados.CUTSCENE_BOSS ||
    estadoAtual === estados.CUTSCENE_VITORIA ||
    estadoAtual === estados.CHEFAO ||
    estadoAtual === estados.DERROTA
  ) {
    if (!musicaFundo.paused) musicaFundo.pause();
  } else if (musicaFundo.paused && estadoAtual === estados.TUBOS) {
    musicaFundo.play();
  }
}


// === Controle de imagens de cutscene ===
function carregarImagemCutscene(src) {
  cutsceneImagemCarregada = false;
  imagemCutscene.onload = () => {
    cutsceneImagemCarregada = true;
  };
  imagemCutscene.src = src;
}

// === Lógica ao clicar ou apertar espaço ===
function lidarComPulo() {
  if (estadoAtual === estados.CUTSCENE_INICIO) {
    cutsceneIndex++;
    if (cutsceneIndex >= imagensCutsceneInicio.length) {
      estadoAtual = estados.TUBOS;
      iniciarJogo();
      musicaFundo.play();
    } else {
      carregarImagemCutscene(imagensCutsceneInicio[cutsceneIndex]);
    }
  } else if (estadoAtual === estados.CUTSCENE_BOSS) {
    if (!cutscenePodeAvancar) return;

    cutsceneIndex++;
    if (cutsceneIndex >= imagensCutsceneBoss.length) {
      estadoAtual = estados.CHEFAO;

      // Desativa a gravidade por 3 segundos
      gravidadeSuspensa = true;
      setTimeout(() => {
        gravidadeSuspensa = false;
      }, 500);
    } else {
      carregarImagemCutscene(imagensCutsceneBoss[cutsceneIndex]);
    }

  } else if (estadoAtual === estados.TUBOS || estadoAtual === estados.CHEFAO) {
    somPulo.play();
    jamal.pular();
  } else if (estadoAtual === estados.PRONTO) {
    estadoAtual = estados.CUTSCENE_INICIO;
    cutsceneIndex = 0;
    carregarImagemCutscene(imagensCutsceneInicio[cutsceneIndex]);
    musicaFundo.pause();
    musicaFundo.currentTime = 0;
  }
}

const botaoStart = {
  x: canvas.width / 2 - 85, // centralizado
  y: canvas.height - 100,   // perto da parte inferior
  largura: 170,
  altura: 50
};


// === Eventos de clique e teclado ===
canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  // Se estiver no estado PRONTO e clicou no botão Start
  if (estadoAtual === estados.PRONTO) {
    if (
      clickX >= botaoStart.x &&
      clickX <= botaoStart.x + botaoStart.largura &&
      clickY >= botaoStart.y &&
      clickY <= botaoStart.y + botaoStart.altura
    ) {
      estadoAtual = estados.CUTSCENE_INICIO;
      cutsceneIndex = 0;
      carregarImagemCutscene(imagensCutsceneInicio[cutsceneIndex]);
      musicaFundo.pause();
      musicaFundo.currentTime = 0;
      return;
    }
  }

  lidarComPulo();
});


// === Tubos (obstáculos do jogo) ===
const tubos = {
  posicoes: [],
  largura: 96,
  altura: 300,
  espaco: 60,

  desenhar() {
    this.posicoes.forEach(tubo => {
      // Tubo superior (invertido)
      contexto.save();
      contexto.translate(tubo.x + this.largura / 2, tubo.y + this.altura / 2);
      contexto.rotate(Math.PI);
      contexto.drawImage(imagemTubo, -this.largura / 2, -this.altura / 2, this.largura, this.altura);
      contexto.restore();

      // Tubo inferior
      const yInferior = tubo.y + this.altura + this.espaco;
      contexto.drawImage(imagemTubo, tubo.x, yInferior, this.largura, this.altura);
    });
  },

  atualizar() {
    if (tubosPassados < TUBOS_ATE_CHEFAO && quadros % 150 === 0) {
      let y = -Math.floor(Math.random() * 150);
      this.posicoes.push({ x: canvas.width, y, jaPontuado: false });
    }

    this.posicoes.forEach((tubo, i) => {
      tubo.x -= 3;

      // Detecção de colisão com Jamal
      const margemXJamal = 6;
      const margemYJamal = 6;
      const px = jamal.x + margemXJamal;
      const py = jamal.y + margemYJamal;
      const pw = jamal.largura - 2 * margemXJamal;
      const ph = jamal.altura - 2 * margemYJamal;

      const tuboEsquerda = tubo.x + 30;
      const tuboDireita = tubo.x + this.largura - 30;
      const tuboTopo = tubo.y + 36;
      const tuboBase = tubo.y + this.altura + this.espaco + 36;

      const colisaoTopo = px + pw > tuboEsquerda && px < tuboDireita && py < tuboTopo + this.altura - 72;
      const colisaoBase = px + pw > tuboEsquerda && px < tuboDireita && py + ph > tuboBase;

      if (colisaoTopo || colisaoBase) {
        somCaiu.currentTime = 0;
        somCaiu.play();
        this.reiniciar();
        jamal.reiniciar();
        chefao.reiniciar();
        estadoAtual = estados.PRONTO;
        pararMusicaFundo();
      }

      // Contagem de pontos
      if (!tubo.jaPontuado && tubo.x + this.largura < jamal.x) {
        tubo.jaPontuado = true;
        pontuacaoTubos++;
        tubosPassados++;
        somPonto.currentTime = 0;
        somPonto.play();

        // Início da cutscene do chefe
        if (tubosPassados >= TUBOS_ATE_CHEFAO) {
          estadoAtual = estados.CUTSCENE_BOSS;
          cutsceneIndex = 0;
          cutscenePodeAvancar = false;
          carregarImagemCutscene(imagensCutsceneBoss[cutsceneIndex]);

          setTimeout(() => {
            cutscenePodeAvancar = true;
          }, 5000);

        }
      }

      // Remove tubos fora da tela
      if (tubo.x + this.largura < 0) {
        this.posicoes.shift();
      }
    });
  },

  reiniciar() {
    this.posicoes = [];
    tubosPassados = 0;
    pontuacaoTubos = 0;
  }
};

// === Chefão (boss da fase final) ===
const chefao = {
  x: 280,
  y: 80,
  largura: 180,
  altura: 180,
  direcao: 4,
  velocidade: 8,
  bandeiras: [],
  cigarros: [],

  atualizar() {
    // Fim de jogo por morte de Jamal
    if (vidaJamal <= 0) {
      mortePorChefao = true;
      estadoAtual = estados.DERROTA;
      return;
    }

    // Vitória se vida do chefe acabar
    if (vidaChefao <= 0) {
      estadoAtual = estados.VITORIA;
      cutsceneIndex = 0;
      carregarImagemCutscene(imagensCutsceneVictoria[0]);
      return;
    }

    // Movimento vertical do chefão
    this.y += this.direcao * this.velocidade;
    if (this.y < 20 || this.y > canvas.height - this.altura) {
      this.direcao *= -1;
    }

    // Disparo de bandeiras (ataque inimigo)
    if (quadros % 20 === 0) {
      this.bandeiras.push({
        x: this.x + this.largura / 2,
        y: this.y + this.altura / 2
      });
    }

    // Atualização de bandeiras
    this.bandeiras.forEach(b => b.x -= 3);
    this.bandeiras = this.bandeiras.filter(b => {
      const acerto =
        b.x + 4 < jamal.x + jamal.largura &&
        b.x + 16 > jamal.x &&
        b.y + 4 < jamal.y + jamal.altura &&
        b.y + 6 > jamal.y;

      if (acerto) {
        somHit.currentTime = 0;
        somHit.play();
        vidaJamal -= 2;
      }
      return b.x > -20 && !acerto;
    });

    // Disparo de cigarros (ataque de Jamal)
    if (quadros % 30 === 0) {
      this.cigarros.push({
        x: jamal.x + jamal.largura,
        y: jamal.y + jamal.altura / 2
      });
    }

    // Atualização de cigarros
    this.cigarros.forEach(c => c.x += 5);
    this.cigarros = this.cigarros.filter(c => {
      const acerto = c.x + 16 >= this.x && c.x <= this.x + this.largura && c.y >= this.y && c.y <= this.y + this.altura;
      if (acerto) vidaChefao--;
      return c.x < canvas.width + 20 && !acerto;
    });
  },

  desenhar() {
    contexto.save();
    contexto.scale(-1, 1);
    contexto.drawImage(imagemChefao, -this.x - this.largura, this.y, this.largura, this.altura);
    contexto.restore();

    contexto.fillStyle = "orange";
    this.bandeiras.forEach(b => contexto.fillRect(b.x, b.y, 20, 10));

    contexto.fillStyle = "white";
    this.cigarros.forEach(c => contexto.fillRect(c.x, c.y, 16, 4));

    contexto.fillStyle = "red";
    contexto.fillRect(canvas.width - 120, 20, vidaChefao * 10, 10);

    contexto.fillStyle = "green";
    contexto.fillRect(20, 40, vidaJamal * 20, 10);
  },

  reiniciar() {
    this.bandeiras = [];
    this.cigarros = [];
    this.y = 80;
    this.direcao = 1;
  }
};

// === Renderização da tela principal ===
function desenharJogo() {
  contexto.clearRect(0, 0, canvas.width, canvas.height);
  contexto.drawImage(imagemFundo, 0, 0, canvas.width, canvas.height);

  if ([estados.CUTSCENE_INICIO, estados.CUTSCENE_BOSS, estados.CUTSCENE_VITORIA].includes(estadoAtual)) {
    desenharCutscene();
    return;
  }

  if (estadoAtual === estados.TUBOS) tubos.desenhar();
  else if (estadoAtual === estados.CHEFAO) chefao.desenhar();

  jamal.desenhar();

  contexto.fillStyle = "white";
  contexto.font = "20px 'Press Start 2P'";
  contexto.textAlign = "center";
  contexto.fillText(pontuacaoTubos, canvas.width / 2, 40);

  if (estadoAtual === estados.PRONTO) {
    contexto.fillStyle = "#FF6600"; // cor laranja
    contexto.fillRect(botaoStart.x, botaoStart.y, botaoStart.largura, botaoStart.altura);

    contexto.fillStyle = "white";
    contexto.font = "16px 'Press Start 2P'";
    contexto.textAlign = "center";
    contexto.fillText("START", canvas.width / 2, botaoStart.y + 32);

    contexto.drawImage(imagemMenu, 0, 0, canvas.width, canvas.height);
  }


  if (estadoAtual === estados.VITORIA || estadoAtual === estados.DERROTA) {
    botaoReiniciar.style.display = "block";
    musicaFundo.pause();
    musicaFundo.currentTime = 0;

    if (estadoAtual === estados.DERROTA && mortePorChefao) {
      contexto.drawImage(imagemTelaMorteBoss, 0, 0, canvas.width, canvas.height);
    } else if (estadoAtual === estados.DERROTA) {
      contexto.fillStyle = "red";
      contexto.font = "16px 'Press Start 2P'";
      contexto.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
    } else {
      desenharCutscene();
    }
  } else {
    botaoReiniciar.style.display = "none";
  }
}

// === Exibição das cutscenes ===
function desenharCutscene() {
  if (!cutsceneImagemCarregada) {
    contexto.fillStyle = "black";
    contexto.fillRect(0, 0, canvas.width, canvas.height);
    return;
  }
  contexto.drawImage(imagemCutscene, 0, 0, canvas.width, canvas.height);
}

// === Atualização lógica por frame ===
function atualizarJogo() {
  if (estadoAtual === estados.TUBOS) tubos.atualizar();
  else if (estadoAtual === estados.CHEFAO) chefao.atualizar();

  if ([estados.TUBOS, estados.CHEFAO].includes(estadoAtual)) {
    jamal.atualizar();
  }
}

// === Início de uma nova partida ===
function iniciarJogo() {
  jamal.reiniciar();
  tubos.reiniciar();
  chefao.reiniciar();
  quadros = 0;
}

// === Loop principal ===
function loopDoJogo() {
  if (!jogoRodando) return;
  gerenciarMusica();
  atualizarJogo();
  desenharJogo();
  quadros++;
  requestAnimationFrame(loopDoJogo);
}

// === Inicialização após carregamento de fundo ===
imagemFundo.onload = () => {
  jogoRodando = true;
  desenharJogo();
  loopDoJogo();
};

// === Botão de reinício ===
const botaoReiniciar = document.getElementById("retryButton");
botaoReiniciar.addEventListener("click", () => {
  mortePorChefao = false;
  jamal.reiniciar();
  tubos.reiniciar();
  chefao.reiniciar();
  estadoAtual = estados.PRONTO;
  quadros = 0;
  pararMusicaFundo();

  if (!jogoRodando) {
    jogoRodando = true;
    loopDoJogo();
  }
});
