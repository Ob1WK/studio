import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { users } from "@/lib/data";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";

export default function ProfilePage() {
    const user = users[0];

    return (
        <div className="container mx-auto max-w-2xl">
            <h1 className="text-3xl font-headline font-bold mb-8">My Profile</h1>
            <Card>
                <CardHeader className="flex flex-col items-center text-center">
                    <Avatar className="w-24 h-24 mb-4">
                        <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="person portrait" />
                        <AvatarFallback>{user.name.substring(0,2)}</AvatarFallback>
                    </Avatar>
                    <CardTitle className="font-headline text-2xl">{user.name}</CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" defaultValue={user.name} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" type="email" defaultValue={user.email} />
                        </div>
                        <div className="flex justify-between items-center pt-4">
                           <Button type="submit">Update Profile</Button>
                           <Button variant="destructive" asChild>
                                <Link href="/">Log Out</Link>
                           </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
