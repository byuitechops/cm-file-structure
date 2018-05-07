const canvas = require('canvas-wrapper');

module.exports = (course, stepCallback) => {

    /* TODO Process
        1. retrieveFolders() - Grab all folders in course
        2. moveFolders(folderList) - Move all folders to top (this makes it *sooo* much easier to delete them, same with moving files)
        3. retrieveFiles() - Grab all files in course
        4. moveFiles(fileList) - Move to top folder
        5. deleteFolders() - Delete all folders
        6. createFolders() - Create new folders
        7. createLessonFolders() - If requested, create lesson folders in documents/media (14 for normal, 7 for block course)
    */

    var topFolder = {};
    var courseFolders = [];

    /* Let the grandchild that moves the files know it should go ahead */
    course.settings.reorganizeFiles = true;

    function retrieveFolders() {
        return new Promise((resolve, reject) => {
            canvas.get(`/api/v1/courses/${course.info.canvasOU}/folders`, (err, folderList) => {
                if (err) return reject(err);
                courseFolders = folderList;
                resolve(folderList);
            });
        });
    }

    function moveFolders(folderList) {
        return new Promise((resolve, reject) => {
            topFolder = folderList.find(folder => folder.name === 'course files');
            if (!topFolder) {
                reject(new Error('The top folder in the course was not found. Cannot move files or folders.'));
            }

            function moveFolder(folder) {
                return new Promise((resolve, reject) => {
                    if (folder.name === 'course files' || folder.parent_folder_id === topFolder.id) {
                        return resolve();
                    }
                    canvas.put(`/api/v1/folders/${folder.id}?on_duplicate=rename`, {
                        'parent_folder_id': topFolder.id
                    }, (err, updatedFolder) => {
                        if (err) {
                            course.error(err);
                        }
                        resolve();
                    });
                });
            }

            Promise.all(folderList.map(moveFolder))
                .then(resolve)
                .catch(reject);
        });
    }

    function retrieveFiles() {
        return new Promise((resolve, reject) => {
            canvas.getFiles(course.info.canvasOU, (err, fileList) => {
                if (err) return reject(err);
                resolve(fileList);
            });
        });
    }

    function moveFiles(fileList) {
        return new Promise((resolve, reject) => {

            function moveFile(file) {
                return new Promise((resolve, reject) => {
                    canvas.put(`/api/v1/files/${file.id}?on_duplicate=rename`, {
                        'parent_folder_id': topFolder.id
                    }, (err, updatedFolder) => {
                        if (err) course.error(err);
                        resolve();
                    });
                });
            }

            Promise.all(fileList.map(moveFile))
                .then(resolve)
                .catch(reject);
        });
    }

    function deleteFolders() {
        return new Promise((resolve, reject) => {

            function deleteFolder(folder) {
                return new Promise((resolve, reject) => {
                    if (folder.name === 'course files') {
                        return resolve();
                    }
                    canvas.delete(`/api/v1/folders/${folder.id}`, err => {
                        if (err) course.error(err);
                        course.log('Folders Removed', {
                            'Folder': folder.name,
                            'ID': folder.id
                        });
                        resolve();
                    });
                });
            }

            Promise.all(courseFolders.map(deleteFolder))
                .then(resolve)
                .catch(reject);
        })
    }

    function createFolders() {
        return new Promise((resolve, reject) => {

            var foldersToCreate = [
                'documents',
                'media',
                'template',
                'archive'
            ];

            function createFolder(folder, parentFolderID) {
                return new Promise((resolve, reject) => {
                    canvas.post(`/api/v1/courses/${course.info.canvasOU}/folders`, {
                        'name': folder,
                        'parent_folder_id': parentFolderID
                    }, (err, newFolder) => {
                        if (err) {
                            course.error(err);
                        } else {
                            course.info.canvasFolders[folder] = newFolder.id;
                            course.log('Folders Created', {
                                'Folder': newFolder.name,
                                'ID': newFolder.id
                            });
                        }
                        resolve();
                    });
                });
            }

            function createLessonFolders() {

                if (course.settings.lessonFolders === true) {
                    var folderCount = course.settings.blockCourse === true ? 7 : 14;
                    var lessonFolderList = [];

                    for (var i = 1; i <= folderCount; i++) {
                        lessonFolderList.push(`Week ${i < 10 ? '0' + i : i}`);
                    };

                    documentFolderPromises = lessonFolderList.map(folder => createFolder(folder, course.info.canvasFolders.documents));
                    mediaFolderPromises = lessonFolderList.map(folder => createFolder(folder, course.info.canvasFolders.media));
                    return Promise.all([...documentFolderPromises, ...mediaFolderPromises]);
                } else {
                    course.message('Lesson folders were not requested.');
                    return;
                }
            }

            var mainFolderPromises = foldersToCreate.map(folder => createFolder(folder, topFolder.id));
            var documentFolderPromises = [];
            var mediaFolderPromises = [];

            /* Create the main four folders */
            Promise.all(mainFolderPromises)
                .then(createLessonFolders)
                .then(resolve)
                .catch(reject);
        });
    }

    // AGENDA
    retrieveFolders()
        .then(moveFolders)
        .then(retrieveFiles)
        .then(moveFiles)
        .then(deleteFolders)
        .then(createFolders)
        .then(() => {
            stepCallback(null, course);
        })
        .catch(course.error);
};