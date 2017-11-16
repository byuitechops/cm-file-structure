/* Dependencies */
const tap = require('tap');

function g1Tests(course, callback) {
    // Tap tests for Gauntlet 3 go here
    tap.pass('Success! Wheee!');
    tap.fail('YOLO');
    callback(null, course);
}

function g2Tests(course, callback) {
    // Tap tests for Gauntlet 3 go here
    callback(null, course);
}

function g3Tests(course, callback) {
    // Tap tests for Gauntlet 3 go here
    callback(null, course);
}

function g4Tests(course, callback) {
    // Tap tests for Gauntlet 3 go here
    callback(null, course);
}

module.exports = {
    gauntlet1: g1Tests,
    gauntlet2: g2Tests,
    gauntlet3: g3Tests,
    gauntlet4: g4Tests,
};
