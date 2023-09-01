const path = require("path");
const fs = require("fs");
const createFilesMap = require("./mods/create-files-map");
const mdToHTML = require("./mods/md-to-html");

const root = path.join(__dirname, '..');
const distDir = path.join(root, 'dist');
const template = fs.readFileSync(path.join(root, 'public', 'template.html')).toString();

let theMenu = '';

const ensureDir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

const writeFile = (file, content) => {
    ensureDir(path.dirname(file));

    let html = template;
    
    html = html.replace('{{--body--}}', content);
    html = html.replace('{{--menu--}}', theMenu);

    fs.writeFileSync(file, html);
}


const createMenu = async (projectsDir, list) => {
    const fullList = [];

    for (const project of list) {
        for (const doc of project) {
            const { path: docPath, config: { menu } } = doc;

            for (const sect in menu) {
                const section = menu[sect];
                fullList.push(section);
            }
        }
    }

    theMenu = JSON.stringify(fullList, null, 2);
}

const convertFiles = async (projectsDir, list) => {
    for (const project of list) {
        for (const doc of project) {
            const { path: docPath, config: { menu } } = doc;

            for (const sect in menu) {
                const section = menu[sect];

                for (const fileEntry of section.files) {
                    let source = path.join(docPath, sect, fileEntry.file);
                    let dest = source.slice(0, -3) + '.html';

                    source = path.join(projectsDir, source);
                    dest = path.join(distDir, "projects", dest);

                    const result = mdToHTML({ md: source });

                    writeFile(dest, result.html);
                }
            }
        }
    }
}

const copyPublicFiles = async () => {
    const src = path.join(root, 'public');
    const dest = path.join(root, 'dist');

    fs.cpSync(src, dest, {recursive: true});
    fs.rmSync(path.join(dest, 'template.html'));
}

(async () => {
    const projectsDir = path.join(__dirname, '..', 'projects');
    const list = createFilesMap(projectsDir);

    await createMenu(projectsDir, list);
    await convertFiles(projectsDir, list);
    await copyPublicFiles();
})();