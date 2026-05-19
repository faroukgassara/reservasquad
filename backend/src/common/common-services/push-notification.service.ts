import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { BatchResponse, MulticastMessage } from 'firebase-admin/lib/messaging/messaging-api';
@Injectable()
export class PushNotificationService {
    private static firebaseApp: admin.app.App;
    constructor(
    ) {
    }
    async sendNotification(title: string, description: string, payload: { [key: string]: any }, tokens: string[], isSilent = false): Promise<BatchResponse | null> {
        try {
            if (tokens) {
                let objNotifation: MulticastMessage = {
                    tokens: tokens,
                    data: payload,
                }
                objNotifation = {
                    ...objNotifation,
                    android: {
                        notification: {
                            visibility: "public",
                        }
                    },
                }
                if (isSilent) {
                    objNotifation = {
                        ...objNotifation,
                        webpush: {
                            notification: { silent: true }
                        },
                        apns: {
                            payload: {
                                aps: {
                                    'content-available': 1, // Silent push for iOS
                                },
                            },
                        },
                    }
                } else {
                    objNotifation = {
                        ...objNotifation,
                        notification: {
                            title,
                            body: description,
                        },
                        webpush: payload?.link ? { fcmOptions: { link: payload?.link } } : undefined
                    }
                }
                const res = await PushNotificationService.firebaseApp.messaging().sendEachForMulticast(objNotifation)
                return res
            }

        } catch (error) {
            return null
        }
    }
}