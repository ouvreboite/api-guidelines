import * as fs from 'fs';
import * as path from 'path';
import spectralCore from "@stoplight/spectral-core";
import { mkdtemp } from 'node:fs/promises';
const { Spectral } = spectralCore;
import { bundleAndLoadRuleset } from "@stoplight/spectral-ruleset-bundler/with-loader";

/**
 * @param {string} rulesDir
 * @returns {Object.<string, {rule: {name: string, content: string, line: number, filePath: string}, testCases: {content: string, assertions: {ruleName: string, line: number, failuresCount: number}[], line: number, filePath: string}[]>} the spectral rules and test cases by rule name
 */
export function extractAllRulesAndTestCases(rulesDir) {
    const markdownFiles = fs.readdirSync(rulesDir).filter(f => f.endsWith('.md'));

    /** @type {Object.<string, {rule: {name: string, content: string, line: number, filePath: string}, testCases: {content: string, assertions: {ruleName: string, line: number, failuresCount: number}[], line: number, filePath: string}[]>} */
    let byRuleName = {}; 
    for (let file of markdownFiles) {
        const filePath = path.join(rulesDir, file);
        extractRulesAndTestCases(filePath, byRuleName);
    }
    
    //check for missing rules
    for (let ruleName in byRuleName) {
        if (!byRuleName[ruleName].rule) {
            const testcase = byRuleName[ruleName].testCases[0];
            console.error(`⚠️ Test case for unknown rule: ${ruleName} at (${testcase.filePath}:${testcase.line})`);
            delete byRuleName[ruleName];
        }
    }

    return byRuleName
}


/**
 * @param {string} filePath 
 * @param {Object.<string, {rule: {name: string, content: string, line: number, filePath: string}, testCases: {content: string, assertions: {ruleName: string, line: number, failuresCount: number}[], line: number, filePath: string}[]>} byRuleName
 */
