import { NeovimClient } from '@chemzqm/neovim';
export declare function buildPreviewData(nvim: NeovimClient, name: string, content: string[], bufnr: number | undefined): Promise<{
    options: import("@chemzqm/neovim").VimValue;
    isActive: boolean;
    winline: any;
    winheight: any;
    cursor: any;
    pageTitle: import("@chemzqm/neovim").VimValue;
    theme: import("@chemzqm/neovim").VimValue;
    name: string;
    content: string[];
}>;
