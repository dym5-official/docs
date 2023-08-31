const fs = require("fs");
const path = require("path");
const { parse } = require("yaml");

const createFilesMap = (projectsDir) => {
    const projects = fs.readdirSync(projectsDir)
        .map((project) => {
            const dir = path.join(projectsDir, project);
            const versions = fs.readdirSync(dir);

            return versions.map((ver) => {
                const configFile = path.join(dir, ver, 'config.yml');
                const configContent = fs.readFileSync(configFile).toString();

                return {
                    path: `${project}/${ver}`,
                    config: parse(configContent),
                }
            });
        });
    
    return projects;
};

module.exports = createFilesMap;