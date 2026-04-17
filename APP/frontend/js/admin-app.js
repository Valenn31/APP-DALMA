/**
 * Admin Panel - Coordinador principal (importa mÃ³dulos especializados)
 */
import { CONFIG, appState } from './admin/config.js';
import { ApiClient } from './admin/api-client.js';
import { AuthManager } from './admin/auth-manager.js';
import { NotificationManager } from './admin/notification.js';
import { SidebarManager } from './admin/sidebar.js';
import { DashboardSection } from './admin/sections/dashboard.js';
import { ProductsSection } from './admin/sections/products.js';

class AdminApp {
    constructor() {
        this.api = new ApiClient();
        this.auth = new AuthManager();
        this.notify = new NotificationManager();
        this.sidebar = new SidebarManager();
        this.dashboard = new DashboardSection(this.api);
        this.products = new ProductsSection(this.api, this.notify);

        this.initializeApp();
        this.setupEventListeners();
    }

    async initializeApp() {
        const restored = await this.auth.tryRestoreSession();
        if (restored) {
            this.showAdminPanel();
            return;
        }
        
        this.showLoginScreen();
    }

    setupEventListeners() {
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
        
        document.getElementById('togglePassword').addEventListener('click', () => {
            const input = document.getElementById('password');
            const icon = document.querySelector('#togglePassword i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.className = 'fas fa-eye-slash text-gray-400 hover:text-gray-600';
            } else {
                input.type = 'password';
                icon.className = 'fas fa-eye text-gray-400 hover:text-gray-600';
            }
        });
        
        document.getElementById('userMenuButton').addEventListener('click', () => {
            document.getElementById('userDropdown').classList.toggle('hidden');
        });
        
        document.getElementById('logoutButton').addEventListener('click', () => this.handleLogout());
        
        document.getElementById('changePasswordBtn').addEventListener('click', () => {
            this.notify.show('FunciÃ³n prÃ³ximamente', 'Cambio de contraseÃ±a estarÃ¡ disponible pronto', 'info');
        });
        
        document.querySelectorAll('.sidebar-item[data-section]').forEach(item => {
            item.addEventListener('click', () => {
                this.navigateToSection(item.getAttribute('data-section'));
                if (window.innerWidth < 1024) this.sidebar.close();
            });
        });
        
        document.getElementById('sidebarToggle').addEventListener('click', () => this.sidebar.toggle());
        document.getElementById('sidebarOverlay').addEventListener('click', () => this.sidebar.close());
        document.getElementById('sidebarClose').addEventListener('click', () => this.sidebar.close());
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#userMenuButton')) {
                document.getElementById('userDropdown').classList.add('hidden');
            }
        });
        
        document.getElementById('toastClose').addEventListener('click', () => this.notify.hide());
        window.addEventListener('resize', () => this.sidebar.handleResize());
        window.addEventListener('auth:expired', () => this.handleLogout());
        window.addEventListener('products:refresh', () => this.navigateToSection('products'));
    }

    async handleLogin() {
        const success = await this.auth.handleLogin();
        if (success) {
            this.notify.show('Â¡Bienvenido!', 'Login exitoso', 'success');
            this.showAdminPanel();
        }
    }

    async handleLogout() {
        await this.auth.handleLogout();
        this.notify.show('SesiÃ³n cerrada', 'Has cerrado sesiÃ³n correctamente', 'info');
        this.showLoginScreen();
    }

    showLoginScreen() {
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('adminPanel').classList.add('hidden');
        document.getElementById('loginForm').reset();
        this.auth.hideLoginError();
    }

    showAdminPanel() {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('adminPanel').classList.remove('hidden');
        document.getElementById('userDisplayName').textContent = appState.user.username;
        this.navigateToSection('dashboard');
    }

    async navigateToSection(sectionName) {
        appState.currentSection = sectionName;
        
        document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
        const activeItem = document.querySelector(`.sidebar-item[data-section="${sectionName}"]`);
        if (activeItem) activeItem.classList.add('active');
        
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = '<div class="flex items-center justify-center py-12"><div class="loader"></div></div>';
        
        try {
            let content = '';
            switch (sectionName) {
                case 'dashboard':
                    content = await this.dashboard.render();
                    break;
                case 'products':
                    content = await this.products.render();
                    break;
                case 'stock':
                    content = '<div class="text-center py-12"><h2 class="text-2xl font-bold text-gray-600">SecciÃ³n de Stock</h2><p class="text-gray-500 mt-2">En desarrollo...</p></div>';
                    break;
                case 'config':
                    content = '<div class="text-center py-12"><h2 class="text-2xl font-bold text-gray-600">SecciÃ³n de ConfiguraciÃ³n</h2><p class="text-gray-500 mt-2">En desarrollo...</p></div>';
                    break;
                default:
                    content = '<div class="text-center py-12"><h2 class="text-2xl font-bold text-gray-600">SecciÃ³n en desarrollo</h2></div>';
            }
            
            mainContent.innerHTML = content;
            
            if (sectionName === 'products') {
                this.products.initializeEvents();
            }
        } catch (error) {
            console.error(`Error cargando secciÃ³n ${sectionName}:`, error);
            mainContent.innerHTML = `
                <div class="text-center py-12">
                    <div class="text-red-500 text-6xl mb-4"><i class="fas fa-exclamation-triangle"></i></div>
                    <h2 class="text-2xl font-bold text-gray-600 mb-2">Error al cargar la secciÃ³n</h2>
                    <p class="text-gray-500">Por favor, intÃ©ntelo nuevamente</p>
                    <button onclick="location.reload()" class="mt-4 bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90">Recargar</button>
                </div>
            `;
        }
    }

    async editProduct(productId) {
        await this.products.edit(productId);
    }

    async toggleProductStatus(productId) {
        const success = await this.products.toggleStatus(productId);
        if (success) this.navigateToSection('products');
    }

    async deleteProduct(productId) {
        const success = await this.products.delete(productId);
        if (success) this.navigateToSection('products');
    }
}

let adminApp;
document.addEventListener('DOMContentLoaded', () => {
    adminApp = new AdminApp();
    window.adminApp = adminApp;
});
