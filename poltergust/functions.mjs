import * as fs from 'fs';
import * as path from 'path';
import spectralCore from "@stoplight/spectral-core";
const { Spectral } = spectralCore;
import { bundleAndLoadRuleset } from "@stoplight/spectral-ruleset-bundler/with-loader";

/**
 * @param {string} rulesDir
 * @returns {Object.<string, {rule: {name: string, content: string, line: number, filePath: string}, testCases: {content: string, assertions: {ruleName: string, line: number, shouldFail: boolean}[], line: number, filePath: string}[]>} the spectral rules and test cases by rule name
 */
export function extractAllRulesAndTestCases(rulesDir) {
    const markdownFiles = fs.readdirSync(rulesDir).filter(f => f.endsWith('.md'));

    let rulesAndTestCases = {};
    for (let file of markdownFiles) {
        const filePath = path.join(rulesDir, file);
        const rulesAndTestCasesForFile = extractRulesAndTestCases(filePath);
        //merge or append rules and tests cases in 
        for (let ruleName in rulesAndTestCasesForFile) {
            if(rulesAndTestCases[ruleName]){
                const rule = rulesAndTestCases[ruleName].rule || rulesAndTestCasesForFile[ruleName].rule;
                //merge testcases
                const testCases = (rulesAndTestCases[ruleName].testCases || []).concat(rulesAndTestCasesForFile[ruleName].testCases || []);
                rulesAndTestCases[ruleName] = {rule, testCases};
            }else{
                rulesAndTestCases[ruleName] = rulesAndTestCasesForFile[ruleName];
            }
        }
    }
    return rulesAndTestCases
}


/**
 * @param {string} filePath 
 * @returns {Object.<string, {rule: {name: string, content: string, line: number, filePath: string}, testCases: {content: string, assertions: {ruleName: string, line: number, shouldFail: boolean}[], line: number, filePath: string}[]>} rule and test cases by rule name
 */
export function extractRulesAndTestCases(filePath) {
    const blocks = extractYamlBlocks(filePath);

    // spectral rules starts by #spectral-rule
    let byRuleName = {};
    blocks.filter(block => block.content.startsWith('#spectral-rule')).forEach(block => {
        const rule = extractRuleFromBlock(block, filePath);

        //handle duplicate rules
        if(byRuleName[rule.name]) {
            console.error(`❌ Rule name ${rule.name} is already defined`)
        }
        byRuleName[rule.name] = {rule};
    });

    // spectral tests starts by #spectral-test
    blocks.filter(block => block.content.startsWith('#spectral-test')).forEach(block => {
        const testCase = extractTestCaseBlock(block, filePath);

        //append the test case to each concerned rule
        let disctinctRules = [...new Set(testCase.assertions.map(r => r.ruleName))];
        disctinctRules.forEach(ruleName => {
            //if the rule name exist in byRuleName, add the test case to it
            if(byRuleName[ruleName]){
                const testCases = byRuleName[ruleName].testCases || [];
                testCases.push(testCase);
                byRuleName[ruleName].testCases = testCases;
            }else{
                byRuleName[ruleName] = {testCases: [testCase]};
            }
            
        });
    });

    return byRuleName;
}

/**
 * @param {string} filePath 
 * @returns {{content: string, line: number, filePath: string}[]} the YAML codeblocs
 */
export function extractYamlBlocks(filePath) {
    let fileContent = fs.readFileSync(filePath, 'utf8');
    fileContent = fileContent.replace(/\r/g, '')

    let blocks = [];
    let regex = /```yaml\n(.*?)```/gs;
    let match;
    while ((match = regex.exec(fileContent)) != null) {
        const content = match[0]
            .replace(/^```yaml\n/, '')
            .replace(/```$/, '');
        const line = fileContent.substring(0, match.index).split('\n').length+1;
        blocks.push({content, line, filePath});
    }

    return blocks;
}

/**
 * 
 * @param {*} block 
 * @param {*} filePath 
 * @returns {{name: string, content: string, line: number, filePath: string}} the spectral rule
 */
function extractRuleFromBlock(block, filePath) {
    const content = block.content.split('\n').slice(1).join('\n');
    const name = content.split('\n')[0].trim().replace(':', '');
    const line = block.line;
    return {name, content, line, filePath};
}

/**
 * 
 * @param {*} block 
 * @param {*} filePath 
 * @returns {{content: string, assertions: {ruleName: string, line: number, shouldFail: boolean}[], line: number, filePath: string}} the spectral rule
 */
