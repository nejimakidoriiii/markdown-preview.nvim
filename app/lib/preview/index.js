"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseLocalMarkdownLink = exports.findBufferByName = exports.buildDiskData = exports.buildBufferData = exports.getBufferPath = void 0;
const tslib_1 = require("tslib");
const path_1 = tslib_1.__importDefault(require("path"));
function getBufferPath(nvim, buffer) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const name = yield buffer.name;
        if (!name || path_1.default.isAbsolute(name)) {
            return name;
        }
        return (yield nvim.eval(`fnamemodify(bufname(${buffer.id}), ':p')`));
    });
}
exports.getBufferPath = getBufferPath;
function buildBufferData(nvim, buffer) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const winline = yield nvim.call('winline');
        const currentWindow = yield nvim.window;
        const winheight = yield nvim.call('winheight', currentWindow.id);
        const cursor = yield nvim.call('getpos', '.');
        const options = yield nvim.getVar('mkdp_preview_options');
        const pageTitle = yield nvim.getVar('mkdp_page_title');
        const theme = yield nvim.getVar('mkdp_theme');
        const name = yield getBufferPath(nvim, buffer);
        const content = yield buffer.getLines();
        const currentBuffer = yield nvim.buffer;
        return {
            options,
            isActive: currentBuffer.id === buffer.id,
            winline,
            winheight,
            cursor,
            pageTitle,
            theme,
            name,
            content
        };
    });
}
exports.buildBufferData = buildBufferData;
function buildDiskData(nvim, filePath, content) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const options = yield nvim.getVar('mkdp_preview_options');
        const pageTitle = yield nvim.getVar('mkdp_page_title');
        const theme = yield nvim.getVar('mkdp_theme');
        return {
            options,
            isActive: false,
            winline: 0,
            winheight: 0,
            cursor: [0, 0, 0, 0],
            pageTitle,
            theme,
            name: filePath,
            content: content.split('\n')
        };
    });
}
exports.buildDiskData = buildDiskData;
function findBufferByName(nvim, filePath) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const buffers = yield nvim.buffers;
        const normalized = path_1.default.normalize(filePath);
        for (const buffer of buffers) {
            const name = yield getBufferPath(nvim, buffer);
            if (name && path_1.default.normalize(name) === normalized) {
                return buffer;
            }
        }
        return undefined;
    });
}
exports.findBufferByName = findBufferByName;
var link_1 = require("./link");
Object.defineProperty(exports, "parseLocalMarkdownLink", { enumerable: true, get: function () { return link_1.parseLocalMarkdownLink; } });
