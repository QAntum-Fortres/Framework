/**
 * ╔═══════════════════════════════════════════════════════════════════════════════════════╗
 * ║                     QANTUM NERVE CENTER - MODULE API TESTS                            ║
 * ║                         Unit Tests for Module Registry API                            ║
 * ╚═══════════════════════════════════════════════════════════════════════════════════════╝
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001/api/modules';

interface TestResult {
  success: boolean;
  modules?: any[];
  count?: number;
  stats?: any;
  category?: string;
  module?: any;
  categories?: any[];
}

// Simple test runner for manual execution
async function runTests() {
  console.log('🧪 Running Module API Tests...\n');
  
  const tests = [
    { name: 'GET /modules', fn: async () => {
      const res = await fetch(BASE_URL);
      const data = await res.json() as TestResult;
      console.log(`   ✅ Modules: ${data.count}`);
      return data.success && (data.count || 0) > 0;
    }},
    { name: 'GET /modules/stats', fn: async () => {
      const res = await fetch(`${BASE_URL}/stats`);
      const data = await res.json() as TestResult;
      console.log(`   ✅ Total LOC: ${data.stats?.totalLOC}`);
      return data.success;
    }},
    { name: 'GET /modules/category/ai', fn: async () => {
      const res = await fetch(`${BASE_URL}/category/ai`);
      const data = await res.json() as TestResult;
      console.log(`   ✅ AI Modules: ${data.modules?.length}`);
      return data.success && (data.modules?.length || 0) > 0;
    }},
    { name: 'GET /modules/core', fn: async () => {
      const res = await fetch(`${BASE_URL}/core`);
      const data = await res.json() as TestResult;
      console.log(`   ✅ Core Module LOC: ${data.module?.locFormatted}`);
      return data.success;
    }},
    { name: 'GET /modules/overview/categories', fn: async () => {
      const res = await fetch(`${BASE_URL}/overview/categories`);
      const data = await res.json() as TestResult;
      console.log(`   ✅ Categories: ${data.categories?.length}`);
      return data.success;
    }}
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      console.log(`\n📋 ${test.name}`);
      const result = await test.fn();
      if (result) passed++; else failed++;
    } catch (e: any) {
      console.log(`   ❌ Error: ${e.message}`);
      failed++;
    }
  }
  
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`${'═'.repeat(50)}\n`);
  
  return { passed, failed };
}

// Export for execution
export { runTests };
