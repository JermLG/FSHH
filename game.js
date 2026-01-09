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

    // Background settings (tileable with depth zones)
    BACKGROUND: {
        TILE_SIZE: 16,           // Each tile is 16x16 in spritesheet
        TILE_SCALE: 3,           // Scale factor for rendering (16 * 3 = 48px rendered)
        DEPTH_ZONE_HEIGHT: 300,  // Pixels per depth zone (switch tile group every 300m)
        // Frames 0-2: Light (shallow), 3-5: Medium, 6-8: Dark (deep)
        // Frames 9-11: Bubble sprites
    },

    // Bubble decoration settings
    BUBBLE: {
        TILE_SIZE: 16,           // Bubble sprite size in sheet
        SCALE: 2,                // Rendered scale
        MIN_SPEED: 0.5,          // Minimum rise speed
        MAX_SPEED: 1.5,          // Maximum rise speed
        SPAWN_INTERVAL: 500,     // ms between spawn attempts
        MAX_COUNT: 15,           // Maximum bubbles on screen
        WOBBLE_SPEED: 0.03,      // Horizontal wobble frequency
        WOBBLE_AMOUNT: 20,       // Horizontal wobble pixels
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
        SPIKE_LAUNCH_FRAME: 7,   // Frame at which spikes are launched
    },

    // Spike projectile settings
    SPIKE: {
        WIDTH: 16,               // Rendered size
        HEIGHT: 16,
        SPRITE_WIDTH: 8,         // Source sprite size (assuming 8x8)
        SPRITE_HEIGHT: 8,
        SPEED: 4,                // Projectile speed
        DAMAGE: 15,              // Damage dealt to player
        COUNT: 8,                // Number of spikes launched in circle
        LIFETIME: 3000,          // ms before spike disappears
    },

    // SwordFish enemy settings
    SWORDFISH: {
        SPRITE_FRAME_WIDTH: 40,  // Width of each frame in spritesheet
        SPRITE_FRAME_HEIGHT: 32, // Height of each frame
        WIDTH: 60,               // Rendered width (40 * 1.5)
        HEIGHT: 48,              // Rendered height (32 * 1.5)
        TOTAL_FRAMES: 3,         // 3 frames total
        SLIDE_SPEED: 2,          // Horizontal slide speed
        Y_FOLLOW_SPEED: 0.05,    // How fast it follows player Y (lerp factor)
        CONTACT_DAMAGE: 20,      // Damage on body contact
        MIN_DEPTH: 1000,         // Min depth before spawning (100m = 1000 pixels)
        SPAWN_MARGIN: 100,       // Distance offscreen to spawn
        // Timing (in ms)
        SLIDE_IN_MIN: 1000,
        SLIDE_IN_MAX: 3000,
        WAIT_BEFORE_AIM_MIN: 1000,
        WAIT_BEFORE_AIM_MAX: 3000,
        ATTACK_DURATION: 10000,  // Time on frame 3 attacking
        FIRE_INTERVAL_MIN: 2000,
        FIRE_INTERVAL_MAX: 5000,
        WAIT_BEFORE_EXIT_MIN: 2000,
        WAIT_BEFORE_EXIT_MAX: 3000,
        SLIDE_OUT_MIN: 1000,
        SLIDE_OUT_MAX: 3000,
        RESPAWN_DELAY_MIN: 5000,
        RESPAWN_DELAY_MAX: 10000,
    },

    // SwordFish bullet settings
    SWORDFISH_BULLET: {
        WIDTH: 10,               // Rendered size (5 * 2)
        HEIGHT: 10,
        SPRITE_WIDTH: 5,         // Source sprite size
        SPRITE_HEIGHT: 5,
        SPEED: 5,                // Faster than pufferfish spikes
        DAMAGE: 10,              // Damage dealt to player
        LIFETIME: 5000,          // ms before bullet disappears
    },

    // Piranha swarm settings (boids flocking)
    PIRANHA: {
        SPRITE_SIZE: 32,
        WIDTH: 48,                    // Rendered size (32 * 1.5)
        HEIGHT: 48,
        SWARM_SIZE_MIN: 8,
        SWARM_SIZE_MAX: 12,
        // Speeds
        WANDER_SPEED: 2,
        CHASE_SPEED: 5.5,             // Faster than player (5) - must dash to escape!
        // Boids parameters
        SEPARATION_RADIUS: 25,
        ALIGNMENT_RADIUS: 50,
        COHESION_RADIUS: 70,
        SEPARATION_WEIGHT: 1.5,
        ALIGNMENT_WEIGHT: 1.0,
        COHESION_WEIGHT: 1.0,
        PLAYER_WEIGHT: 2.5,           // Strong pull toward player when chasing
        // Behavior timing
        CHASE_TRIGGER_RANGE: 150,     // Distance to trigger chase
        CHASE_DURATION_MIN: 3000,     // Chase for 3-5 seconds
        CHASE_DURATION_MAX: 5000,
        // Damage
        CONTACT_DAMAGE: 5,
        DAMAGE_COOLDOWN: 800,         // Per-piranha cooldown
        // Spawning
        MIN_DEPTH: 500,               // 50m depth
        MAX_SWARMS: 2,
        SPAWN_INTERVAL: 10000,        // 10 seconds between spawns
        SPAWN_MARGIN: 100,            // Distance offscreen to spawn
    },

    // Main menu settings
    MENU: {
        // Title sprite (128x64, render at 3x)
        TITLE_SPRITE_WIDTH: 128,
        TITLE_SPRITE_HEIGHT: 64,
        TITLE_SCALE: 3,
        TITLE_Y: 80,
        // Play button (32x16, render at 3x)
        BUTTON_SPRITE_WIDTH: 32,
        BUTTON_SPRITE_HEIGHT: 16,
        BUTTON_SCALE: 3,
        BUTTON_Y: 320,
        // Menu player patrol behavior
        PLAYER_WALK_SPEED: 1.5,
        PLAYER_PATROL_PAUSE: 1000,
    },

    // Intro cutscene settings
    INTRO: {
        FALL_GRAVITY: 0.3,
        FALL_MAX_SPEED: 8,
        WATER_SURFACE_Y: 50,          // Same as WORLD_TOP_BOUNDARY
        SPLASH_PARTICLES: 20,
        DURATION: 2500,               // ms before gameplay starts
    },

    // Screen shake settings
    SCREEN_SHAKE: {
        DAMAGE_INTENSITY: 8,          // Pixels of shake on damage
        DAMAGE_DURATION: 200,         // ms duration of shake
        DECAY: 0.9,                   // How fast shake decays
    },

    // Audio settings
    AUDIO: {
        BGM_PATH: 'Audio/FSHHH_JLG.wav',
        BGM_VOLUME: 0.5,             // Default volume (0-1)
        SFX_VOLUME: 0.6,             // Default SFX volume (0-1)
        // Sound effect paths
        SFX: {
            DASH: 'Audio/dash.wav',
            HURT: 'Audio/hurt.wav',
            DEATH: 'Audio/death.wav',
            PUFF: 'Audio/puff.wav',
            SPIKE_LAUNCH: 'Audio/spike_launch.wav',
            BULLET_FIRE: 'Audio/bullet_fire.wav',
            SLIDE_IN: 'Audio/slide_in.wav',
            SLIDE_OUT: 'Audio/slide_out.wav',
        },
    },

    // Underwater post-processing effects
    UNDERWATER: {
        // Blue tint overlay
        TINT_COLOR: 'rgba(0, 80, 150, 0.08)',
        TINT_DEEP_COLOR: 'rgba(0, 30, 80, 0.15)',

        // Caustic light rays
        CAUSTIC_COUNT: 5,
        CAUSTIC_SPEED: 0.0008,
        CAUSTIC_OPACITY: 0.06,

        // Vignette (darker edges)
        VIGNETTE_STRENGTH: 0.3,

        // Floating particles (dust/plankton)
        PARTICLE_COUNT: 30,
        PARTICLE_SIZE: 2,
        PARTICLE_OPACITY: 0.3,
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
// GAME STATE ENUM
// =============================================================================

const GameState = {
    MENU: 'menu',           // Main menu with title and play button
    INTRO: 'intro',         // Intro cutscene - player falling into water
    PLAYING: 'playing',     // Normal gameplay
    GAME_OVER: 'game_over', // Game over screen
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
// AUDIO MANAGER
// =============================================================================

/**
 * Handles background music and sound effects
 * Manages browser autoplay restrictions by waiting for user interaction
 */
const AudioManager = {
    bgm: null,
    sfx: {},           // Preloaded sound effect Audio objects
    isMuted: false,
    isInitialized: false,
    hasUserInteracted: false,

    /**
     * Initialize the audio system
     * Sets up the background music and preloads sound effects
     */
    init() {
        this.bgm = new Audio(CONFIG.AUDIO.BGM_PATH);
        this.bgm.loop = true;
        this.bgm.volume = CONFIG.AUDIO.BGM_VOLUME;

        // Handle loading errors gracefully
        this.bgm.onerror = () => {
            console.warn('Failed to load background music');
        };

        this.bgm.oncanplaythrough = () => {
            console.log('Background music loaded');
            this.isInitialized = true;
            // Try to play if user already interacted
            if (this.hasUserInteracted && !this.isMuted) {
                this.play();
            }
        };

        // Preload all sound effects
        this.preloadSFX();

        // Set up user interaction listeners to enable audio
        this.setupUserInteractionListeners();
    },

    /**
     * Preload all sound effects for instant playback
     */
    preloadSFX() {
        const sfxConfig = CONFIG.AUDIO.SFX;
        for (const [name, path] of Object.entries(sfxConfig)) {
            const audio = new Audio(path);
            audio.volume = CONFIG.AUDIO.SFX_VOLUME;
            audio.preload = 'auto';
            this.sfx[name] = audio;
            console.log(`Preloaded SFX: ${name}`);
        }
    },

    /**
     * Set up listeners for first user interaction
     * Browsers require user interaction before playing audio
     */
    setupUserInteractionListeners() {
        const enableAudio = () => {
            if (!this.hasUserInteracted) {
                this.hasUserInteracted = true;
                if (this.isInitialized && !this.isMuted) {
                    this.play();
                }
            }
        };

        // Listen for any user interaction
        window.addEventListener('keydown', enableAudio, { once: false });
        window.addEventListener('click', enableAudio, { once: false });
        window.addEventListener('touchstart', enableAudio, { once: false });
    },

    /**
     * Play the background music
     */
    play() {
        if (this.bgm && this.isInitialized && !this.isMuted) {
            this.bgm.play().catch(err => {
                // Autoplay was prevented, will retry on next interaction
                console.log('Audio autoplay prevented, waiting for interaction');
            });
        }
    },

    /**
     * Pause the background music
     */
    pause() {
        if (this.bgm) {
            this.bgm.pause();
        }
    },

    /**
     * Play a sound effect by name
     * Creates a clone for overlapping sounds
     * @param {string} name - SFX name (e.g., 'DASH', 'HURT')
     * @param {number} volume - Optional volume override (0-1)
     */
    playSFX(name, volume = null) {
        if (this.isMuted || !this.hasUserInteracted) return;

        const sfx = this.sfx[name];
        if (!sfx) {
            console.warn(`SFX not found: ${name}`);
            return;
        }

        // Clone the audio to allow overlapping plays
        const sound = sfx.cloneNode();
        sound.volume = volume !== null ? volume : CONFIG.AUDIO.SFX_VOLUME;
        sound.play().catch(err => {
            // Silently fail if can't play
        });
    },

    /**
     * Toggle mute state
     * @returns {boolean} New mute state
     */
    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.pause();
        } else if (this.hasUserInteracted) {
            this.play();
        }
        return this.isMuted;
    },

    /**
     * Set volume
     * @param {number} volume - Volume level (0-1)
     */
    setVolume(volume) {
        if (this.bgm) {
            this.bgm.volume = Utils.clamp(volume, 0, 1);
        }
    },

    /**
     * Check if audio is currently muted
     */
    getMuteState() {
        return this.isMuted;
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

        // Screen shake
        this.shakeIntensity = 0;
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
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

        // Update screen shake
        this.updateShake();
    }

    /**
     * Start screen shake effect
     * @param {number} intensity - Shake intensity in pixels
     */
    shake(intensity) {
        this.shakeIntensity = intensity;
    }

    /**
     * Update shake effect (decay over time)
     */
    updateShake() {
        if (this.shakeIntensity > 0.5) {
            // Random offset within intensity
            this.shakeOffsetX = (Math.random() - 0.5) * this.shakeIntensity * 2;
            this.shakeOffsetY = (Math.random() - 0.5) * this.shakeIntensity * 2;

            // Decay shake
            this.shakeIntensity *= CONFIG.SCREEN_SHAKE.DECAY;
        } else {
            this.shakeIntensity = 0;
            this.shakeOffsetX = 0;
            this.shakeOffsetY = 0;
        }
    }

    /**
     * Convert world coordinates to screen coordinates (includes shake offset)
     */
    worldToScreen(worldX, worldY) {
        return {
            x: worldX - this.x + this.shakeOffsetX,
            y: worldY - this.y + this.shakeOffsetY
        };
    }

    /**
     * Convert world coordinates to screen coordinates WITHOUT shake
     * Used for enemies so they don't shake with the camera
     */
    worldToScreenStable(worldX, worldY) {
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
        this.facingDown = false;      // For vertical flip when swimming down

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

        // Play dash sound
        AudioManager.playSFX('DASH');

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

        // Update vertical facing based on vertical velocity
        if (Math.abs(this.velocityY) > 0.5) {
            this.facingDown = this.velocityY > 0;
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
    takeDamage(damage, particles, camera = null) {
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

        // Play hurt sound
        AudioManager.playSFX('HURT');

        // Screen shake
        if (camera) {
            camera.shake(CONFIG.SCREEN_SHAKE.DAMAGE_INTENSITY);
        }

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

        // Flip based on facing direction (horizontal and vertical)
        const scaleX = this.facingRight ? 1 : -1;
        const scaleY = this.facingDown ? -1 : 1;
        ctx.scale(scaleX, scaleY);

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

        // Track if spikes have been launched (only once per puff)
        this.hasLaunchedSpikes = false;
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
                    AudioManager.playSFX('PUFF');
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

                // Launch spikes at frame 7 (once only)
                if (this.currentFrame >= cfg.SPIKE_LAUNCH_FRAME && !this.hasLaunchedSpikes) {
                    SpikeManager.launchFromPosition(this.x, this.y);
                    this.hasLaunchedSpikes = true;
                    AudioManager.playSFX('SPIKE_LAUNCH');
                }

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
        const screenPos = camera.worldToScreenStable(this.x, this.y);
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
     * Attempt to spawn pufferfish from screen edges
     * Spawns faster and more frequently at depth, biased toward player movement direction
     * @param {Camera} camera - To determine visible area
     * @param {Player} player - To bias spawn direction
     */
    trySpawn(camera, player) {
        const cfg = CONFIG.PUFFERFISH;
        const now = Date.now();

        // Calculate depth factor (0 at surface, 1 at max depth)
        const depthFactor = Math.min(1, camera.y / (CONFIG.WORLD_HEIGHT * 0.6));

        // Scale spawn rates dramatically at depth
        // Surface: 3000ms interval, 5 max, 30% chance
        // Deep: 200ms interval, 25 max, 95% chance
        const adjustedInterval = cfg.SPAWN_INTERVAL * Math.max(0.07, 1 - depthFactor * 0.93);
        const adjustedMaxCount = Math.floor(cfg.MAX_COUNT + depthFactor * 20);
        const spawnChance = 0.3 + depthFactor * 0.65;

        // Check if we can spawn
        if (now - this.lastSpawnTime < adjustedInterval) return;
        if (this.pufferfish.length >= adjustedMaxCount) return;
        if (Math.random() > spawnChance) return;

        this.lastSpawnTime = now;

        // Spawn from edge, biased toward where player is heading
        this.spawnFromEdge(camera, player, cfg, depthFactor);

        // At extreme depth, spawn multiple at once for "pufferfish hell"
        if (depthFactor > 0.6 && this.pufferfish.length < adjustedMaxCount - 2) {
            // Spawn 1-3 extra pufferfish
            const extraCount = 1 + Math.floor(Math.random() * 3 * depthFactor);
            for (let i = 0; i < extraCount && this.pufferfish.length < adjustedMaxCount; i++) {
                this.spawnFromEdge(camera, player, cfg, depthFactor);
            }
        }
    },

    /**
     * Spawn a pufferfish from screen edge, biased toward player movement
     */
    spawnFromEdge(camera, player, cfg, depthFactor) {
        let x, y, velX, velY;

        const visibleTop = camera.y;
        const visibleBottom = camera.y + CONFIG.CANVAS_HEIGHT;
        const margin = cfg.SPAWN_MARGIN;

        // Bias edge selection based on player velocity
        // If player moving down, spawn more from bottom
        // If player moving right, spawn more from right, etc.
        let edge;
        const playerVelY = player.velocityY;
        const playerVelX = player.velocityX;

        if (Math.abs(playerVelY) > 2 && playerVelY > 0) {
            // Player swimming down - 70% chance from bottom, 30% from sides
            edge = Math.random() < 0.7 ? 3 : (Math.random() < 0.5 ? 0 : 1);
        } else if (Math.abs(playerVelY) > 2 && playerVelY < 0) {
            // Player swimming up - 70% chance from top, 30% from sides
            edge = Math.random() < 0.7 ? 2 : (Math.random() < 0.5 ? 0 : 1);
        } else if (Math.abs(playerVelX) > 2 && playerVelX > 0) {
            // Player swimming right - 60% from right
            edge = Math.random() < 0.6 ? 1 : Math.floor(Math.random() * 4);
        } else if (Math.abs(playerVelX) > 2 && playerVelX < 0) {
            // Player swimming left - 60% from left
            edge = Math.random() < 0.6 ? 0 : Math.floor(Math.random() * 4);
        } else {
            // Random edge
            edge = Math.floor(Math.random() * 4);
        }

        // Faster swim speed at depth
        const swimSpeed = cfg.SWIM_SPEED * (1 + depthFactor * 0.5);

        switch (edge) {
            case 0: // Left edge
                x = -margin;
                y = visibleTop + Math.random() * CONFIG.CANVAS_HEIGHT;
                velX = swimSpeed;
                velY = (Math.random() - 0.5) * swimSpeed * 0.5;
                break;
            case 1: // Right edge
                x = CONFIG.WORLD_WIDTH + margin;
                y = visibleTop + Math.random() * CONFIG.CANVAS_HEIGHT;
                velX = -swimSpeed;
                velY = (Math.random() - 0.5) * swimSpeed * 0.5;
                break;
            case 2: // Top edge
                x = Math.random() * CONFIG.WORLD_WIDTH;
                y = visibleTop - margin;
                velX = (Math.random() - 0.5) * swimSpeed * 0.5;
                velY = swimSpeed;
                break;
            case 3: // Bottom edge
                x = Math.random() * CONFIG.WORLD_WIDTH;
                y = visibleBottom + margin;
                velX = (Math.random() - 0.5) * swimSpeed * 0.5;
                velY = -swimSpeed;
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
        this.trySpawn(camera, player);

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
// SPIKE PROJECTILE SYSTEM
// =============================================================================

/**
 * Spike projectile launched by pufferfish
 */
class Spike {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;

        // Calculate velocity from angle
        this.velocityX = Math.cos(angle) * CONFIG.SPIKE.SPEED;
        this.velocityY = Math.sin(angle) * CONFIG.SPIKE.SPEED;

        // Dimensions
        this.width = CONFIG.SPIKE.WIDTH;
        this.height = CONFIG.SPIKE.HEIGHT;

        // Rotation matches launch angle (+ 90 degrees clockwise)
        this.rotation = angle + Math.PI / 2;

        // Lifetime tracking
        this.spawnTime = Date.now();
        this.shouldRemove = false;
    }

    /**
     * Update spike position
     */
    update() {
        // Move spike
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Check lifetime
        if (Date.now() - this.spawnTime > CONFIG.SPIKE.LIFETIME) {
            this.shouldRemove = true;
        }

        // Remove if way offscreen
        const margin = 200;
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
     * Render the spike
     */
    render(ctx, camera) {
        const screenPos = camera.worldToScreenStable(this.x, this.y);
        const sprite = SpriteLoader.get('spike');

        ctx.save();
        ctx.translate(screenPos.x, screenPos.y);
        ctx.rotate(this.rotation);

        if (sprite) {
            ctx.drawImage(
                sprite,
                0, 0,
                CONFIG.SPIKE.SPRITE_WIDTH, CONFIG.SPIKE.SPRITE_HEIGHT,
                -this.width / 2, -this.height / 2,
                this.width, this.height
            );
        } else {
            // Fallback: draw a triangle
            ctx.fillStyle = '#ff6600';
            ctx.beginPath();
            ctx.moveTo(this.width / 2, 0);
            ctx.lineTo(-this.width / 2, -this.height / 2);
            ctx.lineTo(-this.width / 2, this.height / 2);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }
}

/**
 * Manages all spike projectiles
 */
const SpikeManager = {
    spikes: [],

    /**
     * Launch spikes in a circle from a position
     * @param {number} x - Center X position
     * @param {number} y - Center Y position
     */
    launchFromPosition(x, y) {
        const count = CONFIG.SPIKE.COUNT;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;  // Evenly distributed around circle
            this.spikes.push(new Spike(x, y, angle));
        }
    },

    /**
     * Update all spikes and check player collision
     * @param {Player} player - For collision detection
     * @param {ParticleSystem} particles - For damage effects
     * @param {Camera} camera - For screen shake on damage
     */
    update(player, particles, camera) {
        for (let i = this.spikes.length - 1; i >= 0; i--) {
            const spike = this.spikes[i];
            spike.update();

            // Check collision with player
            if (!spike.shouldRemove) {
                const playerRect = player.getCollisionRect();
                const spikeRect = spike.getCollisionRect();
                if (Utils.rectCollision(playerRect, spikeRect)) {
                    player.takeDamage(CONFIG.SPIKE.DAMAGE, particles, camera);
                    spike.shouldRemove = true;
                }
            }

            // Remove if flagged
            if (spike.shouldRemove) {
                this.spikes.splice(i, 1);
            }
        }
    },

    /**
     * Render all spikes
     */
    render(ctx, camera) {
        for (const spike of this.spikes) {
            spike.render(ctx, camera);
        }
    },

    /**
     * Reset for game restart
     */
    reset() {
        this.spikes = [];
    }
};

// =============================================================================
// SWORDFISH ENEMY SYSTEM
// =============================================================================

/**
 * SwordFish states - complex state machine for side-sliding enemy
 */
const SwordFishState = {
    SLIDING_IN: 'sliding_in',      // Sliding in from side
    WAITING: 'waiting',            // Waiting before aiming
    AIMING: 'aiming',              // Playing frames 1->2->3
    ATTACKING: 'attacking',        // On frame 3, firing bullets
    REVERSING: 'reversing',        // Playing frames 3->2->1
    WAITING_EXIT: 'waiting_exit',  // Waiting before sliding out
    SLIDING_OUT: 'sliding_out',    // Sliding out to side
    COOLDOWN: 'cooldown',          // Waiting before respawn
};

/**
 * SwordFish - Half-fish that slides in from sides, tracks player Y, fires bullets
 */
class SwordFish {
    constructor(side) {
        const cfg = CONFIG.SWORDFISH;

        // Which side this fish spawns from ('left' or 'right')
        this.side = side;

        // Position - starts offscreen
        if (side === 'left') {
            this.x = -cfg.SPAWN_MARGIN;
            this.facingRight = true;
        } else {
            this.x = CONFIG.WORLD_WIDTH + cfg.SPAWN_MARGIN;
            this.facingRight = false;
        }
        this.y = CONFIG.CANVAS_HEIGHT / 2;  // Will be updated to player Y

        // Target X position when slid in (partial entry)
        this.targetX = side === 'left' ? cfg.WIDTH / 2 : CONFIG.WORLD_WIDTH - cfg.WIDTH / 2;

        // Dimensions
        this.width = cfg.WIDTH;
        this.height = cfg.HEIGHT;

        // State machine
        this.state = SwordFishState.SLIDING_IN;
        this.stateEndTime = Date.now() + this.randomRange(cfg.SLIDE_IN_MIN, cfg.SLIDE_IN_MAX);

        // Animation
        this.currentFrame = 0;  // 0, 1, or 2 (frames 1, 2, 3 in spec)
        this.animationTimer = 0;

        // Attack timing
        this.nextFireTime = 0;

        // Mark for cleanup
        this.shouldRemove = false;

        // Play slide in sound
        AudioManager.playSFX('SLIDE_IN');
    }

    /**
     * Get random value in range
     */
    randomRange(min, max) {
        return min + Math.random() * (max - min);
    }

    /**
     * Update swordfish state and position
     */
    update(player, camera) {
        const cfg = CONFIG.SWORDFISH;
        const now = Date.now();

        // Always follow player Y position (smoothly)
        const targetY = player.y - camera.y + CONFIG.CANVAS_HEIGHT / 2;
        this.y = Utils.lerp(this.y, player.y, cfg.Y_FOLLOW_SPEED);

        // Clamp Y to stay on screen (with margin)
        const margin = this.height;
        const visibleTop = camera.y + margin;
        const visibleBottom = camera.y + CONFIG.CANVAS_HEIGHT - margin;
        this.y = Utils.clamp(this.y, visibleTop, visibleBottom);

        switch (this.state) {
            case SwordFishState.SLIDING_IN:
                // Slide toward target X
                if (this.side === 'left') {
                    this.x += cfg.SLIDE_SPEED;
                    if (this.x >= this.targetX || now >= this.stateEndTime) {
                        this.x = this.targetX;
                        this.state = SwordFishState.WAITING;
                        this.stateEndTime = now + this.randomRange(cfg.WAIT_BEFORE_AIM_MIN, cfg.WAIT_BEFORE_AIM_MAX);
                    }
                } else {
                    this.x -= cfg.SLIDE_SPEED;
                    if (this.x <= this.targetX || now >= this.stateEndTime) {
                        this.x = this.targetX;
                        this.state = SwordFishState.WAITING;
                        this.stateEndTime = now + this.randomRange(cfg.WAIT_BEFORE_AIM_MIN, cfg.WAIT_BEFORE_AIM_MAX);
                    }
                }
                this.currentFrame = 0;
                break;

            case SwordFishState.WAITING:
                // Wait on frame 0
                this.currentFrame = 0;
                if (now >= this.stateEndTime) {
                    this.state = SwordFishState.AIMING;
                    this.animationTimer = 0;
                }
                break;

            case SwordFishState.AIMING:
                // Animate frames 0->1->2
                this.animationTimer += 0.1;  // Speed of frame transition
                if (this.animationTimer >= 1 && this.currentFrame < 2) {
                    this.currentFrame++;
                    this.animationTimer = 0;
                }
                if (this.currentFrame >= 2) {
                    this.currentFrame = 2;
                    this.state = SwordFishState.ATTACKING;
                    this.stateEndTime = now + cfg.ATTACK_DURATION;
                    this.nextFireTime = now + this.randomRange(cfg.FIRE_INTERVAL_MIN, cfg.FIRE_INTERVAL_MAX);
                }
                break;

            case SwordFishState.ATTACKING:
                // Stay on frame 2, fire bullets periodically
                this.currentFrame = 2;

                // Fire bullet
                if (now >= this.nextFireTime) {
                    this.fireBullet(player);
                    this.nextFireTime = now + this.randomRange(cfg.FIRE_INTERVAL_MIN, cfg.FIRE_INTERVAL_MAX);
                }

                // End attack phase
                if (now >= this.stateEndTime) {
                    this.state = SwordFishState.REVERSING;
                    this.animationTimer = 0;
                }
                break;

            case SwordFishState.REVERSING:
                // Animate frames 2->1->0
                this.animationTimer += 0.1;
                if (this.animationTimer >= 1 && this.currentFrame > 0) {
                    this.currentFrame--;
                    this.animationTimer = 0;
                }
                if (this.currentFrame <= 0) {
                    this.currentFrame = 0;
                    this.state = SwordFishState.WAITING_EXIT;
                    this.stateEndTime = now + this.randomRange(cfg.WAIT_BEFORE_EXIT_MIN, cfg.WAIT_BEFORE_EXIT_MAX);
                }
                break;

            case SwordFishState.WAITING_EXIT:
                // Wait on frame 0
                this.currentFrame = 0;
                if (now >= this.stateEndTime) {
                    this.state = SwordFishState.SLIDING_OUT;
                    this.stateEndTime = now + this.randomRange(cfg.SLIDE_OUT_MIN, cfg.SLIDE_OUT_MAX);
                    AudioManager.playSFX('SLIDE_OUT');
                }
                break;

            case SwordFishState.SLIDING_OUT:
                // Slide back offscreen
                if (this.side === 'left') {
                    this.x -= cfg.SLIDE_SPEED;
                    if (this.x <= -cfg.SPAWN_MARGIN || now >= this.stateEndTime) {
                        this.state = SwordFishState.COOLDOWN;
                        this.stateEndTime = now + this.randomRange(cfg.RESPAWN_DELAY_MIN, cfg.RESPAWN_DELAY_MAX);
                    }
                } else {
                    this.x += cfg.SLIDE_SPEED;
                    if (this.x >= CONFIG.WORLD_WIDTH + cfg.SPAWN_MARGIN || now >= this.stateEndTime) {
                        this.state = SwordFishState.COOLDOWN;
                        this.stateEndTime = now + this.randomRange(cfg.RESPAWN_DELAY_MIN, cfg.RESPAWN_DELAY_MAX);
                    }
                }
                this.currentFrame = 0;
                break;

            case SwordFishState.COOLDOWN:
                // Wait offscreen, then mark for respawn
                if (now >= this.stateEndTime) {
                    this.shouldRemove = true;  // Manager will create new one
                }
                break;
        }
    }

    /**
     * Fire a bullet toward the player
     */
    fireBullet(player) {
        // Calculate bullet spawn position (at the "nose" of the fish)
        const bulletX = this.side === 'left' ? this.x + this.width / 2 : this.x - this.width / 2;
        const bulletY = this.y;

        // Calculate direction to player
        const dx = player.x - bulletX;
        const dy = player.y - bulletY;
        const angle = Math.atan2(dy, dx);

        SwordFishBulletManager.spawn(bulletX, bulletY, angle);

        // Play bullet fire sound
        AudioManager.playSFX('BULLET_FIRE');
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
     * Check if fish is in a state where it can damage player
     */
    isDangerous() {
        return this.state !== SwordFishState.COOLDOWN &&
               this.state !== SwordFishState.SLIDING_OUT &&
               this.x > 0 && this.x < CONFIG.WORLD_WIDTH;
    }

    /**
     * Render the swordfish
     */
    render(ctx, camera) {
        // Don't render if offscreen in cooldown
        if (this.state === SwordFishState.COOLDOWN) return;

        const screenPos = camera.worldToScreenStable(this.x, this.y);
        const sprite = SpriteLoader.get('swordfish');
        const cfg = CONFIG.SWORDFISH;

        ctx.save();
        ctx.translate(screenPos.x, screenPos.y);

        // Flip horizontally based on which side it's on
        // Sprite faces right by default
        if (!this.facingRight) {
            ctx.scale(-1, 1);
        }

        if (sprite) {
            const srcX = this.currentFrame * cfg.SPRITE_FRAME_WIDTH;

            ctx.drawImage(
                sprite,
                srcX, 0,
                cfg.SPRITE_FRAME_WIDTH, cfg.SPRITE_FRAME_HEIGHT,
                -this.width / 2, -this.height / 2,
                this.width, this.height
            );
        } else {
            // Fallback rectangle
            ctx.fillStyle = '#6688aa';
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        }

        ctx.restore();
    }
}

/**
 * SwordFish bullet projectile
 */
class SwordFishBullet {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;

        const cfg = CONFIG.SWORDFISH_BULLET;
        this.velocityX = Math.cos(angle) * cfg.SPEED;
        this.velocityY = Math.sin(angle) * cfg.SPEED;

        this.width = cfg.WIDTH;
        this.height = cfg.HEIGHT;

        this.spawnTime = Date.now();
        this.shouldRemove = false;
    }

    update() {
        // Move bullet
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Check lifetime
        if (Date.now() - this.spawnTime > CONFIG.SWORDFISH_BULLET.LIFETIME) {
            this.shouldRemove = true;
        }

        // Remove if way offscreen
        const margin = 200;
        if (this.x < -margin || this.x > CONFIG.WORLD_WIDTH + margin ||
            this.y < CONFIG.WORLD_TOP_BOUNDARY - margin || this.y > CONFIG.WORLD_HEIGHT + margin) {
            this.shouldRemove = true;
        }
    }

    getCollisionRect() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }

    render(ctx, camera) {
        const screenPos = camera.worldToScreenStable(this.x, this.y);
        const sprite = SpriteLoader.get('bullet');
        const cfg = CONFIG.SWORDFISH_BULLET;

        ctx.save();
        ctx.translate(screenPos.x, screenPos.y);

        if (sprite) {
            ctx.drawImage(
                sprite,
                0, 0,
                cfg.SPRITE_WIDTH, cfg.SPRITE_HEIGHT,
                -this.width / 2, -this.height / 2,
                this.width, this.height
            );
        } else {
            // Fallback circle
            ctx.fillStyle = '#ffaa00';
            ctx.beginPath();
            ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

/**
 * Manages SwordFish bullets
 */
const SwordFishBulletManager = {
    bullets: [],

    spawn(x, y, angle) {
        this.bullets.push(new SwordFishBullet(x, y, angle));
    },

    update(player, particles, camera) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.update();

            // Check collision with player
            if (!bullet.shouldRemove) {
                const playerRect = player.getCollisionRect();
                const bulletRect = bullet.getCollisionRect();
                if (Utils.rectCollision(playerRect, bulletRect)) {
                    player.takeDamage(CONFIG.SWORDFISH_BULLET.DAMAGE, particles, camera);
                    bullet.shouldRemove = true;
                }
            }

            // Remove if flagged
            if (bullet.shouldRemove) {
                this.bullets.splice(i, 1);
            }
        }
    },

    render(ctx, camera) {
        for (const bullet of this.bullets) {
            bullet.render(ctx, camera);
        }
    },

    reset() {
        this.bullets = [];
    }
};

/**
 * Manages SwordFish spawning and tracking
 * Max 2 swordfish at a time (one per side)
 */
const SwordFishManager = {
    swordfish: [],
    leftSlotActive: false,
    rightSlotActive: false,
    leftRespawnTime: 0,
    rightRespawnTime: 0,

    /**
     * Try to spawn swordfish if slots are available and depth is sufficient
     */
    trySpawn(camera, player) {
        const cfg = CONFIG.SWORDFISH;
        const now = Date.now();

        // Check if player is deep enough
        const playerDepth = player.y - CONFIG.WORLD_TOP_BOUNDARY;
        if (playerDepth < cfg.MIN_DEPTH) return;

        // Try to spawn left swordfish
        if (!this.leftSlotActive && now >= this.leftRespawnTime) {
            this.swordfish.push(new SwordFish('left'));
            this.leftSlotActive = true;
        }

        // Try to spawn right swordfish
        if (!this.rightSlotActive && now >= this.rightRespawnTime) {
            this.swordfish.push(new SwordFish('right'));
            this.rightSlotActive = true;
        }
    },

    update(player, camera, particles) {
        // Try to spawn new swordfish
        this.trySpawn(camera, player);

        // Update existing swordfish
        for (let i = this.swordfish.length - 1; i >= 0; i--) {
            const fish = this.swordfish[i];
            fish.update(player, camera);

            // Check body collision with player
            if (fish.isDangerous()) {
                const playerRect = player.getCollisionRect();
                const fishRect = fish.getCollisionRect();
                if (Utils.rectCollision(playerRect, fishRect)) {
                    player.takeDamage(CONFIG.SWORDFISH.CONTACT_DAMAGE, particles, camera);
                }
            }

            // Remove if flagged
            if (fish.shouldRemove) {
                // Free up the slot and set respawn timer
                if (fish.side === 'left') {
                    this.leftSlotActive = false;
                    this.leftRespawnTime = Date.now();  // Can spawn immediately after cooldown
                } else {
                    this.rightSlotActive = false;
                    this.rightRespawnTime = Date.now();
                }
                this.swordfish.splice(i, 1);
            }
        }

        // Update bullets
        SwordFishBulletManager.update(player, particles, camera);
    },

    render(ctx, camera) {
        for (const fish of this.swordfish) {
            fish.render(ctx, camera);
        }
        SwordFishBulletManager.render(ctx, camera);
    },

    reset() {
        this.swordfish = [];
        this.leftSlotActive = false;
        this.rightSlotActive = false;
        this.leftRespawnTime = 0;
        this.rightRespawnTime = 0;
        SwordFishBulletManager.reset();
    }
};

// =============================================================================
// PIRANHA SWARM SYSTEM (Boids Flocking)
// =============================================================================

/**
 * Piranha swarm states
 */
const PiranhaSwarmState = {
    ENTERING: 'entering',      // Spawning, moving onto screen
    WANDERING: 'wandering',    // Flocking around peacefully
    CHASING: 'chasing',        // Aggressively pursuing player
    LEAVING: 'leaving',        // Swimming off screen (bored)
};

/**
 * Individual Piranha with boids behavior
 */
class Piranha {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.velocityX = 0;
        this.velocityY = 0;

        const cfg = CONFIG.PIRANHA;
        this.width = cfg.WIDTH;
        this.height = cfg.HEIGHT;

        // Individual damage cooldown
        this.lastDamageTime = 0;

        // Facing direction
        this.facingRight = true;
    }

    /**
     * Update piranha using boids algorithm
     * @param {PiranhaSwarm} swarm - The swarm this piranha belongs to
     * @param {Player} player - For chase targeting
     * @param {Object} target - Target position for wandering/leaving {x, y}
     * @param {number} maxSpeed - Current max speed based on swarm state
     */
    update(swarm, player, target, maxSpeed) {
        const cfg = CONFIG.PIRANHA;

        // Calculate boids forces
        const separation = this.calculateSeparation(swarm);
        const alignment = this.calculateAlignment(swarm);
        const cohesion = this.calculateCohesion(swarm);

        // Apply boids forces
        let accelX = separation.x * cfg.SEPARATION_WEIGHT +
                     alignment.x * cfg.ALIGNMENT_WEIGHT +
                     cohesion.x * cfg.COHESION_WEIGHT;
        let accelY = separation.y * cfg.SEPARATION_WEIGHT +
                     alignment.y * cfg.ALIGNMENT_WEIGHT +
                     cohesion.y * cfg.COHESION_WEIGHT;

        // Add target attraction (player when chasing, exit point when leaving)
        if (target) {
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
                const weight = swarm.state === PiranhaSwarmState.CHASING ? cfg.PLAYER_WEIGHT : 1.0;
                accelX += (dx / dist) * weight;
                accelY += (dy / dist) * weight;
            }
        }

        // Apply acceleration to velocity
        this.velocityX += accelX * 0.1;
        this.velocityY += accelY * 0.1;

        // Limit speed
        const speed = Math.sqrt(this.velocityX ** 2 + this.velocityY ** 2);
        if (speed > maxSpeed) {
            this.velocityX = (this.velocityX / speed) * maxSpeed;
            this.velocityY = (this.velocityY / speed) * maxSpeed;
        }

        // Apply velocity
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Update facing direction
        if (Math.abs(this.velocityX) > 0.3) {
            this.facingRight = this.velocityX > 0;
        }
    }

    /**
     * Boids Rule 1: Separation - steer away from nearby flockmates
     */
    calculateSeparation(swarm) {
        const cfg = CONFIG.PIRANHA;
        let steerX = 0, steerY = 0;
        let count = 0;

        for (const other of swarm.piranhas) {
            if (other === this) continue;
            const dist = Utils.distance(this.x, this.y, other.x, other.y);
            if (dist < cfg.SEPARATION_RADIUS && dist > 0) {
                // Steer away, weighted by distance (closer = stronger)
                const dx = this.x - other.x;
                const dy = this.y - other.y;
                steerX += dx / dist;
                steerY += dy / dist;
                count++;
            }
        }

        if (count > 0) {
            steerX /= count;
            steerY /= count;
        }
        return { x: steerX, y: steerY };
    }

    /**
     * Boids Rule 2: Alignment - steer toward average heading of flockmates
     */
    calculateAlignment(swarm) {
        const cfg = CONFIG.PIRANHA;
        let avgVelX = 0, avgVelY = 0;
        let count = 0;

        for (const other of swarm.piranhas) {
            if (other === this) continue;
            const dist = Utils.distance(this.x, this.y, other.x, other.y);
            if (dist < cfg.ALIGNMENT_RADIUS) {
                avgVelX += other.velocityX;
                avgVelY += other.velocityY;
                count++;
            }
        }

        if (count > 0) {
            avgVelX /= count;
            avgVelY /= count;
            // Steer toward average velocity
            return {
                x: avgVelX - this.velocityX,
                y: avgVelY - this.velocityY
            };
        }
        return { x: 0, y: 0 };
    }

    /**
     * Boids Rule 3: Cohesion - steer toward average position of flockmates
     */
    calculateCohesion(swarm) {
        const cfg = CONFIG.PIRANHA;
        let avgX = 0, avgY = 0;
        let count = 0;

        for (const other of swarm.piranhas) {
            if (other === this) continue;
            const dist = Utils.distance(this.x, this.y, other.x, other.y);
            if (dist < cfg.COHESION_RADIUS) {
                avgX += other.x;
                avgY += other.y;
                count++;
            }
        }

        if (count > 0) {
            avgX /= count;
            avgY /= count;
            // Steer toward center of mass
            return {
                x: (avgX - this.x) * 0.01,
                y: (avgY - this.y) * 0.01
            };
        }
        return { x: 0, y: 0 };
    }

    /**
     * Check collision with player and deal damage
     */
    checkPlayerCollision(player, particles, camera) {
        const cfg = CONFIG.PIRANHA;
        const now = Date.now();

        // Check individual cooldown
        if (now - this.lastDamageTime < cfg.DAMAGE_COOLDOWN) return;

        const playerRect = player.getCollisionRect();
        const myRect = this.getCollisionRect();

        if (Utils.rectCollision(playerRect, myRect)) {
            if (player.takeDamage(cfg.CONTACT_DAMAGE, particles, camera)) {
                this.lastDamageTime = now;
            }
        }
    }

    getCollisionRect() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }

    render(ctx, camera) {
        const screenPos = camera.worldToScreenStable(this.x, this.y);
        const sprite = SpriteLoader.get('piranha');
        const cfg = CONFIG.PIRANHA;

        ctx.save();
        ctx.translate(screenPos.x, screenPos.y);

        // Flip based on facing direction (sprite faces right by default)
        if (!this.facingRight) {
            ctx.scale(-1, 1);
        }

        if (sprite) {
            ctx.drawImage(
                sprite,
                0, 0, cfg.SPRITE_SIZE, cfg.SPRITE_SIZE,
                -this.width / 2, -this.height / 2,
                this.width, this.height
            );
        } else {
            // Fallback: small red circle
            ctx.fillStyle = '#cc3333';
            ctx.beginPath();
            ctx.arc(0, 0, this.width / 3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

/**
 * A swarm of piranhas with shared state
 */
class PiranhaSwarm {
    constructor(spawnX, spawnY, targetX, targetY) {
        const cfg = CONFIG.PIRANHA;

        // Swarm state
        this.state = PiranhaSwarmState.ENTERING;
        this.stateEndTime = Date.now() + 2000;  // 2 seconds to enter

        // Entry/exit targets
        this.entryTarget = { x: targetX, y: targetY };
        this.exitTarget = null;

        // Create piranhas in cluster around spawn point
        const count = cfg.SWARM_SIZE_MIN + Math.floor(Math.random() * (cfg.SWARM_SIZE_MAX - cfg.SWARM_SIZE_MIN + 1));
        this.piranhas = [];
        for (let i = 0; i < count; i++) {
            const offsetX = (Math.random() - 0.5) * 50;
            const offsetY = (Math.random() - 0.5) * 50;
            const piranha = new Piranha(spawnX + offsetX, spawnY + offsetY);
            // Give initial velocity toward entry target
            const dx = targetX - spawnX;
            const dy = targetY - spawnY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
                piranha.velocityX = (dx / dist) * cfg.WANDER_SPEED;
                piranha.velocityY = (dy / dist) * cfg.WANDER_SPEED;
            }
            this.piranhas.push(piranha);
        }

        // Mark for removal
        this.shouldRemove = false;

        // Chase timing
        this.chaseEndTime = 0;
    }

    /**
     * Get the center of the swarm (average position)
     */
    getCenter() {
        let avgX = 0, avgY = 0;
        for (const p of this.piranhas) {
            avgX += p.x;
            avgY += p.y;
        }
        return {
            x: avgX / this.piranhas.length,
            y: avgY / this.piranhas.length
        };
    }

    /**
     * Update swarm state and all piranhas
     */
    update(player, camera, particles) {
        const cfg = CONFIG.PIRANHA;
        const now = Date.now();
        const center = this.getCenter();

        // State machine
        switch (this.state) {
            case PiranhaSwarmState.ENTERING:
                // Move toward entry target
                if (now >= this.stateEndTime) {
                    this.state = PiranhaSwarmState.WANDERING;
                    // Set a wander target (random point on screen)
                    this.wanderTarget = {
                        x: 100 + Math.random() * (CONFIG.WORLD_WIDTH - 200),
                        y: camera.y + 100 + Math.random() * (CONFIG.CANVAS_HEIGHT - 200)
                    };
                }
                break;

            case PiranhaSwarmState.WANDERING:
                // Check if player is close enough to trigger chase
                const distToPlayer = Utils.distance(center.x, center.y, player.x, player.y);
                if (distToPlayer < cfg.CHASE_TRIGGER_RANGE) {
                    this.state = PiranhaSwarmState.CHASING;
                    this.chaseEndTime = now + cfg.CHASE_DURATION_MIN +
                        Math.random() * (cfg.CHASE_DURATION_MAX - cfg.CHASE_DURATION_MIN);
                }

                // Occasionally update wander target
                if (Math.random() < 0.01) {
                    this.wanderTarget = {
                        x: 100 + Math.random() * (CONFIG.WORLD_WIDTH - 200),
                        y: camera.y + 100 + Math.random() * (CONFIG.CANVAS_HEIGHT - 200)
                    };
                }
                break;

            case PiranhaSwarmState.CHASING:
                // Check if chase time is up
                if (now >= this.chaseEndTime) {
                    this.state = PiranhaSwarmState.LEAVING;
                    // Set exit target (nearest edge)
                    this.setExitTarget(center, camera);
                }
                break;

            case PiranhaSwarmState.LEAVING:
                // Check if swarm has left the screen
                const margin = cfg.SPAWN_MARGIN;
                if (center.x < -margin || center.x > CONFIG.WORLD_WIDTH + margin ||
                    center.y < camera.y - margin || center.y > camera.y + CONFIG.CANVAS_HEIGHT + margin) {
                    this.shouldRemove = true;
                }
                break;
        }

        // Determine target and speed based on state
        let target = null;
        let maxSpeed = cfg.WANDER_SPEED;

        switch (this.state) {
            case PiranhaSwarmState.ENTERING:
                target = this.entryTarget;
                maxSpeed = cfg.WANDER_SPEED;
                break;
            case PiranhaSwarmState.WANDERING:
                target = this.wanderTarget;
                maxSpeed = cfg.WANDER_SPEED;
                break;
            case PiranhaSwarmState.CHASING:
                target = { x: player.x, y: player.y };
                maxSpeed = cfg.CHASE_SPEED;
                break;
            case PiranhaSwarmState.LEAVING:
                target = this.exitTarget;
                maxSpeed = cfg.WANDER_SPEED * 1.5;
                break;
        }

        // Update all piranhas
        for (const piranha of this.piranhas) {
            piranha.update(this, player, target, maxSpeed);

            // Check player collision (only when chasing or entering/wandering near player)
            if (this.state !== PiranhaSwarmState.LEAVING) {
                piranha.checkPlayerCollision(player, particles, camera);
            }
        }
    }

    /**
     * Set exit target to nearest screen edge
     */
    setExitTarget(center, camera) {
        const margin = CONFIG.PIRANHA.SPAWN_MARGIN * 2;

        // Find distances to each edge
        const distLeft = center.x;
        const distRight = CONFIG.WORLD_WIDTH - center.x;
        const distTop = center.y - camera.y;
        const distBottom = (camera.y + CONFIG.CANVAS_HEIGHT) - center.y;

        const minDist = Math.min(distLeft, distRight, distTop, distBottom);

        if (minDist === distLeft) {
            this.exitTarget = { x: -margin, y: center.y };
        } else if (minDist === distRight) {
            this.exitTarget = { x: CONFIG.WORLD_WIDTH + margin, y: center.y };
        } else if (minDist === distTop) {
            this.exitTarget = { x: center.x, y: camera.y - margin };
        } else {
            this.exitTarget = { x: center.x, y: camera.y + CONFIG.CANVAS_HEIGHT + margin };
        }
    }

    render(ctx, camera) {
        for (const piranha of this.piranhas) {
            piranha.render(ctx, camera);
        }
    }
}

/**
 * Manages piranha swarm spawning
 */
const PiranhaSwarmManager = {
    swarms: [],
    lastSpawnTime: 0,

    /**
     * Try to spawn a new swarm
     */
    trySpawn(camera, player) {
        const cfg = CONFIG.PIRANHA;
        const now = Date.now();

        // Check spawn conditions
        if (now - this.lastSpawnTime < cfg.SPAWN_INTERVAL) return;
        if (this.swarms.length >= cfg.MAX_SWARMS) return;

        // Check depth requirement
        const playerDepth = player.y - CONFIG.WORLD_TOP_BOUNDARY;
        if (playerDepth < cfg.MIN_DEPTH) return;

        // Random chance
        if (Math.random() > 0.5) return;

        this.lastSpawnTime = now;

        // Choose spawn edge (not from where player is heading)
        const edges = ['left', 'right', 'top', 'bottom'];
        const edge = edges[Math.floor(Math.random() * edges.length)];

        let spawnX, spawnY, targetX, targetY;
        const margin = cfg.SPAWN_MARGIN;
        const visibleTop = camera.y;
        const visibleBottom = camera.y + CONFIG.CANVAS_HEIGHT;

        switch (edge) {
            case 'left':
                spawnX = -margin;
                spawnY = visibleTop + Math.random() * CONFIG.CANVAS_HEIGHT;
                targetX = 150;
                targetY = spawnY;
                break;
            case 'right':
                spawnX = CONFIG.WORLD_WIDTH + margin;
                spawnY = visibleTop + Math.random() * CONFIG.CANVAS_HEIGHT;
                targetX = CONFIG.WORLD_WIDTH - 150;
                targetY = spawnY;
                break;
            case 'top':
                spawnX = Math.random() * CONFIG.WORLD_WIDTH;
                spawnY = visibleTop - margin;
                targetX = spawnX;
                targetY = visibleTop + 150;
                break;
            case 'bottom':
                spawnX = Math.random() * CONFIG.WORLD_WIDTH;
                spawnY = visibleBottom + margin;
                targetX = spawnX;
                targetY = visibleBottom - 150;
                break;
        }

        this.swarms.push(new PiranhaSwarm(spawnX, spawnY, targetX, targetY));
    },

    update(player, camera, particles) {
        // Try to spawn new swarm
        this.trySpawn(camera, player);

        // Update existing swarms
        for (let i = this.swarms.length - 1; i >= 0; i--) {
            const swarm = this.swarms[i];
            swarm.update(player, camera, particles);

            if (swarm.shouldRemove) {
                this.swarms.splice(i, 1);
            }
        }
    },

    render(ctx, camera) {
        for (const swarm of this.swarms) {
            swarm.render(ctx, camera);
        }
    },

    reset() {
        this.swarms = [];
        this.lastSpawnTime = 0;
    }
};

// =============================================================================
// WORLD RENDERER (Tileable Background with Depth Zones)
// =============================================================================

/**
 * Renders the underwater world background using tileable sprites
 * with depth-based darkness zones
 */
const WorldRenderer = {
    // Cache for randomized tile patterns per row
    rowTileCache: {},

    /**
     * Get the tile group (0, 1, or 2) based on depth
     * Group 0: Frames 0-2 (light/shallow)
     * Group 1: Frames 3-5 (medium)
     * Group 2: Frames 6-8 (dark/deep)
     */
    getDepthGroup(worldY) {
        const depth = worldY - CONFIG.WORLD_TOP_BOUNDARY;
        const zoneHeight = CONFIG.BACKGROUND.DEPTH_ZONE_HEIGHT * 10; // 300m = 3000 pixels
        const group = Math.floor(depth / zoneHeight);
        return Utils.clamp(group, 0, 2);
    },

    /**
     * Get a random tile index (0, 1, or 2) for a specific row
     * Caches the pattern so it stays consistent
     */
    getTileForRow(rowIndex, colIndex) {
        const cacheKey = `${rowIndex}_${colIndex}`;
        if (this.rowTileCache[cacheKey] === undefined) {
            // Use a seeded random based on position for consistency
            const seed = rowIndex * 1000 + colIndex;
            this.rowTileCache[cacheKey] = Math.floor(this.seededRandom(seed) * 3);
        }
        return this.rowTileCache[cacheKey];
    },

    /**
     * Simple seeded random number generator
     */
    seededRandom(seed) {
        const x = Math.sin(seed * 12.9898) * 43758.5453;
        return x - Math.floor(x);
    },

    /**
     * Draw the tiled background with depth zones
     */
    render(ctx, camera) {
        const sprite = SpriteLoader.get('background');

        if (sprite) {
            this.drawTiledBackground(ctx, sprite, camera);
        } else {
            this.drawFallbackGradient(ctx, camera);
        }

        // Draw depth markers on top
        this.drawDepthMarkers(ctx, camera);
    },

    /**
     * Draw the tileable background
     */
    drawTiledBackground(ctx, sprite, camera) {
        const cfg = CONFIG.BACKGROUND;
        const tileSize = cfg.TILE_SIZE;
        const scale = cfg.TILE_SCALE;
        const renderedSize = tileSize * scale;  // 16 * 3 = 48px

        // Calculate visible tile range
        const startRow = Math.floor(camera.y / renderedSize);
        const endRow = Math.ceil((camera.y + CONFIG.CANVAS_HEIGHT) / renderedSize);
        const startCol = 0;
        const endCol = Math.ceil(CONFIG.CANVAS_WIDTH / renderedSize);

        // Draw each visible tile
        for (let row = startRow; row <= endRow; row++) {
            const worldY = row * renderedSize;
            // Round to integers and add 1px overlap to prevent subpixel gaps
            const screenY = Math.floor(worldY - camera.y);
            const depthGroup = this.getDepthGroup(worldY);

            for (let col = startCol; col <= endCol; col++) {
                const screenX = Math.floor(col * renderedSize);

                // Get random tile variant (0, 1, or 2) for this position
                const tileVariant = this.getTileForRow(row, col);

                // Calculate frame index: group * 3 + variant
                const frameIndex = depthGroup * 3 + tileVariant;
                const srcX = frameIndex * tileSize;

                // Draw with 1px overlap to eliminate subpixel gaps
                ctx.drawImage(
                    sprite,
                    srcX, 0, tileSize, tileSize,  // source
                    screenX, screenY, renderedSize + 1, renderedSize + 1  // dest with overlap
                );
            }
        }
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
        ctx.font = '12px BoldPixels, Courier New';

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
    },

    /**
     * Reset tile cache (for new game)
     */
    reset() {
        this.rowTileCache = {};
    }
};

// =============================================================================
// BUBBLE DECORATION SYSTEM
// =============================================================================

/**
 * Decorative bubble that floats upward
 */
class Bubble {
    constructor(x, y, frameIndex) {
        this.x = x;
        this.startX = x;  // For wobble calculation
        this.y = y;
        this.frameIndex = frameIndex;  // 9, 10, or 11

        const cfg = CONFIG.BUBBLE;
        this.speed = cfg.MIN_SPEED + Math.random() * (cfg.MAX_SPEED - cfg.MIN_SPEED);
        this.wobbleOffset = Math.random() * Math.PI * 2;  // Random phase
        this.time = 0;
        this.shouldRemove = false;

        // Size with slight variation
        this.scale = cfg.SCALE * (0.8 + Math.random() * 0.4);
    }

    update() {
        const cfg = CONFIG.BUBBLE;

        // Move upward
        this.y -= this.speed;

        // Wobble horizontally
        this.time += cfg.WOBBLE_SPEED;
        this.x = this.startX + Math.sin(this.time + this.wobbleOffset) * cfg.WOBBLE_AMOUNT;

        // Remove when off screen (above camera)
        // Will be checked in BubbleManager based on camera position
    }

    render(ctx, camera) {
        const screenY = this.y - camera.y;

        // Only render if on screen
        if (screenY < -50 || screenY > CONFIG.CANVAS_HEIGHT + 50) {
            return;
        }

        const sprite = SpriteLoader.get('background');
        if (!sprite) return;

        const cfg = CONFIG.BUBBLE;
        const tileSize = CONFIG.BACKGROUND.TILE_SIZE;
        const srcX = this.frameIndex * tileSize;
        const size = tileSize * this.scale;

        ctx.save();
        ctx.globalAlpha = 0.7;  // Slightly transparent

        ctx.drawImage(
            sprite,
            srcX, 0, tileSize, tileSize,
            this.x - size / 2, screenY - size / 2, size, size
        );

        ctx.restore();
    }
}

/**
 * Manages decorative bubbles
 */
const BubbleManager = {
    bubbles: [],
    lastSpawnTime: 0,

    /**
     * Try to spawn a new bubble from bottom of visible area
     */
    trySpawn(camera) {
        const cfg = CONFIG.BUBBLE;
        const now = Date.now();

        if (now - this.lastSpawnTime < cfg.SPAWN_INTERVAL) return;
        if (this.bubbles.length >= cfg.MAX_COUNT) return;

        // Random chance to spawn
        if (Math.random() > 0.4) return;

        this.lastSpawnTime = now;

        // Spawn at bottom of visible area
        const x = Math.random() * CONFIG.CANVAS_WIDTH;
        const y = camera.y + CONFIG.CANVAS_HEIGHT + 20;

        // Random bubble frame (9, 10, or 11)
        const frameIndex = 9 + Math.floor(Math.random() * 3);

        this.bubbles.push(new Bubble(x, y, frameIndex));
    },

    /**
     * Update all bubbles
     */
    update(camera) {
        this.trySpawn(camera);

        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            const bubble = this.bubbles[i];
            bubble.update();

            // Remove if above visible area
            if (bubble.y < camera.y - 100) {
                this.bubbles.splice(i, 1);
            }
        }
    },

    /**
     * Render all bubbles
     */
    render(ctx, camera) {
        for (const bubble of this.bubbles) {
            bubble.render(ctx, camera);
        }
    },

    /**
     * Reset for new game
     */
    reset() {
        this.bubbles = [];
        this.lastSpawnTime = 0;
    }
};

// =============================================================================
// UNDERWATER POST-PROCESSING EFFECTS
// =============================================================================

const UnderwaterEffects = {
    time: 0,
    floatingParticles: [],
    initialized: false,

    init() {
        if (this.initialized) return;

        // Initialize floating particles (plankton/dust)
        const cfg = CONFIG.UNDERWATER;
        for (let i = 0; i < cfg.PARTICLE_COUNT; i++) {
            this.floatingParticles.push({
                x: Math.random() * CONFIG.CANVAS_WIDTH,
                y: Math.random() * CONFIG.CANVAS_HEIGHT,
                size: cfg.PARTICLE_SIZE * (0.5 + Math.random()),
                speedX: (Math.random() - 0.5) * 0.3,
                speedY: (Math.random() - 0.5) * 0.2,
                opacity: cfg.PARTICLE_OPACITY * (0.3 + Math.random() * 0.7),
                wobbleOffset: Math.random() * Math.PI * 2,
            });
        }
        this.initialized = true;
    },

    update(deltaTime) {
        this.time += deltaTime;

        // Update floating particles
        for (const p of this.floatingParticles) {
            // Gentle drifting motion
            p.x += p.speedX + Math.sin(this.time * 0.001 + p.wobbleOffset) * 0.1;
            p.y += p.speedY + Math.cos(this.time * 0.0008 + p.wobbleOffset) * 0.08;

            // Wrap around screen
            if (p.x < 0) p.x = CONFIG.CANVAS_WIDTH;
            if (p.x > CONFIG.CANVAS_WIDTH) p.x = 0;
            if (p.y < 0) p.y = CONFIG.CANVAS_HEIGHT;
            if (p.y > CONFIG.CANVAS_HEIGHT) p.y = 0;
        }
    },

    render(ctx, camera) {
        const cfg = CONFIG.UNDERWATER;
        const depthFactor = Math.min(1, camera.y / (CONFIG.WORLD_HEIGHT * 0.5));

        // Draw caustic light rays from above
        this.drawCaustics(ctx, depthFactor);

        // Draw floating particles
        this.drawFloatingParticles(ctx);

        // Draw blue tint overlay (stronger at depth)
        this.drawTintOverlay(ctx, depthFactor);

        // Draw vignette
        this.drawVignette(ctx, depthFactor);
    },

    drawCaustics(ctx, depthFactor) {
        const cfg = CONFIG.UNDERWATER;
        // Caustics are stronger near surface, fade with depth
        const causticStrength = cfg.CAUSTIC_OPACITY * (1 - depthFactor * 0.7);

        if (causticStrength < 0.01) return;

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = causticStrength;

        // Draw several animated light rays
        for (let i = 0; i < cfg.CAUSTIC_COUNT; i++) {
            const baseX = (i / cfg.CAUSTIC_COUNT) * CONFIG.CANVAS_WIDTH;
            const wobble = Math.sin(this.time * cfg.CAUSTIC_SPEED + i * 1.5) * 100;
            const x = baseX + wobble;

            // Create gradient for light ray
            const gradient = ctx.createLinearGradient(x, 0, x + 80, CONFIG.CANVAS_HEIGHT);
            gradient.addColorStop(0, 'rgba(150, 220, 255, 0.8)');
            gradient.addColorStop(0.3, 'rgba(100, 180, 220, 0.4)');
            gradient.addColorStop(1, 'rgba(50, 100, 150, 0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x + 60 + Math.sin(this.time * 0.001 + i) * 20, 0);
            ctx.lineTo(x + 150 + wobble * 0.5, CONFIG.CANVAS_HEIGHT);
            ctx.lineTo(x + 50 + wobble * 0.5, CONFIG.CANVAS_HEIGHT);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    },

    drawFloatingParticles(ctx) {
        ctx.save();
        ctx.fillStyle = '#aaddff';

        for (const p of this.floatingParticles) {
            ctx.globalAlpha = p.opacity;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    },

    drawTintOverlay(ctx, depthFactor) {
        const cfg = CONFIG.UNDERWATER;

        // Blend between surface and deep tint based on depth
        ctx.save();

        // Surface tint
        ctx.fillStyle = cfg.TINT_COLOR;
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        // Additional deep tint
        if (depthFactor > 0.1) {
            ctx.globalAlpha = depthFactor;
            ctx.fillStyle = cfg.TINT_DEEP_COLOR;
            ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        }

        ctx.restore();
    },

    drawVignette(ctx, depthFactor) {
        const cfg = CONFIG.UNDERWATER;
        const strength = cfg.VIGNETTE_STRENGTH + depthFactor * 0.2;

        const centerX = CONFIG.CANVAS_WIDTH / 2;
        const centerY = CONFIG.CANVAS_HEIGHT / 2;
        const radius = Math.max(centerX, centerY) * 1.2;

        const gradient = ctx.createRadialGradient(
            centerX, centerY, radius * 0.3,
            centerX, centerY, radius
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(0.5, 'rgba(0, 10, 30, 0)');
        gradient.addColorStop(1, `rgba(0, 10, 30, ${strength})`);

        ctx.save();
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        ctx.restore();
    },

    reset() {
        this.time = 0;
        this.floatingParticles = [];
        this.initialized = false;
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
        AudioManager.init();
        UnderwaterEffects.init();

        // Load sprites
        SpriteLoader.load('player', 'Sprites/Player.png');
        SpriteLoader.load('enemy_normal', 'Sprites/enemy_normal.png');
        SpriteLoader.load('enemy_windup', 'Sprites/enemy_windup.png');
        SpriteLoader.load('enemy_charging', 'Sprites/enemy_charging.png');
        SpriteLoader.load('game_over', 'Sprites/game_over.png');
        SpriteLoader.load('background', 'Sprites/Background.png');
        SpriteLoader.load('pufferfish', 'Sprites/PufferFish.png');
        SpriteLoader.load('spike', 'Sprites/spike.png');
        SpriteLoader.load('swordfish', 'Sprites/SwordFish.png');
        SpriteLoader.load('bullet', 'Sprites/Bullet.png');
        SpriteLoader.load('piranha', 'Sprites/Piranha.png');
        SpriteLoader.load('title', 'Sprites/Title.png');
        SpriteLoader.load('playButton', 'Sprites/PlayButton.png');

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

        // Game state machine
        this.gameState = GameState.MENU;
        this.lastTime = performance.now();
        this.dashKeyWasPressed = false;  // For edge detection
        this.muteKeyWasPressed = false;  // For mute toggle edge detection

        // Menu state
        this.menuPlayerX = 0;           // Player X position on title
        this.menuPlayerVelX = CONFIG.MENU.PLAYER_WALK_SPEED;
        this.menuPlayerPauseUntil = 0;  // Time when patrol pause ends
        this.menuPlayerAnimFrame = 0;

        // Intro cutscene state
        this.introPlayerY = 0;          // Y position during fall
        this.introPlayerVelY = 0;       // Fall velocity
        this.introStartTime = 0;        // When intro started

        // Setup mouse click handler for menu
        this.setupClickHandler();

        // Start game loop
        this.gameLoop = this.gameLoop.bind(this);
        requestAnimationFrame(this.gameLoop);
    }

    /**
     * Setup click handler for play button
     */
    setupClickHandler() {
        this.canvas.addEventListener('click', (e) => {
            if (this.gameState !== GameState.MENU) return;

            // Get click position relative to canvas
            const rect = this.canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;

            // Calculate play button bounds
            const cfg = CONFIG.MENU;
            const buttonWidth = cfg.BUTTON_SPRITE_WIDTH * cfg.BUTTON_SCALE;
            const buttonHeight = cfg.BUTTON_SPRITE_HEIGHT * cfg.BUTTON_SCALE;
            const buttonX = (CONFIG.CANVAS_WIDTH - buttonWidth) / 2;
            const buttonY = cfg.BUTTON_Y;

            // Check if click is within button bounds
            if (clickX >= buttonX && clickX <= buttonX + buttonWidth &&
                clickY >= buttonY && clickY <= buttonY + buttonHeight) {
                this.startIntro();
            }
        });
    }

    /**
     * Start the intro cutscene
     */
    startIntro() {
        this.gameState = GameState.INTRO;
        this.introStartTime = Date.now();

        // Calculate title position for player start
        const cfg = CONFIG.MENU;
        const titleWidth = cfg.TITLE_SPRITE_WIDTH * cfg.TITLE_SCALE;
        const titleX = (CONFIG.CANVAS_WIDTH - titleWidth) / 2;
        const titleHeight = cfg.TITLE_SPRITE_HEIGHT * cfg.TITLE_SCALE;

        // Player starts at their menu position on the title, then falls
        this.introPlayerX = titleX + this.menuPlayerX;
        this.introPlayerY = cfg.TITLE_Y + titleHeight - CONFIG.PLAYER.HEIGHT;
        this.introPlayerVelY = 0;

        // Reset actual player position to where they'll end up
        this.player.x = this.introPlayerX + CONFIG.PLAYER.WIDTH / 2;
        this.player.y = CONFIG.WORLD_TOP_BOUNDARY + 100;
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

        switch (this.gameState) {
            case GameState.MENU:
                this.updateMenu(deltaTime);
                this.renderMenu();
                break;
            case GameState.INTRO:
                this.updateIntro(deltaTime);
                this.renderIntro();
                break;
            case GameState.PLAYING:
                this.update(deltaTime);
                this.render();
                break;
            case GameState.GAME_OVER:
                this.renderGameOver();
                break;
        }

        requestAnimationFrame(this.gameLoop);
    }

    /**
     * Update menu state (player patrol on title)
     */
    updateMenu(deltaTime) {
        const cfg = CONFIG.MENU;
        const now = Date.now();

        // Calculate title dimensions
        const titleWidth = cfg.TITLE_SPRITE_WIDTH * cfg.TITLE_SCALE;
        const playerWidth = CONFIG.PLAYER.WIDTH;

        // Update patrol pause
        if (now < this.menuPlayerPauseUntil) {
            return;  // Still pausing
        }

        // Move player
        this.menuPlayerX += this.menuPlayerVelX;

        // Check bounds and reverse
        const maxX = titleWidth - playerWidth;
        if (this.menuPlayerX >= maxX) {
            this.menuPlayerX = maxX;
            this.menuPlayerVelX = -cfg.PLAYER_WALK_SPEED;
            this.menuPlayerPauseUntil = now + cfg.PLAYER_PATROL_PAUSE;
        } else if (this.menuPlayerX <= 0) {
            this.menuPlayerX = 0;
            this.menuPlayerVelX = cfg.PLAYER_WALK_SPEED;
            this.menuPlayerPauseUntil = now + cfg.PLAYER_PATROL_PAUSE;
        }

        // Update animation frame
        this.menuPlayerAnimFrame += CONFIG.PLAYER.ANIMATION_SPEED;
        if (this.menuPlayerAnimFrame >= CONFIG.PLAYER.SPRITE_FRAMES) {
            this.menuPlayerAnimFrame = 0;
        }
    }

    /**
     * Update intro cutscene (falling into water)
     */
    updateIntro(deltaTime) {
        const cfg = CONFIG.INTRO;
        const now = Date.now();

        // Apply gravity
        this.introPlayerVelY += cfg.FALL_GRAVITY;
        if (this.introPlayerVelY > cfg.FALL_MAX_SPEED) {
            this.introPlayerVelY = cfg.FALL_MAX_SPEED;
        }

        // Move player down
        this.introPlayerY += this.introPlayerVelY;

        // Check if intro duration is complete
        if (now - this.introStartTime >= cfg.DURATION) {
            this.startPlaying();
        }
    }

    /**
     * Transition to playing state
     */
    startPlaying() {
        this.gameState = GameState.PLAYING;

        // Reset player to starting position
        this.player.x = CONFIG.WORLD_WIDTH / 2;
        this.player.y = CONFIG.WORLD_TOP_BOUNDARY + 100;
        this.player.velocityX = 0;
        this.player.velocityY = 0;

        // Reset camera to follow player
        this.camera.y = this.player.y - CONFIG.CANVAS_HEIGHT / 2;
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

        // Handle mute toggle (M key)
        const muteKeyPressed = Input.keys['KeyM'];
        if (muteKeyPressed && !this.muteKeyWasPressed) {
            AudioManager.toggleMute();
        }
        this.muteKeyWasPressed = muteKeyPressed;

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

        // Update spikes
        SpikeManager.update(this.player, this.particles, this.camera);

        // Update swordfish (camera passed for screen shake on damage)
        SwordFishManager.update(this.player, this.camera, this.particles);

        // Update piranha swarms
        PiranhaSwarmManager.update(this.player, this.camera, this.particles);

        // Update decorative bubbles
        BubbleManager.update(this.camera);

        // Update underwater effects
        UnderwaterEffects.update(deltaTime);

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
                this.player.takeDamage(CONFIG.ENEMY.CHARGE_DAMAGE, this.particles, this.camera);
            }
        }
    }

    /**
     * Handle game over state
     */
    handleGameOver() {
        this.gameState = GameState.GAME_OVER;

        // Store final depth for display
        this.finalDepth = Math.floor((this.player.y - CONFIG.WORLD_TOP_BOUNDARY) / 10);

        // Play death sound
        AudioManager.playSFX('DEATH');

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
            const drawY = 60;  // Position near top center

            this.ctx.drawImage(
                gameOverSprite,
                drawX, drawY,
                drawWidth, drawHeight
            );
        }

        // Draw stats below the sprite
        this.ctx.fillStyle = '#88ccff';
        this.ctx.font = '20px BoldPixels, Courier New';
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

        // Reset spikes
        SpikeManager.reset();

        // Reset swordfish
        SwordFishManager.reset();

        // Reset piranha swarms
        PiranhaSwarmManager.reset();

        // Reset bubbles
        BubbleManager.reset();

        // Reset world renderer tile cache
        WorldRenderer.reset();

        // Reset underwater effects and reinitialize
        UnderwaterEffects.reset();
        UnderwaterEffects.init();

        // Reset camera
        this.camera = new Camera();

        // Resume game
        this.gameState = GameState.PLAYING;
    }

    /**
     * Render the main menu
     */
    renderMenu() {
        const ctx = this.ctx;
        const cfg = CONFIG.MENU;

        // Clear canvas
        ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        this.disableImageSmoothing();

        // Draw gradient background (ocean)
        const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS_HEIGHT);
        gradient.addColorStop(0, '#1a4a6e');
        gradient.addColorStop(1, '#0a2a4e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        // Calculate title position (centered horizontally)
        const titleWidth = cfg.TITLE_SPRITE_WIDTH * cfg.TITLE_SCALE;
        const titleHeight = cfg.TITLE_SPRITE_HEIGHT * cfg.TITLE_SCALE;
        const titleX = (CONFIG.CANVAS_WIDTH - titleWidth) / 2;
        const titleY = cfg.TITLE_Y;

        // Draw title sprite
        const titleSprite = SpriteLoader.get('title');
        if (titleSprite) {
            ctx.drawImage(
                titleSprite,
                0, 0, cfg.TITLE_SPRITE_WIDTH, cfg.TITLE_SPRITE_HEIGHT,
                titleX, titleY, titleWidth, titleHeight
            );
        } else {
            // Fallback: draw placeholder rectangle
            ctx.fillStyle = '#334466';
            ctx.fillRect(titleX, titleY, titleWidth, titleHeight);
            ctx.fillStyle = '#ffffff';
            ctx.font = '24px BoldPixels, monospace';
            ctx.textAlign = 'center';
            ctx.fillText('DEEP DIVE', CONFIG.CANVAS_WIDTH / 2, titleY + titleHeight / 2);
        }

        // Draw player on top of title
        const playerSprite = SpriteLoader.get('player');
        const playerX = titleX + this.menuPlayerX;
        const playerY = titleY + titleHeight - CONFIG.PLAYER.HEIGHT;
        const facingRight = this.menuPlayerVelX > 0;

        ctx.save();
        ctx.translate(playerX + CONFIG.PLAYER.WIDTH / 2, playerY + CONFIG.PLAYER.HEIGHT / 2);
        if (!facingRight) {
            ctx.scale(-1, 1);
        }

        if (playerSprite) {
            const frameIndex = Math.floor(this.menuPlayerAnimFrame) % CONFIG.PLAYER.SPRITE_FRAMES;
            const srcX = frameIndex * CONFIG.PLAYER.SPRITE_FRAME_WIDTH;
            ctx.drawImage(
                playerSprite,
                srcX, 0, CONFIG.PLAYER.SPRITE_FRAME_WIDTH, CONFIG.PLAYER.SPRITE_FRAME_HEIGHT,
                -CONFIG.PLAYER.WIDTH / 2, -CONFIG.PLAYER.HEIGHT / 2,
                CONFIG.PLAYER.WIDTH, CONFIG.PLAYER.HEIGHT
            );
        } else {
            ctx.fillStyle = '#44aaff';
            ctx.fillRect(-CONFIG.PLAYER.WIDTH / 2, -CONFIG.PLAYER.HEIGHT / 2, CONFIG.PLAYER.WIDTH, CONFIG.PLAYER.HEIGHT);
        }
        ctx.restore();

        // Calculate play button position (centered horizontally)
        const buttonWidth = cfg.BUTTON_SPRITE_WIDTH * cfg.BUTTON_SCALE;
        const buttonHeight = cfg.BUTTON_SPRITE_HEIGHT * cfg.BUTTON_SCALE;
        const buttonX = (CONFIG.CANVAS_WIDTH - buttonWidth) / 2;
        const buttonY = cfg.BUTTON_Y;

        // Draw play button sprite
        const buttonSprite = SpriteLoader.get('playButton');
        if (buttonSprite) {
            ctx.drawImage(
                buttonSprite,
                0, 0, cfg.BUTTON_SPRITE_WIDTH, cfg.BUTTON_SPRITE_HEIGHT,
                buttonX, buttonY, buttonWidth, buttonHeight
            );
        } else {
            // Fallback: draw placeholder button
            ctx.fillStyle = '#446688';
            ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
            ctx.fillStyle = '#ffffff';
            ctx.font = '16px BoldPixels, monospace';
            ctx.textAlign = 'center';
            ctx.fillText('PLAY', CONFIG.CANVAS_WIDTH / 2, buttonY + buttonHeight / 2 + 6);
        }
    }

    /**
     * Render the intro cutscene
     */
    renderIntro() {
        const ctx = this.ctx;

        // Clear canvas
        ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        this.disableImageSmoothing();

        // Draw gradient background (transitioning to underwater)
        const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS_HEIGHT);
        gradient.addColorStop(0, '#1a4a6e');
        gradient.addColorStop(0.3, '#0a3a5e');
        gradient.addColorStop(1, '#0a2a4e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        // Draw falling player
        const playerSprite = SpriteLoader.get('player');
        const playerX = this.introPlayerX;
        const playerY = this.introPlayerY;

        ctx.save();
        ctx.translate(playerX + CONFIG.PLAYER.WIDTH / 2, playerY + CONFIG.PLAYER.HEIGHT / 2);

        // Player faces down when falling
        ctx.rotate(Math.PI / 2);

        if (playerSprite) {
            ctx.drawImage(
                playerSprite,
                0, 0, CONFIG.PLAYER.SPRITE_FRAME_WIDTH, CONFIG.PLAYER.SPRITE_FRAME_HEIGHT,
                -CONFIG.PLAYER.WIDTH / 2, -CONFIG.PLAYER.HEIGHT / 2,
                CONFIG.PLAYER.WIDTH, CONFIG.PLAYER.HEIGHT
            );
        } else {
            ctx.fillStyle = '#44aaff';
            ctx.fillRect(-CONFIG.PLAYER.WIDTH / 2, -CONFIG.PLAYER.HEIGHT / 2, CONFIG.PLAYER.WIDTH, CONFIG.PLAYER.HEIGHT);
        }
        ctx.restore();
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

        // Draw spikes
        SpikeManager.render(this.ctx, this.camera);

        // Draw swordfish and bullets
        SwordFishManager.render(this.ctx, this.camera);

        // Draw piranha swarms
        PiranhaSwarmManager.render(this.ctx, this.camera);

        // Draw decorative bubbles (on top of everything for visibility)
        BubbleManager.render(this.ctx, this.camera);

        // Draw underwater post-processing effects (on top of everything)
        UnderwaterEffects.render(this.ctx, this.camera);
    }
}

// =============================================================================
// INITIALIZE GAME
// =============================================================================

// Start the game when the page loads
window.addEventListener('load', () => {
    new Game();
});