export function extractRulesAndTestCases(filePath, byRuleName) {
    const blocks = extractYamlBlocks(filePath);

    blocks.forEach(block => {
        const rule = extractRuleFromBlock(block, filePath);
        const testCase = extractTestCaseBlock(block, filePath);

        //invalid states
        if(!rule && !testCase){
            console.log('Skipping block at line', block.line, 'in', block.filePath);
            return;
        }
        if(rule && testCase){
            console.error(`⚠️ Rule and test case in the same block at (${filePath}:${block.line})`);
            return;
        }
        if(rule && byRuleName[rule.name] && byRuleName[rule.name].rule){
            console.error(`⚠️ Rule ${rule.name} is defined in both ${byRuleName[rule.name].rule.filePath} and ${rule.filePath}`);
            return;
        }

        //add rule
        if(rule){
            if(!byRuleName[rule.name])
                byRuleName[rule.name] = {rule, testCases: []};
            else
                byRuleName[rule.name].rule = rule;
        }
        
        //add test case to each rule impacted
        if(testCase){
            //use a set of rule name to avoid duplicates when a test case has multiple assertions on the same rule
            let ruleNames = new Set(testCase.assertions.map(a => a.ruleName));
            for (let ruleName of ruleNames) {
                if(!byRuleName[ruleName])
                    byRuleName[ruleName] = {rule: undefined, testCases: [testCase]};
                else
                    byRuleName[ruleName].testCases.push(testCase);
            }
        }
    });
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
 * @param {{content: string, line: number, filePath: string}} block 
 * @param {string} filePath 
 * @returns {{name: string, content: string, line: number, filePath: string}} the spectral rule
 */
function extractRuleFromBlock(block, filePath) {
    if(!block.content.startsWith('#👻-rule'))
        return null;
    const content = block.content.split('\n').slice(1).join('\n');
    const name = content.split('\n')[0].trim().replace(':', '');
    const line = block.line;
    return {name, content, line, filePath};
}

/**
 * 
 * @param {{content: string, line: number, filePath: string}} block 
 * @returns {{content: string, assertions: {ruleName: string, line: number, failuresCount: number}[], line: number, filePath: string}} the spectral rule
 */
function extractTestCaseBlock(block) {
    if(block.content.startsWith('#👻-rule'))
        return null;
    const content = block.content;
    const line = block.line;

    const assertions = [];
    content.split('\n').forEach((line, index) => {
        if(line.includes('#👻-failures:')){
            const failureCountAndruleName = line.split('#👻-failures:')[1].trim();
            const failuresCount = failureCountAndruleName.split(' ')[0];
            const ruleName = failureCountAndruleName.split(' ')[1];
            assertions.push({ruleName, failuresCount: failuresCount});
        }
        else if(line.includes('#👻-fails-here:')){
            const ruleName = line.split('#👻-fails-here:')[1].trim();
            assertions.push({ruleName, failuresCount: 1, line: index});
        }else if(line.includes('#👻-')){
            const tag = line.split('#👻-')[1].trim();
            console.error(`⚠️ Unknown tag: "#👻-${tag}" at (${block.filePath}:${block.line+index})`);
        }
    });

    if(assertions.length === 0)
        return null;
    return {content, line, filePath: block.filePath, assertions};
}


/**
 * @param {string[]} spectralRulesContents
 * @param {string} rulesDir 
 * @returns {string} the content of the spectral.yaml file
 */
export function generateRuleFileContent(spectralRulesContents, rulesDir){
    const baseFile = path.join(rulesDir, 'spectral.base.yaml');
    if (!fs.existsSync(baseFile)) {
        console.error(`⚠️ The file ${baseFile} does not exist.`);
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
 * @param {{content: string, assertions: {ruleName: string, line: number, failuresCount: number}[], line: number, filePath: string}} testCase 
 * @param {string} rulesDir 
 * @return {Promise<boolean>} success
 */
export async function runTestCase(rule, testCase, rulesDir){
    let ok = true;

    //write rule file to temp dir
    const tempDir = await mkdtemp(rule.name+"-test-");
    try{
        const tempRuleFilePath = path.join(tempDir, '.spectral.yaml');
        let ruleFile = generateRuleFileContent([rule.content], rulesDir);
        fs.writeFileSync(tempRuleFilePath, ruleFile);

        //if the function dir exists, copy the functions folder into the temp dir
        const functionsDirPath = path.join(rulesDir, 'functions');
        if(fs.existsSync(functionsDirPath)){
            const tempFunctionsDirPath = path.join(tempDir, 'functions')
            fs.mkdirSync(tempFunctionsDirPath);
            
            fs.readdirSync(functionsDirPath).forEach(file => {
                const sourceFile = path.join(functionsDirPath, file);
                const destFile = path.join(tempFunctionsDirPath, file);
                fs.copyFileSync(sourceFile, destFile);
            });
        }    

        //run test case against the rule
        const spectral = new Spectral();
        spectral.setRuleset(await bundleAndLoadRuleset(path.resolve(tempRuleFilePath), { fs, fetch }));
        const errors = await spectral.run(testCase.content);

        //check each assertions
        const ruleErrors = errors.filter(e => e.code === rule.name);
        const ruleAssertions = testCase.assertions.filter(a => a.ruleName === rule.name);
        
        for (let assertion of ruleAssertions) {
            //#👻-failures:
            if(assertion.line === undefined && ruleErrors.length != assertion.failuresCount){
                console.error(`  ❌ Expected ${assertion.failuresCount} failure(s) for rule ${assertion.ruleName} in test (${testCase.filePath}:${testCase.line})`);
                console.error(`  But got ${ruleErrors.length} instead:`);
                ruleErrors.forEach(e => console.error('  ', {start: e.range.start.line, end: e.range.end.line}, `(${testCase.filePath}:${testCase.line+e.range.start.line})`));
                ok = false;
            }
            //#👻-fails-here:
            if(assertion.line !== undefined){
                let matchingErrors = ruleErrors.filter(e => e.range.start.line <= assertion.line && e.range.end.line >= assertion.line);
                if(matchingErrors.length == 0){
                    console.error(`  ❌ Expected rule ${assertion.ruleName} to fail at line ${assertion.line} in test (${testCase.filePath}:${testCase.line+assertion.line})`);
                    console.error(`  But got ${ruleErrors.length} instead:`);
                    ruleErrors.forEach(e => console.error('  ', {start: e.range.start.line, end: e.range.end.line}, `(${testCase.filePath}:${testCase.line+e.range.start.line})`));
                    ok = false;
                }
            }
        }
        
        if(ok)
            console.log(`  ✅ Test OK (${testCase.filePath}:${testCase.line})`);
    }finally{
        fs.rmSync(tempDir, {recursive: true});
    }

    return ok;
}