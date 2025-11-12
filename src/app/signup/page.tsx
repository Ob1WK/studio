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

export default function SignupPage() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
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
    } catch (error) {
      console.error("Error signing up:", error);
    }
  };

  const handleGoogleSignup = async () => {
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
    } catch (error) {
      console.error("Error signing up with Google:", error);
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
                />
              </div>
              <Button type="submit" className="w-full">
                Create an account
              </Button>
              <Button variant="outline" className="w-full" onClick={handleGoogleSignup}>
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