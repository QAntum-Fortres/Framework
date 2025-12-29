/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║  TRAINING FRAMEWORK - Step 9/50: Reusable Components Library                  ║
 * ║  Part of: Phase 1 - Enterprise Foundation                                     ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 * 
 * @description Reusable component library for UI and automation
 * @phase 1 - Enterprise Foundation
 * @step 9 of 50
 */

'use strict';

const EventEmitter = require('events');
const { BaseComponent, BaseElement, LocatorFactory } = require('./pom-base');

// ═══════════════════════════════════════════════════════════════════════════════
// FORM COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * InputComponent - Text input handling
 */
class InputComponent extends BaseComponent {
    constructor(options = {}) {
        super(options);
        
        this.inputType = options.inputType || 'text';
        this.clearBeforeType = options.clearBeforeType !== false;
    }

    _defineElements() {
        this.element('input', this.rootLocator || LocatorFactory.css('input'));
        this.element('label', LocatorFactory.css('label'));
        this.element('error', LocatorFactory.css('.error, .error-message'));
        this.element('helper', LocatorFactory.css('.helper-text'));
    }

    async getValue() {
        return 'simulated value';
    }

    async setValue(value) {
        if (this.clearBeforeType) {
            await this.clear();
        }
        // Type value
        this.emit('value:changed', { value });
        return this;
    }

    async clear() {
        // Clear input
        this.emit('value:cleared');
        return this;
    }

    async getError() {
        return null; // Return error text if present
    }

    async isValid() {
        const error = await this.getError();
        return !error;
    }
}

/**
 * SelectComponent - Dropdown/Select handling
 */
class SelectComponent extends BaseComponent {
    constructor(options = {}) {
        super(options);
        
        this.multiSelect = options.multiSelect || false;
    }

    _defineElements() {
        this.element('trigger', LocatorFactory.css('.select-trigger, select'));
        this.element('options', LocatorFactory.css('.option, option'));
        this.element('selectedOption', LocatorFactory.css('.selected, option:checked'));
    }

    async selectByValue(value) {
        this.emit('option:selected', { value, by: 'value' });
        return this;
    }

    async selectByText(text) {
        this.emit('option:selected', { text, by: 'text' });
        return this;
    }

    async selectByIndex(index) {
        this.emit('option:selected', { index, by: 'index' });
        return this;
    }

    async getSelectedValue() {
        return 'selected-value';
    }

    async getSelectedText() {
        return 'Selected Text';
    }

    async getOptions() {
        return [
            { value: 'opt1', text: 'Option 1' },
            { value: 'opt2', text: 'Option 2' }
        ];
    }
}

/**
 * CheckboxComponent - Checkbox handling
 */
class CheckboxComponent extends BaseComponent {
    _defineElements() {
        this.element('checkbox', this.rootLocator || LocatorFactory.css('input[type="checkbox"]'));
        this.element('label', LocatorFactory.css('label'));
    }

    async isChecked() {
        return false;
    }

    async check() {
        if (!(await this.isChecked())) {
            // Click to check
            this.emit('checked');
        }
        return this;
    }

    async uncheck() {
        if (await this.isChecked()) {
            // Click to uncheck
            this.emit('unchecked');
        }
        return this;
    }

    async toggle() {
        // Click to toggle
        this.emit('toggled');
        return this;
    }
}

/**
 * RadioGroupComponent - Radio button group
 */
class RadioGroupComponent extends BaseComponent {
    _defineElements() {
        this.element('radios', LocatorFactory.css('input[type="radio"]'));
        this.element('labels', LocatorFactory.css('label'));
    }

    async selectByValue(value) {
        this.emit('selected', { value });
        return this;
    }

    async getSelectedValue() {
        return 'selected-radio-value';
    }

