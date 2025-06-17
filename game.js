// === Configuração inicial do canvas e contexto de desenho ===
const canvas = document.getElementById("gameCanvas");
const contexto = canvas.getContext("2d");

// === Variáveis de controle de jogo ===
let quadros = 0;
let tubosPassados = 0;
let pontuacaoTubos = 0;
const TUBOS_ATE_CHEFAO = 15;
let cutsceneImagemCarregada = false;
let mortePorChefao = false;
let vidaJamal = 12;
let vidaChefao = 30;
let chefaoEscudo = false;
let escudoAtivo = false;
let faseBoss = 1;
let chefaoIntervaloDisparo = 20;
let chefaoDisparoTriplo = false;
let pocoes = [];
let tempoUltimaPocao = 0;
let intervaloPocao = 3000;
let tempoEscudoAtivo = 0;
let escudoDuracao = 3000;
let jogoRodando = false;
let cutscenePodeAvancar = false;
let gravidadeSuspensa = false;
let energiaJamal = 0;
let especialDisponivel = false;
let explosaoAtiva = false;
let tempoExplosao = 0;
let tremorTela = false;
let intensidadeTremor = 5;
let tempoTremor = 0;
let tempoPortal = 0;



// === Definição dos estados possíveis do jogo ===
const estados = {
  PRONTO: 0,
  TUBOS: 1,
  CHEFAO: 2,
  DERROTA: 3,
  VITORIA: 4,
  CUTSCENE_INICIO: 5,
  CUTSCENE_BOSS: 6,
  CUTSCENE_VITORIA: 7,
  TRANSICAO_PORTAL: 8
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

const suspenseFundo = new Audio('./music/suspensefundo.mp3');
suspenseFundo.loop = true;
suspenseFundo.volume = 0.8;


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
const ataqueBoss = new Image();
ataqueBoss.src = "img/bandeira.png"
const ataqueJamal = new Image();
ataqueJamal.src = "img/cigarro2.png"
const imagemPocao = new Image();
imagemPocao.src = "img/pocao.png";
const imagemExplosao = new Image();
imagemExplosao.src = "img/explosao.png";
let imagemPortal = new Image();
imagemPortal.src = "img/portal.png";
const imagemVida = new Image();
imagemVida.src = "img/vida.png";


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
    this.x = 30;
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
  if (!cutscenePodeAvancar) return;

  if (cutsceneIndex === 0) {
    suspenseFundo.play();
  }

    cutsceneIndex++;
    if (cutsceneIndex >= imagensCutsceneInicio.length) {
      // PARA A MÚSICA DE SUSPENSE AO SAIR DAS CUTSCENES
      suspenseFundo.pause();
      suspenseFundo.currentTime = 0;

      estadoAtual = estados.TUBOS;
      iniciarJogo();
      musicaFundo.play();
    }
    else {
      carregarImagemCutscene(imagensCutsceneInicio[cutsceneIndex]);
        cutscenePodeAvancar = false;
    setTimeout(() => {
      cutscenePodeAvancar = true;
    }, 3000);
    }
  } else if (estadoAtual === estados.CUTSCENE_BOSS) {
    if (!cutscenePodeAvancar) return;

    cutsceneIndex++;
    if (cutsceneIndex >= imagensCutsceneBoss.length) {
      estadoAtual = estados.CHEFAO;
      suspenseFundo.pause();
      suspenseFundo.currentTime = 0;

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

    suspenseFundo.currentTime = 0;
    suspenseFundo.play();

    cutscenePodeAvancar = false;
    setTimeout(() => {
      cutscenePodeAvancar = true;
    }, 3000);

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
  document.addEventListener("keydown", (e) => {
    if (e.key === "F9") { // Verifica se a tecla pressionada é F9
      // Força o jogo a ir direto para a cutscene da boss fight
      estadoAtual = estados.CUTSCENE_BOSS;
      cutsceneIndex = 0; // Reinicia o índice da cutscene para a do boss
      cutscenePodeAvancar = false; // Garante que não avança imediatamente se a cutscene do boss tiver um delay

      // Carrega a primeira imagem da cutscene do boss
      // Assumindo que imagensCutsceneBoss tem pelo menos uma imagem
      carregarImagemCutscene(imagensCutsceneBoss[cutsceneIndex]);

      // Suspende temporariamente a gravidade como na transição normal
      // Isso é importante para Jamal não cair durante a transição
      gravidadeSuspensa = true;
      setTimeout(() => {
        gravidadeSuspensa = false;
        cutscenePodeAvancar = true; // Permite avançar a cutscene após o delay
      }, 500); // Meio segundo de gravidade suspensa, ajuste se necessário

      // Reinicia elementos do jogo para evitar bugs na transição
      jamal.reiniciar();
      tubos.reiniciar(); // Limpa os tubos existentes
      chefao.reiniciar(); // Garante que o chefe comece do zero
      pararMusicaFundo(); // Para a música dos tubos se estiver tocando
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "e" || e.key === "E") {
      if (especialDisponivel && estadoAtual === estados.CHEFAO) {
        ativarAtaqueEspecial();
      }
    }
  });

  lidarComPulo();
});




