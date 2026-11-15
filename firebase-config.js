// Firebase configuration and initialization
class FirebaseManager {
    constructor() {
        this.app = null;
        this.auth = null;
        this.database = null;
        this.analytics = null;
        this.currentUser = null;
        this.isGuest = false;
        
        this.initializeFirebase();
        this.setupAuthListener();
    }
    
    initializeFirebase() {
        // Firebase configuration using environment variables
        const apiKey = this.getEnvVar('VITE_FIREBASE_API_KEY', 'demo-mode');
        const projectId = this.getEnvVar('VITE_FIREBASE_PROJECT_ID', 'zen-flow-demo');
        const appId = this.getEnvVar('VITE_FIREBASE_APP_ID', 'demo-mode');
        
        // Check if we have real Firebase credentials or are in demo mode
        const isDemoMode = apiKey === 'demo-mode' || projectId === 'zen-flow-demo' || appId === 'demo-mode';
        
        if (isDemoMode) {
            console.log('Running in demo mode - using local storage only');
            this.showToast('Running in demo mode. Sign up for Firebase to sync across devices.', 'info');
            return;
        }
        
        const firebaseConfig = {
            apiKey: apiKey,
            authDomain: `${projectId}.firebaseapp.com`,
            databaseURL: `https://${projectId}-default-rtdb.firebaseio.com/`,
            projectId: projectId,
            storageBucket: `${projectId}.appspot.com`,
            messagingSenderId: this.getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID', '123456789'),
            appId: appId,
            measurementId: this.getEnvVar('VITE_FIREBASE_MEASUREMENT_ID', 'G-XXXXXXXXXX')
        };
        
        try {
            // Initialize Firebase
            this.app = firebase.initializeApp(firebaseConfig);
            this.auth = firebase.auth();
            this.database = firebase.database();
            
            // Initialize Analytics if available
            if (typeof firebase.analytics === 'function') {
                this.analytics = firebase.analytics();
            }
            
            console.log('Firebase initialized successfully');
        } catch (error) {
            console.error('Firebase initialization error:', error);
            this.showToast('Firebase configuration error. Using offline mode.', 'warning');
        }
    }
    
    getEnvVar(name, defaultValue) {
        // Try different ways to get environment variables
        if (typeof process !== 'undefined' && process.env) {
            return process.env[name] || defaultValue;
        }
        
        // For client-side, check if variables are injected globally
        if (typeof window !== 'undefined' && window.ENV) {
            return window.ENV[name] || defaultValue;
        }
        
        // Check for environment variables in global scope
        if (typeof window !== 'undefined' && window[name]) {
            return window[name];
        }
        
        return defaultValue;
    }
    
    setupAuthListener() {
        if (!this.auth) return;
        
        this.auth.onAuthStateChanged((user) => {
            this.currentUser = user;
            
            if (user && !this.isGuest) {
                console.log('User signed in:', user.email);
                this.logAnalyticsEvent('login', { method: 'email' });
                document.getElementById('user-email').textContent = user.email;
                this.syncTasks();
            } else if (!this.isGuest) {
                console.log('User signed out');
                this.currentUser = null;
                document.getElementById('user-email').textContent = '';
            }
        });
    }
    
    async signUp(email, password) {
        if (!this.auth) {
            throw new Error('Firebase not initialized');
        }
        
        try {
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            this.logAnalyticsEvent('sign_up', { method: 'email' });
            return userCredential.user;
        } catch (error) {
            console.error('Sign up error:', error);
            throw error;
        }
    }
    
    async signIn(email, password) {
        if (!this.auth) {
            throw new Error('Firebase not initialized');
        }
        
        try {
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            return userCredential.user;
        } catch (error) {
            console.error('Sign in error:', error);
            throw error;
        }
    }
    
    async signOut() {
        if (!this.auth || this.isGuest) return;
        
        try {
            await this.auth.signOut();
            this.logAnalyticsEvent('logout');
        } catch (error) {
            console.error('Sign out error:', error);
            throw error;
        }
    }
    
    enableGuestMode() {
        this.isGuest = true;
        this.currentUser = { uid: 'guest', email: 'guest@local' };
        document.getElementById('user-email').textContent = 'Guest Mode';
        console.log('Guest mode enabled');
    }
    
