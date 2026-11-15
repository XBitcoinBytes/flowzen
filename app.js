// Main application controller
class ZenFlowApp {
    constructor() {
        this.isInitialized = false;
        this.currentUser = null;
        
        this.initialize();
    }
    
    async initialize() {
        try {
            console.log('Initializing Zen Flow...');
            
            // Show loading screen
            this.showLoading();
            
            // Wait for Firebase to initialize
            await this.waitForFirebase();
            
            // Set up authentication flow
            this.setupAuthFlow();
            
            // Set up UI event listeners
            this.setupUIEvents();
            
            // Check for existing session
            await this.checkExistingSession();
            
            console.log('Zen Flow initialized successfully');
            this.isInitialized = true;
            
        } catch (error) {
            console.error('Initialization error:', error);
            this.showToast('Application failed to initialize', 'error');
            this.hideLoading();
        }
    }
    
    async waitForFirebase() {
        return new Promise((resolve) => {
            const checkFirebase = () => {
                if (window.firebaseManager) {
                    resolve();
                } else {
                    setTimeout(checkFirebase, 100);
                }
            };
            checkFirebase();
        });
    }
    
    setupAuthFlow() {
        // Auth modal tab switching
        const tabBtns = document.querySelectorAll('.tab-btn');
        const authForms = document.querySelectorAll('.auth-form');
        
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.dataset.tab;
                
                // Update active tab
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Show corresponding form
                authForms.forEach(form => {
                    if (form.id === `${targetTab}-form`) {
                        form.classList.remove('hidden');
                    } else {
                        form.classList.add('hidden');
                    }
                });
            });
        });
        
        // Auth form submissions
        document.getElementById('login-btn').addEventListener('click', this.handleLogin.bind(this));
        document.getElementById('signup-btn').addEventListener('click', this.handleSignUp.bind(this));
        document.getElementById('guest-btn').addEventListener('click', this.handleGuestMode.bind(this));
        
        // Enter key support in auth forms
        document.getElementById('login-email').addEventListener('keypress', this.handleAuthKeyPress.bind(this));
        document.getElementById('login-password').addEventListener('keypress', this.handleAuthKeyPress.bind(this));
        document.getElementById('signup-email').addEventListener('keypress', this.handleAuthKeyPress.bind(this));
        document.getElementById('signup-password').addEventListener('keypress', this.handleAuthKeyPress.bind(this));
    }
    
    setupUIEvents() {
        // Logout button
        document.getElementById('logout-btn').addEventListener('click', this.handleLogout.bind(this));
        
        // Modal background clicks
        document.addEventListener('click', (event) => {
            if (event.target.classList.contains('modal')) {
                event.target.classList.add('hidden');
            }
        });
        
        // Escape key to close modals
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.classList.add('hidden');
                });
            }
        });
        
        // Initialize Feather icons
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }
    
    async checkExistingSession() {
        if (window.firebaseManager && window.firebaseManager.currentUser) {
            // User already authenticated
            this.showApp();
            await this.loadUserData();
        } else if (!window.firebaseManager.auth) {
            // No Firebase configured, enable guest mode automatically
            window.firebaseManager.enableGuestMode();
            this.showApp();
            await this.loadUserData();
        } else {
            // No existing session, show auth modal
            this.showAuth();
        }
    }
    
    handleAuthKeyPress(event) {
        if (event.key === 'Enter') {
            const form = event.target.closest('.auth-form');
            if (form.id === 'login-form') {
                this.handleLogin();
            } else if (form.id === 'signup-form') {
                this.handleSignUp();
            }
        }
    }
    
    async handleLogin() {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        
        if (!email || !password) {
            this.showToast('Please enter email and password', 'error');
            return;
        }
        
        if (!this.isValidEmail(email)) {
            this.showToast('Please enter a valid email address', 'error');
            return;
        }
        
        try {
            this.showLoading();
            await window.firebaseManager.signIn(email, password);
            
            this.showToast('Welcome back!', 'success');
            this.showApp();
            await this.loadUserData();
            
        } catch (error) {
            console.error('Login error:', error);
            this.showToast(this.getAuthErrorMessage(error), 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    async handleSignUp() {
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;
        
        if (!email || !password) {
            this.showToast('Please enter email and password', 'error');
            return;
        }
        
        if (!this.isValidEmail(email)) {
            this.showToast('Please enter a valid email address', 'error');
            return;
        }
        
        if (password.length < 6) {
            this.showToast('Password must be at least 6 characters', 'error');
            return;
        }
        
        try {
            this.showLoading();
            await window.firebaseManager.signUp(email, password);
            
            this.showToast('Account created successfully!', 'success');
            this.showApp();
            await this.loadUserData();
            
        } catch (error) {
            console.error('Sign up error:', error);
            this.showToast(this.getAuthErrorMessage(error), 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    handleGuestMode() {
        window.firebaseManager.enableGuestMode();
        this.showToast('Continuing as guest', 'success');
        this.showApp();
        this.loadUserData();
    }
    
    async handleLogout() {
        try {
            await window.firebaseManager.signOut();
            this.showToast('Logged out successfully', 'success');
            this.showAuth();
        } catch (error) {
            console.error('Logout error:', error);
            this.showToast('Error logging out', 'error');
        }
    }
    
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    getAuthErrorMessage(error) {
        const errorMessages = {
            'auth/user-not-found': 'No account found with this email',
            'auth/wrong-password': 'Incorrect password',
            'auth/email-already-in-use': 'An account with this email already exists',
            'auth/weak-password': 'Password is too weak',
            'auth/invalid-email': 'Invalid email address',
            'auth/too-many-requests': 'Too many failed attempts. Please try again later',
            'auth/network-request-failed': 'Network error. Please check your connection'
        };
        
        return errorMessages[error.code] || error.message || 'Authentication failed';
    }
    
    showAuth() {
        document.getElementById('auth-modal').classList.remove('hidden');
        document.getElementById('app').classList.add('hidden');
        this.hideLoading();
    }
    
    showApp() {
        document.getElementById('auth-modal').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        this.hideLoading();
        
        // Initialize Feather icons in the app
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }
    
    showLoading() {
        document.getElementById('loading').classList.remove('hidden');
    }
    
    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
    }
    
    async loadUserData() {
        try {
            if (window.taskManager) {
                await window.taskManager.loadTasks();
            }
            
            // Update UI with user info
            if (window.firebaseManager.currentUser && !window.firebaseManager.isGuest) {
                document.getElementById('user-email').textContent = window.firebaseManager.currentUser.email;
            }
            
        } catch (error) {
            console.error('Error loading user data:', error);
            this.showToast('Error loading your data', 'error');
        }
    }
    
    showToast(message, type = 'info', duration = 4000) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        // Auto remove after duration
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.remove();
                    }
                }, 300);
            }
        }, duration);
        
        // Click to dismiss
        toast.addEventListener('click', () => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        });
    }
    
    // Keyboard shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            if (event.ctrlKey || event.metaKey) {
                switch (event.key) {
                    case 'n':
                        event.preventDefault();
                        if (window.taskManager) {
                            window.taskManager.showTaskModal();
                        }
                        break;
                    case 'm':
                        event.preventDefault();
                        if (window.audioManager) {
                            window.audioManager.toggle();
                        }
                        break;
                }
            }
        });
    }
    
    // Handle application lifecycle
    setupLifecycleEvents() {
        // Save data before page unload
        window.addEventListener('beforeunload', async () => {
            if (window.taskManager) {
                await window.taskManager.saveTasks();
            }
        });
        
        // Handle visibility changes (for battery optimization)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Pause animations when tab is hidden
                if (window.canvasAnimator) {
                    window.canvasAnimator.stopAnimation();
                }
            } else {
                // Resume animations when tab is visible
                if (window.canvasAnimator) {
                    window.canvasAnimator.startAnimation();
                }
            }
        });
        
        // Handle online/offline status
        window.addEventListener('online', () => {
            this.showToast('Connection restored', 'success');
            if (window.firebaseManager) {
                window.firebaseManager.syncTasks();
            }
        });
        
        window.addEventListener('offline', () => {
            this.showToast('Working offline', 'warning');
        });
    }
    
    // Performance monitoring
    measurePerformance() {
        if (typeof performance !== 'undefined' && performance.mark) {
            performance.mark('zenflow-app-start');
            
            window.addEventListener('load', () => {
                performance.mark('zenflow-app-loaded');
                performance.measure('zenflow-app-load-time', 'zenflow-app-start', 'zenflow-app-loaded');
                
                const measure = performance.getEntriesByName('zenflow-app-load-time')[0];
                if (measure && window.firebaseManager) {
                    window.firebaseManager.logAnalyticsEvent('app_performance', {
                        load_time: Math.round(measure.duration)
                    });
                }
            });
        }
    }
}

// Global toast function for other modules
window.showToast = (message, type = 'info', duration = 4000) => {
    if (window.zenFlowApp) {
        window.zenFlowApp.showToast(message, type, duration);
    } else {
        console.log(`Toast (${type}): ${message}`);
    }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.zenFlowApp = new ZenFlowApp();
    
    // Set up additional features
    window.zenFlowApp.setupKeyboardShortcuts();
    window.zenFlowApp.setupLifecycleEvents();
    window.zenFlowApp.measurePerformance();
});

// Service Worker registration for PWA capabilities (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Service worker can be added later for offline capabilities
        console.log('Service Worker support detected');
    });
}
