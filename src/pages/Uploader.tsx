import React from 'react';
import { Navigate } from 'react-router-dom';
import BeatUploader from '../components/BeatUploader';

export default function Uploader() {
  const isAdmin = localStorage.getItem('KRYPSIDE_ADMIN_AUTH') === 'true';
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-black">
      <BeatUploader />
    </div>
  );
}

