// Seleciona o canvas e contexto
const canvas = document.getElementById("gameCanvas");
const contexto = canvas.getContext("2d");

let quadros = 0;
let tubosPassados = 0;
let pontuacaoTubos = 0;
const TUBOS_ATE_CHEFAO = 10;

let vidaJamal = 4;
let vidaChefao = 10;

const estados = {
  PRONTO: 0,
  TUBOS: 1,
  CHEFAO: 2,
  DERROTA: 3,
  VITORIA: 4
};

let estadoAtual = estados.PRONTO;

const imagemFundo = new Image();
imagemFundo.src = "img/bg-battle.png";
const imagemChefao = new Image();
imagemChefao.src = "img/boss-open.png";
const imagemTubo = new Image();
imagemTubo.src = "img/tubo-cigarro.png";
const imagemJamal = new Image();
imagemJamal.src = "img/jamal.png";

const jamal = {
  x: 80,
  y: 200,
  largura: 32,
  altura: 32,
  gravidade: 0.10,
  velocidade: 1,
  pulo: -3.6,

  pular() {
    this.velocidade = this.pulo;
  },

  atualizar() {
    this.velocidade += this.gravidade;
    this.y += this.velocidade;

    if (estadoAtual === estados.TUBOS && this.y + this.altura >= canvas.height) {
      this.reiniciar();
      tubos.reiniciar();
      chefao.reiniciar();
      estadoAtual = estados.PRONTO;
    }

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
    vidaChefao = 10;
  }
};

function lidarComPulo() {
  if (estadoAtual === estados.PRONTO) {
    estadoAtual = estados.TUBOS;
    iniciarJogo();
  } else if (estadoAtual === estados.TUBOS || estadoAtual === estados.CHEFAO) {
    jamal.pular();
  }
}

canvas.addEventListener("click", lidarComPulo);
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    lidarComPulo();
  }
});

const tubos = {
  posicoes: [],
  largura: 96,
  altura: 300,
  espaco: 160,

  desenhar() {
    this.posicoes.forEach(tubo => {
      contexto.save();
      contexto.translate(tubo.x + this.largura / 2, tubo.y + this.altura / 2);
      contexto.rotate(Math.PI);
      contexto.drawImage(imagemTubo, -this.largura / 2, -this.altura / 2, this.largura, this.altura);
      contexto.restore();

      const yInferior = tubo.y + this.altura + this.espaco;
      contexto.drawImage(imagemTubo, tubo.x, yInferior, this.largura, this.altura);
    });
  },

  atualizar() {
    if (tubosPassados < TUBOS_ATE_CHEFAO && quadros % 150 === 0) {
      let y = -Math.floor(Math.random() * 150);
      this.posicoes.push({ x: canvas.width, y });
    }

    this.posicoes.forEach((tubo, i) => {
      tubo.x -= 2;

      const margemXJamal = 6;
      const margemYJamal = 6;

      const px = jamal.x + margemXJamal;
      const py = jamal.y + margemYJamal;
      const pw = jamal.largura - 2 * margemXJamal;
      const ph = jamal.altura - 2 * margemYJamal;

      const yTopo = tubo.y;
      const yBase = tubo.y + this.altura + this.espaco;

      const margemXTubo = 30;
      const margemYTubo = 36;

      const jamalEsquerda = px;
      const jamalDireita = px + pw;
      const jamalTopo = py;
      const jamalBase = py + ph;

      const tuboEsquerda = tubo.x + margemXTubo;
      const tuboDireita = tubo.x + this.largura - margemXTubo;
      const tuboTopo = yTopo + margemYTubo;
      const tuboBase = yBase + margemYTubo;

      const colisaoTopo =
        jamalDireita > tuboEsquerda &&
        jamalEsquerda < tuboDireita &&
        jamalTopo < tuboTopo + this.altura - 2 * margemYTubo;

      const colisaoBase =
        jamalDireita > tuboEsquerda &&
        jamalEsquerda < tuboDireita &&
        jamalBase > tuboBase;

      if (colisaoTopo || colisaoBase) {
        this.reiniciar();
        jamal.reiniciar();
        chefao.reiniciar();
        estadoAtual = estados.PRONTO;
      }

      if (tubo.x + this.largura < 0) {
        this.posicoes.shift();
        tubosPassados++;
        pontuacaoTubos++;
        if (tubosPassados >= TUBOS_ATE_CHEFAO) estadoAtual = estados.CHEFAO;
      }
    });
  },

  reiniciar() {
    this.posicoes = [];
    tubosPassados = 0;
    pontuacaoTubos = 0;
  }
};

