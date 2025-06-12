const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let frames = 0;
let tubosPassados = 0;
let tuboScore = 0;
const TUBOS_ATÉ_BOSS = 10;

let jamalHp = 4;
let bossHp = 10;

const state = {
  TUBOS: 0,
  BOSS: 1,
  GAME_OVER: 2
};

let currentState = state.TUBOS;

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
  gravity: 0.25,
  velocity: 0,
  jump: -4.6,

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
      currentState = state.TUBOS;
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
  if (currentState === state.TUBOS || currentState === state.BOSS) {
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
      // Cigarro de cima — bituca pra baixo
      ctx.save();
      ctx.translate(p.x + this.width / 2, p.y + this.height / 2);
      ctx.rotate(Math.PI);
      ctx.drawImage(tuboCigarro, -this.width / 2, -this.height / 2, this.width, this.height);
      ctx.restore();

      // Cigarro de baixo — bituca pra cima
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
        currentState = state.TUBOS;
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
    if (bossHp <= 0 || jamalHp <= 0) {
      currentState = state.GAME_OVER;
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
      const hit = b.x < player.x + player.width &&
        b.x + 20 > player.x &&
        b.y < player.y + player.height &&
        b.y + 10 > player.y;
      if (hit) jamalHp--;
      return b.x > -20 && !hit;
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

  if (currentState === state.GAME_OVER) {
    ctx.fillStyle = "red";
    ctx.font = "16px 'Press Start 2P'";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
  }
}

function update() {
  if (currentState === state.TUBOS) pipes.update();
  else if (currentState === state.BOSS) bossFight.update();

  player.update();
}

function loop() {
  update();
  draw();
  frames++;
  requestAnimationFrame(loop);
}

loop();
