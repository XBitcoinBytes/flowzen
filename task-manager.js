// Task management system
class TaskManager {
    constructor() {
        this.tasks = {
            backlog: [],
            next: [],
            progress: [],
            completed: []
        };
        
        this.taskIdCounter = 1;
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Task creation
        document.getElementById('task-form').addEventListener('submit', this.handleTaskCreation.bind(this));
        
        // Add task buttons
        document.querySelectorAll('.add-task-btn').forEach(btn => {
            btn.addEventListener('click', this.showTaskModal.bind(this));
        });
        
        // View completed tasks
        document.querySelector('.view-completed-btn').addEventListener('click', this.showCompletedModal.bind(this));
        
        // Modal controls
        document.getElementById('close-task-modal').addEventListener('click', this.hideTaskModal.bind(this));
        document.getElementById('close-completed-modal').addEventListener('click', this.hideCompletedModal.bind(this));
        
        // Task interactions (right-click for edit/delete)
        document.addEventListener('contextmenu', this.handleTaskRightClick.bind(this));
        document.addEventListener('dblclick', this.handleTaskDoubleClick.bind(this));
        
        // Long press for mobile
        document.addEventListener('touchstart', this.handleTouchStart.bind(this));
        document.addEventListener('touchend', this.handleTouchEnd.bind(this));
    }
    
    async loadTasks(tasksData = null) {
        if (tasksData) {
            this.tasks = tasksData;
        } else if (window.firebaseManager) {
            this.tasks = await window.firebaseManager.loadTasks();
        } else {
            // Fallback to localStorage
            const saved = localStorage.getItem('zenflow_tasks');
            this.tasks = saved ? JSON.parse(saved) : this.tasks;
        }
        
        // Ensure all task arrays exist
        Object.keys(this.tasks).forEach(key => {
            if (!Array.isArray(this.tasks[key])) {
                this.tasks[key] = [];
            }
        });
        
        this.renderAllTasks();
        this.updateTaskCounts();
    }
    
    async saveTasks() {
        if (window.firebaseManager) {
            await window.firebaseManager.saveTasks(this.tasks);
        } else {
            localStorage.setItem('zenflow_tasks', JSON.stringify(this.tasks));
        }
    }
    
    showTaskModal() {
        document.getElementById('task-modal').classList.remove('hidden');
        document.getElementById('task-description').focus();
    }
    
    hideTaskModal() {
        document.getElementById('task-modal').classList.add('hidden');
        document.getElementById('task-form').reset();
    }
    
    showCompletedModal() {
        this.renderCompletedTasks();
        document.getElementById('completed-modal').classList.remove('hidden');
    }
    
    hideCompletedModal() {
        document.getElementById('completed-modal').classList.add('hidden');
    }
    
    async handleTaskCreation(event) {
        event.preventDefault();
        
        const description = document.getElementById('task-description').value.trim();
        const dueDate = document.getElementById('task-date').value;
        const importance = document.querySelector('input[name="importance"]:checked').value;
        
        if (!description) {
            window.showToast('Please enter a task description', 'error');
            return;
        }
        
        const task = {
            id: this.generateTaskId(),
            description: this.sanitizeInput(description),
            dueDate: dueDate || null,
            importance,
            createdAt: new Date().toISOString(),
            completedAt: null
        };
        
        this.tasks.backlog.push(task);
        
        await this.saveTasks();
        this.renderTasks('backlog');
        this.updateTaskCounts();
        this.hideTaskModal();
        
        window.showToast('Task added to backlog', 'success');
        
        // Play sound effect
        if (window.audioManager) {
            window.audioManager.playSound('create');
        }
        
        // Update canvas animation
        if (window.canvasAnimator) {
            window.canvasAnimator.updateTaskCount('backlog-sphere', this.tasks.backlog.length);
        }
        
        // Analytics
        if (window.firebaseManager) {
            window.firebaseManager.logAnalyticsEvent('task_created', {
                importance,
                has_due_date: !!dueDate
            });
        }
    }
    
    generateTaskId() {
        return `task_${Date.now()}_${this.taskIdCounter++}`;
    }
    
    sanitizeInput(input) {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML.substring(0, 100); // Limit length
    }
    
    async moveTask(taskId, fromSphere, toSphere) {
        const taskIndex = this.tasks[fromSphere].findIndex(task => task.id === taskId);
        if (taskIndex === -1) return false;
        
        const task = this.tasks[fromSphere][taskIndex];
        
        // Update completion status
        if (toSphere === 'completed') {
            task.completedAt = new Date().toISOString();
        } else {
            task.completedAt = null;
        }
        
        // Move task
        this.tasks[fromSphere].splice(taskIndex, 1);
        this.tasks[toSphere].push(task);
        
        await this.saveTasks();
        this.renderTasks(fromSphere);
        this.renderTasks(toSphere);
        this.updateTaskCounts();
        
        // Update canvas animations
        if (window.canvasAnimator) {
            window.canvasAnimator.updateTaskCount(`${fromSphere}-sphere`, this.tasks[fromSphere].length);
            window.canvasAnimator.updateTaskCount(`${toSphere}-sphere`, this.tasks[toSphere].length);
        }
        
        // Analytics
        if (window.firebaseManager) {
            window.firebaseManager.logAnalyticsEvent('task_moved', {
                from: fromSphere,
                to: toSphere,
                importance: task.importance
            });
        }
        
        return true;
    }
    
