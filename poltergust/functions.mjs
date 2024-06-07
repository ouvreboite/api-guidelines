import * as fs from 'fs';
import * as path from 'path';
import spectralCore from "@stoplight/spectral-core";
const { Spectral, Document } = spectralCore;
import Parsers from "@stoplight/spectral-parsers"; // make sure to install the package if you intend to use default parsers!
import { bundleAndLoadRuleset } from "@stoplight/spectral-ruleset-bundler/with-loader";

/**
 * @param {string} rulesDir
 * @returns {Object.<string, {ruleContent: string, lineNumber: number, filePath: string}>} the spectral rules in all files, by rule name
 */
export function extractAllSpectralRules(rulesDir) {
    const markdownFiles = fs.readdirSync(rulesDir).filter(f => f.endsWith('.md'));

    let rulesByName = {};
    for (let file of markdownFiles) {
        const filePath = path.join(rulesDir, file);
        const rules = extractSpectralRules(filePath);
        console.log(`${filePath}: ${Object.keys(rules).length} rule(s) found.`);

        //if the rule name is already in the map, throw an error
        for (let ruleName in rules) {
            if (rulesByName[ruleName]) {
                console.error(`❌ Rule name ${ruleName} is already defined in another file.`)
            }
        }

        rulesByName = {...rulesByName, ...rules};
    }
    return rulesByName
}

/**
 * @param {string} filePath 
 * @returns {Object.<string, {ruleContent: string, lineNumber: number, filePath: string}>} the spectral rules in the file
 */
export function extractSpectralRules(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/\r/g, '')

    let spectralRulesMatches = [];
    let regex = /```yaml\n#spectral-rule\n(.*?)```/gs;
    let match;
    while ((match = regex.exec(content)) != null) {
        spectralRulesMatches.push(match);
    }

    //extract the rule name from the first line of the block and create a rule name -> test cases[] map
    let rulesByName = {};
    for (let match of spectralRulesMatches) {
        let ruleContent = match[0]
            .replace(/^```yaml\n#spectral-rule\n/, '')
            .replace(/```$/, '');
        let ruleName = ruleContent.split('\n')[0].trim().replace(':', '');
        let lineNumber = content.substring(0, match.index).split('\n').length+2;
        rulesByName[ruleName] = {ruleContent, lineNumber, filePath};
    }

    return rulesByName;
}

/**
 * @param {Object.<string, {ruleContent:string}>} spectralRules
 * @param {string} rulesDir 
 * @returns {string} the content of the spectral.yaml file
 */
export function generateRuleFileContent(spectralRules, rulesDir){
    const baseFile = path.join(rulesDir, 'spectral.base.yaml');
    if (!fs.existsSync(baseFile)) {
        console.error(`❌ The file ${baseFile} does not exist.`);
    }
    let ruleFileContent = fs.readFileSync(baseFile, 'utf8');
    
    for (let ruleName in spectralRules) {
        const rule = spectralRules[ruleName];
        const indentedRule = rule.ruleContent.split('\n').map(line => '  ' + line).join('\n')
        ruleFileContent += '\n'+indentedRule;
    }

    return ruleFileContent;
}

/**
 * @param {string} rulesDir 
 * @returns {Object.<string, {status: string, testContent: string, lineNumber: number, filePath: string}[]>} the test cases for each rule name
 */
export function extractAllTestCases(rulesDir) {
    const markdownFiles = fs.readdirSync(rulesDir).filter(f => f.endsWith('.md'));

    let testCasesByRuleName = {};
    for (let file of markdownFiles) {
        const filePath = path.join(rulesDir, file);
        const testCases = extractTestCases(filePath);
        console.log(`${filePath}: ${Object.keys(testCases).length} test case(s) found.`);
        testCasesByRuleName = {...testCasesByRuleName, ...testCases};
    }
    return testCasesByRuleName
}

/**
 * @param {string} filePath
 * @returns {Object.<string, {status: string, testContent: string, lineNumber: number, filePath: string}[]>} the valid test cases for each rule name
 */
export function extractTestCases(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/\r/g, '')
    let testCasesMatches = [];

    let regex = /```yaml\n#spectral-test\:(.*?)```/gs;
    let match;
    while ((match = regex.exec(content)) != null) {
        testCasesMatches.push(match);
    }

    //extract the rule name from the first line of the block and create a rule name -> test cases[] map
    let testCasesByRuleName = {}
    for (let match of testCasesMatches) {
        let lineNumber = content.substring(0, match.index).split('\n').length+2;
        let block = match[0]
            .replace(/^```yaml\n#spectral-test\:/, '')
            .replace(/```$/, '');
            
        let lines = block.split('\n');
        let ruleNameAndStatus = lines[0].trim();
        let testContent = lines.slice(1).join('\n')
        let ruleName = ruleNameAndStatus.split(' ')[0];
        let status = ruleNameAndStatus.split(' ')[1];
        let testCases = testCasesByRuleName[ruleName] || [];
        testCases.push({status, testContent, lineNumber, filePath});
        testCasesByRuleName[ruleName] = testCases;
    }
    return testCasesByRuleName;
}

/**
 * @param {string} ruleName
 * @param {string} ruleContent
 * @param {{status: string, testContent: string, lineNumber: number, filePath: string}[]} testCases
 */
export async function checkTestCase(ruleName, ruleContent, testCases){
    const fs = {
        promises: {
            async readFile(filepath) {
                if (filepath === "/.spectral.yaml") {
                    return ruleContent;
                }

                throw new Error(`Could not read ${filepath}`);
            },
        },
    };  

    const spectral = new Spectral();
    spectral.setRuleset(await bundleAndLoadRuleset("/.spectral.yaml", { fs, fetch }));

    for (let testCase of testCases) {
        let result = await spectral.run(testCase.testContent);

        //check that result does not contains an error with the same code as the rule
        let errors = result.filter(e => e.code === ruleName);
        let hasError = errors.length > 0;
        if(testCase.status === '✅'){
            if(hasError){
                console.error(`  💔 Positive test failed ( ${testCase.filePath}:${testCase.lineNumber})`);
            }else{
                console.log(`  🧪 Positive test passed successfully ( ${testCase.filePath}:${testCase.lineNumber})`);
            }
        }else if (testCase.status === '❌'){
            if(!hasError){
                console.error(`  💔 Negative test failed ( ${testCase.filePath}:${testCase.lineNumber})`);
            }else{
                console.log(`  🧪 Negative test passed successfully ( ${testCase.filePath}:${testCase.lineNumber})`);
            }
        }
    }
}