// === Tubos (obstáculos do jogo) ===
const tubos = {
  posicoes: [],
  largura: 124,
  altura: 400,
  espaco: 100,

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
          estadoAtual = estados.TRANSICAO_PORTAL;
          tempoPortal = Date.now();
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

    if (vidaChefao <= 20 && faseBoss === 1) {
      faseBoss = 2;
      this.velocidade += 2;
      chefaoIntervaloDisparo = 15;
    }
    if (vidaChefao <= 10 && faseBoss === 2) {
      faseBoss = 3;
      this.velocidade += 2;
      chefaoIntervaloDisparo = 10;
      chefaoDisparoTriplo = true;
    }

    // Ativa escudo temporário ao chegar na metade da vida
    if (!chefaoEscudo && vidaChefao <= 15) {
      chefaoEscudo = true;
      escudoAtivo = true;
      tempoEscudoAtivo = Date.now();
    }

    // Desativa escudo após tempo
    if (escudoAtivo && Date.now() - tempoEscudoAtivo > escudoDuracao) {
      escudoAtivo = false;
    }

    // Vitória se vida do chefe acabar
    if (vidaChefao <= 0 && !explosaoAtiva) {
      explosaoAtiva = true;
      tempoExplosao = Date.now();
      this.bandeiras = [];
      this.cigarros = [];
      tremorTela = true;
      tempoTremor = Date.now();
    }

    if (explosaoAtiva) {
      if (Date.now() - tempoExplosao > 2000) { // 2 segundos
        explosaoAtiva = false;
        tremorTela = false;
        estadoAtual = estados.VITORIA;
        cutsceneIndex = 0;
        carregarImagemCutscene(imagensCutsceneVictoria[0]);
      }
      return; // pausa todas as atualizações enquanto a explosão ocorre
    }

    // Movimento vertical do chefão
    this.y += this.direcao * this.velocidade;
    if (this.y < 20 || this.y > canvas.height - this.altura) {
      this.direcao *= -1;
    }

    // Disparo de bandeiras (ataque inimigo)
    if (quadros % chefaoIntervaloDisparo === 0) {
      this.bandeiras.push({
        x: this.x + this.largura / 2,
        y: this.y + this.altura / 2
      });

      if (chefaoDisparoTriplo) {
        this.bandeiras.push({
          x: this.x + this.largura / 2,
          y: this.y + this.altura / 2 - 20
        });
        this.bandeiras.push({
          x: this.x + this.largura / 2,
          y: this.y + this.altura / 2 + 20
        });
      }
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

      if (acerto && !escudoAtivo) {
        vidaChefao--;
        energiaJamal += 10;
        if (energiaJamal >= 100) {
          energiaJamal = 100;
          especialDisponivel = true;
        }
      }

      return c.x < canvas.width + 20 && (!acerto || escudoAtivo);
    });

    if (faseBoss === 3 && quadros % 300 === 0) {
      this.y = Math.random() * (canvas.height - this.altura - 40);
    }

    // === Geração de poções durante a boss fight ===
    if (Date.now() - tempoUltimaPocao > intervaloPocao) {
      pocoes.push({
        x: canvas.width,
        y: Math.random() * (canvas.height - 40),
        largura: 32,
        altura: 32
      });
      tempoUltimaPocao = Date.now();
    }

    // === Atualização das poções ===
    pocoes.forEach(p => p.x -= 2);
    pocoes = pocoes.filter(p => {
      // Detecção de colisão com Jamal
      const colidiu = jamal.x < p.x + p.largura &&
        jamal.x + jamal.largura > p.x &&
        jamal.y < p.y + p.altura &&
        jamal.y + jamal.altura > p.y;
      if (colidiu) {
        vidaJamal = Math.min(vidaJamal + 2, 12); // cura, máximo 12
        somPonto.play(); // ou som de cura específico
      }
      return p.x + p.largura > 0 && !colidiu;
    });
  },

  desenhar() {
    contexto.save();
    contexto.scale(-1, 1);
    contexto.drawImage(imagemChefao, -this.x - this.largura, this.y, this.largura, this.altura);
    contexto.restore();

    this.bandeiras.forEach(b => {
      contexto.drawImage(ataqueBoss, b.x, b.y, 40, 20);
    });

    this.cigarros.forEach(b => {
      contexto.drawImage(ataqueJamal, b.x, b.y, 48, 16);
    });

    contexto.fillStyle = "red"; // Vida chefao
    contexto.fillRect(canvas.width - 120, 20, vidaChefao * 10, 10);

    // === HUD com ícones de vida do Jamal ===
    for (let i = 0; i < vidaJamal; i++) {
      contexto.drawImage(imagemVida, 20 + i * 24, 40, 20, 20);
    }

    // Barra de energia do Jamal
    contexto.fillStyle = "#555";
    contexto.fillRect(20, 60, 200, 10); // fundo

    contexto.fillStyle = "#FFD700";
    contexto.fillRect(20, 60, 2 * energiaJamal, 10); // barra proporcional

    contexto.strokeStyle = "black";
    contexto.strokeRect(20, 60, 200, 10); // contorno

    if (especialDisponivel) {
      contexto.fillStyle = "white";
      contexto.font = "12px 'Press Start 2P'";
      contexto.fillText("PRESSIONE 'E' PARA ESPECIAL", canvas.width / 2, canvas.height - 20);
    }
    if (explosaoAtiva) {
      contexto.drawImage(
        imagemExplosao,
        this.x + this.largura / 2 - 64,
        this.y + this.altura / 2 - 64,
        128,
        128
      );
    }

  },

  reiniciar() {
    this.bandeiras = [];
    this.cigarros = [];
    this.y = 80;
    this.direcao = 1;
    faseBoss = 1;
    chefaoIntervaloDisparo = 20;
    chefaoDisparoTriplo = false;
    chefaoEscudo = false;
    escudoAtivo = false;
    tempoEscudoAtivo = 0;
    pocoes = [];
    tempoUltimaPocao = Date.now();
    explosaoAtiva = false;
  }
};



