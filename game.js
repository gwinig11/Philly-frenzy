// Supabase Configuration
const SUPABASE_URL = 'https://duxljmpndhlwtszjlhzu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eGxqbXBuZGhsd3RzempsaHp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA1Mzk1NzIsImV4cCI6MjA1NjExNTU3Mn0.JI61qmsprFeMt9p2lzbYLL8X15-_fm8poA_NfPE8fQM';
let supabaseClient;

// Initialize Supabase client when the page loads
window.onload = function() {
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
};

// Global variables
let gameState = 'start';
let runner;
let obstacles = [];
let score = 0;
let lives = 1;
let level = 1;
let bgLayers = [];
let obstacleTypes = ['cheesesteak', 'wawa', 'love_statue', 'phanatic', 'lombardi_trophy', 'gritty'];

// Leaderboard variables
let playerEmail = '';
let playerName = '';
let playerCity = '';
let leaderboardData = [];
let isLoadingLeaderboard = false;
let emailInput;
let nameInput;
let submitButton;
let viewLeaderboardButton;
let backButton;
let errorMessage = '';
let successMessage = '';

// Original dimensions for scaling
const ORIGINAL_WIDTH = 800;
const ORIGINAL_HEIGHT = 600;

// Setup function
function setup() {
  // Create canvas that fits the device screen
  createCanvas(windowWidth, windowHeight);
  
  frameRate(60);
  runner = new Runner();
  initBackground();
  
  // Create input fields (scaled)
  const scaleX = width / ORIGINAL_WIDTH;
  const scaleY = height / ORIGINAL_HEIGHT;

  nameInput = createInput('');
  nameInput.size(200 * scaleX, 30 * scaleY);
  nameInput.attribute('placeholder', 'Enter your name');
  nameInput.style('font-family', 'Arial');
  nameInput.style('padding', '5px');
  nameInput.style('border', '2px solid #575C87');
  nameInput.style('border-radius', '5px');
  nameInput.hide();
  
  emailInput = createInput('');
  emailInput.size(200 * scaleX, 30 * scaleY);
  emailInput.attribute('placeholder', 'Enter your email');
  emailInput.style('font-family', 'Arial');
  emailInput.style('padding', '5px');
  emailInput.style('border', '2px solid #575C87');
  emailInput.style('border-radius', '5px');
  emailInput.hide();
  
  // Create submit button
  submitButton = createButton('Submit Score');
  submitButton.size(214 * scaleX, 30 * scaleY);
  submitButton.mousePressed(submitScore);
  submitButton.style('background-color', '#E81828');
  submitButton.style('color', 'white');
  submitButton.style('font-family', 'Arial');
  submitButton.style('font-weight', 'bold');
  submitButton.style('border', 'none');
  submitButton.style('border-radius', '5px');
  submitButton.style('padding', '8px');
  submitButton.style('cursor', 'pointer');
  submitButton.hide();
  
  // Create view leaderboard button
  viewLeaderboardButton = createButton('View Leaderboard');
  viewLeaderboardButton.size(214 * scaleX, 30 * scaleY);
  viewLeaderboardButton.mousePressed(() => {
    gameState = 'leaderboard';
    fetchLeaderboard();
  });
  viewLeaderboardButton.style('background-color', '#575C87');
  viewLeaderboardButton.style('color', 'white');
  viewLeaderboardButton.style('font-family', 'Arial');
  viewLeaderboardButton.style('font-weight', 'bold');
  viewLeaderboardButton.style('border', 'none');
  viewLeaderboardButton.style('border-radius', '5px');
  viewLeaderboardButton.style('padding', '8px');
  viewLeaderboardButton.style('cursor', 'pointer');
  viewLeaderboardButton.hide();
  
  // Create back button for leaderboard
  backButton = createButton('Back to Game');
  backButton.size(200 * scaleX, 30 * scaleY);
  backButton.mousePressed(() => {
    gameState = 'start';
  });
  backButton.style('background-color', '#575C87');
  backButton.style('color', 'white');
  backButton.style('font-family', 'Arial');
  backButton.style('font-weight', 'bold');
  backButton.style('border', 'none');
  backButton.style('border-radius', '5px');
  backButton.style('padding', '8px');
  backButton.style('cursor', 'pointer');
  backButton.hide();
  
  // Handle window resize
  window.addEventListener('resize', () => {
    resizeCanvas(windowWidth, windowHeight);
    repositionElements();
  });
  
  // Initially position elements
  repositionElements();
}

