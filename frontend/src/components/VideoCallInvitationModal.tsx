import React from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface VideoCallInvitationModalProps {
  isOpen: boolean;
  initiatorName: string;
  initiatorAvatar?: string;
  onAccept: () => void;
  onReject: () => void;
}

export default function VideoCallInvitationModal({
  isOpen,
  initiatorName,
  initiatorAvatar,
  onAccept,
  onReject,
}: VideoCallInvitationModalProps) {
  const { toast } = useToast();

  const handleAccept = () => {
    toast({
      title: 'Joining video call',
      description: `Joining ${initiatorName}'s video call...`,
    });
    onAccept();
  };

  const handleReject = () => {
    onReject();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && handleReject()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Video Call Invitation</AlertDialogTitle>
          <AlertDialogDescription className="text-base pt-2">
            <div className="flex items-center gap-3">
              {initiatorAvatar && (
                <img
                  src={initiatorAvatar}
                  alt={initiatorName}
                  className="w-12 h-12 rounded-full"
                />
              )}
              <div>
                <p className="font-semibold text-foreground">{initiatorName}</p>
                <p className="text-sm text-muted-foreground">
                  has started a video call
                </p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-3 justify-end">
          <AlertDialogCancel onClick={handleReject}>Decline</AlertDialogCancel>
          <AlertDialogAction onClick={handleAccept}>Join Call</AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