const chefao = {
  x: 280,
  y: 80,
  largura: 180,
  altura: 180,
  direcao: 1,
  velocidade: 2,
  bandeiras: [],
  cigarros: [],

  atualizar() {
    if (vidaJamal <= 0) {
      estadoAtual = estados.DERROTA;
      return;
    }
    if (vidaChefao <= 0) {
      estadoAtual = estados.VITORIA;
      return;
    }

    this.y += this.direcao * this.velocidade;
    if (this.y < 20 || this.y > canvas.height - this.altura) {
      this.direcao *= -1;
    }

    if (quadros % 60 === 0) {
      this.bandeiras.push({
        x: this.x + this.largura / 2,
        y: this.y + this.altura / 2
      });
    }

    this.bandeiras.forEach(b => b.x -= 3);
    this.bandeiras = this.bandeiras.filter(b => {
      const bw = 20, bh = 10, margem = 4;
      const acerto =
        b.x + margem < jamal.x + jamal.largura &&
        b.x + bw - margem > jamal.x &&
        b.y + margem < jamal.y + jamal.altura &&
        b.y + bh - margem > jamal.y;

      if (acerto) vidaJamal--;
      return b.x > -bw && !acerto;
    });

    if (quadros % 30 === 0) {
      this.cigarros.push({
        x: jamal.x + jamal.largura,
        y: jamal.y + jamal.altura / 2
      });
    }

    this.cigarros.forEach(c => c.x += 5);
    this.cigarros = this.cigarros.filter(c => {
      const acerto =
        c.x + 16 >= this.x &&
        c.x <= this.x + this.largura &&
        c.y >= this.y &&
        c.y <= this.y + this.altura;

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

function desenharJogo() {
  contexto.clearRect(0, 0, canvas.width, canvas.height);
  contexto.drawImage(imagemFundo, 0, 0, canvas.width, canvas.height);

  if (estadoAtual === estados.TUBOS) {
    tubos.desenhar();
  } else if (estadoAtual === estados.CHEFAO) {
    chefao.desenhar();
  }

  jamal.desenhar();

  contexto.fillStyle = "white";
  contexto.font = "20px 'Press Start 2P'";
  contexto.textAlign = "center";
  contexto.fillText(pontuacaoTubos, canvas.width / 2, 40);

  if (estadoAtual === estados.PRONTO) {
    contexto.fillStyle = "white";
    contexto.font = "16px 'Press Start 2P'";
    contexto.fillText("Clique para começar", canvas.width / 2, canvas.height / 2);
  }

  if (estadoAtual === estados.VITORIA) {
    contexto.fillStyle = "lightgreen";
    contexto.font = "16px 'Press Start 2P'";
    contexto.fillText("VOCÊ GANHOU!", canvas.width / 2, canvas.height / 2 - 20);
    contexto.fillText("OS LEGENDÁRIOS ACABARAM!", canvas.width / 2, canvas.height / 2 + 20);
    botaoReiniciar.style.display = "block";
  } else if (estadoAtual === estados.DERROTA) {
    contexto.fillStyle = "red";
    contexto.font = "16px 'Press Start 2P'";
    contexto.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
    botaoReiniciar.style.display = "block";
  } else {
    botaoReiniciar.style.display = "none";
  }
}

function atualizarJogo() {
  if (estadoAtual === estados.TUBOS) tubos.atualizar();
  else if (estadoAtual === estados.CHEFAO) chefao.atualizar();

  if (estadoAtual !== estados.PRONTO) jamal.atualizar();
}

function iniciarJogo() {
  jamal.reiniciar();
  tubos.reiniciar();
  chefao.reiniciar();
  quadros = 0;
}

function loopDoJogo() {
  atualizarJogo();
  desenharJogo();
  quadros++;
  requestAnimationFrame(loopDoJogo);
}

imagemFundo.onload = () => {
  desenharJogo();
  loopDoJogo();
};

const botaoReiniciar = document.getElementById("retryButton");
botaoReiniciar.addEventListener("click", () => {
  jamal.reiniciar();
  tubos.reiniciar();
  chefao.reiniciar();
  estadoAtual = estados.PRONTO;
  quadros = 0;
});
