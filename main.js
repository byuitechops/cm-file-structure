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

    var templateFiles = [
        'dashboard.jpg',
        'homeImage.jpg',
        'smallBanner.jpg'
    ];

    /* The folders to be created */
    var mainFolders = [
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

    var topFolderID = -1;
    var canvasFiles = [];


    /* Get top folder so we can move everything to it */
    function getTopFolder(callback) {
        canvas.get(`/api/v1/courses/${course.info.canvasOU}/folders`, (err, folders) => {
            if (err) {
                callback(err);
                return;
            }
            var topFolder = folders.find(folder => folder.name == 'course files');
            topFolderID = topFolder.id;
            callback(null);
        });
    }

    /* Moves folders to the top level */
    function moveFoldersToTop(callback) {

        /* Move a folder to the top folder */
        function moveFolder(folder, eachCallback) {
            if (folder.parent_folder_id === topFolderID ||
                folder.id === topFolderID) {
                eachCallback(null);
                return;
            }

            var putObj = {
                'parent_folder_id': topFolderID,
                'on_duplicate': 'rename'
            };

            canvas.put(`/api/v1/folders/${folder.id}`, putObj,
                (putErr, changedFolder) => {
                    if (putErr) {
                        course.error(putErr);
                    } else {
                        course.log('Folders Moved to Top Folder in Canvas', {
                            'Name': changedFolder.name,
                            'ID': changedFolder.id
                        });
                    }
                    eachCallback(null);
                });
        }

        canvas.get(`/api/v1/courses/${course.info.canvasOU}/folders`, (err, folders) => {
            if (err) {
                callback(err);
                return;
            }

            asyncLib.eachLimit(folders, 10, moveFolder, (eachErr) => {
                if (eachErr) {
                    callback(eachErr);
                    return;
                }
                callback(null);
            });
        });
    }

    /* Moves all files to the top folder to make it easier to move them later */
    function moveFilesToTop(callback) {

        /* Move a file to the top folder */
        function moveFile(file, eachCallback) {
            if (file.folder_id === topFolderID /*|| file.display_name == 'dashboard.jpg'*/) {
                eachCallback(null);
                return;
            }

            var putObj = {
                'parent_folder_id': topFolderID,
                'on_duplicate': 'rename'
            };

            canvas.put(`/api/v1/files/${file.id}?on_duplicate=rename`, putObj,
                (putErr, changedFile) => {
                    if (putErr) {
                        course.error(putErr);
                    } else {
                        course.log('Files Moved to Top Folder in Canvas', {
                            'Name': file.display_name,
                            'ID': file.id
                        });
                    }
                    eachCallback(null);
                });
        }

        /* Get all the files */
        canvas.getFiles(course.info.canvasOU, (err, files) => {
            if (err) {
                callback(err);
                return;
            }
            canvasFiles = files;
            /* Async move all to top folder */
            asyncLib.each(files, moveFile, (eachErr) => {
                if (eachErr) {
                    callback(eachErr);
                    return;
                }
                callback(null);
            });
        });

    }

    /* Remove all of the folders from the course, except course_image */
    function deleteFolders(callback) {

        function deleteFolder(folder, eachCallback) {
            if (folder.name == 'course files') {
                eachCallback(null);
                return;
            }
            if (folder.files_count > 0) {
                course.warning(`${folder.name} contains files, so it wasn't deleted.`);
                eachCallback(null);
                return;
            }
            if (folder.folders_count > 0) {
                course.warning(`${folder.name} contains folders, so it wasn't deleted.`);
                eachCallback(null);
                return;
            }
            canvas.delete(`/api/v1/folders/${folder.id}?force=true`, (deleteErr, body) => {
                if (deleteErr) {
                    course.error(deleteErr);
                } else {
                    course.log('Folders Deleted in Canvas', {
                        'Folder Name': folder.name,
                        'Folder ID': folder.id
                    });
                }
                eachCallback(null);
            });
        }

        canvas.get(`/api/v1/courses/${course.info.canvasOU}/folders`, (err, folders) => {
            if (err) {
                callback(err);
                return;
            }

            /* For each folder, delete it */
            asyncLib.eachLimit(folders, 10, deleteFolder, (eachErr) => {
                if (eachErr) {
                    callback(eachErr);
                    return;
                }
                callback(null);
            });
        });
    }

    function createMainFolders(callback) {

        function createFolder(folder, eachCallback) {

            var postObj = {
                'name': folder.name,
                'parent_folder_id': topFolderID
            };

            canvas.post(`/api/v1/courses/${course.info.canvasOU}/folders`, postObj, (postErr, newFolder) => {
                if (postErr) {
                    course.error(postErr);
                } else {
                    /* Set the ID of our folders object to the new folder */
                    folder.id = newFolder.id;
                    course.log('Folders Created in Canvas', {
                        'Folder Name': newFolder.name,
                        'Folder ID': newFolder.id
                    });
                }
                eachCallback(null);
            });
        }

        asyncLib.eachLimit(mainFolders, 10, createFolder, (err) => {
            if (err) {
                callback(err);
                return;
            }
            callback(null);
        });
    }

    /* Move the files into their new homes */
    function moveFiles(callback) {

        /* Move a file to their new folder */
        function moveFile(file, eachCallback) {

            /* If it is the course image, we don't want to move it */
            if (file.display_name == 'dashboard.jpg' && file.folder_id != topFolderID) {
                eachCallback(null);
                return;
            }

            var newHome;
            var splitName = file.display_name.split('.');
            var extension = '.' + splitName[splitName.length - 1];

            /* Figure out which folder to move it to */
            if (documentExtensions.includes(extension)) {
                /* Move to Documents */
                newHome = mainFolders[0].id;
            } else if (templateFiles.includes(file.display_name)) {
                /* Move to Template */
                newHome = mainFolders[2].id;
            } else if (mediaExtensions.includes(extension)) {
                /* Move to Media */
                newHome = mainFolders[1].id;
            } else {
                /* Move to Archive */
                newHome = mainFolders[3].id;
            }

            var putObj = {
                'parent_folder_id': newHome,
                'on_duplicate': 'rename'
            };

            canvas.put(`/api/v1/files/${file.id}`, putObj,
                (putErr, changedFile) => {
                    if (putErr) {
                        course.error(putErr);
                    }
                    eachCallback(null);
                });
        }

        asyncLib.eachLimit(canvasFiles, 10, moveFile, err => {
            if (err) {
                callback(err);
                return;
            }
            callback(null);
        });
    }

    function lessonFolders(callback) {
        if (!course.settings.lessonFolders) {
            course.message('Lesson folders were not created in documents and media. The option was not requested.');
            callback(null);
            return;
        }

        var parentFolders = mainFolders.filter(folder => folder.lessonFolders);

        function createFolders(parentFolder, eachCallback) {
            asyncLib.times(14, (n, next) => {
                /* Set the folder name */
                var folderName = 'Lesson ' + (n + 1); //n < 10 ? `Lesson 0${n + 1}` : `Lesson ${n + 1}`;
                /* Create the folder in canvas */
                canvas.post(`/api/v1/courses/${course.info.canvasOU}/folders`, {
                    name: folderName,
                    parent_folder_id: parentFolder.id
                }, (err, folder) => {
                    if (err) next(err, null);
                    else {
                        course.log('Folders Created in Canvas', {
                            name: folder.name,
                            id: folder.id,
                            parentFolder: parentFolder.name,
                            parentId: parentFolder.id
                        });
                        next(null, folder);
                    }
                });
            }, (timesErr, folders) => {
                if (timesErr) {
                    callback(timesErr);
                    return;
                }
                eachCallback(null);
            });
        }

        asyncLib.eachLimit(parentFolders, 10, createFolders, (err) => {
            if (err) {
                callback(err);
                return;
            }
            callback(null);
        });
    }

    var functions = [
        getTopFolder, // Get the ID of the top folder
        moveFoldersToTop, // Moves all the folders to the top level so its easy to delete them
        moveFilesToTop, // This doesn't always catch every single file
        moveFilesToTop, // Run a second time to check for leftovers
        deleteFolders, // Deletes the folders at the top level (now that we have all the files out)
        createMainFolders, // Creates the four main folders we'll move everything in to
        moveFiles, // Moves all the files into their new homes
        lessonFolders // Creates the "Lesson 01" through 14 folders in documents and media, if it was requested
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