/* eslint-disable max-len */
import {setGlobalOptions} from "firebase-functions";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

setGlobalOptions({maxInstances: 10});
admin.initializeApp();

const APPROVAL_ADMIN_ALLOWLIST = ["admin@example.com"]; // TODO: replace with real admin emails.

const assertApprovalAdmin = (auth: any) => {
  if (!auth) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }

  const claims = auth.token || {};
  const requesterEmail = (auth.token.email as string) || "";
  const isAllowlisted = APPROVAL_ADMIN_ALLOWLIST.includes(requesterEmail.toLowerCase());
  if (claims["approval_admin"] === true || isAllowlisted) return;

  throw new HttpsError("permission-denied", "You are not authorized to approve registrations.");
};

export const setApprovalAdmin = onCall(async (request) => {
  assertApprovalAdmin(request.auth);
  const uid = request.data.uid as string;
  if (!uid) {
    throw new HttpsError("invalid-argument", "Missing uid.");
  }

  const user = await admin.auth().getUser(uid);
  const existingClaims = user.customClaims ?? {};
  await admin.auth().setCustomUserClaims(uid, {
    ...existingClaims,
    approval_admin: true,
  });

  return {success: true};
});

export const approveRegistration = onCall(async (request) => {
  assertApprovalAdmin(request.auth);

  const uid = request.data.uid as string;
  if (!uid) throw new HttpsError("invalid-argument", "Missing uid.");

  const pendingRef = admin.firestore().doc(`pendingRegistrations/${uid}`);
  const pendingSnap = await pendingRef.get();
  if (!pendingSnap.exists) {
    throw new HttpsError("not-found", "Pending registration not found.");
  }

  const pending = pendingSnap.data() as any;
  const role = pending.role || "parent";
  const payload = pending.payload || {};

  const userRecord = await admin.auth().getUser(uid);
  const existingClaims = userRecord.customClaims ?? {};

  await admin.auth().setCustomUserClaims(uid, {
    ...existingClaims,
    approved: true,
    role,
  });

  const usersRef = admin.firestore().doc(`users/${uid}`);
  await usersRef.set(
    {
      uid,
      email: pending.email ?? null,
      registrationPayload: payload,
      role,
      registrationCompleted: true,
      registrationCompletedAt: admin.firestore.FieldValue.serverTimestamp(),
      approved: true,
      approvedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    {merge: true}
  );

  await pendingRef.set(
    {
      status: "approved",
      approvedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    {merge: true}
  );

  return {success: true};
});

export const rejectRegistration = onCall(async (request) => {
  assertApprovalAdmin(request.auth);

  const uid = request.data.uid as string;
  const reason = (request.data.reason as string) || "";
  if (!uid) throw new HttpsError("invalid-argument", "Missing uid.");
  if (!reason) throw new HttpsError("invalid-argument", "Rejection reason is required.");

  const pendingRef = admin.firestore().doc(`pendingRegistrations/${uid}`);
  const pendingSnap = await pendingRef.get();
  if (!pendingSnap.exists) {
    throw new HttpsError("not-found", "Pending registration not found.");
  }

  await pendingRef.set(
    {
      status: "rejected",
      rejectionReason: reason,
      reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    {merge: true}
  );

  return {success: true};
});