// Reposition UI elements dynamically
function repositionElements() {
  const canvasRect = document.querySelector('canvas').getBoundingClientRect();
  const canvasX = canvasRect.left;
  const canvasY = canvasRect.top;
  const scaleY = height / ORIGINAL_HEIGHT;
  
  const centerX = width / 2;
  const inputWidth = nameInput.width;
  const buttonWidth = submitButton.width;

  nameInput.position(canvasX + centerX - inputWidth / 2, canvasY + height / 2);
  emailInput.position(canvasX + centerX - inputWidth / 2, canvasY + height / 2 + 40 * scaleY);
  submitButton.position(canvasX + centerX - buttonWidth / 2, canvasY + height / 2 + 80 * scaleY + 10 * scaleY);
  viewLeaderboardButton.position(canvasX + centerX - buttonWidth / 2, canvasY + height / 2 + 120 * scaleY + 10 * scaleY);
  backButton.position(canvasX + centerX - backButton.width / 2, canvasY + height - 50 * scaleY);
}

// Main draw loop
function draw() {
  push();
  // Scale drawing to fit screen based on original 800x600
  scale(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);
  
  background(220);
  if (gameState === 'start') {
    drawStartScreen();
    hideLeaderboardElements();
  } else if (gameState === 'play') {
    drawBackground();
    runner.show();
    handleObstacles();
    checkCollisions();
    drawUI();
    hideLeaderboardElements();
    if (score >= 10 * level) {
      level += 1;
      gameState = 'levelComplete';
    }
  } else if (gameState === 'levelComplete') {
    drawLevelComplete();
    hideLeaderboardElements();
  } else if (gameState === 'gameOver') {
    drawGameOver();
    showLeaderboardElements();
  } else if (gameState === 'leaderboard') {
    drawLeaderboard();
    hideInputElements();
  }
  
  pop();

  // Manage back button visibility outside scaling
  if (gameState === 'leaderboard') {
    backButton.show();
  } else {
    backButton.hide();
  }
}

// Touch controls for iPhone
function touchStarted() {
  if (gameState === 'start') {
    resetGame();
    gameState = 'play';
  } else if (gameState === 'levelComplete') {
    gameState = 'play';
  } else if (gameState === 'gameOver') {
    resetGame();
    gameState = 'start';
  } else if (gameState === 'leaderboard') {
    gameState = 'start';
  }
  return false; // Prevent default touch behavior
}

function touchMoved() {
  if (gameState === 'play' && touches.length > 0) {
    let dx = touches[0].x - pmouseX; // Swipe distance
    runner.x += dx * 0.05;           // Adjusted sensitivity for touch
    runner.x = constrain(runner.x, runner.width / 2, ORIGINAL_WIDTH - runner.width / 2);
  }
  return false; // Prevent scrolling
}

// Runner class (Everyday Philadelphian)
class Runner {
  constructor() {
    this.x = ORIGINAL_WIDTH / 2;
    this.y = ORIGINAL_HEIGHT - 100;
    this.width = 30;
    this.height = 60;
    this.speed = 3;
  }

