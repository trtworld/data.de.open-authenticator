"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Account } from "@/types"
import { AlertTriangle } from "lucide-react"

interface DeleteConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  account: Account | null
}

export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  account,
}: DeleteConfirmationDialogProps) {
  if (!account) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Hesabı Silmek İstediğinize Emin Misiniz?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3 pt-2">
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium text-foreground mb-1">
                {account.label}
              </p>
              {account.issuer && (
                <p className="text-sm text-muted-foreground">{account.issuer}</p>
              )}
            </div>
            <p className="text-destructive font-semibold">
              ⚠️ Bu işlem geri alınamaz!
            </p>
            <p>
              Bu hesabı sildiğinizde, TOTP kodlarını bir daha üretemeyeceksiniz.
              Devam etmek istediğinize emin misiniz?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>İptal</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Evet, Sil
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
