const asyncHandler = require("express-async-handler");
const {
    readFiles,
    deleteFileFromStorage,
    getReadStream,
    uploadFileFromObject,
    getObjectFromFile,
} = require("../config/db");

const uploadFiles = asyncHandler(async (req, res) => {
    res.json(req.file);
});

const uploadFileFromBase64 = asyncHandler(async (req, res) => {
    let newFileName = await uploadFileFromObject(req.body);
    res.json(await readFiles(newFileName));
});

const getFileAsBase64 = asyncHandler(async (req, res) => {
    let newFile = await getObjectFromFile(await readFiles(req.params.fileName));
    res.json(newFile);
});

const getFileAsBase64Local = asyncHandler(async (fileName) => {
    let newFile = await getObjectFromFile(await readFiles(fileName));
    return newFile;
});

const getFiles = asyncHandler(async (req, res) => {
    let files = await readFiles(req.params.fileName);
    if (!files) {
        res.status(404);
        throw new Error("No file matching the search criteria could be found.");
    }
    res.json(files);
});

const streamFile = asyncHandler(async (req, res) => {
    let readStream = await getReadStream(req.params.fileName);
    if (readStream.error) {
        res.status(404);
        throw new Error(readStream.error);
    }
    readStream.pipe(res);
});

const deleteFile = asyncHandler(async (req, res) => {
    let deleteStatus = await deleteFileFromStorage(req.params.fileName);
    if (deleteStatus.error) {
        res.status(404);
    }
    res.json(deleteStatus);
});

module.exports = {
    uploadFiles,
    getFiles,
    deleteFile,
    streamFile,
    uploadFileFromBase64,
    getFileAsBase64,
    getFileAsBase64Local
};
