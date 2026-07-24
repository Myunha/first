// Simple Pong game
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const playerScoreEl = document.getElementById('playerScore');
const computerScoreEl = document.getElementById('computerScore');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// Paddles
const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 100;
const PADDLE_MARGIN = 20;

const player = { x: PADDLE_MARGIN, y: (HEIGHT - PADDLE_HEIGHT) / 2, width: PADDLE_WIDTH, height: PADDLE_HEIGHT, dy: 0 };
const computer = { x: WIDTH - PADDLE_MARGIN - PADDLE_WIDTH, y: (HEIGHT - PADDLE_HEIGHT) / 2, width: PADDLE_WIDTH, height: PADDLE_HEIGHT };

// Ball
const BALL_RADIUS = 8;
let ball = { x: WIDTH/2, y: HEIGHT/2, vx: 5, vy: 2, radius: BALL_RADIUS };

let playerScore = 0;
let computerScore = 0;
let running = false;

// Controls
let keys = { ArrowUp: false, ArrowDown: false };
let lastMouseY = null;

function resetBall(servingToPlayer = true){
  ball.x = WIDTH/2;
  ball.y = HEIGHT/2;
  const speed = 5;
  const angle = (Math.random() * Math.PI / 4) - (Math.PI/8); // -22.5deg .. +22.5deg
  ball.vx = (servingToPlayer ? 1 : -1) * speed * (Math.random() > 0.5 ? 1 : 1); // randomize horizontal direction
  // make sure ball moves toward the last scorer's opponent
  ball.vx = (Math.random() > 0.5 ? 1 : -1) * speed;
  ball.vy = Math.sin(angle) * speed;
}

function startGame(){
  playerScore = 0;
  computerScore = 0;
  playerScoreEl.textContent = playerScore;
  computerScoreEl.textContent = computerScore;
  resetBall();
  running = true;
}

function serveAfterScore(lastWinner){
  resetBall(lastWinner === 'player' ? false : true);
  running = true;
}

// Collision helpers
function rectsOverlap(r1, r2){
  return !(r2.x > r1.x + r1.width ||
           r2.x + r2.width < r1.x ||
           r2.y > r1.y + r1.height ||
           r2.y + r2.height < r1.y);
}

function update(){
  if(!running) return;

  // Player input via keys
  const KEY_SPEED = 6;
  if(keys.ArrowUp) player.y -= KEY_SPEED;
  if(keys.ArrowDown) player.y += KEY_SPEED;

  // Mouse input (overrides) if present
  if(lastMouseY !== null){
    // center paddle on mouse
    player.y = lastMouseY - player.height/2;
  }

  // keep player on screen
  player.y = Math.max(0, Math.min(HEIGHT - player.height, player.y));

  // Computer AI: move towards ball with max speed
  const COMPUTER_SPEED = 4.2;
  const center = computer.y + computer.height/2;
  if(ball.y < center - 10) computer.y -= COMPUTER_SPEED;
  else if(ball.y > center + 10) computer.y += COMPUTER_SPEED;
  computer.y = Math.max(0, Math.min(HEIGHT - computer.height, computer.y));

  // Move ball
  ball.x += ball.vx;
  ball.y += ball.vy;

  // Top/bottom walls
  if(ball.y - ball.radius <= 0){
    ball.y = ball.radius;
    ball.vy *= -1;
  } else if(ball.y + ball.radius >= HEIGHT){
    ball.y = HEIGHT - ball.radius;
    ball.vy *= -1;
  }

  // Left/right - score
  if(ball.x - ball.radius <= 0){
    // computer scores
    computerScore++;
    computerScoreEl.textContent = computerScore;
    running = false;
    setTimeout(()=>serveAfterScore('computer'), 800);
    return;
  }
  if(ball.x + ball.radius >= WIDTH){
    // player scores
    playerScore++;
    playerScoreEl.textContent = playerScore;
    running = false;
    setTimeout(()=>serveAfterScore('player'), 800);
    return;
  }

  // Paddle collisions
  const ballRect = { x: ball.x - ball.radius, y: ball.y - ball.radius, width: ball.radius*2, height: ball.radius*2 };
  const playerRect = { x: player.x, y: player.y, width: player.width, height: player.height };
  const compRect = { x: computer.x, y: computer.y, width: computer.width, height: computer.height };

  if(rectsOverlap(ballRect, playerRect)){
    // place ball outside paddle
    ball.x = player.x + player.width + ball.radius;
    // reflect
    ball.vx = Math.abs(ball.vx) * 1.05; // ensure positive
    // change angle based on hit position
    const relativeIntersectY = (player.y + player.height/2) - ball.y;
    const normalized = relativeIntersectY / (player.height/2);
    const maxBounce = Math.PI/3; // 60deg
    const bounceAngle = normalized * maxBounce;
    const speed = Math.sqrt(ball.vx*ball.vx + ball.vy*ball.vy);
    ball.vx = Math.cos(bounceAngle) * speed; // to the right
    ball.vy = -Math.sin(bounceAngle) * speed;
  }

  if(rectsOverlap(ballRect, compRect)){
    ball.x = computer.x - ball.radius;
    ball.vx = -Math.abs(ball.vx) * 1.05;
    const relativeIntersectY = (computer.y + computer.height/2) - ball.y;
    const normalized = relativeIntersectY / (computer.height/2);
    const maxBounce = Math.PI/3;
    const bounceAngle = normalized * maxBounce;
    const speed = Math.sqrt(ball.vx*ball.vx + ball.vy*ball.vy);
    ball.vx = -Math.cos(bounceAngle) * speed; // to the left
    ball.vy = -Math.sin(bounceAngle) * speed;
  }
}

function drawNet(){
  ctx.fillStyle = '#083344';
  const step = 18;
  for(let y=0;y<HEIGHT;y+=step){
    ctx.fillRect(WIDTH/2 - 1, y + 6, 2, step/2);
  }
}

function draw(){
  // clear
  ctx.fillStyle = '#021526';
  ctx.fillRect(0,0,WIDTH,HEIGHT);

  drawNet();

  // paddles
  ctx.fillStyle = '#e6eef8';
  ctx.fillRect(player.x, player.y, player.width, player.height);
  ctx.fillRect(computer.x, computer.y, computer.width, computer.height);

  // ball
  ctx.beginPath();
  ctx.fillStyle = '#bde0fe';
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI*2);
  ctx.fill();

  // scores are in DOM
}

function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}

// Events
canvas.addEventListener('mousemove', (e)=>{
  const rect = canvas.getBoundingClientRect();
  lastMouseY = e.clientY - rect.top;
});

canvas.addEventListener('mouseleave', ()=>{ lastMouseY = null; });

window.addEventListener('keydown', (e)=>{
  if(e.code === 'Space'){
    if(!running) { running = true; resetBall(); }
    e.preventDefault();
    return;
  }
  if(e.code === 'ArrowUp' || e.code === 'ArrowDown'){
    keys[e.code] = true;
  }
});
window.addEventListener('keyup', (e)=>{
  if(e.code === 'ArrowUp' || e.code === 'ArrowDown'){
    keys[e.code] = false;
  }
});

// Start loop
resetBall();
loop();

// Expose a manual start for convenience
document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState === 'visible') draw(); });
