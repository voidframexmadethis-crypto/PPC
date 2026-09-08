import React from 'react';
import { Upload } from 'lucide-react';

interface FileStepProps {
  onFilesSelected: (files: FileList) => void;
  isUploading: boolean;
  uploadedFiles: File[];
}

export const FileStep: React.FC<FileStepProps> = ({ onFilesSelected, isUploading, uploadedFiles }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-neutral-800 rounded-2xl bg-neutral-900/30 hover:bg-neutral-900/50 transition-colors">
      <Upload className="w-16 h-16 text-indigo-500 mb-4" />
      <h3 className="text-xl font-bold text-white mb-2">Drop Your Beat Files Here</h3>
      <p className="text-neutral-400 mb-6">Support for WAV, MP3, ZIP Stems, and Artwork</p>
      
      <label className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl cursor-pointer transition-all">
        BROWSE FILES
        <input 
          type="file" 
          multiple 
          className="hidden" 
          onChange={(e) => e.target.files && onFilesSelected(e.target.files)}
          disabled={isUploading}
        />
      </label>

      {uploadedFiles.length > 0 && (
        <div className="mt-8 w-full">
          <h4 className="text-sm font-semibold text-neutral-400 mb-4">Selected Files</h4>
          {uploadedFiles.map((file, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-neutral-950 rounded-lg mb-2">
              <span className="text-sm text-white truncate">{file.name}</span>
              <span className="text-xs text-neutral-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
