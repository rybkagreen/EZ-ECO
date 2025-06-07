import { FileItem } from '../types/FileTypes';

export class FileService {
    private baseUrl = 'http://localhost:8000/api/v1';

    async getFiles(path: string = ''): Promise<FileItem[]> {
        let url = `${this.baseUrl}/files/`;
        if (path && path !== '/') {
            url = `${this.baseUrl}/files/directory/?path=${encodeURIComponent(path)}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch files: ${response.statusText}`);
        }
        const data = await response.json();
        return data.files || [];
    }

    async uploadFile(file: File, parentPath: string): Promise<FileItem> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('parent_path', parentPath);

        const response = await fetch(`${this.baseUrl}/upload/`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Failed to upload file ${file.name}: ${response.statusText}`);
        }

        return response.json();
    }

    async createDirectory(name: string, parentPath: string): Promise<FileItem> {
        const response = await fetch(`${this.baseUrl}/create-directory/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name,
                parent_path: parentPath
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to create directory: ${response.statusText}`);
        }

        const data = await response.json();
        return {
            name: data.name,
            path: data.path,
            is_directory: data.is_directory,
            size: 0
        };
    }

    async createFolder(folderName: string, path: string = '/'): Promise<void> {
        const response = await fetch(`${this.baseUrl}/create-folder/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: folderName,
                path: path
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to create folder: ${response.statusText}`);
        }
    }

    async deleteFile(filePath: string): Promise<void> {
        const response = await fetch(`${this.baseUrl}/delete-file/`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                path: filePath
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to delete file: ${response.statusText}`);
        }
    }

    async moveFile(sourcePath: string, targetPath: string): Promise<FileItem> {
        const response = await fetch(`${this.baseUrl}/move-file/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                source_path: sourcePath,
                target_path: targetPath
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to move file: ${response.statusText}`);
        }

        const data = await response.json();
        return {
            name: data.name,
            path: data.path,
            is_directory: data.is_directory,
            size: data.size || 0,
            modified: data.modified
        };
    }
}
