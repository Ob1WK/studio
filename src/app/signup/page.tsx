'use client';
import Link from "next/link"
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Logo } from "@/components/logo"
import { useAuth, useUser, initiateEmailSignUp, setDocumentNonBlocking, initiateGoogleSignIn } from "@/firebase";
import { doc } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningUp(true);
    try {
      const userCredential = await initiateEmailSignUp(auth, email, password);

      if (userCredential && userCredential.user) {
        const userRef = doc(firestore, "users", userCredential.user.uid);
        const userData = {
          id: userCredential.user.uid,
          email: userCredential.user.email,
          username: fullName,
          profilePictureUrl: '',
        };
        setDocumentNonBlocking(userRef, userData, { merge: true });
      }
    } catch (error: any) {
      console.error("Error signing up:", error);
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsSigningUp(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsSigningUp(true);
    try {
      const userCredential = await initiateGoogleSignIn(auth);
      if (userCredential && userCredential.user) {
        const userRef = doc(firestore, "users", userCredential.user.uid);
        const userData = {
          id: userCredential.user.uid,
          email: userCredential.user.email,
          username: userCredential.user.displayName || userCredential.user.email,
          profilePictureUrl: userCredential.user.photoURL || '',
        };
        setDocumentNonBlocking(userRef, userData, { merge: true });
      }
    } catch (error: any) {
      console.error("Error signing up with Google:", error);
      toast({
        variant: "destructive",
        title: "Google Sign Up Failed",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsSigningUp(false);
    }
  };

  if (isUserLoading || (!isUserLoading && user)) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader className="text-center">
            <Link href="/" className="inline-block mb-4">
                <Logo className="h-10 w-10 text-primary" />
            </Link>
            <CardTitle className="text-2xl font-headline">Create an Account</CardTitle>
            <CardDescription>
                Enter your information to get started with HolyHarmonies
            </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                  <Label htmlFor="full-name">Full name</Label>
                  <Input
                    id="full-name"
                    placeholder="John Doe"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={isSigningUp}
                  />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSigningUp}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isSigningUp}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSigningUp}>
                {isSigningUp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create an account
              </Button>
              <Button variant="outline" className="w-full" onClick={handleGoogleSignup} disabled={isSigningUp}>
                {isSigningUp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign up with Google
              </Button>
            </div>
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline">
              Log in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}