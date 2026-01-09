/**
 * Deep Dive - Underwater Survival Game
 * =====================================
 * An arcade-style 2D game with underwater physics and a pursuing enemy.
 *
 * Structure:
 * - Game Configuration (constants)
 * - Utility Functions
 * - Input System
 * - Camera System
 * - Player System
 * - Enemy System (Pursuing Fish)
 * - Collision System
 * - Particle System (visual feedback)
 * - Rendering System
 * - Game Loop
 */

// =============================================================================
// GAME CONFIGURATION
// =============================================================================

const CONFIG = {
    // Canvas settings
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,

    // World settings - very tall vertical world
    WORLD_WIDTH: 800,
    WORLD_HEIGHT: 10000,  // 10,000 pixels tall for deep diving
    WORLD_TOP_BOUNDARY: 50,  // Surface of water

    // Player settings
    PLAYER: {
        WIDTH: 48,              // 32 * 1.5 = 48 (rendered size)
        HEIGHT: 48,             // 32 * 1.5 = 48 (rendered size)
        SPRITE_FRAMES: 2,           // Number of animation frames
        SPRITE_FRAME_WIDTH: 32,     // Width of each frame in spritesheet
        SPRITE_FRAME_HEIGHT: 32,    // Height of each frame
        ANIMATION_SPEED: 0.15,      // Frames per game tick when moving
        MAX_SPEED: 5,
        ACCELERATION: 0.15,      // Slow acceleration for underwater feel
        DECELERATION: 0.02,      // Very slow deceleration (momentum)
        FRICTION: 0.98,          // Water resistance when not actively moving
        MAX_HEALTH: 100,
        INVINCIBILITY_TIME: 1500, // ms of invincibility after taking damage

        // Dash settings
        DASH_SPEED: 15,
        DASH_DURATION: 150,      // ms
        DASH_COOLDOWN: 1000,     // ms
    },

    // Enemy (Pursuing Fish) settings - inspired by Dark Esau
    ENEMY: {
        WIDTH: 60,              // 40 * 1.5 = 60 (rendered size)
        HEIGHT: 38,             // 25 * 1.5 = 37.5 ~= 38 (rendered size)
        SPRITE_FRAMES: 2,           // Number of animation frames per state
        SPRITE_FRAME_WIDTH: 40,     // Width of each frame in spritesheet
        SPRITE_FRAME_HEIGHT: 25,    // Height of each frame
        ANIMATION_SPEED: 0.12,      // Frames per game tick
        NORMAL_SPEED: 2.5,       // Slow pursuit speed
        CHARGE_SPEED: 12,        // Fast charge speed
        CHARGE_WINDUP: 800,      // ms to telegraph charge
        CHARGE_DURATION: 400,    // ms of actual charge
        CHARGE_COOLDOWN: 2000,   // ms between charges
        CHARGE_DAMAGE: 25,
        TRACKING_SMOOTHING: 0.03, // How smoothly it follows (lower = smoother)
    },

    // Camera settings
    CAMERA: {
        SMOOTHING: 0.08,         // Camera follow smoothness
        LOOK_AHEAD: 100,         // Pixels to look ahead in movement direction
    },

    // Background settings (nine-slice animated)
    BACKGROUND: {
        FRAME_WIDTH: 48,         // Width of each frame in spritesheet
        FRAME_HEIGHT: 48,        // Height of each frame
        FRAMES: 4,               // Number of animation frames
        ANIMATION_SPEED: 0.05,   // Slow animation for subtle effect
        BORDER: 16,              // Nine-slice border size (corners and edges)
        TILE_SCALE: 3,           // Scale factor for rendering (48 * 3 = 144px tiles)
    },

    // PufferFish settings
    PUFFERFISH: {
        WIDTH: 48,               // 32 * 1.5 = 48 (rendered size)
        HEIGHT: 48,              // 32 * 1.5 = 48 (rendered size)
        SPRITE_FRAME_WIDTH: 32,  // Width of each frame in spritesheet
        SPRITE_FRAME_HEIGHT: 32, // Height of each frame
        TOTAL_FRAMES: 9,         // Total frames (1 swim + 8 puff up)
        PUFF_ANIMATION_SPEED: 0.2, // Speed of puff animation
        SWIM_SPEED: 1.5,         // Peaceful swimming speed
        SCARE_DISTANCE: 120,     // Distance at which player scares it
        SPAWN_MARGIN: 100,       // Distance offscreen to spawn
        SPAWN_INTERVAL: 3000,    // ms between spawn attempts
        MAX_COUNT: 5,            // Maximum pufferfish on screen
        DIRECTION_CHANGE_TIME: 2000, // ms between direction changes
    },

    // Colors
    COLORS: {
        WATER_SURFACE: '#1a4a6e',
        WATER_DEEP: '#0a1a2e',
        PLAYER: '#44aaff',
        PLAYER_DAMAGED: '#ff4444',
        ENEMY_NORMAL: '#ff6644',
        ENEMY_CHARGING: '#ff2200',
        ENEMY_WINDUP: '#ffaa00',
        PARTICLES_BUBBLE: '#88ccff',
        PARTICLES_DASH: '#66ffff',
    }
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

const Utils = {
    /**
     * Calculate distance between two points
     */
    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },

    /**
     * Normalize a vector to unit length
     */
    normalize(x, y) {
        const length = Math.sqrt(x * x + y * y);
        if (length === 0) return { x: 0, y: 0 };
        return { x: x / length, y: y / length };
    },

    /**
     * Linear interpolation
     */
    lerp(start, end, factor) {
        return start + (end - start) * factor;
    },

    /**
     * Clamp a value between min and max
     */
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    /**
     * Check rectangle collision
     */
    rectCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    },

    /**
     * Get angle between two points
     */
    angleBetween(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    }
};

// =============================================================================
// SPRITE LOADER
// =============================================================================

/**
 * Handles loading sprite images
 * Tracks loading state so game can wait for assets
 */
const SpriteLoader = {
    sprites: {},
    loaded: 0,
    total: 0,

    /**
     * Load a sprite image
     * @param {string} name - Key to reference this sprite
     * @param {string} path - Path to the image file
     */
    load(name, path) {
        this.total++;
        const img = new Image();
        img.onload = () => {
            this.sprites[name] = img;
            this.loaded++;
            console.log(`Loaded sprite: ${name}`);
        };
        img.onerror = () => {
            console.warn(`Failed to load sprite: ${name} from ${path}`);
            this.loaded++;  // Count as loaded to not block game
        };
        img.src = path;
    },

    /**
     * Get a loaded sprite by name
     * @param {string} name - Key of the sprite
     * @returns {HTMLImageElement|null}
     */
    get(name) {
        return this.sprites[name] || null;
    },

    /**
     * Check if all sprites are loaded
     */
    isReady() {
        return this.loaded >= this.total;
    }
};

