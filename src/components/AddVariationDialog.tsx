'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, GitBranchPlus } from "lucide-react";
import { useUser, useFirestore, setDocumentNonBlocking } from "@/firebase";
import { doc, collection } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { useToast } from "@/hooks/use-toast";
import type { Variation } from '@/lib/types';

interface AddVariationDialogProps {
  songId: string;
  onVariationAdded?: () => void;
}

export function AddVariationDialog({ songId, onVariationAdded }: AddVariationDialogProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [variationText, setVariationText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSubmitVariation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore || !variationText.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in and provide variation text.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const variationId = uuidv4();
      const variationRef = doc(collection(firestore, 'songs', songId, 'variations'), variationId);

      const newVariation: Variation = {
        id: variationId,
        songId: songId,
        userId: user.uid,
        variationText: variationText,
        submissionDate: new Date().toISOString(),
      };

      setDocumentNonBlocking(variationRef, newVariation, { merge: false });

      toast({
        title: "Variation Submitted!",
        description: "Your variation has been added.",
      });
      setVariationText('');
      setDialogOpen(false);
      onVariationAdded?.(); // Callback to refresh parent component if needed
    } catch (error) {
      console.error("Error submitting variation:", error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "There was a problem submitting your variation.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <GitBranchPlus className="mr-2 h-4 w-4" /> Add Variation
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmitVariation}>
          <DialogHeader>
            <DialogTitle>Submit a Variation</DialogTitle>
            <DialogDescription>
              Share your unique take on this song's chords and lyrics.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="variationText">Your Variation</Label>
              <Textarea
                id="variationText"
                rows={10}
                placeholder="Enter your chords and lyrics here..."
                value={variationText}
                onChange={(e) => setVariationText(e.target.value)}
                required
                className="font-code"
                disabled={isSubmitting}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !variationText.trim()}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Variation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}