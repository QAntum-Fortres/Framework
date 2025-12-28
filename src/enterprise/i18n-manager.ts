// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  MISTER MIND v23.0.0 - i18n Manager                                          ║
// ║  "The Local Sovereign" - Международна поддръжка                              ║
// ║  Internationalization system with BG/EN/DE/FR support                        ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

export type SupportedLanguage = 'bg' | 'en' | 'de' | 'fr';

export interface I18nTranslations {
  // Header
  header: {
    title: string;
    codename: string;
    lines: string;
    tests: string;
    modules: string;
  };
  
  // Sidebar sections
  sidebar: {
    freeFeatures: string;
    proFeatures: string;
    enterprise: string;
    utilities: string;
  };
  
  // Module names
  modules: {
    websiteAudit: string;
    apiTest: string;
    linkChecker: string;
    predictionMatrix: string;
    apiSensei: string;
    chronosEngine: string;
    thermalPool: string;
    dockerManager: string;
    swarmCommander: string;
    bulgarianTts: string;
    licenseManager: string;
    systemStats: string;
    logger: string;
  };
  
  // Badges
  badges: {
    free: string;
    pro: string;
    proRequired: string;
  };
  
  // Panel content
  panels: {
    audit: {
      title: string;
      subtitle: string;
      urlLabel: string;
      runButton: string;
      performance: string;
      accessibility: string;
      seo: string;
    };
    apiTest: {
      title: string;
      subtitle: string;
      endpointLabel: string;
      methodLabel: string;
      runButton: string;
    };
    linkChecker: {
      title: string;
      subtitle: string;
      urlLabel: string;
      maxLinksLabel: string;
      runButton: string;
    };
    prediction: {
      title: string;
      subtitle: string;
      codeLabel: string;
      runButton: string;
      description: string;
    };
    apiSensei: {
      title: string;
      subtitle: string;
      baseUrlLabel: string;
      scenariosLabel: string;
      runButton: string;
      scenarios: {
        happyPath: string;
        edgeCases: string;
        errorHandling: string;
        security: string;
        performance: string;
      };
    };
    chronos: {
      title: string;
      subtitle: string;
      description: string;
      intervalLabel: string;
      maxSnapshotsLabel: string;
      runButton: string;
    };
    thermal: {
      title: string;
      subtitle: string;
      description: string;
      states: {
        cool: string;
        warm: string;
        hot: string;
        critical: string;
      };
      temperature: string;
      maxInstances: string;
    };
    docker: {
      title: string;
      subtitle: string;
      description: string;
    };
    swarm: {
      title: string;
      subtitle: string;
      description: string;
    };
    tts: {
      title: string;
      subtitle: string;
      // Остава на български - референция към родния език
      description: string;
      templates: {
        testPassed: string;
        testFailed: string;
        errorFound: string;
        healing: string;
      };
    };
    license: {
      title: string;
      subtitle: string;
      description: string;
      types: {
        trial: string;
        professional: string;
        enterprise: string;
        sovereign: string;
      };
      maxInstances: string;
      features: string;
    };
    stats: {
      title: string;
      subtitle: string;
      version: string;
      linesOfCode: string;
      typescriptFiles: string;
      testsPassing: string;
      enterpriseModules: string;
      codename: string;
    };
    logger: {
      title: string;
      subtitle: string;
      description: string;
    };
  };
  
  // Status panel
  status: {
    systemStatus: string;
    backend: string;
    license: string;
    circuitBreaker: string;
    online: string;
    offline: string;
    closed: string;
    open: string;
    cpuTemperature: string;
    state: string;
    financialOracle: string;
    totalCost: string;
    requests: string;
    budgetLeft: string;
    activityLog: string;
    waitingForActivity: string;
    checking: string;
    freeTier: string;
  };
  
  // Common
  common: {
    loading: string;
    processing: string;
    complete: string;
    error: string;
    success: string;
    warning: string;
    opened: string;
    initialized: string;
    madeInBulgaria: string;
  };
  
