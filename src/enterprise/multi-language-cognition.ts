/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * QAntum
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * @copyright 2025 Димитър Продромов (Dimitar Prodromov). All Rights Reserved.
 * @license PROPRIETARY AND CONFIDENTIAL
 * 
 * This file is part of QAntum.
 * Unauthorized copying, modification, distribution, or use of this file,
 * via any medium, is strictly prohibited without express written permission.
 * 
 * For licensing inquiries: dimitar.prodromov@QAntum.dev
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════════
// 🌍 MULTI-LANGUAGE COGNITION - Global Voice Understanding
// ═══════════════════════════════════════════════════════════════════════════════
// Enables QAntum to understand and execute voice commands in multiple 
// languages, with primary focus on Bulgarian (bg) and English (en).
// ═══════════════════════════════════════════════════════════════════════════════

import { IntentType, ExtractedEntity, SemanticAction } from './voice-commander';

/**
 * Supported languages for voice recognition
 * v26.0: Added Chinese (CN) and Japanese (JP) for full 6-language support
 */
export type SupportedLanguage = 
    | 'bg'  // Bulgarian
    | 'en'  // English
    | 'de'  // German
    | 'fr'  // French
    | 'es'  // Spanish
    | 'ru'  // Russian
    | 'cn'  // Chinese (Simplified)
    | 'jp'  // Japanese
    | 'auto'; // Auto-detect

/**
 * Language-specific intent patterns
 */
export interface LanguagePatterns {
    language: SupportedLanguage;
    displayName: string;
    nativeName: string;
    patterns: LanguageIntentPattern[];
    vocabulary: string[];
    entityMappings: EntityMapping[];
}

/**
 * Intent pattern for specific language
 */
export interface LanguageIntentPattern {
    type: IntentType;
    patterns: RegExp[];
    examples: string[];
}

/**
 * Entity mapping for translation
 */
