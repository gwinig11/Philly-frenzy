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
let cityInput;
let submitButton;
let viewLeaderboardButton;
let backButton;
let errorMessage = '';
let successMessage = '';

// Setup function
function setup() {
  createCanvas(800, 600);
  
  frameRate(60);
  runner = new Runner();
  initBackground();
  
  // Create input fields (initially hidden)
  nameInput = createInput('');
  nameInput.position(-1000, -1000); // Initially off-screen
  nameInput.size(200, 30);
  nameInput.attribute('placeholder', 'Enter your name');
  nameInput.style('font-family', 'Arial');
  nameInput.style('padding', '5px');
  nameInput.style('border', '2px solid #575C87');
  nameInput.style('border-radius', '5px');
  nameInput.hide();
  
  emailInput = createInput('');
  emailInput.position(-1000, -1000); // Initially off-screen
  emailInput.size(200, 30);
  emailInput.attribute('placeholder', 'Enter your email');
  emailInput.style('font-family', 'Arial');
  emailInput.style('padding', '5px');
  emailInput.style('border', '2px solid #575C87');
  emailInput.style('border-radius', '5px');
  emailInput.hide();
  
  // Create submit button (initially hidden)
  submitButton = createButton('Submit Score');
  submitButton.position(-1000, -1000 + 10); // Adjusted position for margin
  submitButton.size(214, 30); // Match input field width
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
  
  // Create view leaderboard button (initially hidden)
  viewLeaderboardButton = createButton('View Leaderboard');
  viewLeaderboardButton.position(-1000, -1000 + 10 + 40); // Adjusted position for margin
  viewLeaderboardButton.size(214, 30); // Match input field width
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
  
  // Create back button for leaderboard (initially hidden)
  backButton = createButton('Back to Game');
  backButton.position(width/2 - 100, height - 50);
  backButton.size(200, 30);
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
  window.addEventListener('resize', repositionElements);
  
  // Ensure elements are positioned correctly relative to the canvas initially
  repositionElements();
}

// Reposition UI elements when window is resized
function repositionElements() {
  const canvasRect = document.querySelector('canvas').getBoundingClientRect();
  const canvasX = canvasRect.left;
  const canvasY = canvasRect.top;
  
  // Update positions relative to the canvas
  nameInput.position(canvasX + width/2 - 100, canvasY + height/2);
  emailInput.position(canvasX + width/2 - 100, canvasY + height/2 + 40);
  submitButton.position(canvasX + width/2 - 100, canvasY + height/2 + 80 + 10); // Adjusted position for margin
  viewLeaderboardButton.position(canvasX + width/2 - 100, canvasY + height/2 + 120 + 10); // Adjusted position for margin
  backButton.position(canvasX + width/2 - 100, canvasY + height - 50);
}

