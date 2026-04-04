export interface VisibilityAutoOptions {
    selector?: string;
    threshold?: number;
    onChange?: (el: Element, visible: boolean) => void;
}
export declare function measure(el: HTMLElement): {
    width: number;
    height: number;
} | null;
export declare function apply(el: HTMLElement): boolean;
export declare function restore(el: HTMLElement): boolean;
export declare function restoreAll(): void;
export declare function measureAndApplyAll(selector: string): number;
export declare function init(options?: VisibilityAutoOptions): () => void;
