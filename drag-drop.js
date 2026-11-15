// Drag and drop system for task management
class DragDropManager {
    constructor() {
        this.draggedTask = null;
        this.sourceContainer = null;
        this.isDragging = false;
        
        this.sphereLimits = {
            next: 6,
            progress: 3
        };
        
        this.initializeDragDrop();
    }
    
    initializeDragDrop() {
        this.setupTaskDragEvents();
        this.setupSphereDropEvents();
    }
    
    setupTaskDragEvents() {
        // Use event delegation for dynamically created tasks
        document.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        // Touch events for mobile
        document.addEventListener('touchstart', this.handleTouchStart.bind(this));
        document.addEventListener('touchmove', this.handleTouchMove.bind(this));
        document.addEventListener('touchend', this.handleTouchEnd.bind(this));
        
        // Keyboard support
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }
    
    setupSphereDropEvents() {
        const spheres = document.querySelectorAll('.sphere');
        
        spheres.forEach(sphere => {
            sphere.addEventListener('dragover', this.handleDragOver.bind(this));
            sphere.addEventListener('drop', this.handleDrop.bind(this));
            sphere.addEventListener('dragenter', this.handleDragEnter.bind(this));
            sphere.addEventListener('dragleave', this.handleDragLeave.bind(this));
        });
    }
    
    handleMouseDown(event) {
        const taskOrb = event.target.closest('.task-orb');
        if (!taskOrb) return;
        
        this.startDrag(taskOrb, event);
    }
    
    handleTouchStart(event) {
        const taskOrb = event.target.closest('.task-orb');
        if (!taskOrb) return;
        
        event.preventDefault();
        this.startDrag(taskOrb, event.touches[0]);
    }
    
    startDrag(taskOrb, pointer) {
        this.draggedTask = taskOrb;
        this.sourceContainer = taskOrb.closest('.task-container');
        this.isDragging = true;
        
        // Visual feedback
        taskOrb.classList.add('dragging');
        document.body.style.cursor = 'grabbing';
        
        // Store initial position
        const rect = taskOrb.getBoundingClientRect();
        this.dragOffset = {
            x: pointer.clientX - rect.left,
            y: pointer.clientY - rect.top
        };
        
        // Create drag preview
        this.createDragPreview(taskOrb, pointer);
        
        // Play sound effect
        if (window.audioManager) {
            window.audioManager.playSound('pickup');
        }
        
        // Prevent text selection
        document.body.style.userSelect = 'none';
    }
    
    createDragPreview(taskOrb, pointer) {
        const preview = taskOrb.cloneNode(true);
        preview.id = 'drag-preview';
        preview.style.position = 'fixed';
        preview.style.pointerEvents = 'none';
        preview.style.zIndex = '9999';
        preview.style.transform = 'scale(1.1)';
        preview.style.opacity = '0.8';
        
        this.updatePreviewPosition(preview, pointer);
        document.body.appendChild(preview);
    }
    
    updatePreviewPosition(preview, pointer) {
        preview.style.left = `${pointer.clientX - this.dragOffset.x}px`;
        preview.style.top = `${pointer.clientY - this.dragOffset.y}px`;
    }
    
    handleMouseMove(event) {
        if (!this.isDragging) return;
        
        this.updateDrag(event);
    }
    
    handleTouchMove(event) {
        if (!this.isDragging) return;
        
        event.preventDefault();
        this.updateDrag(event.touches[0]);
    }
    
    updateDrag(pointer) {
        const preview = document.getElementById('drag-preview');
        if (preview) {
            this.updatePreviewPosition(preview, pointer);
        }
        
        // Check for hover over drop zones
        const elementBelow = document.elementFromPoint(pointer.clientX, pointer.clientY);
        const sphere = elementBelow?.closest('.sphere');
        
        this.updateDropZoneIndicators(sphere);
    }
    
    updateDropZoneIndicators(hoveredSphere) {
        const spheres = document.querySelectorAll('.sphere');
        
        spheres.forEach(sphere => {
            sphere.classList.remove('drag-over', 'invalid');
            
            if (sphere === hoveredSphere) {
                const sphereType = this.getSphereType(sphere);
                const canDrop = this.canDropInSphere(sphereType);
                
                sphere.classList.add('drag-over');
                if (!canDrop) {
                    sphere.classList.add('invalid');
                }
            }
        });
    }
    
    handleMouseUp(event) {
        if (!this.isDragging) return;
        
        this.endDrag(event);
    }
    
    handleTouchEnd(event) {
        if (!this.isDragging) return;
        
        event.preventDefault();
        const touch = event.changedTouches[0];
        this.endDrag(touch);
    }
    
    endDrag(pointer) {
        if (!this.draggedTask) return;
        
        const elementBelow = document.elementFromPoint(pointer.clientX, pointer.clientY);
        const targetSphere = elementBelow?.closest('.sphere');
        
        if (targetSphere) {
            this.handleTaskDrop(targetSphere);
        }
        
        this.cleanupDrag();
    }
    
