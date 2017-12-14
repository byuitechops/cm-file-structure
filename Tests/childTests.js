/* Dependencies */
const tap = require('tap');
const canvas = require('canvas-wrapper');

function g1Tests(course, callback) {
    // console.log(course.info.movedFiles);
    // /* Test Files */
    // tap.equals(true, course.info.movedFiles.includes('Book1.xlsc'));
    // tap.equals(true, course.info.movedFiles.includes('Book2.xlsm'));
    // tap.equals(true, course.info.movedFiles.includes('Book3.csv'));
    // tap.equals(true, course.info.movedFiles.includes('Book4.clk'));
    // tap.equals(true, course.info.movedFiles.includes('Doc1.docx'));
    // tap.equals(true, course.info.movedFiles.includes('Doc2.pdf'));
    // tap.equals(true, course.info.movedFiles.includes('Doc3.rtf'));
    // tap.equals(true, course.info.movedFiles.includes('Doc4.doc'));
    // tap.equals(true, course.info.movedFiles.includes('Doc5.xps'));
    // tap.equals(true, course.info.movedFiles.includes('test.txt'));
    // tap.equals(true, course.info.movedFiles.includes('testVideo.avi'));
    // tap.equals(true, course.info.movedFiles.includes('testVideo.mov'));
    // tap.equals(true, course.info.movedFiles.includes('testVideo.mp4'));
    // tap.equals(true, course.info.movedFiles.includes('testVideo.mpg'));
    // tap.equals(true, course.info.movedFiles.includes('testVideo.swf'));
    // tap.equals(true, course.info.movedFiles.includes('testVideo.wmv'));
    // tap.equals(true, course.info.movedFiles.includes('smallBanner.jpg'));
    // tap.equals(true, course.info.movedFiles.includes('course.css'));
    // tap.equals(true, course.info.movedFiles.includes('course.js'));
    //
    // /* Test folders */
    // tap.test('Async Stuff', (childTest) => {
    //     canvas.get(`/api/v1/courses/${course.info.canvasOU}/folders`, (err, folders) => {
    //         var folderNames = folders.map(folder => folder.name);
    //         childTest.equals(4, folderNames.length);
    //         childTest.equals(true, folderNames.includes('documents'));
    //         childTest.equals(true, folderNames.includes('media'));
    //         childTest.equals(true, folderNames.includes('archive'));
    //         childTest.equals(true, folderNames.includes('template'));
    //     });
    // });

    callback(null, course);
}

module.exports = [{
    gauntlet: 1,
    tests: g1Tests
}];
