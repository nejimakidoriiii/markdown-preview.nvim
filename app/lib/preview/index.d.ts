import { Buffer as NvimBuffer, NeovimClient } from '@chemzqm/neovim';
export interface PreviewContentData {
    options: any;
    isActive: boolean;
    winline: number;
    winheight: number;
    cursor: any[];
    pageTitle: any;
    theme: any;
    name: string;
    content: string[];
}
export declare function getBufferPath(nvim: NeovimClient, buffer: NvimBuffer): Promise<string>;
export declare function buildBufferData(nvim: NeovimClient, buffer: NvimBuffer): Promise<PreviewContentData>;
export declare function buildDiskData(nvim: NeovimClient, filePath: string, content: string): Promise<PreviewContentData>;
export declare function findBufferByName(nvim: NeovimClient, filePath: string): Promise<NvimBuffer | undefined>;
export { LocalMarkdownLink, parseLocalMarkdownLink } from './link';
