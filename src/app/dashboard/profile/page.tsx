'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, useUser } from "@/firebase";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function ProfilePage() {
    const { user } = useUser();
    const auth = useAuth();

    const handleLogout = () => {
        auth.signOut();
    }

    if (!user) {
        return <div>Loading...</div>
    }

    return (
        <div className="container mx-auto max-w-2xl">
            <h1 className="text-3xl font-headline font-bold mb-8">My Profile</h1>
            <Card>
                <CardHeader className="flex flex-col items-center text-center">
                    <Avatar className="w-24 h-24 mb-4">
                        <AvatarImage src={user.photoURL || undefined} alt={user.displayName || ""} data-ai-hint="person portrait" />
                        <AvatarFallback>{user.displayName?.substring(0,2) || user.email?.substring(0,2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <CardTitle className="font-headline text-2xl">{user.displayName || "User"}</CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" defaultValue={user.displayName || ""} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" type="email" defaultValue={user.email || ""} disabled />
                        </div>
                        <div className="flex justify-between items-center pt-4">
                           <Button type="submit">Update Profile</Button>
                           <Button variant="destructive" onClick={handleLogout}>
                                Log Out
                           </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
