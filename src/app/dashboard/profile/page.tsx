'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, useUser, useFirestore, updateDocumentNonBlocking } from "@/firebase";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function ProfilePage() {
    const { user } = useUser();
    const auth = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [username, setUsername] = useState('');
    const [profilePictureUrl, setProfilePictureUrl] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (user) {
            setUsername(user.displayName || '');
            setProfilePictureUrl(user.photoURL || '');
        }
    }, [user]);

    const handleLogout = () => {
        auth.signOut();
    }

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !firestore) return;

        setIsUpdating(true);
        try {
            // Update Firebase Auth profile
            await user.updateProfile({
                displayName: username,
                photoURL: profilePictureUrl,
            });

            // Update Firestore user document
            const userRef = doc(firestore, "users", user.uid);
            updateDocumentNonBlocking(userRef, {
                username: username,
                profilePictureUrl: profilePictureUrl,
            });

            toast({
                title: "Profile Updated",
                description: "Your profile information has been saved.",
            });
        } catch (error) {
            console.error("Error updating profile:", error);
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: "There was an error updating your profile.",
            });
        } finally {
            setIsUpdating(false);
        }
    };

    if (!user) {
        return <div>Loading...</div>
    }

    return (
        <div className="container mx-auto max-w-2xl">
            <h1 className="text-3xl font-headline font-bold mb-8">My Profile</h1>
            <Card>
                <CardHeader className="flex flex-col items-center text-center">
                    <Avatar className="w-24 h-24 mb-4">
                        <AvatarImage src={profilePictureUrl || undefined} alt={username || ""} data-ai-hint="person portrait" />
                        <AvatarFallback>{username?.substring(0,2) || user.email?.substring(0,2).toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <CardTitle className="font-headline text-2xl">{username || "User"}</CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input 
                                id="username" 
                                value={username} 
                                onChange={(e) => setUsername(e.target.value)} 
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="profilePictureUrl">Profile Picture URL</Label>
                            <Input 
                                id="profilePictureUrl" 
                                value={profilePictureUrl} 
                                onChange={(e) => setProfilePictureUrl(e.target.value)} 
                                placeholder="https://example.com/your-image.jpg"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" type="email" defaultValue={user.email || ""} disabled />
                        </div>
                        <div className="flex justify-between items-center pt-4">
                           <Button type="submit" disabled={isUpdating}>
                               {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                               Update Profile
                           </Button>
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