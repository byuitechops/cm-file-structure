/*eslint-env node, es6*/

/* Module Description */
/* Restructures the contents of the course for Canvas */

/* Put dependencies here */
const canvas = require('canvas-wrapper');
const asyncLib = require('async');

module.exports = (course, stepCallback) => {

    var documentExtensions = [
        '.doc',
        '.docx',
        '.pdf',
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
        '.wps',
        '.xlsm',
        '.rtf',
        '.xps'
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
        '.mp4',
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
        '.mpeg',
        '.swf',
        '.mov'
    ];

    /* The folders to be created */
    var folders = [
        {
            name: 'documents',
            id: -1,
            lessonFolders: true,
        },
        {
            name: 'media',
            id: -1,
            lessonFolders: true,
        },
        {
            name: 'template',
            id: -1,
            lessonFolders: false,
        },
        {
            name: 'archive',
            id: -1,
            lessonFolders: false,
        },
    ];

    /* Checks if we have any existing folders with the same names */
    function checkFolders(callback) {
        // Get the names of the folders we'll be needing
        var folderNames = folders.map(folder => folder.name);
        // Get the canvas folders from the course
        canvas.get(`/api/v1/courses/${course.info.canvasOU}/folders`, (err, canvasFolders) => {
            // For each canvas folder...
            canvasFolders.forEach(canvasFolder => {
                // If we already have a folder in canvas with the name we need...
                if (folderNames.includes(canvasFolder.name)) {
                    // Assign its ID to the folder object, so we can use it
                    var theFolder = folders.find(folder => folder.name === canvasFolder.name);
                    theFolder.id = canvasFolder.id;
                }
            });
            callback(null);
        });
    }

    /* Creates the four folders we'll be moving files into */
    function createFolders(callback) {
        /* Create each folder (eachSeries to gaurantee folder order) */
        asyncLib.eachSeries(folders, (folder, eachCallback) => {
            /* If we found an existing folder with the same name, skip creating this one */
            if (folder.id != -1) {
                eachCallback(null);
            } else {
                /* Create the folder in canvas */
                canvas.post(`/api/v1/courses/${course.info.canvasOU}/folders`, {
                    name: folder.name,
                    parent_folder_path: '/'
                },
                (err, results) => {
                    if (err) eachCallback(err);
                    else {
                        /* Set the folder ID we'll use when moving stuff to the new folder's id */
                        folder.id = results.id;
                        course.log('Folders Created', {
                            name: folder.name,
                            id: folder.id
                        });
                        eachCallback(null);
                    }
                });
            }
        }, (err) => {
            if (err) callback(err);
            else {
                callback(null);
            }
        });
    }

    // Get all course files
    function getFiles(callback) {
        canvas.get(`/api/v1/courses/${course.info.canvasOU}/files`, (err, files) => {
            if (err) callback(err, files);
            else {
                course.message(`All ${files.length} files retrieved from the course in Canvas.`)
                callback(null, files);
            }
        });
    }

    function collectDupes(files, callback) {
        course.newInfo('restructureDupeFiles', []);
        course.newInfo('restructureDupeFilesToDo', []);
        var fileNames = files.map(file => file.display_name);
        files.filter(file => {
            /* If the first index and last index are different, there's more than one */
            if (course.info.restructureDupeFilesToDo.includes(file.display_name)) {
                return;
            }
            if (fileNames.indexOf(file.display_name) != fileNames.lastIndexOf(file.display_name)) {
                course.info.restructureDupeFiles.push(file);
                course.info.restructureDupeFilesToDo.push(file.display_name);
            }
        });
        callback(null, files);
    }

    function changeFileNames(files, callback) {
        asyncLib.eachLimit(course.info.restructureDupeFiles, 15, (file, eachCallback) => {

            canvas.put(`/api/v1/files/${file.id}?name=Copy%20-%20${file.display_name}`, {}, (err, result) => {
                if (err) {
                    eachCallback(err);
                } else {
                    file.display_name = `Copy - ${file.display_name}`;
                    course.log('File Names Changed', {
                        'Old Name': file.display_name,
                        'New Name':`Copy - ${file.display_name}`
                    });
                    eachCallback(null);
                }
            });

        }, (err) => {
            if (err) callback(err, files);
            else {
                callback(null, files);
            }
        });
    }

    function moveFiles(files, callback) {
        course.newInfo('movedFiles', []);

        function moveToFolder(file, folder, eachCallback) {
            canvas.put(`/api/v1/files/${file.id}`,
            {parent_folder_id: folder.id},
            (err, result) => {
                if (err) {
                    course.error(err);
                    eachCallback(null);
                }
                else {
                    course.log('Files Moved', {
                        'Name': file.display_name,
                        'Moved To': folder.name
                    })
                    course.info.movedFiles.push(file.display_name);
                    eachCallback(null);
                }
            });
        }

        /* For Each -> File | See what it's extension is, then move it */
        asyncLib.eachLimit(files, 15, (file, eachCallback) => {

            var splitName = file.display_name.split('.');
            var extension = '.' + splitName[splitName.length - 1];
            var templateFiles = [
                'dashboard.jpg',
                'homeImage.jpg',
                'smallBanner.jpg'
            ];

            /* Figure out which folder to move it to */
            if (documentExtensions.includes(extension)) {
                /* Move to Documents */
                moveToFolder(file, folders[0], eachCallback);
            } else if (templateFiles.includes(file.display_name)) {
                /* Move to Template */
                moveToFolder(file, folders[2], eachCallback);
            } else if (mediaExtensions.includes(extension)) {
                /* Move to Media */
                moveToFolder(file, folders[1], eachCallback);
            } else {
                /* Move to Archive */
                moveToFolder(file, folders[3], eachCallback);
            }

        }, (err, result) => {
            if (err) {
                callback(err);
            } else {
                if (course.info.restructureDupeFilesToDo.length > 0) {
                    course.warning('Some files had twins, attempting to move them again.');
                    setTimeout(() => {
                        moveFiles(course.info.restructureDupeFiles, callback);
                        course.info.restructureDupeFilesToDo = [];
                    }, 5000);
                } else {
                    callback(null);
                }
            }
        });
    }

    function deleteExtraFolders(callback) {
        canvas.get(`/api/v1/courses/${course.info.canvasOU}/folders`, (err, canvasFolders) => {
            if (err) {
                course.error(err);
                callback(err);
                return;
            }
            /* Get the folder names */
            var folderNames = folders.map(folder => folder.name);
            /* For Each -> Canvas Folder | If it isn't one of the four folders.... delete it */
            asyncLib.each(canvasFolders, (canvasFolder, eachCallback) => {
                if (!folderNames.includes(canvasFolder.name) &&
                    canvasFolder.name != 'course files' &&
                    canvasFolder.name != 'course_image') {
                    canvas.delete(`/api/v1/folders/${canvasFolder.id}`, (delErr, result) => {
                        if (delErr) {
                            course.error(delErr);
                            eachCallback(null);
                        }
                        else {
                            course.log('Folders Deleted', {
                                'Name': canvasFolder.name
                            });
                            eachCallback(null);
                        }
                    });
                } else {
                    eachCallback(null);
                }
            }, (err) => {
                if (err) callback(err);
                else callback(null);
            });
        });
    }

    /* Create the Lesson folders in Documents/Media */
    function createLessonFolders(callback) {
        if (course.info.lessonFolders == false) {
            callback(null, null);
            return;
        }
        /* Get just the folders we want to create lesson folders in */
        var parentFolders = folders.filter(folder => folder.lessonFolders);

        function makeFolders(parentFolder, eachCallback) {
            asyncLib.times(14, (n, next) => {
                /* Set the folder name */
                var folderName = 'Lesson ' + (n + 1); //n < 10 ? `Lesson 0${n + 1}` : `Lesson ${n + 1}`;
                /* Create the folder in canvas */
                canvas.post(`/api/v1/courses/${course.info.canvasOU}/folders`, {
                    name: folderName,
                    parent_folder_path: `/${parentFolder.name}/`
                },
                    (err, folder) => {
                        if (err) next(err, null);
                        else {
                            course.success('reorganize-file-structure', `ID: ${folder.name} folder created inside ${parentFolder.name}.`);
                            course.log('Folders Created', {
                                name: folder.name,
                                id: folder.id,
                                parentFolder: parentFolder.name,
                                parentId: parentFolder.id
                            })
                            next(null, folder);
                        }
                    });
            }, (timesErr, folders) => {
                if (timesErr) course.error(timesErr);
                else {
                    eachCallback(null);
                }
            });
        }

        asyncLib.each(parentFolders, makeFolders, callback);
    }

    var functions = [
        checkFolders, // Checks existing canvas folders for ones with the same names as ones we'll create
        createFolders, // Create our four folders
        getFiles, // Retrieves files from canvas
        collectDupes, // Checks for duplicate file names
        changeFileNames, // Change names with twin file names to a different name to prevent issues
        moveFiles, // Moves files into the right folders
        deleteExtraFolders, // Deletes any folders left over, now that they are empty
        createLessonFolders, // Creates lesson folders for L1-12, if asked to do so
    ];

    asyncLib.waterfall(functions, (err, result) => {
        if (err) {
            course.error(err);
            stepCallback(null, course);
        } else {
            stepCallback(null, course);
        }
    });
};