    async saveTasks(tasks) {
        if (!this.currentUser || this.isGuest) {
            // Save to localStorage for guests
            localStorage.setItem('zenflow_tasks', JSON.stringify(tasks));
            return;
        }
        
        if (!this.database) {
            console.warn('Database not available, saving to localStorage');
            localStorage.setItem('zenflow_tasks', JSON.stringify(tasks));
            return;
        }
        
        try {
            await this.database.ref(`users/${this.currentUser.uid}/tasks`).set(tasks);
            console.log('Tasks saved to Firebase');
        } catch (error) {
            console.error('Error saving tasks to Firebase:', error);
            // Fallback to localStorage
            localStorage.setItem('zenflow_tasks', JSON.stringify(tasks));
        }
    }
    
    async loadTasks() {
        if (!this.currentUser || this.isGuest) {
            // Load from localStorage for guests
            const tasks = localStorage.getItem('zenflow_tasks');
            return tasks ? JSON.parse(tasks) : this.getDefaultTasks();
        }
        
        if (!this.database) {
            console.warn('Database not available, loading from localStorage');
            const tasks = localStorage.getItem('zenflow_tasks');
            return tasks ? JSON.parse(tasks) : this.getDefaultTasks();
        }
        
        try {
            const snapshot = await this.database.ref(`users/${this.currentUser.uid}/tasks`).once('value');
            const tasks = snapshot.val();
            return tasks || this.getDefaultTasks();
        } catch (error) {
            console.error('Error loading tasks from Firebase:', error);
            // Fallback to localStorage
            const tasks = localStorage.getItem('zenflow_tasks');
            return tasks ? JSON.parse(tasks) : this.getDefaultTasks();
        }
    }
    
    getDefaultTasks() {
        return {
            backlog: [
                {
                    id: 'demo_task_1',
                    description: 'Plan vacation to Japan',
                    importance: 'medium',
                    createdAt: new Date(Date.now() - 86400000).toISOString(),
                    dueDate: null,
                    completedAt: null
                },
                {
                    id: 'demo_task_2',
                    description: 'Learn meditation techniques',
                    importance: 'low',
                    createdAt: new Date(Date.now() - 172800000).toISOString(),
                    dueDate: null,
                    completedAt: null
                },
                {
                    id: 'demo_task_3',
                    description: 'Organize workspace',
                    importance: 'high',
                    createdAt: new Date(Date.now() - 259200000).toISOString(),
                    dueDate: new Date(Date.now() + 604800000).toISOString().split('T')[0],
                    completedAt: null
                }
            ],
            next: [
                {
                    id: 'demo_task_4',
                    description: 'Review quarterly goals',
                    importance: 'high',
                    createdAt: new Date(Date.now() - 345600000).toISOString(),
                    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                    completedAt: null
                }
            ],
            progress: [
                {
                    id: 'demo_task_5',
                    description: 'Build zen task manager',
                    importance: 'high',
                    createdAt: new Date(Date.now() - 432000000).toISOString(),
                    dueDate: null,
                    completedAt: null
                }
            ],
            completed: [
                {
                    id: 'demo_task_6',
                    description: 'Set up development environment',
                    importance: 'medium',
                    createdAt: new Date(Date.now() - 518400000).toISOString(),
                    dueDate: null,
                    completedAt: new Date(Date.now() - 86400000).toISOString()
                }
            ]
        };
    }
    
    async syncTasks() {
        if (window.taskManager) {
            try {
                const tasks = await this.loadTasks();
                window.taskManager.loadTasks(tasks);
                console.log('Tasks synced from cloud');
            } catch (error) {
                console.error('Error syncing tasks:', error);
            }
        }
    }
    
    logAnalyticsEvent(eventName, parameters = {}) {
        if (this.analytics) {
            try {
                this.analytics.logEvent(eventName, parameters);
            } catch (error) {
                console.warn('Analytics error:', error);
            }
        }
    }
    
    showToast(message, type = 'info') {
        if (window.showToast) {
            window.showToast(message, type);
        } else {
            console.log(`Toast (${type}): ${message}`);
        }
    }
}

// Global Firebase manager instance
window.firebaseManager = new FirebaseManager();
