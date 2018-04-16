/*eslint-env node, es6*/

/* Module Description */
/* Restructures the contents of the course for Canvas */

/* Put dependencies here */
const canvas = require('canvas-wrapper');
const asyncLib = require('async');

module.exports = (course, stepCallback) => {
    /* The folders to be created */
    var mainFolders = [
        {
            name: 'documents',
            id: course.info.canvasFolders.documents,
            lessonFolders: true,
        },
        {
            name: 'media',
            id: course.info.canvasFolders.media,
            lessonFolders: true,
        },
        {
            name: 'template',
            id: course.info.canvasFolders.template,
            lessonFolders: false,
        },
        {
            name: 'archive',
            id: course.info.canvasFolders.archive,
            lessonFolders: false,
        }
    ];

    var topFolderID = -1;
    
    course.message('File structure reorganization has begun. This may take a couple minutes.');

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
            setTimeout(() => {
                if (file.folder_id === topFolderID) {
                    eachCallback(null);
                    return;
                }

                var putObj = {
                    'parent_folder_id': topFolderID,
                    'on_duplicate': 'rename'
                };

                canvas.put(`/api/v1/files/${file.id}?on_duplicate=rename`, putObj,
                    (putErr) => {
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
            }, 0);
        }

        /* Get all the files */
        canvas.getFiles(course.info.canvasOU, (err, files) => {
            if (err) {
                callback(err);
                return;
            }
            /* Async move all to top folder */
            asyncLib.eachLimit(files, 20, moveFile, (eachErr) => {
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
            canvas.delete(`/api/v1/folders/${folder.id}?force=true`, (deleteErr) => {
                if (deleteErr) {
                    course.error(deleteErr);
                } else {
                    course.log('Folders Deleted', {
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
                    course.log('Folders Created', {
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
                var folderName = n < 9 ? `Week 0${n + 1}` : `Week ${n + 1}`;
                /* Create the folder in canvas */
                canvas.post(`/api/v1/courses/${course.info.canvasOU}/folders`, {
                    name: folderName,
                    parent_folder_id: parentFolder.id
                }, (err, folder) => {
                    if (err) next(err, null);
                    else {
                        course.log('Folders Created', {
                            name: folder.name,
                            id: folder.id,
                            parentFolder: parentFolder.name,
                            parentId: parentFolder.id
                        });
                        next(null, folder);
                    }
                });
            }, (timesErr) => {
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
        lessonFolders // Creates the "Lesson 01" through 14 folders in documents and media, if it was requested
    ];

    // eslint-disable-next-line
    asyncLib.waterfall(functions, (err, result) => {
        if (err) {
            course.error(err);
            stepCallback(null, course);
        } else {
            course.newInfo('reorganizeFiles', true);
            stepCallback(null, course);
        }
    });
};