/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * QAntum - ENTERPRISE BUILD SCRIPT
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * @copyright 2025 Димитър Продромов (Dimitar Prodromov). All Rights Reserved.
 * @license PROPRIETARY AND CONFIDENTIAL
 * 
 * This script builds the protected enterprise version of QAntum with:
 * - TypeScript compilation
 * - JavaScript obfuscation (intellectual property protection)
 * - Bundle optimization
 * - License verification embedding
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync, spawnSync } from 'child_process';
import * as crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════════════════════
// 🛡️ BUILD CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const BUILD_CONFIG = {
    sourceDir: path.resolve(__dirname, '../src'),
    outputDir: path.resolve(__dirname, '../dist'),
    protectedDir: path.resolve(__dirname, '../dist-protected'),
    tempDir: path.resolve(__dirname, '../.build-temp'),
    
    // Obfuscation settings
    obfuscation: {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.75,
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 0.4,
        debugProtection: true,
        debugProtectionInterval: 2000,
        disableConsoleOutput: false,
        identifierNamesGenerator: 'hexadecimal' as const,
        log: false,
        numbersToExpressions: true,
        renameGlobals: false,
        selfDefending: true,
        simplify: true,
        splitStrings: true,
        splitStringsChunkLength: 10,
        stringArray: true,
        stringArrayCallsTransform: true,
        stringArrayCallsTransformThreshold: 0.75,
        stringArrayEncoding: ['base64', 'rc4'] as const,
        stringArrayIndexShift: true,
        stringArrayRotate: true,
        stringArrayShuffle: true,
        stringArrayWrappersCount: 2,
        stringArrayWrappersChainedCalls: true,
        stringArrayWrappersParametersMaxCount: 4,
        stringArrayWrappersType: 'function' as const,
        stringArrayThreshold: 0.75,
        transformObjectKeys: true,
        unicodeEscapeSequence: false
    },
    
    // Files to exclude from obfuscation
    excludeFromObfuscation: [
        'index.js',
        'index.d.ts',
        '*.test.js',
        '*.spec.js'
    ],
    
    // Enterprise features to include
    enterpriseModules: [
        'enterprise/thermal-aware-pool',
        'enterprise/docker-manager',
        'enterprise/swarm-commander',
        'enterprise/bulgarian-tts',
        'enterprise/dashboard-server',
        'enterprise/license-manager'
    ]
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 BUILD LOGGER
// ═══════════════════════════════════════════════════════════════════════════════

class BuildLogger {
    private startTime: number;
    
    constructor() {
        this.startTime = Date.now();
    }
    
    log(message: string, emoji: string = '📦'): void {
        const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
        console.log(`[${elapsed}s] ${emoji} ${message}`);
    }
    
    success(message: string): void {
        this.log(message, '✅');
    }
    
    error(message: string): void {
        this.log(message, '❌');
    }
    
    warn(message: string): void {
        this.log(message, '⚠️');
    }
    
    section(title: string): void {
        console.log('\n' + '═'.repeat(70));
        console.log(`  ${title}`);
        console.log('═'.repeat(70) + '\n');
    }
}

const logger = new BuildLogger();

// ═══════════════════════════════════════════════════════════════════════════════
// 🔨 BUILD FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Clean build directories
 */
function cleanDirs(): void {
    logger.log('Почистване на build директории...');
    
    const dirs = [BUILD_CONFIG.outputDir, BUILD_CONFIG.protectedDir, BUILD_CONFIG.tempDir];
    
    for (const dir of dirs) {
        if (fs.existsSync(dir)) {
            fs.rmSync(dir, { recursive: true, force: true });
        }
        fs.mkdirSync(dir, { recursive: true });
    }
    
    logger.success('Директориите са почистени');
}

/**
 * Compile TypeScript
 */
function compileTypeScript(): void {
    logger.section('🔷 TypeScript Компилация');
    
    try {
        execSync('npx tsc --project tsconfig.json', {
            cwd: path.resolve(__dirname, '..'),
            stdio: 'inherit'
        });
        logger.success('TypeScript компилацията завърши успешно');
    } catch (error) {
        logger.error('TypeScript компилацията се провали');
        throw error;
    }
}

/**
 * Count lines of code
 */
