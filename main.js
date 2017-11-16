/*eslint-env node, es6*/

/* Module Description */
/* Restructures the contents of the course for Canvas */

/* Put dependencies here */
const path = require('path');

/* View available course object functions */
// https://github.com/byuitechops/d2l-to-canvas-conversion-tool/blob/master/documentation/classFunctions.md

module.exports = (course, stepCallback) => {
    course.addModuleReport('cmFileStructure');

    var documentExtensions = [
        '.doc',
        '.docx',
        '.pdf',
        '.xml',
        '.xls',
        '.xlsx',
        '.csv',
        '.odt',
        '.ods',
        '.txt',
        '.dat',
        '.log',
        '.mdb',
        '.sav',
        '.sql',
        '.tar',
        '.xlr',
        '.wpd',
        '.wks',
        '.wps'
    ];

    var mediaExtensions = [
        '.png',
        '.jpeg',
        '.ppt',
        '.pptx',
        '.aif',
        '.cda',
        '.mid',
        '.midi',
        '.mp3',
        '.ogg',
        '.wav',
        '.wma',
        '.wpl',
        '.gif',
        '.bmp',
        '.ai',
        '.ico',
        '.jpg',
        '.ps',
        '.psd',
        '.svg',
        '.tif',
        '.tiff',
        '.pps',
        '.avi',
        '.wmv',
        '.mpg',
        '.mpeg'
    ];

    var templateExtensions = [

    ];

    // Get file list from course.contents

    course.content.forEach(file => {

        function setPath(location) {
            file.newPath = path.resolve(
                course.info.altUnzippedFilepath,
                location,
                file.name
            );
            course.success('cmFileStructure', `${file.name} set to be put in the ${location} folder.`);
        }

        if (documentExtensions.includes(file.ext)) {
            setPath('documents');
        } else if (mediaExtensions.includes(file.ext)) {
            setPath('media');
        } else if (templateExtensions.includes(file.ext)) {
            setPath('template');
        } else {
            setPath('archive');
            course.warning('cmFileStructure', `${file.name} was added to the Archive folder. Is this correct?`);
        }
    });

    // For each one, add the new location based on its ext

    stepCallback(null, course);
};