    async deleteTask(taskId, sphere) {
        const taskIndex = this.tasks[sphere].findIndex(task => task.id === taskId);
        if (taskIndex === -1) return false;
        
        const task = this.tasks[sphere][taskIndex];
        this.tasks[sphere].splice(taskIndex, 1);
        
        await this.saveTasks();
        this.renderTasks(sphere);
        this.updateTaskCounts();
        
        window.showToast('Task deleted', 'success');
        
        // Update canvas animation
        if (window.canvasAnimator) {
            window.canvasAnimator.updateTaskCount(`${sphere}-sphere`, this.tasks[sphere].length);
        }
        
        // Analytics
        if (window.firebaseManager) {
            window.firebaseManager.logAnalyticsEvent('task_deleted', {
                sphere,
                importance: task.importance
            });
        }
        
        return true;
    }
    
    async editTask(taskId, sphere, newData) {
        const task = this.tasks[sphere].find(task => task.id === taskId);
        if (!task) return false;
        
        // Update task properties
        Object.assign(task, {
            description: this.sanitizeInput(newData.description),
            dueDate: newData.dueDate || null,
            importance: newData.importance
        });
        
        await this.saveTasks();
        this.renderTasks(sphere);
        
        window.showToast('Task updated', 'success');
        
        // Analytics
        if (window.firebaseManager) {
            window.firebaseManager.logAnalyticsEvent('task_edited', {
                sphere,
                importance: task.importance
            });
        }
        
        return true;
    }
    
    renderAllTasks() {
        Object.keys(this.tasks).forEach(sphere => {
            this.renderTasks(sphere);
        });
    }
    
    renderTasks(sphere) {
        const container = document.getElementById(`${sphere}-tasks`);
        if (!container) return;
        
        container.innerHTML = '';
        
        const tasks = this.tasks[sphere] || [];
        const visibleTasks = sphere === 'completed' ? tasks.slice(-5) : tasks;
        
        visibleTasks.forEach(task => {
            const taskElement = this.createTaskElement(task, sphere);
            container.appendChild(taskElement);
        });
    }
    
    createTaskElement(task, sphere) {
        const taskOrb = document.createElement('div');
        taskOrb.className = `task-orb ${task.importance}`;
        taskOrb.dataset.taskId = task.id;
        taskOrb.dataset.description = task.description;
        taskOrb.dataset.dueDate = task.dueDate || '';
        taskOrb.dataset.importance = task.importance;
        taskOrb.dataset.createdAt = task.createdAt;
        taskOrb.setAttribute('tabindex', '0');
        taskOrb.setAttribute('aria-label', `Task: ${task.description}. Importance: ${task.importance}`);
        
        // Add due date indicator if present
        let dateIndicator = '';
        if (task.dueDate) {
            const dueDate = new Date(task.dueDate);
            const today = new Date();
            const isOverdue = dueDate < today && sphere !== 'completed';
            
            dateIndicator = `<span class="date-indicator ${isOverdue ? 'overdue' : ''}" title="Due: ${dueDate.toLocaleDateString()}">⏰</span>`;
        }
        
        taskOrb.innerHTML = `
            ${dateIndicator}
            <span class="task-text">${task.description}</span>
        `;
        
        return taskOrb;
    }
    
    updateTaskCounts() {
        Object.keys(this.tasks).forEach(sphere => {
            const countElement = document.getElementById(`${sphere}-count`);
            if (countElement) {
                countElement.textContent = this.tasks[sphere].length;
            }
        });
    }
    
