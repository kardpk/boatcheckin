import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";
import { AUTH_ERRORS } from "./error-messages";

export const metadata: Metadata = {
  title: "Sign in — BoatCheckin",
};

export default async function LoginPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const errorCode =
    typeof searchParams.error === "string" ? searchParams.error : undefined;
  const errorMessage = errorCode ? AUTH_ERRORS[errorCode] : undefined;

  return (
    <>
      {errorMessage && (
        <div className="alert alert--err" style={{ marginBottom: 'var(--s-5)' }}>
          <span>{errorMessage}</span>
        </div>
      )}
      <LoginForm />
    </>
  );
}
