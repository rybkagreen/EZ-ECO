export interface FileItem {
    name: string;
    path: string;
    is_directory: boolean;
    type?: string; // 'file' или 'directory'
    size: number;
    modified?: number; // timestamp
    // Опциональные поля для расширения
    id?: string;
    created?: string;
    permissions?: FilePermission[];
    version?: FileVersion;
}

export interface FilePermission {
    userId: string;
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
}

export interface FileVersion {
    id: string;
    version: number;
    created: string;
    comment?: string;
}

export interface FileExplorerProps {
    initialPath: string;
    onFileSelect?: (file: FileItem) => void;
    onDirectoryChange?: (path: string) => void;
}

export interface FileTab {
    id: string;
    name: string;
    path: string;
    active: boolean;
}