    renderCompletedTasks() {
        const container = document.getElementById('completed-list');
        container.innerHTML = '';
        
        const completedTasks = [...this.tasks.completed].reverse(); // Show most recent first
        
        if (completedTasks.length === 0) {
            container.innerHTML = '<p class="empty-state">No completed tasks yet. Keep working!</p>';
            return;
        }
        
        completedTasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = 'completed-task';
            
            const completedDate = task.completedAt ? new Date(task.completedAt).toLocaleDateString() : 'Unknown';
            
            taskElement.innerHTML = `
                <div class="completed-task-info">
                    <div class="completed-task-title">${task.description}</div>
                    <div class="completed-task-date">Completed on ${completedDate}</div>
                </div>
                <button class="icon-btn" onclick="taskManager.deleteTask('${task.id}', 'completed')" aria-label="Delete task permanently">
                    <i data-feather="trash-2"></i>
                </button>
            `;
            
            container.appendChild(taskElement);
        });
        
        // Re-initialize Feather icons
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }
    
    // Right-click context menu for task actions
    handleTaskRightClick(event) {
        const taskOrb = event.target.closest('.task-orb');
        if (!taskOrb) return;
        
        event.preventDefault();
        this.showTaskContextMenu(taskOrb, event.clientX, event.clientY);
    }
    
    handleTaskDoubleClick(event) {
        const taskOrb = event.target.closest('.task-orb');
        if (!taskOrb) return;
        
        this.editTaskPrompt(taskOrb);
    }
    
    // Long press support for mobile
    handleTouchStart(event) {
        const taskOrb = event.target.closest('.task-orb');
        if (!taskOrb) return;
        
        this.longPressTimer = setTimeout(() => {
            const touch = event.touches[0];
            this.showTaskContextMenu(taskOrb, touch.clientX, touch.clientY);
        }, 500);
    }
    
    handleTouchEnd(event) {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
    }
    
    showTaskContextMenu(taskOrb, x, y) {
        // Remove existing context menu
        const existingMenu = document.getElementById('task-context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }
        
        const menu = document.createElement('div');
        menu.id = 'task-context-menu';
        menu.className = 'context-menu';
        menu.style.position = 'fixed';
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;
        menu.style.zIndex = '10000';
        menu.style.background = 'white';
        menu.style.border = '1px solid #ccc';
        menu.style.borderRadius = '8px';
        menu.style.boxShadow = '0 5px 20px rgba(0,0,0,0.15)';
        menu.style.padding = '8px 0';
        menu.style.minWidth = '120px';
        
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.className = 'context-menu-item';
        editBtn.onclick = () => {
            this.editTaskPrompt(taskOrb);
            menu.remove();
        };
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.className = 'context-menu-item delete';
        deleteBtn.onclick = () => {
            this.deleteTaskPrompt(taskOrb);
            menu.remove();
        };
        
        menu.appendChild(editBtn);
        menu.appendChild(deleteBtn);
        document.body.appendChild(menu);
        
        // Remove menu when clicking outside
        setTimeout(() => {
            document.addEventListener('click', () => menu.remove(), { once: true });
        }, 100);
    }
    
    editTaskPrompt(taskOrb) {
        const taskId = taskOrb.dataset.taskId;
        const sphere = this.findTaskSphere(taskId);
        const task = this.tasks[sphere].find(t => t.id === taskId);
        
        if (!task) return;
        
        // Simple prompt-based editing (could be enhanced with a proper modal)
        const newDescription = prompt('Edit task description:', task.description);
        if (newDescription && newDescription !== task.description) {
            this.editTask(taskId, sphere, {
                description: newDescription,
                dueDate: task.dueDate,
                importance: task.importance
            });
        }
    }
    
    deleteTaskPrompt(taskOrb) {
        const taskId = taskOrb.dataset.taskId;
        const sphere = this.findTaskSphere(taskId);
        const task = this.tasks[sphere].find(t => t.id === taskId);
        
        if (!task) return;
        
        if (confirm(`Delete task "${task.description}"?`)) {
            this.deleteTask(taskId, sphere);
        }
    }
    
    findTaskSphere(taskId) {
        for (const sphere of Object.keys(this.tasks)) {
            if (this.tasks[sphere].find(task => task.id === taskId)) {
                return sphere;
            }
        }
        return null;
    }
    
    getTasks() {
        return this.tasks;
    }
    
    getTaskStats() {
        return {
            total: Object.values(this.tasks).reduce((sum, tasks) => sum + tasks.length, 0),
            completed: this.tasks.completed.length,
            inProgress: this.tasks.progress.length,
            backlog: this.tasks.backlog.length
        };
    }
}

// Context menu styles
const contextMenuStyles = document.createElement('style');
contextMenuStyles.textContent = `
    .context-menu-item {
        display: block;
        width: 100%;
        padding: 8px 16px;
        border: none;
        background: none;
        text-align: left;
        cursor: pointer;
        transition: background-color 0.2s;
    }
    
    .context-menu-item:hover {
        background-color: #f5f5f5;
    }
    
    .context-menu-item.delete {
        color: #f44336;
    }
    
    .context-menu-item.delete:hover {
        background-color: #ffebee;
    }
    
    .empty-state {
        text-align: center;
        color: #666;
        font-style: italic;
        padding: 20px;
    }
    
    .date-indicator {
        font-size: 10px;
        margin-right: 4px;
    }
    
    .date-indicator.overdue {
        color: #f44336;
    }
`;
document.head.appendChild(contextMenuStyles);

// Initialize task manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.taskManager = new TaskManager();
});