function ativarAtaqueEspecial() {
  especialDisponivel = false;
  energiaJamal = 0;

  // Rajada de cigarros (5 tiros consecutivos)
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      chefao.cigarros.push({
        x: jamal.x + jamal.largura,
        y: jamal.y + jamal.altura / 2 - 20 + i * 10 // espalhado verticalmente
      });
    }, i * 100); // tempo entre os tiros
  }

  // Som opcional ou efeito visual
  somPonto.play();
}


// === Renderização da tela principal ===
function desenharJogo() {

  // === Efeito de tremor da tela ===
  if (tremorTela) {
    const deslocamentoX = (Math.random() - 0.5) * intensidadeTremor * 2;
    const deslocamentoY = (Math.random() - 0.5) * intensidadeTremor * 2;
    contexto.save();
    contexto.translate(deslocamentoX, deslocamentoY);
  }
  contexto.clearRect(0, 0, canvas.width, canvas.height);
  contexto.drawImage(imagemFundo, 0, 0, canvas.width, canvas.height);

  if ([estados.CUTSCENE_INICIO, estados.CUTSCENE_BOSS, estados.CUTSCENE_VITORIA].includes(estadoAtual)) {
    desenharCutscene();
    return;
  }

  if (estadoAtual === estados.TUBOS) tubos.desenhar();
  else if (estadoAtual === estados.CHEFAO) chefao.desenhar();

  if (estadoAtual === estados.CHEFAO) {
    pocoes.forEach(p => {
      contexto.drawImage(imagemPocao, p.x, p.y, p.largura, p.altura);
    });
  }
  if (estadoAtual === estados.TRANSICAO_PORTAL) {
    contexto.clearRect(0, 0, canvas.width, canvas.height);
    contexto.drawImage(imagemFundo, 0, 0, canvas.width, canvas.height);

    // Portal no centro
    contexto.drawImage(imagemPortal, canvas.width / 2 - 64, canvas.height / 2 - 64, 128, 128);

    jamal.desenhar();
    return;
  }


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

  if (tremorTela) {
    contexto.restore();
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

  if (estadoAtual === estados.TRANSICAO_PORTAL) {
    // Jamal é puxado para o centro da tela lentamente
    const destinoX = canvas.width / 2 - jamal.largura / 2;
    const destinoY = canvas.height / 2 - jamal.altura / 2;

    jamal.x += (destinoX - jamal.x) * 0.05;
    jamal.y += (destinoY - jamal.y) * 0.05;

    if (Date.now() - tempoPortal > 2000) {
      estadoAtual = estados.CUTSCENE_BOSS;

      // Inicia a música de suspense
      suspenseFundo.currentTime = 0;
      suspenseFundo.play();

      cutsceneIndex = 0;
      cutscenePodeAvancar = false;
      carregarImagemCutscene(imagensCutsceneBoss[cutsceneIndex]);

      // Ajusta a posição do Jamal após entrar no portal
      jamal.x = 80;
      jamal.y = canvas.height / 2 - jamal.altura / 2;

      setTimeout(() => {
        cutscenePodeAvancar = true;
      }, 500);
    }

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
