import React, { useState } from 'react';

export const StemsHubView = () => {
  const [files, setFiles] = useState<File[]>([]);
  return (
    <div className="text-white space-y-4">
      <h2 className="text-xl font-bold">Engineering Stems Hub</h2>
      <div className="border-2 border-dashed border-neutral-700 p-8 rounded-lg text-center cursor-pointer hover:border-indigo-500">
        <input type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} className="hidden" id="stem-upload" />
        <label htmlFor="stem-upload">Drag & Drop or Click to upload stems</label>
      </div>
      <div>{files.length} files selected</div>
    </div>
  );
};
