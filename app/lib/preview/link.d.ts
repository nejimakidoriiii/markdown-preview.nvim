export interface LocalMarkdownLink {
    path: string;
    anchor: string;
}
interface ClassifiedLocalLink extends LocalMarkdownLink {
    kind: 'markdown' | 'windows-non-markdown';
}
export declare function classifyLocalLink(href: string): ClassifiedLocalLink | null;
export declare function parseLocalMarkdownLink(href: string): LocalMarkdownLink | null;
export {};