// Main draw loop
function draw() {
  background(220);
  if (gameState === 'start') {
    drawStartScreen();
    hideLeaderboardElements();
  } else if (gameState === 'play') {
    drawBackground();
    // Continuous movement with key holding
    if (keyIsDown(LEFT_ARROW)) {
      runner.x -= runner.speed;
    }
    if (keyIsDown(RIGHT_ARROW)) {
      runner.x += runner.speed;
    }
    runner.x = constrain(runner.x, runner.width / 2, width - runner.width / 2);
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

  // Centralized visibility control for backButton
  if (gameState === 'leaderboard') {
    backButton.show();
  } else {
    backButton.hide();
  }
}

// Handle key presses for game state changes
function keyPressed() {
  if (keyCode === ENTER) {
    if (gameState === 'start') {
      resetGame();         // Reset all game variables, including messages
      gameState = 'play';  // Start a new game
    } else if (gameState === 'levelComplete') {
      gameState = 'play';  // Continue to next level without resetting
    } else if (gameState === 'gameOver') {
      resetGame();         // Reset and return to start screen
      gameState = 'start';
    } else if (gameState === 'leaderboard') {
      gameState = 'start'; // Return to start without resetting (reset happens on next play)
    }
  }
  
  // ESC key to go back to start from leaderboard
  if (keyCode === ESCAPE && gameState === 'leaderboard') {
    gameState = 'start';
  }
}

// Runner class (Everyday Philadelphian)
class Runner {
  constructor() {
    this.x = width / 2;
    this.y = height - 100;
    this.width = 30; // Increased hitbox width
    this.height = 60; // Increased hitbox height
    this.speed = 3; // Adjusted for continuous movement
  }

  show() {
    // Head - bigger
    fill(255, 204, 153); // Skin tone
    ellipse(this.x, this.y - 48, 25, 25);
    
    // Phillies baseball cap - bigger
    fill(232, 24, 40); // Phillies red
    arc(this.x, this.y - 54, 28, 22, PI, 0, CHORD); // Cap crown
    rect(this.x - 14, this.y - 54, 28, 6); // Cap brim
    
    // Add a small detail to the cap brim to make it more defined
    fill(180, 20, 30); // Slightly darker red for the brim detail
    rect(this.x - 14, this.y - 52, 28, 2); // Small detail on the bottom edge of the brim
    
    // Phillies "P" logo on cap
    fill(255); // White
    textSize(10);
    textAlign(CENTER);
    text("P", this.x, this.y - 54); // Moved down a tiny bit from y-56 to y-54
    textAlign(LEFT); // Reset alignment for other text
    
    // Philadelphia Eagles jersey - TALLER
    fill(0, 76, 84); // Eagles midnight green
    rect(this.x - 15, this.y - 36, 30, 30); // Increased height from 24 to 30
    
    // Jersey number - just "1" now, positioned higher to center it on the jersey
    fill(255, 255, 255); // White
    textSize(12);
    textAlign(CENTER);
    text("1", this.x, this.y - 24); // Kept at same position to center on taller jersey
    textAlign(LEFT); // Reset alignment for other text
    
    // Blue waist/hip section to connect the legs at the top
    fill(0, 0, 139); // Dark blue (same as legs)
    rect(this.x - 15, this.y - 6, 30, 8); // Moved down to connect with taller jersey
    
    // Jeans - REPLACED with separate legs - EXTENDED to be much longer
    fill(0, 0, 139); // Dark blue
    // Left leg - extended to almost reach the bottom of the sneakers
    rect(this.x - 15, this.y + 2, 12, 44); // Moved down to connect with lower waist
    // Right leg - extended to almost reach the bottom of the sneakers
    rect(this.x + 3, this.y + 2, 12, 44); // Moved down to connect with lower waist
    
    // Small gap between legs to emphasize separation - extended to match new leg length
    fill(80, 80, 80); // Grey color matching the road
    rect(this.x - 3, this.y + 2, 6, 44); // Moved down to connect with lower waist
    
    // Plain white sneakers with no details - MOVED DOWN to connect with the longer pants
    fill(255); // White
    // Left sneaker - only a small part visible at the bottom
    rect(this.x - 15, this.y + 46, 12, 8); // Moved down to connect with lower legs
    // Add a small white extension to the left side of left sneaker
    rect(this.x - 19, this.y + 50, 4, 4); // Moved down to connect with lower sneaker
    
    // Right sneaker - only a small part visible at the bottom
    rect(this.x + 3, this.y + 46, 12, 8); // Moved down to connect with lower legs
    // Add a small white extension to the right side of right sneaker
    rect(this.x + 15, this.y + 50, 4, 4); // Moved down to connect with lower sneaker
    
    // Arms - IMPROVED to be more substantial instead of just lines
    // Left arm
    fill(0, 76, 84); // Same color as jersey (Eagles midnight green)
    noStroke();
    // Left arm - angled slightly outward and extended to reach lower hands
    quad(
      this.x - 15, this.y - 36, // Top left
      this.x - 7, this.y - 36,  // Top right
      this.x - 11, this.y - 6, // Bottom right - extended to waist level
      this.x - 19, this.y - 6  // Bottom left - extended to waist level
    );
    
    // Left hand
    fill(255, 204, 153); // Skin tone for hand
    rect(this.x - 19, this.y - 6, 8, 7); // Hand positioned at waist level
    
    // Right arm
    fill(0, 76, 84); // Same color as jersey
    // Right arm - angled slightly outward and extended to reach lower hands
    quad(
      this.x + 7, this.y - 36,  // Top left
      this.x + 15, this.y - 36, // Top right
      this.x + 19, this.y - 6, // Bottom right - extended to waist level
      this.x + 11, this.y - 6  // Bottom left - extended to waist level
    );
    
    // Right hand
    fill(255, 204, 153); // Skin tone for hand
    rect(this.x + 11, this.y - 6, 8, 7); // Hand positioned at waist level
    
    // Remove the leg lines that were overlapping the sneakers
    // line(this.x - 9, this.y + 24, this.x - 9, this.y + 36);
    // line(this.x + 9, this.y + 24, this.x + 9, this.y + 36);
    strokeWeight(1);
    noStroke();
  }
}

// Obstacle class (Philadelphia-themed items)
class Obstacle {
  constructor(type) {
    this.type = type;
    this.x = random(0, width - 30);
    this.y = -50;
    this.width = 30; // Hitbox size
    this.height = 30;
    this.speed = random(4, 7 + level);
  }

  update() {
    this.y += this.speed;
  }

  show() {
    if (this.type === 'cheesesteak') {
      // Improved cheesesteak with Whiz and wrapper
      fill(222, 184, 135); // Tan bread
      rect(this.x, this.y, 40, 15);
      
      // Cheese Whiz dripping
      fill(255, 215, 0); // Golden cheese
      rect(this.x + 5, this.y - 5, 30, 5);
      rect(this.x + 8, this.y - 8, 5, 3);
      rect(this.x + 20, this.y - 7, 5, 2);
      
      // Steak and onions
      fill(139, 69, 19); // Brown steak
      rect(this.x + 5, this.y + 2, 30, 8);
      
      // Wrapper with text
      stroke(0);
      strokeWeight(1);
      fill(255);
      rect(this.x - 5, this.y + 10, 50, 10); // Wrapper
      fill(0);
      textSize(7);
      textAlign(CENTER, CENTER); // Center both horizontally and vertically
      text("GENO'S", this.x + 20, this.y + 15); // Adjusted y position for better centering
      textAlign(LEFT);
      noStroke();
    } else if (this.type === 'wawa') {
      // Wawa cup - updated to red with white W
      fill(246, 67, 68); // Wawa red (#F64344)
      rect(this.x, this.y, 20, 30);
      fill(139, 69, 19); // Brown lid
      rect(this.x, this.y - 5, 20, 5);
      fill(255); // White 'W'
      textSize(10);
      textAlign(CENTER);
      text('W', this.x + 10, this.y + 15); // Centered the W horizontally
      textAlign(LEFT);
    } else if (this.type === 'love_statue') {
      // LOVE Statue
      fill(255, 0, 0); // Red
      
      // L
      rect(this.x, this.y, 10, 20);
      rect(this.x, this.y + 20, 15, 5);
      
      // O
      fill(0, 128, 0); // Green
      rect(this.x + 15, this.y, 15, 25);
      fill(255);
      rect(this.x + 20, this.y + 5, 5, 15);
      
      // VE
      fill(0, 0, 255); // Blue
      // V
      beginShape();
      vertex(this.x, this.y + 30); // Top left
      vertex(this.x + 15, this.y + 50); // Bottom center
      vertex(this.x + 30, this.y + 30); // Top right
      endShape(CLOSE);
      
      // E
      fill(255, 0, 0); // Red
      rect(this.x + 15, this.y + 30, 15, 5);
      rect(this.x + 15, this.y + 35, 10, 5);
      rect(this.x + 15, this.y + 40, 15, 5);
    } else if (this.type === 'phanatic') {
      // Phillie Phanatic
      
      // Green body
      fill(0, 175, 73); // Phanatic green
      ellipse(this.x + 15, this.y + 20, 25, 30);
      
      // Red tongue
      fill(255, 0, 0);
      ellipse(this.x + 15, this.y + 25, 10, 15);
      
      // Eyes
      fill(255);
      ellipse(this.x + 10, this.y + 10, 8, 8);
      ellipse(this.x + 20, this.y + 10, 8, 8);
      
      // Pupils
      fill(0);
      ellipse(this.x + 10, this.y + 10, 4, 4);
      ellipse(this.x + 20, this.y + 10, 4, 4);
      
      // Phanatic hat
      fill(0, 0, 139); // Dark blue
      arc(this.x + 15, this.y + 5, 20, 10, PI, 0, CHORD);
    } else if (this.type === 'lombardi_trophy') {
      // Lombardi Trophy
      
      // Base of trophy
      fill(150, 150, 150); // Silver/grey base
      rect(this.x + 5, this.y + 35, 20, 10);
      
      // Trophy stem
      fill(200, 200, 200); // Lighter silver
      rect(this.x + 12, this.y + 15, 6, 20);
      
      // Football on top
      fill(220, 220, 220); // Even lighter silver
      ellipse(this.x + 15, this.y + 10, 20, 15);
      
      // Football laces
      stroke(150, 150, 150);
      strokeWeight(1);
      line(this.x + 15, this.y + 5, this.x + 15, this.y + 15);
      line(this.x + 11, this.y + 10, this.x + 19, this.y + 10);
      
      // Trophy shine
      stroke(255, 255, 255, 150);
      line(this.x + 8, this.y + 10, this.x + 10, this.y + 8);
      
      noStroke();
    } else if (this.type === 'gritty') {
      // Gritty - the viral Flyers mascot
      
      // Orange fuzzy body
      fill(255, 130, 0); // Bright orange
      ellipse(this.x + 15, this.y + 20, 30, 35);
      
      // Black hockey helmet instead of wild hair
      fill(0); // Black
      arc(this.x + 15, this.y + 10, 28, 20, PI, 0, CHORD); // Helmet dome
      rect(this.x + 3, this.y + 10, 24, 5); // Helmet bottom edge
      
      // Helmet strap
      stroke(0);
      strokeWeight(2);
      line(this.x + 5, this.y + 15, this.x + 5, this.y + 25);
      line(this.x + 25, this.y + 15, this.x + 25, this.y + 25);
      noStroke();
      
      // Crazy googly eyes
      fill(255); // White eyeballs
      ellipse(this.x + 10, this.y + 15, 12, 12);
      ellipse(this.x + 20, this.y + 15, 12, 12);
      
      // Pupils looking in different directions
      fill(0); // Black pupils
      ellipse(this.x + 12, this.y + 14, 6, 6); // Left eye looking right
      ellipse(this.x + 18, this.y + 17, 6, 6); // Right eye looking down
      
      // Flyers logo on chest
      fill(0); // Black background
      ellipse(this.x + 15, this.y + 25, 15, 15);
      fill(255, 130, 0); // Orange wing
      beginShape();
      vertex(this.x + 10, this.y + 25);
      vertex(this.x + 15, this.y + 20);
      vertex(this.x + 20, this.y + 25);
      vertex(this.x + 15, this.y + 30);
      endShape(CLOSE);
      
      // Maniacal grin
      fill(255); // White teeth
      arc(this.x + 15, this.y + 35, 15, 10, 0, PI, CHORD);
      
      // Flyers hat
      fill(0, 0, 0); // Black
      arc(this.x + 15, this.y + 8, 25, 15, PI, 0, CHORD);
      fill(255, 130, 0); // Orange
      rect(this.x + 10, this.y + 5, 10, 3);
    }
  }

  offscreen() {
    return this.y > height + this.height;
  }
}

// Background initialization
function initBackground() {
  // Simplified background structure with more natural colors
  bgLayers = [
    { y: 0, color: color(135, 206, 235) }, // Sky blue
    { y: 450, color: color(80, 80, 80) }  // Ground/street
  ];
}

// Draw background
function drawBackground() {
  // Sky
  fill(bgLayers[0].color);
  rect(0, 0, width, height);
  
  // Sky with more realistic clouds made of multiple overlapping circles
  fill(255, 255, 255, 220);
  noStroke();
  
  // Cloud 1 (left side)
  ellipse(100, 80, 50, 40);
  ellipse(120, 75, 40, 45);
  ellipse(140, 80, 45, 35);
  ellipse(110, 90, 40, 30);
  ellipse(130, 90, 35, 25);
  
  // Cloud 2 (middle-left)
  ellipse(250, 60, 45, 40);
  ellipse(270, 55, 50, 45);
  ellipse(290, 60, 40, 35);
  ellipse(260, 70, 45, 30);
  ellipse(280, 70, 40, 35);
  
  // Cloud 3 (middle)
  ellipse(400, 90, 60, 40);
  ellipse(420, 85, 50, 45);
  ellipse(440, 90, 55, 35);
  ellipse(410, 100, 45, 30);
  ellipse(430, 100, 50, 35);
  
  // Cloud 4 (right side)
  ellipse(600, 70, 45, 35);
  ellipse(620, 65, 40, 40);
  ellipse(640, 70, 50, 30);
  ellipse(610, 80, 40, 25);
  ellipse(630, 80, 35, 30);
  
  // American Flag to the left of the columns
  // Flag pole - extended down to the tan building
  fill(150, 150, 150); // Gray pole
  rect(120, 100, 5, 200); // Extended height to reach the tan building (300)
  
  // Flag rectangle - moved to the left of the pole so it faces left
  fill(255, 255, 255); // White background
  rect(60, 100, 60, 40); // Moved to the left of the pole
  
  // Red stripes (7 red stripes in the American flag)
  fill(255, 0, 0); // Red
  for (let i = 0; i < 7; i++) {
    rect(60, 100 + i*6, 60, 3); // Moved to the left of the pole
  }
  
  // Blue rectangle (union) - now on the right side of the flag since it's facing left
  fill(0, 40, 104); // Dark blue
  rect(95, 100, 25, 22); // Moved to right side of the flag
  
  // White stars (simplified as dots)
  fill(255, 255, 255);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 4; j++) {
      ellipse(100 + j*6, 105 + i*6, 2, 2); // Adjusted position
    }
  }
  
  // Ground/street
  fill(bgLayers[1].color);
  rect(0, 450, width, 150);
  
  // Philadelphia Museum of Art (Main Feature)
  // Main building structure - sandy/beige color like in the image
  fill(220, 200, 170);
  rect(150, 150, 500, 150); // Main building body
  
  // Triangular pediment on top (the triangular roof structure)
  fill(200, 180, 150);
  beginShape();
  vertex(400, 100);  // Top of triangle
  vertex(150, 150);  // Left corner
  vertex(650, 150);  // Right corner
  endShape(CLOSE);
  
  // Museum columns - more accurate to the image
  for (let i = 0; i < 8; i++) {
    // Column base
    fill(210, 190, 160);
    rect(190 + i*60, 150, 40, 10);
    
    // Column shaft - taller and more prominent
    fill(230, 210, 180);
    rect(195 + i*60, 160, 30, 140);
    
    // Column capital (top decorative part)
    fill(210, 190, 160);
    rect(190 + i*60, 150, 40, 10);
  }
  
  // Windows/details on the museum
  fill(180, 160, 140);
  for (let i = 0; i < 7; i++) {
    rect(210 + i*60, 180, 20, 40);
  }
  
  // Adding simple tan buildings along the sides of the stairs
  fill(220, 200, 170); // Same tan color as the museum
  
  // Left side building - EXTENDED to edge of screen
  rect(0, 300, 150, 150);
  // Windows for left building
  fill(180, 160, 140);
  rect(25, 320, 20, 30);
  rect(65, 320, 20, 30);
  rect(105, 320, 20, 30);
  rect(25, 370, 20, 30);
  rect(65, 370, 20, 30);
  rect(105, 370, 20, 30);
  
  // Right side building - EXTENDED to edge of screen
  fill(220, 200, 170);
  rect(650, 300, 150, 150);
  // Windows for right building
  fill(180, 160, 140);
  rect(675, 320, 20, 30);
  rect(715, 320, 20, 30);
  rect(755, 320, 20, 30);
  rect(675, 370, 20, 30);
  rect(715, 370, 20, 30);
  rect(755, 370, 20, 30);
  
  // Add more dimensional circular trees to the left side of the stairs
  // Tree 1 - left side - fuller tree with small trunk
  // Small trunk to connect to building - MADE WIDER AND TALLER
  fill(101, 67, 33); // Brown color for trunk
  rect(25, 270, 10, 30); // Taller trunk connecting to building
  
  // Tree foliage with multiple circles for dimension
  fill(25, 120, 25); // Darker green for depth
  ellipse(30, 240, 55, 55); // Base circle - moved up from y=250 to y=240
  ellipse(30, 260, 50, 50); // Bottom circle - moved up from y=270 to y=260
  fill(34, 139, 34); // Medium forest green
  ellipse(30, 235, 45, 45); // Middle circle - moved up from y=245 to y=235
  ellipse(30, 255, 42, 42); // Lower middle circle - moved up from y=265 to y=255
  fill(40, 160, 40); // Lighter green for highlights
  ellipse(30, 235, 35, 35); // Top circle - moved down from y=230 to y=235
  ellipse(20, 245, 20, 20); // Left detail - moved up from y=255 to y=245
  ellipse(40, 245, 20, 20); // Right detail - moved up from y=255 to y=245
  ellipse(30, 225, 15, 15); // Top detail - moved down from y=215 to y=225
  
  // Tree 2 - left side - fuller tree with small trunk
  // Small trunk to connect to building - MADE WIDER AND TALLER
  fill(101, 67, 33); // Brown color for trunk
  rect(75, 265, 10, 35); // Taller trunk connecting to building
  
  // Tree foliage with multiple circles for dimension
  fill(25, 120, 25); // Darker green for depth
  ellipse(80, 230, 65, 65); // Base circle - moved up from y=240 to y=230
  ellipse(80, 255, 60, 60); // Bottom circle - moved up from y=265 to y=255
  fill(34, 139, 34); // Medium forest green
  ellipse(80, 225, 55, 55); // Middle circle - moved up from y=235 to y=225
  ellipse(80, 250, 52, 52); // Lower middle circle - moved up from y=260 to y=250
  fill(40, 160, 40); // Lighter green for highlights
  ellipse(80, 225, 45, 45); // Top circle - moved down from y=220 to y=225
  ellipse(65, 235, 25, 25); // Left detail - moved up from y=245 to y=235
  ellipse(95, 235, 25, 25); // Right detail - moved up from y=245 to y=235
  ellipse(80, 215, 20, 20); // Top detail - moved down from y=205 to y=215
  
  // Tree 3 - left side - fuller tree with small trunk
  // Small trunk to connect to building - MADE WIDER AND TALLER
  fill(101, 67, 33); // Brown color for trunk
  rect(125, 280, 10, 20); // Taller trunk connecting to building
  
  // Tree foliage with multiple circles for dimension
  fill(25, 120, 25); // Darker green for depth
  ellipse(130, 250, 50, 50); // Base circle - moved up from y=260 to y=250
  ellipse(130, 270, 45, 45); // Bottom circle - moved up from y=280 to y=270
  fill(34, 139, 34); // Medium forest green
  ellipse(130, 245, 40, 40); // Middle circle - moved up from y=255 to y=245
  ellipse(130, 265, 37, 37); // Lower middle circle - moved up from y=275 to y=265
  fill(40, 160, 40); // Lighter green for highlights
  ellipse(130, 245, 30, 30); // Top circle - moved down from y=240 to y=245
  ellipse(120, 255, 18, 18); // Left detail - moved up from y=265 to y=255
  ellipse(140, 255, 18, 18); // Right detail - moved up from y=265 to y=255
  
  // Add more dimensional circular trees to the right side of the stairs
  // Tree 1 - right side - fuller tree with small trunk
  // Small trunk to connect to building - MADE WIDER AND TALLER
  fill(101, 67, 33); // Brown color for trunk
  rect(665, 270, 10, 30); // Taller trunk connecting to building
  
  // Tree foliage with multiple circles for dimension
  fill(25, 120, 25); // Darker green for depth
  ellipse(670, 250, 55, 55); // Base circle
  ellipse(670, 270, 50, 50); // Bottom circle to extend foliage down
  fill(34, 139, 34); // Medium forest green
  ellipse(670, 245, 45, 45); // Middle circle
  ellipse(670, 265, 42, 42); // Lower middle circle
  fill(40, 160, 40); // Lighter green for highlights
  ellipse(670, 245, 35, 35); // Top circle - moved down from y=240 to y=245
  ellipse(660, 255, 20, 20); // Left detail
  ellipse(680, 255, 20, 20); // Right detail
  ellipse(670, 235, 15, 15); // Top detail - moved down from y=225 to y=235
  
  // Tree 2 - right side - fuller tree with small trunk
  // Small trunk to connect to building - MADE WIDER AND TALLER
  fill(101, 67, 33); // Brown color for trunk
  rect(715, 265, 10, 35); // Taller trunk connecting to building
  
  // Tree foliage with multiple circles for dimension
  fill(25, 120, 25); // Darker green for depth
  ellipse(720, 240, 65, 65); // Base circle
  ellipse(720, 265, 60, 60); // Bottom circle to extend foliage down
  fill(34, 139, 34); // Medium forest green
  ellipse(720, 235, 55, 55); // Middle circle
  ellipse(720, 260, 52, 52); // Lower middle circle
  fill(40, 160, 40); // Lighter green for highlights
  ellipse(720, 235, 45, 45); // Top circle - moved down from y=230 to y=235
  ellipse(705, 245, 25, 25); // Left detail
  ellipse(735, 245, 25, 25); // Right detail
  ellipse(720, 225, 20, 20); // Top detail - moved down from y=215 to y=225
  
  // Tree 3 - right side - fuller tree with small trunk
  // Small trunk to connect to building - MADE WIDER AND TALLER
  fill(101, 67, 33); // Brown color for trunk
  rect(765, 280, 10, 20); // Taller trunk connecting to building
  
  // Tree foliage with multiple circles for dimension
  fill(25, 120, 25); // Darker green for depth
  ellipse(770, 250, 50, 50); // Base circle - moved up from y=260 to y=250
  ellipse(770, 270, 45, 45); // Bottom circle - moved up from y=280 to y=270
  fill(34, 139, 34); // Medium forest green
  ellipse(770, 245, 40, 40); // Middle circle - moved up from y=255 to y=245
  ellipse(770, 265, 37, 37); // Lower middle circle - moved up from y=275 to y=265
  fill(40, 160, 40); // Lighter green for highlights
  ellipse(770, 245, 30, 30); // Top circle - moved down from y=240 to y=245
  ellipse(760, 255, 18, 18); // Left detail - moved up from y=265 to y=255
  ellipse(780, 255, 18, 18); // Right detail - moved up from y=265 to y=255
  
  // Famous "Rocky Steps" - IMPROVED to look more like stairs
  // Base of steps - slightly darker tan
  fill(190, 180, 160);
  rect(150, 300, 500, 150);
  
  // Individual steps with darker tan lines to show definition
  for (let i = 0; i < 15; i++) {
    // Top face of each step (lighter tan)
    fill(210, 200, 180);
    rect(150, 300 + i*10, 500, 10);
    
    // Darker tan line to define each step edge
    stroke(160, 150, 130);
    strokeWeight(2);
    line(150, 300 + i*10, 650, 300 + i*10);
    
    // Vertical line for step height
    line(150, 300 + i*10, 150, 300 + i*10 + 10);
    line(650, 300 + i*10, 650, 300 + i*10 + 10);
    
    // Add some subtle shading to create depth
    for (let j = 0; j < 5; j++) {
      stroke(170, 160, 140, 100); // Semi-transparent for subtle effect
      line(250 + j*100, 300 + i*10, 250 + j*100, 300 + i*10 + 10);
    }
  }
  noStroke();
  
  // Small bollards/barriers in front of the steps (visible in the image)
  fill(200, 200, 200);
  for (let i = 0; i < 10; i++) {
    ellipse(180 + i*50, 440, 10, 10);
  }
  
  // Street lines
  fill(255, 255, 0);
  for (let i = 0; i < 8; i++) {
    rect(i*100 + 30, 550, 40, 5);
  }
  
  // ROCKY STATUE - MOVED BACK TO THE RIGHT SIDE
  // Larger pedestal
  fill(150, 120, 90);
  rect(680, 420, 80, 40);
  
  // Statue body - changed from bronze to blue-gray color with better proportions
  fill(67, 86, 93); // #43565D - blue-gray color
  
  // Legs in stance position - thinner and taller
  rect(715, 370, 10, 50); // Left leg - thinner (width 10 instead of 15) and taller (height 50 instead of 40)
  rect(735, 370, 10, 50); // Right leg - thinner (width 10 instead of 15) and taller (height 50 instead of 40)
  
  // Torso - even thinner and taller, less boxy
  fill(67, 86, 93); // #43565D - blue-gray color (slightly darker for depth)
  rect(715, 310, 30, 60); // Main torso - thinner (width 30 instead of 40) and taller (height 60 instead of 50)
  
  // Add shoulder definition to make it less boxy
  fill(67, 86, 93); // Same color as torso
  rect(705, 310, 10, 15); // Left shoulder
  rect(745, 310, 10, 15); // Right shoulder
  
  // Arms in boxing pose - adjusted to point upward
  // Left arm raised
  fill(67, 86, 93); // #43565D - blue-gray color
  rect(700, 295, 8, 25); // Upper arm - angled upward
  rect(695, 270, 10, 25); // Forearm - pointing upward
  
  // Right arm raised
  rect(752, 295, 8, 25); // Upper arm - angled upward
  rect(755, 270, 10, 25); // Forearm - pointing upward
  
  // Head - positioned to connect with the taller body
  ellipse(730, 300, 25, 25); // Y position adjusted for taller body
  
  // Boxing gloves - more realistic shape
  fill(115, 109, 63); // #736D3F - olive/khaki color
  
  // Left glove - more realistic shape with thumb
  ellipse(700, 265, 18, 16); // Main part of glove (slightly oval) - moved down from y=260 to y=265
  ellipse(692, 267, 8, 8);   // Thumb part - moved down from y=262 to y=267
  
  // Right glove - more realistic shape with thumb
  ellipse(761, 265, 18, 16); // Main part of glove (slightly oval) - moved down from y=260 to y=265
  ellipse(769, 267, 8, 8);   // Thumb part - moved down from y=262 to y=267
  
  // Add some details to the statue
  // Boxing shorts - same color as the body instead of white
  fill(67, 86, 93); // Same blue-gray as the body
  rect(715, 360, 30, 15); // Shorts
  
  // Belt
  fill(200, 170, 0); // Gold color
  rect(715, 360, 30, 5); // Belt
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
  
  // Updated styling for the game title with a more dynamic design
  textAlign(CENTER);
  
  // Set a better font for the title
  textFont('Impact');
  
  // Create a more dynamic shadow effect
  fill(40, 45, 80); // Darker shadow color
  textSize(68);
  text("PHILLY FRENZY", width / 2 + 5, height / 2 - 30); 
  
  // Add a second shadow layer for depth
  fill(60, 65, 100);
  textSize(68);
  text("PHILLY FRENZY", width / 2 + 3, height / 2 - 32);
  
  // Main title text with a more vibrant color
  fill(232, 24, 40); // #E81828 - bright red color
  textSize(68);
  text("PHILLY FRENZY", width / 2, height / 2 - 35);
  

  
  // Reset text style and font for other elements
  textStyle(NORMAL);
  textFont('Arial');
  textSize(24);
  fill(87, 92, 135); // Reset to original color for other text
  text("Press ENTER to start", width / 2, height / 2 + 30);
  textSize(18);
  text("Hold ← and → to move", width / 2, height / 2 + 60);
  
  // Add law firm information at the bottom with larger text
  textSize(16);
  fill(0, 0, 0); // Black color for "Presented by:" text
  text("Presented by:", width / 2, height - 100);
  fill(87, 92, 135); // Reset to original color for other text
  textSize(20);
  textStyle(BOLD); // Set text style to bold
  text("Fine, Staud and Levy", width / 2, height - 75);
  textStyle(NORMAL); // Reset text style to normal
  textSize(16);
  text("Focusing on Our Clients Since 1958", width / 2, height - 50);
  text("215.665.0100", width / 2, height - 30);
}

