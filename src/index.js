#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { extractAllRulesAndTestCases, generateRuleFileContent, runTestCase } from './functions.js';


// Skip the first two elements in process.argv (node path and file path)
const args = process.argv.slice(2);

//--help
if(args.includes("--help")){
    console.log("📖 Usage: spectral-test <rules-directory>");
    console.log("ℹ️ The rules-directory should contain the spectral.base.yaml file and the spectral rules in .md files.");
    process.exit(0);
}

//extract, test, merge
const rulesDir = getAndCheckRulesDdir(args);
console.log("🔎 Testing the spectral rules from the .md files in the directory: " + rulesDir);
let rulesAndTestCases = extractAllRulesAndTestCases(rulesDir);

//run the test cases for each rule
let allTestSucessful = true;
for(let ruleName in rulesAndTestCases){
    const rule = rulesAndTestCases[ruleName].rule;
    console.log(`👻 ${ruleName} (${rule.filePath}:${rule.line})`);
    
    const testCases = rulesAndTestCases[ruleName].testCases;
    if(!testCases || testCases.length == 0){
        continue;
    }
    
    for(let testCase of testCases){
        if(!await runTestCase(rule, testCase, rulesDir))
            allTestSucessful = false;
    }
}

if(!allTestSucessful){
    process.exit(1);
}

//merge
let rules = Object.values(rulesAndTestCases).map((ruleAndTestCases) => ruleAndTestCases.rule.content);
const ruleFileContent = generateRuleFileContent(rules, rulesDir);
const ruleFile = path.join(rulesDir, 'spectral.yaml');
fs.writeFileSync(ruleFile, ruleFileContent, 'utf8');
console.log("✅ Spectral rules merged in the file: " + ruleFile);


/**
 * @param {string[]} args 
 * @returns 
 */
function getAndCheckRulesDdir(args) {
    if (args.length == 0) {
        console.error("⚠️ Please provide the directory containing the spectral rules in .md files as an argument.");
        process.exit(1);
    }
    const rulesDir = args[0];
    if (!fs.existsSync(rulesDir)) {
        console.error("⚠️ The rules directory does not exist: " + rulesDir);
        process.exit(1);
    }
    //check if spectral.base.yaml exists in the rules dir
    if (!fs.existsSync(path.join(rulesDir, 'spectral.base.yaml'))) {
        console.error("⚠️ The spectral.base.yaml file does not exist in the rules directory: " + rulesDir);
        process.exit(1);
    }
    return rulesDir;
}
