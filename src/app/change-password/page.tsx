import { Suspense } from "react";
import ChangePasswordForm from "./form";

export default function ChangePasswordPage() {
  return (
    <Suspense>
      <ChangePasswordForm />
    </Suspense>
  );
}
