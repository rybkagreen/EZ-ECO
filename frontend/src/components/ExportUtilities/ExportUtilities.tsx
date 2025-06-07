import React, { useState, useCallback, useMemo } from 'react';
import './ExportUtilities.css';

export interface ExportData {
  files: FileInfo[];
  metadata: ExportMetadata;
  settings: ExportSettings;
}

export interface FileInfo {
  path: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
  content?: string | ArrayBuffer;
  permissions?: string;
  owner?: string;
  checksum?: string;
}

export interface ExportMetadata {
  exportDate: string;
  exportVersion: string;
  totalFiles: number;
  totalSize: number;
  source: string;
  includeHidden: boolean;
  includeSystem: boolean;
  compressionLevel: number;
}

export interface ExportSettings {
  format: 'json' | 'csv' | 'xml' | 'zip' | 'tar' | 'yaml';
  includeContent: boolean;
  includeMetadata: boolean;
  includePermissions: boolean;
  compressionLevel: number;
  encryptionEnabled: boolean;
  password?: string;
  splitSize?: number; // MB
  includeChecksums: boolean;
}

export interface ExportUtilitiesProps {
  files: FileInfo[];
  onExportStart?: (format: string) => void;
  onExportComplete?: (data: ExportData, downloadUrl: string) => void;
  onExportError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
  maxFileSize?: number; // MB
  allowedFormats?: string[];
}

const DEFAULT_SETTINGS: ExportSettings = {
  format: 'json',
  includeContent: false,
  includeMetadata: true,
  includePermissions: false,
  compressionLevel: 6,
  encryptionEnabled: false,
  includeChecksums: false,
};

