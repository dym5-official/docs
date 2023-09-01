const path = require("path");
const fs = require("fs");
const Handlebars = require("handlebars");
const createFilesMap = require("./mods/create-files-map");
const mdToHTML = require("./mods/md-to-html");

const root = path.join(__dirname, '..');
const distDir = path.join(root, 'dist');
const template = fs.readFileSync(path.join(root, 'public', 'template.html')).toString();

Handlebars.registerHelper('eq', (a, b) => a == b);

const menuTemplate = Handlebars.compile(`
{{#each this.sections as |section|}}
<ul class="__menugroup">
    <li>
        <div class="__grouplabel">{{section.label}}</div>

        <ul class="__menulist">
            {{#each section.files as |entry|}}
                {{#if (eq entry.uri ../../current)}}
                    <li class="__active"><a href="{{entry.uri}}">{{entry.label}}</a></li>
                {{else}}
                    <li><a href="{{entry.uri}}">{{entry.label}}</a></li>
                {{/if}}
            {{/each}}
        </ul>
    </li>
</ul>
{{/each}}
`);

let theMenuSections = [];

const ensureDir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

const writeFile = (file, content, uri) => {
    ensureDir(path.dirname(file));

    let html = template;
    
    html = html.replace('{{--body--}}', content);
    html = html.replace('{{--menu--}}', menuTemplate({ sections: theMenuSections, current: `/projects/${uri}` }).trim());

    fs.writeFileSync(file, html);
}


const createMenuList = async (projectsDir, list) => {
    const menuSections = [];

    for (const project of list) {
        for (const doc of project) {
            const { path: docPath, config: { menu } } = doc;

            for (const sect in menu) {
                const section = JSON.parse(JSON.stringify(menu[sect]));

                section.files = section.files.map((fileEntry) => {
                    let source = path.join(docPath, sect, fileEntry.file);
                    let dest = source.slice(0, -3) + '.html';
                    
                    return { ...fileEntry, uri: `/projects/${dest}` };
                });

                menuSections.push(section);
            }
        }
    }

    theMenuSections = menuSections;
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
                    let uri = dest;

                    source = path.join(projectsDir, source);
                    dest = path.join(distDir, "projects", dest);

                    const result = mdToHTML({ md: source });

                    writeFile(dest, result.html, uri);
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

    await createMenuList(projectsDir, list);
    await convertFiles(projectsDir, list);
    await copyPublicFiles();
})();