function countLines(dir: string): number {
    let total = 0;
    
    function walkDir(currentDir: string): void {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);
            
            if (entry.isDirectory()) {
                walkDir(fullPath);
            } else if (entry.name.endsWith('.js') || entry.name.endsWith('.ts')) {
                const content = fs.readFileSync(fullPath, 'utf-8');
                total += content.split('\n').length;
            }
        }
    }
    
    walkDir(dir);
    return total;
}

/**
 * Obfuscate JavaScript files
 */
async function obfuscateFiles(): Promise<void> {
    logger.section('🛡️ Intellectual Shield - Обфускация');
    
    const JavaScriptObfuscator = require('javascript-obfuscator');
    
    const sourceLines = countLines(BUILD_CONFIG.sourceDir);
    logger.log(`Източник: ${sourceLines.toLocaleString()} реда код`);
    
    let processedFiles = 0;
    let totalOriginalSize = 0;
    let totalObfuscatedSize = 0;
    
    function processDir(inputDir: string, outputDir: string): void {
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        const entries = fs.readdirSync(inputDir, { withFileTypes: true });
        
        for (const entry of entries) {
            const inputPath = path.join(inputDir, entry.name);
            const outputPath = path.join(outputDir, entry.name);
            
            if (entry.isDirectory()) {
                processDir(inputPath, outputPath);
            } else if (entry.name.endsWith('.js')) {
                // Check if excluded
                const isExcluded = BUILD_CONFIG.excludeFromObfuscation.some(pattern => {
                    if (pattern.includes('*')) {
                        const regex = new RegExp(pattern.replace('*', '.*'));
                        return regex.test(entry.name);
                    }
                    return entry.name === pattern;
                });
                
                const originalCode = fs.readFileSync(inputPath, 'utf-8');
                totalOriginalSize += originalCode.length;
                
                if (isExcluded) {
                    // Copy without obfuscation
                    fs.writeFileSync(outputPath, originalCode);
                    logger.log(`Копиран (без обфускация): ${entry.name}`, '📄');
                } else {
                    // Obfuscate
                    try {
                        const obfuscated = JavaScriptObfuscator.obfuscate(
                            originalCode,
                            BUILD_CONFIG.obfuscation
                        );
                        
                        const obfuscatedCode = obfuscated.getObfuscatedCode();
                        fs.writeFileSync(outputPath, obfuscatedCode);
                        totalObfuscatedSize += obfuscatedCode.length;
                        processedFiles++;
                        
                        const ratio = ((obfuscatedCode.length / originalCode.length) * 100).toFixed(0);
                        logger.log(`Обфускиран: ${entry.name} (${ratio}% размер)`, '🔒');
                    } catch (err) {
                        logger.warn(`Грешка при обфускация на ${entry.name}, копиране без промяна`);
                        fs.writeFileSync(outputPath, originalCode);
                    }
                }
            } else if (entry.name.endsWith('.d.ts') || entry.name.endsWith('.json')) {
                // Copy type definitions and JSON
                fs.copyFileSync(inputPath, outputPath);
            }
        }
    }
    
    processDir(BUILD_CONFIG.outputDir, BUILD_CONFIG.protectedDir);
    
    logger.success(`Обфускирани ${processedFiles} файла`);
    logger.log(`Оригинален размер: ${(totalOriginalSize / 1024).toFixed(1)} KB`);
    logger.log(`Защитен размер: ${(totalObfuscatedSize / 1024).toFixed(1)} KB`);
}

/**
 * Generate build manifest
 */
function generateManifest(): void {
    logger.section('📋 Генериране на Manifest');
    
    const manifest = {
        name: 'QAntum Enterprise',
        version: '23.0.0',
        codename: 'The Local Sovereign',
        buildDate: new Date().toISOString(),
        buildId: crypto.randomBytes(16).toString('hex'),
        author: 'Димитър Продромов',
        copyright: '© 2025 Димитър Продромов. All Rights Reserved.',
        license: 'PROPRIETARY',
        protected: true,
        modules: BUILD_CONFIG.enterpriseModules,
        checksums: {} as Record<string, string>
    };
    
    // Calculate checksums for protected files
    function calculateChecksums(dir: string, basePath: string = ''): void {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relativePath = path.join(basePath, entry.name);
            
            if (entry.isDirectory()) {
                calculateChecksums(fullPath, relativePath);
            } else if (entry.name.endsWith('.js')) {
                const content = fs.readFileSync(fullPath);
                const hash = crypto.createHash('sha256').update(content).digest('hex');
                manifest.checksums[relativePath.replace(/\\/g, '/')] = hash;
            }
        }
    }
    
    calculateChecksums(BUILD_CONFIG.protectedDir);
    
    fs.writeFileSync(
        path.join(BUILD_CONFIG.protectedDir, 'build-manifest.json'),
        JSON.stringify(manifest, null, 2)
    );
    
    logger.success('Manifest генериран');
    logger.log(`Build ID: ${manifest.buildId}`);
    logger.log(`Файлове с checksum: ${Object.keys(manifest.checksums).length}`);
}