    handleTaskDrop(targetSphere) {
        const targetType = this.getSphereType(targetSphere);
        const sourceType = this.getSphereType(this.sourceContainer.closest('.sphere'));
        
        if (this.canDropInSphere(targetType)) {
            const taskData = this.extractTaskData(this.draggedTask);
            
            // Move task between spheres
            if (window.taskManager) {
                window.taskManager.moveTask(taskData.id, sourceType, targetType);
                
                // Play success sound
                if (window.audioManager) {
                    window.audioManager.playSound('drop');
                }
                
                // Trigger animation effects
                if (window.canvasAnimator) {
                    window.canvasAnimator.triggerFrothingEffect(targetSphere.id);
                }
                
                window.showToast(`Task moved to ${this.getSphereLabel(targetType)}`, 'success');
            }
        } else {
            // Invalid drop - show error
            window.showToast(this.getDropErrorMessage(targetType), 'error');
            
            if (window.audioManager) {
                window.audioManager.playSound('error');
            }
        }
    }
    
    getSphereType(element) {
        if (!element) return null;
        
        const sphere = element.closest('.sphere');
        if (!sphere) return null;
        
        if (sphere.id.includes('backlog')) return 'backlog';
        if (sphere.id.includes('next')) return 'next';
        if (sphere.id.includes('progress')) return 'progress';
        if (sphere.id.includes('completed')) return 'completed';
        
        return null;
    }
    
    getSphereLabel(sphereType) {
        const labels = {
            backlog: 'Backlog',
            next: 'Next Up',
            progress: 'In Progress',
            completed: 'Completed'
        };
        return labels[sphereType] || sphereType;
    }
    
    canDropInSphere(sphereType) {
        if (!sphereType || !window.taskManager) return false;
        
        const tasks = window.taskManager.getTasks();
        const currentCount = tasks[sphereType]?.length || 0;
        const limit = this.sphereLimits[sphereType];
        
        // Check if sphere has a limit and if it's exceeded
        if (limit && currentCount >= limit) {
            return false;
        }
        
        return true;
    }
    
    getDropErrorMessage(sphereType) {
        const limits = {
            next: 'Next Up is full (max 6 tasks)',
            progress: 'In Progress is full (max 3 tasks)'
        };
        
        return limits[sphereType] || 'Cannot drop task here';
    }
    
    extractTaskData(taskElement) {
        return {
            id: taskElement.dataset.taskId,
            description: taskElement.dataset.description,
            dueDate: taskElement.dataset.dueDate,
            importance: taskElement.dataset.importance,
            createdAt: taskElement.dataset.createdAt
        };
    }
    
    cleanupDrag() {
        // Remove drag preview
        const preview = document.getElementById('drag-preview');
        if (preview) {
            preview.remove();
        }
        
        // Clean up visual states
        if (this.draggedTask) {
            this.draggedTask.classList.remove('dragging');
        }
        
        const spheres = document.querySelectorAll('.sphere');
        spheres.forEach(sphere => {
            sphere.classList.remove('drag-over', 'invalid');
        });
        
        // Reset cursor and selection
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        
        // Reset state
        this.draggedTask = null;
        this.sourceContainer = null;
        this.isDragging = false;
        this.dragOffset = null;
    }
    
    // Keyboard support for accessibility
    handleKeyDown(event) {
        const taskOrb = event.target.closest('.task-orb');
        if (!taskOrb) return;
        
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.handleKeyboardMove(taskOrb);
        }
    }
    
    handleKeyboardMove(taskOrb) {
        const currentSphere = taskOrb.closest('.sphere');
        const currentType = this.getSphereType(currentSphere);
        
        // Determine next sphere in workflow
        const workflow = ['backlog', 'next', 'progress', 'completed'];
        const currentIndex = workflow.indexOf(currentType);
        const nextType = workflow[currentIndex + 1] || workflow[0];
        
        if (this.canDropInSphere(nextType)) {
            const taskData = this.extractTaskData(taskOrb);
            if (window.taskManager) {
                window.taskManager.moveTask(taskData.id, currentType, nextType);
                window.showToast(`Task moved to ${this.getSphereLabel(nextType)}`, 'success');
            }
        } else {
            window.showToast(this.getDropErrorMessage(nextType), 'error');
        }
    }
    
    // HTML5 Drag API fallback handlers
    handleDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }
    
    handleDragEnter(event) {
        event.preventDefault();
        const sphere = event.currentTarget;
        const sphereType = this.getSphereType(sphere);
        
        if (this.canDropInSphere(sphereType)) {
            sphere.classList.add('drag-over');
        } else {
            sphere.classList.add('drag-over', 'invalid');
        }
    }
    
    handleDragLeave(event) {
        event.currentTarget.classList.remove('drag-over', 'invalid');
    }
    
    handleDrop(event) {
        event.preventDefault();
        const sphere = event.currentTarget;
        sphere.classList.remove('drag-over', 'invalid');
        
        // This would handle HTML5 drag API drops
        // Currently using mouse/touch events for better mobile support
    }
}

// Initialize drag-drop manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dragDropManager = new DragDropManager();
});