// =============================================================================
// INPUT SYSTEM
// =============================================================================

/**
 * Handles keyboard input state
 * Tracks which keys are currently pressed
 */
const Input = {
    keys: {},

    init() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            // Prevent default for game keys
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // Handle window blur to reset keys
        window.addEventListener('blur', () => {
            this.keys = {};
        });
    },

    /**
     * Check if a movement direction is pressed
     */
    isMovingLeft() {
        return this.keys['ArrowLeft'] || this.keys['KeyA'];
    },

    isMovingRight() {
        return this.keys['ArrowRight'] || this.keys['KeyD'];
    },

    isMovingUp() {
        return this.keys['ArrowUp'] || this.keys['KeyW'];
    },

    isMovingDown() {
        return this.keys['ArrowDown'] || this.keys['KeyS'];
    },

    isDashing() {
        return this.keys['Space'];
    }
};

// =============================================================================
// CAMERA SYSTEM
// =============================================================================

/**
 * Camera that smoothly follows the player vertically
 * Player is constrained to screen width, so camera only moves on Y axis
 */
class Camera {
    constructor() {
        this.x = 0;  // Fixed at 0 since player is constrained horizontally
        this.y = 0;
        this.targetY = 0;
    }

    /**
     * Update camera position to follow a target
     * @param {Object} target - Object with x, y, velocityY properties
     */
    update(target) {
        // Calculate target camera position (centered on player with look-ahead)
        const lookAhead = target.velocityY * CONFIG.CAMERA.LOOK_AHEAD * 0.1;
        this.targetY = target.y - CONFIG.CANVAS_HEIGHT / 2 + lookAhead;

        // Clamp target to world bounds
        this.targetY = Utils.clamp(
            this.targetY,
            0,
            CONFIG.WORLD_HEIGHT - CONFIG.CANVAS_HEIGHT
        );

        // Smoothly interpolate to target position
        this.y = Utils.lerp(this.y, this.targetY, CONFIG.CAMERA.SMOOTHING);
    }

    /**
     * Convert world coordinates to screen coordinates
     */
    worldToScreen(worldX, worldY) {
        return {
            x: worldX - this.x,
            y: worldY - this.y
        };
    }
}

// =============================================================================
// PARTICLE SYSTEM
// =============================================================================

/**
 * Simple particle system for visual feedback
 * Used for bubbles, dash effects, damage indicators
 */