const ExportUtilities: React.FC<ExportUtilitiesProps> = ({
  files = [],
  onExportStart,
  onExportComplete,
  onExportError,
  onProgress,
  maxFileSize = 100,
  allowedFormats = ['json', 'csv', 'xml', 'zip', 'tar', 'yaml'],
}) => {
  const [settings, setSettings] = useState<ExportSettings>(DEFAULT_SETTINGS);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [estimatedSize, setEstimatedSize] = useState(0);

  // Calculate estimated export size
  const calculateEstimatedSize = useCallback(() => {
    let size = 0;
    
    files.forEach(file => {
      size += file.size;
      
      if (settings.includeMetadata) {
        size += JSON.stringify({
          path: file.path,
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
          permissions: file.permissions,
          owner: file.owner,
        }).length * 2; // UTF-16 encoding
      }
      
      if (settings.includeChecksums) {
        size += 64; // SHA-256 hash
      }
    });
    
    // Apply compression estimate
    if (settings.format === 'zip' || settings.format === 'tar') {
      size *= (1 - settings.compressionLevel / 10);
    }
    
    setEstimatedSize(size);
  }, [files, settings]);

  // Update estimated size when settings change
  React.useEffect(() => {
    calculateEstimatedSize();
  }, [calculateEstimatedSize]);

  // Generate checksum
  const generateChecksum = useCallback(async (content: string | ArrayBuffer): Promise<string> => {
    const encoder = new TextEncoder();
    const data = typeof content === 'string' ? encoder.encode(content) : new Uint8Array(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }, []);

  // Encrypt data
  const encryptData = useCallback(async (data: string, password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );
    
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(data)
    );
    
    // Combine salt, iv, and encrypted data
    const combined = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encryptedData), salt.length + iv.length);
    
    return btoa(String.fromCharCode(...combined));
  }, []);

  // Export to JSON
  const exportToJSON = useCallback(async (data: ExportData): Promise<string> => {
    const processedData = { ...data };
    
    if (settings.includeChecksums) {
      for (const file of processedData.files) {
        if (file.content) {
          file.checksum = await generateChecksum(file.content);
        }
      }
    }
    
    let jsonString = JSON.stringify(processedData, null, 2);
    
    if (settings.encryptionEnabled && settings.password) {
      jsonString = await encryptData(jsonString, settings.password);
    }
    
    return jsonString;
  }, [settings, generateChecksum, encryptData]);

  // Export to CSV
  const exportToCSV = useCallback(async (data: ExportData): Promise<string> => {
    const headers = ['Path', 'Name', 'Size', 'Type', 'Last Modified'];
    
    if (settings.includePermissions) headers.push('Permissions', 'Owner');
    if (settings.includeChecksums) headers.push('Checksum');
    
    let csv = headers.join(',') + '\n';
    
    for (const file of data.files) {
      const row = [
        `"${file.path}"`,
        `"${file.name}"`,
        file.size.toString(),
        `"${file.type}"`,
        new Date(file.lastModified).toISOString(),
      ];
      
      if (settings.includePermissions) {
        row.push(`"${file.permissions || ''}"`, `"${file.owner || ''}"`);
      }
      
      if (settings.includeChecksums && file.content) {
        const checksum = await generateChecksum(file.content);
        row.push(`"${checksum}"`);
      }
      
      csv += row.join(',') + '\n';
    }
    
    return csv;
  }, [settings, generateChecksum]);

  // Export to XML
  const exportToXML = useCallback(async (data: ExportData): Promise<string> => {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<export>\n';
    xml += '  <metadata>\n';
    
    Object.entries(data.metadata).forEach(([key, value]) => {
      xml += `    <${key}>${value}</${key}>\n`;
    });
    
    xml += '  </metadata>\n';
    xml += '  <files>\n';
    
    for (const file of data.files) {
      xml += '    <file>\n';
      xml += `      <path><![CDATA[${file.path}]]></path>\n`;
      xml += `      <name><![CDATA[${file.name}]]></name>\n`;
      xml += `      <size>${file.size}</size>\n`;
      xml += `      <type><![CDATA[${file.type}]]></type>\n`;
      xml += `      <lastModified>${new Date(file.lastModified).toISOString()}</lastModified>\n`;
      
      if (settings.includePermissions) {
        xml += `      <permissions><![CDATA[${file.permissions || ''}]]></permissions>\n`;
        xml += `      <owner><![CDATA[${file.owner || ''}]]></owner>\n`;
      }
      
      if (settings.includeContent && file.content) {
        const content = typeof file.content === 'string' 
          ? file.content 
          : btoa(String.fromCharCode(...new Uint8Array(file.content)));
        xml += `      <content><![CDATA[${content}]]></content>\n`;
      }
      
      if (settings.includeChecksums && file.content) {
        const checksum = await generateChecksum(file.content);
        xml += `      <checksum>${checksum}</checksum>\n`;
      }
      
      xml += '    </file>\n';
    }
    
    xml += '  </files>\n';
    xml += '</export>\n';
    
    return xml;
  }, [settings, generateChecksum]);

  // Export to YAML
  const exportToYAML = useCallback(async (data: ExportData): Promise<string> => {
    let yaml = 'export:\n';
    yaml += '  metadata:\n';
    
    Object.entries(data.metadata).forEach(([key, value]) => {
      yaml += `    ${key}: ${typeof value === 'string' ? `"${value}"` : value}\n`;
    });
    
    yaml += '  files:\n';
    
    for (const file of data.files) {
      yaml += '    - path: "' + file.path.replace(/"/g, '\\"') + '"\n';
      yaml += '      name: "' + file.name.replace(/"/g, '\\"') + '"\n';
      yaml += '      size: ' + file.size + '\n';
      yaml += '      type: "' + file.type + '"\n';
      yaml += '      lastModified: "' + new Date(file.lastModified).toISOString() + '"\n';
      
      if (settings.includePermissions) {
        yaml += '      permissions: "' + (file.permissions || '') + '"\n';
        yaml += '      owner: "' + (file.owner || '') + '"\n';
      }
      
      if (settings.includeChecksums && file.content) {
        const checksum = await generateChecksum(file.content);
        yaml += '      checksum: "' + checksum + '"\n';
      }
    }
    
    return yaml;
  }, [settings, generateChecksum]);

  // Create ZIP file
  const createZipFile = useCallback(async (data: ExportData): Promise<Blob> => {
    // This would require a ZIP library like JSZip
    // For now, return JSON as blob
    const jsonData = await exportToJSON(data);
    return new Blob([jsonData], { type: 'application/json' });
  }, [exportToJSON]);

  // Main export function
  const performExport = useCallback(async (): Promise<void> => {
    if (files.length === 0) {
      onExportError?.(new Error('No files to export'));
      return;
    }

    setIsExporting(true);
    setProgress(0);
    onExportStart?.(settings.format);

    try {
      // Prepare export data
      const exportData: ExportData = {
        files: files.map(file => ({
          ...file,
          content: settings.includeContent ? file.content : undefined,
        })),
        metadata: {
          exportDate: new Date().toISOString(),
          exportVersion: '1.0.0',
          totalFiles: files.length,
          totalSize: files.reduce((sum, file) => sum + file.size, 0),
          source: 'Terminal File Manager',
          includeHidden: true,
          includeSystem: false,
          compressionLevel: settings.compressionLevel,
        },
        settings,
      };

      let exportContent: string | Blob;
      let mimeType: string;
      let filename: string;

      // Update progress
      setProgress(25);
      onProgress?.(25);

      // Generate export based on format
      switch (settings.format) {
        case 'json':
          exportContent = await exportToJSON(exportData);
          mimeType = 'application/json';
          filename = 'file-manager-export.json';
          break;
        case 'csv':
          exportContent = await exportToCSV(exportData);
          mimeType = 'text/csv';
          filename = 'file-manager-export.csv';
          break;
        case 'xml':
          exportContent = await exportToXML(exportData);
          mimeType = 'application/xml';
          filename = 'file-manager-export.xml';
          break;
        case 'yaml':
          exportContent = await exportToYAML(exportData);
          mimeType = 'application/x-yaml';
          filename = 'file-manager-export.yaml';
          break;
        case 'zip':
          exportContent = await createZipFile(exportData);
          mimeType = 'application/zip';
          filename = 'file-manager-export.zip';
          break;
        default:
          throw new Error(`Unsupported format: ${settings.format}`);
      }

      setProgress(75);
      onProgress?.(75);

      // Create download blob
      const blob = typeof exportContent === 'string'
        ? new Blob([exportContent], { type: mimeType })
        : exportContent;

      // Create download URL
      const downloadUrl = URL.createObjectURL(blob);

      setProgress(100);
      onProgress?.(100);

      // Trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      onExportComplete?.(exportData, downloadUrl);

      // Cleanup
      setTimeout(() => {
        URL.revokeObjectURL(downloadUrl);
      }, 5000);

    } catch (error) {
      onExportError?.(error as Error);
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  }, [files, settings, onExportStart, onExportComplete, onExportError, onProgress, exportToJSON, exportToCSV, exportToXML, exportToYAML, createZipFile]);

  // Format options
  const formatOptions = useMemo(() => [
    { value: 'json', label: 'JSON', description: 'JavaScript Object Notation' },
    { value: 'csv', label: 'CSV', description: 'Comma Separated Values' },
    { value: 'xml', label: 'XML', description: 'eXtensible Markup Language' },
    { value: 'yaml', label: 'YAML', description: 'YAML Ain\'t Markup Language' },
    { value: 'zip', label: 'ZIP', description: 'Compressed Archive' },
    { value: 'tar', label: 'TAR', description: 'Tape Archive' },
  ].filter(option => allowedFormats.includes(option.value)), [allowedFormats]);

  return (
    <div className="export-utilities">
      <div className="export-header">
        <h3>Export File Manager Data</h3>
        <div className="file-summary">
          <span>{files.length} files</span>
          <span>{(files.reduce((sum, file) => sum + file.size, 0) / (1024 * 1024)).toFixed(2)} MB</span>
        </div>
      </div>

      <div className="export-settings">
        <div className="setting-group">
          <label htmlFor="format-select">Export Format</label>
          <select
            id="format-select"
            value={settings.format}
            onChange={(e) => setSettings(prev => ({ ...prev, format: e.target.value as any }))}
            disabled={isExporting}
          >
            {formatOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label} - {option.description}
              </option>
            ))}
          </select>
        </div>

        <div className="setting-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.includeContent}
              onChange={(e) => setSettings(prev => ({ ...prev, includeContent: e.target.checked }))}
              disabled={isExporting}
            />
            Include file content
          </label>
        </div>

        <div className="setting-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.includeMetadata}
              onChange={(e) => setSettings(prev => ({ ...prev, includeMetadata: e.target.checked }))}
              disabled={isExporting}
            />
            Include metadata
          </label>
        </div>

        <button
          className="advanced-toggle"
          onClick={() => setShowAdvanced(!showAdvanced)}
          disabled={isExporting}
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced Options
        </button>

        {showAdvanced && (
          <div className="advanced-settings">
            <div className="setting-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.includePermissions}
                  onChange={(e) => setSettings(prev => ({ ...prev, includePermissions: e.target.checked }))}
                  disabled={isExporting}
                />
                Include file permissions
              </label>
            </div>

            <div className="setting-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.includeChecksums}
                  onChange={(e) => setSettings(prev => ({ ...prev, includeChecksums: e.target.checked }))}
                  disabled={isExporting}
                />
                Generate checksums
              </label>
            </div>

            <div className="setting-group">
              <label htmlFor="compression-level">Compression Level (0-9)</label>
              <input
                id="compression-level"
                type="range"
                min="0"
                max="9"
                value={settings.compressionLevel}
                onChange={(e) => setSettings(prev => ({ ...prev, compressionLevel: parseInt(e.target.value) }))}
                disabled={isExporting}
              />
              <span className="range-value">{settings.compressionLevel}</span>
            </div>

            <div className="setting-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.encryptionEnabled}
                  onChange={(e) => setSettings(prev => ({ ...prev, encryptionEnabled: e.target.checked }))}
                  disabled={isExporting}
                />
                Enable encryption
              </label>
            </div>

            {settings.encryptionEnabled && (
              <div className="setting-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={settings.password || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, password: e.target.value }))}
                  disabled={isExporting}
                  placeholder="Enter encryption password"
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="export-summary">
        <div className="summary-item">
          <label>Estimated size:</label>
          <span>{(estimatedSize / (1024 * 1024)).toFixed(2)} MB</span>
        </div>
        <div className="summary-item">
          <label>Format:</label>
          <span>{settings.format.toUpperCase()}</span>
        </div>
        {settings.encryptionEnabled && (
          <div className="summary-item">
            <label>Encryption:</label>
            <span>AES-256-GCM</span>
          </div>
        )}
      </div>

      {isExporting && (
        <div className="export-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="progress-text">{progress}% Complete</div>
        </div>
      )}

      <div className="export-actions">
        <button
          className="export-btn"
          onClick={performExport}
          disabled={isExporting || files.length === 0}
        >
          {isExporting ? 'Exporting...' : 'Export Data'}
        </button>
      </div>
    </div>
  );
};

export default ExportUtilities;
