/**
 * Kisekka Online — Firebase Cloud Functions
 *
 * iotecWebhook:
 *   Receives POST callbacks from ioTec Pay after a mobile money transaction
 *   completes or fails. Updates the announcement_payments document and the
 *   linked post document accordingly.
 *
 * Deployment:
 *   firebase deploy --only functions
 *
 * Webhook URL:
 *   https://<region>-<project>.cloudfunctions.net/iotecWebhook
 *   Register this in the ioTec Pay portal under:
 *   Wallet Details > Settings > Callback URLs
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();
const EXPO_PUSH_API = 'https://exp.host/--/expoapi/v2/push/send';

// ── iotecWebhook ──────────────────────────────────────────────────────────────

export const iotecWebhook = functions.https.onRequest(async (req, res) => {
  // 1. Accept POST only
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  // 2. Respond 200 immediately — ioTec expects a fast response.
  //    All Firestore work happens asynchronously after this point.
  res.sendStatus(200);

  try {
    // 3. Parse payload — ioTec sends { transaction: { externalId, status, ... } }
    //    or flat { externalId, status, ... } depending on the endpoint version.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = req.body as Record<string, any>;
    const transaction = body.transaction ?? body;

    const externalId: string | undefined = transaction.externalId;
    const iotecStatus: string | undefined = transaction.status;

    if (!externalId || !iotecStatus) {
      functions.logger.warn('[iotecWebhook] Missing externalId or status', body);
      return;
    }

    functions.logger.info('[iotecWebhook] Received', { externalId, status: iotecStatus });

    // 4. Find the payment document by iotecExternalId
    const paymentSnap = await db
      .collection('announcement_payments')
      .where('iotecExternalId', '==', externalId)
      .limit(1)
      .get();

    if (paymentSnap.empty) {
      functions.logger.warn('[iotecWebhook] No payment found for externalId', externalId);
      return;
    }

    const paymentDoc  = paymentSnap.docs[0];
    const paymentData = paymentDoc.data();
    const postId: string = paymentData.postId;
    const payerId: string = paymentData.payerId;

    // 5. Handle Success
    if (iotecStatus === 'Success') {
      await Promise.all([
        paymentDoc.ref.update({
          status: 'confirmed',
          confirmedAt: admin.firestore.FieldValue.serverTimestamp(),
        }),
        db.doc(`posts/${postId}`).update({ status: 'active' }),
      ]);

      // Notify the payer via Expo Push API
      const payerSnap = await db.doc(`users/${payerId}`).get();
      const pushToken: string | undefined = payerSnap.data()?.expoPushToken;

      if (pushToken) {
        await fetch(EXPO_PUSH_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: pushToken,
            title: 'Kisekka Online',
            body: 'Your announcement is now live! 🎉',
            data: { type: 'payment', postId },
          }),
        });
      }

      functions.logger.info('[iotecWebhook] Payment confirmed, post activated', { postId });
    }

    // 6. Handle Failed
    else if (iotecStatus === 'Failed') {
      await Promise.all([
        paymentDoc.ref.update({ status: 'failed' }),
        db.doc(`posts/${postId}`).update({ status: 'draft' }),
      ]);

      functions.logger.info('[iotecWebhook] Payment failed, post set to draft', { postId });
    } else {
      functions.logger.info('[iotecWebhook] Unhandled status, ignoring', { iotecStatus });
    }
  } catch (err) {
    // Log but do not re-throw — response already sent as 200
    functions.logger.error('[iotecWebhook] Processing error', err);
  }
});
