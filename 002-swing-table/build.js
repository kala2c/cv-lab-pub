const chokidar = require('chokidar');
const prettier = require('prettier');
const terser = require('terser');
const moment = require('moment');
const path = require("node:path");
const fs = require("node:fs");
const { readdirVueFiles, compileVueFile, getTemplateString } = require("./core");

const distPath = path.resolve(__dirname, 'dist.min.js');
// 抄送路径
const copyPath = "E:\\dev-space\\spacepowserver-service\\src\\main\\webapp\\frmPatternProRenew\\js\\swing-table.min.js";

const srcPath = path.resolve(__dirname, 'src');

const isWatchMode = process.argv.indexOf('--watch') > -1;
let watcher = null;
if (isWatchMode) {
    watcher = chokidar.watch(srcPath, {
        persistent: true,
    });
}

// 编译vue文件到distPath
async function compileAll() {
    const files = readdirVueFiles(srcPath);
    const waitList = files.map(async (file) => {
        const str = await compileVueFile(file.fullPath);
        return `/** ${file.file} start **/\n defineComponent(${str}); \n/** ${file.file} end **/\n`;
    });
    const res = await Promise.all(waitList);
    const code = res.join('\n');
    // 读取模板文件
    const temp = await getTemplateString();
    const now = moment().format("YYYY-MM-DD HH:mm:ss");
    const fileContent = temp.replace("/* content */", code);

    // // 使用 Prettier 格式化代码
    // // 配置 Prettier
    // const prettierOptions = {
    //     semi: true, // 添加分号
    //     singleQuote: true, // 使用单引号
    //     tabWidth: 2, // 缩进大小
    //     parser: 'babel', // 使用 Babel 解析器（适用于 JavaScript）
    // };
    // const formattedCode = await prettier.format(fileContent, prettierOptions);

    // 使用 Terser 压缩代码
    const result = await terser.minify(fileContent, {
        compress: true, // 启用代码压缩
        mangle: true, // 启用变量名缩短
    });
    const formattedCode = result.code;
    const distContent = "// " + now + "\n" + formattedCode;
    fs.writeFileSync(distPath, distContent, 'utf-8');
    console.log('Vue file build success');
}

async function execCopy() {
    if (!copyPath) return;
    fs.copyFileSync(distPath, copyPath);
    console.log('Copy success');
}

(async function () {
    await compileAll();
    await execCopy();
    if (!isWatchMode) {
        return true;
    }
    // 监听文件变化
    watcher
        .on('add', (filePath) => {
            const fileName = path.basename(filePath);
            console.log(`File ${fileName} has been added`);
            compileAll();
        })
        .on('change', async (filePath) => {
            const fileName = path.basename(filePath);
            if (!fileName.includes('.vue')) return;
            console.log(`File ${fileName} has been changed`);
            // // 读取dist文件
            // const distFileContent = fs.readFileSync(distPath, 'utf8');
            // // 只编译变更的文件
            // compileVueFile(filePath).then((str) => {
            //     const code = `/** ${fileName} start **/\n defineComponent(${str}); \n/** ${fileName} end **/\n`;
            //     const newContent = distFileContent.replace(new RegExp(`\\/\\*\\* ${fileName} start \\*\\*\\/([\\s\\S]*?)\\/\\*\\* ${fileName} end \\*\\*\\/`), code);
            //     fs.writeFileSync(distPath, newContent);
            //     console.log(`File ${fileName} build success`);
            // });
            // 重新编译所有文件
            await compileAll();
            await execCopy();
        })
        .on('unlink', (filePath) => {
            const fileName = path.basename(filePath);
            console.log(`File ${fileName} has been removed`)
        });

    console.log('Watching files...');
})();

