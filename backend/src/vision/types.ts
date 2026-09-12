export interface OCRItem {
    text: string;
    confidence: number;
}

export interface DesktopResponse {
    success: boolean;
    result: OCRItem[];
}