#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { extractAllSpectralRules, generateRuleFileContent, extractAllTestCases, checkTestCase } from './functions.mjs';

// Skip the first two elements in process.argv (node path and file path)
const args = process.argv.slice(2);

if (args[0] === 'merge') {
    const rulesDir = args[1];
    console.log("🔎 Extracting and merging spectral rules from the .md files in the directory: " + rulesDir);
    let rules = extractAllSpectralRules(rulesDir);
    const ruleFileContent = generateRuleFileContent(rules, rulesDir);
    const ruleFile = path.join(rulesDir, 'spectral.yaml');
    fs.writeFileSync(ruleFile, ruleFileContent, 'utf8');
    console.log("✅ Spectral rules merged in the file: " + ruleFile);
}else if (args[0] === 'test') {
    const rulesDir = args[1];
    console.log("🔎 Testing the spectral rules from the .md files in the directory: " + rulesDir);
    let rules = extractAllSpectralRules(rulesDir);
    let testCases = extractAllTestCases(rulesDir);

    //check test cases have proper rule names
    for (let ruleName in testCases) {
        if (!rules[ruleName]) console.warn(`😔 Rule name ${ruleName} is not defined in the spectral rules but there is a test case for it?.`);
    }

    //for each rule, test the valid and invalid test cases
    for(let ruleName in rules){
        const rule = rules[ruleName];
        console.log(`ℹ️ Rule found: ${ruleName} ( ${rule.filePath}:${rule.lineNumber})`);
        const ruleFile = generateRuleFileContent({ruleName: rule}, rulesDir);
        if(testCases[ruleName])
            await checkTestCase(ruleName, ruleFile, testCases[ruleName]);
    }
}