import { prisma } from '../db';
import { emitNotificationCreated } from '../utils/events';

interface CreateNotificationParams {
  userId: string | null;
  title: string;
  message: string;
  type: string;
  actionUrl?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  const notification = await prisma.notification.create({
    data: {
      userId: params.userId,
      title: params.title,
      message: params.message,
      type: params.type,
      actionUrl: params.actionUrl || '',
    },
  });

  if (params.userId) {
    emitNotificationCreated({
      userId: params.userId,
      title: params.title,
      message: params.message,
      type: params.type,
      actionUrl: params.actionUrl || '',
    });
  }

  return notification;
}

export async function createGlobalNotification(params: Omit<CreateNotificationParams, 'userId'>) {
  return createNotification({ ...params, userId: null });
}