import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div style={{
      height: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "var(--background)",
    }}>
      <SignIn />
    </div>
  );
}