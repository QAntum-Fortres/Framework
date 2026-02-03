/**
 * ═══════════════════════════════════════════════════════════════════════════
 * UNIT TESTS - Phase 1 Architecture Modules
 * Tests for: pom-base.js, interfaces.js, components.js
 * Steps: 7, 8, 9 of 50
 * ═══════════════════════════════════════════════════════════════════════════
 */

const assert = require('assert');

// ═══════════════════════════════════════════════════════════════════════════
// TEST UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

let testsPassed = 0;
let testsFailed = 0;
const testResults = [];

function test(name, fn) {
    try {
        fn();
        testsPassed++;
        testResults.push({ name, status: 'PASS' });
        console.log(`  ✅ ${name}`);
    } catch (error) {
        testsFailed++;
        testResults.push({ name, status: 'FAIL', error: error.message });
        console.log(`  ❌ ${name}: ${error.message}`);
    }
}

function describe(suiteName, fn) {
    console.log(`\n📦 ${suiteName}`);
    console.log('─'.repeat(50));
    fn();
}

// ═══════════════════════════════════════════════════════════════════════════
// TESTS: pom-base.js (Step 7)
// ═══════════════════════════════════════════════════════════════════════════

describe('POM Base Architecture (Step 7)', () => {
    const { 
        BaseElement, 
        BasePage, 
        BaseComponent, 
        LocatorFactory, 
        PageFactory,
        By 
    } = require('../../architecture/pom-base');

    // BaseElement Tests
    test('BaseElement should exist', () => {
        assert.ok(BaseElement);
    });

    test('BaseElement should be constructable', () => {
        const element = new BaseElement({ type: 'css', value: '.test' });
        assert.ok(element);
    });

    test('BaseElement should have locator property', () => {
        const locator = { type: 'css', value: '.test' };
        const element = new BaseElement(locator);
        assert.deepStrictEqual(element.locator, locator);
    });

    test('BaseElement should have addAlternative method', () => {
        const element = new BaseElement({ type: 'css', value: '.test' });
        assert.strictEqual(typeof element.addAlternative, 'function');
    });

    test('BaseElement should support self-healing locators', () => {
        const element = new BaseElement({ type: 'css', value: '.primary' });
        element.addAlternative({ type: 'xpath', value: '//div[@class="backup"]' }, 50);
        const locators = element.getAllLocators();
        assert.strictEqual(locators.length, 2);
    });

    // BasePage Tests
    test('BasePage should exist', () => {
        assert.ok(BasePage);
    });

    test('BasePage should be constructable', () => {
        const page = new BasePage({ name: 'TestPage', url: '/test' });
        assert.ok(page);
    });

    test('BasePage should have element method', () => {
        const page = new BasePage({ name: 'TestPage' });
        assert.strictEqual(typeof page.element, 'function');
    });

    test('BasePage should have navigate method', () => {
        const page = new BasePage({ name: 'TestPage', url: '/test' });
        assert.strictEqual(typeof page.navigate, 'function');
    });

    // BaseComponent Tests
    test('BaseComponent should exist', () => {
        assert.ok(BaseComponent);
    });

    test('BaseComponent should be constructable', () => {
        const component = new BaseComponent({ name: 'TestComponent' });
        assert.ok(component);
    });

    // LocatorFactory Tests
    test('LocatorFactory should exist', () => {
        assert.ok(LocatorFactory);
    });

    test('LocatorFactory should have css method', () => {
        assert.strictEqual(typeof LocatorFactory.css, 'function');
    });

    test('LocatorFactory.css should create CSS locator', () => {
        const locator = LocatorFactory.css('.my-class');
        assert.strictEqual(locator.type, 'css');
        assert.strictEqual(locator.selector, '.my-class');
    });

    test('LocatorFactory should have xpath method', () => {
        assert.strictEqual(typeof LocatorFactory.xpath, 'function');
    });

    test('LocatorFactory.xpath should create XPath locator', () => {
        const locator = LocatorFactory.xpath('//div[@id="test"]');
        assert.strictEqual(locator.type, 'xpath');
    });

    test('LocatorFactory should have id method', () => {
        const locator = LocatorFactory.id('my-id');
        assert.strictEqual(locator.type, 'id');
        assert.strictEqual(locator.id, 'my-id');
    });

    test('By should be alias for LocatorFactory', () => {
        assert.strictEqual(By, LocatorFactory);
    });

    // PageFactory Tests
    test('PageFactory should exist', () => {
        assert.ok(PageFactory);
    });

    test('PageFactory should be constructable', () => {
        const factory = new PageFactory();
        assert.ok(factory);
    });

    test('PageFactory should have register method', () => {
        const factory = new PageFactory();
        assert.strictEqual(typeof factory.register, 'function');
    });

    test('PageFactory should have get method', () => {
        const factory = new PageFactory();
        assert.strictEqual(typeof factory.get, 'function');
    });

    test('PageFactory should register and retrieve pages', () => {
        const factory = new PageFactory();
        factory.register('login', BasePage);
        const page = factory.get('login', { name: 'LoginPage' });
        assert.ok(page);
        assert.ok(page instanceof BasePage);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// TESTS: interfaces.js (Step 8)
// ═══════════════════════════════════════════════════════════════════════════

describe('Interface Standardization (Step 8)', () => {
    const {
        InterfaceValidator,
        InterfaceFactory,
        IDriver,
        IElement,
        IModel,
        IDataSource,
        ILogger,
        ICache,
        IQueue,
        IReporter,
        IAgent,
        IOrchestrator,
        ObservableMixin,
        SerializableMixin,
        LifecycleMixin,
        Implements,
        Contract,
        getFactory
    } = require('../../architecture/interfaces');

    // InterfaceValidator Tests
    test('InterfaceValidator should exist', () => {
        assert.ok(InterfaceValidator);
    });

    test('InterfaceValidator should have validate method', () => {
        assert.strictEqual(typeof InterfaceValidator.validate, 'function');
    });

    test('InterfaceValidator should have assert method', () => {
        assert.strictEqual(typeof InterfaceValidator.assert, 'function');
    });

    test('InterfaceValidator.validate should return validation result', () => {
        const mockImpl = {
            navigate: () => {},
            getCurrentUrl: () => {},
            getTitle: () => {},
            findElement: () => {},
            findElements: () => {},
            executeScript: () => {},
            screenshot: () => {},
            quit: () => {},
            capabilities: {}
        };
        const result = InterfaceValidator.validate(mockImpl, IDriver);
        assert.ok('valid' in result);
        assert.ok('errors' in result);
    });

    // Interface Definitions Tests
    test('IDriver interface should exist', () => {
        assert.ok(IDriver);
        assert.strictEqual(IDriver.name, 'IDriver');
    });

    test('IElement interface should exist', () => {
        assert.ok(IElement);
        assert.strictEqual(IElement.name, 'IElement');
    });

    test('IModel interface should exist', () => {
        assert.ok(IModel);
        assert.strictEqual(IModel.name, 'IModel');
    });

    test('IDataSource interface should exist', () => {
        assert.ok(IDataSource);
        assert.strictEqual(IDataSource.name, 'IDataSource');
    });

    test('ILogger interface should exist', () => {
        assert.ok(ILogger);
        assert.strictEqual(ILogger.name, 'ILogger');
    });

    test('ICache interface should exist', () => {
        assert.ok(ICache);
        assert.strictEqual(ICache.name, 'ICache');
    });

    test('IQueue interface should exist', () => {
        assert.ok(IQueue);
        assert.strictEqual(IQueue.name, 'IQueue');
    });

    test('IReporter interface should exist', () => {
        assert.ok(IReporter);
        assert.strictEqual(IReporter.name, 'IReporter');
    });

    test('IAgent interface should exist', () => {
        assert.ok(IAgent);
        assert.strictEqual(IAgent.name, 'IAgent');
    });

    test('IOrchestrator interface should exist', () => {
        assert.ok(IOrchestrator);
        assert.strictEqual(IOrchestrator.name, 'IOrchestrator');
    });

    // Mixins Tests
    test('ObservableMixin should exist', () => {
        assert.ok(ObservableMixin);
    });

    test('SerializableMixin should exist', () => {
        assert.ok(SerializableMixin);
    });

    test('LifecycleMixin should exist', () => {
        assert.ok(LifecycleMixin);
    });

    // Decorators Tests
    test('Implements decorator should exist', () => {
        assert.ok(Implements);
        assert.strictEqual(typeof Implements, 'function');
    });

    test('Contract decorator should exist', () => {
        assert.ok(Contract);
        assert.strictEqual(typeof Contract, 'function');
    });

    // InterfaceFactory Tests
    test('InterfaceFactory should exist', () => {
        assert.ok(InterfaceFactory);
    });

    test('getFactory should return singleton', () => {
        const factory1 = getFactory();
        const factory2 = getFactory();
        assert.strictEqual(factory1, factory2);
    });

    test('InterfaceFactory should have registerInterface method', () => {
        const factory = new InterfaceFactory();
        assert.strictEqual(typeof factory.registerInterface, 'function');
    });

    test('InterfaceFactory should have getInterface method', () => {
        const factory = new InterfaceFactory();
        assert.strictEqual(typeof factory.getInterface, 'function');
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// TESTS: components.js (Step 9)
// ═══════════════════════════════════════════════════════════════════════════

describe('Reusable Components Library (Step 9)', () => {
    const {
        InputComponent,
        SelectComponent,
        CheckboxComponent,
        RadioGroupComponent,
        TableComponent,
        ListComponent,
        CardComponent,
        NavbarComponent,
        BreadcrumbComponent,
        TabsComponent,
        ModalComponent,
        ToastComponent,
        AlertComponent,
        SpinnerComponent,
        ProgressComponent,
        ComponentRegistry,
        getRegistry,
        createComponent
    } = require('../../architecture/components');

    // Form Components Tests
    test('InputComponent should exist', () => {
        assert.ok(InputComponent);
    });

    test('InputComponent should be constructable', () => {
        const input = new InputComponent();
        assert.ok(input);
    });

    test('InputComponent should have setValue method', () => {
        const input = new InputComponent();
        assert.strictEqual(typeof input.setValue, 'function');
    });

    test('InputComponent should have getValue method', () => {
        const input = new InputComponent();
        assert.strictEqual(typeof input.getValue, 'function');
    });

    test('SelectComponent should exist', () => {
        assert.ok(SelectComponent);
    });

    test('SelectComponent should have selectByValue method', () => {
        const select = new SelectComponent();
        assert.strictEqual(typeof select.selectByValue, 'function');
    });

    test('SelectComponent should have selectByText method', () => {
        const select = new SelectComponent();
        assert.strictEqual(typeof select.selectByText, 'function');
    });

    test('CheckboxComponent should exist', () => {
        assert.ok(CheckboxComponent);
    });

    test('CheckboxComponent should have check/uncheck methods', () => {
        const checkbox = new CheckboxComponent();
        assert.strictEqual(typeof checkbox.check, 'function');
        assert.strictEqual(typeof checkbox.uncheck, 'function');
        assert.strictEqual(typeof checkbox.toggle, 'function');
    });

    test('RadioGroupComponent should exist', () => {
        assert.ok(RadioGroupComponent);
    });

    // Data Display Components Tests
    test('TableComponent should exist', () => {
        assert.ok(TableComponent);
    });

    test('ListComponent should exist', () => {
        assert.ok(ListComponent);
    });

    test('CardComponent should exist', () => {
        assert.ok(CardComponent);
    });

    // Navigation Components Tests
    test('NavbarComponent should exist', () => {
        assert.ok(NavbarComponent);
    });

    test('BreadcrumbComponent should exist', () => {
        assert.ok(BreadcrumbComponent);
    });

    test('TabsComponent should exist', () => {
        assert.ok(TabsComponent);
    });

    // Feedback Components Tests
    test('ModalComponent should exist', () => {
        assert.ok(ModalComponent);
    });

    test('ToastComponent should exist', () => {
        assert.ok(ToastComponent);
    });

    test('AlertComponent should exist', () => {
        assert.ok(AlertComponent);
    });

    // Loading Components Tests
    test('SpinnerComponent should exist', () => {
        assert.ok(SpinnerComponent);
    });

    test('ProgressComponent should exist', () => {
        assert.ok(ProgressComponent);
    });

    // ComponentRegistry Tests
    test('ComponentRegistry should exist', () => {
        assert.ok(ComponentRegistry);
    });

    test('ComponentRegistry should be constructable', () => {
        const registry = new ComponentRegistry();
        assert.ok(registry);
    });

    test('ComponentRegistry should have register method', () => {
        const registry = new ComponentRegistry();
        assert.strictEqual(typeof registry.register, 'function');
    });

    test('ComponentRegistry should have create method', () => {
        const registry = new ComponentRegistry();
        assert.strictEqual(typeof registry.create, 'function');
    });

    test('ComponentRegistry should have built-in components', () => {
        const registry = new ComponentRegistry();
        const components = registry.list();
        assert.ok(components.includes('Input'));
        assert.ok(components.includes('Select'));
        assert.ok(components.includes('Table'));
        assert.ok(components.includes('Modal'));
    });

    test('getRegistry should return singleton', () => {
        const registry1 = getRegistry();
        const registry2 = getRegistry();
        assert.strictEqual(registry1, registry2);
    });

    test('createComponent should create component by name', () => {
        const input = createComponent('Input');
        assert.ok(input);
        assert.ok(input instanceof InputComponent);
    });

    test('createComponent should throw for unknown component', () => {
        assert.throws(() => {
            createComponent('UnknownComponent');
        }, /not found/);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════════════════════

console.log('\n' + '═'.repeat(50));
console.log('📊 PHASE 1 ARCHITECTURE - TEST SUMMARY');
console.log('═'.repeat(50));
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
console.log('═'.repeat(50));

// Export for CI
module.exports = {
    passed: testsPassed,
    failed: testsFailed,
    results: testResults
};

if (testsFailed > 0) {
    process.exit(1);
}