  show() {
    // Head - bigger
    fill(255, 204, 153); // Skin tone
    ellipse(this.x, this.y - 48, 25, 25);
    
    // Phillies baseball cap - bigger
    fill(232, 24, 40); // Phillies red
    arc(this.x, this.y - 54, 28, 22, PI, 0, CHORD); // Cap crown
    rect(this.x - 14, this.y - 54, 28, 6); // Cap brim
    
    // Add a small detail to the cap brim
    fill(180, 20, 30);
    rect(this.x - 14, this.y - 52, 28, 2);
    
    // Phillies "P" logo on cap
    fill(255);
    textSize(10);
    textAlign(CENTER);
    text("P", this.x, this.y - 54);
    textAlign(LEFT);
    
    // Philadelphia Eagles jersey - TALLER
    fill(0, 76, 84); // Eagles midnight green
    rect(this.x - 15, this.y - 36, 30, 30);
    
    // Jersey number - just "1"
    fill(255, 255, 255);
    textSize(12);
    textAlign(CENTER);
    text("1", this.x, this.y - 24);
    textAlign(LEFT);
    
    // Blue waist/hip section
    fill(0, 0, 139); // Dark blue
    rect(this.x - 15, this.y - 6, 30, 8);
    
    // Jeans - separate legs
    fill(0, 0, 139);
    rect(this.x - 15, this.y + 2, 12, 44); // Left leg
    rect(this.x + 3, this.y + 2, 12, 44);  // Right leg
    
    // Gap between legs
    fill(80, 80, 80);
    rect(this.x - 3, this.y + 2, 6, 44);
    
    // Plain white sneakers
    fill(255);
    rect(this.x - 15, this.y + 46, 12, 8); // Left sneaker
    rect(this.x + 3, this.y + 46, 12, 8);  // Right sneaker
    rect(this.x - 19, this.y + 50, 4, 4);  // Left extension
    rect(this.x + 15, this.y + 50, 4, 4);  // Right extension
    
    // Arms
    fill(0, 76, 84);
    noStroke();
    quad(this.x - 15, this.y - 36, this.x - 7, this.y - 36, this.x - 11, this.y - 6, this.x - 19, this.y - 6); // Left arm
    quad(this.x + 7, this.y - 36, this.x + 15, this.y - 36, this.x + 19, this.y - 6, this.x + 11, this.y - 6); // Right arm
    
    // Hands
    fill(255, 204, 153);
    rect(this.x - 19, this.y - 6, 8, 7); // Left hand
    rect(this.x + 11, this.y - 6, 8, 7); // Right hand
    
    noStroke();
  }
}

// Obstacle class (Philadelphia-themed items)
class Obstacle {
  constructor(type) {
    this.type = type;
    this.x = random(0, ORIGINAL_WIDTH - 30);
    this.y = -50;
    this.width = 30;
    this.height = 30;
    this.speed = random(4, 7 + level);
  }

  update() {
    this.y += this.speed;
  }