    async getOptions() {
        return [
            { value: 'radio1', label: 'Option 1', checked: false },
            { value: 'radio2', label: 'Option 2', checked: true }
        ];
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATA DISPLAY COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * TableComponent - Data table handling
 */
class TableComponent extends BaseComponent {
    constructor(options = {}) {
        super(options);
        
        this.headers = [];
        this.sortable = options.sortable || false;
        this.paginated = options.paginated || false;
    }

    _defineElements() {
        this.element('table', this.rootLocator || LocatorFactory.css('table'));
        this.element('headers', LocatorFactory.css('th, thead td'));
        this.element('rows', LocatorFactory.css('tbody tr'));
        this.element('cells', LocatorFactory.css('td'));
        this.element('pagination', LocatorFactory.css('.pagination'));
    }

    async getHeaders() {
        return ['Column 1', 'Column 2', 'Column 3'];
    }

    async getRowCount() {
        return 10;
    }

    async getRow(index) {
        return {
            index,
            cells: ['Cell 1', 'Cell 2', 'Cell 3']
        };
    }

    async getAllRows() {
        const count = await this.getRowCount();
        const rows = [];
        
        for (let i = 0; i < count; i++) {
            rows.push(await this.getRow(i));
        }
        
        return rows;
    }

    async getCell(rowIndex, colIndex) {
        const row = await this.getRow(rowIndex);
        return row.cells[colIndex];
    }

    async getCellByHeader(rowIndex, headerName) {
        const headers = await this.getHeaders();
        const colIndex = headers.indexOf(headerName);
        
        if (colIndex === -1) {
            throw new Error(`Header not found: ${headerName}`);
        }
        
        return this.getCell(rowIndex, colIndex);
    }

    async sortBy(column, direction = 'asc') {
        if (!this.sortable) {
            throw new Error('Table is not sortable');
        }
        
        this.emit('sorted', { column, direction });
        return this;
    }

    async goToPage(page) {
        if (!this.paginated) {
            throw new Error('Table is not paginated');
        }
        
        this.emit('page:changed', { page });
        return this;
    }

    async search(query) {
        this.emit('searched', { query });
        return this;
    }

    async filter(filters) {
        this.emit('filtered', { filters });
        return this;
    }
}

/**
 * ListComponent - List handling
 */
class ListComponent extends BaseComponent {
    _defineElements() {
        this.element('list', this.rootLocator || LocatorFactory.css('ul, ol'));
        this.element('items', LocatorFactory.css('li'));
    }

    async getItems() {
        return ['Item 1', 'Item 2', 'Item 3'];
    }

    async getItemCount() {
        return (await this.getItems()).length;
    }

    async getItem(index) {
        const items = await this.getItems();
        return items[index];
    }

    async clickItem(index) {
        this.emit('item:clicked', { index });
        return this;
    }

    async findItem(text) {
        const items = await this.getItems();
        return items.findIndex(item => item.includes(text));
    }
}

/**
 * CardComponent - Card/tile handling
 */
class CardComponent extends BaseComponent {
    _defineElements() {
        this.element('card', this.rootLocator || LocatorFactory.css('.card'));
        this.element('title', LocatorFactory.css('.card-title, h3, h4'));
        this.element('content', LocatorFactory.css('.card-content, .card-body'));
        this.element('actions', LocatorFactory.css('.card-actions, .card-footer'));
        this.element('image', LocatorFactory.css('.card-image, img'));
    }

    async getTitle() {
        return 'Card Title';
    }

    async getContent() {
        return 'Card content text';
    }

    async clickAction(actionName) {
        this.emit('action:clicked', { actionName });
        return this;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// NAVIGATION COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * NavbarComponent - Navigation bar
 */
class NavbarComponent extends BaseComponent {
    _defineElements() {
        this.element('navbar', this.rootLocator || LocatorFactory.css('nav, .navbar'));
        this.element('brand', LocatorFactory.css('.navbar-brand, .logo'));
        this.element('links', LocatorFactory.css('.nav-link, a'));
        this.element('toggle', LocatorFactory.css('.navbar-toggle, .hamburger'));
    }

    async getLinks() {
        return [
            { text: 'Home', href: '/' },
            { text: 'About', href: '/about' },
            { text: 'Contact', href: '/contact' }
        ];
    }

    async clickLink(text) {
        this.emit('link:clicked', { text });
        return this;
    }

    async isExpanded() {
        return true;
    }

    async toggle() {
        this.emit('toggled');
        return this;
    }
}

/**
 * BreadcrumbComponent - Breadcrumb navigation
 */
class BreadcrumbComponent extends BaseComponent {
    _defineElements() {
        this.element('breadcrumb', this.rootLocator || LocatorFactory.css('.breadcrumb, nav[aria-label="breadcrumb"]'));
        this.element('items', LocatorFactory.css('.breadcrumb-item, li'));
    }

    async getPath() {
        return ['Home', 'Category', 'Current Page'];
    }

    async clickLevel(index) {
        this.emit('level:clicked', { index });
        return this;
    }

    async getCurrentPage() {
        const path = await this.getPath();
        return path[path.length - 1];
    }
}

/**
 * TabsComponent - Tab navigation
 */
class TabsComponent extends BaseComponent {
    _defineElements() {
        this.element('tabList', this.rootLocator || LocatorFactory.css('.tabs, [role="tablist"]'));
        this.element('tabs', LocatorFactory.css('.tab, [role="tab"]'));
        this.element('activeTab', LocatorFactory.css('.tab.active, [aria-selected="true"]'));
        this.element('panels', LocatorFactory.css('.tab-panel, [role="tabpanel"]'));
    }

    async getTabs() {
        return ['Tab 1', 'Tab 2', 'Tab 3'];
    }

    async getActiveTab() {
        return 'Tab 1';
    }

    async selectTab(identifier) {
        this.emit('tab:selected', { identifier });
        return this;
    }

    async selectTabByIndex(index) {
        return this.selectTab({ index });
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FEEDBACK COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ModalComponent - Modal/Dialog handling
 */
class ModalComponent extends BaseComponent {
    _defineElements() {
        this.element('modal', this.rootLocator || LocatorFactory.css('.modal, [role="dialog"]'));
        this.element('backdrop', LocatorFactory.css('.modal-backdrop, .overlay'));
        this.element('title', LocatorFactory.css('.modal-title, h2'));
        this.element('content', LocatorFactory.css('.modal-content, .modal-body'));
        this.element('closeButton', LocatorFactory.css('.close, [aria-label="close"]'));
        this.element('confirmButton', LocatorFactory.css('.btn-primary, .confirm'));
        this.element('cancelButton', LocatorFactory.css('.btn-secondary, .cancel'));
    }

    async isOpen() {
        return false;
    }

    async waitForOpen(timeout = 5000) {
        // Wait for modal to be visible
        return this;
    }

    async getTitle() {
        return 'Modal Title';
    }

    async close() {
        this.emit('closed');
        return this;
    }

    async confirm() {
        this.emit('confirmed');
        return this;
    }

    async cancel() {
        this.emit('cancelled');
        return this;
    }
}

/**
 * ToastComponent - Toast/Notification handling
 */
class ToastComponent extends BaseComponent {
    _defineElements() {
        this.element('toast', this.rootLocator || LocatorFactory.css('.toast, .notification'));
        this.element('message', LocatorFactory.css('.toast-message, .notification-text'));
        this.element('closeButton', LocatorFactory.css('.close, .dismiss'));
    }

    async getMessage() {
        return 'Toast message';
    }

    async getType() {
        return 'success'; // success, error, warning, info
    }

    async dismiss() {
        this.emit('dismissed');
        return this;
    }

    async waitForDismiss(timeout = 10000) {
        // Wait for toast to auto-dismiss
        return this;
    }
}

/**
 * AlertComponent - Alert/Banner handling
 */
class AlertComponent extends BaseComponent {
    _defineElements() {
        this.element('alert', this.rootLocator || LocatorFactory.css('.alert, [role="alert"]'));
        this.element('message', LocatorFactory.css('.alert-message'));
        this.element('closeButton', LocatorFactory.css('.close, .dismiss'));
        this.element('actionLink', LocatorFactory.css('.alert-action, a'));
    }

    async getMessage() {
        return 'Alert message';
    }

    async getType() {
        return 'info'; // success, error, warning, info
    }

    async dismiss() {
        this.emit('dismissed');
        return this;
    }

    async clickAction() {
        this.emit('action:clicked');
        return this;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOADING COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * SpinnerComponent - Loading spinner
 */
class SpinnerComponent extends BaseComponent {
    _defineElements() {
        this.element('spinner', this.rootLocator || LocatorFactory.css('.spinner, .loading'));
    }

    async isLoading() {
        return false;
    }

    async waitForComplete(timeout = 30000) {
        // Wait until spinner disappears
        return this;
    }
}

/**
 * ProgressComponent - Progress bar
 */
class ProgressComponent extends BaseComponent {
    _defineElements() {
        this.element('progress', this.rootLocator || LocatorFactory.css('.progress, progress'));
        this.element('bar', LocatorFactory.css('.progress-bar'));
        this.element('label', LocatorFactory.css('.progress-label'));
    }

    async getValue() {
        return 50; // 0-100
    }

    async getLabel() {
        return '50%';
    }

    async waitForComplete(timeout = 60000) {
        // Wait until progress reaches 100
        return this;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT REGISTRY
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ComponentRegistry - Register and create components
 */
class ComponentRegistry {
    constructor() {
        this.components = new Map();
        
        // Register built-in components
        this._registerBuiltIn();
    }

    _registerBuiltIn() {
        const builtIn = {
            // Form
            Input: InputComponent,
            Select: SelectComponent,
            Checkbox: CheckboxComponent,
            RadioGroup: RadioGroupComponent,
            
            // Data Display
            Table: TableComponent,
            List: ListComponent,
            Card: CardComponent,
            
            // Navigation
            Navbar: NavbarComponent,
            Breadcrumb: BreadcrumbComponent,
            Tabs: TabsComponent,
            
            // Feedback
            Modal: ModalComponent,
            Toast: ToastComponent,
            Alert: AlertComponent,
            
            // Loading
            Spinner: SpinnerComponent,
            Progress: ProgressComponent
        };
        
        for (const [name, ComponentClass] of Object.entries(builtIn)) {
            this.register(name, ComponentClass);
        }
    }

    register(name, ComponentClass) {
        this.components.set(name, ComponentClass);
        return this;
    }

    create(name, options = {}) {
        const ComponentClass = this.components.get(name);
        
        if (!ComponentClass) {
            throw new Error(`Component not found: ${name}`);
        }
        
        return new ComponentClass(options);
    }

    has(name) {
        return this.components.has(name);
    }

    list() {
        return Array.from(this.components.keys());
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

// Singleton registry
let registryInstance = null;

module.exports = {
    // Form Components
    InputComponent,
    SelectComponent,
    CheckboxComponent,
    RadioGroupComponent,
    
    // Data Display
    TableComponent,
    ListComponent,
    CardComponent,
    
    // Navigation
    NavbarComponent,
    BreadcrumbComponent,
    TabsComponent,
    
    // Feedback
    ModalComponent,
    ToastComponent,
    AlertComponent,
    
    // Loading
    SpinnerComponent,
    ProgressComponent,
    
    // Registry
    ComponentRegistry,
    
    // Factory
    getRegistry: () => {
        if (!registryInstance) {
            registryInstance = new ComponentRegistry();
        }
        return registryInstance;
    },
    
    createComponent: (name, options) => {
        const registry = module.exports.getRegistry();
        return registry.create(name, options);
    }
};

console.log('✅ Step 9/50: Reusable Components Library loaded');
