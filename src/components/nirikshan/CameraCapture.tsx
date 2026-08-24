import { useEffect, useRef, useState } from "react";
import { Camera, RefreshCw, ScanFace } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Face verification placeholder: opens the device camera and captures a still
 * frame. No biometric matching is performed yet — the capture acts as the
 * evidence that a live face was presented.
 */
export function CameraCapture({
  onCapture,
  label = "Capture face",
}: {
  onCapture: (dataUrl: string) => void;
  label?: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [live, setLive] = useState(false);
  const [shot, setShot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      streamRef.current = stream;
      setLive(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      });
    } catch {
      setError("Camera unavailable. Grant camera access to complete face verification.");
    }
  }

  function capture() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
    setShot(dataUrl);
    onCapture(dataUrl);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setLive(false);
  }

  return (
    <div className="space-y-3">
      <div className="bg-muted relative aspect-video overflow-hidden rounded-lg border">
        {shot ? (
          <img src={shot} alt="Captured face verification frame" className="size-full object-cover" />
        ) : live ? (
          <video ref={videoRef} playsInline muted className="size-full object-cover" />
        ) : (
          <div className="text-muted-foreground grid size-full place-items-center gap-2 text-center text-xs">
            <ScanFace className="mx-auto size-8 opacity-60" />
            <span>Face verification placeholder</span>
          </div>
        )}
      </div>
      {error ? <p className="text-destructive text-xs">{error}</p> : null}
      <div className="flex gap-2">
        {!live && !shot ? (
          <Button type="button" variant="secondary" size="sm" onClick={start}>
            <Camera className="size-4" /> Open camera
          </Button>
        ) : null}
        {live ? (
          <Button type="button" size="sm" onClick={capture}>
            <Camera className="size-4" /> {label}
          </Button>
        ) : null}
        {shot ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setShot(null);
              void start();
            }}
          >
            <RefreshCw className="size-4" /> Retake
          </Button>
        ) : null}
      </div>
    </div>
  );
}