  // Footer
  footer: {
    copyright: string;
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// BULGARIAN TRANSLATIONS (DEFAULT)
// ══════════════════════════════════════════════════════════════════════════════

export const bg: I18nTranslations = {
  header: {
    title: 'MISTER MIND',
    codename: 'v23.0.0 "Локалният Суверен"',
    lines: 'Редове:',
    tests: 'Тестове:',
    modules: 'Модули:',
  },
  sidebar: {
    freeFeatures: '🆓 Безплатни функции',
    proFeatures: '💎 Pro функции',
    enterprise: '🏢 Enterprise',
    utilities: '🛠️ Инструменти',
  },
  modules: {
    websiteAudit: 'Одит на сайт',
    apiTest: 'API Тест',
    linkChecker: 'Проверка линкове',
    predictionMatrix: 'Матрица прогнози',
    apiSensei: 'API Sensei',
    chronosEngine: 'Chronos двигател',
    thermalPool: 'Термален пул',
    dockerManager: 'Docker мениджър',
    swarmCommander: 'Swarm командир',
    bulgarianTts: 'Български TTS',
    licenseManager: 'Лицензен мениджър',
    systemStats: 'Системна статистика',
    logger: 'Логър',
  },
  badges: {
    free: 'БЕЗПЛ.',
    pro: 'PRO',
    proRequired: 'ИЗИСКВА PRO ЛИЦЕНЗ',
  },
  panels: {
    audit: {
      title: '🔍 Одит на уебсайт',
      subtitle: 'mm.audit(url) → AuditResult',
      urlLabel: 'URL за одит',
      runButton: '▶️ Стартирай одит',
      performance: 'Производителност',
      accessibility: 'Достъпност',
      seo: 'SEO',
    },
    apiTest: {
      title: '🌐 API Тест',
      subtitle: 'mm.testAPI(endpoint, options) → APITestResult',
      endpointLabel: 'API Endpoint',
      methodLabel: 'Метод',
      runButton: '▶️ Тествай API',
    },
    linkChecker: {
      title: '🔗 Проверка на линкове',
      subtitle: 'mm.checkLinks(url, options) → CheckLinksResult',
      urlLabel: 'URL на страница',
      maxLinksLabel: 'Макс. линкове за проверка',
      runButton: '▶️ Провери линкове',
    },
    prediction: {
      title: '🔮 Матрица за прогнози',
      subtitle: 'mm.predict(options) → PredictionResult',
      codeLabel: 'Промени в кода (diff или съдържание)',
      runButton: '▶️ Анализирай и предскажи',
      description: 'Анализира промените в кода и прогнозира потенциални провали на тестове.',
    },
    apiSensei: {
      title: '🤖 API Sensei',
      subtitle: 'mm.apiSensei(config) → APISenseiResult',
      baseUrlLabel: 'Базов API URL',
      scenariosLabel: 'Тестови сценарии',
      runButton: '▶️ Генерирай и изпълни тестове',
      scenarios: {
        happyPath: 'Щастлив път',
        edgeCases: 'Гранични случаи',
        errorHandling: 'Обработка грешки',
        security: 'Сигурност',
        performance: 'Производителност',
      },
    },
    chronos: {
      title: '⏰ Chronos двигател',
      subtitle: 'mm.chronos(options) → ChronosResult',
      description: 'Дебъгване с пътуване във времето: Записва моментни снимки по време на изпълнение.',
      intervalLabel: 'Интервал на снимки (ms)',
      maxSnapshotsLabel: 'Макс. снимки',
      runButton: '▶️ Започни запис',
    },
    thermal: {
      title: '🌡️ Термален пул',
      subtitle: 'ThermalAwarePool - Управление на CPU температура',
      description: 'Автоматично регулира паралелизма според температурата на процесора.',
      states: {
        cool: '🟢 ХЛАДНО',
        warm: '🔵 ТОПЛО',
        hot: '🟠 ГОРЕЩО',
        critical: '🔴 КРИТИЧНО',
      },
      temperature: 'Температура',
      maxInstances: 'Макс. инстанции',
    },
    docker: {
      title: '🐳 Docker мениджър',
      subtitle: 'DockerManager - Selenium Grid оркестрация',
      description: 'Автоматично генерира Dockerfile и docker-compose.yml за Selenium Grid.',
    },
    swarm: {
      title: '🎖️ Swarm командир',
      subtitle: 'SwarmCommander - Commander-Soldier шаблон',
      description: 'Командирът разпределя задачите между войниците (browser instances) за паралелно изпълнение.',
    },
    tts: {
      title: '🔊 Български TTS',
      subtitle: 'BulgarianTTS - Роден текст-към-реч',
      description: '🇧🇬 Български текст-към-реч за гласова обратна връзка по време на тестове.',
      templates: {
        testPassed: '"Тестът премина успешно"',
        testFailed: '"Тестът се провали"',
        errorFound: '"Открих грешка в {element}"',
        healing: '"Намерих нов селектор"',
      },
    },
    license: {
      title: '🔐 Лицензен мениджър',
      subtitle: 'LicenseManager - Хардуерно заключен лиценз',
      description: 'Лицензът се привързва към хардуера с SHA-256 отпечатък.',
      types: {
        trial: 'Пробен',
        professional: 'Професионален',
        enterprise: 'Ентърпрайз',
        sovereign: 'Суверен',
      },
      maxInstances: 'Макс. инстанции',
      features: 'Функции',
    },
    stats: {
      title: '📊 Системна статистика',
      subtitle: 'getSystemStats() → Statistics',
      version: 'Версия',
      linesOfCode: 'Редове код',
      typescriptFiles: 'TypeScript файлове',
      testsPassing: 'Минаващи тестове',
      enterpriseModules: 'Enterprise модули',
      codename: 'Кодово име',
    },
    logger: {
      title: '📋 Структуриран логър',
      subtitle: 'mm.getLogger() → Logger',
      description: 'Професионално логване с нива: debug, info, warn, error, audit',
    },
  },
  status: {
    systemStatus: '📡 Системен статус',
    backend: 'Backend',
    license: 'Лиценз',
    circuitBreaker: 'Circuit Breaker',
    online: 'Онлайн',
    offline: 'Офлайн',
    closed: 'Затворен',
    open: 'Отворен',
    cpuTemperature: '🌡️ CPU температура',
    state: 'Състояние:',
    financialOracle: '💰 Финансов оракул',
    totalCost: 'Общи разходи',
    requests: 'Заявки',
    budgetLeft: 'Оставащ бюджет',
    activityLog: '📜 Дневник на активността',
    waitingForActivity: 'Изчакване на активност...',
    checking: 'Проверка...',
    freeTier: 'Безплатен план',
  },
  common: {
    loading: 'Зареждане...',
    processing: 'Обработка...',
    complete: 'Завършено!',
    error: 'Грешка',
    success: 'Успех',
    warning: 'Предупреждение',
    opened: 'Отворено:',
    initialized: 'MisterMind v23.0.0 UI инициализиран',
    madeInBulgaria: '🇧🇬 Направено с ❤️ в България',
  },
  footer: {
    copyright: '© 2025 Димитър Продромов',
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// ENGLISH TRANSLATIONS
// ══════════════════════════════════════════════════════════════════════════════

export const en: I18nTranslations = {
  header: {
    title: 'MISTER MIND',
    codename: 'v23.0.0 "The Local Sovereign"',
    lines: 'Lines:',
    tests: 'Tests:',
    modules: 'Modules:',
  },
  sidebar: {
    freeFeatures: '🆓 Free Features',
    proFeatures: '💎 Pro Features',
    enterprise: '🏢 Enterprise',
    utilities: '🛠️ Utilities',
  },
  modules: {
    websiteAudit: 'Website Audit',
    apiTest: 'API Test',
    linkChecker: 'Link Checker',
    predictionMatrix: 'Prediction Matrix',
    apiSensei: 'API Sensei',
    chronosEngine: 'Chronos Engine',
    thermalPool: 'Thermal Pool',
    dockerManager: 'Docker Manager',
    swarmCommander: 'Swarm Commander',
    bulgarianTts: 'Bulgarian TTS',
    licenseManager: 'License Manager',
    systemStats: 'System Stats',
    logger: 'Logger',
  },
  badges: {
    free: 'FREE',
    pro: 'PRO',
    proRequired: 'PRO LICENSE REQUIRED',
  },
  panels: {
    audit: {
      title: '🔍 Website Audit',
      subtitle: 'mm.audit(url) → AuditResult',
      urlLabel: 'URL to Audit',
      runButton: '▶️ Run Audit',
      performance: 'Performance',
      accessibility: 'Accessibility',
      seo: 'SEO',
    },
    apiTest: {
      title: '🌐 API Test',
      subtitle: 'mm.testAPI(endpoint, options) → APITestResult',
      endpointLabel: 'API Endpoint',
      methodLabel: 'Method',
      runButton: '▶️ Test API',
    },
    linkChecker: {
      title: '🔗 Link Checker',
      subtitle: 'mm.checkLinks(url, options) → CheckLinksResult',
      urlLabel: 'Page URL',
      maxLinksLabel: 'Max Links to Check',
      runButton: '▶️ Check Links',
    },
    prediction: {
      title: '🔮 Prediction Matrix',
      subtitle: 'mm.predict(options) → PredictionResult',
      codeLabel: 'Code Changes (diff or content)',
      runButton: '▶️ Analyze & Predict',
      description: 'Analyzes code changes and predicts potential test failures.',
    },
    apiSensei: {
      title: '🤖 API Sensei',
      subtitle: 'mm.apiSensei(config) → APISenseiResult',
      baseUrlLabel: 'Base API URL',
      scenariosLabel: 'Test Scenarios',
      runButton: '▶️ Generate & Run Tests',
      scenarios: {
        happyPath: 'Happy Path',
        edgeCases: 'Edge Cases',
        errorHandling: 'Error Handling',
        security: 'Security',
        performance: 'Performance',
      },
    },
    chronos: {
      title: '⏰ Chronos Engine',
      subtitle: 'mm.chronos(options) → ChronosResult',
      description: 'Time-travel debugging: Records state snapshots during test execution.',
      intervalLabel: 'Snapshot Interval (ms)',
      maxSnapshotsLabel: 'Max Snapshots',
      runButton: '▶️ Start Recording',
    },
    thermal: {
      title: '🌡️ Thermal-Aware Pool',
      subtitle: 'ThermalAwarePool - CPU temperature management',
      description: 'Automatically adjusts parallelism based on CPU temperature to prevent throttling.',
      states: {
        cool: '🟢 COOL',
        warm: '🔵 WARM',
        hot: '🟠 HOT',
        critical: '🔴 CRITICAL',
      },
      temperature: 'Temperature',
      maxInstances: 'Max Instances',
    },
    docker: {
      title: '🐳 Docker Manager',
      subtitle: 'DockerManager - Selenium Grid orchestration',
      description: 'Auto-generates Dockerfile and docker-compose.yml for Selenium Grid.',
    },
    swarm: {
      title: '🎖️ Swarm Commander',
      subtitle: 'SwarmCommander - Commander-Soldier pattern',
      description: 'Commander distributes tasks to soldiers (browser instances) for parallel execution.',
    },
    tts: {
      title: '🔊 Bulgarian TTS',
      subtitle: 'BulgarianTTS - Native text-to-speech',
      description: '🇧🇬 Български текст-към-реч за гласова обратна връзка по време на тестове.',
      templates: {
        testPassed: '"Тестът премина успешно"',
        testFailed: '"Тестът се провали"',
        errorFound: '"Открих грешка в {element}"',
        healing: '"Намерих нов селектор"',
      },
    },
    license: {
      title: '🔐 License Manager',
      subtitle: 'LicenseManager - Hardware-locked licensing',
      description: 'License is bound to hardware using SHA-256 fingerprint.',
      types: {
        trial: 'Trial',
        professional: 'Professional',
        enterprise: 'Enterprise',
        sovereign: 'Sovereign',
      },
      maxInstances: 'Max Instances',
      features: 'Features',
    },
    stats: {
      title: '📊 System Stats',
      subtitle: 'getSystemStats() → Statistics',
      version: 'Version',
      linesOfCode: 'Lines of Code',
      typescriptFiles: 'TypeScript Files',
      testsPassing: 'Tests Passing',
      enterpriseModules: 'Enterprise Modules',
      codename: 'Codename',
    },
    logger: {
      title: '📋 Structured Logger',
      subtitle: 'mm.getLogger() → Logger',
      description: 'Professional logging with levels: debug, info, warn, error, audit',
    },
  },
  status: {
    systemStatus: '📡 System Status',
    backend: 'Backend',
    license: 'License',
    circuitBreaker: 'Circuit Breaker',
    online: 'Online',
    offline: 'Offline',
    closed: 'Closed',
    open: 'Open',
    cpuTemperature: '🌡️ CPU Temperature',
    state: 'State:',
    financialOracle: '💰 Financial Oracle',
    totalCost: 'Total Cost',
    requests: 'Requests',
    budgetLeft: 'Budget Left',
    activityLog: '📜 Activity Log',
    waitingForActivity: 'Waiting for activity...',
    checking: 'Checking...',
    freeTier: 'Free Tier',
  },
  common: {
    loading: 'Loading...',
    processing: 'Processing...',
    complete: 'Complete!',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    opened: 'Opened:',
    initialized: 'MisterMind v23.0.0 UI initialized',
    madeInBulgaria: '🇧🇬 Made with ❤️ in Bulgaria',
  },
  footer: {
    copyright: '© 2025 Dimitar Prodromov',
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// GERMAN TRANSLATIONS
// ══════════════════════════════════════════════════════════════════════════════

export const de: I18nTranslations = {
  header: {
    title: 'MISTER MIND',
    codename: 'v23.0.0 "Der Lokale Souverän"',
    lines: 'Zeilen:',
    tests: 'Tests:',
    modules: 'Module:',
  },
  sidebar: {
    freeFeatures: '🆓 Kostenlose Funktionen',
    proFeatures: '💎 Pro-Funktionen',
    enterprise: '🏢 Unternehmen',
    utilities: '🛠️ Werkzeuge',
  },
  modules: {
    websiteAudit: 'Website-Audit',
    apiTest: 'API-Test',
    linkChecker: 'Link-Prüfer',
    predictionMatrix: 'Vorhersage-Matrix',
    apiSensei: 'API Sensei',
    chronosEngine: 'Chronos-Motor',
    thermalPool: 'Thermal-Pool',
    dockerManager: 'Docker-Manager',
    swarmCommander: 'Schwarm-Kommandant',
    bulgarianTts: 'Bulgarische TTS',
    licenseManager: 'Lizenz-Manager',
    systemStats: 'Systemstatistik',
    logger: 'Logger',
  },
  badges: {
    free: 'KOSTENLOS',
    pro: 'PRO',
    proRequired: 'PRO-LIZENZ ERFORDERLICH',
  },
  panels: {
    audit: {
      title: '🔍 Website-Audit',
      subtitle: 'mm.audit(url) → AuditResult',
      urlLabel: 'URL zum Prüfen',
      runButton: '▶️ Audit starten',
      performance: 'Leistung',
      accessibility: 'Barrierefreiheit',
      seo: 'SEO',
    },
    apiTest: {
      title: '🌐 API-Test',
      subtitle: 'mm.testAPI(endpoint, options) → APITestResult',
      endpointLabel: 'API-Endpunkt',
      methodLabel: 'Methode',
      runButton: '▶️ API testen',
    },
    linkChecker: {
      title: '🔗 Link-Prüfer',
      subtitle: 'mm.checkLinks(url, options) → CheckLinksResult',
      urlLabel: 'Seiten-URL',
      maxLinksLabel: 'Max. zu prüfende Links',
      runButton: '▶️ Links prüfen',
    },
    prediction: {
      title: '🔮 Vorhersage-Matrix',
      subtitle: 'mm.predict(options) → PredictionResult',
      codeLabel: 'Code-Änderungen (Diff oder Inhalt)',
      runButton: '▶️ Analysieren & Vorhersagen',
      description: 'Analysiert Code-Änderungen und sagt potenzielle Testfehler voraus.',
    },
    apiSensei: {
      title: '🤖 API Sensei',
      subtitle: 'mm.apiSensei(config) → APISenseiResult',
      baseUrlLabel: 'Basis-API-URL',
      scenariosLabel: 'Testszenarien',
      runButton: '▶️ Tests generieren & ausführen',
      scenarios: {
        happyPath: 'Idealer Pfad',
        edgeCases: 'Grenzfälle',
        errorHandling: 'Fehlerbehandlung',
        security: 'Sicherheit',
        performance: 'Leistung',
      },
    },
    chronos: {
      title: '⏰ Chronos-Motor',
      subtitle: 'mm.chronos(options) → ChronosResult',
      description: 'Zeitreise-Debugging: Zeichnet Zustandsschnappschüsse während der Testausführung auf.',
      intervalLabel: 'Schnappschuss-Intervall (ms)',
      maxSnapshotsLabel: 'Max. Schnappschüsse',
      runButton: '▶️ Aufnahme starten',
    },
    thermal: {
      title: '🌡️ Thermalbewusster Pool',
      subtitle: 'ThermalAwarePool - CPU-Temperaturverwaltung',
      description: 'Passt die Parallelität automatisch basierend auf der CPU-Temperatur an.',
      states: {
        cool: '🟢 KÜHL',
        warm: '🔵 WARM',
        hot: '🟠 HEIß',
        critical: '🔴 KRITISCH',
      },
      temperature: 'Temperatur',
      maxInstances: 'Max. Instanzen',
    },
    docker: {
      title: '🐳 Docker-Manager',
      subtitle: 'DockerManager - Selenium Grid-Orchestrierung',
      description: 'Generiert automatisch Dockerfile und docker-compose.yml für Selenium Grid.',
    },
    swarm: {
      title: '🎖️ Schwarm-Kommandant',
      subtitle: 'SwarmCommander - Kommandant-Soldat-Muster',
      description: 'Der Kommandant verteilt Aufgaben an Soldaten (Browser-Instanzen) zur parallelen Ausführung.',
    },
    tts: {
      title: '🔊 Bulgarische TTS',
      subtitle: 'BulgarianTTS - Native Sprachsynthese',
      description: '🇧🇬 Български текст-към-реч за гласова обратна връзка по време на тестове.',
      templates: {
        testPassed: '"Тестът премина успешно"',
        testFailed: '"Тестът се провали"',
        errorFound: '"Открих грешка в {element}"',
        healing: '"Намерих нов селектор"',
      },
    },
    license: {
      title: '🔐 Lizenz-Manager',
      subtitle: 'LicenseManager - Hardware-gebundene Lizenzierung',
      description: 'Lizenz ist mit SHA-256-Fingerabdruck an Hardware gebunden.',
      types: {
        trial: 'Testversion',
        professional: 'Professionell',
        enterprise: 'Unternehmen',
        sovereign: 'Souverän',
      },
      maxInstances: 'Max. Instanzen',
      features: 'Funktionen',
    },
    stats: {
      title: '📊 Systemstatistik',
      subtitle: 'getSystemStats() → Statistics',
      version: 'Version',
      linesOfCode: 'Codezeilen',
      typescriptFiles: 'TypeScript-Dateien',
      testsPassing: 'Erfolgreiche Tests',
      enterpriseModules: 'Enterprise-Module',
      codename: 'Codename',
    },
    logger: {
      title: '📋 Strukturierter Logger',
      subtitle: 'mm.getLogger() → Logger',
      description: 'Professionelles Logging mit Stufen: debug, info, warn, error, audit',
    },
  },
  status: {
    systemStatus: '📡 Systemstatus',
    backend: 'Backend',
    license: 'Lizenz',
    circuitBreaker: 'Circuit Breaker',
    online: 'Online',
    offline: 'Offline',
    closed: 'Geschlossen',
    open: 'Offen',
    cpuTemperature: '🌡️ CPU-Temperatur',
    state: 'Zustand:',
    financialOracle: '💰 Finanz-Orakel',
    totalCost: 'Gesamtkosten',
    requests: 'Anfragen',
    budgetLeft: 'Restbudget',
    activityLog: '📜 Aktivitätsprotokoll',
    waitingForActivity: 'Warte auf Aktivität...',
    checking: 'Prüfe...',
    freeTier: 'Kostenlose Stufe',
  },
  common: {
    loading: 'Lädt...',
    processing: 'Verarbeitung...',
    complete: 'Abgeschlossen!',
    error: 'Fehler',
    success: 'Erfolg',
    warning: 'Warnung',
    opened: 'Geöffnet:',
    initialized: 'MisterMind v23.0.0 UI initialisiert',
    madeInBulgaria: '🇧🇬 Mit ❤️ in Bulgarien hergestellt',
  },
  footer: {
    copyright: '© 2025 Dimitar Prodromow',
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// FRENCH TRANSLATIONS
// ══════════════════════════════════════════════════════════════════════════════

export const fr: I18nTranslations = {
  header: {
    title: 'MISTER MIND',
    codename: 'v23.0.0 "Le Souverain Local"',
    lines: 'Lignes:',
    tests: 'Tests:',
    modules: 'Modules:',
  },
  sidebar: {
    freeFeatures: '🆓 Fonctionnalités gratuites',
    proFeatures: '💎 Fonctionnalités Pro',
    enterprise: '🏢 Entreprise',
    utilities: '🛠️ Utilitaires',
  },
  modules: {
    websiteAudit: 'Audit de site',
    apiTest: 'Test API',
    linkChecker: 'Vérificateur de liens',
    predictionMatrix: 'Matrice de prédiction',
    apiSensei: 'API Sensei',
    chronosEngine: 'Moteur Chronos',
    thermalPool: 'Pool thermique',
    dockerManager: 'Gestionnaire Docker',
    swarmCommander: 'Commandant d\'essaim',
    bulgarianTts: 'TTS Bulgare',
    licenseManager: 'Gestionnaire de licence',
    systemStats: 'Statistiques système',
    logger: 'Journal',
  },
  badges: {
    free: 'GRATUIT',
    pro: 'PRO',
    proRequired: 'LICENCE PRO REQUISE',
  },
  panels: {
    audit: {
      title: '🔍 Audit de site web',
      subtitle: 'mm.audit(url) → AuditResult',
      urlLabel: 'URL à auditer',
      runButton: '▶️ Lancer l\'audit',
      performance: 'Performance',
      accessibility: 'Accessibilité',
      seo: 'SEO',
    },
    apiTest: {
      title: '🌐 Test API',
      subtitle: 'mm.testAPI(endpoint, options) → APITestResult',
      endpointLabel: 'Point de terminaison API',
      methodLabel: 'Méthode',
      runButton: '▶️ Tester l\'API',
    },
    linkChecker: {
      title: '🔗 Vérificateur de liens',
      subtitle: 'mm.checkLinks(url, options) → CheckLinksResult',
      urlLabel: 'URL de la page',
      maxLinksLabel: 'Liens max. à vérifier',
      runButton: '▶️ Vérifier les liens',
    },
    prediction: {
      title: '🔮 Matrice de prédiction',
      subtitle: 'mm.predict(options) → PredictionResult',
      codeLabel: 'Modifications de code (diff ou contenu)',
      runButton: '▶️ Analyser et prédire',
      description: 'Analyse les modifications de code et prédit les échecs de test potentiels.',
    },
    apiSensei: {
      title: '🤖 API Sensei',
      subtitle: 'mm.apiSensei(config) → APISenseiResult',
      baseUrlLabel: 'URL API de base',
      scenariosLabel: 'Scénarios de test',
      runButton: '▶️ Générer et exécuter les tests',
      scenarios: {
        happyPath: 'Chemin idéal',
        edgeCases: 'Cas limites',
        errorHandling: 'Gestion des erreurs',
        security: 'Sécurité',
        performance: 'Performance',
      },
    },
    chronos: {
      title: '⏰ Moteur Chronos',
      subtitle: 'mm.chronos(options) → ChronosResult',
      description: 'Débogage temporel: Enregistre des instantanés d\'état pendant l\'exécution des tests.',
      intervalLabel: 'Intervalle d\'instantané (ms)',
      maxSnapshotsLabel: 'Instantanés max.',
      runButton: '▶️ Démarrer l\'enregistrement',
    },
    thermal: {
      title: '🌡️ Pool thermique',
      subtitle: 'ThermalAwarePool - Gestion de la température CPU',
      description: 'Ajuste automatiquement le parallélisme en fonction de la température du processeur.',
      states: {
        cool: '🟢 FRAIS',
        warm: '🔵 TIÈDE',
        hot: '🟠 CHAUD',
        critical: '🔴 CRITIQUE',
      },
      temperature: 'Température',
      maxInstances: 'Instances max.',
    },
    docker: {
      title: '🐳 Gestionnaire Docker',
      subtitle: 'DockerManager - Orchestration Selenium Grid',
      description: 'Génère automatiquement Dockerfile et docker-compose.yml pour Selenium Grid.',
    },
    swarm: {
      title: '🎖️ Commandant d\'essaim',
      subtitle: 'SwarmCommander - Modèle Commandant-Soldat',
      description: 'Le commandant distribue les tâches aux soldats (instances de navigateur) pour l\'exécution parallèle.',
    },
    tts: {
      title: '🔊 TTS Bulgare',
      subtitle: 'BulgarianTTS - Synthèse vocale native',
      description: '🇧🇬 Български текст-към-реч за гласова обратна връзка по време на тестове.',
      templates: {
        testPassed: '"Тестът премина успешно"',
        testFailed: '"Тестът се провали"',
        errorFound: '"Открих грешка в {element}"',
        healing: '"Намерих нов селектор"',
      },
    },
    license: {
      title: '🔐 Gestionnaire de licence',
      subtitle: 'LicenseManager - Licence liée au matériel',
      description: 'La licence est liée au matériel avec une empreinte SHA-256.',
      types: {
        trial: 'Essai',
        professional: 'Professionnel',
        enterprise: 'Entreprise',
        sovereign: 'Souverain',
      },
      maxInstances: 'Instances max.',
      features: 'Fonctionnalités',
    },
    stats: {
      title: '📊 Statistiques système',
      subtitle: 'getSystemStats() → Statistics',
      version: 'Version',
      linesOfCode: 'Lignes de code',
      typescriptFiles: 'Fichiers TypeScript',
      testsPassing: 'Tests réussis',
      enterpriseModules: 'Modules Enterprise',
      codename: 'Nom de code',
    },
    logger: {
      title: '📋 Journal structuré',
      subtitle: 'mm.getLogger() → Logger',
      description: 'Journalisation professionnelle avec niveaux: debug, info, warn, error, audit',
    },
  },
  status: {
    systemStatus: '📡 État du système',
    backend: 'Backend',
    license: 'Licence',
    circuitBreaker: 'Disjoncteur',
    online: 'En ligne',
    offline: 'Hors ligne',
    closed: 'Fermé',
    open: 'Ouvert',
    cpuTemperature: '🌡️ Température CPU',
    state: 'État:',
    financialOracle: '💰 Oracle financier',
    totalCost: 'Coût total',
    requests: 'Requêtes',
    budgetLeft: 'Budget restant',
    activityLog: '📜 Journal d\'activité',
    waitingForActivity: 'En attente d\'activité...',
    checking: 'Vérification...',
    freeTier: 'Niveau gratuit',
  },
  common: {
    loading: 'Chargement...',
    processing: 'Traitement...',
    complete: 'Terminé!',
    error: 'Erreur',
    success: 'Succès',
    warning: 'Avertissement',
    opened: 'Ouvert:',
    initialized: 'MisterMind v23.0.0 UI initialisé',
    madeInBulgaria: '🇧🇬 Fait avec ❤️ en Bulgarie',
  },
  footer: {
    copyright: '© 2025 Dimitar Prodromov',
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// I18N MANAGER CLASS
// ══════════════════════════════════════════════════════════════════════════════

export class I18nManager {
  private currentLanguage: SupportedLanguage = 'en';
  private translations: Record<SupportedLanguage, I18nTranslations> = { bg, en, de, fr };
  private listeners: Array<(lang: SupportedLanguage) => void> = [];
  
  constructor(initialLanguage: SupportedLanguage = 'en') {
    this.currentLanguage = initialLanguage;
  }
  
  /**
   * Get current language
   */
  getLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }
  
  /**
   * Set language and notify listeners
   */
  setLanguage(lang: SupportedLanguage): void {
    if (this.translations[lang]) {
      this.currentLanguage = lang;
      this.listeners.forEach(listener => listener(lang));
    }
  }
  
  /**
   * Get current translations object
   */
  t(): I18nTranslations {
    return this.translations[this.currentLanguage];
  }
  
  /**
   * Get translation by dot-notation path
   * Example: i18n.get('header.title') returns 'MISTER MIND'
   */
  get(path: string): string {
    const keys = path.split('.');
    let value: unknown = this.translations[this.currentLanguage];
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = (value as Record<string, unknown>)[key];
      } else {
        return path; // Return path if translation not found
      }
    }
    
    return typeof value === 'string' ? value : path;
  }
  
  /**
   * Subscribe to language changes
   */
  onLanguageChange(callback: (lang: SupportedLanguage) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }
  
  /**
   * Get all supported languages with their display names
   */
  getSupportedLanguages(): Array<{ code: SupportedLanguage; name: string; flag: string }> {
    return [
      { code: 'bg', name: 'Български', flag: '🇧🇬' },
      { code: 'en', name: 'English', flag: '🇬🇧' },
      { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
      { code: 'fr', name: 'Français', flag: '🇫🇷' },
    ];
  }
  
  /**
   * Detect browser language and return closest supported language
   */
  detectBrowserLanguage(): SupportedLanguage {
    if (typeof navigator === 'undefined') return 'en';
    
    const browserLang = navigator.language.toLowerCase().slice(0, 2);
    if (browserLang in this.translations) {
      return browserLang as SupportedLanguage;
    }
    return 'en';
  }
  
  /**
   * Export translations for use in browser
   */
  static getTranslationsJSON(): string {
    return JSON.stringify({ bg, en, de, fr });
  }
}

// Export singleton instance
export const i18n = new I18nManager();

// Export all translations for direct use
export const translations = { bg, en, de, fr };
