import * as fs from 'fs';
import * as path from 'path';
import spectralCore from "@stoplight/spectral-core";
import { mkdtemp } from 'node:fs/promises';
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
 * @param {string[]} spectralRulesContents
 * @param {string} rulesDir 
 * @returns {string} the content of the spectral.yaml file
 */
export function generateRuleFileContent(spectralRulesContents, rulesDir){
    const baseFile = path.join(rulesDir, 'spectral.base.yaml');
    if (!fs.existsSync(baseFile)) {
        console.error(`❌ The file ${baseFile} does not exist.`);
    }
    
    let ruleFileContent = fs.readFileSync(baseFile, 'utf8');
    for (let rule of spectralRulesContents) {
        const indentedRule = rule.split('\n').map(line => '  ' + line).join('\n')
        ruleFileContent += '\n'+indentedRule;
    }

    return ruleFileContent;
}

/**
 * 
 * @param {{name: string, content: string, line: number, filePath: string}} rule 
 * @param {{content: string, assertions: {ruleName: string, line: number, shouldFail: boolean}[], line: number, filePath: string}} testCase 
 * @param {string} rulesDir 
 * @return {boolean} success
 */
export async function runTestCase(rule, testCase, rulesDir){
    //write rule file to temp dir
    const tempDir = await mkdtemp(rule.name+"-test-");
    const tempRuleFilePath = path.join(tempDir, '.spectral.yaml');
    const functionsDirPath = path.join(rulesDir, 'functions');
    const tempFunctionsDirPath = path.join(tempDir, 'functions')
    let ruleFile = generateRuleFileContent([rule.content], rulesDir);
    fs.writeFileSync(tempRuleFilePath, ruleFile);

    //copy the functions folder into the temp dir
    fs.mkdirSync(tempFunctionsDirPath);
    fs.readdirSync(functionsDirPath).forEach(file => {
        const sourceFile = path.join(functionsDirPath, file);
        const destFile = path.join(tempFunctionsDirPath, file);
        fs.copyFileSync(sourceFile, destFile);
    });

    let ok = true;

    try{
        //run test case against the rule
        const spectral = new Spectral();
        spectral.setRuleset(await bundleAndLoadRuleset(path.resolve(tempRuleFilePath), { fs, fetch }));
        const errors = await spectral.run(testCase.content);

        //check each assertions
        const ruleErrors = errors.filter(e => e.code === rule.name);
        const ruleAssertions = testCase.assertions.filter(a => a.ruleName === rule.name);
        
        for (let assertion of ruleAssertions) {
            //should-not-fail-anywhere
            if(!assertion.shouldFail && assertion.line === undefined){
                if(ruleErrors.length > 0){
                    console.error(`  ❌ Was not expecting to fail rule anywhere ${assertion.ruleName} in test (${testCase.filePath}:${testCase.line})`);
                    console.error(`  But failed there instead:`);
                    ruleErrors.forEach(e => console.error('  ', {start: e.range.start.line, end: e.range.end.line}, `(${testCase.filePath}:${testCase.line+e.range.start.line+1})`));
                    ok = false;
                }
            }

            //should-fail-anywhere
            if(assertion.shouldFail && assertion.line === undefined){
                if(ruleErrors.length === 0){
                    console.error(`  ❌ Was expecting to fail rule anywhere ${assertion.ruleName} in test (${testCase.filePath}:${testCase.line})`);
                    ok = false;
                }
            }

            //should-not-fail-here
            if(!assertion.shouldFail && assertion.line !== undefined){
                let matchingErrors = ruleErrors.filter(e => e.range.start.line <= assertion.line && e.range.end.line >= assertion.line);
                if(matchingErrors.length > 0){
                    console.error(`  ❌ Was not expecting to fail rule ${assertion.ruleName} at line ${assertion.line} in test (${testCase.filePath}:${testCase.line+assertion.line+1})`);
                    ok = false;
                }
            }

            //should-fail-here
            if(assertion.shouldFail && assertion.line !== undefined){
                let matchingErrors = ruleErrors.filter(e => e.range.start.line <= assertion.line && e.range.end.line >= assertion.line);
                if(matchingErrors.length === 0){
                    console.error(`  ❌ Was expecting to fail rule ${assertion.ruleName} at line ${assertion.line} in test (${testCase.filePath}:${testCase.line+assertion.line+1})`);
                    console.error(`  But failed there instead:`);
                    ruleErrors.forEach(e => console.error('  ', {start: e.range.start.line, end: e.range.end.line}, `(${testCase.filePath}:${testCase.line+e.range.start.line+1})`));
                    ok = false;
                }
            }

        }
    }finally{
        fs.rmSync(tempDir, {recursive: true});
    }

    if(ok){
            console.log(`  ✅ Test OK (${testCase.filePath}:${testCase.line})`);
            return true;
    }else{
        return false;
    }
}