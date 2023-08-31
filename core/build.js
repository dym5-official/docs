const path = require("path");
const fs = require("fs");
const createFilesMap = require("./mods/create-files-map");
const mdToHTML = require("./mods/md-to-html");

const distDir = path.join(__dirname, '..', 'dist');

const ensureDir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}


const writeFile = (file, content) => {
    ensureDir(path.dirname(file));
    fs.writeFileSync(file, content);
}

(async () => {
    const projectsDir = path.join(__dirname, '..', 'projects');
    const list = createFilesMap(projectsDir);

    for (const project of list) {
        for (const doc of project) {
            const { path: docPath, config: { menu } } = doc;

            for (const sect in menu) {
                const section = menu[sect];

                for (const fileEntry of section.files) {
                    let source = path.join(docPath, sect, fileEntry.file);
                    let dest = source.slice(0, -3) + '.html';

                    source = path.join(projectsDir, source);
                    dest = path.join(distDir, dest);

                    const result = mdToHTML({ md: source });

                    writeFile(dest, result.html);
                }
            }
        }
    }

})();