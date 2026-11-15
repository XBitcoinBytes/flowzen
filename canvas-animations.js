// Canvas animation system for liquid bubble effects
class CanvasAnimator {
    constructor() {
        this.canvases = new Map();
        this.animationId = null;
        this.isAnimating = false;
        
        this.initializeCanvases();
        this.startAnimation();
    }
    
    initializeCanvases() {
        const canvasElements = document.querySelectorAll('.sphere-canvas');
        
        canvasElements.forEach(canvas => {
            const sphere = canvas.closest('.sphere');
            const sphereId = sphere.id;
            
            const ctx = canvas.getContext('2d');
            const rect = canvas.getBoundingClientRect();
            const size = Math.min(canvas.width, canvas.height);
            
            // Create animation state for this canvas
            const animationState = {
                canvas,
                ctx,
                width: canvas.width,
                height: canvas.height,
                centerX: canvas.width / 2,
                centerY: canvas.height / 2,
                radius: size / 2 - 10,
                bubbles: [],
                ripples: [],
                time: 0,
                intensity: sphereId.includes('progress') ? 1.2 : 0.8,
                sphereType: this.getSphereType(sphereId)
            };
            
            // Generate initial bubbles
            this.generateBubbles(animationState);
            
            // Set up event listeners for ripple effects
            this.setupRippleEvents(sphere, animationState);
            
            this.canvases.set(sphereId, animationState);
        });
    }
    
    getSphereType(sphereId) {
        if (sphereId.includes('backlog')) return 'backlog';
        if (sphereId.includes('next')) return 'next';
        if (sphereId.includes('progress')) return 'progress';
        if (sphereId.includes('completed')) return 'completed';
        return 'default';
    }
    
    generateBubbles(state) {
        const bubbleCount = Math.floor(Math.random() * 8) + 5;
        
        for (let i = 0; i < bubbleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * (state.radius - 30);
            const x = state.centerX + Math.cos(angle) * distance;
            const y = state.centerY + Math.sin(angle) * distance;
            
            state.bubbles.push({
                x,
                y,
                radius: Math.random() * 8 + 3,
                speed: Math.random() * 0.5 + 0.2,
                angle: Math.random() * Math.PI * 2,
                opacity: Math.random() * 0.4 + 0.1,
                phase: Math.random() * Math.PI * 2,
                color: this.getBubbleColor(state.sphereType)
            });
        }
    }
    
    getBubbleColor(sphereType) {
        const colors = {
            backlog: 'rgba(144, 202, 249, 0.8)',
            next: 'rgba(255, 193, 7, 0.7)',
            progress: 'rgba(102, 187, 106, 0.9)',
            completed: 'rgba(206, 147, 216, 0.8)'
        };
        return colors[sphereType] || 'rgba(144, 202, 249, 0.8)';
    }
    
    setupRippleEvents(sphere, state) {
        const createRipple = (event) => {
            const rect = sphere.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            // Convert to canvas coordinates
            const canvasX = (x / rect.width) * state.width;
            const canvasY = (y / rect.height) * state.height;
            
            state.ripples.push({
                x: canvasX,
                y: canvasY,
                radius: 0,
                maxRadius: 80,
                opacity: 0.6,
                speed: 2
            });
        };
        
        sphere.addEventListener('mouseenter', createRipple);
        sphere.addEventListener('click', createRipple);
        
        // Touch events for mobile
        sphere.addEventListener('touchstart', (e) => {
            e.preventDefault();
            createRipple(e.touches[0]);
        });
    }
    
    startAnimation() {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        this.animate();
    }
    
    stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.isAnimating = false;
    }
    
    animate() {
        this.canvases.forEach((state) => {
            this.updateState(state);
            this.render(state);
        });
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    updateState(state) {
        state.time += 0.016; // ~60fps
        
        // Update bubbles
        state.bubbles.forEach((bubble, index) => {
            // Gentle floating motion
            bubble.y -= bubble.speed;
            bubble.x += Math.sin(state.time + bubble.phase) * 0.3;
            
            // Subtle size pulsing
            const pulseScale = 1 + Math.sin(state.time * 2 + bubble.phase) * 0.1;
            bubble.currentRadius = bubble.radius * pulseScale;
            
            // Reset bubble if it goes out of bounds
            if (bubble.y < -bubble.radius || 
                bubble.x < -bubble.radius || 
                bubble.x > state.width + bubble.radius) {
                // Respawn at bottom
                bubble.y = state.height + bubble.radius;
                bubble.x = state.centerX + (Math.random() - 0.5) * state.radius;
            }
        });
        
        // Update ripples
        state.ripples = state.ripples.filter(ripple => {
            ripple.radius += ripple.speed;
            ripple.opacity = Math.max(0, ripple.opacity - 0.02);
            return ripple.radius < ripple.maxRadius && ripple.opacity > 0;
        });
    }
    
    render(state) {
        const { ctx, width, height, centerX, centerY, radius } = state;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Create circular clipping mask
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.clip();
        
        // Render bubbles
        this.renderBubbles(state);
        
        // Render ripples
        this.renderRipples(state);
        
        // Render subtle background gradient
        this.renderBackground(state);
        
        ctx.restore();
    }
    
    renderBubbles(state) {
        const { ctx } = state;
        
        state.bubbles.forEach(bubble => {
            ctx.save();
            
            // Create radial gradient for bubble
            const gradient = ctx.createRadialGradient(
                bubble.x - bubble.currentRadius * 0.3,
                bubble.y - bubble.currentRadius * 0.3,
                0,
                bubble.x,
                bubble.y,
                bubble.currentRadius
            );
            
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            gradient.addColorStop(0.7, bubble.color);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
            
            ctx.globalAlpha = bubble.opacity;
            ctx.fillStyle = gradient;
            
            ctx.beginPath();
            ctx.arc(bubble.x, bubble.y, bubble.currentRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // Add highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.beginPath();
            ctx.arc(
                bubble.x - bubble.currentRadius * 0.3,
                bubble.y - bubble.currentRadius * 0.3,
                bubble.currentRadius * 0.3,
                0,
                Math.PI * 2
            );
            ctx.fill();
            
            ctx.restore();
        });
    }
    
    renderRipples(state) {
        const { ctx } = state;
        
        state.ripples.forEach(ripple => {
            ctx.save();
            ctx.globalAlpha = ripple.opacity;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.restore();
        });
    }
    
    renderBackground(state) {
        const { ctx, centerX, centerY, radius, time, sphereType } = state;
        
        // Enhanced zen-like animated background with subtle water effects
        ctx.save();
        ctx.globalAlpha = 0.15;
        
        // Primary flowing gradient
        const gradient1 = ctx.createRadialGradient(
            centerX + Math.sin(time * 0.3) * 15,
            centerY + Math.cos(time * 0.4) * 12,
            0,
            centerX,
            centerY,
            radius
        );
        
        // Secondary smaller flowing gradient
        const gradient2 = ctx.createRadialGradient(
            centerX + Math.cos(time * 0.6) * 8,
            centerY + Math.sin(time * 0.5) * 10,
            0,
            centerX,
            centerY,
            radius * 0.6
        );
        
        // Different colors based on sphere type
        const colors = this.getBackgroundColors(sphereType);
        
        gradient1.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient1.addColorStop(0.6, colors.primary);
        gradient1.addColorStop(1, colors.secondary);
        
        gradient2.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
        gradient2.addColorStop(1, colors.accent);
        
        // Render primary background
        ctx.fillStyle = gradient1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Render secondary overlay
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = gradient2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    getBackgroundColors(sphereType) {
        const colorSchemes = {
            backlog: {
                primary: 'rgba(144, 202, 249, 0.2)',
                secondary: 'rgba(66, 165, 245, 0.1)',
                accent: 'rgba(144, 202, 249, 0.15)'
            },
            next: {
                primary: 'rgba(255, 193, 7, 0.2)',
                secondary: 'rgba(255, 152, 0, 0.1)',
                accent: 'rgba(255, 193, 7, 0.15)'
            },
            progress: {
                primary: 'rgba(102, 187, 106, 0.25)',
                secondary: 'rgba(76, 175, 80, 0.15)',
                accent: 'rgba(102, 187, 106, 0.2)'
            },
            completed: {
                primary: 'rgba(206, 147, 216, 0.2)',
                secondary: 'rgba(156, 39, 176, 0.1)',
                accent: 'rgba(206, 147, 216, 0.15)'
            }
        };
        
        return colorSchemes[sphereType] || colorSchemes.backlog;
    }
    
    updateTaskCount(sphereId, count) {
        const state = this.canvases.get(sphereId);
        if (!state) return;
        
        // Adjust bubble intensity based on task count
        const targetBubbleCount = Math.max(3, Math.min(15, count + 3));
        const currentBubbleCount = state.bubbles.length;
        
        if (currentBubbleCount < targetBubbleCount) {
            // Add more bubbles
            for (let i = currentBubbleCount; i < targetBubbleCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * (state.radius - 30);
                const x = state.centerX + Math.cos(angle) * distance;
                const y = state.centerY + Math.sin(angle) * distance;
                
                state.bubbles.push({
                    x,
                    y,
                    radius: Math.random() * 8 + 3,
                    speed: Math.random() * 0.5 + 0.2,
                    angle: Math.random() * Math.PI * 2,
                    opacity: Math.random() * 0.4 + 0.1,
                    phase: Math.random() * Math.PI * 2,
                    color: this.getBubbleColor(state.sphereType)
                });
            }
        } else if (currentBubbleCount > targetBubbleCount) {
            // Remove excess bubbles
            state.bubbles.splice(targetBubbleCount);
        }
    }
    
    triggerFrothingEffect(sphereId) {
        const state = this.canvases.get(sphereId);
        if (!state) return;
        
        // Create multiple ripples for frothing effect
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * state.radius * 0.7;
                const x = state.centerX + Math.cos(angle) * distance;
                const y = state.centerY + Math.sin(angle) * distance;
                
                state.ripples.push({
                    x,
                    y,
                    radius: 0,
                    maxRadius: 60 + Math.random() * 40,
                    opacity: 0.4,
                    speed: 1.5 + Math.random()
                });
            }, i * 100);
        }
    }
}

// Initialize canvas animator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.canvasAnimator = new CanvasAnimator();
});
