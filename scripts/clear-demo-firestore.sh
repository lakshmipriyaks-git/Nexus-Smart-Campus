#!/usr/bin/env bash
set -euo pipefail

echo "This script removes the demo Firestore collections used by the app."
echo "It requires Firebase CLI authentication for the project: student-teacher-hub"

echo "Step 1: Sign in to Firebase"
firebase login

echo "Step 2: Select the project"
firebase use student-teacher-hub

collections=(
  "buses"
  "libraryBooks"
  "libraryBorrowings"
  "canteenMenu"
  "canteenOrders"
  "printJobs"
  "events"
  "eventRegistrations"
  "complaints"
)

for collection in "${collections[@]}"; do
  echo "Deleting Firestore collection: ${collection}"
  firebase firestore:delete --recursive --yes "/${collection}"
  echo "Completed: ${collection}"
done

echo "Demo Firestore data cleanup completed."
