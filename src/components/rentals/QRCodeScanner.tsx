
"use client";

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Camera, AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react';
import jsQR from 'jsqr';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface QRCodeScannerProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onScan: (result: string) => void;
  totalItems?: number;
  scannedCount?: number;
}

export function QRCodeScanner({ isOpen, onOpenChange, onScan, totalItems = 0, scannedCount = 0 }: QRCodeScannerProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [lastScannedItem, setLastScannedItem] = useState<string | null>(null);
  const [scanIndicator, setScanIndicator] = useState(false);
  const warmupStartRef = useRef<number | null>(null);
  const lastDataRef = useRef<string | null>(null);
  const stableCountRef = useRef<number>(0);
  const lastAcceptedDataRef = useRef<string | null>(null);
  const lastAcceptTsRef = useRef<number>(0);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animationFrameId: number;

    const getCameraPermission = async () => {
      if (!isOpen) return;

      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          // reset detection stability state each time modal opens
          warmupStartRef.current = performance.now();
          lastDataRef.current = null;
          stableCountRef.current = 0;
          lastAcceptedDataRef.current = null;
          lastAcceptTsRef.current = 0;
          tick(); // Start scanning
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        setScanError('Camera access denied. Please enable camera permissions in your browser settings.');
      }
    };
    
    const isLikelyEquipmentUrl = (value: string) => {
        try {
            const url = new URL(value);
            // Only accept URLs from the same origin and with expected path pattern
            if (typeof window !== 'undefined') {
                if (url.origin !== window.location.origin) return false;
            }
            const segments = url.pathname.split('/').filter(Boolean);
            // Expect: /equipment/{id}/edit
            if (segments.length !== 3) return false;
            if (segments[0] !== 'equipment') return false;
            if (segments[2] !== 'edit') return false;
            return true;
        } catch {
            return false;
        }
    };

    const tick = () => {
        if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            const canvas = document.createElement('canvas');
            const video = videoRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if(ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert",
                });
                // Apply warm-up and stability validation to avoid false positives
                const now = performance.now();
                const warmedUp = warmupStartRef.current !== null && (now - warmupStartRef.current) > 800; // ~0.8s warm-up

                if (code && warmedUp && isLikelyEquipmentUrl(code.data)) {
                    if (lastDataRef.current === code.data) {
                        stableCountRef.current += 1;
                    } else {
                        lastDataRef.current = code.data;
                        stableCountRef.current = 1;
                    }

                    // Require the same content in a few consecutive frames to confirm
                    if (stableCountRef.current >= 3) {
                        const acceptCooldownMs = 600; // Reduced from 1200 for faster continuous scanning
                        const elapsedSinceAccept = now - lastAcceptTsRef.current;
                        const isNewData = lastAcceptedDataRef.current !== code.data;
                        const cooldownPassed = elapsedSinceAccept > acceptCooldownMs;
                        if (isNewData || cooldownPassed) {
                            onScan(code.data);
                            lastAcceptedDataRef.current = code.data;
                            lastAcceptTsRef.current = now;
                            setLastScannedItem(code.data);
                            setScanIndicator(true);
                            setTimeout(() => setScanIndicator(false), 500);
                        }
                        // reset frame stability so we don't immediately trigger again
                        lastDataRef.current = null;
                        stableCountRef.current = 0;
                    }
                } else if (!code) {
                    // reset stability if nothing detected in this frame
                    lastDataRef.current = null;
                    stableCountRef.current = 0;
                }
            }
        }
        animationFrameId = requestAnimationFrame(tick);
    }

    if (isOpen) {
      getCameraPermission();
    }

    return () => {
      // Cleanup
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen, onScan, onOpenChange]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Scan Equipment QR Code</DialogTitle>
          <DialogDescription>
            Keep your camera pointed at the equipment QR codes. Each scan will be counted automatically.
            {totalItems > 0 && <span className="block mt-2 font-semibold">Progress: {scannedCount} / {totalItems} items</span>}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          {totalItems > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium">Scanning Progress</span>
                <span className="text-muted-foreground">{scannedCount}/{totalItems}</span>
              </div>
              <Progress value={(scannedCount / totalItems) * 100} className="h-2" />
            </div>
          )}
          
          <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center border-2 border-border">
            <video ref={videoRef} className="w-full h-full object-cover" muted autoPlay playsInline />
            
            {/* Scanning indicator overlay */}
            {hasCameraPermission === true && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                {/* QR frame guide */}
                <div className="relative w-48 h-48 border-2 border-green-500/50 rounded-lg shadow-lg">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-green-500"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-green-500"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-green-500"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-green-500"></div>
                </div>
                
                {/* Scan success indicator */}
                {scanIndicator && (
                  <div className="absolute flex flex-col items-center gap-2 animate-pulse">
                    <CheckCircle2 className="h-12 w-12 text-green-500" />
                    <span className="text-sm font-semibold text-green-600 bg-white/90 px-3 py-1 rounded-full">
                      Item Scanned!
                    </span>
                  </div>
                )}
              </div>
            )}
            
            {hasCameraPermission === false && (
               <Alert variant="destructive" className="absolute inset-4">
                 <AlertTriangle className="h-4 w-4" />
                 <AlertTitle>Camera Access Required</AlertTitle>
                 <AlertDescription>
                    {scanError || "Please allow camera access to use this feature."}
                 </AlertDescription>
               </Alert>
            )}
            
             {hasCameraPermission === null && (
                 <div className="text-center text-muted-foreground space-y-2">
                    <Camera className="h-10 w-10 mx-auto mb-2 animate-pulse" />
                    <p>Requesting camera permission...</p>
                 </div>
             )}
          </div>

          {lastScannedItem && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm">
              <p className="text-green-800">
                <strong>Last Scan:</strong> Equipment recognized ✓
              </p>
            </div>
          )}
          
          <div className="flex justify-between gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setLastScannedItem(null);
              }}
              className="flex-1"
            >
              <RotateCcw className="mr-2 h-4 w-4" /> Reset
            </Button>
            <Button 
              variant="default" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Done Scanning
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
