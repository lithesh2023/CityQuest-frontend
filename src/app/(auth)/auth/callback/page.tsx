import { Suspense } from "react";
import OAuthCallbackClient from "./OAuthCallbackClient";

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <OAuthCallbackClient />
    </Suspense>
  );
}

