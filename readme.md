# Reorganize File Structure
### *Package Name*: reorganize-file-structure
### *Child Type*: Post-import
### *Platform*: Online
### *Required*: Required

This child module is built to be used by the Brigham Young University - Idaho D2L to Canvas Conversion Tool. It utilizes the standard `module.exports => (course, stepCallback)` signature and uses the Conversion Tool's standard logging functions. You can view extended documentation [Here](https://github.com/byuitechops/d2l-to-canvas-conversion-tool/tree/master/documentation).

## Purpose
This child module organizes course files into four different folders:
* Documents 
* Media 
* Template
* Archive

Upon request, it also adds folders for Lessons 1-14 inside of the documents and media folders.

## How to Install

```
npm install reorganize-file-structure
```

## Run Requirements
This child module requires the following fields in the course.info object:
* `fileName`
* `courseCode`
* `canvasOU`

It also uses `course.settings.lessonFolders` as an option.

## Options
| Option | Values | Description |
|--------|--------|-------------|
|Create Lesson Folders| true/false | Determines if lesson folders should be created inside of "documents" and "media."|

## Outputs
None

## Process
1. Move all folders to the top level
2. Move all files to the top level x2
3. Delete all folders
4. Create new folders (documents, media, etc.)
5. Move files into the new folders
6. Create lesson folders (if enabled)

## Log Categories
Categories used in logging data in this module:
- Folders Moved to Top Folder in Canvas
- Files Moved to Top Folder in Canvas
- Folders Deleted in Canvas
- Folders Created in Canvas
- File Names Changed
- Files Moved in Canvas
- Folders Created in Canvas

## Requirements
In order to start off with clean courses all files are to be moved into one of 4 directories and old directories are to be deleted. Online courses can has 14 lesson folders created if they so desire.