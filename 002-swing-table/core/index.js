const fs = require('node:fs');
const cheerio = require('cheerio');
const sass = require('sass');
const path = require("node:path");

/**
 * 编译vue文件
 * @param fileContent
 * @returns {string}
 */
function compileVueFileString(fileContent) {
    const $ = cheerio.load(fileContent);
    // 样式处理
    const styleTag = $('style');
    const styleString = styleTag.html();
    // scss处理
    const styleLang = styleTag.attr('lang');
    const style = styleLang === 'scss' ? sass.compileString(styleString).css : styleString;
    // script内容处理
    const script = $('script').html();
    if (!script) return '';
    const startIndex = script.indexOf('{');
    const endIndex = script.lastIndexOf('}');
    if (startIndex === -1 || endIndex === -1) return '';
    const scriptClassContent = script.substring(startIndex, endIndex + 1).trim();
    // 正则表达式取出template内容 使用cheerio取会有问题
    const templateMatches = fileContent.match(/<template>([\s\S]*)<\/template>/);
    const template = (templateMatches && templateMatches.length > 1) ? templateMatches[1] : '';
    // 组装成options
    let str = "{\n";
    if (template) str += "template: `" + template + "`,\n ";
    if (style) str += "style: `<style>" + style + "</style>`,\n ";
    str += scriptClassContent.substring(1);
    return str;
}

/**
 * 编译vue文件
 * @param filePath
 * @returns {Promise<String>}
 */
function compileVueFile(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                console.error(err);
                return;
            }
            const optionsContent = compileVueFileString(data);
            resolve(optionsContent);
        });
    });
}

/**
 * 递归读取目录，获取所有 .vue 文件
 * @param dir
 * @param fileList
 * @returns {*[]}
 */
function readdirVueFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir); // 读取目录内容
    files.forEach((file) => {
        const fullPath = path.join(dir, file); // 获取完整路径
        const stat = fs.statSync(fullPath); // 获取文件状态
        if (stat.isDirectory()) {
            // 如果是目录，递归调用
            readdirVueFiles(fullPath, fileList);
        } else if (file.endsWith('.vue')) {
            // 如果是 .vue 文件，加入结果列表
            fileList.push({ fullPath, file });
        }
    });
    return fileList;
}

/**
 * 获取模板文件内容
 * @returns {Promise<String>}
 */
function getTemplateString() {
    return new Promise((resolve, reject) => {
        fs.readFile(path.resolve(__dirname, 'bundle.temp.js'), 'utf8', (err, data) => {
            if (err) {
                console.error(err);
                return;
            }
            resolve(data);
        });
    });
}

module.exports = {
    compileVueFileString,
    compileVueFile,
    readdirVueFiles,
    getTemplateString
}
