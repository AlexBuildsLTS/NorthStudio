/**
 * @file app/+html.tsx
 * @description Modifies the raw HTML for Web builds.
 * FIX: Injects the semver shim BEFORE React DevTools initializes.
 */

import { ScrollViewStyleReset } from 'expo-router/html';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />

        <ScrollViewStyleReset />

        {/* THE PRE-RENDER SEMVER SHIELD */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.process = { env: { REACT_NATIVE_VERSION: '0.76.0' } };`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