class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    /**
     * Spawn particles at a position
     * @param {number} x - World X position
     * @param {number} y - World Y position
     * @param {string} type - 'bubble', 'dash', or 'damage'
     * @param {number} count - Number of particles to spawn
     */
    spawn(x, y, type, count = 5) {
        for (let i = 0; i < count; i++) {
            const particle = {
                x,
                y,
                velocityX: (Math.random() - 0.5) * 3,
                velocityY: (Math.random() - 0.5) * 3,
                life: 1.0,  // 1.0 to 0.0
                decay: 0.02 + Math.random() * 0.02,
                size: 3 + Math.random() * 5,
                type
            };

            // Adjust based on type
            if (type === 'bubble') {
                particle.velocityY = -1 - Math.random() * 2;  // Bubbles rise
                particle.decay = 0.01;
            } else if (type === 'dash') {
                particle.decay = 0.05;
                particle.size = 5 + Math.random() * 8;
            }

            this.particles.push(particle);
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            p.x += p.velocityX;
            p.y += p.velocityY;
            p.life -= p.decay;

            // Apply water resistance
            p.velocityX *= 0.95;
            p.velocityY *= 0.95;

            // Remove dead particles
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    render(ctx, camera) {
        for (const p of this.particles) {
            const screenPos = camera.worldToScreen(p.x, p.y);

            ctx.globalAlpha = p.life * 0.7;
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, p.size * p.life, 0, Math.PI * 2);

            // Color based on type
            if (p.type === 'bubble') {
                ctx.fillStyle = CONFIG.COLORS.PARTICLES_BUBBLE;
            } else if (p.type === 'dash') {
                ctx.fillStyle = CONFIG.COLORS.PARTICLES_DASH;
            } else {
                ctx.fillStyle = '#ff4444';
            }

            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }
}

// =============================================================================
// PLAYER SYSTEM
// =============================================================================

/**
 * Player class with underwater physics and dash ability
 * Movement feels floaty with gradual acceleration and maintained momentum
 */
class Player {
    constructor(x, y) {
        // Position (center of player)
        this.x = x;
        this.y = y;

        // Velocity
        this.velocityX = 0;
        this.velocityY = 0;

        // Dimensions
        this.width = CONFIG.PLAYER.WIDTH;
        this.height = CONFIG.PLAYER.HEIGHT;

        // Health
        this.health = CONFIG.PLAYER.MAX_HEALTH;
        this.invincibleUntil = 0;  // Timestamp when invincibility ends

        // Dash state
        this.isDashing = false;
        this.dashDirection = { x: 0, y: 0 };
        this.dashEndTime = 0;
        this.dashCooldownEnd = 0;

        // Visual state
        this.facingRight = true;

        // Animation state
        this.animationFrame = 0;      // Current frame (can be fractional)
        this.currentFrame = 0;        // Actual frame index to display (integer)
    }

    /**
     * Check if player can currently dash
     */
    canDash() {
        return !this.isDashing && Date.now() > this.dashCooldownEnd;
    }

    /**
     * Get dash cooldown remaining (0-1, for UI)
     */
    getDashCooldownPercent() {
        const now = Date.now();
        if (now >= this.dashCooldownEnd) return 1;
        const remaining = this.dashCooldownEnd - now;
        return 1 - (remaining / CONFIG.PLAYER.DASH_COOLDOWN);
    }

    /**
     * Initiate a dash in the current movement direction
     */
    startDash(particles) {
        if (!this.canDash()) return false;

        // Determine dash direction from current velocity or facing direction
        let dirX = this.velocityX;
        let dirY = this.velocityY;

        // If nearly stationary, dash in facing direction
        if (Math.abs(dirX) < 0.5 && Math.abs(dirY) < 0.5) {
            dirX = this.facingRight ? 1 : -1;
            dirY = 0;
        }

        // Normalize dash direction
        this.dashDirection = Utils.normalize(dirX, dirY);

        // Set dash state
        this.isDashing = true;
        this.dashEndTime = Date.now() + CONFIG.PLAYER.DASH_DURATION;
        this.dashCooldownEnd = Date.now() + CONFIG.PLAYER.DASH_COOLDOWN;

        // Spawn dash particles
        particles.spawn(this.x, this.y, 'dash', 10);

        return true;
    }

    /**
     * Update player state
     * @param {number} deltaTime - Time since last frame (not used currently, fixed timestep)
     * @param {ParticleSystem} particles - For spawning effects
     */
    update(deltaTime, particles) {
        const now = Date.now();

        // Handle dash state
        if (this.isDashing) {
            if (now > this.dashEndTime) {
                this.isDashing = false;
            } else {
                // During dash, override velocity with dash direction
                this.velocityX = this.dashDirection.x * CONFIG.PLAYER.DASH_SPEED;
                this.velocityY = this.dashDirection.y * CONFIG.PLAYER.DASH_SPEED;

                // Spawn trail particles
                if (Math.random() < 0.5) {
                    particles.spawn(this.x, this.y, 'dash', 2);
                }
            }
        } else {
            // Normal underwater movement with acceleration
            this.handleMovement();
        }

        // Apply velocity to position
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Constrain to world bounds
        // X is constrained to screen width
        this.x = Utils.clamp(
            this.x,
            this.width / 2,
            CONFIG.WORLD_WIDTH - this.width / 2
        );

        // Y is constrained to world height
        this.y = Utils.clamp(
            this.y,
            CONFIG.WORLD_TOP_BOUNDARY + this.height / 2,
            CONFIG.WORLD_HEIGHT - this.height / 2
        );

        // Update facing direction based on horizontal velocity
        if (Math.abs(this.velocityX) > 0.5) {
            this.facingRight = this.velocityX > 0;
        }

        // Update animation - only animate when moving
        const speed = Math.sqrt(this.velocityX ** 2 + this.velocityY ** 2);
        if (speed > 0.5) {
            // Animate faster when moving faster
            this.animationFrame += CONFIG.PLAYER.ANIMATION_SPEED * (speed / CONFIG.PLAYER.MAX_SPEED + 0.5);
            this.currentFrame = Math.floor(this.animationFrame) % CONFIG.PLAYER.SPRITE_FRAMES;
        } else {
            // Reset to first frame when stationary
            this.animationFrame = 0;
            this.currentFrame = 0;
        }

        // Occasional bubble particles when moving
        if ((Math.abs(this.velocityX) > 1 || Math.abs(this.velocityY) > 1) && Math.random() < 0.1) {
            particles.spawn(this.x, this.y - this.height / 2, 'bubble', 1);
        }
    }

    /**
     * Handle movement input and apply underwater physics
     */
    handleMovement() {
        // Calculate input direction
        let inputX = 0;
        let inputY = 0;

        if (Input.isMovingLeft()) inputX -= 1;
        if (Input.isMovingRight()) inputX += 1;
        if (Input.isMovingUp()) inputY -= 1;
        if (Input.isMovingDown()) inputY += 1;

        // Normalize diagonal movement
        if (inputX !== 0 && inputY !== 0) {
            inputX *= 0.707;  // 1/sqrt(2)
            inputY *= 0.707;
        }

        // Apply acceleration (underwater-style: slow to reach full speed)
        if (inputX !== 0) {
            this.velocityX += inputX * CONFIG.PLAYER.ACCELERATION;
        }
        if (inputY !== 0) {
            this.velocityY += inputY * CONFIG.PLAYER.ACCELERATION;
        }

        // Apply water friction when not actively moving in a direction
        if (inputX === 0) {
            this.velocityX *= CONFIG.PLAYER.FRICTION;
        }
        if (inputY === 0) {
            this.velocityY *= CONFIG.PLAYER.FRICTION;
        }

        // Apply deceleration (very gradual - maintains momentum)
        this.velocityX *= (1 - CONFIG.PLAYER.DECELERATION);
        this.velocityY *= (1 - CONFIG.PLAYER.DECELERATION);

        // Clamp to max speed
        const speed = Math.sqrt(this.velocityX ** 2 + this.velocityY ** 2);
        if (speed > CONFIG.PLAYER.MAX_SPEED) {
            const scale = CONFIG.PLAYER.MAX_SPEED / speed;
            this.velocityX *= scale;
            this.velocityY *= scale;
        }
    }

    /**
     * Take damage from an attack
     * @param {number} damage - Amount of damage to take
     * @param {ParticleSystem} particles - For damage effects
     * @returns {boolean} - Whether damage was actually taken
     */
    takeDamage(damage, particles) {
        // Check invincibility
        if (Date.now() < this.invincibleUntil) {
            return false;
        }

        this.health -= damage;
        this.health = Math.max(0, this.health);

        // Grant invincibility frames
        this.invincibleUntil = Date.now() + CONFIG.PLAYER.INVINCIBILITY_TIME;

        // Spawn damage particles
        particles.spawn(this.x, this.y, 'damage', 15);

        return true;
    }

    /**
     * Check if player is currently invincible
     */
    isInvincible() {
        return Date.now() < this.invincibleUntil;
    }

    /**
     * Get collision rectangle (for collision detection)
     */
    getCollisionRect() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }

    /**
     * Check if player is dead
     */
    isDead() {
        return this.health <= 0;
    }

    /**
     * Render the player
     * @param {CanvasRenderingContext2D} ctx
     * @param {Camera} camera
     */
    render(ctx, camera) {
        const screenPos = camera.worldToScreen(this.x, this.y);
        const sprite = SpriteLoader.get('player');

        // Flash when invincible
        if (this.isInvincible() && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        ctx.save();
        ctx.translate(screenPos.x, screenPos.y);

        // Flip based on facing direction
        if (!this.facingRight) {
            ctx.scale(-1, 1);
        }

        // Draw sprite if loaded, otherwise draw fallback shape
        if (sprite) {
            // Calculate source rectangle from spritesheet
            const srcX = this.currentFrame * CONFIG.PLAYER.SPRITE_FRAME_WIDTH;
            const srcY = 0;

            // Draw sprite centered on position
            ctx.drawImage(
                sprite,
                srcX, srcY,                                    // Source position
                CONFIG.PLAYER.SPRITE_FRAME_WIDTH,              // Source width
                CONFIG.PLAYER.SPRITE_FRAME_HEIGHT,             // Source height
                -this.width / 2, -this.height / 2,             // Destination position (centered)
                this.width, this.height                        // Destination size
            );
        } else {
            // Fallback: draw placeholder rectangle if sprite not loaded
            ctx.fillStyle = this.isDashing ? CONFIG.COLORS.PARTICLES_DASH :
                           this.isInvincible() ? CONFIG.COLORS.PLAYER_DAMAGED :
                           CONFIG.COLORS.PLAYER;
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        }

        ctx.restore();
        ctx.globalAlpha = 1;
    }
}

// =============================================================================
// ENEMY SYSTEM - PURSUING FISH (Dark Esau inspired)
// =============================================================================

/**
 * Enemy states for the pursuing fish
 */
const EnemyState = {
    PURSUING: 'pursuing',      // Normal slow pursuit
    CHARGING_WINDUP: 'windup', // Telegraphing incoming charge
    CHARGING: 'charging',      // Fast charge attack
    COOLDOWN: 'cooldown'       // Brief pause after charge
};

/**
 * Pursuing Fish enemy - always tracks the player
 * Periodically performs fast charge attacks
 */
class PursuingFish {
    constructor(x, y) {
        // Position
        this.x = x;
        this.y = y;

        // Velocity
        this.velocityX = 0;
        this.velocityY = 0;

        // Dimensions
        this.width = CONFIG.ENEMY.WIDTH;
        this.height = CONFIG.ENEMY.HEIGHT;

        // State
        this.state = EnemyState.PURSUING;
        this.stateEndTime = 0;

        // Charge attack
        this.chargeTargetX = 0;
        this.chargeTargetY = 0;
        this.chargeDirection = { x: 0, y: 0 };

        // Schedule first charge
        this.scheduleNextCharge();

        // Visual
        this.facingRight = false;

        // Animation state
        this.animationFrame = 0;      // Current frame (can be fractional)
        this.currentFrame = 0;        // Actual frame index to display (integer)
    }

    /**
     * Schedule the next charge attack
     */
    scheduleNextCharge() {
        this.nextChargeTime = Date.now() + CONFIG.ENEMY.CHARGE_COOLDOWN + Math.random() * 1000;
    }

    /**
     * Update enemy state and position
     * @param {Player} player - Target to pursue
     * @param {ParticleSystem} particles - For effects
     */
    update(player, particles) {
        const now = Date.now();

        // Update animation
        this.animationFrame += CONFIG.ENEMY.ANIMATION_SPEED;
        this.currentFrame = Math.floor(this.animationFrame) % CONFIG.ENEMY.SPRITE_FRAMES;

        switch (this.state) {
            case EnemyState.PURSUING:
                this.updatePursuit(player);

                // Check if it's time to charge
                if (now >= this.nextChargeTime) {
                    this.startChargeWindup(player);
                }
                break;

            case EnemyState.CHARGING_WINDUP:
                // During windup, slow down and face target
                this.velocityX *= 0.9;
                this.velocityY *= 0.9;

                // Update target tracking during windup
                this.chargeTargetX = player.x;
                this.chargeTargetY = player.y;

                if (now >= this.stateEndTime) {
                    this.startCharge();
                }
                break;

            case EnemyState.CHARGING:
                // Move at charge speed in locked direction
                this.velocityX = this.chargeDirection.x * CONFIG.ENEMY.CHARGE_SPEED;
                this.velocityY = this.chargeDirection.y * CONFIG.ENEMY.CHARGE_SPEED;

                // Spawn trail particles
                if (Math.random() < 0.5) {
                    particles.spawn(this.x, this.y, 'damage', 1);
                }

                if (now >= this.stateEndTime) {
                    this.endCharge();
                }
                break;

            case EnemyState.COOLDOWN:
                // Slow down during cooldown
                this.velocityX *= 0.95;
                this.velocityY *= 0.95;

                if (now >= this.stateEndTime) {
                    this.state = EnemyState.PURSUING;
                    this.scheduleNextCharge();
                }
                break;
        }

        // Apply velocity
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Constrain to world bounds (same as player)
        this.x = Utils.clamp(this.x, this.width / 2, CONFIG.WORLD_WIDTH - this.width / 2);
        this.y = Utils.clamp(this.y, CONFIG.WORLD_TOP_BOUNDARY, CONFIG.WORLD_HEIGHT - this.height / 2);

        // Update facing direction
        if (Math.abs(this.velocityX) > 0.5) {
            this.facingRight = this.velocityX > 0;
        }
    }

    /**
     * Normal pursuit behavior - slowly track player
     */
    updatePursuit(player) {
        // Calculate direction to player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Utils.distance(this.x, this.y, player.x, player.y);

        if (distance > 0) {
            // Smoothly adjust velocity toward player (hunting behavior)
            const targetVelX = (dx / distance) * CONFIG.ENEMY.NORMAL_SPEED;
            const targetVelY = (dy / distance) * CONFIG.ENEMY.NORMAL_SPEED;

            // Smooth tracking - creates more natural movement
            this.velocityX = Utils.lerp(this.velocityX, targetVelX, CONFIG.ENEMY.TRACKING_SMOOTHING);
            this.velocityY = Utils.lerp(this.velocityY, targetVelY, CONFIG.ENEMY.TRACKING_SMOOTHING);
        }
    }

    /**
     * Begin charge windup (telegraph the attack)
     */
    startChargeWindup(player) {
        this.state = EnemyState.CHARGING_WINDUP;
        this.stateEndTime = Date.now() + CONFIG.ENEMY.CHARGE_WINDUP;
        this.chargeTargetX = player.x;
        this.chargeTargetY = player.y;
    }

    /**
     * Begin the actual charge attack
     */
    startCharge() {
        this.state = EnemyState.CHARGING;
        this.stateEndTime = Date.now() + CONFIG.ENEMY.CHARGE_DURATION;

        // Lock in charge direction at moment of charge
        const dx = this.chargeTargetX - this.x;
        const dy = this.chargeTargetY - this.y;
        this.chargeDirection = Utils.normalize(dx, dy);
    }

    /**
     * End charge and enter cooldown
     */
    endCharge() {
        this.state = EnemyState.COOLDOWN;
        this.stateEndTime = Date.now() + 500;  // Brief pause after charge
    }

    /**
     * Check if enemy is currently in a damaging state
     */
    isDangerous() {
        return this.state === EnemyState.CHARGING;
    }

    /**
     * Get collision rectangle
     */
    getCollisionRect() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }

    /**
     * Get the appropriate sprite based on current state
     */
    getCurrentSprite() {
        switch (this.state) {
            case EnemyState.CHARGING_WINDUP:
                return SpriteLoader.get('enemy_windup');
            case EnemyState.CHARGING:
                return SpriteLoader.get('enemy_charging');
            default:
                return SpriteLoader.get('enemy_normal');
        }
    }

    /**
     * Render the enemy
     */
    render(ctx, camera) {
        const screenPos = camera.worldToScreen(this.x, this.y);
        const sprite = this.getCurrentSprite();

        ctx.save();
        ctx.translate(screenPos.x, screenPos.y);

        // Shake during windup
        if (this.state === EnemyState.CHARGING_WINDUP) {
            ctx.translate(Math.random() * 4 - 2, Math.random() * 4 - 2);
        }

        // Flip based on facing
        if (!this.facingRight) {
            ctx.scale(-1, 1);
        }

        // Draw sprite if loaded, otherwise draw fallback shape
        if (sprite) {
            // Calculate source rectangle from spritesheet
            const srcX = this.currentFrame * CONFIG.ENEMY.SPRITE_FRAME_WIDTH;
            const srcY = 0;

            // Draw sprite centered on position
            ctx.drawImage(
                sprite,
                srcX, srcY,                                    // Source position
                CONFIG.ENEMY.SPRITE_FRAME_WIDTH,               // Source width
                CONFIG.ENEMY.SPRITE_FRAME_HEIGHT,              // Source height
                -this.width / 2, -this.height / 2,             // Destination position (centered)
                this.width, this.height                        // Destination size
            );
        } else {
            // Fallback: draw placeholder shape if sprite not loaded
            let bodyColor;
            switch (this.state) {
                case EnemyState.CHARGING_WINDUP:
                    bodyColor = CONFIG.COLORS.ENEMY_WINDUP;
                    break;
                case EnemyState.CHARGING:
                    bodyColor = CONFIG.COLORS.ENEMY_CHARGING;
                    break;
                default:
                    bodyColor = CONFIG.COLORS.ENEMY_NORMAL;
            }
            ctx.fillStyle = bodyColor;
            ctx.beginPath();
            ctx.ellipse(0, 0, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();

        // Draw warning indicator during windup
        if (this.state === EnemyState.CHARGING_WINDUP) {
            const warningProgress = 1 - (this.stateEndTime - Date.now()) / CONFIG.ENEMY.CHARGE_WINDUP;
            ctx.strokeStyle = `rgba(255, ${Math.floor(100 * (1 - warningProgress))}, 0, ${0.5 + warningProgress * 0.5})`;
            ctx.lineWidth = 2 + warningProgress * 2;
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, this.width * (0.8 + warningProgress * 0.4), 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}

// =============================================================================
// PUFFERFISH SYSTEM - Peaceful ambient fish
// =============================================================================

/**
 * PufferFish states
 */
const PufferState = {
    SWIMMING: 'swimming',      // Normal peaceful swimming (frame 0)
    PUFFING: 'puffing',        // Scared, playing puff animation (frames 1-8)
    PUFFED: 'puffed',          // Fully puffed, floating around (frame 8)
};

/**
 * PufferFish - Peaceful fish that puffs up when scared
 * Spawns from offscreen, swims peacefully, puffs when player gets close
 */
class PufferFish {
    constructor(x, y, velocityX, velocityY) {
        // Position
        this.x = x;
        this.y = y;

        // Velocity (set on spawn based on entry direction)
        this.velocityX = velocityX;
        this.velocityY = velocityY;

        // Dimensions
        this.width = CONFIG.PUFFERFISH.WIDTH;
        this.height = CONFIG.PUFFERFISH.HEIGHT;

        // State
        this.state = PufferState.SWIMMING;

        // Animation
        this.currentFrame = 0;      // Frame 0 = swimming, 1-8 = puffing, 8 = puffed
        this.animationFrame = 0;    // Fractional for smooth animation

        // Facing direction (sprite faces left by default)
        this.facingLeft = velocityX < 0;

        // Direction change timer for peaceful wandering
        this.nextDirectionChange = Date.now() + CONFIG.PUFFERFISH.DIRECTION_CHANGE_TIME + Math.random() * 1000;

        // Mark for removal
        this.shouldRemove = false;
    }

    /**
     * Update pufferfish state
     * @param {Player} player - To check distance for scaring
     */
    update(player) {
        const cfg = CONFIG.PUFFERFISH;

        switch (this.state) {
            case PufferState.SWIMMING:
                // Check if player is close enough to scare
                const distToPlayer = Utils.distance(this.x, this.y, player.x, player.y);
                if (distToPlayer < cfg.SCARE_DISTANCE) {
                    this.state = PufferState.PUFFING;
                    this.animationFrame = 1;  // Start puff animation at frame 1
                }

                // Peaceful wandering - occasionally change direction slightly
                if (Date.now() > this.nextDirectionChange) {
                    // Add small random adjustment to velocity
                    this.velocityX += (Math.random() - 0.5) * 0.5;
                    this.velocityY += (Math.random() - 0.5) * 0.5;

                    // Normalize to maintain speed
                    const speed = Math.sqrt(this.velocityX ** 2 + this.velocityY ** 2);
                    if (speed > 0) {
                        this.velocityX = (this.velocityX / speed) * cfg.SWIM_SPEED;
                        this.velocityY = (this.velocityY / speed) * cfg.SWIM_SPEED;
                    }

                    this.nextDirectionChange = Date.now() + cfg.DIRECTION_CHANGE_TIME + Math.random() * 1000;
                }
                break;

            case PufferState.PUFFING:
                // Play puff animation (frames 1-8)
                this.animationFrame += cfg.PUFF_ANIMATION_SPEED;
                this.currentFrame = Math.floor(this.animationFrame);

                // Once we reach frame 8, stay puffed
                if (this.currentFrame >= 8) {
                    this.currentFrame = 8;
                    this.state = PufferState.PUFFED;
                }

                // Slow down while puffing
                this.velocityX *= 0.95;
                this.velocityY *= 0.95;
                break;

            case PufferState.PUFFED:
                // Stay on frame 8
                this.currentFrame = 8;

                // Gentle floating movement
                this.velocityX *= 0.98;
                this.velocityY *= 0.98;

                // Add tiny drift
                this.velocityX += (Math.random() - 0.5) * 0.05;
                this.velocityY += (Math.random() - 0.5) * 0.05;

                // Check for player collision to disappear
                const playerRect = player.getCollisionRect();
                const myRect = this.getCollisionRect();
                if (Utils.rectCollision(playerRect, myRect)) {
                    this.shouldRemove = true;
                }
                break;
        }

        // Apply velocity
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Update facing direction based on velocity (only when swimming)
        if (this.state === PufferState.SWIMMING && Math.abs(this.velocityX) > 0.1) {
            this.facingLeft = this.velocityX < 0;
        }

        // Check if offscreen (for cleanup) - give generous margin
        const margin = cfg.SPAWN_MARGIN * 2;
        if (this.x < -margin || this.x > CONFIG.WORLD_WIDTH + margin ||
            this.y < CONFIG.WORLD_TOP_BOUNDARY - margin || this.y > CONFIG.WORLD_HEIGHT + margin) {
            this.shouldRemove = true;
        }
    }

    /**
     * Get collision rectangle
     */
    getCollisionRect() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }

    /**
     * Render the pufferfish
     */
    render(ctx, camera) {
        const screenPos = camera.worldToScreen(this.x, this.y);
        const sprite = SpriteLoader.get('pufferfish');

        ctx.save();
        ctx.translate(screenPos.x, screenPos.y);

        // Sprite faces left by default, flip if moving right
        if (!this.facingLeft) {
            ctx.scale(-1, 1);
        }

        if (sprite) {
            const cfg = CONFIG.PUFFERFISH;
            const srcX = this.currentFrame * cfg.SPRITE_FRAME_WIDTH;

            ctx.drawImage(
                sprite,
                srcX, 0,
                cfg.SPRITE_FRAME_WIDTH, cfg.SPRITE_FRAME_HEIGHT,
                -this.width / 2, -this.height / 2,
                this.width, this.height
            );
        } else {
            // Fallback circle
            ctx.fillStyle = this.state === PufferState.PUFFED ? '#ffcc00' : '#ffaa44';
            ctx.beginPath();
            ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

/**
 * PufferFish spawning manager
 * Handles spawning pufferfish from offscreen edges
 */
const PufferFishManager = {
    pufferfish: [],
    lastSpawnTime: 0,

    /**
     * Attempt to spawn a new pufferfish
     * @param {Camera} camera - To determine visible area
     */
    trySpawn(camera) {
        const cfg = CONFIG.PUFFERFISH;
        const now = Date.now();

        // Check spawn interval and max count
        if (now - this.lastSpawnTime < cfg.SPAWN_INTERVAL) return;
        if (this.pufferfish.length >= cfg.MAX_COUNT) return;

        // Random chance to spawn
        if (Math.random() > 0.3) return;

        this.lastSpawnTime = now;

        // Choose spawn edge: 0=left, 1=right, 2=top, 3=bottom
        const edge = Math.floor(Math.random() * 4);
        let x, y, velX, velY;

        const visibleTop = camera.y;
        const visibleBottom = camera.y + CONFIG.CANVAS_HEIGHT;
        const margin = cfg.SPAWN_MARGIN;

        switch (edge) {
            case 0: // Left edge
                x = -margin;
                y = visibleTop + Math.random() * CONFIG.CANVAS_HEIGHT;
                velX = cfg.SWIM_SPEED;
                velY = (Math.random() - 0.5) * cfg.SWIM_SPEED * 0.5;
                break;
            case 1: // Right edge
                x = CONFIG.WORLD_WIDTH + margin;
                y = visibleTop + Math.random() * CONFIG.CANVAS_HEIGHT;
                velX = -cfg.SWIM_SPEED;
                velY = (Math.random() - 0.5) * cfg.SWIM_SPEED * 0.5;
                break;
            case 2: // Top edge
                x = Math.random() * CONFIG.WORLD_WIDTH;
                y = visibleTop - margin;
                velX = (Math.random() - 0.5) * cfg.SWIM_SPEED * 0.5;
                velY = cfg.SWIM_SPEED;
                break;
            case 3: // Bottom edge
                x = Math.random() * CONFIG.WORLD_WIDTH;
                y = visibleBottom + margin;
                velX = (Math.random() - 0.5) * cfg.SWIM_SPEED * 0.5;
                velY = -cfg.SWIM_SPEED;
                break;
        }

        this.pufferfish.push(new PufferFish(x, y, velX, velY));
    },

    /**
     * Update all pufferfish
     * @param {Player} player - For scare detection
     * @param {Camera} camera - For spawn positioning
     */
    update(player, camera) {
        // Try to spawn new pufferfish
        this.trySpawn(camera);

        // Update existing pufferfish
        for (let i = this.pufferfish.length - 1; i >= 0; i--) {
            const puffer = this.pufferfish[i];
            puffer.update(player);

            // Remove if flagged
            if (puffer.shouldRemove) {
                this.pufferfish.splice(i, 1);
            }
        }
    },

    /**
     * Render all pufferfish
     */
    render(ctx, camera) {
        for (const puffer of this.pufferfish) {
            puffer.render(ctx, camera);
        }
    },

    /**
     * Reset for game restart
     */
    reset() {
        this.pufferfish = [];
        this.lastSpawnTime = 0;
    }
};

// =============================================================================
// WORLD RENDERER (Nine-Slice Animated Background)
// =============================================================================

/**
 * Renders the underwater world background using nine-slice scaling
 * with animated sprite frames
 */
const WorldRenderer = {
    // Animation state
    animationFrame: 0,
    currentFrame: 0,

    /**
     * Draw the animated nine-slice background
     */
    render(ctx, camera) {
        const sprite = SpriteLoader.get('background');

        // Update animation
        this.animationFrame += CONFIG.BACKGROUND.ANIMATION_SPEED;
        this.currentFrame = Math.floor(this.animationFrame) % CONFIG.BACKGROUND.FRAMES;

        if (sprite) {
            // Draw nine-slice tiled background
            this.drawNineSliceBackground(ctx, sprite, camera);
        } else {
            // Fallback: draw gradient if sprite not loaded
            this.drawFallbackGradient(ctx, camera);
        }

        // Draw depth markers on top
        this.drawDepthMarkers(ctx, camera);
    },

    /**
     * Draw the background using nine-slice scaling and tiling
     * Nine-slice divides the sprite into 9 regions:
     * - 4 corners (don't scale)
     * - 4 edges (scale in one direction)
     * - 1 center (tiles to fill)
     */
    drawNineSliceBackground(ctx, sprite, camera) {
        const cfg = CONFIG.BACKGROUND;
        const frameX = this.currentFrame * cfg.FRAME_WIDTH;
        const border = cfg.BORDER;
        const scale = cfg.TILE_SCALE;
        const scaledBorder = border * scale;

        // Source regions (from sprite)
        const srcW = cfg.FRAME_WIDTH;
        const srcH = cfg.FRAME_HEIGHT;
        const srcCenter = srcW - border * 2;

        // Destination size
        const destW = CONFIG.CANVAS_WIDTH;
        const destH = CONFIG.CANVAS_HEIGHT;
        const destCenterW = destW - scaledBorder * 2;
        const destCenterH = destH - scaledBorder * 2;

        // Calculate parallax offset for tiling (subtle movement as camera moves)
        const tileSize = srcCenter * scale;
        const offsetX = (camera.y * 0.1) % tileSize;
        const offsetY = (camera.y * 0.3) % tileSize;

        // Draw the 9 regions

        // 1. Top-left corner
        ctx.drawImage(sprite,
            frameX, 0, border, border,  // source
            0, 0, scaledBorder, scaledBorder  // dest
        );

        // 2. Top-right corner
        ctx.drawImage(sprite,
            frameX + srcW - border, 0, border, border,
            destW - scaledBorder, 0, scaledBorder, scaledBorder
        );

        // 3. Bottom-left corner
        ctx.drawImage(sprite,
            frameX, srcH - border, border, border,
            0, destH - scaledBorder, scaledBorder, scaledBorder
        );

        // 4. Bottom-right corner
        ctx.drawImage(sprite,
            frameX + srcW - border, srcH - border, border, border,
            destW - scaledBorder, destH - scaledBorder, scaledBorder, scaledBorder
        );

        // 5. Top edge (tile horizontally)
        this.tileHorizontal(ctx, sprite,
            frameX + border, 0, srcCenter, border,  // source
            scaledBorder, 0, destCenterW, scaledBorder,  // dest
            offsetX
        );

        // 6. Bottom edge (tile horizontally)
        this.tileHorizontal(ctx, sprite,
            frameX + border, srcH - border, srcCenter, border,
            scaledBorder, destH - scaledBorder, destCenterW, scaledBorder,
            offsetX
        );

        // 7. Left edge (tile vertically)
        this.tileVertical(ctx, sprite,
            frameX, border, border, srcCenter,
            0, scaledBorder, scaledBorder, destCenterH,
            offsetY
        );

        // 8. Right edge (tile vertically)
        this.tileVertical(ctx, sprite,
            frameX + srcW - border, border, border, srcCenter,
            destW - scaledBorder, scaledBorder, scaledBorder, destCenterH,
            offsetY
        );

        // 9. Center (tile both directions)
        this.tileCenter(ctx, sprite,
            frameX + border, border, srcCenter, srcCenter,
            scaledBorder, scaledBorder, destCenterW, destCenterH,
            offsetX, offsetY
        );
    },

    /**
     * Tile a sprite region horizontally
     */
    tileHorizontal(ctx, sprite, srcX, srcY, srcW, srcH, destX, destY, destW, destH, offset) {
        const scale = CONFIG.BACKGROUND.TILE_SCALE;
        const tileW = srcW * scale;

        ctx.save();
        ctx.beginPath();
        ctx.rect(destX, destY, destW, destH);
        ctx.clip();

        const startX = destX - (offset % tileW);
        for (let x = startX; x < destX + destW; x += tileW) {
            ctx.drawImage(sprite, srcX, srcY, srcW, srcH, x, destY, tileW, destH);
        }

        ctx.restore();
    },

    /**
     * Tile a sprite region vertically
     */
    tileVertical(ctx, sprite, srcX, srcY, srcW, srcH, destX, destY, destW, destH, offset) {
        const scale = CONFIG.BACKGROUND.TILE_SCALE;
        const tileH = srcH * scale;

        ctx.save();
        ctx.beginPath();
        ctx.rect(destX, destY, destW, destH);
        ctx.clip();

        const startY = destY - (offset % tileH);
        for (let y = startY; y < destY + destH; y += tileH) {
            ctx.drawImage(sprite, srcX, srcY, srcW, srcH, destX, y, destW, tileH);
        }

        ctx.restore();
    },

    /**
     * Tile a sprite region in both directions
     */
    tileCenter(ctx, sprite, srcX, srcY, srcW, srcH, destX, destY, destW, destH, offsetX, offsetY) {
        const scale = CONFIG.BACKGROUND.TILE_SCALE;
        const tileW = srcW * scale;
        const tileH = srcH * scale;

        ctx.save();
        ctx.beginPath();
        ctx.rect(destX, destY, destW, destH);
        ctx.clip();

        const startX = destX - (offsetX % tileW);
        const startY = destY - (offsetY % tileH);

        for (let y = startY; y < destY + destH; y += tileH) {
            for (let x = startX; x < destX + destW; x += tileW) {
                ctx.drawImage(sprite, srcX, srcY, srcW, srcH, x, y, tileW, tileH);
            }
        }

        ctx.restore();
    },

    /**
     * Fallback gradient when sprite not loaded
     */
    drawFallbackGradient(ctx, camera) {
        const gradientStart = camera.y / CONFIG.WORLD_HEIGHT;
        const gradientEnd = (camera.y + CONFIG.CANVAS_HEIGHT) / CONFIG.WORLD_HEIGHT;

        const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS_HEIGHT);

        const startColor = this.interpolateColor(
            CONFIG.COLORS.WATER_SURFACE,
            CONFIG.COLORS.WATER_DEEP,
            gradientStart
        );
        const endColor = this.interpolateColor(
            CONFIG.COLORS.WATER_SURFACE,
            CONFIG.COLORS.WATER_DEEP,
            gradientEnd
        );

        gradient.addColorStop(0, startColor);
        gradient.addColorStop(1, endColor);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    },

    interpolateColor(color1, color2, factor) {
        const c1 = this.hexToRgb(color1);
        const c2 = this.hexToRgb(color2);
        const r = Math.floor(c1.r + (c2.r - c1.r) * factor);
        const g = Math.floor(c1.g + (c2.g - c1.g) * factor);
        const b = Math.floor(c1.b + (c2.b - c1.b) * factor);
        return `rgb(${r}, ${g}, ${b})`;
    },

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        };
    },

    /**
     * Draw depth markers on the sides
     */
    drawDepthMarkers(ctx, camera) {
        ctx.fillStyle = 'rgba(100, 150, 200, 0.5)';
        ctx.font = '12px Courier New';

        const markerInterval = 500;
        const startMarker = Math.floor(camera.y / markerInterval) * markerInterval;

        for (let worldY = startMarker; worldY < camera.y + CONFIG.CANVAS_HEIGHT + markerInterval; worldY += markerInterval) {
            const screenY = worldY - camera.y;
            const depth = Math.floor((worldY - CONFIG.WORLD_TOP_BOUNDARY) / 10);

            if (depth >= 0) {
                ctx.fillText(`${depth}m`, 10, screenY);
                ctx.fillRect(0, screenY, 5, 1);
            }
        }
    }
};

// =============================================================================
// UI SYSTEM
// =============================================================================

const UI = {
    healthEl: document.getElementById('health'),
    depthEl: document.getElementById('depth'),
    dashEl: document.getElementById('dashStatus'),

    update(player) {
        // Update health display
        this.healthEl.textContent = `Health: ${player.health}`;
        this.healthEl.style.color = player.health < 30 ? '#ff4444' : '#88ccff';

        // Update depth display
        const depth = Math.floor((player.y - CONFIG.WORLD_TOP_BOUNDARY) / 10);
        this.depthEl.textContent = `Depth: ${depth}m`;

        // Update dash status
        if (player.isDashing) {
            this.dashEl.textContent = 'Dash: Active';
            this.dashEl.style.color = '#66ffff';
        } else if (player.canDash()) {
            this.dashEl.textContent = 'Dash: Ready';
            this.dashEl.style.color = '#44ff44';
        } else {
            const percent = Math.floor(player.getDashCooldownPercent() * 100);
            this.dashEl.textContent = `Dash: ${percent}%`;
            this.dashEl.style.color = '#ffaa44';
        }
    }
};

// =============================================================================
// GAME CLASS
// =============================================================================

/**
 * Main game class - orchestrates all systems
 */
class Game {
    constructor() {
        // Get canvas and context
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Set canvas size
        this.canvas.width = CONFIG.CANVAS_WIDTH;
        this.canvas.height = CONFIG.CANVAS_HEIGHT;

        // Disable image smoothing for crisp pixel art
        // Must be set every time canvas is resized, so we set it here and in render
        this.disableImageSmoothing();

        // Initialize systems
        Input.init();

        // Load sprites
        SpriteLoader.load('player', 'Sprites/Player.png');
        SpriteLoader.load('enemy_normal', 'Sprites/enemy_normal.png');
        SpriteLoader.load('enemy_windup', 'Sprites/enemy_windup.png');
        SpriteLoader.load('enemy_charging', 'Sprites/enemy_charging.png');
        SpriteLoader.load('game_over', 'Sprites/game_over.png');
        SpriteLoader.load('background', 'Sprites/background.png');
        SpriteLoader.load('pufferfish', 'Sprites/PufferFish.png');

        // Game objects
        this.camera = new Camera();
        this.particles = new ParticleSystem();

        // Create player at top of world
        this.player = new Player(
            CONFIG.WORLD_WIDTH / 2,
            CONFIG.WORLD_TOP_BOUNDARY + 100
        );

        // Create enemy fish (starts nearby but offset)
        this.enemy = new PursuingFish(
            CONFIG.WORLD_WIDTH / 2 + 200,
            CONFIG.WORLD_TOP_BOUNDARY + 300
        );

        // Game state
        this.isRunning = true;
        this.isGameOver = false;
        this.lastTime = performance.now();
        this.dashKeyWasPressed = false;  // For edge detection

        // Start game loop
        this.gameLoop = this.gameLoop.bind(this);
        requestAnimationFrame(this.gameLoop);
    }

    /**
     * Disable image smoothing for crisp pixel art rendering
     * This prevents blurry interpolation when scaling sprites
     */
    disableImageSmoothing() {
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.mozImageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        this.ctx.msImageSmoothingEnabled = false;
    }

    /**
     * Main game loop
     */
    gameLoop(currentTime) {
        // Calculate delta time (capped to prevent huge jumps)
        const deltaTime = Math.min(currentTime - this.lastTime, 50);
        this.lastTime = currentTime;

        if (this.isRunning) {
            this.update(deltaTime);
            this.render();
        } else if (this.isGameOver) {
            // Keep rendering game over screen
            this.renderGameOver();
        }

        requestAnimationFrame(this.gameLoop);
    }

    /**
     * Update all game systems
     */
    update(deltaTime) {
        // Handle dash input (edge detection - only trigger on key press, not hold)
        const dashKeyPressed = Input.isDashing();
        if (dashKeyPressed && !this.dashKeyWasPressed) {
            this.player.startDash(this.particles);
        }
        this.dashKeyWasPressed = dashKeyPressed;

        // Update player
        this.player.update(deltaTime, this.particles);

        // Check if player is dead
        if (this.player.isDead()) {
            this.handleGameOver();
            return;
        }

        // Update enemy
        this.enemy.update(this.player, this.particles);

        // Update pufferfish
        PufferFishManager.update(this.player, this.camera);

        // Check collision between enemy and player
        this.checkCollisions();

        // Update particles
        this.particles.update();

        // Update camera to follow player
        this.camera.update(this.player);

        // Update UI
        UI.update(this.player);
    }

    /**
     * Check for collisions between game entities
     */
    checkCollisions() {
        // Only check collision if enemy is in charging state (dangerous)
        if (this.enemy.isDangerous()) {
            const playerRect = this.player.getCollisionRect();
            const enemyRect = this.enemy.getCollisionRect();

            if (Utils.rectCollision(playerRect, enemyRect)) {
                this.player.takeDamage(CONFIG.ENEMY.CHARGE_DAMAGE, this.particles);
            }
        }
    }

    /**
     * Handle game over state
     */
    handleGameOver() {
        this.isRunning = false;
        this.isGameOver = true;

        // Store final depth for display
        this.finalDepth = Math.floor((this.player.y - CONFIG.WORLD_TOP_BOUNDARY) / 10);

        // Listen for restart
        const restartHandler = (e) => {
            if (e.code === 'KeyR') {
                window.removeEventListener('keydown', restartHandler);
                this.restart();
            }
        };
        window.addEventListener('keydown', restartHandler);
    }

    /**
     * Render the game over screen
     */
    renderGameOver() {
        // First render the game state frozen
        this.render();

        // Draw dark overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        // Disable image smoothing for crisp pixel art
        this.disableImageSmoothing();

        // Draw game over sprite scaled to fill screen
        const gameOverSprite = SpriteLoader.get('game_over');
        if (gameOverSprite) {
            // Scale 128x64 sprite to fill the canvas while maintaining aspect ratio
            const spriteWidth = 128;
            const spriteHeight = 64;
            const scale = Math.min(
                CONFIG.CANVAS_WIDTH / spriteWidth,
                CONFIG.CANVAS_HEIGHT / spriteHeight
            ) * 0.8;  // 80% of max size for some padding

            const drawWidth = spriteWidth * scale;
            const drawHeight = spriteHeight * scale;
            const drawX = (CONFIG.CANVAS_WIDTH - drawWidth) / 2;
            const drawY = (CONFIG.CANVAS_HEIGHT - drawHeight) / 2 - 30;  // Offset up for text below

            this.ctx.drawImage(
                gameOverSprite,
                drawX, drawY,
                drawWidth, drawHeight
            );
        }

        // Draw stats below the sprite
        this.ctx.fillStyle = '#88ccff';
        this.ctx.font = '20px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Final Depth: ${this.finalDepth}m`, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 120);
        this.ctx.fillText('Press R to Restart', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 160);
    }

    /**
     * Restart the game
     */
    restart() {
        // Reset player
        this.player = new Player(
            CONFIG.WORLD_WIDTH / 2,
            CONFIG.WORLD_TOP_BOUNDARY + 100
        );

        // Reset enemy
        this.enemy = new PursuingFish(
            CONFIG.WORLD_WIDTH / 2 + 200,
            CONFIG.WORLD_TOP_BOUNDARY + 300
        );

        // Clear particles
        this.particles = new ParticleSystem();

        // Reset pufferfish
        PufferFishManager.reset();

        // Reset camera
        this.camera = new Camera();

        // Resume game
        this.isRunning = true;
        this.isGameOver = false;
    }

    /**
     * Render all game elements
     */
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        // Ensure pixel art stays crisp (some browsers reset this)
        this.disableImageSmoothing();

        // Draw world background
        WorldRenderer.render(this.ctx, this.camera);

        // Draw particles (behind entities)
        this.particles.render(this.ctx, this.camera);

        // Draw player
        this.player.render(this.ctx, this.camera);

        // Draw enemy
        this.enemy.render(this.ctx, this.camera);

        // Draw pufferfish
        PufferFishManager.render(this.ctx, this.camera);
    }
}

// =============================================================================
// INITIALIZE GAME
// =============================================================================

// Start the game when the page loads
window.addEventListener('load', () => {
    new Game();
});
