/**
 * @file app/index.tsx
 * @description Root endpoint. Immediately routes traffic to the protected app workspace.
 */

import { Redirect } from 'expo-router';

export default function Index() {
  // Direct all initial traffic to the (app) group.
  // The (app)/_layout.tsx file will decide if they are allowed in.
  return <Redirect href="/(app)/dashboard" />;
}
