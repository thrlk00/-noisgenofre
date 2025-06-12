const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let frames = 0;
let tubosPassados = 0;
let tuboScore = 0;
const TUBOS_ATÉ_BOSS = 10;

let jamalHp = 4;
let bossHp = 10;

const state = {
  READY: 0,
  TUBOS: 1,
  BOSS: 2,
  GAME_OVER: 3,
  VICTORY: 4 // <-- novo estado
};


let currentState = state.READY;

const bg = new Image();
bg.src = "img/bg-battle.png";
const boss = new Image();
boss.src = "img/boss-open.png";
const tuboCigarro = new Image();
tuboCigarro.src = "img/tubo-cigarro.png";
const jamalImg = new Image();
jamalImg.src = "img/jamal.png";

const player = {
  x: 80,
  y: 200,
  width: 32,
  height: 32,
  gravity: 0.10,
  velocity: 1,
  jump: -3.6,

  flap() {
    this.velocity = this.jump;
  },

  update() {
    this.velocity += this.gravity;
    this.y += this.velocity;

    if (currentState === state.TUBOS && this.y + this.height >= canvas.height) {
      this.reset();
      pipes.reset();
      bossFight.reset();
      currentState = state.READY;
    }

    if (this.y <= 0) {
      this.y = 0;
      this.velocity = 0;
    }
  },

  draw() {
    ctx.drawImage(jamalImg, this.x, this.y, this.width, this.height);
  },

  reset() {
    this.y = 200;
    this.velocity = 0;
    tuboScore = 0;
    jamalHp = 4;
    bossHp = 10;
  }
};

function handleJump() {
  if (currentState === state.READY) {
    currentState = state.TUBOS;
    startGame();
  } else if (currentState === state.TUBOS || currentState === state.BOSS) {
    player.flap();
  }
}

canvas.addEventListener("click", handleJump);
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    handleJump();
  }
});

const pipes = {
  position: [],
  width: 96,
  height: 300,
  gap: 160,

  draw() {
    this.position.forEach(p => {
      ctx.save();
      ctx.translate(p.x + this.width / 2, p.y + this.height / 2);
      ctx.rotate(Math.PI);
      ctx.drawImage(tuboCigarro, -this.width / 2, -this.height / 2, this.width, this.height);
      ctx.restore();

      const bottomY = p.y + this.height + this.gap;
      ctx.drawImage(tuboCigarro, p.x, bottomY, this.width, this.height);
    });
  },

  update() {
    if (tubosPassados < TUBOS_ATÉ_BOSS && frames % 150 === 0) {
      let y = -Math.floor(Math.random() * 150);
      this.position.push({ x: canvas.width, y });
    }

    this.position.forEach((p, i) => {
      p.x -= 2;

      const px = player.x, py = player.y, pw = player.width, ph = player.height;

      const topY = p.y;
      const bottomY = p.y + this.height + this.gap;

      const topCollision =
        px + pw > p.x &&
        px < p.x + this.width &&
        py < topY + this.height;

      const bottomCollision =
        px + pw > p.x &&
        px < p.x + this.width &&
        py + ph > bottomY;

      if (topCollision || bottomCollision) {
        pipes.reset();
        player.reset();
        bossFight.reset();
        currentState = state.READY;
      }

      if (p.x + this.width < 0) {
        this.position.shift();
        tubosPassados++;
        tuboScore++;
        if (tubosPassados >= TUBOS_ATÉ_BOSS) currentState = state.BOSS;
      }
    });
  },

  reset() {
    this.position = [];
    tubosPassados = 0;
    tuboScore = 0;
  }
};