  show() {
    if (this.type === 'cheesesteak') {
      fill(222, 184, 135); // Tan bread
      rect(this.x, this.y, 40, 15);
      fill(255, 215, 0);   // Cheese Whiz
      rect(this.x + 5, this.y - 5, 30, 5);
      rect(this.x + 8, this.y - 8, 5, 3);
      rect(this.x + 20, this.y - 7, 5, 2);
      fill(139, 69, 19);   // Steak
      rect(this.x + 5, this.y + 2, 30, 8);
      stroke(0);
      strokeWeight(1);
      fill(255);
      rect(this.x - 5, this.y + 10, 50, 10);
      fill(0);
      textSize(7);
      textAlign(CENTER, CENTER);
      text("GENO'S", this.x + 20, this.y + 15);
      textAlign(LEFT);
      noStroke();
    } else if (this.type === 'wawa') {
      fill(246, 67, 68);
      rect(this.x, this.y, 20, 30);
      fill(139, 69, 19);
      rect(this.x, this.y - 5, 20, 5);
      fill(255);
      textSize(10);
      textAlign(CENTER);
      text('W', this.x + 10, this.y + 15);
      textAlign(LEFT);
    } else if (this.type === 'love_statue') {
      fill(255, 0, 0);
      rect(this.x, this.y, 10, 20);
      rect(this.x, this.y + 20, 15, 5);
      fill(0, 128, 0);
      rect(this.x + 15, this.y, 15, 25);
      fill(255);
      rect(this.x + 20, this.y + 5, 5, 15);
      fill(0, 0, 255);
      beginShape();
      vertex(this.x, this.y + 30);
      vertex(this.x + 15, this.y + 50);
      vertex(this.x + 30, this.y + 30);
      endShape(CLOSE);
      fill(255, 0, 0);
      rect(this.x + 15, this.y + 30, 15, 5);
      rect(this.x + 15, this.y + 35, 10, 5);
      rect(this.x + 15, this.y + 40, 15, 5);
    } else if (this.type === 'phanatic') {
      fill(0, 175, 73);
      ellipse(this.x + 15, this.y + 20, 25, 30);
      fill(255, 0, 0);
      ellipse(this.x + 15, this.y + 25, 10, 15);
      fill(255);
      ellipse(this.x + 10, this.y + 10, 8, 8);
      ellipse(this.x + 20, this.y + 10, 8, 8);
      fill(0);
      ellipse(this.x + 10, this.y + 10, 4, 4);
      ellipse(this.x + 20, this.y + 10, 4, 4);
      fill(0, 0, 139);
      arc(this.x + 15, this.y + 5, 20, 10, PI, 0, CHORD);
    } else if (this.type === 'lombardi_trophy') {
      fill(150, 150, 150);
      rect(this.x + 5, this.y + 35, 20, 10);
      fill(200, 200, 200);
      rect(this.x + 12, this.y + 15, 6, 20);
      fill(220, 220, 220);
      ellipse(this.x + 15, this.y + 10, 20, 15);
      stroke(150, 150, 150);
      strokeWeight(1);
      line(this.x + 15, this.y + 5, this.x + 15, this.y + 15);
      line(this.x + 11, this.y + 10, this.x + 19, this.y + 10);
      stroke(255, 255, 255, 150);
      line(this.x + 8, this.y + 10, this.x + 10, this.y + 8);
      noStroke();
    } else if (this.type === 'gritty') {
      fill(255, 130, 0);
      ellipse(this.x + 15, this.y + 20, 30, 35);
      fill(0);
      arc(this.x + 15, this.y + 10, 28, 20, PI, 0, CHORD);
      rect(this.x + 3, this.y + 10, 24, 5);
      stroke(0);
      strokeWeight(2);
      line(this.x + 5, this.y + 15, this.x + 5, this.y + 25);
      line(this.x + 25, this.y + 15, this.x + 25, this.y + 25);
      noStroke();
      fill(255);
      ellipse(this.x + 10, this.y + 15, 12, 12);
      ellipse(this.x + 20, this.y + 15, 12, 12);
      fill(0);
      ellipse(this.x + 12, this.y + 14, 6, 6);
      ellipse(this.x + 18, this.y + 17, 6, 6);
      fill(0);
      ellipse(this.x + 15, this.y + 25, 15, 15);
      fill(255, 130, 0);
      beginShape();
      vertex(this.x + 10, this.y + 25);
      vertex(this.x + 15, this.y + 20);
      vertex(this.x + 20, this.y + 25);
      vertex(this.x + 15, this.y + 30);
      endShape(CLOSE);
      fill(255);
      arc(this.x + 15, this.y + 35, 15, 10, 0, PI, CHORD);
      fill(0, 0, 0);
      arc(this.x + 15, this.y + 8, 25, 15, PI, 0, CHORD);
      fill(255, 130, 0);
      rect(this.x + 10, this.y + 5, 10, 3);
    }
  }

  offscreen() {
    return this.y > ORIGINAL_HEIGHT + this.height;
  }
}

// Background initialization
function initBackground() {
  bgLayers = [
    { y: 0, color: color(135, 206, 235) }, // Sky blue
    { y: 450, color: color(80, 80, 80) }   // Ground/street
  ];
}

// Draw background (simplified for brevity)
function drawBackground() {
  fill(bgLayers[0].color);
  rect(0, 0, ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
  
  fill(bgLayers[1].color);
  rect(0, 450, ORIGINAL_WIDTH, 150);
  
  // Add your detailed PMA and Rocky statue here as needed
}

// Handle obstacles
function handleObstacles() {
  if (frameCount % (60 - level * 5) === 0) {
    let type = random(obstacleTypes);
    obstacles.push(new Obstacle(type));
  }
  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].update();
    obstacles[i].show();
    if (obstacles[i].offscreen()) {
      obstacles.splice(i, 1);
      score += 1;
    }
  }
}

// Collision detection
function checkCollisions() {
  for (let i = obstacles.length - 1; i >= 0; i--) {
    let obs = obstacles[i];
    if (collideRectRect(
      runner.x - runner.width / 2, runner.y - runner.height, runner.width, runner.height,
      obs.x, obs.y, obs.width, obs.height
    )) {
      lives -= 1;
      obstacles.splice(i, 1);
      if (lives <= 0) {
        gameState = 'gameOver';
      }
    }
  }
}

// UI
function drawUI() {
  fill(0);
  textSize(20);
  textAlign(LEFT);
  text(`Score: ${score}`, 10, 30);
  text(`Level: ${level}`, 10, 60);
}

