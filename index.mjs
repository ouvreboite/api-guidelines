#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { extractAllRulesAndTestCases, generateRuleFileContent, runTestCase } from './functions.mjs';

// Skip the first two elements in process.argv (node path and file path)
const args = process.argv.slice(2);

if (args[0] === 'merge') {
    const rulesDir = args[1];
    console.log("🔎 Extracting and merging spectral rules from the .md files in the directory: " + rulesDir);
    let rulesAndTestCases = extractAllRulesAndTestCases(rulesDir);

    for(let ruleName in rulesAndTestCases){
        const rule = rulesAndTestCases[ruleName].rule;
        console.log(`👻 ${ruleName} (${rule.filePath}:${rule.line})`);
    }
    let rules = Object.values(rulesAndTestCases).filter((ruleAndTestCases) => ruleAndTestCases.rule).map((ruleAndTestCases) => ruleAndTestCases.rule.content);
    const ruleFileContent = generateRuleFileContent(rules, rulesDir);
    const ruleFile = path.join(rulesDir, 'spectral.yaml');
    fs.writeFileSync(ruleFile, ruleFileContent, 'utf8');
    console.log("✅ Spectral rules merged in the file: " + ruleFile);
}else if (args[0] === 'test') {
    const rulesDir = args[1];
    console.log("🔎 Testing the spectral rules from the .md files in the directory: " + rulesDir);
    let rulesAndTestCases = extractAllRulesAndTestCases(rulesDir);

    //if an entry has no associated rule, throw an error
    for (let ruleName in rulesAndTestCases) {
        if (!rulesAndTestCases[ruleName].rule) {
            console.error(`❌ Test cases exists for unknown rule: ${ruleName}`);
            delete rulesAndTestCases[ruleName];
        }
    }

    //run the test cases for each rule
    for(let ruleName in rulesAndTestCases){
        const rule = rulesAndTestCases[ruleName].rule;
        const testCases = rulesAndTestCases[ruleName].testCases;
        console.log(`👻 ${ruleName} (${rule.filePath}:${rule.line})`);
        if(!testCases || testCases.length == 0){
            continue;
        }
        
        for(let testCase of testCases){
            const testCaseSuccess = await runTestCase(rule, testCase, rulesDir);
            if(! testCaseSuccess)
                process.exitCode = 1;
        }
    }
}