const bossFight = {
  x: 280,
  y: 80,
  width: 180,
  height: 180,
  dir: 1,
  speed: 2,
  bandeiras: [],
  cigarros: [],

  update() {
 if (jamalHp <= 0) {
  currentState = state.GAME_OVER;
  return;
}
if (bossHp <= 0) {
  currentState = state.VICTORY;
  return;
}



    this.y += this.dir * this.speed;
    if (this.y < 20 || this.y > canvas.height - this.height) {
      this.dir *= -1;
    }

    if (frames % 60 === 0) {
      this.bandeiras.push({ x: this.x + this.width / 2, y: this.y + this.height / 2 });
    }

    this.bandeiras.forEach(b => b.x -= 3);
this.bandeiras = this.bandeiras.filter(b => {
  const bw = 20;
  const bh = 10;
  const padding = 4;

  const hit =
    b.x + padding < player.x + player.width &&
    b.x + bw - padding > player.x &&
    b.y + padding < player.y + player.height &&
    b.y + bh - padding > player.y;

  if (hit) jamalHp--;
  return b.x > -bw && !hit;
});


    if (frames % 30 === 0) {
      this.cigarros.push({ x: player.x + player.width, y: player.y + player.height / 2 });
    }

    this.cigarros.forEach(c => c.x += 5);
    this.cigarros = this.cigarros.filter(c => {
      const hit =
        c.x + 16 >= this.x &&
        c.x <= this.x + this.width &&
        c.y >= this.y &&
        c.y <= this.y + this.height;
      if (hit) bossHp--;
      return c.x < canvas.width + 20 && !hit;
    });
  },

  draw() {
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(boss, -this.x - this.width, this.y, this.width, this.height);
    ctx.restore();

    ctx.fillStyle = "orange";
    this.bandeiras.forEach(b => ctx.fillRect(b.x, b.y, 20, 10));
    ctx.fillStyle = "white";
    this.cigarros.forEach(c => ctx.fillRect(c.x, c.y, 16, 4));

    ctx.fillStyle = "red";
    ctx.fillRect(canvas.width - 120, 20, bossHp * 10, 10);
    ctx.fillStyle = "green";
    ctx.fillRect(20, 40, jamalHp * 20, 10);
  },

  reset() {
    this.bandeiras = [];
    this.cigarros = [];
    this.y = 80;
    this.dir = 1;
  }
};

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

  if (currentState === state.TUBOS) {
    pipes.draw();
  } else if (currentState === state.BOSS) {
    bossFight.draw();
  }

  player.draw();

  ctx.fillStyle = "white";
  ctx.font = "20px 'Press Start 2P'";
  ctx.textAlign = "center";
  ctx.fillText(tuboScore, canvas.width / 2, 40);

  if (currentState === state.READY) {
    ctx.fillStyle = "white";
    ctx.font = "16px 'Press Start 2P'";
    ctx.fillText("Clique para começar", canvas.width / 2, canvas.height / 2);
  }

if (currentState === state.VICTORY) {
  ctx.fillStyle = "lightgreen";
  ctx.font = "16px 'Press Start 2P'";
  ctx.fillText("VOCÊ GANHOU!", canvas.width / 2, canvas.height / 2 - 20);
  ctx.fillText("OS LEGENDÁRIOS ACABARAM!", canvas.width / 2, canvas.height / 2 + 20);
  retryButton.style.display = "block";
} else if (currentState === state.GAME_OVER) {
  ctx.fillStyle = "red";
  ctx.font = "16px 'Press Start 2P'";
  ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
  retryButton.style.display = "block";
} else {
  retryButton.style.display = "none";
}

}

function update() {
  if (currentState === state.TUBOS) pipes.update();
  else if (currentState === state.BOSS) bossFight.update();

  if (currentState !== state.READY) {
    player.update();
  }
}

function startGame() {
  player.reset();
  pipes.reset();
  bossFight.reset();
  frames = 0;
}

function loop() {
  update();
  draw();
  frames++;
  requestAnimationFrame(loop); // roda continuamente
}


bg.onload = () => {
  draw();
  loop(); // só inicia o loop quando a imagem está carregada
};

const retryButton = document.getElementById("retryButton");

retryButton.addEventListener("click", () => {
  player.reset();
  pipes.reset();
  bossFight.reset();
  currentState = state.READY;
  frames = 0;
});

