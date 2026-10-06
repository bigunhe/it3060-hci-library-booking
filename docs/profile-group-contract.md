# M4 profile and saved-group contract

This document overrides earlier references to SavedGroup.isDefault.

The shared models now use UserProfile.defaultGroupId instead.

## Student profile

Document: users/{Firebase Authentication UID}

Stored fields:

- name: non-empty string

- studentId: non-empty string

- role: student

- defaultGroupId: null initially

Do not store an id field. Attach the document ID when reading.

Use the Firebase email/password SDK for registration.

After successful account creation, write the student profile.

If profile creation fails, display a retry path for the signed-in user.

Do not leave the user stuck trying to register the same email again.

Existing test accounts may have no profile.

Prompt those users to complete their profile.

Staff role changes are made only by the leader in Firebase Console.

The app must never offer staff-role registration.

## Saved groups

Document: groups/{generated ID}

Stored fields:

- ownerId: current user's UID

- name: trimmed group name

- members: 3–8 GroupMember entries

- createdAt: serverTimestamp() when creating

Do not store id or isDefault.

Normalize student IDs with trim().toUpperCase().

Reject duplicates and empty names/IDs.

Include the owner in the roster.

List using:

where('ownerId', '==', currentUser.uid)

Do not query the entire collection and filter it afterward.

Security rules are not query filters.

## Default group

Set users/{uid}.defaultGroupId to the owned group's ID.

A group is default when its ID matches this profile field.

This is one document update, not updates to every group.

## Delete group

Use a Firestore transaction:

1. Read the group and current user's profile.

2. Verify ownership.

3. If defaultGroupId equals this group ID, update it to null.

4. Delete the group.

Perform all reads before writes.

Do not delete or modify bookings referencing the old roster.

## Member responsibility

Implement the groupOperations.ts exports in [function-contracts.md](http://function-contracts.md).

Build the login, registration, group list, edit and details interfaces.

Use the shared Firebase connection.

Coordinate dependencies and shared-file changes with the leader.

## Required verification

- Student profile creation and missing-profile retry

- Staff-role escalation rejected

- Valid group create/read/edit/delete

- Invalid sizes and duplicate IDs rejected

- Another user's access rejected

- Default selection and default-group deletion

- Existing booking roster unchanged after group edits