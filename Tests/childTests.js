const tap = require('tap');
const canvas = require('canvas-wrapper');

module.exports = (course, callback) => {
    tap.test('reorganize-file-structure', (test) => {

        canvas.get(`/api/v1/courses/${course.info.canvasOU}/folders`, (err, folders) => {
            if (err) {
                console.log(err);
                test.end();
            }

            var courseFiles = folders.find(f => f.name === 'course files');
            var documents = folders.find(f => f.name === 'documents' && f.parent_folder_id === courseFiles.id);
            var media = folders.find(f => f.name === 'media' && f.parent_folder_id === courseFiles.id);
            var template = folders.find(f => f.name === 'template' && f.parent_folder_id === courseFiles.id);
            var archive = folders.find(f => f.name === 'archive' && f.parent_folder_id === courseFiles.id);

            var weekFolderNames = [
                'Week 01',
                'Week 02',
                'Week 03',
                'Week 04',
                'Week 05',
                'Week 06',
                'Week 07',
                'Week 08',
                'Week 09',
                'Week 10',
                'Week 11',
                'Week 12',
                'Week 13',
                'Week 14'
            ];

            var documentWeekFolders = [];
            var mediaWeekFolders = [];

            weekFolderNames.forEach(folderName => {
                documentWeekFolders.push(folders.find(f => f.name === folderName && f.parent_folder_id === documents.id));
            });

            weekFolderNames.forEach(folderName => {
                mediaWeekFolders.push(folders.find(f => f.name === folderName && f.parent_folder_id === media.id));
            });

            // Do all four main folders exist?
            test.ok(documents);
            test.ok(media);
            test.ok(template);
            test.ok(archive);

            if (course.settings.lessonFolders) {
                // Do all document week folders exist?
                documentWeekFolders.forEach((folder, index) => {
                    test.ok(folder, `Documents week folder ${index + 1} does not exist`);
                });

                // Do all media week folders exist?
                mediaWeekFolders.forEach((folder, index) => {
                    test.ok(folder, `Media week folder ${index + 1} does not exist`);
                });

                // Do all document week folders exist?
                documentWeekFolders.forEach((folder, index) => {
                    test.ok(folder.files_count === 0, `Documents week folder ${index + 1} is not empty.`);
                });

                // Do all media week folders exist?
                mediaWeekFolders.forEach((folder, index) => {
                    test.ok(folder.files_count === 0, `Media week folder ${index + 1} is not empty.`);
                });
            }

            // If lesson folders were requested, do they exist?
            if (course.settings.lessonFolders) {
                // Do we have the right total of folders?
                test.equal(folders.length, 33);
                // Right total lesson folders in documents?
                test.equal(folders.find(f => f.name === 'documents').folders_count, 14);
                // Right total lesson folders in media?
                test.equal(folders.find(f => f.name === 'media').folders_count, 14);
            } else {
                // Do we have the right total of folders?
                test.equal(folders.length, 5);
            }

            test.end();
        });
    });

    callback(null, course);
};