function drawLevelComplete() {
  fill(87, 92, 135);
  textSize(32);
  textAlign(CENTER);
  textStyle(BOLD); // Add bold style for the level complete text
  fill(33, 139, 33); // #218B21 - green color for level complete text
  text(`Level ${level - 1} Complete!`, width / 2, height / 2);
  textStyle(NORMAL); // Reset to normal style for the rest of the text
  textSize(24);
  fill(0); // Black color for "Press ENTER to continue"
  text("Press ENTER to continue", width / 2, height / 2 + 50);
  
  // Reset to original color for law firm information
  fill(87, 92, 135);
  // Add law firm information at the bottom with larger text
  textSize(16);
  text("Presented by:", width / 2, height - 100);
  textSize(20);
  textStyle(BOLD); // Set text style to bold
  text("Fine, Staud and Levy", width / 2, height - 75);
  textStyle(NORMAL); // Reset text style to normal
  textSize(16);
  text("Focusing on Our Clients Since 1958", width / 2, height - 50);
  text("215.665.0100", width / 2, height - 30);
}

// non game stuffffffffff


function drawGameOver() {
  // Existing code for background, title, score, etc.
  fill(87, 92, 135);
  textSize(32);
  textAlign(CENTER);
  
  fill(232, 24, 40); // Bright red for "Liberty Crushed"
  textFont('Impact');
  textSize(42);
  text("Liberty Crushed!", width / 2, height / 3 - 40);
  textFont('Arial');
  textSize(24);
  
  fill(0, 0, 0); // Black for score and restart text
  text(`Final Score: ${score}`, width / 2, height / 3);
  text("Press ENTER to restart", width / 2, height / 3 + 30);
  
  // Position input fields and buttons
  const canvasRect = document.querySelector('canvas').getBoundingClientRect();
  const canvasX = canvasRect.left;
  const canvasY = canvasRect.top;
  const centerX = width / 2 - 100;
  nameInput.position(canvasX + centerX, canvasY + height/2);
  emailInput.position(canvasX + centerX, canvasY + height/2 + 40);
  submitButton.position(canvasX + centerX, canvasY + height/2 + 80 + 15);
  viewLeaderboardButton.position(canvasX + centerX, canvasY + height/2 + 120 + 10);
  
  // Display messages with adjusted position
  if (errorMessage) {
    fill(255, 0, 0); // Red for error
    textSize(16);
    text(errorMessage, width / 2, height/2 + 180); // Moved down to 480
  }
  
  if (successMessage) {
    fill(0, 128, 0); // Green for success
    textSize(16);
    text(successMessage, width / 2, height/2 + 180); // Moved down to 480
  }
  
  // Law firm text
  fill(87, 92, 135);
  textSize(20);
  text("For real-life obstacles, call Fine, Staud and Levy", width / 2, height - 60);
  text("215.665.0100", width / 2, height - 30);
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
  nameInput.value(''); // Clear the name input field
  emailInput.value(''); // Clear the email input field
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

// Submit score to Supabase
async function submitScore() {
  playerName = nameInput.value();
  playerEmail = emailInput.value();
  
  // Validation
  if (!playerName) {
    errorMessage = 'Please enter your name';
    return;
  }
  
  // Simple email validation
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
          city: "Philadelphia", // Default city
          score: score 
        }
      ]);
      
    if (error) {
      console.error('Error submitting score:', error);
      errorMessage = 'Failed to submit score. Please try again.';
    } else {
      successMessage = 'Score submitted successfully!';
      errorMessage = '';
      // Hide input after successful submission
      nameInput.hide();
      emailInput.hide();
      submitButton.hide();
    }
  } catch (err) {
    console.error('Error:', err);
    errorMessage = 'An unexpected error occurred. Please try again.';
  }
}

