'use client';

import Link from "next/link"
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
import { useAuth, useUser, initiateEmailSignIn, initiateGoogleSignIn, setDocumentNonBlocking, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    initiateEmailSignIn(auth, email, password);
  };

  const handleGoogleLogin = async () => {
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
      console.error("Error signing in with Google:", error);
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
              <CardTitle className="text-2xl font-headline">Log In to HolyHarmonies</CardTitle>
              <CardDescription>
              Enter your email below to login to your account
              </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="grid gap-4">
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
                  <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link
                      href="#"
                      className="ml-auto inline-block text-sm underline"
                  >
                      Forgot your password?
                  </Link>
                  </div>
                  <Input 
                    id="password" 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
              </div>
              <Button type="submit" className="w-full">
                  Login
              </Button>
              <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
                  Login with Google
              </Button>
              </div>
            </form>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="underline">
                  Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
    </div>
  )
}