// Screens
function drawStartScreen() {
  fill(87, 92, 135);
  textAlign(CENTER);
  textFont('Impact');
  fill(40, 45, 80);
  textSize(68);
  text("PHILLY FRENZY", ORIGINAL_WIDTH / 2 + 5, ORIGINAL_HEIGHT / 2 - 30);
  fill(60, 65, 100);
  textSize(68);
  text("PHILLY FRENZY", ORIGINAL_WIDTH / 2 + 3, ORIGINAL_HEIGHT / 2 - 32);
  fill(232, 24, 40);
  textSize(68);
  text("PHILLY FRENZY", ORIGINAL_WIDTH / 2, ORIGINAL_HEIGHT / 2 - 35);
  
  textFont('Arial');
  textSize(24);
  fill(87, 92, 135);
  text("Tap to start", ORIGINAL_WIDTH / 2, ORIGINAL_HEIGHT / 2 + 30);
  textSize(18);
  text("Swipe to move", ORIGINAL_WIDTH / 2, ORIGINAL_HEIGHT / 2 + 60);
  
  textSize(16);
  fill(0, 0, 0);
  text("Presented by:", ORIGINAL_WIDTH / 2, ORIGINAL_HEIGHT - 100);
  fill(87, 92, 135);
  textSize(20);
  textStyle(BOLD);
  text("Fine, Staud and Levy", ORIGINAL_WIDTH / 2, ORIGINAL_HEIGHT - 75);
  textStyle(NORMAL);
  textSize(16);
  text("Focusing on Our Clients Since 1958", ORIGINAL_WIDTH / 2, ORIGINAL_HEIGHT - 50);
  text("215.665.0100", ORIGINAL_WIDTH / 2, ORIGINAL_HEIGHT - 30);
}

function drawLevelComplete() {
  fill(33, 139, 33);
  textSize(32);
  textAlign(CENTER);
  textStyle(BOLD);
  text(`Level ${level - 1} Complete!`, ORIGINAL_WIDTH / 2, ORIGINAL_HEIGHT / 2);
  textStyle(NORMAL);
  textSize(24);
  fill(0);
  text("Tap to continue", ORIGINAL_WIDTH / 2, ORIGINAL_HEIGHT / 2 + 50);
  
  fill(87, 92, 135);
  textSize(16);
  text("Presented by:", ORIGINAL_WIDTH / 2, ORIGINAL_HEIGHT - 100);
  textSize(20);
  textStyle(BOLD);
  text("Fine, Staud and Levy", ORIGINAL_WIDTH / 2, ORIGINAL_HEIGHT - 75);
  textStyle(NORMAL);
  textSize(16);
  text("Focusing on Our Clients Since 1958", ORIGINAL_WIDTH / 2, ORIGINAL_HEIGHT - 50);
  text("215.665.0100", ORIGINAL_WIDTH / 2, ORIGINAL_HEIGHT - 30);
}

function drawGameOver() {
  fill(87, 92, 135);
  textSize(32);
  textAlign(CENTER);
  
  fill(232, 24, 40);
  textFont('Impact');
  textSize(42);
  text("Liberty Crushed!", ORIGINAL_WIDTH / 2, ORIGINAL_HEIGHT / 3 - 40);
  textFont('Arial');
  textSize(24);
  
  fill(0, 0, 0);
  text(`Final Score: ${score}`, ORIGINAL_WIDTH / 2, ORIGINAL_HEIGHT / 3);
  text("Tap to restart", ORIGINAL_WIDTH / 2, ORIGINAL_HEIGHT / 3 + 30);
  
  // Position input fields and buttons dynamically
  repositionElements();
  
  if (errorMessage) {
    fill(255, 0, 0);
    textSize(16);
    text(errorMessage, ORIGINAL_WIDTH / 2, ORIGINAL_HEIGHT / 2 + 180);
  }
  
  if (successMessage) {
    fill(0, 128, 0);
    textSize(16);
    text(successMessage, ORIGINAL_WIDTH / 2, ORIGINAL_HEIGHT / 2 + 180);
  }
  
  fill(87, 92, 135);
  textSize(20);
  text("For real-life obstacles, call Fine, Staud and Levy", ORIGINAL_WIDTH / 2, ORIGINAL_HEIGHT - 60);
  text("215.665.0100", ORIGINAL_WIDTH / 2, ORIGINAL_HEIGHT - 30);
}

