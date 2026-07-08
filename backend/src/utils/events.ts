import { EventEmitter } from 'events';

interface AppEvents {
  'notification.created': {
    userId: string;
    title: string;
    message: string;
    type: string;
    actionUrl: string;
  };
}

const eventEmitter = new EventEmitter();

// Type-safe emit and on functions
export function emitNotificationCreated(payload: AppEvents['notification.created']): boolean {
  return eventEmitter.emit('notification.created', payload);
}

export function onNotificationCreated(listener: (payload: AppEvents['notification.created']) => void): EventEmitter {
  return eventEmitter.on('notification.created', listener);
}

export { eventEmitter };