export interface EntityMapping {
    type: 'element' | 'action' | 'direction' | 'time';
    native: string;
    english: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🇧🇬 BULGARIAN LANGUAGE COGNITION
// ═══════════════════════════════════════════════════════════════════════════════

export const BULGARIAN_PATTERNS: LanguagePatterns = {
    language: 'bg',
    displayName: 'Bulgarian',
    nativeName: 'Български',
    patterns: [
        // Navigation - Навигация
        {
            type: 'navigation',
            patterns: [
                /^(отиди|отвори|навигирай|зареди|влез)\s+(на|в|към|до)?\s*(.+)$/i,
                /^(отвори|зареди)\s+(страница|страницата|сайт|сайта)?\s*(.+)$/i,
                /^към\s+(.+)$/i
            ],
            examples: [
                'Отиди на логин страницата',
                'Отвори началната страница',
                'Навигирай към профила',
                'Влез в настройки'
            ]
        },
        
        // Click/Interaction - Клик/Взаимодействие
        {
            type: 'interaction',
            patterns: [
                /^(кликни|натисни|щракни|избери|докосни)\s+(на|върху)?\s*(бутон|бутона|линк|линка)?\s*(.+)$/i,
                /^(кликни|натисни)\s+(.+)$/i,
                /^избери\s+(опция|опцията)?\s*(.+)$/i
            ],
            examples: [
                'Кликни на бутона Вход',
                'Натисни бутон Изпрати',
                'Щракни върху линка',
                'Избери опцията Запази'
            ]
        },
        
        // Data Entry - Въвеждане на данни
        {
            type: 'data_entry',
            patterns: [
                /^(напиши|въведи|попълни|запиши)\s+["']?(.+?)["']?\s+(в|във)\s+(.+)$/i,
                /^(напиши|въведи)\s+["']?(.+?)["']?$/i,
                /^попълни\s+(полето|поле)?\s*(.+?)\s+с\s+["']?(.+?)["']?$/i
            ],
            examples: [
                'Напиши "test@email.com" в полето имейл',
                'Въведи паролата в полето',
                'Попълни формата с данни',
                'Запиши името Иван'
            ]
        },
        
        // Wait - Изчакване
        {
            type: 'wait',
            patterns: [
                /^(изчакай|почакай|чакай)\s+(\d+)\s*(секунди?|сек|милисекунди?|мс)?$/i,
                /^(изчакай|почакай)\s+(докато|да)\s+(.+)$/i,
                /^пауза\s+(\d+)\s*(секунди?)?$/i
            ],
            examples: [
                'Изчакай 5 секунди',
                'Почакай 3 сек',
                'Изчакай докато зареди',
                'Пауза 2 секунди'
            ]
        },
        
        // Assertion - Проверка
        {
            type: 'assertion',
            patterns: [
                /^(провери|потвърди|увери се|валидирай)\s+(че|дали)?\s*(.+)$/i,
                /^(трябва да|очаквам)\s+(.+)$/i,
                /^виж\s+(дали|че)\s+(.+)$/i
            ],
            examples: [
                'Провери че заглавието е правилно',
                'Потвърди че бутонът е видим',
                'Увери се че формата е изпратена',
                'Трябва да има съобщение за успех'
            ]
        },
        
        // Screenshot - Скрийншот
        {
            type: 'screenshot',
            patterns: [
                /^(направи|вземи|запази)\s*(скрийншот|снимка|екранна снимка)$/i,
                /^(скрийншот|снимка)$/i,
                /^запази\s+(екрана|страницата)$/i
            ],
            examples: [
                'Направи скрийншот',
                'Вземи снимка на екрана',
                'Скрийншот',
                'Запази страницата'
            ]
        },
        
        // Test Control - Контрол на тестове
        {
            type: 'test_control',
            patterns: [
                /^(стартирай|пусни|изпълни)\s+(теста?|тестовете)?\s*(.*)$/i,
                /^(започни|старт)\s+(тестване|тест)?\s*(.*)$/i
            ],
            examples: [
                'Стартирай теста за логин',
                'Пусни всички тестове',
                'Изпълни регресия',
                'Започни тестване'
            ]
        },
        
        // Abort - Спиране
        {
            type: 'abort',
            patterns: [
                /^(спри|стоп|прекрати|откажи|прекъсни)\s*(теста?|изпълнението|всичко)?$/i,
                /^(аварийно\s+)?спиране$/i,
                /^стоп$/i
            ],
            examples: [
                'Спри теста',
                'Стоп',
                'Прекрати изпълнението',
                'Аварийно спиране'
            ]
        },
        
        // Query - Запитване
        {
            type: 'query',
            patterns: [
                /^(какво|какъв|каква|кой|коя|къде|как)\s+(.+)\??$/i,
                /^(покажи|кажи)\s+ми\s+(.+)$/i
            ],
            examples: [
                'Какъв е URL адресът?',
                'Къде е бутонът за вход?',
                'Покажи ми текущата страница',
                'Кой елемент е фокусиран?'
            ]
        }
    ],
    vocabulary: [
        // Actions - Действия
        'кликни', 'натисни', 'щракни', 'избери', 'отиди', 'отвори', 'затвори',
        'напиши', 'въведи', 'попълни', 'изтрий', 'премахни', 'добави',
        'изчакай', 'почакай', 'провери', 'потвърди', 'валидирай',
        'скролни', 'превърти', 'плъзни', 'влачи',
        'спри', 'стартирай', 'пусни', 'прекрати',
        
        // Elements - Елементи
        'бутон', 'бутона', 'линк', 'линка', 'връзка', 'връзката',
        'поле', 'полето', 'форма', 'формата', 'таблица', 'таблицата',
        'меню', 'менюто', 'списък', 'списъка', 'елемент', 'елемента',
        'заглавие', 'заглавието', 'текст', 'текста', 'снимка', 'снимката',
        'чекбокс', 'радио бутон', 'падащо меню', 'слайдер',
        'модал', 'модала', 'прозорец', 'прозореца', 'диалог', 'диалога',
        
        // Directions - Посоки
        'нагоре', 'надолу', 'наляво', 'надясно', 'напред', 'назад',
        
        // Time - Време
        'секунди', 'секунда', 'сек', 'милисекунди', 'мс', 'минути', 'минута',
        
        // QA Terms - QA Термини
        'тест', 'теста', 'тестове', 'тестовете', 'сценарий', 'сценария',
        'страница', 'страницата', 'сайт', 'сайта', 'уеб', 'приложение',
        'грешка', 'грешката', 'успех', 'резултат', 'доклад',
        'скрийншот', 'екранна снимка', 'видео', 'запис',
        
        // QAntum specific
        'мистър майнд', 'суверен', 'персона', 'хаос тест'
    ],
    entityMappings: [
        // Elements
        { type: 'element', native: 'бутон', english: 'button' },
        { type: 'element', native: 'бутона', english: 'button' },
        { type: 'element', native: 'линк', english: 'link' },
        { type: 'element', native: 'линка', english: 'link' },
        { type: 'element', native: 'връзка', english: 'link' },
        { type: 'element', native: 'поле', english: 'input' },
        { type: 'element', native: 'полето', english: 'input' },
        { type: 'element', native: 'форма', english: 'form' },
        { type: 'element', native: 'таблица', english: 'table' },
        { type: 'element', native: 'меню', english: 'menu' },
        { type: 'element', native: 'списък', english: 'list' },
        { type: 'element', native: 'заглавие', english: 'heading' },
        { type: 'element', native: 'текст', english: 'text' },
        { type: 'element', native: 'снимка', english: 'image' },
        { type: 'element', native: 'чекбокс', english: 'checkbox' },
        { type: 'element', native: 'модал', english: 'modal' },
        { type: 'element', native: 'прозорец', english: 'dialog' },
        
        // Actions
        { type: 'action', native: 'кликни', english: 'click' },
        { type: 'action', native: 'натисни', english: 'click' },
        { type: 'action', native: 'напиши', english: 'type' },
        { type: 'action', native: 'въведи', english: 'type' },
        { type: 'action', native: 'изчакай', english: 'wait' },
        { type: 'action', native: 'провери', english: 'verify' },
        { type: 'action', native: 'отиди', english: 'navigate' },
        { type: 'action', native: 'отвори', english: 'open' },
        { type: 'action', native: 'скролни', english: 'scroll' },
        { type: 'action', native: 'избери', english: 'select' },
        
        // Time
        { type: 'time', native: 'секунди', english: 'seconds' },
        { type: 'time', native: 'секунда', english: 'second' },
        { type: 'time', native: 'сек', english: 'seconds' },
        { type: 'time', native: 'милисекунди', english: 'milliseconds' },
        { type: 'time', native: 'мс', english: 'ms' }
    ]
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🇬🇧 ENGLISH LANGUAGE PATTERNS (Enhanced)
// ═══════════════════════════════════════════════════════════════════════════════

export const ENGLISH_PATTERNS: LanguagePatterns = {
    language: 'en',
    displayName: 'English',
    nativeName: 'English',
    patterns: [
        {
            type: 'navigation',
            patterns: [
                /^(go to|navigate to|open|visit|load)\s+(.+)$/i,
                /^(go|navigate)\s+(to\s+)?(.+)$/i
            ],
            examples: [
                'Go to login page',
                'Navigate to dashboard',
                'Open settings',
                'Visit the homepage'
            ]
        },
        {
            type: 'interaction',
            patterns: [
                /^(click|tap|press)\s+(on\s+)?(the\s+)?(.+)$/i,
                /^(click|tap|press)\s+(.+)$/i
            ],
            examples: [
                'Click the submit button',
                'Tap on login',
                'Press enter'
            ]
        },
        {
            type: 'data_entry',
            patterns: [
                /^(type|enter|input|fill)\s+(.+?)\s+(in|into)\s+(.+)$/i,
                /^(type|enter|input)\s+["'](.+)["']$/i
            ],
            examples: [
                'Type "hello" into the input',
                'Enter email address',
                'Fill the form'
            ]
        },
        {
            type: 'wait',
            patterns: [
                /^(wait|pause|delay)\s+(for\s+)?(\d+)\s*(seconds?|ms|milliseconds?)?$/i,
                /^(wait|pause)\s+(.+)$/i
            ],
            examples: [
                'Wait 5 seconds',
                'Pause for 3 seconds',
                'Wait until loaded'
            ]
        },
        {
            type: 'assertion',
            patterns: [
                /^(verify|assert|check|confirm|validate)\s+(that\s+)?(.+)$/i,
                /^(should|must)\s+(have|contain|be)\s+(.+)$/i
            ],
            examples: [
                'Verify that title is correct',
                'Check the button is visible',
                'Should have success message'
            ]
        },
        {
            type: 'screenshot',
            patterns: [
                /^(take\s+)?(a\s+)?screenshot$/i,
                /^(capture|snapshot)\s+(the\s+)?(screen|page)?$/i
            ],
            examples: [
                'Take a screenshot',
                'Screenshot',
                'Capture the page'
            ]
        },
        {
            type: 'test_control',
            patterns: [
                /^(run|execute|start)\s+(the\s+)?(.+)\s+test$/i,
                /^(run|execute)\s+(.+)$/i
            ],
            examples: [
                'Run the login test',
                'Execute all tests',
                'Start regression'
            ]
        },
        {
            type: 'abort',
            patterns: [
                /^(stop|abort|cancel|halt)\s*(the\s+)?(test|execution)?$/i,
                /^(emergency\s+)?stop$/i
            ],
            examples: [
                'Stop the test',
                'Abort',
                'Emergency stop'
            ]
        },
        {
            type: 'query',
            patterns: [
                /^(what|where|how|which)\s+(.+)$/i,
                /^(tell\s+me|show\s+me)\s+(.+)$/i
            ],
            examples: [
                'What is the current URL?',
                'Where is the login button?',
                'Show me the results'
            ]
        }
    ],
    vocabulary: [
        'click', 'tap', 'press', 'type', 'enter', 'input', 'fill',
        'navigate', 'go to', 'open', 'visit', 'wait', 'pause', 'delay',
        'verify', 'assert', 'check', 'confirm', 'validate',
        'screenshot', 'capture', 'snapshot', 'hover', 'scroll',
        'button', 'link', 'input', 'field', 'form', 'table', 'menu',
        'test', 'tests', 'run', 'execute', 'start', 'stop', 'abort'
    ],
    entityMappings: []
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🇨🇳 CHINESE (SIMPLIFIED) LANGUAGE PATTERNS (v26.0)
// ═══════════════════════════════════════════════════════════════════════════════

export const CHINESE_PATTERNS: LanguagePatterns = {
    language: 'cn',
    displayName: 'Chinese (Simplified)',
    nativeName: '简体中文',
    patterns: [
        {
            type: 'navigation',
            patterns: [
                /^(打开|进入|导航到|访问|加载)\s*(.+)$/i,
                /^(去|到)\s*(.+)$/i
            ],
            examples: [
                '打开登录页面',
                '进入首页',
                '导航到设置',
                '访问个人资料'
            ]
        },
        {
            type: 'interaction',
            patterns: [
                /^(点击|按|选择|触摸)\s*(按钮|链接)?\s*(.+)$/i,
                /^(单击|双击)\s*(.+)$/i
            ],
            examples: [
                '点击登录按钮',
                '按提交',
                '选择保存选项'
            ]
        },
        {
            type: 'data_entry',
            patterns: [
                /^(输入|填写|写入)\s*["']?(.+?)["']?\s*(到|在)\s*(.+)$/i,
                /^(输入|填写)\s*["']?(.+?)["']?$/i
            ],
            examples: [
                '输入"test@email.com"到邮箱字段',
                '填写用户名',
                '写入密码'
            ]
        },
        {
            type: 'wait',
            patterns: [
                /^(等待|等)\s*(\d+)\s*(秒|毫秒)?$/i,
                /^(等待|等)\s*(直到|到)\s*(.+)$/i
            ],
            examples: [
                '等待5秒',
                '等3秒',
                '等待直到加载完成'
            ]
        },
        {
            type: 'assertion',
            patterns: [
                /^(验证|检查|确认)\s*(是否)?\s*(.+)$/i,
                /^(应该|必须)\s*(.+)$/i
            ],
            examples: [
                '验证标题正确',
                '检查按钮可见',
                '确认表单已提交'
            ]
        },
        {
            type: 'screenshot',
            patterns: [
                /^(截图|截屏|屏幕截图)$/i,
                /^(保存|捕获)\s*(屏幕|页面)?$/i
            ],
            examples: [
                '截图',
                '截屏',
                '保存页面'
            ]
        },
        {
            type: 'abort',
            patterns: [
                /^(停止|中止|取消|终止)\s*(测试|执行)?$/i,
                /^停$/i
            ],
            examples: [
                '停止测试',
                '中止',
                '终止执行'
            ]
        }
    ],
    vocabulary: [
        '点击', '按', '输入', '填写', '等待', '验证', '检查',
        '打开', '进入', '导航', '访问', '截图', '停止', '开始',
        '按钮', '链接', '输入框', '表单', '页面', '元素',
        '测试', '执行', '运行', '提交', '取消', '确认'
    ],
    entityMappings: [
        { type: 'element', native: '按钮', english: 'button' },
        { type: 'element', native: '链接', english: 'link' },
        { type: 'element', native: '输入框', english: 'input' },
        { type: 'element', native: '表单', english: 'form' },
        { type: 'element', native: '表格', english: 'table' },
        { type: 'element', native: '菜单', english: 'menu' },
        { type: 'action', native: '点击', english: 'click' },
        { type: 'action', native: '输入', english: 'type' },
        { type: 'action', native: '等待', english: 'wait' },
        { type: 'action', native: '验证', english: 'verify' },
        { type: 'time', native: '秒', english: 'seconds' },
        { type: 'time', native: '毫秒', english: 'milliseconds' }
    ]
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🇯🇵 JAPANESE LANGUAGE PATTERNS (v26.0)
// ═══════════════════════════════════════════════════════════════════════════════

export const JAPANESE_PATTERNS: LanguagePatterns = {
    language: 'jp',
    displayName: 'Japanese',
    nativeName: '日本語',
    patterns: [
        {
            type: 'navigation',
            patterns: [
                /^(開く|開いて|移動|ナビゲート)\s*(.+)$/i,
                /^(.+)\s*(へ|に)\s*(行く|移動)$/i
            ],
            examples: [
                'ログインページを開く',
                'ホームページへ移動',
                '設定へ行く'
            ]
        },
        {
            type: 'interaction',
            patterns: [
                /^(クリック|押す|選択|タップ)\s*(ボタン|リンク)?\s*(.+)$/i,
                /^(.+)\s*(を|の)\s*(クリック|押す)$/i
            ],
            examples: [
                'ログインボタンをクリック',
                '送信を押す',
                '保存オプションを選択'
            ]
        },
        {
            type: 'data_entry',
            patterns: [
                /^(入力|書く|記入)\s*["']?(.+?)["']?\s*(を|に)\s*(.+)$/i,
                /^(.+)\s*(を|に)\s*(入力|書く|記入)$/i
            ],
            examples: [
                'メールフィールドに"test@email.com"を入力',
                'ユーザー名を入力',
                'パスワードを記入'
            ]
        },
        {
            type: 'wait',
            patterns: [
                /^(待つ|待機)\s*(\d+)\s*(秒|ミリ秒)?$/i,
                /^(\d+)\s*(秒|ミリ秒)\s*(待つ|待機)$/i
            ],
            examples: [
                '5秒待つ',
                '待機3秒',
                'ロードまで待つ'
            ]
        },
        {
            type: 'assertion',
            patterns: [
                /^(確認|検証|チェック)\s*(して)?\s*(.+)$/i,
                /^(.+)\s*(を|が)\s*(確認|検証)$/i
            ],
            examples: [
                'タイトルが正しいことを確認',
                'ボタンが表示されているかチェック',
                'フォーム送信を確認'
            ]
        },
        {
            type: 'screenshot',
            patterns: [
                /^(スクリーンショット|画面キャプチャ)$/i,
                /^(保存|撮る)\s*(画面|ページ)?$/i
            ],
            examples: [
                'スクリーンショット',
                '画面キャプチャ',
                'ページを保存'
            ]
        },
        {
            type: 'abort',
            patterns: [
                /^(停止|中止|キャンセル|終了)\s*(テスト|実行)?$/i,
                /^ストップ$/i
            ],
            examples: [
                'テスト停止',
                '中止',
                '実行終了'
            ]
        }
    ],
    vocabulary: [
        'クリック', '押す', '入力', '書く', '待つ', '確認', '検証',
        '開く', '移動', 'ナビゲート', 'スクリーンショット', '停止', '開始',
        'ボタン', 'リンク', '入力欄', 'フォーム', 'ページ', '要素',
        'テスト', '実行', '実行する', '送信', 'キャンセル', '確認'
    ],
    entityMappings: [
        { type: 'element', native: 'ボタン', english: 'button' },
        { type: 'element', native: 'リンク', english: 'link' },
        { type: 'element', native: '入力欄', english: 'input' },
        { type: 'element', native: 'フォーム', english: 'form' },
        { type: 'element', native: 'テーブル', english: 'table' },
        { type: 'element', native: 'メニュー', english: 'menu' },
        { type: 'action', native: 'クリック', english: 'click' },
        { type: 'action', native: '入力', english: 'type' },
        { type: 'action', native: '待つ', english: 'wait' },
        { type: 'action', native: '確認', english: 'verify' },
        { type: 'time', native: '秒', english: 'seconds' },
        { type: 'time', native: 'ミリ秒', english: 'milliseconds' }
    ]
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🌍 MULTI-LANGUAGE COGNITION ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

export class MultiLanguageCognition {
    private supportedLanguages: Map<SupportedLanguage, LanguagePatterns> = new Map();
    private activeLanguage: SupportedLanguage = 'auto';
    private detectedLanguage: SupportedLanguage | null = null;
    
    constructor() {
        // Register built-in languages (v26.0: Now supports 6 core languages)
        this.registerLanguage(BULGARIAN_PATTERNS);
        this.registerLanguage(ENGLISH_PATTERNS);
        this.registerLanguage(CHINESE_PATTERNS);
        this.registerLanguage(JAPANESE_PATTERNS);
    }
    
    /**
     * Register a new language
     */
    registerLanguage(patterns: LanguagePatterns): void {
        this.supportedLanguages.set(patterns.language, patterns);
    }
    
    /**
     * Set active language
     */
    setLanguage(language: SupportedLanguage): void {
        this.activeLanguage = language;
    }
    
    /**
     * Get active language
     */
    getLanguage(): SupportedLanguage {
        return this.activeLanguage;
    }
    
    /**
     * Detect language from transcript
     * v26.0: Enhanced with Chinese and Japanese detection
     */
    detectLanguage(transcript: string): SupportedLanguage {
        // Check for Chinese characters (Simplified/Traditional)
        const chinesePattern = /[\u4E00-\u9FFF\u3400-\u4DBF]/;
        if (chinesePattern.test(transcript)) {
            // Check for Chinese-specific patterns
            const chineseIndicators = /(点击|输入|打开|等待|验证|按钮|链接)/;
            if (chineseIndicators.test(transcript)) {
                this.detectedLanguage = 'cn';
                return 'cn';
            }
            this.detectedLanguage = 'cn';
            return 'cn';
        }
        
        // Check for Japanese characters (Hiragana, Katakana, Kanji)
        const japanesePattern = /[\u3040-\u309F\u30A0-\u30FF]/;
        if (japanesePattern.test(transcript)) {
            // Check for Japanese-specific patterns
            const japaneseIndicators = /(クリック|入力|開く|待つ|確認|ボタン|リンク)/;
            if (japaneseIndicators.test(transcript)) {
                this.detectedLanguage = 'jp';
                return 'jp';
            }
            this.detectedLanguage = 'jp';
            return 'jp';
        }
        
        // Check for Cyrillic characters (Bulgarian/Russian)
        const cyrillicPattern = /[\u0400-\u04FF]/;
        if (cyrillicPattern.test(transcript)) {
            // Check for Bulgarian-specific patterns
            const bulgarianIndicators = /\b(кликни|натисни|отиди|изчакай|провери|бутон|страница)\b/i;
            if (bulgarianIndicators.test(transcript)) {
                this.detectedLanguage = 'bg';
                return 'bg';
            }
            // Default Cyrillic to Bulgarian (can be extended for Russian)
            this.detectedLanguage = 'bg';
            return 'bg';
        }
        
        // Check for German-specific patterns
        const germanIndicators = /\b(klicken|eingeben|öffnen|warten|prüfen|Taste|Schaltfläche)\b/i;
        if (germanIndicators.test(transcript)) {
            this.detectedLanguage = 'de';
            return 'de';
        }
        
        // Check for French-specific patterns
        const frenchIndicators = /\b(cliquer|saisir|ouvrir|attendre|vérifier|bouton|lien)\b/i;
        if (frenchIndicators.test(transcript)) {
            this.detectedLanguage = 'fr';
            return 'fr';
        }
        
        // Default to English for Latin characters
        this.detectedLanguage = 'en';
        return 'en';
    }
    
    /**
     * Parse intent from transcript using appropriate language
     */
    parseIntent(transcript: string): {
        type: IntentType;
        confidence: number;
        language: SupportedLanguage;
        entities: ExtractedEntity[];
        action: SemanticAction | null;
    } {
        // Detect or use set language
        const language = this.activeLanguage === 'auto' 
            ? this.detectLanguage(transcript) 
            : this.activeLanguage;
        
        const patterns = this.supportedLanguages.get(language);
        if (!patterns) {
            return {
                type: 'unknown',
                confidence: 0,
                language,
                entities: [],
                action: null
            };
        }
        
        // Try to match patterns
        let bestMatch: {
            pattern: LanguageIntentPattern;
            match: RegExpMatchArray;
            confidence: number;
        } | null = null;
        
        const normalizedTranscript = transcript.toLowerCase().trim();
        
        for (const pattern of patterns.patterns) {
            for (const regex of pattern.patterns) {
                const match = normalizedTranscript.match(regex);
                if (match) {
                    const confidence = this.calculateConfidence(normalizedTranscript, match[0]);
                    if (!bestMatch || confidence > bestMatch.confidence) {
                        bestMatch = { pattern, match, confidence };
                    }
                }
            }
        }
        
        if (!bestMatch) {
            return {
                type: 'unknown',
                confidence: 0,
                language,
                entities: [],
                action: null
            };
        }
        
        // Extract entities
        const entities = this.extractEntities(transcript, language);
        
        // Build action
        const action = this.buildAction(bestMatch.pattern.type, transcript, entities, language);
        
        return {
            type: bestMatch.pattern.type,
            confidence: bestMatch.confidence,
            language,
            entities,
            action
        };
    }
    
    /**
     * Calculate confidence score
     */
    private calculateConfidence(transcript: string, match: string): number {
        const matchRatio = match.length / transcript.length;
        return Math.min(0.5 + matchRatio * 0.5, 1);
    }
    
    /**
     * Extract entities from transcript
     */
    private extractEntities(transcript: string, language: SupportedLanguage): ExtractedEntity[] {
        const entities: ExtractedEntity[] = [];
        const patterns = this.supportedLanguages.get(language);
        
        // Extract URLs
        const urlMatch = transcript.match(/(https?:\/\/[^\s]+|[a-z0-9-]+\.(com|org|net|io|bg|eu)[^\s]*)/i);
        if (urlMatch) {
            entities.push({
                type: 'url',
                value: urlMatch[0].startsWith('http') ? urlMatch[0] : `https://${urlMatch[0]}`,
                startIndex: urlMatch.index || 0,
                length: urlMatch[0].length,
                confidence: 0.9
            });
        }
        
        // Extract durations
        const durationPatterns = language === 'bg'
            ? /(\d+)\s*(секунди?|сек|милисекунди?|мс)/i
            : /(\d+)\s*(seconds?|s|ms|milliseconds?)/i;
        
        const durationMatch = transcript.match(durationPatterns);
        if (durationMatch) {
            let value = parseInt(durationMatch[1]);
            const unit = durationMatch[2].toLowerCase();
            
            // Convert to milliseconds
            if (unit.startsWith('сек') || unit.startsWith('sec') || unit === 's') {
                value *= 1000;
            }
            
            entities.push({
                type: 'duration',
                value: value.toString(),
                startIndex: durationMatch.index || 0,
                length: durationMatch[0].length,
                confidence: 0.95
            });
        }
        
        // Extract element types using entity mappings
        if (patterns) {
            for (const mapping of patterns.entityMappings) {
                if (mapping.type === 'element') {
                    const index = transcript.toLowerCase().indexOf(mapping.native.toLowerCase());
                    if (index !== -1) {
                        entities.push({
                            type: 'element_type',
                            value: mapping.english,
                            startIndex: index,
                            length: mapping.native.length,
                            confidence: 0.85
                        });
                        break;
                    }
                }
            }
        }
        
        // Extract quoted text
        const quotedMatch = transcript.match(/["']([^"']+)["']/);
        if (quotedMatch) {
            entities.push({
                type: 'text',
                value: quotedMatch[1],
                startIndex: quotedMatch.index || 0,
                length: quotedMatch[0].length,
                confidence: 0.95
            });
        }
        
        return entities;
    }
    
    /**
     * Build semantic action from intent
     */
    private buildAction(
        type: IntentType,
        transcript: string,
        entities: ExtractedEntity[],
        language: SupportedLanguage
    ): SemanticAction | null {
        const urlEntity = entities.find(e => e.type === 'url');
        const durationEntity = entities.find(e => e.type === 'duration');
        const textEntity = entities.find(e => e.type === 'text');
        const elementEntity = entities.find(e => e.type === 'element_type');
        
        switch (type) {
            case 'navigation':
                return {
                    verb: 'navigate',
                    target: urlEntity?.value || this.extractTargetFromTranscript(transcript, language),
                    params: {},
                    priority: 'high'
                };
                
            case 'interaction':
                return {
                    verb: 'click',
                    target: this.buildSelector(transcript, elementEntity?.value, language),
                    params: {},
                    priority: 'normal'
                };
                
            case 'data_entry':
                return {
                    verb: 'type',
                    target: this.buildSelector(transcript, elementEntity?.value, language),
                    params: { text: textEntity?.value || '' },
                    priority: 'normal'
                };
                
            case 'wait':
                return {
                    verb: 'wait',
                    target: '',
                    params: { duration: parseInt(durationEntity?.value || '1000') },
                    priority: 'low'
                };
                
            case 'assertion':
                return {
                    verb: 'assert',
                    target: 'page',
                    params: { condition: transcript },
                    priority: 'high'
                };
                
            case 'screenshot':
                return {
                    verb: 'screenshot',
                    target: 'page',
                    params: { fullPage: true },
                    priority: 'normal'
                };
                
            case 'abort':
                return {
                    verb: 'click',
                    target: 'abort',
                    params: { emergency: true },
                    priority: 'critical'
                };
                
            default:
                return null;
        }
    }
    
    /**
     * Extract target from transcript
     */
    private extractTargetFromTranscript(transcript: string, language: SupportedLanguage): string {
        const actionWords = language === 'bg'
            ? /(отиди|отвори|навигирай|зареди|влез)\s+(на|в|към|до)?\s*/i
            : /(go to|navigate to|open|visit|load)\s*/i;
        
        const cleaned = transcript.replace(actionWords, '').trim();
        
        // Check for page names
        const pagePatterns = language === 'bg'
            ? /(логин|начална|профил|настройки|табло|dashboard)/i
            : /(login|home|dashboard|settings|profile)/i;
        
        const pageMatch = cleaned.match(pagePatterns);
        if (pageMatch) {
            return `/${pageMatch[1].toLowerCase()}`;
        }
        
        return `/${cleaned.toLowerCase().replace(/\s+/g, '-')}`;
    }
    
    /**
     * Build selector from context
     */
    private buildSelector(transcript: string, elementType?: string, language?: SupportedLanguage): string {
        // Extract the element name/text
        const actionWords = language === 'bg'
            ? /(кликни|натисни|щракни|избери)\s+(на|върху)?\s*(бутон|бутона|линк|линка)?\s*/i
            : /(click|tap|press)\s+(on\s+)?(the\s+)?(button|link)?\s*/i;
        
        const cleaned = transcript.replace(actionWords, '').trim();
        
        if (elementType === 'button') {
            return `button:has-text("${cleaned}"), [role="button"]:has-text("${cleaned}")`;
        } else if (elementType === 'link') {
            return `a:has-text("${cleaned}")`;
        } else if (elementType === 'input' || elementType === 'field') {
            return `input[placeholder*="${cleaned}"], input[name*="${cleaned}"]`;
        }
        
        return `text="${cleaned}"`;
    }
    
    /**
     * Translate entity from native to English
     */
    translateEntity(value: string, language: SupportedLanguage): string {
        const patterns = this.supportedLanguages.get(language);
        if (!patterns) return value;
        
        for (const mapping of patterns.entityMappings) {
            if (mapping.native.toLowerCase() === value.toLowerCase()) {
                return mapping.english;
            }
        }
        
        return value;
    }
    
    /**
     * Get all supported languages
     */
    getSupportedLanguages(): Array<{ code: SupportedLanguage; name: string; nativeName: string }> {
        const languages: Array<{ code: SupportedLanguage; name: string; nativeName: string }> = [];
        
        for (const [code, patterns] of this.supportedLanguages) {
            languages.push({
                code,
                name: patterns.displayName,
                nativeName: patterns.nativeName
            });
        }
        
        return languages;
    }
    
    /**
     * Get examples for a specific language and intent type
     */
    getExamples(language: SupportedLanguage, type?: IntentType): string[] {
        const patterns = this.supportedLanguages.get(language);
        if (!patterns) return [];
        
        const examples: string[] = [];
        
        for (const pattern of patterns.patterns) {
            if (!type || pattern.type === type) {
                examples.push(...pattern.examples);
            }
        }
        
        return examples;
    }
    
    /**
     * Get vocabulary for a specific language
     */
    getVocabulary(language: SupportedLanguage): string[] {
        const patterns = this.supportedLanguages.get(language);
        return patterns?.vocabulary || [];
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export default MultiLanguageCognition;