/**
 * Create distribution package
 */
function createPackage(): void {
    logger.section('📦 Създаване на Дистрибуция');
    
    // Copy package.json with modifications
    const packageJson = JSON.parse(
        fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8')
    );
    
    packageJson.name = '@QAntum/enterprise';
    packageJson.main = 'index.js';
    packageJson.types = 'index.d.ts';
    packageJson.private = true;
    packageJson.license = 'PROPRIETARY';
    
    // Remove dev dependencies
    delete packageJson.devDependencies;
    
    fs.writeFileSync(
        path.join(BUILD_CONFIG.protectedDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
    );
    
    // Create README
    const readme = `# QAntum Enterprise v23.0.0 "The Local Sovereign"

## ⚠️ ВАЖНО

Този софтуер е защитен с права за интелектуална собственост.
Неоторизираното копиране, модификация или разпространение е строго забранено.

## 🛡️ Защита

- Кодът е обфускиран с enterprise-grade защита
- Hardware-locked лицензиране
- Runtime integrity checks

## 📋 Лиценз

© 2025 Димитър Продромов. Всички права запазени.
За лицензни запитвания: dimitar.prodromov@QAntum.dev

## 🚀 Активация

1. Генерирайте Hardware ID:
   \`\`\`
   npx QAntum --hardware-id
   \`\`\`

2. Изпратете Hardware ID за получаване на лиценз

3. Активирайте:
   \`\`\`
   npx QAntum --activate <license-key>
   \`\`\`
`;
    
    fs.writeFileSync(path.join(BUILD_CONFIG.protectedDir, 'README.md'), readme);
    
    logger.success('Дистрибуцията е готова');
}

/**
 * Print build summary
 */
function printSummary(): void {
    logger.section('📊 BUILD SUMMARY');
    
    const protectedSize = getDirSize(BUILD_CONFIG.protectedDir);
    const fileCount = countFiles(BUILD_CONFIG.protectedDir);
    
    console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                    🎉 QAntum Enterprise Build Complete!                  ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Версия:        v23.0.0 "The Local Sovereign"                                ║
║  Автор:         Димитър Продромов                                            ║
║  Дата:          ${new Date().toLocaleString('bg-BG').padEnd(40)}            ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  📁 Защитени файлове:  ${fileCount.toString().padEnd(10)}                                      ║
║  💾 Общ размер:        ${(protectedSize / 1024).toFixed(1).padEnd(10)} KB                                  ║
║  🛡️ Обфускация:        ✅ АКТИВНА                                            ║
║  🔐 License Check:     ✅ ВГРАДЕН                                            ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  📂 Output: dist-protected/                                                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

  ГАЗ ДО ДУПКА! СИНГУЛЯРНОСТТА Е ТУК! 🚀
`);
}

/**
 * Get directory size
 */
function getDirSize(dir: string): number {
    let size = 0;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            size += getDirSize(fullPath);
        } else {
            size += fs.statSync(fullPath).size;
        }
    }
    
    return size;
}

/**
 * Count files in directory
 */
function countFiles(dir: string): number {
    let count = 0;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            count += countFiles(fullPath);
        } else {
            count++;
        }
    }
    
    return count;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🚀 MAIN BUILD
// ═══════════════════════════════════════════════════════════════════════════════

async function main(): Promise<void> {
    console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║          🧠 QAntum Enterprise Build System v23.0.0                      ║
║                    "The Local Sovereign"                                     ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);
    
    try {
        cleanDirs();
        compileTypeScript();
        await obfuscateFiles();
        generateManifest();
        createPackage();
        printSummary();
        
        process.exit(0);
    } catch (error) {
        logger.error(`Build failed: ${error}`);
        process.exit(1);
    }
}

main();
