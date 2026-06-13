import * as admin from 'firebase-admin';
import { prisma } from '../db';
import { logger } from '../utils/logger';

let isFcmInitialized = false;

export function initFcm() {
  const fcmServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (fcmServiceAccount) {
    try {
      const serviceAccount = JSON.parse(fcmServiceAccount);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      isFcmInitialized = true;
      logger.info('[FCM] Firebase Admin SDK initialized successfully');
    } catch (e) {
      logger.error('[FCM] Failed to initialize Firebase Admin SDK:', e);
    }
  } else {
    logger.info('[FCM] FIREBASE_SERVICE_ACCOUNT not configured, running with mock push notifications');
  }
}

export async function sendPushNotification(userId: string, title: string, body: string, data?: any) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true }
    });

    if (!user || !user.fcmToken) {
      logger.info(`[FCM Mock] No token registered for user ${userId}. Logging message: "${title}" - "${body}"`);
      return;
    }

    if (isFcmInitialized) {
      const message: admin.messaging.Message = {
        token: user.fcmToken,
        notification: { title, body },
        data: data ? Object.entries(data).reduce((acc, [k, v]) => {
          acc[k] = String(v);
          return acc;
        }, {} as Record<string, string>) : undefined,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        }
      };

      const response = await admin.messaging().send(message);
      logger.info(`[FCM] Successfully sent push notification to user ${userId}: ${response}`);
    } else {
      logger.info(`[FCM Mock] Sent push to user ${userId} (Token: ${user.fcmToken}): "${title}" - "${body}"`);
    }
  } catch (error) {
    logger.error(`[FCM] Error sending push notification to user ${userId}:`, error);
  }
}
