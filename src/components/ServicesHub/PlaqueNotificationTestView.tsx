import React from 'react';
import { Trophy } from 'lucide-react';
import { PlaqueNotificationService } from '../../lib/notificationSystem';

export const PlaqueNotificationTestView = () => {
  const testService = new PlaqueNotificationService({
    sendEmail: async (to, subject, body) => {
      console.log(`[TestEmailProvider] Sending to ${to}: ${subject}\n${body}`);
      alert('Notification simulated (check console)');
    }
  });

  const triggerTest = async () => {
    await testService.notifyPlaqueEarned({
      recipient: 'user@example.com',
      plaquename: 'Platinum Sales Milestone'
    });
  };

  return (
    <div className="text-white space-y-4">
      <div className="flex items-center gap-3">
        <Trophy className="w-8 h-8 text-yellow-500" />
        <h2 className="text-xl font-bold">Plaque Notifications Test</h2>
      </div>
      <p className="text-neutral-400">Trigger a simulated plaque notification email.</p>
      <button 
        onClick={triggerTest}
        className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg font-medium transition-colors"
      >
        Trigger Test Notification
      </button>
    </div>
  );
};