function extractTestCaseBlock(block, filePath) {
    const content = block.content.split('\n').slice(1).join('\n');
    const line = block.line;

    const assertions = [];
    content.split('\n').forEach((line, index) => {
        if(line.includes('#spectral-should-not-fail-anywhere-✅:')){
            const ruleName = line.split('#spectral-should-not-fail-anywhere-✅:')[1].trim();
            assertions.push({ruleName, shouldFail: false});
        }
        if(line.includes('#spectral-should-not-fail-here-✅:')){
            const ruleName = line.split('#spectral-should-not-fail-here-✅:')[1].trim();
            assertions.push({ruleName, shouldFail: false, line: index});
        }
        if(line.includes('#spectral-should-fail-anywhere-❌:')){
            const ruleName = line.split('#spectral-should-fail-anywhere-❌:')[1].trim();
            assertions.push({ruleName, shouldFail: true});
        }
        if(line.includes('#spectral-should-fail-here-❌:')){
            const ruleName = line.split('#spectral-should-fail-here-❌:')[1].trim();
            assertions.push({ruleName, shouldFail: true, line: index});
        }
    });

    return {content, line, filePath, assertions};
}


/**
 * @param {Object.<string, {content:string}>} spectralRules
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
        const indentedRule = rule.content.split('\n').map(line => '  ' + line).join('\n')
        ruleFileContent += '\n'+indentedRule;
    }

    return ruleFileContent;
}

/**
 * 
 * @param {{name: string, content: string, line: number, filePath: string}} rule 
 * @param {{content: string, assertions: {ruleName: string, line: number, shouldFail: boolean}[], line: number, filePath: string}} testCase 
 * @param {string} rulesDir 
 */
export async function runTestCase(rule, testCase, rulesDir){
    //run test case against the rule
    const ruleFile = generateRuleFileContent({ruleName: rule}, rulesDir);
    const fs = {
        promises: {
            async readFile(filepath) {
                if (filepath === "/.spectral.yaml") {
                    return ruleFile;
                }

                throw new Error(`Could not read ${filepath}`);
            },
        },
    };  
    const spectral = new Spectral();
    spectral.setRuleset(await bundleAndLoadRuleset("/.spectral.yaml", { fs, fetch }));
    let errors = await spectral.run(testCase.content);


    //check each assertions
    let ok = true;
    errors = errors.filter(e => e.code === rule.name);
    for (let assertion of testCase.assertions) {
        //should-not-fail-anywhere
        if(!assertion.shouldFail && assertion.line === undefined){
            if(errors.length > 0){
                console.error(`  💔 Was not expecting to fail rule anywhere ${assertion.ruleName} at line ${errors[0].range.start.line} in test (${testCase.filePath}:${testCase.line})`);
                ok = false;
            }
        }

        //should-fail-anywhere
        if(assertion.shouldFail && assertion.line === undefined){
            if(errors.length === 0){
                console.error(`  💔 Was expecting to fail rule anywhere ${assertion.ruleName} in test (${testCase.filePath}:${testCase.line})`);
                ok = false;
            }
        }

        //should-not-fail-here
        if(!assertion.shouldFail && assertion.line !== undefined){
            let matchingErrors = errors.filter(e => e.range.start.line <= assertion.line && e.range.end.line >= assertion.line);
            if(matchingErrors.length > 0){
                console.error(`  💔 Was not expecting to fail rule ${assertion.ruleName} at line ${assertion.line} in test (${testCase.filePath}:${testCase.line+assertion.line+1})`);
                ok = false;
            }
        }

        //should-fail-here
        if(assertion.shouldFail && assertion.line !== undefined){
            let matchingErrors = errors.filter(e => e.range.start.line <= assertion.line && e.range.end.line >= assertion.line);
            if(matchingErrors.length === 0){
                console.error(`  💔 Was expecting to fail rule ${assertion.ruleName} at line ${assertion.line} in test (${testCase.filePath}:${testCase.line+assertion.line+1})`);
                const prettyErrors = errors.map(e => {return {code: e.code, start: e.range.start.line, end: e.range.end.line};});
                console.error(`  But got those errors instead:`);
                console.error(prettyErrors);
                ok = false;
            }
        }

    }

    if(ok){
        console.log(`  🧪 Test case succesful (${testCase.filePath}:${testCase.line})`);
    }
}