// Fetch leaderboard data from Supabase
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

// Draw the leaderboard screen
function drawLeaderboard() {
  background(220);
  
  // Title
  fill(87, 92, 135);
  textSize(42);
  textAlign(CENTER);
  textFont('Impact');
  text("LEADERBOARD", width / 2, 80);
  
  // Display leaderboard data
  textSize(24);
  textFont('Arial');
  
  if (leaderboardData.length === 0) {
    text("Loading leaderboard data...", width / 2, height / 2);
  } else {
    // Define table dimensions
    let tableWidth = 500;
    let tableStartX = width / 2 - tableWidth / 2;
    
    // Header
    fill(0);
    textAlign(LEFT);
    text("Rank", tableStartX, 150);
    text("Name", tableStartX + 100, 150);
    textAlign(RIGHT);
    text("Score", tableStartX + tableWidth, 150);
    textAlign(LEFT);
    
    // Draw line under header
    stroke(0);
    line(tableStartX, 160, tableStartX + tableWidth, 160);
    noStroke();
    
    // Entries - Limited to top 8 scores
    for (let i = 0; i < Math.min(8, leaderboardData.length); i++) {
      const entry = leaderboardData[i];
      const y = 200 + i * 40;
      
      // Highlight the current player's score
      if (entry.email === playerEmail) {
        fill(255, 240, 200); // Light yellow background
        rect(tableStartX, y - 25, tableWidth, 35);
      }
      
      fill(0);
      textAlign(LEFT);
      text(`${i + 1}`, tableStartX, y);
      
      // Truncate name if too long
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
  
  // Display error message if any
  if (errorMessage) {
    fill(255, 0, 0);
    textAlign(CENTER);
    textSize(18);
    text(errorMessage, width / 2, height - 100);
  }
  
  hideLeaderboardElements();
}

// Email validation helper
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}