// Reset game
function resetGame() {
  score = 0;
  lives = 1;
  level = 1;
  obstacles = [];
  runner = new Runner();
  errorMessage = '';
  successMessage = '';
  playerName = '';
  playerEmail = '';
  nameInput.value('');
  emailInput.value('');
}

// Collision helper
function collideRectRect(x1, y1, w1, h1, x2, y2, w2, h2) {
  return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
}

function hideLeaderboardElements() {
  nameInput.hide();
  emailInput.hide();
  submitButton.hide();
  viewLeaderboardButton.hide();
}

function showLeaderboardElements() {
  nameInput.show();
  emailInput.show();
  submitButton.show();
  viewLeaderboardButton.show();
}

function hideInputElements() {
  nameInput.hide();
  emailInput.hide();
  submitButton.hide();
}

// Leaderboard Functions
async function submitScore() {
  playerName = nameInput.value();
  playerEmail = emailInput.value();
  
  if (!playerName) {
    errorMessage = 'Please enter your name';
    return;
  }
  
  if (!validateEmail(playerEmail)) {
    errorMessage = 'Please enter a valid email address';
    return;
  }
  
  try {
    const { data, error } = await supabaseClient
      .from('leaderboard')
      .insert([
        { 
          name: playerName,
          email: playerEmail,
          city: "Philadelphia",
          score: score 
        }
      ]);
      
    if (error) {
      console.error('Error submitting score:', error);
      errorMessage = 'Failed to submit score. Please try again.';
    } else {
      successMessage = 'Score submitted successfully!';
      errorMessage = '';
      nameInput.hide();
      emailInput.hide();
      submitButton.hide();
    }
  } catch (err) {
    console.error('Error:', err);
    errorMessage = 'An unexpected error occurred. Please try again.';
  }
}

async function fetchLeaderboard() {
  try {
    const { data, error } = await supabaseClient
      .from('leaderboard')
      .select('name, score')
      .order('score', { ascending: false })
      .limit(10);
      
    if (error) {
      console.error('Error fetching leaderboard:', error);
      errorMessage = 'Failed to load leaderboard. Please try again.';
    } else {
      leaderboardData = data;
      errorMessage = '';
    }
  } catch (err) {
    console.error('Error:', err);
    errorMessage = 'An unexpected error occurred. Please try again.';
  }
}

function drawLeaderboard() {
  background(220);
  
  fill(87, 92, 135);
  textSize(42);
  textAlign(CENTER);
  textFont('Impact');
  text("LEADERBOARD", ORIGINAL_WIDTH / 2, 80);
  
  textSize(24);
  textFont('Arial');
  
  if (leaderboardData.length === 0) {
    text("Loading leaderboard data...", ORIGINAL_WIDTH / 2, ORIGINAL_HEIGHT / 2);
  } else {
    let tableWidth = 500;
    let tableStartX = ORIGINAL_WIDTH / 2 - tableWidth / 2;
    
    fill(0);
    textAlign(LEFT);
    text("Rank", tableStartX, 150);
    text("Name", tableStartX + 100, 150);
    textAlign(RIGHT);
    text("Score", tableStartX + tableWidth, 150);
    textAlign(LEFT);
    
    stroke(0);
    line(tableStartX, 160, tableStartX + tableWidth, 160);
    noStroke();
    
    for (let i = 0; i < Math.min(8, leaderboardData.length); i++) {
      const entry = leaderboardData[i];
      const y = 200 + i * 40;
      
      if (entry.email === playerEmail) {
        fill(255, 240, 200);
        rect(tableStartX, y - 25, tableWidth, 35);
      }
      
      fill(0);
      textAlign(LEFT);
      text(`${i + 1}`, tableStartX, y);
      
      let displayName = entry.name || 'Anonymous';
      if (displayName.length > 15) {
        displayName = displayName.substring(0, 12) + '...';
      }
      text(displayName, tableStartX + 100, y);
      
      textAlign(RIGHT);
      text(entry.score, tableStartX + tableWidth, y);
      textAlign(LEFT);
    }
  }
  
  if (errorMessage) {
    fill(255, 0, 0);
    textAlign(CENTER);
    textSize(18);
    text(errorMessage, ORIGINAL_WIDTH / 2, ORIGINAL_HEIGHT - 100);
  }
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}