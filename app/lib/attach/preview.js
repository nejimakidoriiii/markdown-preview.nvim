"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPreviewData = void 0;
const tslib_1 = require("tslib");
function buildPreviewData(nvim, name, content, bufnr) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const winline = yield nvim.call('winline');
        const currentWindow = yield nvim.window;
        const winheight = yield nvim.call('winheight', currentWindow.id);
        const cursor = yield nvim.call('getpos', '.');
        const options = yield nvim.getVar('mkdp_preview_options');
        const pageTitle = yield nvim.getVar('mkdp_page_title');
        const theme = yield nvim.getVar('mkdp_theme');
        const currentBuffer = yield nvim.buffer;
        return {
            options,
            isActive: currentBuffer.id === bufnr,
            winline,
            winheight,
            cursor,
            pageTitle,
            theme,
            name,
            content,
        };
    });
}
exports.buildPreviewData = buildPreviewData;
